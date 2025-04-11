// Generates a random UUID for adding Subskills manually to Skills during character creation
function generateUuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    // Generate a random number between 0 and 15 (0xF)
    const r = Math.floor(Math.random() * 16);
    // For 'x', use random digit
    // For 'y', use random digit with bits 0 and 1 set to 1 and 0 respectively (8, 9, A, or B)
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    // Convert to hexadecimal string
    return v.toString(16);
  });
}

const getNearestParentDataPath = (dataPath) => {
  const parts = dataPath.split(".data");
  return parts.length > 1 ? parts.slice(0, -1).join(".data") : "";
};

function capitalize(string) {
  if (!string || typeof string !== "string") return "";
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function normalToCamelCase(str) {
  return str
    .toLowerCase()
    .replace(/\s+(.)/g, (match, char) => char.toUpperCase());
}

function camelToNormal(skill) {
  return skill.replace(/([A-Z])/g, " $1").replace(/^./, function (str) {
    return str.toUpperCase();
  });
}

// Checks for replacements in a string modifier
function checkForReplacements(value, replacements = {}, recordOverride = null) {
  let thisRecord = recordOverride || record;
  // Case for 'Half <role> Rank'
  const matchLevel = value.match(/[Hh]alf (\w+) [Rr]ank/);
  const matchClassLevel = value.match(/(\w+) [Rr]ank/);
  if (matchLevel) {
    const roleName = matchLevel[1];
    // Class specific half level
    const roleRanks =
      (thisRecord?.data?.roleRanks || "").match(`${roleName} (\\d+)`)?.[1] || 0;
    if (roleRanks) {
      value = value.replaceAll(
        matchLevel[0],
        Math.floor(parseInt(roleRanks || "1", 10) / 2)
      );
    }
  }
  // Case for '<role> Rank'
  else if (matchClassLevel) {
    const roleName = matchClassLevel[1];
    // Role specific rank
    const roleRanks =
      (thisRecord?.data?.roleRanks || "").match(`${roleName} (\\d+)`)?.[1] || 0;
    if (roleRanks) {
      value = value.replaceAll(
        matchClassLevel[0],
        parseInt(roleRanks || "1", 10)
      );
    }
  }
  // Case for INT|REF|DEX|TECH|COOL|WILL|LUCK|MOVE|BODY|EMP
  const statRegex = /(INT|REF|DEX|TECH|COOL|WILL|LUCK|MOVE|BODY|EMP)/gi;
  let match;
  while ((match = statRegex.exec(value)) !== null) {
    let stat = match[0].toLowerCase().replace(" ", "");
    if (stat === "emp") {
      stat = "curEmp";
    } else if (stat === "luck") {
      stat = "curLuck";
    }
    const statVal = parseInt(thisRecord?.data?.[stat] || "0", 10);
    // Create a new regex with the exact match to replace just this occurrence
    const replaceRegex = new RegExp(match[0], "g");
    value = value.replace(replaceRegex, statVal);
  }
  // Check for replacements in the replacements object
  if (replacements && Object.keys(replacements).length > 0) {
    Object.keys(replacements).forEach((key) => {
      value = value.replaceAll(key, replacements[key]);
    });
  }
  return value;
}

function getResultFromTable(table, total) {
  if (
    !table ||
    !table.rows ||
    !Array.isArray(table.rows) ||
    table.rows.length === 0
  ) {
    return null;
  }

  // Find the row where the total falls between minValue and maxValue (inclusive)
  const matchingRow = table.rows.find(
    (row) => total >= row.minValue && total <= row.maxValue
  );

  return matchingRow || null;
}

function evaluateMath(stringValue) {
  // Return 0 if no value provided
  if (!stringValue) return 0;

  try {
    // Remove all whitespace and validate string only contains valid math characters
    const sanitizedString = stringValue.replace(/\s+/g, "");
    if (!/^[0-9+\-*/().]+$/.test(sanitizedString)) {
      return 0;
    }

    // Use Function constructor to safely evaluate the math expression
    // Math.floor to match D&D's rounding down convention
    return Math.floor(Function(`'use strict'; return (${sanitizedString})`)());
  } catch (e) {
    // Return 0 if evaluation fails
    return 0;
  }
}

function applyMath(value, math) {
  // Trim spaces and split the string into operator and number
  const trimmedMath = math.trim();
  const operator = trimmedMath.charAt(0);
  const number = parseInt(trimmedMath.slice(1).trim(), 10);

  if (isNaN(number)) {
    return value;
  }

  switch (operator) {
    case "+":
      return value + number;
    case "-":
      return value - number;
    case "*":
      return value * number;
    case "/":
      return Math.floor(value / number); // Always round down
    default:
      return value;
  }
}

function getDamageType(rollString) {
  const regex = /(?:\d*d\d+|\+\d+)?(?:\s*\+?-?\s*\d+)?(?:\s+([\w-_]+))?/;
  const match = rollString.match(regex);
  return match && match[1] ? match[1] : "untyped";
}

function getAllSkills() {
  return [
    {
      groupName: "Awareness Skills",
      groupField: "skillGroups1",
      skills: [
        {
          name: "Concentration",
          stat: "will",
          isDefault: true,
          hasSubskills: false,
          isTimesTwo: false,
          recordType: "skill",
        },
        {
          name: "Conceal/Reveal Object",
          stat: "int",
          isDefault: false,
          hasSubskills: false,
          isTimesTwo: false,
          recordType: "skill",
        },
        {
          name: "Lip Reading",
          stat: "int",
          isDefault: false,
          hasSubskills: false,
          isTimesTwo: false,
          recordType: "skill",
        },
        {
          name: "Perception",
          stat: "int",
          isDefault: true,
          hasSubskills: false,
          isTimesTwo: false,
          recordType: "skill",
        },
        {
          name: "Tracking",
          stat: "int",
          isDefault: false,
          hasSubskills: false,
          isTimesTwo: false,
          recordType: "skill",
        },
      ],
    },
    {
      groupName: "Body Skills",
      groupField: "skillGroups1",
      skills: [
        {
          name: "Athletics",
          stat: "dex",
          isDefault: true,
          hasSubskills: false,
          isTimesTwo: false,
          recordType: "skill",
        },
        {
          name: "Contortionist",
          stat: "dex",
          isDefault: false,
          hasSubskills: false,
          isTimesTwo: false,
          recordType: "skill",
        },
        {
          name: "Dance",
          stat: "dex",
          isDefault: false,
          hasSubskills: false,
          isTimesTwo: false,
          recordType: "skill",
        },
        {
          name: "Endurance",
          stat: "will",
          isDefault: false,
          hasSubskills: false,
          isTimesTwo: false,
          recordType: "skill",
        },
        {
          name: "Resist Torture/Drugs",
          stat: "will",
          isDefault: false,
          hasSubskills: false,
          isTimesTwo: false,
          recordType: "skill",
        },
        {
          name: "Stealth",
          stat: "dex",
          isDefault: true,
          hasSubskills: false,
          isTimesTwo: false,
          recordType: "skill",
        },
      ],
    },
    {
      groupName: "Control Skills",
      groupField: "skillGroups1",
      skills: [
        {
          name: "Drive Land Vehicle",
          stat: "ref",
          isDefault: false,
          hasSubskills: false,
          isTimesTwo: false,
          recordType: "skill",
        },
        {
          name: "Pilot Air Vehicle (x2)",
          stat: "ref",
          isDefault: false,
          hasSubskills: false,
          isTimesTwo: true,
          recordType: "skill",
        },
        {
          name: "Pilot Sea Vehicle",
          stat: "ref",
          isDefault: false,
          hasSubskills: false,
          isTimesTwo: false,
          recordType: "skill",
        },
        {
          name: "Riding",
          stat: "ref",
          isDefault: false,
          hasSubskills: false,
          isTimesTwo: false,
          recordType: "skill",
        },
      ],
    },
    {
      groupName: "Education Skills",
      groupField: "skillGroups1",
      skills: [
        {
          name: "Accounting",
          stat: "int",
          isDefault: false,
          hasSubskills: false,
          isTimesTwo: false,
          recordType: "skill",
        },
        {
          name: "Animal Handling",
          stat: "int",
          isDefault: false,
          hasSubskills: false,
          isTimesTwo: false,
          recordType: "skill",
        },
        {
          name: "Bureaucracy",
          stat: "int",
          isDefault: false,
          hasSubskills: false,
          isTimesTwo: false,
          recordType: "skill",
        },
        {
          name: "Business",
          stat: "int",
          isDefault: false,
          hasSubskills: false,
          isTimesTwo: false,
          recordType: "skill",
        },
        {
          name: "Composition",
          stat: "int",
          isDefault: false,
          hasSubskills: false,
          isTimesTwo: false,
          recordType: "skill",
        },
        {
          name: "Criminology",
          stat: "int",
          isDefault: false,
          hasSubskills: false,
          isTimesTwo: false,
          recordType: "skill",
        },
        {
          name: "Cryptography",
          stat: "int",
          isDefault: false,
          hasSubskills: false,
          isTimesTwo: false,
          recordType: "skill",
        },
        {
          name: "Deduction",
          stat: "int",
          isDefault: false,
          hasSubskills: false,
          isTimesTwo: false,
          recordType: "skill",
        },
        {
          name: "Education",
          stat: "int",
          isDefault: true,
          hasSubskills: false,
          isTimesTwo: false,
          recordType: "skill",
        },
        {
          name: "Gamble",
          stat: "int",
          isDefault: false,
          hasSubskills: false,
          isTimesTwo: false,
          recordType: "skill",
        },
        {
          name: "Language",
          stat: "int",
          isDefault: false,
          hasSubskills: true,
          isTimesTwo: false,
          recordType: "skill",
          subSkills: [
            {
              name: "Streetslang",
              isDefault: true,
            },
            {
              name: "",
              isDefault: false,
            },
            {
              name: "",
              isDefault: false,
            },
          ],
        },
        {
          name: "Library Search",
          stat: "int",
          isDefault: false,
          hasSubskills: false,
          isTimesTwo: false,
          recordType: "skill",
        },
        {
          name: "Local Expert",
          stat: "int",
          isDefault: false,
          hasSubskills: true,
          isTimesTwo: false,
          recordType: "skill",
          subSkills: [
            {
              name: "Your Home",
              isDefault: true,
            },
            {
              name: "",
              isDefault: false,
            },
            {
              name: "",
              isDefault: false,
            },
          ],
        },
        {
          name: "Science",
          stat: "int",
          isDefault: false,
          hasSubskills: true,
          isTimesTwo: false,
          recordType: "skill",
          subSkills: [
            {
              name: "",
              isDefault: false,
            },
            {
              name: "",
              isDefault: false,
            },
          ],
        },
        {
          name: "Tactics",
          stat: "int",
          isDefault: false,
          hasSubskills: false,
          isTimesTwo: false,
          recordType: "skill",
        },
        {
          name: "Wilderness Survival",
          stat: "int",
          isDefault: false,
          hasSubskills: false,
          isTimesTwo: false,
          recordType: "skill",
        },
      ],
    },
    {
      groupName: "Fighting Skills",
      groupField: "skillGroups2",
      skills: [
        {
          name: "Brawling",
          stat: "dex",
          isDefault: true,
          hasSubskills: false,
          isTimesTwo: false,
          recordType: "skill",
        },
        {
          name: "Evasion",
          stat: "dex",
          isDefault: true,
          hasSubskills: false,
          isTimesTwo: false,
          recordType: "skill",
        },
        {
          name: "Martial Arts (x2)",
          stat: "dex",
          isDefault: false,
          hasSubskills: true,
          isTimesTwo: true,
          recordType: "skill",
          subSkills: [
            {
              name: "",
              isDefault: false,
            },
          ],
        },
        {
          name: "Melee Weapon",
          stat: "dex",
          isDefault: false,
          hasSubskills: false,
          isTimesTwo: false,
          recordType: "skill",
        },
      ],
    },
    {
      groupName: "Performance Skills",
      groupField: "skillGroups2",
      skills: [
        {
          name: "Acting",
          stat: "cool",
          isDefault: false,
          hasSubskills: false,
          isTimesTwo: false,
          recordType: "skill",
        },
        {
          name: "Play Instrument",
          stat: "tech",
          isDefault: false,
          hasSubskills: true,
          isTimesTwo: false,
          recordType: "skill",
          subSkills: [
            {
              name: "",
              isDefault: false,
            },
            {
              name: "",
              isDefault: false,
            },
          ],
        },
      ],
    },
    {
      groupName: "Ranged Weapon Skills",
      groupField: "skillGroups2",
      skills: [
        {
          name: "Archery",
          stat: "ref",
          isDefault: false,
          hasSubskills: false,
          isTimesTwo: false,
          recordType: "skill",
        },
        {
          name: "Autofire (x2)",
          stat: "ref",
          isDefault: false,
          hasSubskills: false,
          isTimesTwo: true,
          recordType: "skill",
        },
        {
          name: "Handgun",
          stat: "ref",
          isDefault: false,
          hasSubskills: false,
          isTimesTwo: false,
          recordType: "skill",
        },
        {
          name: "Heavy Weapons (x2)",
          stat: "ref",
          isDefault: false,
          hasSubskills: false,
          isTimesTwo: true,
          recordType: "skill",
        },
        {
          name: "Shoulder Arms",
          stat: "ref",
          isDefault: false,
          hasSubskills: false,
          isTimesTwo: false,
          recordType: "skill",
        },
      ],
    },
    {
      groupName: "Social Skills",
      groupField: "skillGroups2",
      skills: [
        {
          name: "Bribery",
          stat: "cool",
          isDefault: false,
          hasSubskills: false,
          isTimesTwo: false,
          recordType: "skill",
        },
        {
          name: "Conversation",
          stat: "emp",
          isDefault: true,
          hasSubskills: false,
          isTimesTwo: false,
          recordType: "skill",
        },
        {
          name: "Human Perception",
          stat: "emp",
          isDefault: true,
          hasSubskills: false,
          isTimesTwo: false,
          recordType: "skill",
        },
        {
          name: "Interrogation",
          stat: "cool",
          isDefault: false,
          hasSubskills: false,
          isTimesTwo: false,
          recordType: "skill",
        },
        {
          name: "Persuasion",
          stat: "cool",
          isDefault: true,
          hasSubskills: false,
          isTimesTwo: false,
          recordType: "skill",
        },
        {
          name: "Personal Grooming",
          stat: "cool",
          isDefault: false,
          hasSubskills: false,
          isTimesTwo: false,
          recordType: "skill",
        },
        {
          name: "Streetwise",
          stat: "cool",
          isDefault: false,
          hasSubskills: false,
          isTimesTwo: false,
          recordType: "skill",
        },
        {
          name: "Trading",
          stat: "cool",
          isDefault: false,
          hasSubskills: false,
          isTimesTwo: false,
          recordType: "skill",
        },
        {
          name: "Wardrobe & Style",
          stat: "cool",
          isDefault: false,
          hasSubskills: false,
          isTimesTwo: false,
          recordType: "skill",
        },
      ],
    },
    {
      groupName: "Technique Skills",
      groupField: "skillGroups2",
      skills: [
        {
          name: "Air Vehicle Tech",
          stat: "tech",
          isDefault: false,
          hasSubskills: false,
          isTimesTwo: false,
          recordType: "skill",
        },
        {
          name: "Basic Tech",
          stat: "tech",
          isDefault: false,
          hasSubskills: false,
          isTimesTwo: false,
          recordType: "skill",
        },
        {
          name: "Cybertech",
          stat: "tech",
          isDefault: false,
          hasSubskills: false,
          isTimesTwo: false,
          recordType: "skill",
        },
        {
          name: "Demolitions (x2)",
          stat: "tech",
          isDefault: false,
          hasSubskills: false,
          isTimesTwo: true,
          recordType: "skill",
        },
        {
          name: "Electronics/Security Tech (x2)",
          stat: "tech",
          isDefault: false,
          hasSubskills: false,
          isTimesTwo: true,
          recordType: "skill",
        },
        {
          name: "First Aid",
          stat: "tech",
          isDefault: true,
          hasSubskills: false,
          isTimesTwo: false,
          recordType: "skill",
        },
        {
          name: "Forgery",
          stat: "tech",
          isDefault: false,
          hasSubskills: false,
          isTimesTwo: false,
          recordType: "skill",
        },
        {
          name: "Land Vehicle Tech",
          stat: "tech",
          isDefault: false,
          hasSubskills: false,
          isTimesTwo: false,
          recordType: "skill",
        },
        {
          name: "Paint/Draw/Sculpt",
          stat: "tech",
          isDefault: false,
          hasSubskills: false,
          isTimesTwo: false,
          recordType: "skill",
        },
        {
          name: "Paramedic (x2)",
          stat: "tech",
          isDefault: false,
          hasSubskills: false,
          isTimesTwo: true,
          recordType: "skill",
        },
        {
          name: "Photography/Film",
          stat: "tech",
          isDefault: false,
          hasSubskills: false,
          isTimesTwo: false,
          recordType: "skill",
        },
        {
          name: "Pick Lock",
          stat: "tech",
          isDefault: false,
          hasSubskills: false,
          isTimesTwo: false,
          recordType: "skill",
        },
        {
          name: "Pick Pocket",
          stat: "tech",
          isDefault: false,
          hasSubskills: false,
          isTimesTwo: false,
          recordType: "skill",
        },
        {
          name: "Sea Vehicle Tech",
          stat: "tech",
          isDefault: false,
          hasSubskills: false,
          isTimesTwo: false,
          recordType: "skill",
        },
        {
          name: "Weaponstech",
          stat: "tech",
          isDefault: false,
          hasSubskills: false,
          isTimesTwo: false,
          recordType: "skill",
        },
      ],
    },
  ];
}

function getDvForRange(item, range, attack) {
  if (item.data?.type === "ranged weapon" && attack !== "suppresive") {
    // We'll denote 99 as an impossible shot
    let dv = 99;
    if (range >= 401 && range <= 800 && attack !== "autofire") {
      return item.data?.dv401to800 || 0;
    } else if (range >= 201 && range <= 400 && attack !== "autofire") {
      return item.data?.dv201to400 || 0;
    } else if (range >= 101 && range <= 200 && attack !== "autofire") {
      return item.data?.dv101to200 || 0;
    } else if (range >= 51 && range <= 100) {
      if (attack === "autofire") {
        return item.data?.af51to100 || 0;
      } else {
        return item.data?.dv51to100 || 0;
      }
    } else if (range >= 26 && range <= 50) {
      if (attack === "autofire") {
        return item.data?.af26to50 || 0;
      } else {
        return item.data?.dv26to50 || 0;
      }
    } else if (range >= 13 && range <= 25) {
      if (attack === "autofire") {
        return item.data?.af13to25 || 0;
      } else {
        return item.data?.dv13to25 || 0;
      }
    } else if (range >= 7 && range <= 12) {
      if (attack === "autofire") {
        return item.data?.af7to12 || 0;
      } else {
        return item.data?.dv7to12 || 0;
      }
    } else if (range >= 0 && range <= 6) {
      if (attack === "autofire") {
        return item.data?.af0to6 || 0;
      } else {
        return item.data?.dv0to6 || 0;
      }
    }
    return dv;
  }

  // Throwing ammo
  if (item.data?.type === "ammo") {
    let dv = 99;
    if (range >= 13 && range <= 25) {
      dv = 15;
    } else if (range >= 7 && range <= 12) {
      dv = 15;
    } else if (range >= 0 && range <= 6) {
      dv = 16;
    }
    return dv;
  }

  // Melee Weapons are vs the Target's Dodge attempt, which is handled
  // via a Macro.
  return 0;
}

function setStatsAndSkills(
  record,
  value,
  stat,
  moreValuesToSet = null,
  penalty = 0,
  updateCurHp = false
) {
  // Create an object to hold all the values we want to set
  const valuesToSet = {};

  // Parse the stat value
  let val = parseInt(value, 10);
  if (isNaN(val)) {
    return;
  }

  // The stat we'll use when checking for skill changes
  let statToCheck = stat;

  // Store the base stat value and totalStat
  valuesToSet[`data.${stat}`] = val;
  valuesToSet[`data.total${capitalize(stat)}`] = val;

  // Body / Will / and EMP have derived attributes that could be affected or not affected by modifiers
  // So we track the value used to calculate the derived attributes
  let trackActual = false;
  if (
    stat === "body" ||
    stat === "will" ||
    stat === "emp" ||
    stat === "curEmp"
  ) {
    trackActual = true;
  }

  if (trackActual) {
    valuesToSet[`data.actual${capitalize(stat)}`] = val;
  }

  // Get all modifiers for this stat and set totalStat
  const modifiers = getEffectsAndModifiersForToken(
    record,
    ["statBonus", "statPenalty"],
    stat
  );

  const sortedModifiers = [...modifiers].sort((a, b) =>
    a.isSet ? -1 : b.isSet ? 1 : 0
  );

  // Apply modifiers to totalStat
  sortedModifiers.forEach((modifier) => {
    let maxValue = modifier.max || Infinity;
    let minValue = modifier.min || -Infinity;

    // Apply modifiers obeying max value if it was defined
    if (
      (modifier.isSet &&
        modifier.modifierType === "statBonus" &&
        valuesToSet[`data.total${capitalize(modifier.field)}`] <
          modifier.value) ||
      (modifier.isSet &&
        modifier.modifierType === "statPenalty" &&
        valuesToSet[`data.total${capitalize(modifier.field)}`] > modifier.value)
    ) {
      valuesToSet[`data.total${capitalize(modifier.field)}`] = modifier.value;
      if (trackActual && !modifier.noDerivedAttributes) {
        valuesToSet[`data.actual${capitalize(modifier.field)}`] =
          valuesToSet[`data.total${capitalize(modifier.field)}`];
      }
    } else {
      // Apply the modifier and then constrain to min/max range
      const newValue =
        valuesToSet[`data.total${capitalize(modifier.field)}`] + modifier.value;
      valuesToSet[`data.total${capitalize(modifier.field)}`] = Math.min(
        Math.max(newValue, minValue),
        maxValue
      );

      if (trackActual && !modifier.noDerivedAttributes) {
        valuesToSet[`data.actual${capitalize(modifier.field)}`] =
          valuesToSet[`data.total${capitalize(modifier.field)}`];
      }
    }
  });

  // Apply penalty if set (minimum of 0)
  if (penalty > 0) {
    valuesToSet[`data.total${capitalize(stat)}`] = Math.max(
      0,
      valuesToSet[`data.total${capitalize(stat)}`] - penalty
    );
    if (trackActual) {
      valuesToSet[`data.actual${capitalize(stat)}`] = Math.max(
        0,
        valuesToSet[`data.actual${capitalize(stat)}`] - penalty
      );
    }
  }

  // Handle hitpoints calculation when body or will changes
  if (stat === "body" || stat === "will") {
    // Get the current values of body and will
    let bodyValue =
      stat === "body"
        ? valuesToSet[`data.actualBody`]
        : moreValuesToSet?.["data.actualBody"] || record.data.actualBody;
    let willValue =
      stat === "will"
        ? valuesToSet[`data.actualWill`]
        : moreValuesToSet?.["data.actualWill"] || record.data.actualWill;

    // Calculate hitpoints using the formula: 10 + (5 * (average of BODY and WILL, rounded up))
    const average = Math.ceil((bodyValue + willValue) / 2);
    const hitpoints = 10 + 5 * average;

    valuesToSet["data.hitpoints"] = hitpoints;
    if (updateCurHp) {
      valuesToSet["data.curhp"] = hitpoints;
    }

    // Set seriouslyWounded to half rounded up of hitpoints
    valuesToSet["data.seriouslyWounded"] = Math.ceil(hitpoints / 2);

    // Set deathSave equal to body when body changes if deathSave is not already set
    if (stat === "body") {
      valuesToSet["data.deathSave"] = valuesToSet["data.actualBody"];
    }
  }

  // If the stat was emp, we set maxHumanity
  if (stat === "emp") {
    valuesToSet["data.humanity"] = valuesToSet["data.actualEmp"] * 10;
    // Only set curHumanity if it's not already set
    if (record?.data?.curHumanity === undefined) {
      valuesToSet["data.curHumanity"] = valuesToSet["data.actualEmp"] * 10;
    }
    // We change skills only based on curEmp, not maxEmp
    statToCheck = "n/a";
  }

  if (stat === "curHumanity") {
    // Set curEmp equal to curHumanity / 10
    valuesToSet["data.curEmp"] = Math.floor(val / 10);
    statToCheck = "emp";
    val = Math.floor(val / 10);
  }

  if (stat === "curEmp") {
    // We actually adjust skills by curEmp
    statToCheck = "emp";
  }

  // Also for luck, we adjust skills by curLuck
  if (stat === "curLuck") {
    statToCheck = "luck";
  }
  if (stat === "luck") {
    statToCheck = "n/a";
  }

  // Update all skills based on this stat
  if (
    [
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
    ].includes(statToCheck)
  ) {
    const skillGroup1 = record?.data?.skillGroups1 || [];
    const skillGroup2 = record?.data?.skillGroups2 || [];
    [
      { groups: skillGroup1, field: "skillGroups1" },
      { groups: skillGroup2, field: "skillGroups2" },
    ].forEach(({ groups, field }) => {
      groups.forEach((group, groupIndex) => {
        const skills = group.data?.skills || [];
        skills.forEach((skill, skillIndex) => {
          if (skill.data?.stat === statToCheck && !skill.data?.hasSubskills) {
            // Set the Base to LVL + value
            const lvl = skill.data?.lvl || 0;
            const base = lvl + valuesToSet[`data.total${capitalize(stat)}`];
            valuesToSet[
              `data.${field}.${groupIndex}.data.skills.${skillIndex}.data.base`
            ] = base;
          }
          const subSkills = skill.data?.subSkills || [];
          subSkills.forEach((subSkill, subSkillIndex) => {
            if (subSkill.data?.stat === statToCheck) {
              // Set the Base to LVL + value
              const lvl = subSkill.data?.lvl || 0;
              const base = lvl + valuesToSet[`data.total${capitalize(stat)}`];
              valuesToSet[
                `data.${field}.${groupIndex}.data.skills.${skillIndex}.data.subSkills.${subSkillIndex}.data.base`
              ] = base;
            }
          });
        });
      });
    });
  }

  // Apply all the changes
  if (Object.keys(valuesToSet).length > 0) {
    if (moreValuesToSet) {
      // If additional values were provided, merge our calculated values into that object
      Object.keys(valuesToSet).forEach((key) => {
        moreValuesToSet[key] = valuesToSet[key];
      });
    } else {
      // Otherwise, set the values directly
      api.setValues(valuesToSet);
    }
  }
}

const MODIFIERS_WITHOUT_VALUE = [
  "noArmorAblation",
  "noCriticalInjuries",
  "nonLethal",
  "nonLethalGreaterThanOne",
];

function getEffectsAndModifiersForToken(
  target,
  types = [],
  field = "",
  // If Item ID is provided, we only return modifiers for that item
  itemId = undefined,
  // If Weapon is provided, we also look on it and attachments on it
  weapon = undefined,
  // If Ammo is provided, we also look for modifiers on it
  ammoItem = undefined
) {
  if (!target) {
    return [];
  }
  let results = [];

  // Set of stack modifiers that we have seen so we don't duplicate them
  const stackModifiers = {};

  // First collect modifiers from effects
  const effects = target?.effects || [];
  effects.forEach((effect) => {
    const rules = effect.rules || [];
    rules.forEach((rule) => {
      const ruleType = rule?.type || "";
      const isPenalty = ruleType.toLowerCase().includes("penalty");
      let value = rule.value || "";
      if (rule.valueType === "number") {
        value = parseInt(rule.value, 10);
        if (isNaN(value)) {
          value = 0;
        }
        if (isPenalty && value > 0) {
          value = -value;
        }
      } else if (
        rule.valueType === "string" &&
        !value.trim().startsWith("-") &&
        isPenalty &&
        !value.includes("disadvantage")
      ) {
        value = "-" + value;
      }
      // Check for strings that require replacements
      if (rule.valueType === "string") {
        value = checkForReplacements(value, {}, target);
      }
      if (
        MODIFIERS_WITHOUT_VALUE.includes(ruleType) ||
        (value !== 0 &&
          (rule.valueType === "number" || rule.valueType === "string"))
      ) {
        results.push({
          name: effect.name || "Effect",
          value: value,
          active: true,
          modifierType: ruleType,
          field: rule?.field || "",
          valueType: rule.valueType,
          isPenalty: isPenalty,
          isEffect: true,
        });
      } else if (rule.valueType === "api") {
        let value = parseInt(target?.effectValues?.[effect?._id] || "0", 10);
        if (isPenalty && value > 0) {
          value = -value;
        }
        if (value !== 0 || MODIFIERS_WITHOUT_VALUE.includes(ruleType)) {
          results.push({
            name: effect.name || "Effect",
            value: value,
            active: true,
            modifierType: ruleType,
            field: rule?.field || "",
            valueType: rule.valueType,
            isPenalty: isPenalty,
            isEffect: true,
          });
        }
      } else if (
        rule.valueType === "stack" &&
        !stackModifiers[`${effect?._id}-${JSON.stringify(rule)}`]
      ) {
        stackModifiers[`${effect?._id}-${JSON.stringify(rule)}`] = true;
        // The value is the number of times they have this effect
        let value = target?.effectIds?.filter(
          (id) => id === effect?._id
        ).length;
        if (isPenalty && value > 0) {
          value = -value;
        }
        // Check if there is addtional math to apply to it
        const math = rule?.value || "";
        if (math) {
          value = applyMath(value, math);
        }
        if (isPenalty && value > 0) {
          value = -value;
        }
        if (value !== 0 || MODIFIERS_WITHOUT_VALUE.includes(ruleType)) {
          results.push({
            name: effect.name || "Effect",
            value: value,
            active: true,
            modifierType: ruleType,
            field: rule?.field || "",
            valueType: rule.valueType,
            isPenalty: isPenalty,
            isEffect: true,
          });
        }
      }
    });
  });

  // Now collect all modifiers from Features and Items
  const features = target?.data?.features || [];
  // Ensure items is an array before filtering
  const items = Array.isArray(target?.data?.inventory)
    ? target?.data?.inventory
    : [];

  // Filter items that are not equipped or that require being active (cyberware) and not active
  const equippedItems = items.filter(
    (item) =>
      item.data?.carried === "equipped" &&
      (item.data?.type !== "cyberware" || item.data?.active === "true")
  );

  const criticalInjuries = target?.data?.criticalInjuries || [];
  const addictions = target?.data?.addictions || [];

  const attachments = weapon ? weapon?.data?.attachments || [] : [];
  // Filter attachments to only include attachments that are active
  // Assume undefined/null means active
  const activeAttachments = attachments
    .filter(
      (attachment) =>
        attachment.data?.active === true ||
        attachment.data?.active === undefined ||
        attachment.data?.active === null
    )
    .map((attachment) => ({
      ...attachment,
      weaponId: weapon?._id,
    }));

  [
    ...features,
    ...criticalInjuries,
    ...addictions,
    ...equippedItems,
    ...activeAttachments,
    ...(weapon ? [weapon] : []),
    ...(ammoItem ? [ammoItem] : []),
  ].forEach((feature) => {
    const modifiers = feature.data?.modifiers || [];
    modifiers.forEach((modifier) => {
      const ruleType = modifier.data?.type || "";
      const isPenalty = ruleType.toLowerCase().includes("penalty");
      let value = modifier.data?.value || "";
      let valueType = modifier.data?.valueType || "number";
      let field = modifier.data?.field || "";
      if (ruleType === "statBonus" || ruleType === "statPenalty") {
        valueType = "number";
        field = modifier.data?.stat || "int";
        value = modifier.data?.statBonus || 0;
        if (modifier.data?.statSet) {
          value = modifier.data?.statSet;
        }
        if (ruleType === "statPenalty") {
          value = modifier.data?.statPenalty || 0;
          if (value > 0) value = -value;
        }
      }
      if (valueType === "number") {
        value = parseInt(value || "0", 10);
        if (isNaN(value)) {
          value = 0;
        }
        if (isPenalty && value > 0) {
          value = -value;
        }
      } else if (valueType === "field") {
        const fieldToUse = modifier.data?.value || "";
        if (fieldToUse) {
          value = target?.data?.[fieldToUse] || "";
        }
      } else if (
        valueType === "string" &&
        !value.trim().startsWith("-") &&
        isPenalty
      ) {
        value = "-" + value;
      }

      // Check for strings that require replacements
      if (modifier.data?.valueType === "string") {
        value = checkForReplacements(value, {}, target);
      }

      // Only relevant if it has a value or if it's a modifier that doesn't have a value
      if (value !== 0 || MODIFIERS_WITHOUT_VALUE.includes(ruleType)) {
        // Check if this only applies to equipped item and mark it with ID if so
        const itemOnly = modifier.data?.itemOnly || false;
        let possibleItemId = itemOnly ? feature?._id : undefined;
        // If this was from an attachment, we need to set the itemId to the weapon's id
        if (itemOnly && feature.data?.type === "weapon attachment") {
          possibleItemId = feature?.weaponId || "";
        }
        results.push({
          name: feature?.name || "Feature",
          value: value,
          active: modifier.data?.active === true,
          modifierType: ruleType,
          field: field,
          valueType: valueType,
          itemId: possibleItemId,
          isPenalty: isPenalty,
          isEffect: false,
          max: modifier.data?.statMaximum || undefined,
          min: modifier.data?.statMinimum || undefined,
          isSet:
            (ruleType === "statBonus" || ruleType === "statPenalty") &&
            modifier.data?.statSet !== undefined,
          noDerivedAttributes: modifier.data?.noDerivedAttributes || false,
          smartBonus:
            ruleType === "smartAmmo" ? modifier.data?.smartBonus : undefined,
        });
      }
    });
  });

  // Add nextRoll modifier if it exists
  const nextRoll = target?.data?.nextRoll || 0;
  if (nextRoll) {
    results.push({
      name: "Luck Used",
      value: nextRoll,
      active: true,
      modifierType: "skillBonus",
      field: "all",
      valueType: "number",
      isPenalty: false,
      isEffect: false,
    });
  }

  // Filter duplicates
  results = results.filter(
    (r, index, self) =>
      index === self.findIndex((t) => JSON.stringify(t) === JSON.stringify(r))
  );

  if (types && types.length > 0) {
    results = results.filter((r) => types.includes(r.modifierType));
  }

  if (field && field !== "") {
    results = results.filter(
      (r) => r.field === field || r.field === "all" || !r.field
    );
  }

  // Filter by itemId if provided
  results = results.filter(
    (r) =>
      r.itemId === itemId ||
      r.itemId === undefined ||
      (ammoItem && r.itemId === ammoItem._id)
  );

  return results;
}

// Updates all attributes on a record related to the valuesToSet and highestPenalty
function updateAttributesOnRecord(record, valuesToSet, highestPenalty) {
  // Get all STAT modifiers and update stats as needed
  // First lookup the base values before any modifiers were applied
  const baseAttributes = {
    int: record?.data?.int || 0,
    ref: record?.data?.ref || 0,
    dex: record?.data?.dex || 0,
    tech: record?.data?.tech || 0,
    cool: record?.data?.cool || 0,
    luck: record?.data?.luck || 0,
    curLuck: record?.data?.curLuck || 0,
    will: record?.data?.will || 0,
    move: record?.data?.move || 0,
    body: record?.data?.body || 0,
    emp: record?.data?.emp || 0,
    curEmp: record?.data?.curEmp || 0,
  };

  // Ensure total attributes are set (base + modifiers)
  valuesToSet["data.totalInt"] = baseAttributes.int;
  valuesToSet["data.totalRef"] = baseAttributes.ref;
  valuesToSet["data.totalDex"] = baseAttributes.dex;
  valuesToSet["data.totalTech"] = baseAttributes.tech;
  valuesToSet["data.totalCool"] = baseAttributes.cool;
  valuesToSet["data.totalLuck"] = baseAttributes.luck;
  valuesToSet["data.totalWill"] = baseAttributes.will;
  valuesToSet["data.totalMove"] = baseAttributes.move;
  valuesToSet["data.totalBody"] = baseAttributes.body;
  valuesToSet["data.totalEmp"] = baseAttributes.emp;
  valuesToSet["data.totalCurEmp"] = baseAttributes.curEmp;

  // Body / Will / and EMP have derived attributes that could be affected or not affected by modifiers
  // So we track the value used to calculate the derived attributes
  valuesToSet["data.actualBody"] = baseAttributes.body;
  valuesToSet["data.actualWill"] = baseAttributes.will;
  valuesToSet["data.actualEmp"] = baseAttributes.emp;
  valuesToSet["data.actualCurEmp"] = baseAttributes.curEmp;

  // Update all stats and skills with modifiers now applied
  [
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
  ].forEach((stat) => {
    let value = valuesToSet[`data.total${capitalize(stat)}`];
    if (stat === "ref" || stat === "dex" || stat === "move") {
      setStatsAndSkills(record, value, stat, valuesToSet, highestPenalty);
    } else {
      setStatsAndSkills(record, value, stat, valuesToSet);
    }
  });
}

// Checks for active cyberware armor
function checkIfCyberwareArmor(item, location) {
  if (item.data?.type === "cyberware" && item.data?.active === "true") {
    const modifiers = item.data?.modifiers || [];
    modifiers.forEach((modifier) => {
      const modifierType = modifier.data?.type || "";
      if (modifierType === `${location}Sp`) {
        return true;
      }
    });
  }

  return false;
}

// Uses the context's record to update attributes
function updateAttributes(valuesToSet, highestPenalty) {
  return updateAttributesOnRecord(record, valuesToSet, highestPenalty);
}

function getBestEquippedArmor(record) {
  // Return list of all equipped armor in order of SP/HP
  const items = record?.data?.inventory || [];
  const result = {
    head: [],
    body: [],
    shield: [],
    // This is what will be used as our actual penalty on REF/DEX/MOVE
    highestPenalty: 0,
  };

  // First look at all items of type armor
  const armor = items.filter(
    (item) => item.data?.type === "armor" && item.data?.carried === "equipped"
  );

  armor.forEach((item) => {
    const armorType = item.data?.armorLocation || "head";
    const armorSp = parseInt(item.data?.sp || 0, 10);
    const armorPenalty = parseInt(item.data?.penalty || 0, 10);

    // Get current SP fallback to armorSp if not set
    const currentSp = parseInt(item.data?.curSp || armorSp, 10);

    if (armorPenalty > result.highestPenalty) {
      result.highestPenalty = armorPenalty;
    }

    // Only add to result if armorType is valid
    if (result[armorType]) {
      result[armorType].push({
        _id: item._id,
        name: item.name,
        sp: armorSp,
        curSp: currentSp,
        penalty: armorPenalty,
      });
    }
  });

  // Then look for all items that have a modifier of type bodySp, headSp, or shieldSp (and are not armor)
  const otherItems = items.filter(
    (item) =>
      item.data?.type !== "armor" &&
      item.data?.carried === "equipped" &&
      (item.data?.type !== "cyberware" || item.data?.active === "true")
  );

  otherItems.forEach((item) => {
    const modifiers = item.data?.modifiers || [];
    modifiers.forEach((modifier) => {
      const modifierType = modifier.data?.type || "";
      if (
        modifierType === "bodySp" ||
        modifierType === "headSp" ||
        modifierType === "shieldSp"
      ) {
        let armorType = modifierType.replace("Sp", "");
        let armorSp = parseInt(modifier.data?.value || 0, 10);
        let currentSp = parseInt(item.data?.curSp || armorSp, 10);

        if (result[armorType]) {
          result[armorType].push({
            _id: item._id,
            name: item.name,
            sp: armorSp,
            curSp: currentSp,
            penalty: 0,
          });
        }
      }
    });
  });

  // Sort the results by curSp
  result.head.sort((a, b) => b.curSp - a.curSp);
  result.body.sort((a, b) => b.curSp - a.curSp);
  result.shield.sort((a, b) => b.curSp - a.curSp);
  return result;
}

function useItem(record, itemDataPath) {
  // Deduct count by 1, delete item if count is 0,
  // and output the description to Chat
  // Include macros to relevant fields
  const itemName = api.getValueOnRecord(record, `${itemDataPath}.name`);
  const itemCount = api.getValueOnRecord(record, `${itemDataPath}.data.count`);
  const indexValue = parseInt(itemDataPath.split(".").pop());
  const isConsumable =
    api.getValueOnRecord(record, `${itemDataPath}.data.consumable`) || false;

  // Output the description to Chat
  const description =
    api.getValueOnRecord(record, `${itemDataPath}.data.description`) || "";
  const effects =
    api.getValueOnRecord(record, `${itemDataPath}.data.effects`) || [];

  const checkSkill = api.getValueOnRecord(
    record,
    `${itemDataPath}.data.checkSkill`
  );
  const checkDV = api.getValueOnRecord(record, `${itemDataPath}.data.checkDV`);

  const healing = api.getValueOnRecord(record, `${itemDataPath}.data.healing`);
  const damage = api.getValueOnRecord(record, `${itemDataPath}.data.useDamage`);
  const portrait = api.getValueOnRecord(record, `${itemDataPath}.portrait`);
  const itemIcon = portrait
    ? `![${itemName}](${assetUrl}${portrait}?width=40&height=40) `
    : "";
  const itemDescription = api.richTextToMarkdown(description || "");
  let markdownDescription = `
#### ${itemIcon}${itemName}

---
${itemDescription}
`;

  // Add macros to conditions (such as drug addictions) if any
  const conditions = api.getValueOnRecord(
    record,
    `${itemDataPath}.data.conditions`
  );
  if (conditions) {
    // Create macros for all Conditions that this action can apply
    let conditionButtons = "";
    conditions.forEach((conditionJson) => {
      const condition = JSON.parse(conditionJson);
      const conditionName = condition?.name || "";
      const conditionID = condition?._id || "";
      const conditionTitle = `Apply_${conditionName.replace(/ /g, "_")}`;
      if (conditionButtons !== "") {
        conditionButtons += "\n";
      }
      conditionButtons += `\`\`\`${conditionTitle}
let targets = api.getSelectedOrDroppedToken();

// If record is not null, check if we're the GM or owner and use it
if (record) {
  if (isGM || record?.record?.ownerId === userId) {
    targets = [record];
  }
}

// If we're a player and we did not drop on a record, get our owned tokens
if (!isGM && targets.length === 0) {
    targets = api.getSelectedOwnedTokens().map(target => target.token);
}

// First re-query the condition record
api.getRecord('conditions', '${conditionID}', (conditionRecord) => {
  if (conditionRecord) {
    const conditionRecordLink = {
      value: conditionRecord,
      tooltip: conditionRecord?.name || "Condition",
    };
    targets.forEach(target => {
      const targetRecord = target.recordType === "characters" ? target.record : target;
      // For conditions applied this way, we will not deduct HP
      addCondition(targetRecord, conditionRecordLink, 0);
    });
  }
});
\`\`\``;
    });

    markdownDescription += `\n${conditionButtons}`;
  }

  // If we're using a potion with an effect or healing, add the buttons
  if (effects) {
    // Create macros for all effects that this action can apply
    let effectButtons = "";
    effects.forEach((effectJson) => {
      const effect = JSON.parse(effectJson);
      const effectName = effect?.name || "";
      const effectID = effect?._id || "";
      const effectTitle = `Apply_${effectName.replace(/ /g, "_")}`;
      if (effectButtons !== "") {
        effectButtons += "\n";
      }
      effectButtons += `\`\`\`${effectTitle}
let targets = api.getSelectedOrDroppedToken();
targets.forEach(target => {
  api.addEffectById('${effectID}', target);
});
\`\`\``;
    });

    markdownDescription += `\n${effectButtons}`;
  }

  // Healing macros
  if (healing) {
    const escapedName = itemName.replace(/'/g, "\\'");
    const escapedHealing = healing.replace(/'/g, "\\'");
    let healingRoll = evaluateMath(
      checkForReplacements(escapedHealing, {}, record)
    );
    const healingButton = `\`\`\`Roll_Healing
api.getRecord('${record.recordType}', '${record._id}', (updatedRecord) => {
  api.promptRollForToken(updatedRecord, '${escapedName} Healing', '${healingRoll}', [], {}, 'healing')
});
\`\`\``;
    markdownDescription += `\n${healingButton}`;
  }

  // Macros to roll damage
  if (damage) {
    const damageButton = `\`\`\`Roll_Damage
// Requery the record and get the weapon
api.getRecord('${record.recordType}', '${record._id}', (updatedRecord) => {
  const weapon = api.getValueOnRecord(updatedRecord, '${itemDataPath}')
  if (weapon) {
    performDamageRoll(updatedRecord, weapon, "single")
  }
});
\`\`\``;
    markdownDescription += `\n${damageButton}`;
  }

  // Roll skill macro, if defined, with DV if set
  if (checkSkill) {
    const skillCheckObj = JSON.parse(checkSkill);
    const skillCheckName = skillCheckObj?.name || "Skill";
    const skillRollButton = `\`\`\`Roll_${skillCheckName.replace(/ /g, "_")}
  const selectedTokens = api.getSelectedOrDroppedToken();
  selectedTokens.forEach(token => {
    // Pass along the total of this roll as the DV for the skill check
    const skillCheckMetadata = {
      isDodge: false,
      dv: ${checkDV},
    };

    performSkillRoll(token, "${skillCheckName}", skillCheckMetadata);
  });
\`\`\``;
    markdownDescription += `\n${skillRollButton}`;
  }

  api.sendMessage(markdownDescription, undefined, []);

  // If consumable, deduct count by 1, delete item if count is 0
  if (isConsumable) {
    const count = parseFloat(itemCount || "0");
    if (count - 1 > 0) {
      api.setValuesOnRecord(record, {
        [`${itemDataPath}.data.count`]: count - 1,
      });
    } else if (!isNaN(indexValue)) {
      api.removeValueFromRecord(record, `data.inventory`, indexValue);
    }
  }
}

// Performs a skill roll for a given skill name for the given record
function performSkillRoll(record, skillName, additionalMetadata = {}) {
  // Find the skill with the same name
  const skillGroups = [
    ...(record.data?.skillGroups1 || []),
    ...(record.data?.skillGroups2 || []),
  ];

  let skill = null;
  skillGroups.forEach((group) => {
    const skills = group.data?.skills || [];
    skills.forEach((s) => {
      if (s.name === skillName) {
        skill = s;
      } else if (s.subSkills && s.subSkills.length > 0) {
        s.subSkills.forEach((subSkill) => {
          if (subSkill.name === skillName) {
            skill = subSkill;
          }
        });
      }
    });
  });

  if (!skill) {
    return;
  }

  let skillModifiers = [
    {
      name: skillName,
      value: skill.data?.base || 0,
      active: true,
      valueType: "number",
    },
  ];

  const additionalModifiers = getEffectsAndModifiersForToken(
    record,
    ["skillBonus", "skillPenalty"],
    skillName
  );
  skillModifiers.push(...additionalModifiers);

  const metadata = {
    rollName: skillName,
    modifiers: skillModifiers,
    ...additionalMetadata,
  };

  api.promptRollForToken(
    record,
    `Skill Check: ${skillName}`,
    "1d10",
    skillModifiers,
    metadata,
    "skill"
  );
}

function performAttackRoll(
  record,
  weapon,
  weaponDataPath,
  type = "single",
  range = "auto"
) {
  const isMelee = weapon.data?.type === "melee weapon";

  let isShell = false;
  // It's a shotgun shell if it's ranged with a isShell ammo
  const ammo = weapon.data?.ammo;
  let ammoObject = {
    _id: "",
  };
  if (ammo) {
    ammoObject = JSON.parse(ammo);
    isShell = ammoObject?.isShell;
  }
  let ammoItem = null;
  if (ammoObject && weapon.data?.type === "ranged weapon") {
    const inventory = record.data?.inventory || [];
    ammoItem = inventory.find((item) => item._id === ammoObject._id);
  }

  // If range is auto, then we look up range of token to target, else we use the range passed in
  let actualRange = 0;
  let dvs = [];
  if (range === "0to6") {
    actualRange = 6;
  } else if (range === "7to12") {
    actualRange = 12;
  } else if (range === "13to25") {
    actualRange = 25;
  } else if (range === "26to50") {
    actualRange = 50;
  } else if (range === "51to100") {
    actualRange = 100;
  } else if (range === "101to200") {
    actualRange = 200;
  } else if (range === "201to400") {
    actualRange = 400;
  } else if (range === "401to800") {
    actualRange = 800;
  } else {
    actualRange = 0;
  }
  if (actualRange > 0) {
    dvs.push({
      dv: getDvForRange(weapon, actualRange, type),
      targetName: "",
    });
  }
  // Find the skill for the record by name. Use Autofire if type is autofire.
  // (Suppresive Fire just produces macros for enemy's to roll Concentration)
  let skillName = weapon.data?.weaponSkill;

  if (type === "autofire" || type === "suppressive") {
    skillName = "Autofire (x2)";
  }

  if (weapon.data?.type === "ammo") {
    // Use Athletics skill for throwing
    skillName = "Athletics";
  }

  let attackSkill = null;
  const skillGroups = [
    ...(record.data?.skillGroups1 || []),
    ...(record.data?.skillGroups2 || []),
  ];
  let attackSkillBase = 0;
  skillGroups.forEach((group) => {
    // We find the skill with the same name, or the Martial Arts skill with the highest base
    let skill = (group.data?.skills || []).find(
      (s) =>
        s.name === skillName ||
        (skillName === "Martial Arts" && s.name.includes("Martial Arts"))
    );
    const subSkills = skill?.data?.subSkills || [];
    // If it's a subskill, look there for highest skill
    let highestSubSkill = 0;
    let highestSubSkillName = "";

    // Find the subskill with highest base value
    subSkills.forEach((subSkill) => {
      const base = subSkill.data?.base || 0;
      if (base > highestSubSkill) {
        highestSubSkill = base;
        highestSubSkillName = subSkill.name || "";
        attackSkill = subSkill;
      }
    });

    if (highestSubSkill > 0) {
      attackSkillBase = highestSubSkill;
      skillName = highestSubSkillName;
    } else if (skill && skill.data?.base >= attackSkillBase) {
      // We found the skill, so we can roll it
      attackSkill = skill;
      attackSkillBase = skill.data?.base;
    }
  });

  let attackModifiers = [
    {
      name: skillName,
      value: attackSkillBase || 0,
      active: true,
      valueType: "number",
    },
  ];

  // Get penalties for aimed shots (does not work for autofire or suppressive fire)
  let targetedLocation = record.data?.targetedLocation || "body";
  if (type === "autofire" || type === "suppressive") {
    targetedLocation = "body";
  }
  if (targetedLocation !== "body") {
    attackModifiers.push({
      name: `Aimed Shot: ${capitalize(targetedLocation)}`,
      value: -8,
      active: true,
      valueType: "number",
      modifierType: "attackPenalty",
      isPenalty: true,
    });
  }

  // Get modifiers from character, weapon, attachments, and ammo
  let field = isMelee ? "melee" : "ranged";
  const aimedShot = targetedLocation !== "body";
  if (aimedShot) {
    field = field + " aimed";
  }
  let modifiers = getEffectsAndModifiersForToken(
    record,
    ["attackBonus", "attackPenalty"],
    field,
    weapon._id,
    weapon,
    ammoItem
  );

  attackModifiers.push(...modifiers);

  if (attackSkill) {
    const skillModifiers = getEffectsAndModifiersForToken(
      record,
      ["skillBonus", "skillPenalty"],
      attackSkill.name || "New Skill",
      weapon._id,
      weapon,
      ammoItem
    );
    attackModifiers.push(...skillModifiers);
  }

  // Get Smart Ammo Mods
  const smartAmmoModifiers = getEffectsAndModifiersForToken(
    record,
    ["smartAmmo"],
    isMelee ? "melee" : "ranged",
    weapon._id,
    weapon,
    ammoItem
  );
  let smartAmmoValue = null;
  let smartBonus = null;
  smartAmmoModifiers.forEach((modifier) => {
    if (modifier.active === true) {
      smartAmmoValue = parseInt(modifier.value, 10) || 0;
      smartBonus = parseInt(modifier.smartBonus, 10) || 0;
    }
  });

  if (range === "auto" && !isMelee && type !== "suppressive" && !isShell) {
    // Get targets, roll for each based on range to target (or just 1 if no targets)
    const targets = api.getTargets(record);
    if (targets.length > 0) {
      targets.forEach((target) => {
        const distance = target?.distance || 0;
        let dv = getDvForRange(weapon, distance, type);
        // If the target is dodging ranged, we actually set the DV to 0
        if (target?.token?.data?.dodgeRanged) {
          dv = 0;
        }
        const targetName =
          target?.token?.identified === false
            ? target?.token?.record?.unidentifiedName
            : target?.token?.record?.name;
        dvs.push({
          dv: dv,
          targetName: targetName,
        });
      });
    }
  } else if (!isMelee && isShell) {
    // Shotgun is always DV 13
    dvs.push({
      dv: 13,
      targetName: "",
    });
  }

  let icon = "GiPistolGun";
  if (weapon.data?.type === "ranged weapon") {
    if (skillName === "Shoulder Arms") {
      icon = "GiWinchesterRifle";
    } else if (skillName === "Heavy Weapons") {
      icon = "GiRocket";
    } else if (skillName === "Autofire" || skillName === "Autofire (x2)") {
      icon = "GiThompsonM1";
    } else if (skillName === "Archery") {
      icon = "GiPocketBow";
    } else if (skillName.includes("Pilot") || skillName.includes("Drive")) {
      icon = "GiTurret";
    }
  } else if (weapon.data?.type === "melee weapon") {
    icon = "GiKatana";
    if (skillName === "Brawling") {
      icon = "GiPunch";
    } else if (
      skillName === "Martial Arts (x2)" ||
      skillName === "Judo" ||
      skillName === "Aikido" ||
      skillName === "Karate"
    ) {
      icon = "GiHighPunch";
    } else if (skillName === "Taekwondo") {
      icon = "GiHighKick";
    }
  } else if (weapon.data?.type === "ammo") {
    icon = "GiGrenade";
  }

  const attackMetadata = {
    rollName: "Attack",
    tooltip: `Attack with ${weapon.name}`,
    weaponName: weapon.name,
    weaponId: weapon._id,
    weaponDataPath: weaponDataPath,
    isMelee: isMelee,
    isSuppressive: type === "suppressive",
    isAutofire: type === "autofire",
    weaponDamage: weapon.data?.damage || 0,
    autofireDamage: weapon.data?.autofireDamage || 0,
    afMultiplierMax: weapon.data?.afMultiplierMax || 0,
    targetedLocation: targetedLocation,
    smartAmmoValue: smartAmmoValue,
    smartBonus: smartBonus,
    dv: 0,
    icon,
    targetName: "",
  };

  // Always true for Melee since it doesn't use ammo
  let hasEnoughAmmo = true;

  if (!isMelee) {
    // Get the ammo amount modifiers and deduct ammo if we have enough
    let ammoModifierType = "ammoPerShot";
    let ammoPerShot = 1;
    if (type === "autofire" || type === "suppressive") {
      ammoModifierType = "ammoPerAutofireShot";
      ammoPerShot = 10;
    }
    const ammoModifiers = getEffectsAndModifiersForToken(
      record,
      [ammoModifierType],
      "",
      weapon._id,
      weapon
    );
    ammoModifiers.forEach((modifier) => {
      let value = parseInt(modifier.value, 10) || 0;
      if (isNaN(value) || modifier.active === false) {
        value = 0;
      }
      ammoPerShot += value;
    });

    // Check if we have enough ammo in the weapon then deduct ammo
    let count = parseInt(weapon.data?.ammoCount, 10) || 0;
    if (weapon.data?.type === "ammo") {
      // Count is on the weapon if we're throwing ammo
      count = weapon.data?.count || 0;
    }

    if (count > 0 && count >= ammoPerShot) {
      const newCount = count - ammoPerShot;
      if (weapon.data?.type === "ammo") {
        api.setValues({
          [`${weaponDataPath}.data.count`]: newCount,
        });
      } else {
        api.setValues({
          [`${weaponDataPath}.data.ammoCount`]: newCount,
        });
      }
    } else {
      hasEnoughAmmo = false;
    }
  }

  // If we don't have enough ammo, then we need to show a message
  if (!hasEnoughAmmo) {
    if (weapon.data?.type === "ammo") {
      api.showNotification(
        "You are out of this type of thrown ammo!",
        "red",
        "Out of Ammo"
      );
    } else {
      api.showNotification("You need to reload first!", "red", "Out of Ammo");
    }
    // No roll
    return;
  }

  // Now prompt for rolls
  if (dvs.length > 0) {
    dvs.forEach((dv) => {
      // Attack with this DV set
      api.promptRoll(
        `Attack with ${weapon.name}`,
        "1d10",
        attackModifiers,
        {
          ...attackMetadata,
          dv: dv.dv,
          targetName: dv.targetName,
        },
        "attack"
      );
    });
  } else {
    // For melee / supressive fire we roll the attack here (or auto-range but couldn't get targets)
    api.promptRoll(
      `Attack with ${weapon.name}`,
      "1d10",
      attackModifiers,
      attackMetadata,
      "attack"
    );
  }
}

function performThrowObject(record) {
  // Get object and range
  const throwAmmo = record.data?.throwAmmo;
  let throwObject = null;
  let throwDataPath = null;
  if (throwAmmo) {
    const throwAmmoObject = JSON.parse(throwAmmo);
    // Find the matching item in the inventory
    const inventory = record.data?.inventory || [];
    inventory.forEach((item, index) => {
      if (item._id === throwAmmoObject._id) {
        throwObject = item;
        throwDataPath = `data.inventory.${index}`;
      }
    });
  }

  const throwRange = record.data?.throwRange || "auto";

  performAttackRoll(record, throwObject, throwDataPath, "single", throwRange);
}

function performDamageRoll(record, weapon, type = "single") {
  const isMelee = weapon.data?.type === "melee weapon";

  let isShell = false;
  // It's a shotgun shell if it's ranged with a isShell ammo
  const ammo = weapon.data?.ammo;
  let ammoObject = {
    _id: "",
  };
  if (ammo) {
    ammoObject = JSON.parse(ammo);
    isShell = ammoObject?.isShell;
  }
  let ammoItem = null;
  if (ammoObject && weapon.data?.type === "ranged weapon") {
    const inventory = record.data?.inventory || [];
    ammoItem = inventory.find((item) => item._id === ammoObject._id);
  }

  // Autofire does damage based on the autofire damage of the weapon
  let damage = weapon.data?.damage || "1d6";
  if (type === "autofire") {
    damage = weapon.data?.autofireDamage || "1d6";
  }
  if (weapon.data?.type === "ammo") {
    damage = weapon.data?.useDamage || "1d6";
  }

  // Shells do 3d6 damage
  if (isShell) {
    damage = "3d6";
  }

  let targetedLocation = record.data?.targetedLocation || "body";
  if (type === "autofire" || type === "suppressive") {
    targetedLocation = "body";
  }

  let isExplosive = false;
  // Is explosive if this an item that is explosive or if ammo is explosive
  if (weapon.data.type === "ammo" && weapon.data?.isExplosive) {
    isExplosive = true;
  }
  if (ammoItem && ammoItem.data?.isExplosive) {
    isExplosive = true;
  }

  // With the exception of brawling, melee ignores half SP
  let skillName = weapon.data?.weaponSkill;
  let ignoreHalfSp = false;
  if (isMelee && skillName !== "Brawling") {
    ignoreHalfSp = true;
  }

  const damageMetadata = {
    rollName: "Damage",
    tooltip: `Damage with ${weapon.name}`,
    weaponName: weapon.name,
    isMelee: isMelee,
    ignoreHalfSp: ignoreHalfSp,
    isAutofire: type === "autofire",
    afMultiplier: record.data?.afMultiplier || 1,
    targetedLocation: targetedLocation,
    ablationAmount: 1,
    ignoresArmorUnder: 0, // Default do not ignore armor
    nonLethal: false,
    nonLethalGreaterThanOne: false,
    noArmorAblation: false,
    noCriticalInjuries: false,
    explosive: isExplosive,
  };

  let modifiers = getEffectsAndModifiersForToken(
    record,
    ["damageBonus", "damagePenalty"],
    isMelee ? "melee" : "ranged",
    weapon._id,
    weapon,
    ammoItem
  );

  let ablationModifiers = getEffectsAndModifiersForToken(
    record,
    ["armorAblationBonus"],
    isMelee ? "melee" : "ranged",
    weapon._id,
    weapon,
    ammoItem
  );
  if (ablationModifiers.length > 0) {
    ablationModifiers.forEach((modifier) => {
      if (modifier.active === true) {
        damageMetadata.ablationAmount += parseInt(modifier.value, 10) || 0;
      }
    });
  }

  const ignoresArmorUnderModifiers = getEffectsAndModifiersForToken(
    record,
    ["ignoresArmorUnder"],
    isMelee ? "melee" : "ranged",
    weapon._id,
    weapon,
    ammoItem
  );
  if (ignoresArmorUnderModifiers.length > 0) {
    ignoresArmorUnderModifiers.forEach((modifier) => {
      if (modifier.active === true) {
        damageMetadata.ignoresArmorUnder = parseInt(modifier.value, 10) || 0;
      }
    });
  }

  const nonLethalModifiers = getEffectsAndModifiersForToken(
    record,
    [
      "nonLethal",
      "nonLethalGreaterThanOne",
      "noArmorAblation",
      "noCriticalInjuries",
    ],
    isMelee ? "melee" : "ranged",
    weapon._id,
    weapon,
    ammoItem
  );
  if (nonLethalModifiers.length > 0) {
    nonLethalModifiers.forEach((modifier) => {
      if (modifier.active === true) {
        if (modifier.modifierType === "nonLethal") {
          damageMetadata.nonLethal = true;
        }
        if (modifier.modifierType === "nonLethalGreaterThanOne") {
          // This indicates that it's only non-lethal if HP > 1
          damageMetadata.nonLethalGreaterThanOne = true;
          damageMetadata.nonLethal = true;
        }
        if (modifier.modifierType === "noArmorAblation") {
          damageMetadata.noArmorAblation = true;
        }
        if (modifier.modifierType === "noCriticalInjuries") {
          damageMetadata.noCriticalInjuries = true;
        }
      }
    });
  }

  api.promptRollForToken(
    record,
    `Damage with ${weapon.name}`,
    damage,
    modifiers,
    damageMetadata,
    "damage"
  );
}

function getBrokenLegMacro() {
  const brokenLegMacro = `
\`\`\`Apply_Broken_Leg
let targets = api.getSelectedOrDroppedToken();

// If record is not null, check if we're the GM or owner and use it
if (record) {
  if (isGM || record?.record?.ownerId === userId) {
    targets = [record];
  }
}

// If we're a player and we did not drop on a record, get our owned tokens
if (!isGM && targets.length === 0) {
    targets = api.getSelectedOwnedTokens().map(target => target.token);
}

// First query the injury record
api.getRecordByTypeAndName('conditions', 'Broken Leg', (injuryRecord) => {
  if (injuryRecord) {
    const injuryRecordLink = {
      value: injuryRecord,
      tooltip: injuryRecord?.name || "Injury",
    };
    targets.forEach(target => {
      const targetRecord = target.recordType === "characters" ? target.record : target;
      addCondition(targetRecord, injuryRecordLink, 5);
    });
  }
});
\`\`\``;

  return brokenLegMacro;
}

// Add a condition (injury, addiciton, cover) to a record
function addCondition(record, recordLink, deductHp = 0) {
  const conditionObj = {
    ...recordLink.value,
  };

  const recordType =
    record.recordType === "characters" ? "characters" : "tokens";
  const conditionType = conditionObj.data?.type || "critical_injury";
  const recordId = record._id;

  // After adding the condition, add the effects to the character sequentially
  const addEffects = (newRecord) => {
    // First update attributes based on modifiers
    const valuesToSet = {};
    const bestEquippedArmor = getBestEquippedArmor(newRecord);
    // Update attributes as per modifiers
    updateAttributesOnRecord(
      newRecord,
      valuesToSet,
      bestEquippedArmor.highestPenalty
    );
    valuesToSet["data.headArmor"] = bestEquippedArmor.head[0]?.name || "";
    valuesToSet["data.headArmorSP"] = bestEquippedArmor.head[0]?.curSp || 0;
    valuesToSet["data.headArmorPenalty"] =
      bestEquippedArmor.head[0]?.penalty || 0;
    valuesToSet["data.bodyArmor"] = bestEquippedArmor.body[0]?.name || "";
    valuesToSet["data.bodyArmorSP"] = bestEquippedArmor.body[0]?.curSp || 0;
    valuesToSet["data.bodyArmorPenalty"] =
      bestEquippedArmor.body[0]?.penalty || 0;
    valuesToSet["data.shield"] = bestEquippedArmor.shield[0]?.name || "";
    valuesToSet["data.shieldHP"] = bestEquippedArmor.shield[0]?.curSp || 0;
    valuesToSet["data.shieldPenalty"] =
      bestEquippedArmor.shield[0]?.penalty || 0;

    if (deductHp > 0) {
      const curHp = valuesToSet["data.curhp"] || record.data?.curhp || 0;
      const newHp = Math.max(curHp - deductHp, 0);
      valuesToSet["data.curhp"] = newHp;
      // Float text
      const token =
        record.linked !== undefined
          ? record
          : api.getSelectedOrDroppedToken()?.[0];
      if (token) {
        api.floatText(token, `-${deductHp}`, "#FF0000");
      }
    }

    if (Object.keys(valuesToSet).length > 0) {
      api.setValuesOnRecord(newRecord, valuesToSet);
    }

    const effects = conditionObj.data?.effects || [];

    // Process effects sequentially using a recursive approach
    function processEffectsSequentially(effects, index) {
      // Base case: all effects processed
      if (index >= effects.length) return;

      // Re-query the record to get the latest data before each effect is processed
      api.getRecord(recordType, recordId, (recordUpdated) => {
        // Process current effect
        const effect = effects[index];
        const effectObj = JSON.parse(effect);

        // Add the effect and wait for completion before processing the next one
        api.addEffectById(
          effectObj._id,
          recordUpdated,
          undefined,
          undefined,
          () => {
            // Process next effect (only after current addition is complete)
            processEffectsSequentially(effects, index + 1);
          }
        );
      });
    }

    // Start processing from the first effect
    if (effects.length > 0) {
      processEffectsSequentially(effects, 0);
    }
  };

  // Add the background to the the backgrounds list if needed
  if (conditionType === "critical_injury") {
    api.addValuesToRecord(
      record,
      "data.criticalInjuries",
      [conditionObj],
      addEffects
    );
  } else if (conditionType === "addiction") {
    api.addValuesToRecord(
      record,
      "data.addictions",
      [conditionObj],
      addEffects
    );
  } else if (conditionType === "cover") {
    // For cover, we just reset the character's Cover HP
    const coverHp = conditionObj.data?.coverHp || 0;
    const coverName = conditionObj?.name || "Cover";
    addEffects(record);
    api.sendMessage(
      `Taking Cover: ${coverName}. Cover HP set to ${coverHp}.`,
      undefined,
      [],
      [{ tooltip: `Cover (${coverHp}): ${coverName}`, name: "Cover" }]
    );
  }
}
