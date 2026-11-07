#!/usr/bin/env node
// Tests for rollhandlers/npcBuilder.js: stat-block text parsing, matching book
// item names to this ruleset's items, inventory construction, and random NPC
// generation. Item names come from fixtures/items-index.json (a dump of the
// Cyberpunk RED basic data items).
//
// Run with: node tests/test-npc-builder.js

const { createSandbox, seededRng, constant } = require("./sandbox");
const { assert, assertIncludes, section, summary } = require("./test-helpers");

const ctx = createSandbox();
const index = ctx.npcbBuildIndex(require("./fixtures/items-index.json"));
const records = {};
require("./fixtures/item-records.json").forEach((r) => {
  records[r.name] = r;
});
const NL = String.fromCharCode(10);

function resolve(gearText, weaponsText = "", armor = "") {
  return ctx.npcbResolveSpec({ armor, weaponsText, gearText }, index);
}
function names(resolved) {
  return resolved.lines.filter((l) => !l.descriptor).map((l) => l.itemName);
}
function line(resolved, itemName) {
  return resolved.lines.find((l) => l.itemName === itemName);
}

// ── Skill text ───────────────────────────────────────────────────────────────
section("npcbParseSkillText");
{
  const p = ctx.npcbParseSkillText(
    "Drive Land" + NL + "Vehicle 9, Athletics11, Evasion 12 (10), Melee Weapons 8, Resist Torture/Drug 6, Language (Streetslang) 4, Martial Arts (Aikido) 9, Electronics/ Security Tech 7"
  );
  const by = (n) => p.skills.find((s) => s.name === n);
  assert("name wrapped across a line break is re-joined", by("Drive Land Vehicle")?.base, 9);
  assert("missing space before the number", by("Athletics")?.base, 11);
  assert("10 (8) keeps the unpenalized base", by("Evasion")?.base, 12);
  assert("Melee Weapons -> Melee Weapon", by("Melee Weapon")?.stat, "dex");
  assert("Resist Torture/Drug -> Resist Torture/Drugs", !!by("Resist Torture/Drugs"), true);
  assert("subskill keeps parent stat", by("Martial Arts (Aikido)")?.stat, "dex");
  assert("spaces around slash removed", !!by("Electronics/Security Tech"), true);
  assert("no problems", p.problems, []);
}
{
  const p = ctx.npcbParseSkillText("Language (Native) 5" + NL + "Tactics 7 (5), Stealth 6");
  assert(
    "line break right after a number splits the skills",
    p.skills.map((s) => `${s.name} ${s.base}/${s.penalizedBase}`),
    ["Language (Native) 5/null", "Tactics 7/5", "Stealth 6/null"]
  );
}
{
  const p = ctx.npcbParseSkillText("Combat Awareness 5, Handgun 13, Bogus Skill 4");
  assert("role ability pulled out of the skill line", p.roles.map((r) => `${r.role} ${r.rank}`), ["solo 5"]);
  assert("unknown skill kept, flagged, rolls off INT", p.skills.find((s) => s.name === "Bogus Skill")?.known, false);
  const roles = ctx.npcbParseRoleAbilities("Moto 3, Maker 2 (Upgrade Expertise 2)");
  assert("role abilities field", roles.roles.map((r) => `${r.role} ${r.rank}`), ["nomad 3", "tech 2"]);
}
{
  const skills = ctx.npcbBuildSkills(
    ctx.npcbParseSkillText("Handgun 12, Conversation 2, Perception 9").skills,
    { ref: 6, emp: 4, int: 3 }
  );
  assert("level = base - STAT", skills[0].data, { base: 12, lvl: 6, stat: "ref" });
  assert("level never below 0", skills[1].data.lvl, 0);
}

// ── Gear text ────────────────────────────────────────────────────────────────
section("Ammo naming");
{
  const r = resolve(
    "Rifle Ammo x40, Heavy Pistol Ammo x20, Slug Ammo x8, Shotgun Shells x6, Arrow Ammo x12, AP Grenade x2, Teargas Grenade x1, Armor Piercing VH Pistol Ammo x10, Rifle x30"
  );
  assert("ammo item names", names(r), [
    "Basic Rifle",
    "Basic H Pistol",
    "Basic Slug",
    "Basic Shell",
    "Basic Arrow",
    "Armor-Piercing Grenade",
    "Teargas Grenade",
    "Armor-Piercing VH Pistol",
    "Basic Rifle",
  ]);
  assert("xN on ammo is the round count", line(r, "Basic H Pistol").count, 20);
}
{
  const r = resolve("Pistol Ammo x30, Armor Piercing Ammo x6", "Heavy SMG, Sniper Rifle");
  assert("generic pistol ammo follows the NPC's pistol-class weapon", names(r).includes("Basic H Pistol"), true);
  assert("classless ammo follows the first gun", names(r).includes("Armor-Piercing H Pistol"), true);
}
{
  const r = resolve("Flamethrower Fuel (Incendiary Shotgun Shells) x4, Flamethrower Ammo x8, Incendiary Rocket x1");
  assert("flamethrower ammo", names(r).slice(0, 2), ["Incendiary Flamethrower Shell", "Incendiary Flamethrower Shell"]);
  assert("ammo variant with no item is built from a base round", line(r, "Incendiary Rocket")?.synth, {
    base: "Armor-Piercing Rocket",
    donor: "Incendiary Grenade",
  });
  const shell = line(resolve("Armor Piercing Shotgun Shells x8"), "Armor-Piercing Shell");
  assert("shotgun variants borrow from shotgun ammo", shell?.synth, { base: "Basic Shell", donor: "Armor-Piercing Slug" });
  assert("an ammo class with no base stays a placeholder", resolve("Basic Rocket x1").lines[0].placeholder, true);
  const typo = resolve("Smok Grenade x1, Frag Grenade x1").lines;
  assert("misspelled variant gets the closest real round, flagged", [typo[0].itemName, typo[0].how], ["Smoke Grenade", "fuzzy"]);
  assert("unknown variant is never swapped for the default round", [typo[1].itemName, typo[1].placeholder], ["Frag Grenade", true]);
}

section("Cyberware");
{
  const r = resolve("Cybereye x2 (Chyron x2), Cyberaudio Suite w/ Level Dampeners & Radio Scanner/Music Player, Cyberleg x2 w/ Jump Boosters x2");
  const sides = r.lines.map((l) => `${l.itemName}|${l.side}`);
  assertIncludes("x2 cybereye adds a left one", sides, "Cybereye, Left|left");
  assertIncludes("x2 cybereye adds a right one", sides, "Cybereye, Right|right");
  assertIncludes("x2 option split across sides (left)", sides, "Chyron|left");
  assertIncludes("x2 option split across sides (right)", sides, "Chyron|right");
  assertIncludes("misspelled option fuzzy/alias matched", names(r), "Level Damper");
  assertIncludes("option of a foundational resolves to cyberware", names(r), "Radio Scanner/Music Player");
  assertIncludes("plural option resolved", sides, "Jump Booster|left");
}
{
  const r = resolve("Cybereye w/ Low-Light/IR/UV, Teleoptics, Neural Link, Kerenzikov Speedware, Lowlight/Infrared/UV");
  const sides = r.lines.map((l) => `${l.itemName}|${l.side}`);
  assertIncludes("single cybereye goes on the right", sides, "Cybereye, Right|right");
  assertIncludes("loose cyberoptic joins the last cybereye", sides, "TeleOptics|right");
  assertIncludes("speedware suffix ignored", names(r), "Kerenzikov");
  assert("low light spellings", r.lines.filter((l) => l.itemName === "Low Light/Infrared/UV").length, 2);
}

section("Gear names and contexts");
{
  const r = resolve(
    "Radio Communicator, Homing Tracers, Memory Chip x3, Disposable Cellphone, Techhair, Tent and Camping Equipment, Rope, Bulletproof Shield (10 HP) Binoculars, Grafted Muscle &amp; Bone Lace"
  );
  assert("standalone gear prefers the (Gear) / gear item", names(r).slice(0, 3), [
    "Radio Communicator (Gear)",
    "Homing Tracer (Gear)",
    "Memory Chips",
  ]);
  assertIncludes("spacing difference", names(r), "Disposable Cell Phone");
  assertIncludes("& vs and", names(r), "Tent & Camping Equipment");
  assertIncludes("item with a parenthetical in its name", names(r), "Rope (60m/yds)");
  assertIncludes("missing comma after a parenthetical", names(r), "Binoculars");
  assert("descriptive parenthetical kept as a note", r.lines.some((l) => l.descriptor === "10 HP"), true);
  assertIncludes("&amp; from pasted HTML", names(r), "Grafted Muscle and Bone Lace");
}
{
  const r = resolve("Agent, Cyberdeck" + NL + "Programs: Armor x2, Sword, Worm");
  assertIncludes("bare Cyberdeck -> standard deck", names(r), "Cyberdeck (Standard Quality)");
  assert("Programs: switches to program context", line(r, "Armor")?.count, 2);
  assert("program not mistaken for armor", r.lines.some((l) => /\(body\)/.test(l.itemName)), false);
}
{
  const r = resolve("Popup Ice Cannon, Cyberarm (Popup Ice Cannon)");
  assert("unknown standalone gear is a placeholder", r.lines[0].placeholder, true);
  assert("unknown option of a foundational is a cyberware placeholder", r.lines[2].placeholderType, "cyberware");
}

section("Popup cyberweapons");
{
  const r = resolve("Cyberarm x2 (Popup Heavy SMG, Popup Grenade Launcher), Popup Machete", "Popup Heavy SMG");
  const smg = r.lines.filter((l) => l.itemName === "Popup Heavy SMG");
  assert("popup gun with no item is built once (gear + weapons line)", smg.length, 1);
  assert("built from the ranged template with the gun", smg[0].popup, {
    template: "Popup Ranged Weapon (Template)",
    weapon: "Heavy SMG",
  });
  assert("popup in a cyberarm gets a side", smg[0].side, "right");
  assert("existing popup items still match normally", line(r, "Popup Grenade Launcher")?.popup, undefined);
  assert("melee popups use the melee template", line(r, "Popup Machete")?.popup?.template, "Popup Melee Weapon (Template)");
}

section("Armor names");
{
  const armor = (text) => resolve(text).lines.map((l) => l.itemName);
  assert("Leather Armor", armor("Leather Armor"), ["Leathers (body)", "Leathers (head)"]);
  assert("M Armorjack", armor("M Armorjack"), ["Medium Armorjack (body)", "Medium Armorjack (head)"]);
  assert("Metal Gear", armor("Metal Gear"), ["Metalgear® (body)", "Metalgear® (head)"]);
  assert("Kevlar Body Armor", armor("Kevlar Body Armor"), ["Kevlar® (body)", "Kevlar® (head)"]);
  assert("one location", armor("Kevlar (Head)"), ["Kevlar® (head)"]);
  assert("Subdermal", armor("Subdermal"), ["Subdermal Armor"]);
}

section("Weapons and armor");
{
  const r = resolve("Wolvers", "Poor Quality VH Pistol, Excellent Quality Heavy Melee Weapon, Wolvers, Underbarrel Shotgun, Martial Arts Strike, Assault Rifle w/ Drum Magazine", "Kevlar®");
  const n = names(r);
  assert("armor adds body and head", n.slice(0, 2), ["Kevlar® (body)", "Kevlar® (head)"]);
  assertIncludes("poor quality weapon", n, "Very Heavy Pistol, Poor Quality");
  assertIncludes("excellent quality weapon", n, "Heavy Melee Weapon, Excellent Quality");
  assert("cyberweapon listed in both lines added once", n.filter((x) => x === "Wolvers").length, 1);
  assertIncludes("word order", n, "Shotgun Underbarrel");
  assert("martial arts strike is not an item", n.some((x) => /martial/i.test(x)), false);
  assertIncludes("attachment matched to its weapon", n, "Drum Magazine (Assault Rifle)");
}
{
  const r = resolve("", "Excellent Quality Flamethrower");
  assert("missing quality variant falls back to the base weapon", line(r, "Flamethrower")?.how, "fuzzy");
}

section("npcbBuildInventory");
{
  const r = resolve("VH Pistol Ammo x30, Rippers", "Poor Quality VH Pistol, Rippers", "Leathers");
  const inv = ctx.npcbBuildInventory(r, records);
  const pistol = inv.find((i) => i.name === "Very Heavy Pistol, Poor Quality");
  const ammo = inv.find((i) => i.name === "Basic VH Pistol");
  assert("weapon loaded to its magazine", pistol.data.ammoCount, 8);
  assert("rest of the rounds stay in inventory", ammo.data.count, 22);
  assert("loaded ammo points at the inventory entry", JSON.parse(pistol.data.ammo)._id, ammo._id);
  assert("weapons and armor are equipped", [pistol.data.carried, inv[0].data.carried], ["equipped", "equipped"]);
  assert("fromId links the source item", ammo.data.fromId, records["Basic VH Pistol"]._id);
  assert("cyberware is active", inv.find((i) => i.name === "Rippers").data.active, true);
}
{
  const inv = ctx.npcbBuildInventory(resolve("Slug Ammo x2, Mystery Box x2", "Shotgun"), records);
  const shotgun = inv.find((i) => i.name === "Shotgun");
  assert("short supply loads what there is", [shotgun.data.ammoCount, inv.find((i) => i.name === "Basic Slug").data.count], [2, 0]);
  const box = inv.find((i) => i.name === "Mystery Box");
  assert("placeholder item", [box.data.type, box.data.count, box.recordType], ["gear", 2, "items"]);
}

// ── Generation ───────────────────────────────────────────────────────────────
section("One equipment box");
{
  const split = (text) => ctx.npcbSplitEquipment(text, index);
  const all = (text) => {
    const r = ctx.npcbResolveSpec(split(text), index);
    return r.lines.filter((l) => !l.descriptor);
  };
  const pasted =
    "Excellent Quality Flamethrower, Poor Quality Rocket Launcher, Flamethrower Ammo x16, Incendiary Rocket x1 (incendiary ammunition for a Rocket" +
    NL +
    "Launcher), Flashbang Grenade x1, Synthcoke x4, Cyberaudio Suite w/ Level" +
    NL +
    "Dampners, Cybereye x2 w/ Anti-Dazzle, Artificial Shoulder Mount, Cyberarm x2";
  const lines = all(pasted);
  assert("everything in one box matches", lines.filter((l) => l.placeholder).map((l) => l.itemName), []);
  assertIncludes("grenade found", lines.map((l) => l.itemName), "Flashbang Grenade");
  assertIncludes("wrapped name re-joined", lines.map((l) => l.itemName), "Level Damper");
  assert("weapons sorted out", split(pasted).weaponsText, "Excellent Quality Flamethrower, Poor Quality Rocket Launcher");

  const box =
    "Weapons" + NL + "Poor Quality Shotgun 5d6 Very Heavy Pistol 4d6" + NL + "Armor: Kevlar®" + NL + "Head 7 SP" + NL + "Body 7 SP" + NL +
    "Cyberware & Special Equipment Slug Ammo x25, Very Heavy Pistol Ammo x25, Radio Communicator";
  const boxSplit = split(box);
  assert("stat block box: armor", boxSplit.armor, "Kevlar®");
  assert("stat block box: weapons without dice", boxSplit.weaponsText, "Poor Quality Shotgun, Very Heavy Pistol");
  assert("stat block box: labels and SP lines ignored", all(box).filter((l) => l.placeholder).length, 0);
  const inv = ctx.npcbBuildInventory(ctx.npcbResolveSpec(boxSplit, index), records);
  const shotgun = inv.find((i) => i.name === "Shotgun, Poor Quality");
  assert("shotgun loaded from the slugs", JSON.parse(shotgun.data.ammo).name, "Basic Slug");

  const gen = ctx.npcbBuildSpec({ tier: "lieutenant", role: "netrunner", gang: "maelstrom", source: "random" }, seededRng(11));
  const round = ctx.npcbSplitEquipment(ctx.npcbEquipmentText(gen), index);
  assert(
    "generated gear survives the round trip through one box",
    ctx.npcbResolveSpec(round, index).lines.filter((l) => l.placeholder && l.itemName !== "Banhamer").length,
    0
  );
}

section("Built items in the inventory");
{
  const r = resolve("Heavy Pistol Ammo x100, Armor Piercing Grenade x2, Incendiary Rocket x1, Cyberarm (Popup Heavy SMG, Popup Grenade Launcher)");
  const inv = ctx.npcbBuildInventory(r, records);
  const rocket = inv.find((i) => i.name === "Incendiary Rocket");
  assert("built rocket keeps the rocket's class data", [rocket.data.type, rocket.data.rounds], ["ammo", 1]);
  assert("built rocket drops the AP ablation", (rocket.data.modifiers || []).length, 0);
  assert("built rocket takes the incendiary effect", rocket.data.effects, records["Incendiary Grenade"].data.effects);
  const smg = inv.find((i) => i.name === "Popup Heavy SMG");
  const gun = smg.data.weaponAttached[0];
  assert("popup is cyberware with the gun attached", [smg.data.type, smg.data.hasLinkedWeapon, gun.name, gun.data.ammoType], ["cyberware", true, "Popup Heavy SMG", "h pistol"]);
  assert("popup gun loaded from matching ammo", [gun.data.ammoCount, inv.find((i) => i.name === "Basic H Pistol").data.count], [40, 60]);
  const gl = inv.find((i) => i.name === "Popup Grenade Launcher").data.weaponAttached[0];
  assert("existing popup launcher loaded too", gl.data.ammoCount, 1);
}

section("Random generation");
{
  const tiers = constant(ctx, "NPCB_TIERS");
  const rng = seededRng(42);
  const statKeys = ["int", "ref", "dex", "tech", "cool", "will", "move", "body", "emp"];
  let outOfBand = 0;
  let placeholders = [];
  let unknownSkills = [];
  const roles = ["", ...constant(ctx, "NPCB_ROLES")];
  const gangs = ["", ...Object.keys(constant(ctx, "NPCB_GANGS"))];
  Object.keys(tiers).forEach((tier) => {
    roles.forEach((role) => {
      gangs.forEach((gang) => {
        const spec = ctx.npcbBuildSpec({ tier, role, gang, source: "random" }, rng);
        const total = statKeys.reduce((a, k) => a + spec.stats[k], 0);
        const [lo, hi] = tiers[tier].statTotal;
        if (total < lo || total > hi) outOfBand++;
        resolve(spec.gearText, spec.weaponsText, spec.armor).lines
          .filter((l) => l.placeholder && l.itemName !== "Banhamer")
          .forEach((l) => placeholders.push(l.itemName));
        ctx.npcbParseSkillText(spec.skillText).skills
          .filter((s) => !s.known)
          .forEach((s) => unknownSkills.push(s.name));
      });
    });
  });
  assert("STAT totals stay inside every tier band", outOfBand, 0);
  assert("generated gear always matches real items", [...new Set(placeholders)], []);
  assert("generated skills are all core skills", [...new Set(unknownSkills)], []);
}
{
  const spec = ctx.npcbBuildSpec({ tier: "lieutenant", role: "netrunner", source: "random" }, seededRng(7));
  assert("role ability at the tier's rank", spec.roleAbilities, "Interface 4");
  assert("netrunners get interface plugs", /Interface Plugs/.test(spec.gearText), true);
  assert("programs stay last", /Programs: [^,]+(, [^,]+)*$/.test(spec.gearText), true);
}
{
  const manual = ctx.npcbBuildSpec({ tier: "mook", source: "manual", gang: "maelstrom" }, seededRng(3));
  assert("manual leaves skills and gear empty", [manual.skillText, manual.gearText, manual.gangApplied], ["", "", false]);
}

section("Gangs");
{
  const base = {
    tier: "mook",
    armor: "Leathers",
    weaponsText: "Poor Quality VH Pistol, Rippers",
    gearText: "VH Pistol Ammo x30, Rippers, Techhair",
    skillText: "Handgun 12, Archery 8",
  };
  const mael = ctx.npcbApplyGang(base, "maelstrom");
  assert("armor upgraded", mael.armor, "Medium Armorjack");
  assert("cyberweapon swapped in both lines", [mael.weaponsText, mael.gearText], [
    "Poor Quality VH Pistol, Wolvers",
    "VH Pistol Ammo x30, Wolvers, Techhair",
  ]);
  const voodoo = ctx.npcbApplyGang(base, "voodooBoys");
  assert("weapon swap moves its ammo to the new class", voodoo.gearText, "M Pistol Ammo x30, Rippers, Techhair, Teargas Grenade x1");
  const sixth = ctx.npcbApplyGang(base, "sixthStreet", seededRng(1));
  assert("non-cyber replacement leaves the gear line", /Heavy SMG/.test(sixth.gearText), false);
  assert("non-cyber replacement lands in weapons", sixth.weaponsText, "Poor Quality VH Pistol, Heavy SMG");
  assert("and gets ammo", /H Pistol Ammo x\d+/.test(sixth.gearText), true);
  const twice = ctx.npcbApplyGang(ctx.npcbApplyGang(base, "voodooBoys"), "voodooBoys");
  assert("applying a gang twice adds nothing more", twice.gearText, voodoo.gearText);
  const nomads = ctx.npcbApplyGang(base, "nomads");
  assert("skill rename", /Shoulder Arms 8/.test(nomads.skillText) && !/Archery/.test(nomads.skillText), true);
  const armored = ctx.npcbApplyGang({ ...base, armor: "Heavy Armorjack" }, "piranhas");
  assert("gang armor never downgrades", armored.armor, "Heavy Armorjack");
  const program = ctx.npcbApplyGang({ ...base, gearText: "Agent, Programs: Sword" }, "voodooBoys");
  assert("added gear goes before Programs:", program.gearText.indexOf("Teargas") < program.gearText.indexOf("Programs"), true);
}

process.exit(summary() > 0 ? 1 : 0);
