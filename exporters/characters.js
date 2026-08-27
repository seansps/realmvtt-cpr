// Character PDF Export Script for RealmVTT Cyberpunk RED Ruleset
// Produces a multi-page pdfmake docDefinition mirroring the in-app character sheet:
//   1. Main      — portrait, identity, STATs, HP/humanity/armor, roles
//   2. Skills    — grouped skill tables with subskills
//   3. Combat    — weapons, abilities, critical injuries, addictions
//   4. Cyberware — installed cyberware with humanity loss and slots
//   5. Inventory — items, armor, cash, ammo
//   6. Lifepath  — lifepath answers, friends/enemies/lovers, housing, IP, reputation, notes
//
// Available at runtime:
//   record      — the character record (also exposed as `value`)
//   recordType  — "characters"
//   data.filename — the default filename from the ruleset template
//   api.loadImage(path) — async, returns a base64 data URL for embedding

const d = (record && record.data) || {};
const characterName = (record && record.name) || "Unnamed Character";

// ===== Helpers =====

function stripHtml(html) {
  if (!html || typeof html !== "string") return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p[^>]*>/gi, "\n\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<p[^>]*>/gi, "")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/(ul|ol|div|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function nonEmpty(v) {
  return v !== undefined && v !== null && String(v).trim() !== "";
}

function val(v, fallback) {
  return nonEmpty(v) ? String(v) : fallback === undefined ? "—" : fallback;
}

function kv(label, value) {
  return {
    stack: [
      { text: label, style: "label" },
      { text: val(value), style: "value" },
    ],
  };
}

function titleCase(s) {
  if (!nonEmpty(s)) return "—";
  return String(s).replace(/\b([a-z])/g, (_, c) => c.toUpperCase());
}

function truncate(text, max) {
  if (!text) return "";
  return text.length > max ? text.slice(0, max).trimEnd() + "…" : text;
}

const DESC_MAX = 180;

// Skill entries show `name` for default skills and `data.namefield` for
// player-added ones (that's what the hidden-field pair toggles on the sheet).
function skillDisplayName(entry) {
  const sd = (entry && entry.data) || {};
  if (sd.isDefault === false && nonEmpty(sd.namefield)) return sd.namefield;
  return entry.name || sd.namefield || "Unnamed Skill";
}

// ===== Portrait =====

let portraitDataUrl = null;
if (record && record.portrait) {
  try {
    portraitDataUrl = await api.loadImage(record.portrait);
  } catch (e) {
    console.warn(
      "[characters.pdf] portrait load failed for",
      record.portrait,
      "—",
      e && e.message,
    );
    portraitDataUrl = null;
  }
}

// ===== Styles =====

const styles = {
  h3: { fontSize: 12, bold: true, margin: [0, 10, 0, 4] },
  label: { fontSize: 8, color: "#666" },
  value: { fontSize: 11, bold: true },
  small: { fontSize: 9 },
  tiny: { fontSize: 8, color: "#555" },
  tableHeader: {
    fontSize: 9,
    bold: true,
    fillColor: "#eeeeee",
    margin: [2, 2, 2, 2],
  },
  pageTitle: {
    fontSize: 18,
    bold: true,
    color: "#8a1a1a",
    margin: [0, 0, 0, 10],
  },
};

const defaultStyle = { fontSize: 10, lineHeight: 1.15 };

// ===== Reusable fragments =====

function nameStrip(showPortrait, pageTitle) {
  const portraitBlock =
    showPortrait && portraitDataUrl
      ? {
          image: portraitDataUrl,
          width: 60,
          height: 60,
          fit: [60, 60],
        }
      : { text: "", width: 60 };

  return {
    columns: [
      portraitBlock,
      {
        stack: [
          { text: characterName, fontSize: 16, bold: true },
          {
            text: val(d.role, ""),
            style: "small",
            color: "#555",
          },
        ],
        margin: [12, showPortrait ? 8 : 0, 0, 0],
      },
      pageTitle
        ? {
            text: pageTitle,
            style: "pageTitle",
            alignment: "right",
            margin: [0, 8, 0, 0],
          }
        : { text: "", width: 1 },
    ],
    margin: [0, 0, 0, 10],
  };
}

// ===== Page 1: Main =====

// STATs: base value is the player-entered field; the effective value (after
// modifiers and armor penalties) is total<Stat>. LUCK and EMP are pools —
// print current / max.
const STATS = [
  { key: "int", label: "INT" },
  { key: "ref", label: "REF" },
  { key: "dex", label: "DEX" },
  { key: "tech", label: "TECH" },
  { key: "cool", label: "COOL" },
  { key: "will", label: "WILL" },
  { key: "luck", label: "LUCK" },
  { key: "move", label: "MOVE" },
  { key: "body", label: "BODY" },
  { key: "emp", label: "EMP" },
];

function totalKey(key) {
  return "total" + key.charAt(0).toUpperCase() + key.slice(1);
}

function statCell(s) {
  let display;
  if (s.key === "luck") {
    display = val(d.curLuck, val(d.luck, "0")) + " / " + val(d.totalLuck, val(d.luck));
  } else if (s.key === "emp") {
    display =
      val(d.totalCurEmp, val(d.curEmp, "0")) + " / " + val(d.totalEmp, val(d.emp));
  } else {
    display = val(d[totalKey(s.key)], val(d[s.key], "0"));
  }
  const base = val(d[s.key], "0");
  return {
    stack: [
      { text: display, alignment: "center", fontSize: 13, bold: true },
      { text: "base " + base, alignment: "center", fontSize: 7, color: "#777" },
    ],
    margin: [0, 3, 0, 3],
  };
}

const statTable = {
  table: {
    widths: ["*", "*", "*", "*", "*", "*", "*", "*", "*", "*"],
    body: [
      STATS.map((s) => ({
        text: s.label,
        style: "tableHeader",
        alignment: "center",
      })),
      STATS.map(statCell),
    ],
  },
  layout: "lightHorizontalLines",
  margin: [0, 0, 0, 10],
};

const mainContent = [
  nameStrip(true),
  { text: "STATs", style: "h3" },
  statTable,
  {
    columns: [
      kv("HP", val(d.curhp, val(d.hitpoints)) + " / " + val(d.hitpoints)),
      kv("Seriously Wounded", d.seriouslyWounded),
      kv("Death Save", d.deathSave),
      kv(
        "Humanity",
        val(d.curHumanity, "0") + " / " + val(d.totalHumanity, val(d.humanity)),
      ),
    ],
    columnGap: 8,
    margin: [0, 0, 0, 10],
  },
  {
    columns: [
      kv(
        "Head Armor",
        nonEmpty(d.headArmor)
          ? d.headArmor + " (SP " + val(d.headArmorSP, "0") + ")"
          : "—",
      ),
      kv(
        "Body Armor",
        nonEmpty(d.bodyArmor)
          ? d.bodyArmor + " (SP " + val(d.bodyArmorSP, "0") + ")"
          : "—",
      ),
      kv(
        "Shield",
        nonEmpty(d.shield)
          ? d.shield + " (HP " + val(d.shieldHP, "0") + ")"
          : "—",
      ),
      kv("Cover HP", d.coverHp),
    ],
    columnGap: 8,
    margin: [0, 0, 0, 10],
  },
  {
    columns: [
      kv("Reputation", val(d.reputation, "0")),
      kv("IP", val(d.IP, "0") + " (" + val(d.usedIP, "0") + " spent)"),
      kv("Cash (eb)", val(d.cash, "0")),
      kv("Aliases", d.aliases),
    ],
    columnGap: 8,
    margin: [0, 0, 0, 10],
  },
];

// Roles with rank and role ability
const roles = d.roles || [];
if (roles.length > 0) {
  mainContent.push({ text: "Roles", style: "h3" });
  roles.forEach((r) => {
    const rd = (r && r.data) || {};
    const headerBits = [
      { text: r.name || "Unnamed Role", bold: true, fontSize: 11 },
      { text: "  Rank " + val(rd.rank, "1"), style: "tiny", color: "#777" },
    ];
    if (nonEmpty(rd.roleAbility)) {
      headerBits.push({
        text: "  •  " + rd.roleAbility,
        style: "tiny",
        color: "#777",
      });
    }
    const desc = truncate(stripHtml(rd.description), DESC_MAX * 2);
    mainContent.push({
      stack: [
        { text: headerBits, margin: [0, 0, 0, 2] },
        desc
          ? { text: desc, style: "small", margin: [0, 0, 0, 6] }
          : { text: "", margin: [0, 0, 0, 4] },
      ],
    });
  });
}

// ===== Page 2: Skills =====

// Character skills live in two column arrays of skill groups. Each group entry
// holds data.skills; a skill with hasSubskills prints its subSkills instead of
// its own (undefined) level/base.
function skillRowsForGroup(group) {
  const rows = [];
  const skills = (group && group.data && group.data.skills) || [];
  skills.forEach((sk) => {
    const sd = (sk && sk.data) || {};
    if (sd.hasSubskills && Array.isArray(sd.subSkills) && sd.subSkills.length) {
      sd.subSkills.forEach((sub) => {
        const subd = (sub && sub.data) || {};
        rows.push([
          {
            text:
              skillDisplayName(sk) +
              ": " +
              skillDisplayName(sub) +
              (subd.isTimesTwo ? " (x2)" : ""),
          },
          { text: (subd.stat || sd.stat || "").toUpperCase(), alignment: "center" },
          { text: val(subd.lvl, "0"), alignment: "center" },
          { text: val(subd.base, "0"), alignment: "center" },
        ]);
      });
    } else {
      rows.push([
        { text: skillDisplayName(sk) + (sd.isTimesTwo ? " (x2)" : "") },
        { text: (sd.stat || "").toUpperCase(), alignment: "center" },
        { text: val(sd.lvl, "0"), alignment: "center" },
        { text: val(sd.base, "0"), alignment: "center" },
      ]);
    }
  });
  return rows;
}

function skillGroupBlocks(groupArray) {
  const blocks = [];
  (groupArray || []).forEach((group) => {
    const rows = skillRowsForGroup(group);
    if (rows.length === 0) return;
    blocks.push({
      text: group.name || "Skills",
      bold: true,
      fontSize: 10,
      margin: [0, 6, 0, 2],
    });
    blocks.push({
      table: {
        headerRows: 1,
        widths: ["*", 38, 32, 34],
        body: [
          [
            { text: "Skill", style: "tableHeader" },
            { text: "STAT", style: "tableHeader", alignment: "center" },
            { text: "Lvl", style: "tableHeader", alignment: "center" },
            { text: "Total", style: "tableHeader", alignment: "center" },
          ],
          ...rows,
        ],
      },
      layout: "lightHorizontalLines",
      fontSize: 8,
    });
  });
  return blocks;
}

const skillsContent = [
  Object.assign(nameStrip(false, "Skills"), { pageBreak: "before" }),
  {
    columns: [
      { stack: skillGroupBlocks(d.skillGroups1), width: "*" },
      { stack: skillGroupBlocks(d.skillGroups2), width: "*" },
    ],
    columnGap: 14,
  },
];

if (nonEmpty(d.languages)) {
  skillsContent.push({ text: "Languages", style: "h3" });
  skillsContent.push({ text: d.languages, style: "small" });
}

// ===== Page 3: Combat =====

const inventory = d.inventory || [];

function isEquipped(it) {
  return it && it.data && it.data.carried === "equipped";
}

// Attacks mirror the Actions tab filter: equipped ranged/melee weapons plus
// cyberware carrying an attached weapon.
const weaponItems = inventory.filter((it) => {
  const t = String((it && it.data && it.data.type) || "").toLowerCase();
  if (!isEquipped(it)) return false;
  if (t === "ranged weapon" || t === "melee weapon") return true;
  if (
    t === "cyberware" &&
    Array.isArray(it.data.weaponAttached) &&
    it.data.weaponAttached.length > 0
  )
    return true;
  return false;
});

function weaponRow(it, prefix) {
  const id = (it && it.data) || {};
  const noteBits = [];
  if (nonEmpty(id.weaponType)) noteBits.push(titleCase(id.weaponType));
  if (nonEmpty(id.handsRequired)) noteBits.push(id.handsRequired + "H");
  if (id.autofire === true || id.autofire === "true") noteBits.push("Autofire");
  if (id.concealable === "true" || id.concealable === true)
    noteBits.push("Concealable");
  const ammo =
    nonEmpty(id.magazine) && String(id.magazine) !== "0"
      ? val(id.ammoCount, "0") + " / " + id.magazine
      : "";
  return [
    { text: (prefix || "") + (it.name || "") },
    { text: val(id.weaponSkill, ""), style: "tiny" },
    { text: val(id.damage, ""), alignment: "center" },
    { text: val(id.rof, ""), alignment: "center" },
    { text: ammo, alignment: "center" },
    { text: noteBits.join(" • "), style: "tiny" },
  ];
}

const combatContent = [
  Object.assign(nameStrip(false, "Combat"), { pageBreak: "before" }),
];

if (weaponItems.length > 0) {
  const rows = [];
  weaponItems.forEach((it) => {
    const t = String((it.data && it.data.type) || "").toLowerCase();
    if (t === "cyberware") {
      (it.data.weaponAttached || []).forEach((w) => {
        rows.push(weaponRow(w, (it.name || "Cyberware") + ": "));
      });
    } else {
      rows.push(weaponRow(it));
    }
  });
  combatContent.push({ text: "Weapons", style: "h3" });
  combatContent.push({
    table: {
      headerRows: 1,
      widths: ["*", 80, 48, 30, 42, "*"],
      body: [
        [
          { text: "Weapon", style: "tableHeader" },
          { text: "Skill", style: "tableHeader" },
          { text: "Damage", style: "tableHeader", alignment: "center" },
          { text: "ROF", style: "tableHeader", alignment: "center" },
          { text: "Ammo", style: "tableHeader", alignment: "center" },
          { text: "Notes", style: "tableHeader" },
        ],
        ...rows,
      ],
    },
    layout: "lightHorizontalLines",
    fontSize: 9,
    margin: [0, 0, 0, 10],
  });
}

// Abilities (dropped ability records)
const abilities = d.abilities || [];
if (abilities.length > 0) {
  combatContent.push({ text: "Abilities", style: "h3" });
  combatContent.push({
    ul: abilities.map((a) => {
      const ad = (a && a.data) || {};
      const short = truncate(stripHtml(ad.description), DESC_MAX);
      return {
        text: [
          { text: a.name || "Unnamed Ability", bold: true },
          short ? { text: " — " + short, style: "small" } : { text: "" },
        ],
      };
    }),
    margin: [0, 0, 0, 10],
  });
}

function conditionSection(title, list) {
  if (!list || list.length === 0) return;
  combatContent.push({ text: title, style: "h3" });
  combatContent.push({
    ul: list.map((c) => {
      const cd = (c && c.data) || {};
      const short = truncate(stripHtml(cd.description), DESC_MAX);
      return {
        text: [
          { text: c.name || "Unnamed", bold: true },
          short ? { text: " — " + short, style: "small" } : { text: "" },
        ],
      };
    }),
    margin: [0, 0, 0, 10],
  });
}

conditionSection("Critical Injuries", d.criticalInjuries);
conditionSection("Addictions", d.addictions);

// ===== Page 4: Cyberware =====

const cyberwareItems = inventory.filter((it) => {
  const id = (it && it.data) || {};
  return (
    String(id.type || "").toLowerCase() === "cyberware" && id.withinGear !== true
  );
});

const cyberwareContent = [
  Object.assign(nameStrip(false, "Cyberware"), { pageBreak: "before" }),
];

if (cyberwareItems.length === 0) {
  cyberwareContent.push({
    text: "No cyberware installed.",
    style: "small",
    italics: true,
  });
} else {
  cyberwareContent.push({
    table: {
      headerRows: 1,
      widths: ["*", 90, 70, 55, "*"],
      body: [
        [
          { text: "Cyberware", style: "tableHeader" },
          { text: "Slot", style: "tableHeader" },
          { text: "Location", style: "tableHeader" },
          { text: "HL", style: "tableHeader", alignment: "center" },
          { text: "Notes", style: "tableHeader" },
        ],
        ...cyberwareItems.map((it) => {
          const id = it.data || {};
          const slot = [
            titleCase(id.cyberwareInstallSlot || ""),
            nonEmpty(id.foundationalSlot) ? titleCase(id.foundationalSlot) : "",
          ]
            .filter(Boolean)
            .join(": ");
          const hl = nonEmpty(id.humanityLoss)
            ? id.humanityLoss
            : val(id.baseHumanityLoss, "");
          const short = truncate(stripHtml(id.description), 100);
          return [
            { text: it.name || "" },
            { text: slot, style: "tiny" },
            { text: titleCase(id.cyberLocation || ""), style: "tiny" },
            { text: hl, alignment: "center" },
            { text: short, style: "tiny" },
          ];
        }),
      ],
    },
    layout: "lightHorizontalLines",
    fontSize: 9,
    margin: [0, 0, 0, 10],
  });
}

// Equipped cyberdeck with installed programs
const cyberdecks = inventory.filter(
  (it) =>
    String((it && it.data && it.data.type) || "").toLowerCase() ===
      "cyberdeck" && isEquipped(it),
);
cyberdecks.forEach((deck) => {
  const dd = deck.data || {};
  cyberwareContent.push({
    text:
      (deck.name || "Cyberdeck") +
      "  (" +
      val(dd.slotsUsed, "0") +
      " / " +
      val(dd.maxSlots, "0") +
      " slots)",
    style: "h3",
  });
  const programs = [
    ...(dd.installedProgramsAndHardware || []),
    ...(dd.installedBlackICE || []),
  ];
  if (programs.length > 0) {
    cyberwareContent.push({
      ul: programs.map((p) => {
        const pd = (p && p.data) || {};
        const kind = pd.blackICE
          ? "Black ICE" + (nonEmpty(pd.blackICEType) ? " (" + pd.blackICEType + ")" : "")
          : titleCase(pd.programHardwareType || "Program");
        return (p.name || "Unnamed") + " — " + kind;
      }),
      style: "small",
      margin: [0, 0, 0, 8],
    });
  }
});

// ===== Page 5: Inventory =====

const inventoryContent = [
  Object.assign(nameStrip(false, "Inventory"), { pageBreak: "before" }),
];

const gearItems = inventory.filter((it) => {
  const t = String((it && it.data && it.data.type) || "").toLowerCase();
  return t !== "cyberware" || (it.data && it.data.withinGear === true);
});

if (gearItems.length === 0) {
  inventoryContent.push({
    text: "No items.",
    style: "small",
    italics: true,
    margin: [0, 0, 0, 10],
  });
} else {
  inventoryContent.push({
    table: {
      headerRows: 1,
      widths: ["*", 80, 40, 55, 70],
      body: [
        [
          { text: "Item", style: "tableHeader" },
          { text: "Type", style: "tableHeader" },
          { text: "Count", style: "tableHeader", alignment: "center" },
          { text: "Carried", style: "tableHeader", alignment: "center" },
          { text: "Location", style: "tableHeader" },
        ],
        ...gearItems.map((it) => {
          const id = (it && it.data) || {};
          return [
            { text: it.name || "" },
            { text: titleCase(id.type || ""), style: "tiny" },
            {
              text: String(id.count != null ? id.count : 1),
              alignment: "center",
            },
            { text: titleCase(id.carried || ""), alignment: "center", style: "tiny" },
            { text: val(id.location, ""), style: "tiny" },
          ];
        }),
      ],
    },
    layout: "lightHorizontalLines",
    fontSize: 9,
    margin: [0, 0, 0, 10],
  });
}

inventoryContent.push({
  columns: [kv("Cash (eb)", val(d.cash, "0"))],
  margin: [0, 0, 0, 10],
});

// Armor detail
const armorItems = inventory.filter(
  (it) => nonEmpty(it && it.data && it.data.armorLocation),
);
if (armorItems.length > 0) {
  inventoryContent.push({ text: "Armor", style: "h3" });
  inventoryContent.push({
    table: {
      headerRows: 1,
      widths: ["*", 55, 40, 45, 55],
      body: [
        [
          { text: "Armor", style: "tableHeader" },
          { text: "Location", style: "tableHeader" },
          { text: "SP", style: "tableHeader", alignment: "center" },
          { text: "Penalty", style: "tableHeader", alignment: "center" },
          { text: "Carried", style: "tableHeader", alignment: "center" },
        ],
        ...armorItems.map((it) => {
          const id = it.data || {};
          const loc = String(id.armorLocation || "");
          const curSp = id["cur" + loc + "Sp"];
          const sp = nonEmpty(curSp)
            ? curSp + " / " + val(id.sp, "")
            : val(id.sp, "");
          return [
            { text: it.name || "" },
            { text: titleCase(loc), alignment: "center" },
            { text: sp, alignment: "center" },
            { text: val(id.penalty, ""), alignment: "center" },
            {
              text: titleCase(id.carried || ""),
              alignment: "center",
              style: "tiny",
            },
          ];
        }),
      ],
    },
    layout: "lightHorizontalLines",
    fontSize: 9,
    margin: [0, 0, 0, 10],
  });
}

// ===== Page 6: Lifepath & Notes =====

const notesContent = [
  Object.assign(nameStrip(false, "Lifepath & Notes"), { pageBreak: "before" }),
];

function addTextSection(label, text) {
  if (!nonEmpty(text)) return;
  notesContent.push({ text: label, style: "h3" });
  notesContent.push({ text: stripHtml(String(text)), margin: [0, 0, 0, 8] });
}

const lifepathRows = [
  ["Cultural Origins", d.culturalOrigins],
  ["Personality", d.personality],
  ["Clothing Style", d.clothingStyle],
  ["Hairstyle", d.hairStyle],
  ["Values", d.valueMost],
  ["Feelings About People", d.feelingsPeople],
  ["Most Valued Person", d.valuePerson],
  ["Valued Possessions", d.valuedPossessions],
  ["Family Background", d.familyBackground],
  ["Childhood Environment", d.childhoodEnvironment],
  ["Family Crisis", d.familyCrisis],
  ["Life Goals", d.lifeGoals],
].filter((r) => nonEmpty(r[1]));

if (lifepathRows.length > 0) {
  notesContent.push({ text: "Lifepath", style: "h3" });
  notesContent.push({
    table: {
      widths: [130, "*"],
      body: lifepathRows.map((r) => [
        { text: r[0], bold: true, style: "small" },
        { text: String(r[1]), style: "small" },
      ]),
    },
    layout: "lightHorizontalLines",
    margin: [0, 0, 0, 10],
  });
}

const friends = [d.friend1, d.friend2, d.friend3].filter(nonEmpty);
if (friends.length > 0) {
  notesContent.push({ text: "Friends", style: "h3" });
  notesContent.push({ ul: friends, style: "small", margin: [0, 0, 0, 8] });
}

const lovers = [d.tragicAffair1, d.tragicAffair2, d.tragicAffair3].filter(
  nonEmpty,
);
if (lovers.length > 0) {
  notesContent.push({ text: "Tragic Love Affairs", style: "h3" });
  notesContent.push({ ul: lovers, style: "small", margin: [0, 0, 0, 8] });
}

const enemies = [];
for (let i = 1; i <= 3; i++) {
  if (!nonEmpty(d["enemy" + i])) continue;
  const bits = [d["enemy" + i]];
  if (nonEmpty(d["enemyCause" + i])) bits.push("Cause: " + d["enemyCause" + i]);
  if (nonEmpty(d["enemyThreat" + i]))
    bits.push("Throws at you: " + d["enemyThreat" + i]);
  if (nonEmpty(d["enemyOutcome" + i]))
    bits.push("Outcome: " + d["enemyOutcome" + i]);
  enemies.push(bits.join(" • "));
}
if (enemies.length > 0) {
  notesContent.push({ text: "Enemies", style: "h3" });
  notesContent.push({ ul: enemies, style: "small", margin: [0, 0, 0, 8] });
}

const housingRows = [
  ["Housing", d.housing],
  ["Rent", d.rent],
  ["Lifestyle", d.lifestyle],
].filter((r) => nonEmpty(r[1]));
if (housingRows.length > 0) {
  notesContent.push({ text: "Housing & Lifestyle", style: "h3" });
  notesContent.push({
    columns: housingRows.map((r) => kv(r[0], r[1])),
    columnGap: 8,
    margin: [0, 0, 0, 10],
  });
}

addTextSection("Role-Specific Lifepath", d.roleSpecificLifepath);

// IP spent log
const ipSpent = d.ipSpent || [];
if (ipSpent.length > 0) {
  notesContent.push({ text: "Improvement Points Spent", style: "h3" });
  notesContent.push({
    ul: ipSpent.map((e) => {
      const used = e && e.data && e.data.usedIP;
      return (e.name || "Unnamed") + (nonEmpty(used) ? " — " + used + " IP" : "");
    }),
    style: "small",
    margin: [0, 0, 0, 8],
  });
}

// Reputation events
const repEvents = d.repEventList || [];
if (repEvents.length > 0) {
  notesContent.push({ text: "Reputation Events", style: "h3" });
  notesContent.push({
    ul: repEvents.map((e) => {
      const rep = e && e.data && e.data.reputation;
      return (e.name || "Unnamed") + (nonEmpty(rep) ? " — " + rep : "");
    }),
    style: "small",
    margin: [0, 0, 0, 8],
  });
}

addTextSection("Notes", d.notes);

// ===== Assemble =====

return {
  pageSize: "LETTER",
  pageMargins: [40, 40, 40, 44],
  defaultStyle,
  styles,
  footer: (currentPage, pageCount) => ({
    columns: [
      { text: characterName, style: "tiny", margin: [40, 0, 0, 0] },
      {
        text: currentPage + " / " + pageCount,
        alignment: "right",
        style: "tiny",
        margin: [0, 0, 40, 0],
      },
    ],
    margin: [0, 10, 0, 0],
  }),
  content: [
    ...mainContent,
    ...skillsContent,
    ...combatContent,
    ...cyberwareContent,
    ...inventoryContent,
    ...notesContent,
  ],
  filename: characterName + ".pdf",
};
