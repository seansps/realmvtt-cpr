#!/usr/bin/env node
// End-to-end check of npcbFinishWizard against an in-memory API: the wizard's
// data.wizard values become a finished NPC (stats, derived values, skills,
// inventory with loaded weapons, armor SP, role, notes, name).
//
// Run with: node tests/test-npc-wizard-finish.js

const { createSandbox } = require("./sandbox");
const { assert, section, summary } = require("./test-helpers");

const ctx = createSandbox();
const indexRows = require("./fixtures/items-index.json");
const itemRecords = require("./fixtures/item-records.json");

const clone = (o) => JSON.parse(JSON.stringify(o));
function setPath(obj, path, value) {
  const parts = path.split(".");
  let cur = obj;
  parts.slice(0, -1).forEach((p) => {
    if (cur[p] === undefined || cur[p] === null) cur[p] = {};
    cur = cur[p];
  });
  cur[parts[parts.length - 1]] = clone(value);
}

let store;
let queries;
function installApi() {
  queries = 0;
  Object.assign(ctx.api, {
    getRecord: (type, id, cb) => cb(clone(store)),
    setValuesOnRecord: (rec, values, cb) => {
      Object.keys(values).forEach((k) => setPath(store, k, values[k]));
      if (cb) cb(clone(store));
    },
    getRecordsByQuery: (type, query, cb, limit = 50) => {
      queries++;
      let rows = [];
      if (type === "items" && query.$select) {
        const after = query.name?.$gt;
        rows = indexRows
          .filter((r) => after === undefined || r.name > after)
          .sort((a, b) => (a.name < b.name ? -1 : 1))
          .slice(0, limit)
          // Like the server: dotted $select paths ("data.type") return no data
          .map((r) =>
            query.$select.includes("data")
              ? { name: r.name, data: { type: r.type, ammoType: r.ammoType, cyberwareInstallSlot: r.slot } }
              : { name: r.name }
          );
      } else if (type === "items") {
        rows = query.name.$in.map(
          (n) =>
            itemRecords.find((r) => r.name === n) || {
              _id: `rec-${n}`,
              name: n,
              data: { type: (indexRows.find((r) => r.name === n) || {}).type },
            }
        );
      } else if (type === "abilities") {
        rows = query.name.$in.map((n) => ({ _id: `ab-${n}`, name: n, data: {} }));
      } else if (type === "roles") {
        rows = query.name.$in.map((n) => ({
          _id: `role-${n}`,
          name: n,
          data: { panel: n.toLowerCase(), netActionsRank4: 3 },
        }));
      }
      cb(rows);
    },
    getSession: () => undefined,
    setSession: () => {},
  });
}

section("npcbFinishWizard");
store = {
  _id: "npc1",
  recordType: "npcs",
  name: "New NPC",
  data: {
    wizard: {
      tier: "lieutenant",
      role: "solo",
      gang: "maelstrom",
      int: 4, ref: 7, dex: 6, tech: 3, cool: 5, will: 5, luck: 0, move: 5, body: 6, emp: 4,
      roleAbilities: "Combat Awareness 4",
      skillText: "Athletics 10 (8), Handgun 13, Conversation 6, Martial Arts (Karate) 9",
      equipmentText: "Medium Armorjack, Poor Quality VH Pistol, VH Pistol Ammo x30, Cybereye x2 (Anti-Dazzle), Mystery Box",
      gangApplied: false,
    },
  },
};
installApi();
let finished = false;
ctx.npcbFinishWizard("npc1", () => {
  finished = true;
});
const d = store.data;
assert("callback fired", finished, true);
assert("wizard data cleared", d.wizard, {});
assert("name from the creation prompt is left alone", store.name, "New NPC");
assert("type and level", [d.type, d.npcLevel], ["mook", "Lieutenant"]);
assert("HP from BODY/WILL", [d.hitpoints, d.curhp, d.seriouslyWounded, d.deathSave], [40, 40, 20, 6]);
assert("armor SP from equipped armor", [d.bodyArmorSP, d.headArmorSP], [12, 12]);
assert("armor penalty applied to REF/DEX/MOVE", [d.totalRef, d.totalDex, d.totalMove], [5, 4, 3]);
const skill = (n) => d.skills.find((s) => s.name === n)?.data;
assert("penalized skill rebased by the sheet", skill("Athletics"), { base: 8, lvl: 4, stat: "dex" });
assert("REF skill rebased after penalty", skill("Handgun"), { base: 11, lvl: 6, stat: "ref" });
assert("EMP skill uses curEmp", skill("Conversation"), { base: 6, lvl: 2, stat: "emp" });
assert("martial arts style ability added", d.abilities.map((a) => a.name), ["Brawling", "Grab", "Throw", "Choke", "Karate"]);
const inv = (n) => d.inventory.find((i) => i.name === n);
assert("gang cyberweapon added", !!inv("Wolvers"), true);
assert("pistol loaded, remainder in inventory", [inv("Very Heavy Pistol, Poor Quality").data.ammoCount, inv("Basic VH Pistol").data.count], [8, 22]);
assert("placeholder gear", inv("Mystery Box").data.type, "gear");
assert("humanity: EMP x10, minus 2 per equipped cyberware", [d.humanity, d.totalHumanity, d.curHumanity], [40, 32, 32]);
assert("role added at the given rank", [d.roles?.[0]?.name, d.roles?.[0]?.data?.rank, d.role], ["Solo", 4, "Solo 4"]);
assert("notes mention tier and gang", /Lieutenant/.test(d.notes) && /Maelstrom/.test(d.notes), true);
assert("notes list placeholders", /Mystery Box/.test(d.notes), true);

section("npcbImportGear (NPC sheet)");
store = {
  _id: "npc2",
  recordType: "npcs",
  name: "Existing",
  data: {
    type: "mook",
    int: 3, ref: 6, dex: 5, tech: 2, cool: 4, will: 3, luck: 0, move: 4, body: 4, emp: 3, curEmp: 3,
    inventory: [
      { _id: "old1", name: "Basic VH Pistol", data: { type: "ammo", fromId: itemRecords.find((r) => r.name === "Basic VH Pistol")._id, count: 10 } },
    ],
  },
};
installApi();
let result = null;
ctx.npcbImportGear(
  "npcs",
  "npc2",
  "Poor Quality VH Pistol, VH Pistol Ammo x20, Leathers, Very Heavy Pistol, Wolvers",
  (count, placeholders) => {
    result = { count, placeholders };
  }
);
const inv2 = (n) => store.data.inventory.filter((i) => i.name === n);
assert("bare weapon name is a weapon, not ammo", inv2("Very Heavy Pistol").length, 1);
// 10 already carried + 20 imported, minus 8 loaded into each of the two pistols
assert("ammo stacks onto existing ammo, then loads", inv2("Basic VH Pistol").map((i) => i.data.count), [14]);
assert(
  "loaded ammo points at the surviving stack",
  inv2("Very Heavy Pistol").map((w) => JSON.parse(w.data.ammo)._id),
  ["old1"]
);
assert("armor recalculated from imported armor", [store.data.bodyArmorSP, store.data.headArmorSP], [4, 4]);
assert("callback reports what was added", result && result.placeholders, []);

process.exit(summary() > 0 ? 1 : 0);
