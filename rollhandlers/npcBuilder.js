// NPC Builder: data and helpers for the NPC creation wizard
// (wizards/npcs/step-*.html), plus the role Edgerunner STAT tables and role
// skill packages shared with the character wizard.
//
// Registered as a utility script (otherSettings.scripts), so it is evaluated
// alongside every ruleset script: top-level names are prefixed npcb / NPCB_
// to stay clear of sheet and rollhandler scripts.

const NPCB_STATS = [
  "int",
  "ref",
  "dex",
  "tech",
  "cool",
  "will",
  "luck",
  "move",
  "body",
  "emp",
];

// Streetrat / Edgerunner STAT tables, one row per 1d10 result.
// Columns follow NPCB_STATS.
const NPCB_ROLE_STAT_TABLES = {
  tech: [
    [6, 7, 7, 8, 4, 4, 5, 5, 7, 6],
    [7, 6, 6, 7, 5, 3, 7, 7, 5, 5],
    [8, 6, 5, 7, 5, 4, 7, 7, 5, 7],
    [7, 8, 7, 8, 4, 4, 6, 5, 6, 7],
    [6, 6, 7, 6, 4, 3, 7, 7, 6, 6],
    [8, 7, 5, 6, 3, 3, 7, 6, 6, 7],
    [8, 6, 7, 8, 4, 4, 7, 6, 7, 6],
    [8, 8, 7, 8, 5, 4, 6, 5, 6, 6],
    [6, 6, 7, 8, 3, 3, 5, 7, 7, 7],
    [8, 8, 5, 6, 4, 4, 6, 5, 6, 6],
  ],
  solo: [
    [6, 7, 7, 3, 8, 6, 5, 5, 6, 5],
    [7, 8, 6, 3, 6, 6, 7, 5, 6, 6],
    [5, 8, 7, 4, 7, 7, 6, 7, 8, 5],
    [5, 8, 6, 4, 6, 7, 6, 5, 7, 6],
    [6, 6, 7, 5, 7, 6, 7, 6, 8, 4],
    [7, 7, 6, 5, 7, 6, 6, 7, 7, 5],
    [7, 7, 6, 5, 6, 7, 7, 6, 6, 6],
    [7, 8, 7, 5, 6, 6, 5, 6, 8, 4],
    [7, 7, 6, 4, 6, 6, 6, 5, 6, 5],
    [6, 6, 8, 5, 6, 6, 5, 6, 6, 5],
  ],
  rockerboy: [
    [7, 6, 6, 5, 6, 8, 7, 7, 3, 8],
    [3, 7, 7, 7, 7, 6, 7, 7, 5, 8],
    [4, 5, 7, 7, 6, 6, 7, 7, 5, 8],
    [4, 5, 7, 7, 6, 8, 7, 6, 3, 8],
    [3, 7, 7, 7, 6, 8, 6, 5, 4, 7],
    [5, 6, 7, 5, 7, 8, 5, 7, 3, 7],
    [5, 6, 6, 7, 7, 8, 7, 6, 3, 6],
    [5, 7, 7, 5, 6, 6, 6, 6, 4, 8],
    [3, 5, 5, 6, 7, 8, 7, 5, 5, 7],
    [4, 5, 6, 5, 8, 8, 7, 6, 4, 7],
  ],
  nomad: [
    [6, 6, 8, 3, 6, 7, 6, 6, 6, 4],
    [5, 7, 6, 5, 8, 8, 8, 7, 5, 4],
    [5, 8, 6, 3, 8, 7, 6, 5, 6, 5],
    [5, 8, 7, 4, 8, 6, 7, 7, 7, 5],
    [6, 6, 6, 3, 6, 7, 6, 7, 7, 4],
    [7, 6, 8, 4, 6, 7, 6, 5, 6, 5],
    [6, 7, 8, 4, 6, 6, 7, 5, 7, 5],
    [5, 7, 8, 3, 8, 6, 7, 5, 5, 5],
    [6, 7, 6, 4, 8, 6, 6, 6, 6, 6],
    [5, 6, 7, 4, 7, 8, 7, 7, 7, 4],
  ],
  netrunner: [
    [5, 8, 7, 7, 7, 4, 8, 7, 7, 4],
    [5, 6, 7, 5, 8, 3, 8, 7, 5, 5],
    [5, 6, 8, 6, 6, 4, 7, 6, 7, 4],
    [5, 7, 7, 7, 7, 5, 8, 6, 5, 5],
    [5, 8, 8, 5, 7, 3, 7, 5, 5, 6],
    [6, 6, 6, 7, 8, 4, 7, 7, 6, 6],
    [6, 6, 6, 7, 6, 5, 7, 7, 7, 6],
    [5, 7, 8, 6, 8, 4, 8, 5, 7, 4],
    [7, 6, 7, 7, 6, 3, 6, 5, 6, 5],
    [7, 8, 6, 6, 6, 4, 7, 7, 5, 6],
  ],
  medtech: [
    [7, 5, 6, 7, 5, 3, 8, 5, 5, 7],
    [6, 7, 7, 7, 4, 4, 6, 7, 7, 7],
    [6, 5, 5, 8, 5, 3, 8, 5, 7, 8],
    [8, 7, 6, 8, 3, 5, 6, 6, 5, 7],
    [6, 7, 5, 7, 5, 5, 8, 7, 6, 8],
    [8, 5, 5, 8, 5, 5, 6, 6, 5, 6],
    [8, 6, 5, 8, 5, 4, 8, 5, 7, 7],
    [6, 5, 7, 7, 3, 5, 8, 5, 5, 8],
    [6, 6, 7, 7, 5, 4, 6, 6, 5, 6],
    [8, 7, 6, 6, 3, 4, 8, 7, 6, 7],
  ],
  media: [
    [6, 6, 5, 5, 8, 7, 5, 7, 5, 7],
    [8, 7, 7, 3, 6, 6, 6, 5, 6, 8],
    [6, 7, 7, 5, 6, 8, 5, 5, 5, 7],
    [6, 5, 7, 5, 6, 7, 5, 5, 6, 6],
    [6, 6, 7, 4, 8, 7, 6, 7, 5, 8],
    [7, 5, 5, 4, 8, 7, 6, 7, 5, 8],
    [8, 5, 6, 3, 7, 6, 6, 5, 6, 7],
    [6, 5, 6, 5, 6, 8, 6, 6, 7, 8],
    [7, 7, 5, 4, 6, 7, 6, 5, 6, 7],
    [7, 6, 6, 3, 7, 6, 7, 6, 7, 6],
  ],
  lawman: [
    [5, 6, 7, 5, 7, 8, 5, 6, 5, 6],
    [6, 6, 6, 5, 6, 8, 5, 7, 5, 5],
    [5, 7, 7, 7, 6, 7, 5, 5, 7, 6],
    [6, 6, 7, 6, 6, 8, 5, 7, 7, 6],
    [6, 6, 7, 6, 7, 7, 6, 5, 5, 6],
    [7, 6, 5, 5, 7, 8, 5, 6, 7, 4],
    [7, 8, 7, 5, 6, 8, 7, 6, 5, 4],
    [5, 6, 6, 5, 6, 8, 5, 7, 6, 4],
    [7, 7, 5, 5, 7, 7, 6, 5, 5, 6],
    [6, 6, 5, 6, 8, 7, 5, 7, 6, 6],
  ],
  fixer: [
    [8, 5, 7, 4, 6, 5, 8, 5, 5, 8],
    [8, 5, 5, 5, 6, 7, 8, 7, 5, 7],
    [6, 6, 6, 4, 5, 6, 8, 6, 3, 8],
    [7, 7, 5, 5, 7, 6, 7, 7, 5, 8],
    [8, 6, 6, 3, 6, 5, 8, 7, 5, 6],
    [8, 7, 5, 5, 6, 7, 7, 5, 3, 6],
    [8, 6, 6, 5, 6, 5, 6, 7, 5, 8],
    [6, 6, 7, 4, 7, 6, 7, 7, 4, 7],
    [8, 7, 7, 5, 5, 5, 7, 6, 5, 7],
    [6, 5, 6, 5, 5, 6, 8, 6, 4, 7],
  ],
  exec: [
    [8, 5, 5, 3, 8, 6, 6, 5, 5, 7],
    [8, 6, 6, 4, 7, 6, 7, 7, 5, 7],
    [8, 7, 6, 3, 8, 6, 7, 6, 4, 5],
    [8, 5, 7, 5, 6, 5, 6, 5, 5, 7],
    [7, 7, 6, 5, 8, 5, 7, 7, 5, 6],
    [5, 7, 7, 3, 6, 7, 6, 5, 5, 7],
    [6, 6, 7, 5, 8, 7, 6, 7, 4, 6],
    [6, 7, 7, 3, 7, 5, 7, 5, 5, 7],
    [7, 6, 7, 5, 7, 5, 7, 6, 5, 5],
    [7, 7, 5, 5, 8, 6, 6, 7, 4, 7],
  ],
};

// One row of a role's STAT table as {int, ref, ...}, or null
function npcbRoleStatRow(role, roll) {
  const row = NPCB_ROLE_STAT_TABLES[role]?.[roll - 1];
  if (!row) return null;
  const stats = { roll };
  NPCB_STATS.forEach((stat, i) => {
    stats[stat] = row[i];
  });
  return stats;
}

function getSkillsForRole(role) {
  // Return the list of skills (streetrat/edgerunner) for a given role
  // Role should be lowercase (solo, netrunner, tech, etc.)

  switch (role.toLowerCase()) {
    case "rockerboy":
      return [
        ["Athletics", 2],
        ["Brawling", 6],
        ["Concentration", 2],
        ["Conversation", 2],
        ["Education", 2],
        ["Evasion", 6],
        ["First Aid", 6],
        ["Human Perception", 6],
        ["Streetslang", 2, "Language"],
        ["Your Home", 4, "Local Expert"],
        ["Perception", 2],
        ["Persuasion", 6],
        ["Stealth", 2],
        ["Composition", 6],
        ["Handgun", 6],
        ["Melee Weapon", 6],
        ["Personal Grooming", 4],
        ["Play Instrument (choose 1)", 6, "Play Instrument"],
        ["Streetwise", 6],
        ["Wardrobe & Style", 4],
      ];

    case "solo":
      return [
        ["Athletics", 2],
        ["Brawling", 2],
        ["Concentration", 2],
        ["Conversation", 2],
        ["Education", 2],
        ["Evasion", 6],
        ["First Aid", 6],
        ["Human Perception", 2],
        ["Streetslang", 2, "Language"],
        ["Your Home", 2, "Local Expert"],
        ["Perception", 6],
        ["Persuasion", 2],
        ["Stealth", 2],
        ["Autofire (x2)", 6],
        ["Handgun", 6],
        ["Interrogation", 6],
        ["Melee Weapon", 6],
        ["Resist Torture/Drugs", 6],
        ["Shoulder Arms", 6],
        ["Tactics", 6],
      ];

    case "netrunner":
      return [
        ["Athletics", 2],
        ["Brawling", 2],
        ["Concentration", 2],
        ["Conversation", 2],
        ["Education", 6],
        ["Evasion", 6],
        ["First Aid", 2],
        ["Human Perception", 2],
        ["Streetslang", 2, "Language"],
        ["Your Home", 2, "Local Expert"],
        ["Perception", 2],
        ["Persuasion", 2],
        ["Stealth", 6],
        ["Basic Tech", 6],
        ["Conceal/Reveal Object", 6],
        ["Cryptography", 6],
        ["Cybertech", 6],
        ["Electronics/Security Tech (x2)", 6],
        ["Handgun", 6],
        ["Library Search", 6],
      ];

    case "tech":
      return [
        ["Athletics", 2],
        ["Brawling", 2],
        ["Concentration", 2],
        ["Conversation", 2],
        ["Education", 6],
        ["Evasion", 6],
        ["First Aid", 6],
        ["Human Perception", 2],
        ["Streetslang", 2, "Language"],
        ["Your Home", 2, "Local Expert"],
        ["Perception", 2],
        ["Persuasion", 2],
        ["Stealth", 2],
        ["Basic Tech", 6],
        ["Cybertech", 6],
        ["Electronics/Security Tech (x2)", 6],
        ["Land Vehicle Tech", 6],
        ["Shoulder Arms", 6],
        ["Science (choose 1)", 6, "Science"],
        ["Weaponstech", 6],
      ];

    case "medtech":
      return [
        ["Athletics", 2],
        ["Brawling", 2],
        ["Concentration", 2],
        ["Conversation", 6],
        ["Education", 6],
        ["Evasion", 6],
        ["First Aid", 2],
        ["Human Perception", 6],
        ["Streetslang", 2, "Language"],
        ["Your Home", 2, "Local Expert"],
        ["Perception", 2],
        ["Persuasion", 2],
        ["Stealth", 2],
        ["Basic Tech", 6],
        ["Cybertech", 4],
        ["Deduction", 6],
        ["Paramedic (x2)", 6],
        ["Resist Torture/Drugs", 4],
        ["Science", 6],
        ["Shoulder Arms", 6],
      ];

    case "media":
      return [
        ["Athletics", 2],
        ["Brawling", 2],
        ["Concentration", 2],
        ["Conversation", 6],
        ["Education", 2],
        ["Evasion", 6],
        ["First Aid", 2],
        ["Human Perception", 6],
        ["Streetslang", 2, "Language"],
        ["Your Home", 6, "Local Expert"],
        ["Perception", 6],
        ["Persuasion", 6],
        ["Stealth", 2],
        ["Bribery", 6],
        ["Composition", 6],
        ["Deduction", 6],
        ["Handgun", 6],
        ["Library Search", 4],
        ["Lip Reading", 4],
        ["Photography/Film", 4],
      ];

    case "lawman":
      return [
        ["Athletics", 2],
        ["Brawling", 6],
        ["Concentration", 2],
        ["Conversation", 6],
        ["Education", 2],
        ["Evasion", 6],
        ["First Aid", 2],
        ["Human Perception", 2],
        ["Streetslang", 2, "Language"],
        ["Your Home", 2, "Local Expert"],
        ["Perception", 2],
        ["Persuasion", 2],
        ["Stealth", 2],
        ["Autofire (x2)", 6],
        ["Criminology", 6],
        ["Deduction", 6],
        ["Handgun", 6],
        ["Interrogation", 6],
        ["Shoulder Arms", 6],
        ["Tracking", 6],
      ];

    case "exec":
      return [
        ["Athletics", 2],
        ["Brawling", 2],
        ["Concentration", 2],
        ["Conversation", 6],
        ["Education", 6],
        ["Evasion", 6],
        ["First Aid", 2],
        ["Human Perception", 6],
        ["Streetslang", 2, "Language"],
        ["Your Home", 2, "Local Expert"],
        ["Perception", 2],
        ["Persuasion", 6],
        ["Stealth", 2],
        ["Accounting", 6],
        ["Bureaucracy", 6],
        ["Business", 6],
        ["Deduction", 6],
        ["Handgun", 6],
        ["Lip Reading", 6],
        ["Personal Grooming", 4],
      ];

    case "fixer":
      return [
        ["Athletics", 2],
        ["Brawling", 2],
        ["Concentration", 2],
        ["Conversation", 6],
        ["Education", 2],
        ["Evasion", 6],
        ["First Aid", 2],
        ["Human Perception", 6],
        ["Streetslang", 4, "Language"],
        ["Your Home", 6, "Local Expert"],
        ["Perception", 2],
        ["Persuasion", 4],
        ["Stealth", 2],
        ["Bribery", 6],
        ["Business", 6],
        ["Forgery", 6],
        ["Handgun", 6],
        ["Pick Lock", 4],
        ["Streetwise", 6],
        ["Trading", 6],
      ];

    case "nomad":
      return [
        ["Athletics", 2],
        ["Brawling", 6],
        ["Concentration", 2],
        ["Conversation", 2],
        ["Education", 2],
        ["Evasion", 6],
        ["First Aid", 6],
        ["Human Perception", 2],
        ["Streetslang", 2, "Language"],
        ["Your Home", 2, "Local Expert"],
        ["Perception", 4],
        ["Persuasion", 2],
        ["Stealth", 6],
        ["Animal Handling", 6],
        ["Drive Land Vehicle", 6],
        ["Handgun", 6],
        ["Melee Weapon", 6],
        ["Tracking", 6],
        ["Trading", 6],
        ["Wilderness Survival", 6],
      ];

    default:
      return [];
  }
}

// ---------------------------------------------------------------------------
// NPC threat tiers. The numbers are summary ranges (STAT totals, skill levels,
// armor, cyberware counts) used to generate NPCs at roughly the power of each
// tier; no published NPC is reproduced. statTotal sums the nine STATs other
// than LUCK.
// ---------------------------------------------------------------------------
const NPCB_TIER_ORDER = [
  "mook",
  "hardenedMook",
  "lieutenant",
  "hardenedLieutenant",
  "miniBoss",
  "hardenedMiniBoss",
  "boss",
];

const NPCB_TIERS = {
  mook: {
    label: "Mook",
    guidance:
      "Low threat. Roughly one per Edgerunner makes a fair fight the crew should win.",
    statTotal: [30, 37],
    statRange: [2, 7],
    skillScale: 0.75,
    keyLvl: [5, 6],
    maxLvl: 6,
    roleRank: 2,
    armor: ["Leathers", "Leathers", "Kevlar®"],
    quality: "Poor Quality",
    cyber: [0, 1],
    ammo: [20, 30],
    grenades: 0,
  },
  hardenedMook: {
    label: "Hardened Mook",
    guidance:
      "Low threat tuned for combat-heavy crews. Use about one per Edgerunner in place of regular Mooks, or mix a few in with them.",
    statTotal: [35, 41],
    statRange: [2, 7],
    skillScale: 0.9,
    keyLvl: [6, 7],
    maxLvl: 7,
    roleRank: 3,
    armor: ["Leathers", "Kevlar®", "Light Armorjack"],
    quality: "Poor Quality",
    cyber: [1, 1],
    ammo: [20, 40],
    grenades: 0,
  },
  lieutenant: {
    label: "Lieutenant",
    guidance:
      "Mid threat. Plan on about one for every two Edgerunners.",
    statTotal: [43, 50],
    statRange: [3, 8],
    skillScale: 1,
    keyLvl: [6, 7],
    maxLvl: 8,
    roleRank: 4,
    armor: ["Light Armorjack", "Light Armorjack", "Medium Armorjack"],
    quality: "",
    cyber: [1, 2],
    ammo: [30, 50],
    grenades: 1,
  },
  hardenedLieutenant: {
    label: "Hardened Lieutenant",
    guidance:
      "Mid threat tuned for combat-heavy crews. About one for every two Edgerunners; worth roughly two Hardened Mooks. Very dangerous to crews that aren't built for combat.",
    statTotal: [43, 52],
    statRange: [3, 8],
    skillScale: 1.1,
    keyLvl: [7, 8],
    maxLvl: 8,
    roleRank: 4,
    armor: ["Light Armorjack", "Light Armorjack", "Heavy Armorjack"],
    quality: "",
    cyber: [1, 2],
    ammo: [25, 80],
    grenades: 1,
  },
  miniBoss: {
    label: "Mini Boss",
    guidance:
      "High threat. Plan on about one for every three Edgerunners.",
    statTotal: [48, 54],
    statRange: [3, 8],
    skillScale: 1.2,
    keyLvl: [6, 8],
    maxLvl: 8,
    roleRank: 4,
    armor: ["Light Armorjack"],
    quality: "",
    cyber: [2, 3],
    ammo: [40, 60],
    grenades: 1,
  },
  hardenedMiniBoss: {
    label: "Hardened Mini Boss",
    guidance:
      "High threat tuned for combat-heavy crews. About one for every three Edgerunners, and avoid chaining several of these fights back to back.",
    statTotal: [58, 67],
    statRange: [4, 10],
    skillScale: 1.4,
    keyLvl: [8, 9],
    maxLvl: 9,
    roleRank: 6,
    armor: ["Light Armorjack"],
    quality: "Excellent Quality",
    cyber: [2, 4],
    ammo: [10, 100],
    grenades: 1,
  },
  boss: {
    label: "Boss",
    guidance:
      "A full boss fight on their own. Only field one when the crew is ready for it.",
    statTotal: [55, 58],
    statRange: [4, 10],
    skillScale: 1.3,
    keyLvl: [8, 9],
    maxLvl: 9,
    roleRank: 6,
    armor: [""],
    quality: "",
    cyber: [0, 0],
    ammo: [100, 100],
    grenades: 2,
    emp: [0, 2],
  },
};

// Role Ability name -> role (lowercase, matching the role records' names)
const NPCB_ROLE_ABILITIES = {
  "charismatic impact": "rockerboy",
  "combat awareness": "solo",
  interface: "netrunner",
  maker: "tech",
  medicine: "medtech",
  credibility: "media",
  teamwork: "exec",
  backup: "lawman",
  operator: "fixer",
  moto: "nomad",
};

const NPCB_ROLES = [
  "rockerboy",
  "solo",
  "netrunner",
  "tech",
  "medtech",
  "media",
  "exec",
  "lawman",
  "fixer",
  "nomad",
];

// Armor choices -> the item names they add (both locations for suits)
const NPCB_ARMOR = {
  Leathers: { sp: 4, items: ["Leathers (body)", "Leathers (head)"] },
  "Kevlar®": { sp: 7, items: ["Kevlar® (body)", "Kevlar® (head)"] },
  "Light Armorjack": {
    sp: 11,
    items: ["Light Armorjack (body)", "Light Armorjack (head)"],
  },
  "Bodyweight Suit": { sp: 11, items: ["Bodyweight Suit"] },
  "Medium Armorjack": {
    sp: 12,
    items: ["Medium Armorjack (body)", "Medium Armorjack (head)"],
  },
  "Heavy Armorjack": {
    sp: 13,
    items: ["Heavy Armorjack (body)", "Heavy Armorjack (head)"],
  },
  Flak: { sp: 15, items: ["Flak (body)", "Flak (head)"] },
  "Metalgear®": { sp: 18, items: ["Metalgear® (body)", "Metalgear® (head)"] },
  "Subdermal Armor": { sp: 11, items: ["Subdermal Armor"] },
};

// ---------------------------------------------------------------------------
// Gang flavor: equipment and skill changes layered on top of a generated or
// pasted NPC. Armor only ever upgrades.
// replace: [pattern, replacement, addIfMissing]
// ---------------------------------------------------------------------------
const NPCB_GANGS = {
  bozos: {
    label: "Bozos",
    armor: "Light Armorjack",
    replace: [[/^rippers$/i, "Big Knucks", true]],
    addWeapons: ["Very Heavy Melee Weapon"],
  },
  ironSights: {
    label: "Iron Sights",
    replace: [
      [/^poor quality (very heavy|vh) pistol$/i, "SMG"],
      [/^rippers$/i, "@cyberweapon"],
    ],
  },
  inquisitors: {
    label: "Inquisitors",
    removeArmor: ["Leathers"],
    replace: [[/^rippers$/i, "Medium Melee Weapon"]],
    remove: [/^techhair$/i],
  },
  maelstrom: {
    label: "Maelstrom",
    armor: "Medium Armorjack",
    replace: [[/^rippers$/i, "Wolvers", true]],
  },
  philharmonicVampires: {
    label: "Philharmonic Vampires",
    skills: [["Electronics/Security Tech", 10]],
  },
  piranhas: {
    label: "Piranhas",
    armor: "Light Armorjack",
  },
  primetimePlayers: {
    label: "Primetime Players",
    addWeapons: ["Shotgun"],
    addGear: ["Slug Ammo x20"],
    skills: [["Shoulder Arms", 10]],
  },
  redChromeLegion: {
    label: "Red Chrome Legion",
    armor: "Medium Armorjack",
    addWeapons: ["Assault Rifle"],
    skills: [["Shoulder Arms", 10]],
  },
  sixthStreet: {
    label: "6th Street",
    armor: "Medium Armorjack",
    replace: [[/^rippers$/i, "Heavy SMG"]],
  },
  tygerClaws: {
    label: "Tyger Claws",
    armor: "Light Armorjack",
    addWeapons: ["Heavy Melee Weapon"],
  },
  voodooBoys: {
    label: "Voodoo Boys",
    replace: [[/^poor quality (very heavy|vh) pistol$/i, "SMG"]],
    addGear: ["Teargas Grenade x1"],
  },
  nomads: {
    label: "Nomads",
    replace: [[/^crossbow$/i, "Assault Rifle"]],
    addGear: ["Light Tattoo"],
    renameSkills: [["Archery", "Shoulder Arms"]],
  },
};

const NPCB_CYBERWEAPONS = [
  "Wolvers",
  "Big Knucks",
  "Scratchers",
  "Rippers",
  "Slice 'N Dice",
];

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
const NPCB_NL = String.fromCharCode(10);

function npcbRandInt(min, max, rng) {
  const r = rng || Math.random;
  return min + Math.floor(r() * (max - min + 1));
}

function npcbPick(list, rng) {
  const r = rng || Math.random;
  return list[Math.floor(r() * list.length)];
}

// Pick n distinct entries
function npcbPickSome(list, n, rng) {
  const pool = [...list];
  const out = [];
  while (pool.length > 0 && out.length < n) {
    out.push(pool.splice(Math.floor((rng || Math.random)() * pool.length), 1)[0]);
  }
  return out;
}

// Instant d10 (no dice animation). Tests pass their own rng.
function npcbD10(rng) {
  if (rng) {
    return npcbRandInt(1, 10, rng);
  }
  const roll = api.rollInstant("1d10");
  return roll?.total || npcbRandInt(1, 10);
}

function npcbTierOrDefault(tier) {
  return NPCB_TIERS[tier] ? tier : "mook";
}

// Split a book line on commas, bullets, semicolons and newlines that are not
// inside parentheses. Pieces separated by a bare newline are flagged so the
// resolver can re-join names that wrapped across lines.
function npcbSplitTop(text, keepNewlineFlag) {
  const out = [];
  let depth = 0;
  let cur = "";
  let sawNewline = false;
  const push = (nl) => {
    const s = cur.trim();
    if (s) {
      out.push(keepNewlineFlag ? { text: s, nl: sawNewline } : s);
    }
    cur = "";
    sawNewline = nl;
  };
  for (const ch of String(text || "")) {
    if (ch === "(") depth++;
    if (ch === ")") depth = Math.max(0, depth - 1);
    const isNewline = ch === NPCB_NL || ch === String.fromCharCode(13);
    if (depth === 0 && (ch === "," || ch === "•" || ch === ";" || isNewline)) {
      // A newline right after a comma is just a line wrap of the list
      if (isNewline && cur.trim() === "") {
        continue;
      }
      push(isNewline);
      continue;
    }
    cur += ch;
  }
  push(false);
  return out;
}

// Undo PDF line-break hyphenation ("Incen- diary") and strip stat block labels
function npcbCleanPaste(text) {
  return String(text || "")
    .replace(/&amp;/g, "&")
    .replace(/([a-z])-\s+([a-z])/g, "$1$2")
    .replace(/▶/g, " ")
    .replace(/^\s*(skill bases|cyberware\s*(&|and)\s*special equipment|role ability|weapons)\s*:?/i, "")
    .trim();
}

// ---------------------------------------------------------------------------
// Name normalization / fuzzy matching
// ---------------------------------------------------------------------------
function npcbNorm(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/&amp;/g, "&")
    .replace(/[®™©]/g, "")
    .replace(/[’‘`]/g, "'")
    .replace(/&/g, " and ")
    .replace(/[-/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function npcbStem(word) {
  if (word.length > 3 && /s$/.test(word) && !/(ss|us|is)$/.test(word)) {
    return word.slice(0, -1);
  }
  return word;
}

function npcbKey(s) {
  return npcbNorm(s)
    .replace(/[(),.:'!]/g, " ")
    .split(" ")
    .filter((w) => w)
    .map(npcbStem)
    .join(" ");
}

// "Rippers (Medium Melee Weapon)" -> "Rippers", "Cybereye, Left" -> "Cybereye"
function npcbBaseName(name) {
  return String(name || "")
    .replace(/\s*\([^)]*\)\s*$/, "")
    .replace(
      /,\s*(left|right|poor quality|excellent quality|standard quality)\s*$/i,
      ""
    )
    .trim();
}

// Sorensen-Dice coefficient over character bigrams
function npcbDice(a, b) {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const grams = new Map();
  for (let i = 0; i < a.length - 1; i++) {
    const g = a.substr(i, 2);
    grams.set(g, (grams.get(g) || 0) + 1);
  }
  let hits = 0;
  for (let i = 0; i < b.length - 1; i++) {
    const g = b.substr(i, 2);
    const c = grams.get(g) || 0;
    if (c > 0) {
      grams.set(g, c - 1);
      hits++;
    }
  }
  return (2 * hits) / (a.length - 1 + b.length - 1);
}

// Book spellings that no general rule can bridge, keyed on npcbKey()
const NPCB_ALIASES = [
  [/^low ?light.*uv$/, "Low Light/Infrared/UV"],
  [/^level damp/, "Level Damper"],
  [/^kerenzikov/, "Kerenzikov"],
  [/^sandevistan/, "Sandevistan"],
  [/^cyberdeck$/, "Cyberdeck (Standard Quality)"],
  [/^tech ?hair$/, "Techhair"],
  [/^grafted muscle( and bone lace)?$/, "Grafted Muscle and Bone Lace"],
  [/^tent( and camping equipment)?$/, "Tent & Camping Equipment"],
  [/^bulletproof shield$/, "Bulletproof Shield"],
  [/^subdermal( armor)?$/, "Subdermal Armor"],
];

// Higher wins; 0 = never match in this context
const NPCB_TYPE_PREFS = {
  gear: {
    cyberware: 2,
    "ranged weapon": 1,
    "melee weapon": 1,
    "weapon attachment": 1,
    fashion: 0,
    "black ice": 0,
    demon: 0,
    "*": 3,
  },
  option: { cyberware: 3, "*": 1 },
  weapon: {
    cyberware: 4,
    "ranged weapon": 3,
    "melee weapon": 3,
    "weapon attachment": 2,
    "*": 0,
  },
  attachment: { "weapon attachment": 3, "*": 0 },
  program: { "program or hardware": 3, "black ice": 2, demon: 2, "*": 0 },
  armor: { armor: 3, cyberware: 2, gear: 2, "*": 0 },
  ammo: { ammo: 3, "*": 0 },
};

// Build a lookup index from item records ({name, data: {type, ammoType}}) or
// flat {name, type, ammoType} rows.
function npcbBuildIndex(items) {
  return (items || [])
    .filter((it) => it && it.name)
    .map((it) => {
      const base = npcbBaseName(it.name);
      const key = npcbKey(it.name);
      const baseKey = npcbKey(base);
      const sideMatch = it.name.match(/,\s*(left|right)\s*$/i);
      return {
        name: it.name,
        type: (it.data ? it.data.type : it.type) || null,
        ammoType: it.data ? it.data.ammoType : it.ammoType,
        cyberwareInstallSlot: it.data
          ? it.data.cyberwareInstallSlot
          : it.slot,
        key,
        baseKey,
        squash: key.replace(/ /g, ""),
        baseSquash: baseKey.replace(/ /g, ""),
        sorted: key.split(" ").sort().join(" "),
        side: sideMatch ? sideMatch[1].toLowerCase() : "",
      };
    });
}

// Find the best item for a name in a context. Returns
// { entry, how: "alias"|"exact"|"name"|"fuzzy", score } or null.
function npcbFindItem(name, ctx, index) {
  const key = npcbKey(name);
  if (!key) return null;
  const prefs = NPCB_TYPE_PREFS[ctx] || NPCB_TYPE_PREFS.gear;
  const typeScore = (e) => {
    const t = e.type === null ? "null" : e.type;
    return prefs[t] !== undefined ? prefs[t] : prefs["*"];
  };

  for (const [pattern, target] of NPCB_ALIASES) {
    if (pattern.test(key)) {
      const hit = index.find((e) => e.name === target);
      if (hit) return { entry: hit, how: "alias", score: 1 };
    }
  }

  const allowed = index.filter((e) => typeScore(e) > 0);
  const squash = key.replace(/ /g, "");
  const sorted = key.split(" ").sort().join(" ");
  const candidates = [];
  allowed.forEach((e) => {
    let m = 0;
    if (e.key === key) m = 4;
    else if (e.baseKey === key) m = 3;
    else if (e.squash === squash || e.baseSquash === squash) m = 2;
    else if (e.sorted === sorted) m = 2;
    if (m > 0) candidates.push({ e, m });
  });

  if (candidates.length > 0) {
    candidates.sort((a, b) => {
      const ts = typeScore(b.e) - typeScore(a.e);
      if (ts !== 0) return ts;
      if (b.m !== a.m) return b.m - a.m;
      // Prefer real items over templates, standard over odd variants
      const odd = (e) =>
        (/template/i.test(e.name) ? 2 : 0) +
        (/poor quality|excellent quality/i.test(e.name) ? 1 : 0);
      if (odd(a.e) !== odd(b.e)) return odd(a.e) - odd(b.e);
      return a.e.name.length - b.e.name.length;
    });
    const best = candidates[0];
    return { entry: best.e, how: best.m >= 3 ? "exact" : "name", score: 1 };
  }

  // Fuzzy fallback
  let best = null;
  allowed.forEach((e) => {
    const d = Math.max(npcbDice(squash, e.squash), npcbDice(squash, e.baseSquash));
    if (
      !best ||
      d > best.d ||
      (d === best.d && typeScore(e) > typeScore(best.e))
    ) {
      best = { e, d };
    }
  });
  if (best && best.d >= 0.8) {
    return { entry: best.e, how: "fuzzy", score: best.d };
  }
  return null;
}

// All sided variants of a foundational ("Cybereye, Left" / "Cybereye, Right")
function npcbSidedVariants(entry, index) {
  if (!entry || !entry.side) return null;
  const variants = index.filter(
    (e) => e.baseKey === entry.baseKey && e.side && e.type === entry.type
  );
  const left = variants.find((e) => e.side === "left");
  const right = variants.find((e) => e.side === "right");
  return left && right ? { left, right } : null;
}

// ---------------------------------------------------------------------------
// Skills
// ---------------------------------------------------------------------------
const NPCB_SKILL_ALIASES = {
  "melee weapons": "Melee Weapon",
  "resist torture/drug": "Resist Torture/Drugs",
  "resist torture / drugs": "Resist Torture/Drugs",
  demolition: "Demolitions",
  "electronic/security tech": "Electronics/Security Tech",
  "weapons tech": "Weaponstech",
  "weapon tech": "Weaponstech",
  "wardrobe and style": "Wardrobe & Style",
  "conceal/reveal": "Conceal/Reveal Object",
};

let npcbSkillLookupCache = null;
function npcbSkillLookup() {
  if (!npcbSkillLookupCache) {
    npcbSkillLookupCache = {};
    getAllSkills().forEach((group) => {
      group.skills.forEach((skill) => {
        const name = skill.name.replace(/\s*\(x2\)\s*$/i, "").trim();
        npcbSkillLookupCache[name.toLowerCase()] = {
          name,
          stat: skill.stat,
          hasSubskills: !!skill.hasSubskills,
        };
      });
    });
  }
  return npcbSkillLookupCache;
}

// "melee weapons" -> {name: "Melee Weapon", stat: "dex", known: true}
// "Language (Native)" -> {name: "Language (Native)", stat: "int", known: true}
function npcbCanonicalSkill(rawName) {
  const lookup = npcbSkillLookup();
  let name = String(rawName || "")
    .replace(/\s*\/\s*/g, "/")
    .replace(/\s*\(x2\)\s*/i, " ")
    .replace(/\s+/g, " ")
    .trim();
  const alias = NPCB_SKILL_ALIASES[name.toLowerCase()];
  if (alias) name = alias;
  const direct = lookup[name.toLowerCase()];
  if (direct) return { name: direct.name, stat: direct.stat, known: true };
  const sub = name.match(/^(.*?)\s*\((.+)\)$/);
  if (sub) {
    const parent = lookup[sub[1].trim().toLowerCase()];
    if (parent && parent.hasSubskills) {
      return {
        name: `${parent.name} (${sub[2].trim()})`,
        stat: parent.stat,
        known: true,
      };
    }
  }
  return { name, stat: "int", known: false };
}

// Parse a "Skill Bases" line. The first number after a skill is its BASE
// (STAT + level); "10 (8)" is the base before/after an armor penalty, and we
// keep the unpenalized one. Role Abilities found in the line are returned
// separately. Returns { skills, roles, problems }.
function npcbParseSkillText(text) {
  const skills = [];
  const roles = [];
  const problems = [];
  const cleaned = npcbCleanPaste(text)
    .split(String.fromCharCode(13))
    .join(" ")
    .split(NPCB_NL)
    .join(" ");
  const single = /^(.+?)\s*(\d+)\s*(?:\((\d+)\))?\s*(\([^)]*\))?\s*$/;
  const multi = /([A-Za-z][^\d]*?)\s*(\d+)(?:\s*\((\d+)\))?/g;

  const add = (rawName, base, detail, penalized) => {
    const lower = rawName.trim().toLowerCase();
    if (NPCB_ROLE_ABILITIES[lower]) {
      roles.push({
        role: NPCB_ROLE_ABILITIES[lower],
        ability: rawName.trim(),
        rank: base,
        detail: detail || "",
      });
      return;
    }
    const skill = npcbCanonicalSkill(rawName);
    const existing = skills.find(
      (s) => s.name.toLowerCase() === skill.name.toLowerCase()
    );
    // "10 (8)": 10 before the armor penalty, 8 after it
    const after = penalized !== undefined && penalized !== null && penalized !== ""
      ? parseInt(penalized, 10)
      : null;
    if (existing) {
      existing.base = base;
      existing.penalizedBase = after;
    } else {
      skills.push({ ...skill, base, penalizedBase: after });
    }
  };

  npcbSplitTop(cleaned).forEach((entry) => {
    // Two numbers outside parentheses = two skills run together by a line
    // wrap ("Language (Native) 5 Martial Arts (Karate) 10")
    const numbers = entry.replace(/\([^)]*\)/g, " ").match(/\d+/g) || [];
    const m = numbers.length > 1 ? null : entry.match(single);
    if (m) {
      add(m[1], parseInt(m[2], 10), m[4], m[3]);
      return;
    }
    const pairs = [...entry.matchAll(multi)];
    if (pairs.length > 0) {
      pairs.forEach((p) => add(p[1], parseInt(p[2], 10), "", p[3]));
    } else {
      problems.push(entry);
    }
  });
  return { skills, roles, problems };
}

// "Combat Awareness 4, Maker 2 (Upgrade Expertise 2...)" -> roles
function npcbParseRoleAbilities(text) {
  const parsed = npcbParseSkillText(text);
  return {
    roles: parsed.roles,
    problems: [
      ...parsed.problems,
      ...parsed.skills.map((s) => `${s.name} ${s.base}`),
    ],
  };
}

function npcbStatValue(stats, stat) {
  return parseInt(stats?.[stat] || 0, 10) || 0;
}

// Build NPC sheet skill entries; level = base - STAT (never below 0)
function npcbBuildSkills(parsedSkills, stats) {
  return parsedSkills.map((s) => {
    const lvl = Math.max(s.base - npcbStatValue(stats, s.stat), 0);
    return {
      _id: generateUuid(),
      name: s.name,
      unidentifiedName: s.name,
      data: { base: s.base, lvl, stat: s.stat },
    };
  });
}

function npcbSkillsToText(skills) {
  return skills.map((s) => `${s.name} ${s.base}`).join(", ");
}

// ---------------------------------------------------------------------------
// Gear / weapon lines
// ---------------------------------------------------------------------------
function npcbStripCount(text) {
  const m = String(text).match(/^(.*?)\s*\bx\s*(\d+)\s*$/i);
  if (m && m[1]) return { name: m[1].trim(), count: parseInt(m[2], 10) };
  return { name: String(text).trim(), count: 1 };
}

// One list entry -> { raw, name, count, children: [{name, count}], program }
//   "Cybereye x2 (Anti-Dazzle x2)", "Cyberaudio Suite w/ Level Dampners",
//   "Cybereye x2 w/ Lowlight/Infrared/UV & Targeting Scope",
//   "Flamethrower Ammo (Incendiary Shotgun Shells) x8"
function npcbParseEntry(raw) {
  let text = raw.replace(/\s+/g, " ").trim();
  let children = [];
  let parenText = "";
  const paren = text.match(/^(.*?)\s*\((.*)\)\s*(x\s*\d+)?\s*$/i);
  if (paren && paren[1]) {
    text = `${paren[1]}${paren[3] ? " " + paren[3] : ""}`.trim();
    parenText = paren[2];
    children = npcbSplitTop(paren[2]);
  }
  const withMatch = text.match(/^(.*?)\s+w\/\s*(.+)$/i);
  if (withMatch) {
    text = withMatch[1].trim();
    children = children.concat(
      withMatch[2]
        .split(/\s+(?:&|and)\s+|\s*&\s*/i)
        .map((s) => s.trim())
        .filter((s) => s)
    );
  }
  const parent = npcbStripCount(text);
  return {
    raw: raw.trim(),
    name: parent.name,
    count: parent.count,
    parenText,
    children: children.map((c) => npcbStripCount(c)),
  };
}

// Split a gear/weapon line into entries. "Programs:" switches the rest of the
// line into program context. Text after a closing parenthesis that isn't a
// count is a missing comma ("Bulletproof Shield (10 HP) Binoculars").
function npcbParseList(text) {
  const entries = [];
  let programMode = false;
  npcbSplitTop(npcbCleanPaste(text), true).forEach(({ text: piece, nl }) => {
    let s = piece;
    const prog = s.match(/^(cyberdeck\s+)?programs?\s*:\s*(.*)$/i);
    if (prog) {
      programMode = true;
      s = prog[2];
      if (!s) return;
    }
    const split = s.match(/^(.*?\))\s+(?!x\s*\d)([A-Za-z].*)$/i);
    const pieces = split ? [split[1], split[2]] : [s];
    pieces.forEach((p, i) => {
      entries.push({
        ...npcbParseEntry(p),
        program: programMode,
        nl: i === 0 ? nl : false,
      });
    });
  });
  return entries;
}

// Ammo ------------------------------------------------------------------------
const NPCB_AMMO_VARIANTS = [
  [/^(armor piercing|armour piercing|ap)\b/, "Armor-Piercing"],
  [/^basic\b/, "Basic"],
  [/^expansive\b/, "Expansive"],
  [/^incendiary\b/, "Incendiary"],
  [/^rubber\b/, "Rubber"],
  [/^smart\b/, "Smart"],
  [/^biotoxin\b/, "Biotoxin"],
  [/^poison\b/, "Poison"],
  [/^sleep\b/, "Sleep"],
  [/^emp\b/, "EMP"],
  [/^flashbang\b/, "Flashbang"],
  [/^smoke\b/, "Smoke"],
  [/^tear ?gas\b/, "Teargas"],
];

// Class keywords -> the suffix used by the ammo item names
const NPCB_AMMO_CLASSES = [
  [/\bflamethrower\b/, "Flamethrower"],
  [/\b(very heavy|vh) pistol\b/, "VH Pistol"],
  [/\b(heavy|h) pistol\b/, "H Pistol"],
  [/\b(medium|m) pistol\b/, "M Pistol"],
  [/\bpistol\b/, "Pistol"],
  [/\brifle\b/, "Rifle"],
  [/\bslug\b/, "Slug"],
  [/\bshell\b/, "Shell"],
  [/\barrow\b/, "Arrow"],
  [/\bgrenade\b/, "Grenade"],
  [/\brocket\b/, "Rocket"],
  [/\bpaint ?ball\b/, "Paint Ball"],
];

// Weapon (book or item name) -> ammo class it fires
const NPCB_WEAPON_AMMO = [
  [/flamethrower/, "Flamethrower"],
  [/very heavy pistol|\bvh pistol/, "VH Pistol"],
  [/heavy smg/, "H Pistol"],
  [/heavy pistol/, "H Pistol"],
  [/medium pistol|\bsmg\b/, "M Pistol"],
  [/assault rifle|sniper rifle/, "Rifle"],
  [/shotgun(?! underbarrel)/, "Slug"],
  [/crossbow|\bbow\b/, "Arrow"],
  [/grenade launcher/, "Grenade"],
  [/rocket launcher/, "Rocket"],
  [/air pistol/, "Paint Ball"],
];

const NPCB_ITEM_AMMO_TYPES = {
  "vh pistol": "VH Pistol",
  "h pistol": "H Pistol",
  "m pistol": "M Pistol",
  rifle: "Rifle",
  arrow: "Arrow",
  grenade: "Grenade",
  rocket: "Rocket",
  slug: "Slug",
  "shotgun shell": "Shell",
};

function npcbWeaponAmmoClass(weaponName) {
  const n = npcbNorm(weaponName);
  for (const [pattern, cls] of NPCB_WEAPON_AMMO) {
    if (pattern.test(n)) return cls;
  }
  return "";
}

// Is this list entry ammo? -> { variant, cls } (cls may be "" = infer).
// A bare "Rifle x40" is ammo; a bare "Very Heavy Pistol" is the gun.
function npcbParseAmmo(name, count) {
  let n = npcbNorm(name);
  const isAmmoWord = /\b(ammo|ammunition|rounds?|fuel)\b/.test(n);
  const endsAmmo =
    /\b(grenade|rocket|slug|shell|arrow|paint ?ball)s?$/.test(n) &&
    !/launcher|underbarrel/.test(n);
  const bareClass =
    count > 1 &&
    /^((very heavy|vh|heavy|h|medium|m) )?(pistol|rifle)$/.test(n);
  if (!isAmmoWord && !endsAmmo && !bareClass) return null;
  n = n
    .replace(/\b(ammo|ammunition|rounds?|fuel)\b/g, " ")
    .replace(/\b(grenade|rocket|slug|shell|arrow)s\b/g, "$1")
    .replace(/\bshotgun (slug|shell)/, "$1")
    .replace(/\s+/g, " ")
    .trim();
  let variant = "";
  for (const [pattern, label] of NPCB_AMMO_VARIANTS) {
    if (pattern.test(n)) {
      variant = label;
      n = n.replace(pattern, "").trim();
      break;
    }
  }
  let cls = "";
  let rest = n;
  for (const [pattern, label] of NPCB_AMMO_CLASSES) {
    if (pattern.test(n)) {
      cls = label;
      rest = n.replace(pattern, "").trim();
      break;
    }
  }
  // Words we don't recognize ("Smok Grenade") mean a misspelled or unknown
  // variant: the caller must not quietly treat it as the default round
  const unknown = !variant && rest.replace(/\b(shotgun|ammo)\b/g, "").trim() !== "";
  return { variant, cls, unknown };
}

// Canonical ammo item name for a class + variant ("" class resolved from the
// NPC's weapons first)
function npcbAmmoItemName(ammo, weaponClasses) {
  let cls = ammo.cls;
  const variant = ammo.variant || "Basic";
  if (cls === "Flamethrower") return "Incendiary Flamethrower Shell";
  if (cls === "Pistol") {
    cls =
      weaponClasses.find((c) => /Pistol$/.test(c)) || "VH Pistol";
  }
  if (!cls) {
    cls =
      weaponClasses.find((c) => c !== "Grenade" && c !== "Rocket") ||
      weaponClasses[0] ||
      "Rifle";
  }
  if (cls === "Flamethrower") return "Incendiary Flamethrower Shell";
  if (cls === "Grenade" || cls === "Rocket") {
    return `${ammo.variant || "Armor-Piercing"} ${cls}`;
  }
  if (cls === "Paint Ball") {
    return ammo.variant ? `Paint Ball (${ammo.variant})` : "Paint Ball";
  }
  return `${variant} ${cls}`;
}

// Ammo class from an ammo item name ("Basic VH Pistol" -> "VH Pistol")
function npcbAmmoNameClass(itemName) {
  const n = String(itemName || "");
  if (/flamethrower/i.test(n)) return "Flamethrower";
  const m = n.match(/(VH Pistol|H Pistol|M Pistol|Rifle|Slug|Shell|Arrow|Grenade|Rocket)$/i);
  return m ? m[1] : "";
}

// ---------------------------------------------------------------------------
// Resolve a wizard spec into a list of inventory lines (no API calls)
// ---------------------------------------------------------------------------
// "Leather", "Kevlar", "L Armorjack" -> an NPCB_ARMOR key ("" if not armor)
function npcbArmorChoice(name) {
  const squash = npcbKey(
    String(name)
      .replace(/^L\s+(?=armorjack)/i, "Light ")
      .replace(/^M\s+(?=armorjack)/i, "Medium ")
      .replace(/^H\s+(?=armorjack)/i, "Heavy ")
      .replace(/\s+(body\s+)?armou?r$/i, "")
  ).replace(/ /g, "");
  return (
    Object.keys(NPCB_ARMOR).find(
      (choice) =>
        choice !== "Subdermal Armor" &&
        choice !== "Bodyweight Suit" &&
        npcbKey(choice).replace(/ /g, "") === squash
    ) || ""
  );
}

// "Popup Heavy SMG" -> "Popup Heavy SMG" (canonical capitalization kept)
function npcbPopupName(name) {
  return String(name).trim().replace(/^pop-?up\s+/i, "Popup ");
}

// Popup cyberweapons with no item of their own ("Popup Heavy SMG") are built
// from the Popup Ranged/Melee Weapon template with that weapon attached.
// Returns a resolver line or null.
function npcbPopupLine(name, source, index) {
  const m = String(name).trim().match(/^pop-?up\s+(.+)$/i);
  if (!m) return null;
  const existing = npcbFindItem(name, "option", index);
  if (existing && existing.how !== "fuzzy") return null;
  const weapon = npcbFindWeapon(m[1], index);
  if (
    !weapon ||
    weapon.how === "fuzzy" ||
    (weapon.entry.type !== "ranged weapon" && weapon.entry.type !== "melee weapon")
  ) {
    return null;
  }
  const templateName =
    weapon.entry.type === "ranged weapon"
      ? "Popup Ranged Weapon (Template)"
      : "Popup Melee Weapon (Template)";
  const template = index.find((e) => e.name === templateName);
  if (!template) return null;
  return {
    source,
    itemName: npcbPopupName(name),
    count: 1,
    ctx: "option",
    how: "built",
    cyber: true,
    slot: template.cyberwareInstallSlot || "cyberarms",
    popup: { template: templateName, weapon: weapon.entry.name },
  };
}

// An ammo variant with no item of its own ("Incendiary Rocket") is built from
// an existing round of the same class (Armor-Piercing Rocket) with the
// variant's traits taken from another ammo of that variant (Incendiary
// Grenade). Returns {base, donor} or null.
function npcbAmmoRecipe(ammoName, index) {
  const cls = npcbAmmoNameClass(ammoName);
  const variant = String(ammoName).slice(0, -cls.length).trim();
  if (!cls || !variant || variant === "Basic") return null;
  const ammo = index.filter((e) => e.type === "ammo");
  const sameClass = ammo.filter((e) => npcbAmmoNameClass(e.name) === cls);
  const base =
    sameClass.find((e) => /^basic /i.test(e.name)) ||
    sameClass.sort((a, b) => a.name.localeCompare(b.name))[0];
  const donors = ammo.filter(
    (e) =>
      npcbKey(e.name).indexOf(npcbKey(variant) + " ") === 0 &&
      npcbAmmoNameClass(e.name) !== cls
  );
  // Explosive rounds borrow from explosive rounds, shotgun ammo from shotgun
  const family = (c) =>
    c === "Grenade" || c === "Rocket"
      ? "explosive"
      : c === "Shell" || c === "Slug"
      ? "shotgun"
      : "bullet";
  const donor =
    donors.find((e) => family(npcbAmmoNameClass(e.name)) === family(cls)) ||
    donors[0];
  if (!base || !donor) return null;
  return { base: base.name, donor: donor.name };
}

const NPCB_NOT_ITEMS =
  /^(martial arts strike|brawling|brawling strike|unarmed|weapons?|armou?r|head|body|cyberware|special equipment)$/i;
const NPCB_SLOT_FAMILY = {
  cyberoptics: "cybereye",
  cyberaudio: "cyberaudio suite",
  neuralware: "neural link",
  chipware: "neural link",
  cyberarms: "cyberarm",
  cyberlegs: "cyberleg",
};

function npcbQualityName(name) {
  const m = String(name).match(/^(poor|excellent) quality\s+(.+)$/i);
  if (!m) return null;
  return { quality: m[1].toLowerCase(), base: m[2].trim() };
}

function npcbExpandWeaponName(name) {
  return String(name)
    .replace(/\bVH\b/i, "Very Heavy")
    .replace(/^H Pistol$/i, "Heavy Pistol")
    .replace(/^M Pistol$/i, "Medium Pistol");
}

// Resolve a weapon name, handling "Poor Quality X" -> "X, Poor Quality"
function npcbFindWeapon(name, index) {
  const expanded = npcbExpandWeaponName(name);
  const q = npcbQualityName(expanded);
  if (q) {
    const label = q.quality === "poor" ? "Poor Quality" : "Excellent Quality";
    const exact = npcbFindItem(`${q.base}, ${label}`, "weapon", index);
    if (exact && exact.how !== "fuzzy") return exact;
    const base = npcbFindItem(q.base, "weapon", index);
    if (base) {
      return { ...base, how: "fuzzy", note: `${label} per source; no ${label} item found` };
    }
    return null;
  }
  return npcbFindItem(expanded, "weapon", index);
}

// spec: { armor, weaponsText, gearText }
// Returns { lines: [...], weaponClasses: [...] } where each line is
//   { source, itemName, count, ctx, how, score, note, side, carried,
//     placeholderType, attachTo }
function npcbResolveSpec(spec, index) {
  const lines = [];
  const seenCyberNames = new Set();
  const weaponClasses = [];

  const addLine = (line) => {
    lines.push({
      side: "",
      note: "",
      how: line.itemName && !line.placeholder ? line.how : "new",
      ...line,
    });
  };

  // Armor ------------------------------------------------------------------
  const armor = NPCB_ARMOR[spec.armor];
  if (armor) {
    armor.items.forEach((itemName) => {
      const hit = npcbFindItem(itemName, "armor", index);
      addLine({
        source: spec.armor,
        itemName: hit ? hit.entry.name : itemName,
        count: 1,
        ctx: "armor",
        how: hit ? hit.how : "new",
        placeholder: !hit,
        placeholderType: "armor",
      });
      if (hit && hit.entry.type === "cyberware") {
        seenCyberNames.add(hit.entry.name);
      }
    });
  }

  // Gear first pass: note cyberware so weapon-line cyberweapons dedupe ------
  const gearEntries = npcbParseList(spec.gearText);
  const notePopups = (name) => {
    if (npcbPopupLine(name, name, index)) seenCyberNames.add(npcbPopupName(name));
  };
  gearEntries.forEach((e) => {
    const hit = npcbFindItem(e.name, "gear", index);
    if (hit && hit.entry.type === "cyberware") {
      seenCyberNames.add(npcbBaseName(hit.entry.name));
    }
    notePopups(e.name);
    e.children.forEach((c) => notePopups(c.name));
  });

  // Weapons ----------------------------------------------------------------
  npcbParseList(spec.weaponsText).forEach((e) => {
    if (NPCB_NOT_ITEMS.test(e.name)) return;
    const popup = npcbPopupLine(e.name, e.raw, index);
    if (popup) {
      // Popup cyberweapons are cyberware; add only if the gear line hasn't
      if (seenCyberNames.has(popup.itemName)) return;
      seenCyberNames.add(popup.itemName);
      addLine(popup);
      return;
    }
    const hit = npcbFindWeapon(e.name, index);
    if (hit && hit.entry.type === "cyberware") {
      // Cyberweapons come from the gear line; add only if it isn't there
      if (seenCyberNames.has(npcbBaseName(hit.entry.name))) return;
      seenCyberNames.add(npcbBaseName(hit.entry.name));
    }
    const cls = hit
      ? NPCB_ITEM_AMMO_TYPES[hit.entry.ammoType] ||
        npcbWeaponAmmoClass(hit.entry.name)
      : npcbWeaponAmmoClass(e.name);
    if (cls && !weaponClasses.includes(cls)) weaponClasses.push(cls);
    addLine({
      source: e.raw,
      itemName: hit ? hit.entry.name : npcbExpandWeaponName(e.name),
      count: e.count,
      ctx: "weapon",
      how: hit ? hit.how : "new",
      score: hit?.score,
      note: hit?.note || "",
      placeholder: !hit,
      placeholderType: /melee|knife|sword|bat|axe/i.test(e.name)
        ? "melee weapon"
        : "ranged weapon",
      weaponClass: cls,
    });
    e.children.forEach((c) => {
      // "Drum Magazine" exists once per weapon: "Drum Magazine (Assault Rifle)"
      const baseWeapon = hit ? npcbBaseName(hit.entry.name) : e.name;
      const specific = npcbFindItem(`${c.name} (${baseWeapon})`, "attachment", index);
      const att =
        specific && specific.how !== "fuzzy"
          ? specific
          : npcbFindItem(c.name, "attachment", index);
      addLine({
        source: `${e.name} w/ ${c.name}`,
        itemName: att ? att.entry.name : c.name,
        count: c.count,
        ctx: "attachment",
        how: att ? att.how : "new",
        placeholder: !att,
        placeholderType: "weapon attachment",
      });
    });
  });

  // Gear -------------------------------------------------------------------
  let lastFoundational = {};
  const resolveGearEntry = (e) => {
    const out = [];
    const ammo = e.program ? null : npcbParseAmmo(e.name, e.count);
    if (ammo) {
      // Variant may sit in the parenthetical: "(Incendiary Shotgun Shells)"
      if (!ammo.variant && e.parenText) {
        const inner = npcbParseAmmo(`${e.parenText} ammo`);
        if (inner?.variant) ammo.variant = inner.variant;
      }
      if (ammo.unknown) {
        // Closest-spelling match on what was typed, else a placeholder
        const typed = npcbFindItem(e.name, "ammo", index);
        out.push({
          source: e.raw,
          itemName: typed ? typed.entry.name : e.name,
          count: e.count,
          ctx: "ammo",
          how: typed ? typed.how : "new",
          score: typed?.score,
          placeholder: !typed,
          placeholderType: "ammo",
        });
        return out;
      }
      const ammoName = npcbAmmoItemName(ammo, weaponClasses);
      const hit = npcbFindItem(ammoName, "ammo", index);
      const synth = hit ? null : npcbAmmoRecipe(ammoName, index);
      out.push({
        source: e.raw,
        itemName: hit ? hit.entry.name : ammoName,
        count: e.count,
        ctx: "ammo",
        how: hit
          ? npcbKey(e.name) === npcbKey(hit.entry.name)
            ? "exact"
            : "name"
          : synth
          ? "built"
          : "new",
        placeholder: !hit && !synth,
        placeholderType: "ammo",
        synth,
      });
      return out;
    }

    // A suit of armor named on its own ("Leathers", "L Armorjack") is head
    // and body pieces
    const armorChoice = e.program ? "" : npcbArmorChoice(e.name);
    if (armorChoice) {
      // "Kevlar (Head)" is just the one piece
      const location = (e.parenText || "").trim().toLowerCase();
      const pieces = NPCB_ARMOR[armorChoice].items.filter(
        (itemName) =>
          (location !== "head" && location !== "body") ||
          itemName.toLowerCase().indexOf(`(${location})`) !== -1
      );
      pieces.forEach((itemName) => {
        const piece = npcbFindItem(itemName, "armor", index);
        out.push({
          source: e.raw,
          itemName: piece ? piece.entry.name : itemName,
          count: 1,
          ctx: "armor",
          how: piece ? piece.how : "new",
          placeholder: !piece,
          placeholderType: "armor",
          cyber: piece?.entry.type === "cyberware",
        });
      });
      return out;
    }

    const popup = e.program ? null : npcbPopupLine(e.name, e.raw, index);
    if (popup) {
      for (let i = 0; i < e.count; i++) out.push({ ...popup });
      return out;
    }

    const ctx = e.program ? "program" : "gear";
    // Try the whole entry first ("Rope (60m/yds)", "Implanted Linear Frame Σ (Sigma)")
    let hit = null;
    let children = e.children;
    if (e.parenText) {
      hit = npcbFindItem(`${e.name} (${e.parenText})`, ctx, index);
      if (hit && hit.how !== "fuzzy") children = [];
      else hit = null;
    }
    if (!hit) hit = npcbFindItem(e.name, ctx, index);

    // Plural foundationals ("Cybereyes x2") resolve through the stem already
    const sided = hit ? npcbSidedVariants(hit.entry, index) : null;
    const isFoundational =
      hit &&
      hit.entry.type === "cyberware" &&
      (hit.entry.cyberwareInstallSlot === "foundational" || !!sided);

    let sides = [""];
    if (sided) {
      sides = e.count >= 2 ? ["left", "right"] : ["right"];
      for (let i = 2; i < e.count; i++) sides.push(i % 2 === 0 ? "left" : "right");
    }

    if (sided) {
      sides.forEach((side) => {
        out.push({
          source: e.raw,
          itemName: sided[side].name,
          count: 1,
          ctx,
          how: hit.how,
          score: hit.score,
          side,
          cyber: true,
        });
      });
    } else if (hit && hit.entry.type === "cyberware") {
      // Cyberware never stacks: one line per piece
      for (let i = 0; i < e.count; i++) {
        out.push({
          source: e.raw,
          itemName: hit.entry.name,
          count: 1,
          ctx,
          how: hit.how,
          score: hit.score,
          cyber: true,
          slot: hit.entry.cyberwareInstallSlot,
        });
      }
    } else {
      out.push({
        source: e.raw,
        itemName: hit ? hit.entry.name : e.name,
        count: e.count,
        ctx,
        how: hit ? hit.how : "new",
        score: hit?.score,
        placeholder: !hit,
        placeholderType: e.program ? "program or hardware" : "gear",
      });
    }

    if (isFoundational) {
      lastFoundational[npcbKey(npcbBaseName(hit.entry.name))] = sides;
    }

    // Children: options of a foundational, or contents of something else
    children.forEach((c) => {
      const childAmmo = npcbParseAmmo(c.name, c.count);
      if (childAmmo && !isFoundational) {
        out.push(
          ...resolveGearEntry({ ...npcbParseEntry(`${c.name} x${c.count}`), program: false })
        );
        return;
      }
      const childPopup = npcbPopupLine(c.name, `${e.name} (${c.name})`, index);
      if (childPopup) {
        for (let i = 0; i < c.count; i++) {
          out.push({
            ...childPopup,
            side: isFoundational
              ? sides[(sides.length - 1 - i + sides.length * 4) % sides.length]
              : "",
          });
        }
        return;
      }
      const ch = npcbFindItem(c.name, isFoundational ? "option" : "gear", index);
      if (!ch) {
        if (isFoundational) {
          out.push({
            source: `${e.name} (${c.name})`,
            itemName: c.name,
            count: 1,
            ctx: "option",
            how: "new",
            placeholder: true,
            placeholderType: "cyberware",
            side: sides[sides.length - 1],
            cyber: true,
          });
        } else {
          // Descriptive text such as "(10 HP)" or "(incendiary ammunition...)"
          out.push({ source: e.raw, descriptor: c.name });
        }
        return;
      }
      const chSided = npcbSidedVariants(ch.entry, index);
      for (let i = 0; i < c.count; i++) {
        const side = isFoundational
          ? sides[(sides.length - 1 - i + sides.length * 4) % sides.length]
          : "";
        out.push({
          source: `${e.name} (${c.name})`,
          itemName: chSided ? chSided[side || "right"].name : ch.entry.name,
          count: ch.entry.type === "cyberware" ? 1 : c.count,
          ctx: isFoundational ? "option" : "gear",
          how: ch.how,
          score: ch.score,
          side,
          cyber: ch.entry.type === "cyberware",
          slot: ch.entry.cyberwareInstallSlot,
        });
        if (ch.entry.type !== "cyberware") break;
      }
    });
    return out;
  };

  const unresolvedCount = (rs) =>
    rs.filter((r) => r.placeholder || r.descriptor).length;

  for (let i = 0; i < gearEntries.length; i++) {
    const e = gearEntries[i];
    let resolved = resolveGearEntry(e);
    // Re-join a name that wrapped onto the next line
    const next = gearEntries[i + 1];
    if (next && next.nl && unresolvedCount(resolved) > 0) {
      const merged = npcbParseEntry(`${e.raw} ${next.raw}`);
      const mergedResolved = resolveGearEntry({ ...merged, program: e.program });
      const nextResolved = resolveGearEntry(next);
      if (
        unresolvedCount(mergedResolved) <
        unresolvedCount(resolved) + unresolvedCount(nextResolved)
      ) {
        resolved = mergedResolved;
        i++;
      }
    }
    resolved.forEach((r) => {
      if (r.descriptor) {
        lines.push({ source: r.source, descriptor: r.descriptor, how: "note" });
      } else {
        addLine(r);
      }
    });
  }

  // Loose cyberware options ("Neural Link, Interface Plugs") take the side of
  // the last matching foundational
  lines.forEach((l) => {
    if (l.cyber && !l.side && l.slot && NPCB_SLOT_FAMILY[l.slot]) {
      const sides = lastFoundational[npcbKey(NPCB_SLOT_FAMILY[l.slot])];
      if (sides && sides[0]) l.side = sides[sides.length - 1];
      else if (l.slot === "cyberarms" || l.slot === "cyberlegs" || l.slot === "cyberoptics") {
        l.side = "right";
      }
    }
  });

  return { lines, weaponClasses };
}

// Human readable check of what the wizard will add
function npcbPreviewText(resolved) {
  const out = [];
  resolved.lines.forEach((l) => {
    if (l.descriptor) {
      out.push(`NOTE  "${l.descriptor}" kept in notes (${l.source})`);
      return;
    }
    const count = l.count > 1 ? ` x${l.count}` : "";
    const side = l.side ? ` [${l.side}]` : "";
    let tag = "OK  ";
    let detail = "";
    if (l.placeholder || l.how === "new") {
      tag = "NEW ";
      detail = " (no match; a placeholder item will be created)";
    } else if (l.synth) {
      tag = "BUILT";
      detail = ` (from ${l.synth.base}, with ${l.synth.donor}'s effects)`;
    } else if (l.popup) {
      tag = "BUILT";
      detail = ` (${l.popup.template} with a ${l.popup.weapon})`;
    } else if (l.how === "fuzzy") {
      tag = "~   ";
      detail = l.score && l.score < 1 ? ` (closest match, ${Math.round(l.score * 100)}%)` : "";
    }
    if (l.note) detail += ` (${l.note})`;
    const from =
      l.source &&
      npcbKey(npcbStripCount(l.source).name) !== npcbKey(l.itemName)
        ? `  <- ${l.source}`
        : "";
    out.push(`${tag}  ${l.itemName}${count}${side}${detail}${from}`);
  });
  return out.join(NPCB_NL);
}

// ---------------------------------------------------------------------------
// Inventory construction (records fetched by name)
// ---------------------------------------------------------------------------
function npcbInventoryEntry(item, count, carried) {
  const d = item.data || {};
  const isAmmoWithValues =
    d.type === "ammo" &&
    ((d.effects && d.effects.length > 0) ||
      (d.conditions && d.conditions.length > 0) ||
      d.checkSkill ||
      d.checkDV ||
      d.healing ||
      d.useDamage);
  return {
    ...item,
    _id: generateUuid(),
    unidentifiedName: item.unidentifiedName || item.name,
    recordType: "items",
    icon: "IconBox",
    data: {
      ...d,
      fromId: item._id,
      count,
      carried,
    },
    fields: {
      ...(item.fields || {}),
      useBtn: {
        hidden:
          !d.consumable && !d.hasUseBtn && !isAmmoWithValues && d.type !== "drug",
      },
    },
  };
}

function npcbCarriedFor(type, data) {
  // Gear that works as armor (Bodyweight Suit) only counts when equipped
  if (
    data?.armorLocation ||
    (data?.modifiers || []).some((m) => /^(head|body|shield)Sp$/.test(m.data?.type || ""))
  ) {
    return "equipped";
  }
  if (
    type === "ranged weapon" ||
    type === "melee weapon" ||
    type === "armor" ||
    type === "cyberware" ||
    type === "ammo"
  ) {
    return "equipped";
  }
  return "carried";
}

// Traits that make an ammo variant what it is (Armor-Piercing ablation,
// Incendiary's On Fire, Smart guidance, poison checks...)
const NPCB_AMMO_VARIANT_KEYS = ["modifiers", "effects", "conditions", "checkDV", "checkSkill", "healing"];

// New ammo record: the base round's class data with the donor's variant traits
function npcbBuildAmmoVariant(name, base, donor) {
  if (!base || !donor) return null;
  const data = JSON.parse(JSON.stringify(base.data || {}));
  NPCB_AMMO_VARIANT_KEYS.forEach((k) => delete data[k]);
  NPCB_AMMO_VARIANT_KEYS.forEach((k) => {
    if (donor.data?.[k] !== undefined) data[k] = JSON.parse(JSON.stringify(donor.data[k]));
  });
  data.description = `<p>Built by the NPC Wizard: ${base.name} with the ${donor.name}'s effects. Check it against your rules before play.</p>`;
  return {
    name,
    unidentifiedName: name,
    recordType: "items",
    icon: base.icon,
    portrait: base.portrait,
    fields: base.fields,
    data,
  };
}

// New popup cyberweapon: the Popup Ranged/Melee Weapon template with the
// weapon attached, the same shape as Popup Grenade Launcher
function npcbBuildPopup(name, template, weapon) {
  if (!template || !weapon) return null;
  const data = JSON.parse(JSON.stringify(template.data || {}));
  const weaponData = JSON.parse(JSON.stringify(weapon.data || {}));
  weaponData.concealable = "true";
  data.hasLinkedWeapon = true;
  data.linkedWeapon = { ...weaponData, name, description: "" };
  data.weaponAttached = [
    {
      ...JSON.parse(JSON.stringify(weapon)),
      name,
      unidentifiedName: name,
      data: weaponData,
    },
  ];
  data.description = `<p>Built by the NPC Wizard: ${template.name} with a ${weapon.name}.</p>`;
  return {
    name,
    unidentifiedName: name,
    recordType: "items",
    icon: template.icon,
    portrait: template.portrait,
    fields: template.fields,
    data,
  };
}

// Every record name a resolved spec needs fetched
function npcbNamesToFetch(resolved) {
  const names = [];
  resolved.lines.forEach((l) => {
    if (l.descriptor || l.placeholder) return;
    if (l.synth) names.push(l.synth.base, l.synth.donor);
    else if (l.popup) names.push(l.popup.template, l.popup.weapon);
    else names.push(l.itemName);
  });
  return names;
}

// lines from npcbResolveSpec + {name: itemRecord} -> data.inventory array.
// baseInventory (an NPC's current items) is kept, and new ammo/gear stacks
// onto matching entries in it; only newly added weapons are loaded.
function npcbBuildInventory(resolved, itemsByName, baseInventory) {
  const inventory = (baseInventory || []).map((i) => JSON.parse(JSON.stringify(i)));
  const newWeapons = [];
  resolved.lines.forEach((l) => {
    if (l.descriptor) return;
    let item = l.placeholder ? null : itemsByName[l.itemName];
    if (l.synth) {
      item = npcbBuildAmmoVariant(
        l.itemName,
        itemsByName[l.synth.base],
        itemsByName[l.synth.donor]
      );
    } else if (l.popup) {
      item = npcbBuildPopup(
        l.itemName,
        itemsByName[l.popup.template],
        itemsByName[l.popup.weapon]
      );
    }
    let entry;
    if (item) {
      entry = npcbInventoryEntry(item, l.count, npcbCarriedFor(item.data?.type, item.data));
    } else {
      const type = l.placeholderType || (l.cyber ? "cyberware" : "gear");
      entry = {
        _id: generateUuid(),
        name: l.itemName,
        unidentifiedName: l.itemName,
        recordType: "items",
        icon: "IconBox",
        data: {
          type,
          count: l.count,
          carried: npcbCarriedFor(type),
          description: `<p>Created by the NPC Wizard from "${l.source}". No matching item was found in this campaign, so this entry has no rules data.</p>`,
          ...(type === "ammo" ? { rounds: 1 } : {}),
        },
      };
    }
    if (entry.data.type === "cyberware") {
      entry.data.active = true;
      if (l.side) entry.data.cyberLocation = l.side;
    }
    // Stack plain gear and ammo with the same item, as a drop would
    const stackable =
      entry.data.type !== "cyberware" &&
      entry.data.type !== "ranged weapon" &&
      entry.data.type !== "melee weapon" &&
      entry.data.type !== "armor" &&
      !l.placeholder;
    const existing = stackable
      ? inventory.find(
          (i) =>
            i.data?.type !== "cyberware" &&
            (i.name === entry.name ||
              (entry.data.fromId && i.data?.fromId === entry.data.fromId))
        )
      : null;
    if (existing) {
      existing.data.count = (existing.data.count || 0) + l.count;
    } else {
      inventory.push(entry);
      if (entry.data.type === "ranged weapon") newWeapons.push(entry);
      // Popup guns and other cyberweapons carry their weapon inside
      if (entry.data.type === "cyberware" && Array.isArray(entry.data.weaponAttached)) {
        entry.data.weaponAttached
          .filter((w) => w?.data?.type === "ranged weapon")
          .forEach((w) => newWeapons.push(w));
      }
    }
  });

  // Load each new ranged weapon from matching ammo; book "xN" is the total
  newWeapons.forEach((weapon) => {
      if (weapon.data.ammo) return;
      const cls =
        NPCB_ITEM_AMMO_TYPES[weapon.data.ammoType] ||
        npcbWeaponAmmoClass(weapon.name);
      if (!cls) return;
      const accepts = (ammoName) => {
        const ac = npcbAmmoNameClass(ammoName);
        if (cls === "Slug") return ac === "Slug" || ac === "Shell";
        return ac === cls;
      };
      const ammo = inventory.find(
        (i) => i.data.type === "ammo" && accepts(i.name) && (i.data.count || 0) > 0
      );
      if (!ammo) return;
      const magazine = parseInt(weapon.data.magazine || 0, 10) || ammo.data.count;
      const load = Math.min(magazine, ammo.data.count);
      weapon.data.ammo = JSON.stringify({
        _id: ammo._id,
        name: ammo.name,
        isShell: ammo.data.isShell || 0,
      });
      weapon.data.ammoCount = load;
      ammo.data.count -= load;
  });
  return inventory;
}

// ---------------------------------------------------------------------------
// Random generation
// ---------------------------------------------------------------------------
const NPCB_WEAPON_KITS = {
  none: [
    ["Very Heavy Pistol", "@melee"],
    ["Assault Rifle", "Very Heavy Pistol"],
    ["Shotgun", "Very Heavy Pistol"],
    ["SMG", "Light Melee Weapon"],
    ["Heavy Pistol", "Medium Melee Weapon"],
  ],
  solo: [
    ["Assault Rifle", "Very Heavy Pistol", "Medium Melee Weapon"],
    ["Shotgun", "Heavy Pistol", "Heavy Melee Weapon"],
    ["Sniper Rifle", "Very Heavy Pistol"],
    ["Heavy SMG", "Very Heavy Pistol"],
  ],
  netrunner: [["Very Heavy Pistol"], ["SMG"]],
  tech: [["Shotgun", "Heavy Pistol"], ["Heavy SMG", "Light Melee Weapon"]],
  medtech: [["Heavy Pistol"], ["SMG", "Light Melee Weapon"]],
  media: [["Heavy Pistol"], ["Medium Pistol", "Light Melee Weapon"]],
  exec: [["Heavy Pistol"], ["Very Heavy Pistol"]],
  lawman: [
    ["Shotgun", "Very Heavy Pistol"],
    ["Assault Rifle", "Very Heavy Pistol"],
  ],
  fixer: [["Very Heavy Pistol", "Light Melee Weapon"], ["Heavy SMG"]],
  nomad: [
    ["Assault Rifle", "Very Heavy Pistol", "Light Melee Weapon"],
    ["Shotgun", "Heavy Melee Weapon"],
    ["Crossbow", "Very Heavy Pistol"],
  ],
  rockerboy: [
    ["Very Heavy Pistol", "Heavy Melee Weapon"],
    ["Heavy Pistol", "Light Melee Weapon"],
  ],
};

const NPCB_CYBER_POOL = [
  { text: "Techhair", maxTier: 1 },
  { text: "Neural Link (Interface Plugs)" },
  { text: "Neural Link (Kerenzikov)", minTier: 2 },
  { text: "Neural Link (Sandevistan)", minTier: 4 },
  { text: "Neural Link (Chipware Socket, Pain Editor)", minTier: 2 },
  { text: "Cybereye (Targeting Scope)" },
  { text: "Cybereye x2 (Low Light/Infrared/UV)" },
  { text: "Cybereye (Anti-Dazzle)", minTier: 1 },
  { text: "Cyberaudio Suite (Amplified Hearing)" },
  { text: "Cyberaudio Suite (Level Damper)", minTier: 1 },
  { text: "Nasal Filters" },
  { text: "Grafted Muscle and Bone Lace", minTier: 4 },
  { text: "Cyberarm (Popup Shield)", minTier: 3 },
  { text: "Cyberleg x2 (Jump Booster x2)", minTier: 4 },
  { text: "@cyberweapon", maxTier: 3 },
];

const NPCB_MISC_GEAR = [
  "Disposable Cell Phone",
  "Radio Communicator",
  "Flashlight",
  "Agent",
  "Handcuffs x2",
  "Binoculars",
];

const NPCB_ROLE_GEAR = {
  netrunner: ["Virtuality Goggles", "Cyberdeck"],
  tech: ["Techtool", "Tech Bag"],
  medtech: ["Medtech Bag", "AirHypo"],
  media: ["Video Camera", "Agent"],
  exec: ["Agent"],
  lawman: ["Handcuffs x2", "Radio Communicator"],
  fixer: ["Agent", "Scrambler/Descrambler"],
  nomad: ["Rope", "Tent & Camping Equipment"],
  rockerboy: ["Electric Guitar"],
  solo: ["Radio Communicator"],
};

const NPCB_PROGRAMS = [
  "Armor",
  "Banhammer",
  "DeckKRASH",
  "Eraser",
  "Hellbolt",
  "Shield",
  "Sword",
  "Worm",
  "See Ya",
  "Speedy Gonzalvez",
];

const NPCB_GRENADES = [
  "Flashbang Grenade",
  "Teargas Grenade",
  "Smoke Grenade",
  "Incendiary Grenade",
  "Armor Piercing Grenade",
];

const NPCB_GENERIC_SKILLS = [
  ["Athletics", 4],
  ["Brawling", 4],
  ["Concentration", 2],
  ["Conversation", 2],
  ["Drive Land Vehicle", 4],
  ["Education", 2],
  ["Endurance", 2],
  ["Evasion", 4],
  ["First Aid", 2],
  ["Human Perception", 2],
  ["Interrogation", 2],
  ["Streetslang", 2, "Language"],
  ["Your Home", 2, "Local Expert"],
  ["Perception", 4],
  ["Persuasion", 2],
  ["Resist Torture/Drugs", 2],
  ["Stealth", 4],
];

// Weapon -> the skill used to attack with it
const NPCB_WEAPON_SKILLS = [
  [/sniper rifle|assault rifle|shotgun/, "Shoulder Arms"],
  [/heavy smg|\bsmg\b|pistol/, "Handgun"],
  [/flamethrower|grenade launcher|rocket launcher/, "Heavy Weapons"],
  [/crossbow|\bbow\b/, "Archery"],
  [/melee|knife|wolvers|rippers|knucks|scratchers|slice|sword|machete|bat/, "Melee Weapon"],
];

function npcbTierIndex(tier) {
  return NPCB_TIER_ORDER.indexOf(npcbTierOrDefault(tier));
}

// Roll each STAT on the role's Edgerunner table (a random role per STAT when
// none is chosen), then scale into the tier's STAT total band.
function npcbRollStats(tier, role, rng) {
  const t = NPCB_TIERS[npcbTierOrDefault(tier)];
  const roles = Object.keys(NPCB_ROLE_STAT_TABLES);
  const raw = {};
  NPCB_STATS.forEach((stat, i) => {
    if (stat === "luck") return;
    const table = NPCB_ROLE_STAT_TABLES[role] || NPCB_ROLE_STAT_TABLES[npcbPick(roles, rng)];
    raw[stat] = table[npcbD10(rng) - 1][i];
  });
  return npcbScaleStats(raw, t, rng, !!NPCB_ROLE_STAT_TABLES[role]);
}

// How much each STAT matters to a combat NPC; published NPCs keep REF, DEX
// and BODY up while INT, TECH and EMP drop first
const NPCB_STAT_COMBAT_WEIGHT = {
  int: 0.35,
  ref: 1,
  dex: 0.85,
  tech: 0.3,
  cool: 0.45,
  will: 0.55,
  move: 0.6,
  body: 0.8,
  emp: 0.3,
};

// Bring rolled STATs to a total inside the tier's band, one point at a time.
// Points come off stats that are both less important to a combatant and low
// on the role's table (so a Netrunner keeps INT/TECH, a Solo keeps REF).
function npcbScaleStats(raw, t, rng, hasRole) {
  const r = rng || Math.random;
  const vals = {};
  let keys = NPCB_STATS.filter((s) => s !== "luck");
  let target = npcbRandInt(t.statTotal[0], t.statTotal[1], rng);
  if (t.emp) {
    vals.emp = npcbRandInt(t.emp[0], t.emp[1], rng);
    keys = keys.filter((s) => s !== "emp");
    target -= vals.emp;
  }
  const [min, max] = t.statRange;
  const priority = {};
  keys.forEach((k) => {
    vals[k] = Math.min(max, Math.max(min, raw[k]));
    // A chosen role's table says what matters; otherwise lean on combat stats
    const roleShare = hasRole ? 0.75 : 0.4;
    priority[k] =
      roleShare * (raw[k] / 8) + (1 - roleShare) * NPCB_STAT_COMBAT_WEIGHT[k];
  });
  let total = keys.reduce((a, k) => a + vals[k], 0);
  let guard = 400;
  while (total !== target && guard-- > 0) {
    const lower = total > target;
    let best = null;
    let bestScore = -Infinity;
    keys.forEach((k) => {
      if (lower ? vals[k] <= min : vals[k] >= max) return;
      const room = lower ? vals[k] - min : max - vals[k];
      const weight = lower ? 1.15 - priority[k] : priority[k] + 0.15;
      const score = room * weight + r() * 0.6;
      if (score > bestScore) {
        bestScore = score;
        best = k;
      }
    });
    if (!best) break;
    vals[best] += lower ? -1 : 1;
    total += lower ? -1 : 1;
  }
  vals.luck = 0;
  return vals;
}

function npcbSkillLevel(pkgLvl, t, isKey, rng) {
  if (isKey) return npcbRandInt(t.keyLvl[0], t.keyLvl[1], rng);
  const lvl = Math.round(pkgLvl * t.skillScale) + npcbRandInt(-1, 1, rng);
  return Math.max(1, Math.min(t.maxLvl, lvl));
}

function npcbWeaponSkill(weaponName) {
  const n = npcbNorm(weaponName);
  for (const [pattern, skill] of NPCB_WEAPON_SKILLS) {
    if (pattern.test(n)) return skill;
  }
  return "";
}

// Skill line text for a random NPC: role package (or a generic street
// package) scaled to the tier, with the skills its weapons need at key level.
function npcbGenerateSkillText(tier, role, stats, weaponsText, gearText, rng) {
  const t = NPCB_TIERS[npcbTierOrDefault(tier)];
  const pkg = role ? getSkillsForRole(role) : NPCB_GENERIC_SKILLS;
  const levels = {};
  const order = [];
  const setLevel = (name, lvl) => {
    if (!(name in levels)) order.push(name);
    levels[name] = Math.max(levels[name] || 0, lvl);
  };
  const chooseDefaults = {
    "Play Instrument": "Guitar",
    Science: "Chemistry",
    "Martial Arts": "Karate",
    Language: "Native",
    "Local Expert": "Your Home",
  };
  pkg.forEach(([name, lvl, parent]) => {
    let skillName = name.replace(/\s*\(x2\)\s*$/i, "");
    if (parent) {
      skillName = /choose/i.test(name)
        ? `${parent} (${chooseDefaults[parent] || "Any"})`
        : `${parent} (${name})`;
    }
    setLevel(skillName, npcbSkillLevel(lvl, t, lvl >= 6, rng));
  });
  setLevel("Language (Native)", npcbSkillLevel(4, t, false, rng));
  const weaponNames = [
    ...npcbSplitTop(weaponsText).filter((w) => {
      const parts = npcbStripCount(w);
      return !npcbParseAmmo(parts.name, parts.count);
    }),
    ...npcbSplitTop(gearText).filter((g) => /wolvers|rippers|knucks|scratchers|slice/i.test(g)),
  ];
  weaponNames.forEach((w) => {
    const skill = npcbWeaponSkill(w);
    if (skill) setLevel(skill, npcbSkillLevel(6, t, true, rng));
    if (/assault rifle|smg/i.test(w) && t.keyLvl[0] >= 6) {
      setLevel("Autofire", npcbSkillLevel(4, t, false, rng));
    }
  });
  const parts = order.map((name) => {
    const canon = npcbCanonicalSkill(name);
    return `${canon.name} ${levels[name] + npcbStatValue(stats, canon.stat)}`;
  });
  return parts.sort((a, b) => a.localeCompare(b)).join(", ");
}

function npcbRoleAbilityText(roles) {
  const abilityByRole = {};
  Object.keys(NPCB_ROLE_ABILITIES).forEach((ability) => {
    abilityByRole[NPCB_ROLE_ABILITIES[ability]] = ability;
  });
  return roles
    .filter((r) => r.role && r.rank > 0)
    .map((r) => {
      const ability = abilityByRole[r.role] || r.role;
      return `${ability.replace(/\b\w/g, (c) => c.toUpperCase())} ${r.rank}`;
    })
    .join(", ");
}

function npcbRoundTo10(n) {
  return Math.max(10, Math.round(n / 10) * 10);
}

// Insert gear entries ahead of a trailing "Programs:" section, which would
// otherwise swallow them as programs
function npcbInsertGear(gearTokens, newTokens) {
  const at = gearTokens.findIndex((g) => /^(cyberdeck\s*)?programs?\s*:/i.test(g));
  if (at === -1) return [...gearTokens, ...newTokens];
  return [...gearTokens.slice(0, at), ...newTokens, ...gearTokens.slice(at)];
}

// Make sure every ranged weapon has ammo listed
function npcbAddMissingAmmo(weaponsText, gearText, tier, rng) {
  const t = NPCB_TIERS[npcbTierOrDefault(tier)];
  const gear = npcbSplitTop(gearText);
  const weaponClasses = npcbSplitTop(weaponsText)
    .map(npcbWeaponAmmoClass)
    .filter((c) => c);
  const have = new Set();
  gear.forEach((g) => {
    if (/^(cyberdeck\s*)?programs?\s*:/i.test(g)) return;
    const parts = npcbStripCount(g);
    const a = npcbParseAmmo(parts.name, parts.count);
    if (!a) return;
    if (a.cls === "Pistol") {
      // "Pistol Ammo" feeds whichever pistol the NPC carries
      have.add(weaponClasses.find((c) => /Pistol$/.test(c)) || "VH Pistol");
    } else if (!a.cls) {
      // "Armor Piercing Ammo" feeds the first gun
      have.add(weaponClasses.find((c) => c !== "Grenade" && c !== "Rocket") || "");
    } else {
      have.add(a.cls === "Shell" ? "Slug" : a.cls);
    }
  });
  const added = [];
  weaponClasses.forEach((cls) => {
    if (have.has(cls)) return;
    have.add(cls);
    if (cls === "Grenade" || cls === "Rocket") {
      added.push(`Armor Piercing ${cls} x${npcbRandInt(1, 2, rng)}`);
    } else if (cls === "Flamethrower") {
      added.push(`Flamethrower Ammo x${npcbRandInt(2, 4, rng) * 4}`);
    } else if (cls === "Arrow") {
      added.push(`Arrow Ammo x${npcbRoundTo10(npcbRandInt(t.ammo[0], t.ammo[1], rng) / 2)}`);
    } else {
      added.push(`${cls} Ammo x${npcbRoundTo10(npcbRandInt(t.ammo[0], t.ammo[1], rng))}`);
    }
  });
  return npcbInsertGear(gear, added).join(", ");
}

// Merge "Neural Link (A)" + "Neural Link (B)" into "Neural Link (A, B)"
function npcbMergeFoundationals(tokens) {
  const out = [];
  const byParent = {};
  tokens.forEach((tok) => {
    const e = npcbParseEntry(tok);
    const key = `${npcbKey(e.name)}|${e.count}`;
    if (e.children.length > 0 && /neural link|cyberaudio suite/i.test(e.name)) {
      if (byParent[key]) {
        byParent[key].children.push(...e.children.map((c) => (c.count > 1 ? `${c.name} x${c.count}` : c.name)));
        return;
      }
      byParent[key] = {
        name: e.name,
        count: e.count,
        children: e.children.map((c) => (c.count > 1 ? `${c.name} x${c.count}` : c.name)),
      };
      out.push(byParent[key]);
      return;
    }
    out.push(tok);
  });
  return out.map((o) =>
    typeof o === "string"
      ? o
      : `${o.name}${o.count > 1 ? " x" + o.count : ""} (${[...new Set(o.children)].join(", ")})`
  );
}

function npcbGenerateGear(tier, role, rng) {
  const ti = npcbTierIndex(tier);
  const t = NPCB_TIERS[npcbTierOrDefault(tier)];
  if (tier === "boss") {
    // Heavily chromed: cyberlimbs with built-in weapons plus body upgrades
    const armWeapons = npcbPickSome(
      ["Popup Grenade Launcher", "Wolvers", "Big Knucks", "Popup Shield", "Slice 'N Dice"],
      2,
      rng
    );
    const body = npcbPickSome(
      ["Grafted Muscle and Bone Lace", "Subdermal Armor", "Cybersnake", "Skin Weave", "Toxin Binders"],
      npcbRandInt(2, 3, rng),
      rng
    );
    const neural = npcbPickSome(["Kerenzikov", "Pain Editor", "Chipware Socket", "Sandevistan"], 2, rng);
    const weapons = npcbPick(["Heavy SMG", "Assault Rifle", "Shotgun"], rng);
    const gear = [
      `Cyberarm x2 (${armWeapons.join(", ")})`,
      npcbPick(["Cyberleg x2 (Jump Booster x2)", "Cyberleg x2"], rng),
      ...body,
      `Neural Link (${neural.join(", ")})`,
      `${npcbPick(NPCB_GRENADES, rng)} x2`,
    ];
    return {
      armor: body.includes("Subdermal Armor") ? "" : "Light Armorjack",
      weapons,
      gear: npcbAddMissingAmmo(weapons, gear.join(", "), tier, rng),
    };
  }
  const kit = [...npcbPick(NPCB_WEAPON_KITS[role] || NPCB_WEAPON_KITS.none, rng)];
  const weapons = kit.map((w, i) => {
    if (w === "@melee") return npcbPick(["Light Melee Weapon", "Medium Melee Weapon"], rng);
    if (i === 0 && t.quality && npcbWeaponAmmoClass(w)) return `${t.quality} ${w}`;
    return w;
  });

  const gear = [];
  // Cyberware
  const pool = NPCB_CYBER_POOL.filter(
    (c) =>
      (c.minTier === undefined || ti >= c.minTier) &&
      (c.maxTier === undefined || ti <= c.maxTier)
  );
  const cyberCount = npcbRandInt(t.cyber[0], t.cyber[1], rng);
  npcbPickSome(pool, cyberCount, rng).forEach((c) => {
    gear.push(c.text === "@cyberweapon" ? npcbPick(NPCB_CYBERWEAPONS, rng) : c.text);
  });
  if (role === "netrunner" && !gear.some((g) => /interface plugs/i.test(g))) {
    gear.push("Neural Link (Interface Plugs)");
  }
  // Misc and role gear
  npcbPickSome(NPCB_MISC_GEAR, npcbRandInt(1, 2, rng), rng).forEach((g) => gear.push(g));
  (NPCB_ROLE_GEAR[role] || []).forEach((g) => {
    if (!gear.includes(g)) gear.push(g);
  });
  for (let i = 0; i < t.grenades; i++) {
    gear.push(`${npcbPick(NPCB_GRENADES, rng)} x1`);
  }
  let gearText = npcbAddMissingAmmo(weapons.join(", "), npcbMergeFoundationals([...new Set(gear)]).join(", "), tier, rng);
  if (role === "netrunner") {
    gearText += `, Programs: ${npcbPickSome(NPCB_PROGRAMS, npcbRandInt(4, 6, rng), rng).join(", ")}`;
  }
  return { armor: npcbPick(t.armor, rng), weapons: weapons.join(", "), gear: gearText };
}

// ---------------------------------------------------------------------------
// Gangs
// ---------------------------------------------------------------------------
function npcbApplyGang(spec, gangKey, rng) {
  const gang = NPCB_GANGS[gangKey];
  if (!gang) return spec;
  const out = { ...spec };
  let weapons = npcbSplitTop(out.weaponsText);
  let gear = npcbSplitTop(out.gearText);

  if (gang.armor) {
    const current = NPCB_ARMOR[out.armor];
    if (!current || NPCB_ARMOR[gang.armor].sp > current.sp) {
      out.armor = gang.armor;
    }
  }
  if (gang.removeArmor && gang.removeArmor.includes(out.armor)) {
    out.armor = "";
  }

  // Applying a gang twice must not add its gear twice
  const hasEntry = (list, name) =>
    list.some((x) => npcbKey(npcbStripCount(x).name) === npcbKey(name));

  const replacedClasses = [];
  (gang.replace || []).forEach(([pattern, replacementRaw, addIfMissing]) => {
    const replacement =
      replacementRaw === "@cyberweapon"
        ? npcbPick(NPCB_CYBERWEAPONS.filter((w) => w !== "Rippers"), rng)
        : replacementRaw;
    // Cyberweapons live in the gear line (and may be echoed in the weapons
    // line); ordinary weapons live only in the weapons line
    const isCyberweapon = NPCB_CYBERWEAPONS.some(
      (c) => npcbKey(c) === npcbKey(replacement)
    );
    let found = false;
    const swap = (list, isGear) =>
      list
        .map((tok) => {
          const { name, count } = npcbStripCount(tok);
          if (!pattern.test(name)) return tok;
          found = true;
          const oldCls = npcbWeaponAmmoClass(name);
          const newCls = npcbWeaponAmmoClass(replacement);
          if (oldCls && oldCls !== newCls) replacedClasses.push([oldCls, newCls]);
          if (isGear && !isCyberweapon) {
            if (!weapons.some((w) => npcbKey(npcbStripCount(w).name) === npcbKey(replacement))) {
              weapons.push(replacement);
            }
            return null;
          }
          return count > 1 ? `${replacement} x${count}` : replacement;
        })
        .filter((tok) => tok);
    weapons = swap(weapons, false);
    gear = swap(gear, true);
    if (!found && addIfMissing && !hasEntry(gear, replacement)) {
      gear = npcbInsertGear(gear, [replacement]);
    }
  });
  (gang.remove || []).forEach((pattern) => {
    gear = gear.filter((g) => !pattern.test(npcbStripCount(g).name));
    weapons = weapons.filter((w) => !pattern.test(npcbStripCount(w).name));
  });
  (gang.addWeapons || []).forEach((w) => {
    if (!weapons.some((x) => npcbKey(npcbStripCount(x).name) === npcbKey(w))) weapons.push(w);
  });
  gear = npcbInsertGear(
    gear,
    (gang.addGear || []).filter((g) => !hasEntry(gear, npcbStripCount(g).name))
  );

  // Ammo follows a swapped weapon ("Replace Poor Quality VH Pistols with SMGs")
  const weaponClasses = weapons.map(npcbWeaponAmmoClass).filter((c) => c);
  replacedClasses.forEach(([oldCls, newCls]) => {
    if (weaponClasses.includes(oldCls)) return;
    gear = gear.map((g) => {
      const { name, count } = npcbStripCount(g);
      const a = npcbParseAmmo(name, count);
      if (!a || a.cls !== oldCls) return g;
      return newCls ? `${a.variant ? a.variant + " " : ""}${newCls} Ammo x${count}` : null;
    }).filter((g) => g);
  });

  out.weaponsText = weapons.join(", ");
  out.gearText = npcbAddMissingAmmo(out.weaponsText, gear.join(", "), out.tier, rng);

  if (gang.skills || gang.renameSkills) {
    const parsed = npcbParseSkillText(out.skillText);
    (gang.renameSkills || []).forEach(([from, to]) => {
      parsed.skills.forEach((s) => {
        if (s.name === from) {
          const canon = npcbCanonicalSkill(to);
          s.name = canon.name;
          s.stat = canon.stat;
        }
      });
    });
    (gang.skills || []).forEach(([name, base]) => {
      const canon = npcbCanonicalSkill(name);
      const existing = parsed.skills.find((s) => s.name === canon.name);
      if (existing) existing.base = Math.max(existing.base, base);
      else parsed.skills.push({ ...canon, base });
    });
    parsed.skills.sort((a, b) => a.name.localeCompare(b.name));
    out.skillText = npcbSkillsToText(parsed.skills);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Specs: what the wizard steps edit (all strings/numbers in data.wizard)
// ---------------------------------------------------------------------------
function npcbStatsObject(statArray) {
  const stats = {};
  NPCB_STATS.forEach((s, i) => {
    stats[s] = statArray[i];
  });
  return stats;
}

// Build a fresh spec from step 1 choices. "random" generates everything from
// the tier bands; "manual" rolls STATs but leaves skills and gear empty for
// the GM to fill in or paste from their own book. Gang changes are applied
// here for random NPCs and at Finish for manual ones (see gangApplied).
function npcbBuildSpec(choices, rng) {
  const tier = npcbTierOrDefault(choices.tier);
  const role = NPCB_ROLES.includes(choices.role) ? choices.role : "";
  const stats = npcbRollStats(tier, role, rng);
  const roleAbilities = role
    ? npcbRoleAbilityText([{ role, rank: NPCB_TIERS[tier].roleRank }])
    : "";
  if (choices.source === "manual") {
    return {
      tier,
      stats,
      roleAbilities,
      skillText: "",
      armor: "",
      weaponsText: "",
      gearText: "",
      gangApplied: false,
    };
  }
  const gear = npcbGenerateGear(tier, role, rng);
  let spec = {
    tier,
    stats,
    roleAbilities,
    skillText: npcbGenerateSkillText(tier, role, stats, gear.weapons, gear.gear, rng),
    armor: gear.armor,
    weaponsText: gear.weapons,
    gearText: gear.gear,
    gangApplied: false,
  };
  if (choices.gang) {
    spec = { ...npcbApplyGang(spec, choices.gang, rng), gangApplied: true };
  }
  return spec;
}

// spec -> data.wizard.* values for steps 2-4
function npcbSpecToWizardValues(spec) {
  const values = {
    "data.wizard.tier": spec.tier,
    "data.wizard.roleAbilities": spec.roleAbilities,
    "data.wizard.skillText": spec.skillText,
    "data.wizard.equipmentText": npcbEquipmentText(spec),
    "data.wizard.gangApplied": !!spec.gangApplied,
    "data.wizard.gearPreview": "",
    "data.wizard.skillPreview": "",
  };
  NPCB_STATS.forEach((s) => {
    values[`data.wizard.${s}`] = spec.stats[s];
  });
  return values;
}

function npcbSpecFromWizard(w) {
  const stats = {};
  NPCB_STATS.forEach((s) => {
    stats[s] = parseInt(w?.[s] || 0, 10) || 0;
  });
  return {
    tier: npcbTierOrDefault(w?.tier),
    stats,
    roleAbilities: w?.roleAbilities || "",
    skillText: w?.skillText || "",
    // One combined box; split against the item index before resolving
    equipmentText:
      w?.equipmentText ??
      npcbEquipmentText({
        armor: w?.armor || "",
        weaponsText: w?.weaponsText || "",
        gearText: w?.gearText || "",
      }),
    gangApplied: !!w?.gangApplied,
  };
}

// HP / Seriously Wounded / Death Save / Humanity, same formulas as the sheet
function npcbDerivedText(stats, tier) {
  const body = npcbStatValue(stats, "body");
  const will = npcbStatValue(stats, "will");
  const hp = 10 + 5 * Math.ceil((body + will) / 2);
  const total = NPCB_STATS.filter((s) => s !== "luck").reduce(
    (a, s) => a + npcbStatValue(stats, s),
    0
  );
  const t = NPCB_TIERS[npcbTierOrDefault(tier)];
  return `HP ${hp}  |  Seriously Wounded ${Math.ceil(hp / 2)}  |  Death Save ${body}  |  Humanity ${npcbStatValue(stats, "emp") * 10}  |  STAT total ${total} (${t.label} range ${t.statTotal[0]}-${t.statTotal[1]})`;
}

function npcbSkillPreviewText(skillText, roleAbilities, stats) {
  const parsed = npcbParseSkillText(skillText);
  const roles = npcbParseRoleAbilities(roleAbilities).roles.concat(parsed.roles);
  const lines = [];
  roles.forEach((r) => {
    lines.push(`ROLE  ${r.role.charAt(0).toUpperCase() + r.role.slice(1)} rank ${r.rank} (${r.ability})`);
  });
  parsed.skills.forEach((s) => {
    const statVal = npcbStatValue(stats, s.stat);
    const lvl = s.base - statVal;
    const flag = !s.known ? "  (not a core skill; uses INT)" : lvl < 0 ? "  (base is below the STAT; level set to 0)" : "";
    lines.push(`${s.known ? "OK  " : "?   "}  ${s.name} ${s.base} = ${s.stat.toUpperCase()} ${statVal} + ${Math.max(lvl, 0)}${flag}`);
  });
  parsed.problems.forEach((p) => lines.push(`??    Could not read "${p}"`));
  return lines.join(NPCB_NL);
}

// ---------------------------------------------------------------------------
// API helpers (used by the wizard steps)
// ---------------------------------------------------------------------------

// Load a light index of every item in the campaign. getRecordsByQuery returns
// at most 50 records, so page through by name. Cached per record window.
function npcbLoadItemIndex(callback) {
  const cached = api.getSession("npcbItemIndexV2");
  if (cached && cached.length > 0) {
    callback(npcbBuildIndex(cached));
    return;
  }
  const all = [];
  const page = (afterName) => {
    const query = {
      $sort: { name: 1 },
      // The server ignores dotted $select paths ("data.type"), so take all
      // of data; without types, weapon and armor lookups find nothing
      $select: ["_id", "name", "data"],
    };
    if (afterName !== null) query.name = { $gt: afterName };
    api.getRecordsByQuery(
      "items",
      query,
      (records) => {
        const list = records || [];
        list.forEach((r) => {
          all.push({
            name: r.name,
            type: r.data?.type ?? null,
            ammoType: r.data?.ammoType,
            slot: r.data?.cyberwareInstallSlot,
          });
        });
        if (list.length === 50) {
          page(list[list.length - 1].name);
        } else {
          api.setSession("npcbItemIndexV2", all);
          callback(npcbBuildIndex(all));
        }
      },
      50
    );
  };
  page(null);
}

// Fetch full records by exact name in batches of 50 -> {name: record}
function npcbFetchByNames(recordType, names, callback) {
  const unique = [...new Set(names.filter((n) => n))];
  const byName = {};
  const batch = (start) => {
    if (start >= unique.length) {
      callback(byName);
      return;
    }
    const chunk = unique.slice(start, start + 50);
    api.getRecordsByQuery(
      recordType,
      { name: { $in: chunk } },
      (records) => {
        (records || []).forEach((r) => {
          if (!byName[r.name]) byName[r.name] = r;
        });
        batch(start + 50);
      },
      50
    );
  };
  batch(0);
}

function npcbNotesHtml(spec, choices, resolved, roleProblems, skillProblems) {
  const t = NPCB_TIERS[npcbTierOrDefault(spec.tier)];
  const esc = (s) =>
    String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  const parts = [`<p><strong>${esc(t.label)}.</strong> ${esc(t.guidance)}</p>`];
  const gang = NPCB_GANGS[choices.gang];
  if (gang) parts.push(`<p><strong>Gang:</strong> ${esc(gang.label)}</p>`);
  if (choices.affiliation) {
    parts.push(`<p><strong>Affiliation:</strong> ${esc(choices.affiliation)}</p>`);
  }
  const descriptors = resolved.lines.filter((l) => l.descriptor);
  if (descriptors.length > 0) {
    parts.push(
      `<p><strong>Gear notes:</strong> ${descriptors
        .map((d) => `${esc(d.source)}`)
        .join("; ")}</p>`
    );
  }
  const created = resolved.lines.filter((l) => l.placeholder);
  if (created.length > 0) {
    parts.push(
      `<p><strong>Placeholder items (not found in this campaign):</strong> ${created
        .map((l) => esc(l.itemName))
        .join(", ")}</p>`
    );
  }
  const problems = [...roleProblems, ...skillProblems];
  if (problems.length > 0) {
    parts.push(`<p><strong>Could not read:</strong> ${problems.map(esc).join("; ")}</p>`);
  }
  if (choices.extraNotes) parts.push(`<p>${esc(choices.extraNotes)}</p>`);
  return parts.join("");
}

// Final step: write everything to the NPC, then recompute derived values with
// the sheet's own helpers and add Role(s).
function npcbFinishWizard(recordId, done) {
  api.getRecord("npcs", recordId, (rec) => {
    const w = rec.data?.wizard || {};
    let spec = npcbSpecFromWizard(w);
    const roleParse = npcbParseRoleAbilities(spec.roleAbilities);
    const skillParse = npcbParseSkillText(spec.skillText);
    const roleSpecs = [...roleParse.roles, ...skillParse.roles];

    npcbLoadItemIndex((index) => {
      spec = npcbWithEquipment(spec, index);
      // Manual NPCs get their gang changes on top of whatever the GM entered
      if (w.gang && !spec.gangApplied) spec = npcbApplyGang(spec, w.gang);
      const resolved = npcbResolveSpec(spec, index);
      npcbFetchByNames("items", npcbNamesToFetch(resolved), (itemsByName) => {
        const inventory = npcbBuildInventory(resolved, itemsByName);
        const abilityNames = ["Brawling", "Grab", "Throw", "Choke"];
        skillParse.skills.forEach((s) => {
          const m = s.name.match(/^Martial Arts \((.+)\)$/);
          if (m) abilityNames.push(m[1].trim());
        });
        const roleNames = roleSpecs.map((r) => r.role.charAt(0).toUpperCase() + r.role.slice(1));
        npcbFetchByNames("abilities", abilityNames, (abilitiesByName) => {
          npcbFetchByNames("roles", roleNames, (rolesByName) => {
            const t = NPCB_TIERS[spec.tier];
            const values = {
              "data.type": "mook",
              "data.npcLevel": t.label,
              "data.skills": npcbBuildSkills(skillParse.skills, spec.stats),
              "data.inventory": inventory,
              "data.abilities": abilityNames
                .map((n) => abilitiesByName[n])
                .filter((a) => a),
              "data.notes": npcbNotesHtml(spec, w, resolved, roleParse.problems, skillParse.problems),
              "data.curLuck": spec.stats.luck,
              "data.curEmp": spec.stats.emp,
              "data.wizard": {},
            };
            NPCB_STATS.forEach((s) => {
              values[`data.${s}`] = spec.stats[s];
            });
            // The name was set in the platform's own prompt before the wizard
            const finish = () => {
              if (done) done();
            };

            api.setValuesOnRecord(rec, values, () => {
              api.getRecord("npcs", recordId, (fresh) => {
                const derived = {};
                const best = getBestEquippedArmor(fresh);
                // curEmp/curLuck first: their humanity math reads the saved
                // record, so the full recalc below must have the last word
                setStatsAndSkills(fresh, spec.stats.emp, "curEmp", derived);
                setStatsAndSkills(fresh, spec.stats.luck, "curLuck", derived);
                updateAttributesOnRecord(fresh, derived, best.highestPenalty);
                derived["data.curhp"] = derived["data.hitpoints"];
                derived["data.curHumanity"] = derived["data.totalHumanity"];
                derived["data.headArmor"] = best.head[0]?.name || "";
                derived["data.headArmorSP"] = best.head[0]?.curSp || 0;
                derived["data.headArmorPenalty"] = best.head[0]?.penalty || 0;
                derived["data.bodyArmor"] = best.body[0]?.name || "";
                derived["data.bodyArmorSP"] = best.body[0]?.curSp || 0;
                derived["data.bodyArmorPenalty"] = best.body[0]?.penalty || 0;
                derived["data.shield"] = best.shield[0]?.name || "";
                derived["data.shieldHP"] = best.shield[0]?.curSp || 0;
                derived["data.shieldPenalty"] = best.shield[0]?.penalty || 0;
                api.setValuesOnRecord(fresh, derived, () => {
                  npcbAddRoles(recordId, roleSpecs, rolesByName, finish);
                });
              });
            });
          });
        });
      });
    });
  });
}

function npcbAddRoles(recordId, roleSpecs, rolesByName, done) {
  const finish = () => {
    if (done) done();
  };
  const entries = [];
  roleSpecs.forEach((r) => {
    const roleRecord = rolesByName[r.role.charAt(0).toUpperCase() + r.role.slice(1)];
    if (!roleRecord || entries.some((e) => e.name === roleRecord.name)) return;
    entries.push({
      ...roleRecord,
      data: buildRoleData(roleRecord, entries.length + 1, Math.max(1, Math.min(10, r.rank || 1))),
    });
  });
  if (entries.length === 0) {
    finish();
    return;
  }
  api.getRecord("npcs", recordId, (fresh) => {
    api.setValuesOnRecord(
      fresh,
      { "data.roles": entries, "fields.rolePanels.hidden": false },
      () => {
        api.getRecord("npcs", recordId, (withRoles) => {
          updateRoles(withRoles);
          finish();
        });
      }
    );
  });
}

// ---------------------------------------------------------------------------
// NPC sheet "Import Gear": one pasted line (weapons, ammo, gear, cyberware)
// added to an existing NPC's inventory.
// ---------------------------------------------------------------------------

// Stat block weapon/armor boxes pasted as text: drop labels, SP lines and
// damage dice ("Poor Quality Shotgun 5d6 Very Heavy Pistol 4d6")
function npcbCleanEquipment(text) {
  return npcbCleanPaste(text)
    .replace(/(▶\s*)?cyberware\s*(&|and)\s*special equipment\s*:?/gi, ", ")
    .replace(/\barmou?r\s*:\s*/gi, ", ")
    .replace(/\b(head|body)\s+\d+\s*sp\b/gi, ", ")
    .replace(/\s+\d+d\d+\b/gi, ", ");
}

// One "Weapons, Armor & Equipment" text -> { armor, weaponsText, gearText }.
// Armor names become the armor choice, real weapons go to the weapons part
// (so their ammo can be inferred and loaded), everything else is gear. Line
// breaks between gear entries are kept so wrapped names can be re-joined.
function npcbSplitEquipment(text, index) {
  let armor = "";
  const weapons = [];
  let gear = "";
  let programStarted = false;
  npcbParseList(npcbCleanEquipment(text)).forEach((e) => {
    if (NPCB_NOT_ITEMS.test(e.name)) return;
    if (!e.program && !armor && !e.parenText) {
      const choice = npcbArmorChoice(e.name);
      if (choice) {
        armor = choice;
        return;
      }
    }
    let isWeapon = false;
    if (!e.program && !npcbParseAmmo(e.name, e.count) && !/^pop-?up\s/i.test(e.name)) {
      const hit = npcbFindWeapon(e.name, index);
      // A quality fallback ("Excellent Quality Flamethrower" -> Flamethrower)
      // is still that weapon
      isWeapon =
        !!hit &&
        (hit.how !== "fuzzy" || !!hit.note) &&
        (hit.entry.type === "ranged weapon" || hit.entry.type === "melee weapon");
    }
    if (isWeapon) {
      weapons.push(e.raw);
      return;
    }
    let raw = e.raw;
    if (e.program && !programStarted) {
      raw = `Programs: ${raw}`;
      programStarted = true;
    }
    gear += gear ? `${e.nl ? NPCB_NL : ", "}${raw}` : raw;
  });
  return { armor, weaponsText: weapons.join(", "), gearText: gear };
}

// Combined text for the wizard's single equipment box
function npcbEquipmentText(spec) {
  return [spec.armor, spec.weaponsText, spec.gearText]
    .filter((part) => part)
    .join(", ");
}

// Fill armor/weaponsText/gearText from the combined box (needs the index)
function npcbWithEquipment(spec, index) {
  if (spec.equipmentText === undefined) return spec;
  return { ...spec, ...npcbSplitEquipment(spec.equipmentText, index) };
}

function npcbImportGear(recordType, recordId, text, done) {
  npcbLoadItemIndex((index) => {
    const spec = npcbSplitEquipment(text, index);
    const resolved = npcbResolveSpec(spec, index);
    npcbFetchByNames("items", npcbNamesToFetch(resolved), (itemsByName) => {
      api.getRecord(recordType, recordId, (rec) => {
        const inventory = npcbBuildInventory(
          resolved,
          itemsByName,
          rec.data?.inventory || []
        );
        const addedCount = resolved.lines.filter((l) => !l.descriptor).length;
        api.setValuesOnRecord(
          rec,
          { "data.inventory": inventory, "data.gearImportText": "" },
          () => {
            api.getRecord(recordType, recordId, (fresh) => {
              const derived = {};
              const best = getBestEquippedArmor(fresh);
              updateAttributesOnRecord(fresh, derived, best.highestPenalty);
              derived["data.headArmor"] = best.head[0]?.name || "";
              derived["data.headArmorSP"] = best.head[0]?.curSp || 0;
              derived["data.headArmorPenalty"] = best.head[0]?.penalty || 0;
              derived["data.bodyArmor"] = best.body[0]?.name || "";
              derived["data.bodyArmorSP"] = best.body[0]?.curSp || 0;
              derived["data.bodyArmorPenalty"] = best.body[0]?.penalty || 0;
              derived["data.shield"] = best.shield[0]?.name || "";
              derived["data.shieldHP"] = best.shield[0]?.curSp || 0;
              derived["data.shieldPenalty"] = best.shield[0]?.penalty || 0;
              api.setValuesOnRecord(fresh, derived, () => {
                const placeholders = resolved.lines.filter((l) => l.placeholder);
                if (done) done(addedCount, placeholders.map((l) => l.itemName));
              });
            });
          }
        );
      });
    });
  });
}
