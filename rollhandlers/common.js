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

// Updates skill points and errors for Edgerunner and Complete Package character creation modes
function updateSkillPointsForEdgerunner() {
  const creationMethod = api.getValue("data.wizard.creationMethod");
  if (creationMethod !== "edgerunner" && creationMethod !== "complete") return;

  const SKILL_POINTS = 86;
  const skillGroups1 = api.getValue("data.wizard.skillGroups1") || [];
  const skillGroups2 = api.getValue("data.wizard.skillGroups2") || [];

  let usedPoints = 0;
  let errors = [];

  // Required default skills that must be at least level 2
  const requiredDefaultSkills = [
    "Athletics",
    "Brawling",
    "Concentration",
    "Conversation",
    "Education",
    "Evasion",
    "First Aid",
    "Human Perception",
    "Perception",
    "Persuasion",
    "Stealth",
  ];

  // Get cultural languages from lifepath
  const lifepathLanguages = record.data?.wizard?.languages
    ? [record.data.wizard.languages]
    : [];

  // Process all skill groups
  [...skillGroups1, ...skillGroups2].forEach((group) => {
    const skills = group.data?.skills || [];
    skills.forEach((skill) => {
      if (!skill.data?.hasSubskills) {
        // Skip empty/blank skills
        if (!skill.name || skill.name.trim() === "") {
          return;
        }

        // Regular skill
        const level = skill.data?.lvl || 0;
        const isTimesTwo = skill.data?.isTimesTwo || false;
        const pointCost = isTimesTwo ? 2 : 1;

        // Check skill level requirements based on creation method
        if (creationMethod === "edgerunner" && level < 2) {
          errors.push(
            `${skill.name} must be at least level 2 (Edgerunner mode)`
          );
        } else if (
          creationMethod === "complete" &&
          requiredDefaultSkills.includes(skill.name) &&
          level > 0 &&
          level < 2
        ) {
          errors.push(
            `${skill.name} cannot be level 1 - must be 0 or at least 2`
          );
        }

        // Calculate points used (all levels count towards 86 total)
        usedPoints += level * pointCost;
      } else {
        // Skill with subskills
        const subSkills = skill.data?.subSkills || [];
        subSkills.forEach((subSkill) => {
          // Skip empty/blank subskills
          if (!subSkill.name || subSkill.name.trim() === "") {
            return;
          }

          const level = subSkill.data?.lvl || 0;
          const isTimesTwo = subSkill.data?.isTimesTwo || false;
          const pointCost = isTimesTwo ? 2 : 1;

          // Check if this is a cultural language (don't count first 4 levels)
          let isCulturalLanguage = false;
          if (skill.name === "Language") {
            lifepathLanguages.forEach((lang) => {
              if (subSkill.name && subSkill.name.includes(lang)) {
                isCulturalLanguage = true;
              }
            });
          }

          // Check subskill level requirements based on creation method
          if (creationMethod === "edgerunner" && level < 2) {
            errors.push(
              `${subSkill.name} must be at least level 2 (Edgerunner mode)`
            );
          } else if (creationMethod === "complete") {
            if (
              skill.name === "Language" &&
              subSkill.name === "Streetslang" &&
              level > 0 &&
              level < 2
            ) {
              errors.push(
                "Language (Streetslang) cannot be level 1 - must be 0 or at least 2"
              );
            }
            if (
              skill.name === "Local Expert" &&
              subSkill.name === "Your Home" &&
              level > 0 &&
              level < 2
            ) {
              errors.push(
                "Local Expert (Your Home) cannot be level 1 - must be 0 or at least 2"
              );
            }
          }

          // Calculate points used
          if (isCulturalLanguage) {
            // Don't count first 4 levels for cultural languages
            if (level > 4) {
              usedPoints += (level - 4) * pointCost;
            }
          } else {
            // Count all levels for other subskills (all points count towards 86 total)
            usedPoints += level * pointCost;
          }
        });
      }
    });
  });

  const remainingPoints = SKILL_POINTS - usedPoints;
  const errorString = errors.length > 0 ? errors.join("; ") : "";
  const hasNegativePoints = remainingPoints < 0;
  const hasAllPointsAllocated = remainingPoints === 0 && errorString === "";

  // Update the wizard data and UI visibility based on creation method
  let valuesToSet = {
    "data.wizard.skillPointsUsed": usedPoints,
    "data.wizard.skillPointsRemaining": remainingPoints,
    "data.wizard.skillErrors": errorString,
  };

  if (creationMethod === "edgerunner") {
    valuesToSet["fields.edgerunnerInfo.hidden"] = false;
    valuesToSet["fields.skillErrorsContainer.hidden"] = errorString === "";
    valuesToSet["fields.edgerunnerNegativePointsContainer.hidden"] =
      !hasNegativePoints;
    valuesToSet["fields.edgerunnerAllPointsAllocatedContainer.hidden"] =
      !hasAllPointsAllocated;
    valuesToSet["fields.completePackageInfo.hidden"] = true;
  } else if (creationMethod === "complete") {
    valuesToSet["fields.completePackageInfo.hidden"] = false;
    valuesToSet["fields.completeSkillErrorsContainer.hidden"] =
      errorString === "";
    valuesToSet["fields.completeNegativePointsContainer.hidden"] =
      !hasNegativePoints;
    valuesToSet["fields.completeAllPointsAllocatedContainer.hidden"] =
      !hasAllPointsAllocated;
    valuesToSet["fields.edgerunnerInfo.hidden"] = true;
  }

  api.setValues(valuesToSet);
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
      (thisRecord?.data?.role || "").match(`${roleName} (\\d+)`)?.[1] || 0;
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
      (thisRecord?.data?.role || "").match(`${roleName} (\\d+)`)?.[1] || 0;
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

function convertToDataPaths(data) {
  const result = {};

  function processObject(obj, currentPath = "") {
    // Exit early if obj is null or undefined
    if (obj === null || obj === undefined) return;

    // Handle arrays and objects differently
    if (Array.isArray(obj)) {
      // For arrays, we store the entire array at the current path
      result[currentPath] = obj;
    } else if (typeof obj === "object") {
      // For objects, recursively process each property
      Object.keys(obj).forEach((key) => {
        const newPath = currentPath ? `${currentPath}.${key}` : key;

        // If the value is a primitive or an array, add it directly to the result
        if (
          typeof obj[key] !== "object" ||
          Array.isArray(obj[key]) ||
          obj[key] === null
        ) {
          result[newPath] = obj[key];
        } else {
          // Otherwise, recursively process the nested object
          processObject(obj[key], newPath);
        }
      });
    } else {
      // Handle primitive values
      result[currentPath] = obj;
    }
  }

  processObject(data);
  return result;
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

// Helper function to find skill stat
function findSkillStat(skillName) {
  const allSkills = getAllSkills();
  for (const group of allSkills) {
    for (const skill of group.skills) {
      if (
        skill.name.toLowerCase().replace("(x2)", "") ===
        skillName.toLowerCase().replace("(x2)", "")
      ) {
        return skill.stat;
      }
      // Check subskills if they exist
      if (skill.subSkills) {
        for (const subSkill of skill.subSkills) {
          if (
            subSkill.name.toLowerCase().replace("(x2)", "") ===
            skillName.toLowerCase().replace("(x2)", "")
          ) {
            return subSkill.stat;
          }
        }
      }
    }
  }
  return "int"; // Default to int if not found
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

  const sortedModifiers = [...modifiers].sort((a, b) => {
    // Put isSet modifiers at the end
    if (a.isSet && !b.isSet) return 1;
    if (!a.isSet && b.isSet) return -1;

    // Sort by value ascending
    return (a.value || 0) - (b.value || 0);
  });

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
    if (bodyValue === undefined) {
      bodyValue = 0;
    }
    if (willValue === undefined) {
      willValue = 0;
    }

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
    valuesToSet["data.totalHumanity"] = valuesToSet["data.actualEmp"] * 10;

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
    valuesToSet["data.totalCurEmp"] = Math.floor(val / 10);
    statToCheck = "emp";
    // Set stat to emp too, since we are changing skills based on it
    stat = "curEmp";
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

  if (stat === "emp" || stat === "curEmp" || stat === "humanity") {
    // Go through all equipped cyberware and determine humanity loss
    const equippedCyberware = (record.data?.inventory || []).filter(
      (item) =>
        item.data?.carried === "equipped" && item.data?.type === "cyberware"
    );
    let maxHumanityLoss = 0;
    equippedCyberware.forEach((cyberware) => {
      let humanityLoss = cyberware.data?.humanityLoss || "";
      // If the cyberware is within gear, we don't count it towards HL
      if (cyberware.data?.withinGear) {
        humanityLoss = 0;
      }
      // If the cyberware defines HL, check if it's borgware
      let maxLoss = humanityLoss ? 2 : 0;
      if (
        humanityLoss &&
        (cyberware.data?.borgware ||
          cyberware.data?.cyberwareInstallSlot === "borgware")
      ) {
        maxLoss = 4;
      }
      maxHumanityLoss += maxLoss;
    });
    // Set totalHumanity to humanity - maxHumanityLoss
    if (maxHumanityLoss > 0) {
      const curTotal =
        valuesToSet["data.humanity"] || record?.data?.humanity || 0;
      valuesToSet["data.totalHumanity"] = curTotal - maxHumanityLoss;
    }
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
    // Characters use groups
    if (record.recordType === "characters") {
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
    } else {
      // NPCs get from `skills` list
      const skills = record.data?.skills || [];
      skills.forEach((skill, skillIndex) => {
        const skillStat = skill.data?.stat || "int";
        if (skillStat === statToCheck) {
          // Set the Base to LVL + value
          const lvl = skill.data?.lvl || 0;
          const base = lvl + valuesToSet[`data.total${capitalize(stat)}`];
          valuesToSet[`data.skills.${skillIndex}.data.base`] = base;
        }
      });
    }
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
  "ignoreSeriouslyWounded",
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
  ammoItem = undefined,
  subField = ""
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
      (item.data?.type !== "cyberware" ||
        item.data?.active === true ||
        item.data?.active === undefined)
  );

  const criticalInjuries = target?.data?.criticalInjuries || [];
  const addictions = target?.data?.addictions || [];
  // Used by NPCs
  const conditions = target?.data?.conditions || [];

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

  // If this is a cyberdeck, we check for active programs and hardware in it
  const cyberdecks = equippedItems.filter(
    (item) => item.data?.type === "cyberdeck"
  );
  let activePrograms = [];
  if (cyberdecks.length > 0) {
    cyberdecks.forEach((cyberdeck) => {
      const installedProgramsAndHardware = (
        cyberdeck.data?.installedProgramsAndHardware || []
      ).filter((program) => program.data?.active);
      activePrograms.push(...installedProgramsAndHardware);
    });
  }

  [
    ...features,
    ...criticalInjuries,
    ...addictions,
    ...conditions,
    ...equippedItems,
    ...activeAttachments,
    ...activePrograms,
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
      // or is one that uses stats (statBonus, statPenalty, smartAmmo)
      let statItemId = undefined;
      if (value !== 0 || MODIFIERS_WITHOUT_VALUE.includes(ruleType)) {
        // Check if this only applies to equipped item and mark it with ID if so
        const itemOnly = modifier.data?.itemOnly || false;
        let possibleItemId = itemOnly ? feature?._id : undefined;
        // If this was from an attachment, we need to set the itemId to the weapon's id
        if (itemOnly && feature.data?.type === "weapon attachment") {
          possibleItemId = feature?.weaponId || "";
        }
        // If this is a statBonus or statPenalty, we need to check if it's a set
        if (ruleType === "statBonus" || ruleType === "statPenalty") {
          statItemId = feature?._id;
        }
        results.push({
          _id: feature?._id,
          name: feature?.name || "Feature",
          value: value,
          active: modifier.data?.active === true,
          modifierType: ruleType,
          field: field,
          valueType: valueType,
          itemId: possibleItemId,
          statItemId: statItemId,
          isPenalty: isPenalty,
          isEffect: false,
          requiredItem: modifier.data?.requiredItem || undefined,
          requiredCount: modifier.data?.requiredCount || undefined,
          count: feature.data?.count || undefined,
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

  // Go through all modifiers and check if any require an item
  // Remove the modifier for that item, if present (does not stack)
  const modifiersToRemove = [];

  results.forEach((modifier) => {
    if (modifier.requiredItem) {
      const requiredItem = target?.data?.inventory?.find(
        (item) =>
          item.name === modifier.requiredItem &&
          item.data?.carried === "equipped" &&
          (item.data?.type !== "cyberware" || item.data?.active)
      );
      if (!requiredItem) {
        modifiersToRemove.push(modifier._id);
      } else {
        // Find modiifer with the requiredItem
        const requiredItemModifier = results.find(
          (m) => m.name === modifier.requiredItem
        );

        if (!requiredItemModifier) {
          // Remove this one
          modifiersToRemove.push(modifier._id);
        } else if (!requiredItemModifier.foundMatch) {
          // Remove the requiredItemModifier unless we found
          // the other one (keep 1 of them)
          modifier.foundMatch = true;
          modifier.name = `${modifier.name} / ${requiredItemModifier.name}`;
          modifiersToRemove.push(requiredItemModifier._id);
        }
      }
    } else if (modifier.requiredCount) {
      // If the modifier has a requiredCount, but no requiredItem,
      // we need to check if there are items in the inventory that match
      if ((modifier.count || 0) < modifier.requiredCount) {
        // Check for other modifiers with the same name and count
        const otherModifiers = results.filter(
          (m) =>
            m.name === modifier.name &&
            modifier.value === m.value &&
            modifier.field === m.field &&
            modifier.modifierType === m.modifierType
        );
        if (otherModifiers.length < modifier.requiredCount) {
          // Remove them all if under the count
          modifiersToRemove.push(modifier._id);
          modifiersToRemove.push(...otherModifiers.map((m) => m._id));
        }
      }
    }
  });

  // Check for Solo and Tech modifiers
  const roles = target?.data?.roles || [];
  roles.forEach((role) => {
    if (role.data?.panel === "solo") {
      const initiativeReactionRank = role.data?.initiativeReactionRank || 0;
      const attackBonus = role.data?.attackBonus || 0;
      const spotWeaknessRank = role.data?.spotWeaknessRank || 0;
      const threatDetectionRank = role.data?.threatDetectionRank || 0;

      // Add initiative reaction rank
      if (initiativeReactionRank) {
        results.push({
          name: "Initiative Reaction",
          value: initiativeReactionRank,
          modifierType: "initiativeBonus",
          field: "",
          valueType: "number",
          isPenalty: false,
          isEffect: false,
          active: true,
        });
      }

      // Add attack bonus from precision attack rank
      if (attackBonus) {
        results.push({
          name: "Precision Attack",
          value: attackBonus,
          modifierType: "attackBonus",
          field: "",
          valueType: "number",
          isPenalty: false,
          isEffect: false,
          active: true,
        });
      }

      // Add modifiers
      if (spotWeaknessRank) {
        results.push({
          name: "Spot Weakness",
          value: spotWeaknessRank,
          modifierType: "damageBonus",
          field: "",
          valueType: "number",
          isPenalty: false,
          isEffect: false,
          active: false,
        });
      }

      if (threatDetectionRank) {
        results.push({
          name: "Threat Detection",
          value: threatDetectionRank,
          modifierType: "skillBonus",
          field: "Perception",
          valueType: "number",
          isPenalty: false,
          isEffect: false,
          active: true,
        });
      }
    } else if (role.data?.panel === "tech") {
      const fieldExpertiseRank = role.data?.fieldExpertiseRank || 0;
      if (fieldExpertiseRank) {
        // Add skill bonus for field expertise to  Basic Tech, Cybertech,
        // Electronics/Security Tech, Weaponstech, Land, Sea, or Air Vehicle Tech
        [
          "Basic Tech",
          "Cybertech",
          "Electronics/Security Tech (x2)",
          "Weaponstech",
          "Land Vehicle Tech",
          "Sea Vehicle Tech",
          "Air Vehicle Tech",
        ].forEach((field) => {
          results.push({
            name: "Field Expertise",
            value: fieldExpertiseRank,
            modifierType: "skillBonus",
            field: field,
            // So we can differentiate between field expertise and upgrade/fabrication/invention
            // skills later on
            subField: "Field Expertise",
            valueType: "number",
            isPenalty: false,
            isEffect: false,
            active: true,
          });
        });
      }
    }
  });

  // Remove modifiers that are in the modifiersToRemove array
  results = results.filter((r) => !modifiersToRemove.includes(r._id));

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
  results = results.filter((r, index, self) => {
    // Create copies without _id for comparison
    const rWithoutId = { ...r };
    delete rWithoutId._id;

    return (
      index ===
      self.findIndex((t) => {
        const tWithoutId = { ...t };
        delete tWithoutId._id;
        return JSON.stringify(tWithoutId) === JSON.stringify(rWithoutId);
      })
    );
  });

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
  let isCyberwareArmor = false;
  if (
    item.data?.type === "cyberware" &&
    (item.data?.active === true || item.data?.active === undefined)
  ) {
    const modifiers = item.data?.modifiers || [];
    modifiers.forEach((modifier) => {
      const modifierType = modifier.data?.type || "";
      if (modifierType === `${location}Sp`) {
        isCyberwareArmor = true;
      }
    });
  }

  return isCyberwareArmor;
}

// Uses the context's record to update attributes
function updateAttributes(valuesToSet, highestPenalty) {
  return updateAttributesOnRecord(record, valuesToSet, highestPenalty);
}

function getWoundedPenalty(record) {
  // Only PCs / mooks / team members / and backup can be wounded
  if (
    record.recordType === "npcs" &&
    (record.data?.type === "program" ||
      record.data?.type === "black ice" ||
      record.data?.type === "defense" ||
      record.data?.type === "vehicle")
  ) {
    return null;
  }

  // Check if the token is seriously wounded (HP <= 50% of max HP)
  const isSeriouslyWounded =
    record.data?.curhp <= Math.ceil(record.data?.hitpoints / 2);
  const isMortallyWounded = record.data?.curhp < 1;

  // If the token is seriously wounded, check for ignoreSeriouslyWounded modifier
  if (isSeriouslyWounded) {
    // Check for ignoreSeriouslyWounded modifier
    const ignoreSeriouslyWoundedModifiers = getEffectsAndModifiersForToken(
      record,
      ["ignoreSeriouslyWounded"]
    );
    if (ignoreSeriouslyWoundedModifiers.length === 0 || isMortallyWounded) {
      // Add a penalty of -2 to the skill roll
      return {
        name: isMortallyWounded
          ? "Mortally Wounded Penalty"
          : "Seriously Wounded Penalty",
        value: isMortallyWounded ? -4 : -2,
        active: true,
        valueType: "number",
        isPenalty: true,
      };
    }
  }

  return null;
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
    let currentSp = parseInt(item.data?.[`cur${armorType}Sp`], 10);
    if (isNaN(currentSp)) {
      currentSp = armorSp;
    }

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
      (item.data?.type !== "cyberware" ||
        item.data?.active === true ||
        item.data?.active === undefined)
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
        let currentSp = parseInt(item.data?.[`cur${armorType}Sp`], 10);
        if (isNaN(currentSp)) {
          currentSp = armorSp;
        }

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

function useAbility(record, abilityDataPath) {
  const abilityName = api.getValueOnRecord(record, `${abilityDataPath}.name`);
  const portrait = api.getValueOnRecord(record, `${abilityDataPath}.portrait`);
  const description = api.getValueOnRecord(
    record,
    `${abilityDataPath}.data.description`
  );
  const effects = api.getValueOnRecord(
    record,
    `${abilityDataPath}.data.effects`
  );
  const conditions = api.getValueOnRecord(
    record,
    `${abilityDataPath}.data.conditions`
  );

  const damageOverride = api.getValueOnRecord(
    record,
    `${abilityDataPath}.data.damage`
  );

  const isAttack = api.getValueOnRecord(
    record,
    `${abilityDataPath}.data.isAttack`
  );

  const animation = api.getValueOnRecord(
    record,
    `${abilityDataPath}.data.animation`
  );

  // Get damage amount
  let damage = "";
  if (damageOverride) {
    damage = damageOverride;
  } else {
    // Check the radio button for damageType
    const damageType = api.getValueOnRecord(
      record,
      `${abilityDataPath}.data.damageType`
    );
    const useBrawling = damageType === "Use Default Brawling Damage";
    const useMartialArts = damageType === "Use Default Martial Arts Damage";
    const useBody = damageType === "Use Body As Damage";

    // For body damage we use totalBody (the body stat after modifiers even if they do not apply to HP)
    const bodyStat = record.data?.totalBody || 0;
    // Check if we have a cyberarm -- if so, and this is "Brawling" we always use at least 2d6
    const cyberarm = record.data?.inventory?.find(
      (item) =>
        item.data?.type === "cyberware" &&
        item.data?.carried === "equipped" &&
        (item.data?.foundationalSlot || "").includes("cyberarm")
    );

    if (useBrawling || useMartialArts) {
      damage = "1d6";
      if (useBrawling && cyberarm) {
        damage = "2d6";
      }
      if (bodyStat >= 5 && bodyStat <= 6) {
        damage = "2d6";
      } else if (bodyStat >= 7 && bodyStat <= 10) {
        damage = "3d6";
      } else if (bodyStat >= 11) {
        damage = "4d6";
      }
    } else if (useBody) {
      // Damage is just the body stat, a static number
      damage = `${bodyStat}`;
    }
  }

  const itemIcon = portrait
    ? `![${abilityName}](${assetUrl}${portrait}?width=40&height=40) `
    : "";
  const abilityDescription = api.richTextToMarkdown(description || "");

  let markdownDescription = "";

  // For abilitiies that don't have a primary skill, we use the ability name as the header
  // and output the description with the icon
  const abilityHeader = `
#### ${itemIcon}${abilityName}

---
${abilityDescription}
`;

  const ignoreArmor = api.getValueOnRecord(
    record,
    `${abilityDataPath}.data.ignoreArmor`
  );
  const bonusAblation = api.getValueOnRecord(
    record,
    `${abilityDataPath}.data.bonusAblation`
  );
  const ablationAmount = bonusAblation + 1 || 1;
  const critInjuryDamage = api.getValueOnRecord(
    record,
    `${abilityDataPath}.data.critInjuryDamage`
  );

  // Only attack rolls have a targeted location
  const targetedLocation = isAttack
    ? record.data?.targetedLocation || "body"
    : "body";

  if (damage) {
    const damageButton = `\`\`\`Roll_Damage
api.getRecord('${record.recordType}', '${record._id}', (updatedRecord) => {
 const damageMetadata = {
    rollName: "Damage",
    tooltip: "Damage with ${abilityName}",
    weaponName: "${abilityName}",
    isMelee: true,
    ignoreHalfSp: ${ignoreArmor === "Ignore Half Armor" ? true : false},
    isAutofire: false,
    afMultiplier: 1,
    targetedLocation: "${targetedLocation}",
    ablationAmount: ${ablationAmount},
    ignoresArmorUnder: ${ignoreArmor === "Ignore Full Armor" ? 100 : 0},
    nonLethal: false,
    nonLethalGreaterThanOne: false,
    noArmorAblation: ${ignoreArmor === "Ignore Full Armor" ? true : false},
    noCriticalInjuries: false,
    explosive: false,
    targetIsMortallyWounded: false,
  };

  let modifiers = getEffectsAndModifiersForToken(
    updatedRecord,
    ["damageBonus", "damagePenalty"],
    "melee",
    null,
    null,
    null
  );

  let ablationModifiers = getEffectsAndModifiersForToken(
    updatedRecord,
    ["armorAblationBonus"],
    "melee",
    null,
    null,
    null
  );
  if (ablationModifiers.length > 0) {
    ablationModifiers.forEach((modifier) => {
      if (modifier.active === true) {
        damageMetadata.ablationAmount += parseInt(modifier.value, 10) || 0;
      }
    });
  }

  record = updatedRecord;
  api.promptRoll(
    "Damage with ${abilityName}",
    '${damage}',
    modifiers,
    damageMetadata,
    "damage"
  );
});
\`\`\``;
    markdownDescription += `\n${damageButton}`;
  }

  // Add macros to conditions (such as drug addictions) if any
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
    // For conditions applied this way, we will not deduct HP
    addCondition(target, conditionRecordLink, ${critInjuryDamage});
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

  const defenderSkill = api.getValueOnRecord(
    record,
    `${abilityDataPath}.data.defenderSkill`
  );
  let defenderSkillName = "";
  if (defenderSkill) {
    const skillCheckObj = JSON.parse(defenderSkill);
    defenderSkillName = skillCheckObj?.name || "Skill";
  }

  // Roll skill macro, if defined, with DV if set
  const checkSkill = api.getValueOnRecord(
    record,
    `${abilityDataPath}.data.checkSkill`
  );
  let checkSkillName = "";
  if (checkSkill) {
    const skillCheckObj = JSON.parse(checkSkill);
    checkSkillName = skillCheckObj?.name || "Skill";
  }
  const checkDv = api.getValueOnRecord(
    record,
    `${abilityDataPath}.data.checkDV`
  );
  // If check skill is defined we roll it and pass along the markdownDescription
  if (checkSkillName) {
    performSkillRoll(record, checkSkillName, {
      isDodge: false,
      dv: checkDv,
      overrideDescription: markdownDescription,
      defenderSkill: defenderSkillName,
      targetedLocation: isAttack ? targetedLocation : null,
      isAttack: isAttack,
      abilityName: abilityName,
      animation: animation,
      isMartialArts:
        api.getValueOnRecord(record, `${abilityDataPath}.data.damageType`) ===
        "Use Default Martial Arts Damage",
    });
  } else {
    // Otherwise we just output the description
    if (defenderSkillName) {
      const skillRollButton = `\`\`\`Roll_${defenderSkillName.replace(
        / /g,
        "_"
      )}
      const selectedTokens = api.getSelectedOrDroppedToken();
      selectedTokens.forEach(token => {
        // Pass along the total of this roll as the DV for the skill check
        const skillCheckMetadata = {
          isDodge: false,
          dv: ${checkDv},
        };
    
        performSkillRoll(token, "${defenderSkillName}", skillCheckMetadata);
      }); 
    \`\`\``;
      markdownDescription += `\n${skillRollButton}`;
    }

    api.sendMessage(`${abilityHeader}\n${markdownDescription}`, undefined, []);

    if (animation) {
      const tokenId = api.getToken()?._id;
      const targetId = api.getTargets()?.[0]?.token?._id;
      if (tokenId) {
        api.playAnimation(animation, tokenId, targetId);
      }
    }
  }
}

function performProgramDamageRoll(programName, damage) {
  const modifiers = [];
  const damageMetadata = {
    rollName: "Damage",
    tooltip: `Damage with ${programName}`,
    weaponName: "${programName}",
    isMelee: false,
    targetedLocation: "body",
    ignoresArmorUnder: 100,
    nonLethal: false,
    nonLethalGreaterThanOne: false,
    noArmorAblation: true,
    noCriticalInjuries: true,
    sourceType: "program",
  };

  api.promptRoll(
    `Damage with ${programName}`,
    damage,
    modifiers,
    damageMetadata,
    "damage"
  );
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
  const isDrug =
    api.getValueOnRecord(record, `${itemDataPath}.data.type`) === "drug" ||
    false;

  // Output the description to Chat
  let description =
    api.getValueOnRecord(record, `${itemDataPath}.data.description`) || "";
  let effects =
    api.getValueOnRecord(record, `${itemDataPath}.data.effects`) || [];
  let conditions =
    api.getValueOnRecord(record, `${itemDataPath}.data.conditions`) || [];
  const itemType = api.getValueOnRecord(record, `${itemDataPath}.data.type`);

  const checkSkill = api.getValueOnRecord(
    record,
    `${itemDataPath}.data.checkSkill`
  );
  const checkDV = api.getValueOnRecord(record, `${itemDataPath}.data.checkDV`);

  const healing = api.getValueOnRecord(record, `${itemDataPath}.data.healing`);
  let damage = api.getValueOnRecord(record, `${itemDataPath}.data.useDamage`);
  let damageIce = null;
  const portrait = api.getValueOnRecord(record, `${itemDataPath}.portrait`);

  // For programs and ICE we show interface roll if the NPC is an attacker
  // and always link the NPC to the chat
  let showInterfaceRoll = false;
  let interfaceRollName = "Interface";
  let linkedNpc = null;
  let programATK = 0;
  let isProgramAtk = false;

  // If this is a program or ICE, we need to get both damage from the program/ice
  if (
    itemType === "program or hardware" ||
    itemType === "program" ||
    itemType === "black ice" ||
    record.recordType === "npcs" // For the use button ON the NPC
  ) {
    if (
      api
        .getValueOnRecord(record, `${itemDataPath}.data.programHardwareType`)
        ?.toLowerCase() !== "quickhack"
    ) {
      // Quickhacks don't link to programs
      damage = api.getValueOnRecord(record, `${itemDataPath}.data.damage`);
    }
    damageIce = api.getValueOnRecord(record, `${itemDataPath}.data.iceDamage`);
    programATK = api.getValueOnRecord(record, `${itemDataPath}.data.atk`) || 0;
    if (
      api
        .getValueOnRecord(record, `${itemDataPath}.data.programHardwareType`)
        ?.includes("Attacker")
    ) {
      showInterfaceRoll = true;
      interfaceRollName = "Program Attack";
      isProgramAtk = true;
    } else if (
      api
        .getValueOnRecord(record, `${itemDataPath}.data.blackICEType`)
        ?.includes("Anti-")
    ) {
      showInterfaceRoll = true;
      interfaceRollName = "Black ICE Attack";
      isProgramAtk = false;
    } else if (
      api
        .getValueOnRecord(record, `${itemDataPath}.data.programHardwareType`)
        ?.toLowerCase() === "quickhack"
    ) {
      showInterfaceRoll = true;
      interfaceRollName = "Interface";
      isProgramAtk = false;
    }

    // Check if there's a linked NPC - if so, we'll use these props instead
    const linkedIce = api.getValueOnRecord(
      record,
      `${itemDataPath}.data.blackICE`
    );
    const linkedProgram = api.getValueOnRecord(
      record,
      `${itemDataPath}.data.program`
    );
    if (linkedIce && linkedIce.length > 0) {
      linkedNpc = linkedIce[0];
    } else if (linkedProgram && linkedProgram.length > 0) {
      linkedNpc = linkedProgram[0];
    } else {
      linkedNpc = api.getValueOnRecord(record, itemDataPath);
    }
    if (linkedNpc) {
      // Could also just be the item, but we want all the fields below regardless
      damage = linkedNpc.data?.damage ? linkedNpc.data?.damage : damage;
      damageIce = linkedNpc.data?.iceDamage
        ? linkedNpc.data?.iceDamage
        : damageIce;
      programATK = linkedNpc.data?.atk ? linkedNpc.data?.atk : programATK;
      if (linkedNpc.data?.blackICEType?.includes("Anti-")) {
        interfaceRollName = "Black ICE Attack";
        showInterfaceRoll = true;
        isProgramAtk = false;
      } else if (linkedNpc.data?.programHardwareType?.includes("Attacker")) {
        interfaceRollName = "Program Attack";
        showInterfaceRoll = true;
        isProgramAtk = true;
      }

      if (linkedNpc.data?.effects) {
        effects = linkedNpc.data?.effects;
      }
      if (linkedNpc.data?.conditions) {
        conditions = linkedNpc.data?.conditions;
      }
      if (linkedNpc.data?.notes) {
        description = linkedNpc.data?.notes;
      }
    }
    if (linkedNpc && linkedNpc.recordType === "items") {
      // We don't want to use the item as the linked NPC, so we set it to null
      linkedNpc = null;
    }
  }

  if (itemType === "vehicle") {
    const vehicle = api.getValueOnRecord(record, itemDataPath);
    if (vehicle) {
      linkedNpc = vehicle;
    }
  }

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
      // For conditions applied this way, we will not deduct HP
      addCondition(target, conditionRecordLink, 0);
    });
  }
});
\`\`\``;
    });

    markdownDescription += `\n${conditionButtons}`;
  }

  if (itemType === "vehicle" && linkedNpc) {
    // Add a macro to apply the data of the linked vehicle to the NPC token
    const linkedNpcData = JSON.stringify({
      data: {
        ...linkedNpc.data,
      },
    });
    const syncVehicleTokenDataButton = `\`\`\`Sync_Vehicle_Token_Data
let targets = api.getSelectedOrDroppedToken();
if (targets.length !== 1) {
    api.showNotification(
      "You must select only one vehicle token to sync.",
      "red",
      "Select Vehicle Token"
    );
    return;
}
else if (targets[0].data?.type !== "vehicle") {
    api.showNotification(
      "Selected token is not a vehicle.",
      "red",
      "Select Vehicle Token"
    );
    return;
}
else if (targets[0]._id.includes("optimistic")) {
  api.showNotification(
    "Selected token is still loading...",
    "red",
    "Select Vehicle Token"
  );
  return;
}
const callback = () => {  
  api.showNotification(
    "Vehicle token data synced.",
    "green",
    "Sync Vehicle Token Data"
  );
}
const vehicleData = JSON.parse(${JSON.stringify(linkedNpcData)});
targets.forEach((target) => {
  api.setValuesOnRecord(target, convertToDataPaths(vehicleData), callback);
});
\`\`\``;
    markdownDescription += `\n${syncVehicleTokenDataButton}`;
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
  record = updatedRecord;
  api.promptRoll('${escapedName} Healing', '${healingRoll}', [], {}, 'healing')
});
\`\`\``;
    markdownDescription += `\n${healingButton}`;
  }

  // Macros to roll damage
  if (damage && !linkedNpc && !showInterfaceRoll) {
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

  // If we're using an attacker program, show roll interface
  if (showInterfaceRoll) {
    const rollInterfaceButton = `\`\`\`Roll_${interfaceRollName.replace(
      / /g,
      "_"
    )}
// Find NET Runner rank
// Requery the record and get the rank
api.getRecord('${record.recordType}', '${record._id}', (updatedRecord) => {
  const roles = updatedRecord.data?.roles || [];
  const netrunnerRole = roles.find(role => role.data?.panel === "netrunner");
  let interface = netrunnerRole?.data?.rank || 0;
  
  // If it's a program attack we also add the program's ATK to the roll
  let skillName = '${isProgramAtk ? "Interface + ATK" : "Interface"}';
  let abilityName = "Interface";
  if ('${interfaceRollName}' === "Program Attack") {
    interface += ${programATK};
  }
  else if ('${interfaceRollName}' === "Black ICE Attack") {
    // Black ICE is just ATK + 1d10
    interface = ${programATK};
    skillName = "Attack";
    abilityName = "Black ICE";
  }
  
  checkDV = ${checkDV};

  performSkillRoll(updatedRecord, skillName, {
    isDodge: false,
    roleAbility: "Netrunner",
    defenderSkill: "Interface or DEF",
    abilityName: abilityName,
    skillLevel: interface,
    dv: checkDV ? checkDV : undefined,
  });
});
\`\`\``;
    markdownDescription += `\n${rollInterfaceButton}`;
  }

  // Macros to roll damage
  if (damage && (linkedNpc || showInterfaceRoll)) {
    const damageButton = `\`\`\`Roll_Damage
    performProgramDamageRoll('${itemName}', '${damage}')
  \`\`\``;
    markdownDescription += `\n${damageButton}`;
  }

  if (damageIce) {
    const damageButton = `\`\`\`Roll_ICE_Damage
    performProgramDamageRoll('${itemName}', '${damageIce}')
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

  // Check for primary or secondary Humanity Loss and add macros
  let primaryHumanityLossValue = api.getValueOnRecord(
    record,
    `${itemDataPath}.data.primaryHumanityLoss`
  );
  const primaryHumanityLoss = primaryHumanityLossValue
    ? `${primaryHumanityLossValue}`
    : "";
  const primaryDiceRoll = api.getValueOnRecord(
    record,
    `${itemDataPath}.data.primaryDiceRoll`
  );
  let secondaryHumanityLossValue = api.getValueOnRecord(
    record,
    `${itemDataPath}.data.secondaryHumanityLoss`
  );
  const secondaryHumanityLoss = secondaryHumanityLossValue
    ? `${secondaryHumanityLossValue}`
    : "";
  const secondaryDiceRoll = api.getValueOnRecord(
    record,
    `${itemDataPath}.data.secondaryDiceRoll`
  );
  if (primaryHumanityLoss || primaryDiceRoll) {
    const primaryLossButton = `\`\`\`Roll_Primary_Humanity_Loss
    const selectedTokens = api.getSelectedOrDroppedToken();
    selectedTokens.forEach(token => {
      const rollLoss = '${primaryHumanityLoss}' || '${primaryDiceRoll}';
      const metadata = {
        // Always use base loss if base is selected, else check if half loss is enabled
        halfHumanityLoss: false,
        isBaseLoss: false,
      };

      api.promptRollForToken(
        token,
        "Primary Humanity Loss",
        rollLoss,
        [],
        metadata,
        "humanityLoss"
      );
    });
  \`\`\``;
    markdownDescription += `\n${primaryLossButton}`;
  }
  if (secondaryHumanityLoss || secondaryDiceRoll) {
    const secondaryLossButton = `\`\`\`Roll_Secondary_Humanity_Loss
    const selectedTokens = api.getSelectedOrDroppedToken();
    selectedTokens.forEach(token => {
      const rollLoss = '${secondaryHumanityLoss}' || '${secondaryDiceRoll}';
      const metadata = {
        // Always use base loss if base is selected, else check if half loss is enabled
        halfHumanityLoss: false,
        isBaseLoss: false,
      };

      api.promptRollForToken(
        token,
        "Secondary Humanity Loss",
        rollLoss,
        [],
        metadata,
        "humanityLoss"
      );
    });
  \`\`\``;
    markdownDescription += `\n${secondaryLossButton}`;
  }

  let recordLinks = [];
  const linkedNpcWithoutData = {
    ...linkedNpc,
  };
  if (linkedNpc) {
    recordLinks.push({
      value: linkedNpcWithoutData,
      type: "npcs",
      tooltip: linkedNpc.name || "NPC",
    });
  }

  api.sendMessage(markdownDescription, undefined, recordLinks);

  // If consumable, or a drug, deduct count by 1, delete item if count is 0
  if (isConsumable || isDrug) {
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
function performSkillRoll(
  record,
  skillName,
  additionalMetadata = {},
  recordLinks = []
) {
  // Find the skill with the same name
  const skillGroups = [
    ...(record.data?.skillGroups1 || []),
    ...(record.data?.skillGroups2 || []),
  ];

  let skill = null;
  if (record.recordType === "characters") {
    skillGroups.forEach((group) => {
      const skills = group.data?.skills || [];
      skills.forEach((s) => {
        if (s.name === skillName) {
          skill = s;
        } else if (s.data?.subSkills && s.data?.subSkills.length > 0) {
          s.data?.subSkills.forEach((subSkill) => {
            if (subSkill.name === skillName) {
              skill = subSkill;
            }
          });
        }
      });
    });
  } else {
    // NPCs get from `skills` list
    const skills = record.data?.skills || [];
    skills.forEach((s) => {
      if (s.name === skillName) {
        skill = s;
      }
    });
  }

  let skillModifiers = [];

  if (skill) {
    skillModifiers = [
      {
        name: skillName,
        value: skill.data?.base || 0,
        active: true,
        valueType: "number",
      },
    ];
    // Check for penalties/bonuses for the stat
    const statModifiers = getEffectsAndModifiersForToken(
      record,
      ["statBonusSkill", "statPenaltySkill"],
      skill.data?.stat || "int"
    );
    // For penalties, assume minimum of 1
    statModifiers.forEach((modifier) => {
      const modStat = modifier.field;
      let value = modifier.value;
      const statValue = record?.data?.[`total${capitalize(modStat)}`] || 0;
      if (modifier.isPenalty && statValue - Math.abs(modifier.value) < 1) {
        value = -1 * (statValue - 1);
      }
      skillModifiers.push({
        ...modifier,
        value: value,
      });
    });
  } else if (additionalMetadata.skillLevel !== undefined) {
    skillModifiers.push({
      name: skillName,
      value: additionalMetadata.skillLevel,
      active: true,
      valueType: "number",
    });
    if (additionalMetadata.statName) {
      skillModifiers.push({
        name: capitalize(additionalMetadata.statName),
        value:
          record?.data?.[`total${capitalize(additionalMetadata.statName)}`] ||
          0,
        active: true,
        valueType: "number",
      });
    }
  }

  // If this is an attack from an ability and this is a backup or defense, we add the combat number
  if (record.data.type === "backup" || record.data.type === "defense") {
    // If the skill is "Evasion" and there is an evasion field set, use that instead
    // since Active drones will have a field for the controller's evasion
    if (skillName === "Evasion" && record.data.evasion) {
      skillModifiers.push({
        name: "Evasion",
        value: record.data.evasion || 0,
        active: true,
      });
    } else {
      skillModifiers.push({
        name: "Combat Number",
        value: record.data.combatNumber || 0,
        active: true,
      });
    }
  }

  const additionalModifiers = getEffectsAndModifiersForToken(
    record,
    ["skillBonus", "skillPenalty"],
    skillName
  );
  skillModifiers.push(...additionalModifiers);

  // Check if using role ability
  const roleAbility = additionalMetadata?.roleAbility;
  const abilityName = additionalMetadata?.abilityName;
  const rollUnderOrEqual = additionalMetadata?.rollUnderOrEqual;
  const subRoleRank = additionalMetadata?.subRoleRank;
  if (roleAbility) {
    // Get the value for this role ability rank
    // First check if there is a matching Role name
    const roles = record.data?.roles || [];
    const role =
      roles.find((r) => r.name === roleAbility) ||
      roles.find((r) => r.data?.roleAbility === roleAbility);
    const roleRank = role?.data?.rank || 0;

    if (
      roleRank > 0 &&
      !rollUnderOrEqual &&
      subRoleRank === undefined &&
      // If skilLevel was passed, we don't need to add the role rank
      additionalMetadata.skillLevel === undefined
    ) {
      skillModifiers.push({
        name: roleAbility,
        value: roleRank,
        active: true,
        valueType: "number",
      });
    } else if (roleRank > 0 && rollUnderOrEqual) {
      // In this case it is a DV
      additionalMetadata.dv = roleRank;
    } else if (
      subRoleRank !== undefined &&
      // This is handled by skills by default
      abilityName !== "Field Expertise"
    ) {
      // In this case it is a DV
      skillModifiers.push({
        name: abilityName,
        value: subRoleRank,
        active: true,
        valueType: "number",
      });
    }

    // Check for modifiers
    const additionalModifiers = getEffectsAndModifiersForToken(
      record,
      ["roleAbilityBonus", "roleAbilityPenalty"],
      roleAbility
    );
    skillModifiers.push(...additionalModifiers);

    // Check for ability name modifiers
    if (abilityName) {
      let abilityNameField = abilityName;
      if (abilityName === "Encounter ICE") {
        abilityNameField = "speed";
      }
      const abilityNameModifiers = getEffectsAndModifiersForToken(
        record,
        ["roleAbilityBonus", "roleAbilityPenalty"],
        abilityNameField
      );

      skillModifiers.push(...abilityNameModifiers);

      // For some abilities, we need to add the bonus
      if (additionalMetadata.bonus && additionalMetadata.dv) {
        additionalMetadata.dv =
          additionalMetadata.dv + additionalMetadata.bonus;
      }
    }

    // If abilityName provided, filter out modifiers with subfield !== to it
    if (abilityName) {
      skillModifiers = skillModifiers.filter(
        (m) => m.subField === abilityName || !m.subField
      );
    }
  }

  const woundedPenalty = getWoundedPenalty(record);
  if (woundedPenalty) {
    skillModifiers.push(woundedPenalty);
  }
  // Get penalties for aimed attacks using Brawling/Martial Arts
  if (additionalMetadata.targetedLocation && additionalMetadata.isAttack) {
    let targetedLocation = additionalMetadata.targetedLocation;
    if (targetedLocation !== "body") {
      skillModifiers.push({
        name: `Aimed Shot: ${capitalize(targetedLocation)}`,
        value: -8,
        active: true,
        valueType: "number",
        modifierType: "attackPenalty",
        isPenalty: true,
      });
    }
  }

  // Check for 4 points in fumbleRecovery if solo role
  let fumbleRecovery = false;
  (record.data?.roles || []).forEach((role) => {
    if (role.data?.fumbleRecoveryRank >= 4) {
      fumbleRecovery = true;
    }
  });

  // If this was an attack, we need to get the animation if null
  if (additionalMetadata.isAttack && !additionalMetadata.animation) {
    additionalMetadata.animation = getAnimationFor({
      abilityName: skillName,
      isAutofireOrSuppressiveFire: false,
      isAttack: true,
      isMartialArts: additionalMetadata.isMartialArts,
      isBrawling: skillName === "Brawling",
      isRanged: false,
      isExplosive: false,
    });
  }

  const metadata = {
    rollName: skillName,
    modifiers: skillModifiers,
    isSeriouslyWounded: woundedPenalty && woundedPenalty.value === -2,
    isMortallyWounded: woundedPenalty && woundedPenalty.value === -4,
    ...additionalMetadata,
    fumbleRecovery: fumbleRecovery,
    tokenId: api.getToken()?._id,
    targetId: api.getTargets()?.[0]?.token?._id,
  };

  if (record.linked === undefined) {
    api.promptRoll(
      `Skill Check: ${skillName}`,
      "1d10",
      skillModifiers,
      metadata,
      "skill"
    );
  } else {
    api.promptRollForToken(
      record,
      `Skill Check: ${skillName}`,
      "1d10",
      skillModifiers,
      metadata,
      "skill"
    );
  }
}

function stripX2FromSkillName(skillName) {
  if (!skillName) {
    return "";
  }
  return skillName.replace(" (x2)", "");
}

function performAttackRoll(
  record,
  weapon,
  weaponDataPath,
  type = "single",
  range = "auto"
) {
  const isMelee = weapon?.data?.type === "melee weapon";

  let isShell = false;
  // It's a shotgun shell if it's ranged with a isShell ammo
  const ammo = weapon?.data?.ammo;
  let ammoObject = {
    _id: "",
  };
  if (ammo) {
    ammoObject = JSON.parse(ammo);
    isShell = ammoObject?.isShell;
  }
  let ammoItem = null;
  if (ammoObject && weapon?.data?.type === "ranged weapon") {
    const inventory = record?.data?.inventory || [];
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
      targetId: "",
    });
  }
  // Find the skill for the record by name. Use Autofire if type is autofire.
  // (Suppresive Fire just produces macros for enemy's to roll Concentration)
  let skillName = weapon?.data?.weaponSkill;

  if (type === "autofire" || type === "suppressive") {
    skillName = "Autofire (x2)";
  }

  if (weapon?.data?.type === "ammo") {
    // Use Athletics skill for throwing
    skillName = "Athletics";
  }

  let attackSkill = null;
  const skillGroups = [
    ...(record?.data?.skillGroups1 || []),
    ...(record?.data?.skillGroups2 || []),
  ];
  let attackSkillBase = 0;
  if (record.recordType === "characters") {
    skillGroups.forEach((group) => {
      // We find the skill with the same name, or the Martial Arts skill with the highest base
      let skill = (group?.data?.skills || []).find(
        (s) =>
          stripX2FromSkillName(s.name) === stripX2FromSkillName(skillName) ||
          (stripX2FromSkillName(skillName) === "Martial Arts" &&
            stripX2FromSkillName(s.name).includes("Martial Arts"))
      );
      const subSkills = skill?.data?.subSkills || [];
      // If it's a subskill, look there for highest skill
      let highestSubSkill = 0;
      let highestSubSkillName = "";

      // Find the subskill with highest base value
      subSkills.forEach((subSkill) => {
        const base = subSkill?.data?.base || 0;
        if (base > highestSubSkill) {
          highestSubSkill = base;
          highestSubSkillName = stripX2FromSkillName(subSkill?.name) || "";
          attackSkill = subSkill;
        }
      });

      if (highestSubSkill > 0) {
        attackSkillBase = highestSubSkill;
        skillName = highestSubSkillName;
      } else if (skill && skill?.data?.base >= attackSkillBase) {
        // We found the skill, so we can roll it
        attackSkill = skill;
        attackSkillBase = skill?.data?.base;
      }
    });
  } else {
    // NPCs get from `skills` list
    const skills = record.data?.skills || [];
    skills.forEach((s) => {
      if (stripX2FromSkillName(s.name) === stripX2FromSkillName(skillName)) {
        attackSkill = s;
      }
    });
    if (attackSkill) {
      attackSkillBase = attackSkill?.data?.base || 0;
      skillName = attackSkill?.name || "";
    }
  }

  let attackModifiers =
    record.data.type !== "backup" && record.data.type !== "defense"
      ? [
          {
            name: skillName,
            value: attackSkillBase || 0,
            active: true,
            valueType: "number",
          },
        ]
      : [];

  // Get penalties for aimed shots (does not work for autofire or suppressive fire)
  let targetedLocation = record?.data?.targetedLocation || "body";
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
    weapon?._id,
    weapon,
    ammoItem
  );

  attackModifiers.push(...modifiers);

  // If weapon is excellent quality, add +1 to attack
  if (weapon?.data?.quality === "excellent") {
    attackModifiers.push({
      name: "Excellent Quality",
      value: 1,
      active: true,
      valueType: "number",
    });
  }

  if (attackSkill) {
    const skillModifiers = getEffectsAndModifiersForToken(
      record,
      ["skillBonus", "skillPenalty"],
      attackSkill.name || "New Skill",
      weapon?._id,
      weapon,
      ammoItem
    );
    attackModifiers.push(...skillModifiers);
    // Check for penalties/bonuses for the stat
    const statModifiers = getEffectsAndModifiersForToken(
      record,
      ["statBonusSkill", "statPenaltySkill"],
      attackSkill.data?.stat || "int"
    );
    // For penalties, assume minimum of 1
    statModifiers.forEach((modifier) => {
      const modStat = modifier.field;
      let value = modifier.value;
      const statValue = record?.data?.[`total${capitalize(modStat)}`] || 0;
      if (modifier.isPenalty && statValue - Math.abs(modifier.value) < 1) {
        value = -1 * (statValue - 1);
      }
      attackModifiers.push({
        ...modifier,
        value: value,
      });
    });
  }

  // If this is a NPC of type backup or defense, we use the combat number
  if (record.data.type === "backup" || record.data.type === "defense") {
    attackModifiers.push({
      name: "Combat Number",
      value: record.data.combatNumber || 0,
      active: true,
    });
  }

  // Get Smart Ammo Mods
  const smartAmmoModifiers = getEffectsAndModifiersForToken(
    record,
    ["smartAmmo"],
    isMelee ? "melee" : "ranged",
    weapon?._id,
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
    const targets = api.getTargets();
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
          targetId: target?.token?._id,
        });
      });
    }
  } else if (!isMelee && isShell) {
    // Shotgun is always DV 13
    dvs.push({
      dv: 13,
      targetName: "",
      targetId: api.getTargets()?.[0]?.token?._id,
    });
  }

  let icon = "GiPistolGun";
  if (weapon?.data?.type === "ranged weapon") {
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
  } else if (weapon?.data?.type === "melee weapon") {
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
  } else if (weapon?.data?.type === "ammo") {
    icon = "GiGrenade";
  }

  // Check for 4 points in fumbleRecovery if solo role
  let fumbleRecovery = false;
  (record.data?.roles || []).forEach((role) => {
    if (role.data?.fumbleRecoveryRank >= 4) {
      fumbleRecovery = true;
    }
  });

  let animation = null;
  if (weapon?.data?.animation) {
    animation = weapon.data.animation;
  } else {
    let isExplosive = false;
    // Is explosive if this an item that is explosive or if ammo is explosive
    if (weapon.data.type === "ammo" && weapon.data?.isExplosive) {
      isExplosive = true;
    }
    if (ammoItem && ammoItem.data?.isExplosive) {
      isExplosive = true;
    }

    animation = getAnimationFor({
      abilityName: weapon?.name,
      isAutofireOrSuppressiveFire:
        type === "autofire" || type === "suppressive",
      isArrow: weapon?.data?.arrows === true,
      isAttack: true,
      isMartialArts:
        skillName === "Martial Arts" || skillName === "Martial Arts (x2)",
      isBrawling: skillName === "Brawling",
      isRanged: weapon?.data?.type === "ranged weapon",
      isExplosive: isExplosive,
    });
  }

  const attackMetadata = {
    rollName: "Attack",
    tooltip: weapon ? `Attack with ${weapon?.name}` : "Attack with Object",
    weaponName: weapon?.name,
    weaponId: weapon?._id,
    weaponDataPath: weaponDataPath,
    isMelee: isMelee,
    isSuppressive: type === "suppressive",
    isAutofire: type === "autofire",
    weaponDamage: weapon?.data?.damage || 0,
    autofireDamage: weapon?.data?.autofireDamage || 0,
    afMultiplierMax: weapon?.data?.afMultiplierMax || 0,
    targetedLocation: targetedLocation,
    smartAmmoValue: smartAmmoValue,
    smartBonus: smartBonus,
    dv: 0,
    icon,
    targetName: "",
    tokenId: api.getToken()?._id,
    targetId: api.getTargets()?.[0]?.token?._id,
    isSeriouslyWounded: false,
    isMortallyWounded: false,
    fumbleRecovery: fumbleRecovery,
    quality: weapon?.data?.quality || "average",
    animation: animation,
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
      weapon?._id,
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
    let count = parseInt(weapon?.data?.ammoCount, 10) || 0;
    if (weapon?.data?.type === "ammo") {
      // Count is on the weapon if we're throwing ammo
      count = weapon?.data?.count || 0;
    }

    if (count > 0 && count >= ammoPerShot) {
      const newCount = count - ammoPerShot;
      if (weapon?.data?.type === "ammo") {
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
    if (weapon?.data?.type === "ammo") {
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

  // Check if the token is seriously wounded or mortally wounded
  const woundedPenalty = getWoundedPenalty(record);
  if (woundedPenalty) {
    attackModifiers.push(woundedPenalty);
    attackMetadata.isSeriouslyWounded = woundedPenalty.value === -2;
    attackMetadata.isMortallyWounded = woundedPenalty.value === -4;
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
          targetId: dv.targetId,
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

// Perform a face down roll
function performFaceDownRoll(record) {
  // Facedown is 1d10 + COOL + Reputation
  // and can use luck
  const faceDownModifiers = [
    {
      name: "COOL",
      value: record.data?.totalCool || 0,
      active: true,
      valueType: "number",
      isPenalty: false,
    },
    {
      name: "Reputation",
      value: record.data?.reputation || 0,
      active: true,
      valueType: "number",
      isPenalty: (record.data?.reputation || 0) < 0,
    },
  ];
  const woundedPenalty = getWoundedPenalty(record);

  // Check for 4 points in fumbleRecovery if solo role
  let fumbleRecovery = false;
  (record.data?.roles || []).forEach((role) => {
    if (role.data?.fumbleRecoveryRank >= 4) {
      fumbleRecovery = true;
    }
  });

  api.promptRoll(
    `Facedown`,
    "1d10",
    faceDownModifiers,
    {
      isMortallyWounded: woundedPenalty?.value === -4,
      isSeriouslyWounded: woundedPenalty?.value === -2,
      fumbleRecovery: fumbleRecovery,
    },
    "facedown"
  );
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

  if (!throwDataPath || !throwObject) {
    api.showNotification(
      "You need to select an ammo type to throw!",
      "red",
      "Throw Object"
    );
    return;
  }

  // Also show the description of the item used in the chat
  useItem(record, throwDataPath);

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

  // If any of our targets are mortally wounded, we will need to show the critical injury button
  const targets = api.getTargets(record);
  let targetIsMortallyWounded = false;
  targets.forEach((target) => {
    if (target?.token?.data?.curhp < 1) {
      targetIsMortallyWounded = true;
    }
  });

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
    targetIsMortallyWounded: targetIsMortallyWounded,
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

  if (record.linked === undefined) {
    api.promptRoll(
      `Damage with ${weapon.name}`,
      damage,
      modifiers,
      damageMetadata,
      "damage"
    );
  } else {
    api.promptRollForToken(
      record,
      `Damage with ${weapon.name}`,
      damage,
      modifiers,
      damageMetadata,
      "damage"
    );
  }
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
      addCondition(target, injuryRecordLink, 5);
    });
  }
});
\`\`\``;

  return brokenLegMacro;
}

// Adds a role the the NPC or Character
function addRole(record, recordLink) {
  const roleObj = {
    ...recordLink.value,
  };

  // Get current roles on character if any
  let roles = [...(record.data?.roles || [])];

  const valuesToSet = {};
  const existingRole = roles.find((role) => role.name === roleObj.name);

  let initialRank = 1;
  // If this is a character and they have no other roles,
  // set the initial rank to 4
  if (record.recordType === "characters" && roles.length === 0) {
    initialRank = 4;
  }

  let roleData = {
    ...roleObj.data,
    // Add an order field that we will use to sort the role panels by
    order: roles.length + 1,
    rank: initialRank,
    unallocatedRanks: initialRank,
  };

  if (roleObj.data?.panel === "solo") {
    roleData.maxDamageDeflection = initialRank;
    roleData.maxFumbleRecovery = Math.min(4, initialRank);
    roleData.maxInitiativeReaction = initialRank;
    roleData.maxPrecisionAttack = Math.min(9, initialRank);
    roleData.maxSpotWeakness = initialRank;
    roleData.maxThreatDetection = initialRank;
  }

  if (roleObj.data?.panel === "tech") {
    roleData.unallocatedRanks = initialRank * 2;
    roleData.maxFieldExpertise = initialRank * 2;
    roleData.maxUpgradeExpertise = initialRank * 2;
    roleData.maxFabricationExpertise = initialRank * 2;
    roleData.maxInventionExpertise = initialRank * 2;
  }

  if (roleObj.data?.panel === "netrunner") {
    roleData.netActions = roleObj.data[`netActionsRank${initialRank}`];
  }

  // Add the role to the character if not in the map
  if (!existingRole) {
    roles.push({
      ...roleObj,
      data: roleData,
    });
    valuesToSet["data.roles"] = roles;
  } else {
    // Max rank is 10
    existingRole.data.rank = Math.min(existingRole.data.rank + 1, 10);
    valuesToSet["data.roles"] = roles;
  }

  // Determine if we have a netrunner role added
  const netrunnerRole = roles.find((role) => role.data.netActionsRank1);
  if (netrunnerRole) {
    valuesToSet["fields.cyberdecks.hidden"] = false;
  } else {
    valuesToSet["fields.cyberdecks.hidden"] = true;
  }

  // Sort the roles by order
  const rolesSorted = [...roles].sort((a, b) => a.data.order - b.data.order);
  // Update the role string
  let roleString = "";
  for (const role of rolesSorted) {
    if (roleString !== "") {
      roleString = `${roleString} / `;
    }
    roleString = `${roleString}${role.name} ${role.data.rank}`;
  }
  valuesToSet["data.role"] = roleString;

  // If this is an NPC, show the role panels
  if (record.data?.type === "mook") {
    valuesToSet["fields.rolePanels.hidden"] = false;
  }

  // Set the new roles on the character
  api.setValuesOnRecord(record, valuesToSet);
}

function getUsedRanks(role) {
  let usedRanks = 0;
  // MEDTECH
  usedRanks += role.data.surgery || 0;
  usedRanks += role.data.pharmaceuticals || 0;
  usedRanks += role.data.cryosystemOperation || 0;
  // SOLO
  usedRanks += role.data.damageDeflectionRank || 0;
  usedRanks += role.data.fumbleRecoveryRank || 0;
  usedRanks += role.data.initiativeReactionRank || 0;
  usedRanks += role.data.precisionAttackRank || 0;
  usedRanks += role.data.spotWeaknessRank || 0;
  usedRanks += role.data.threatDetectionRank || 0;
  // TECH
  usedRanks += role.data.fieldExpertiseRank || 0;
  usedRanks += role.data.upgradeExpertiseRank || 0;
  usedRanks += role.data.fabricationExpertiseRank || 0;
  usedRanks += role.data.inventionExpertiseRank || 0;
  return usedRanks;
}

function updateRoles(record) {
  // Get current roles on character if any
  let roles = [...(record.data?.roles || [])];

  const valuesToSet = {};

  // Sort the roles by order
  const rolesSorted = [...roles].sort((a, b) => a.data.order - b.data.order);
  // Update the role string
  let roleString = "";
  for (const role of rolesSorted) {
    if (roleString !== "") {
      roleString = `${roleString} / `;
    }
    roleString = `${roleString}${role.name} ${role.data.rank}`;
    const roleIndex = rolesSorted.findIndex((r) => r._id === role._id);

    // Set unallocated ranks - techs get to allocate 2 ranks in 2 differenet tech skills per role
    valuesToSet[`data.roles.${roleIndex}.data.unallocatedRanks`] =
      role.data.panel === "tech"
        ? role.data.rank * 2 - getUsedRanks(role)
        : role.data.rank - getUsedRanks(role);

    // If solo set max values
    if (role.data.panel === "solo") {
      const unallocatedRanks =
        valuesToSet[`data.roles.${roleIndex}.data.unallocatedRanks`] || 0;
      valuesToSet[`data.roles.${roleIndex}.data.maxDamageDeflection`] =
        (role.data?.damageDeflectionRank || 0) + unallocatedRanks;
      // Fumble recovery is capped at 4
      valuesToSet[`data.roles.${roleIndex}.data.maxFumbleRecovery`] = Math.min(
        4,
        (role.data?.fumbleRecoveryRank || 0) + unallocatedRanks
      );
      valuesToSet[`data.roles.${roleIndex}.data.maxInitiativeReaction`] =
        (role.data?.initiativeReactionRank || 0) + unallocatedRanks;
      // Precision attack is capped at 9
      valuesToSet[`data.roles.${roleIndex}.data.maxPrecisionAttack`] = Math.min(
        9,
        (role.data?.precisionAttackRank || 0) + unallocatedRanks
      );
      valuesToSet[`data.roles.${roleIndex}.data.maxSpotWeakness`] =
        (role.data?.spotWeaknessRank || 0) + unallocatedRanks;
      valuesToSet[`data.roles.${roleIndex}.data.maxThreatDetection`] =
        (role.data?.threatDetectionRank || 0) + unallocatedRanks;
    }

    // If tech set max values
    if (role.data.panel === "tech") {
      const unallocatedRanks =
        valuesToSet[`data.roles.${roleIndex}.data.unallocatedRanks`] || 0;
      valuesToSet[`data.roles.${roleIndex}.data.maxFieldExpertise`] =
        (role.data?.fieldExpertiseRank || 0) + unallocatedRanks;
      valuesToSet[`data.roles.${roleIndex}.data.maxUpgradeExpertise`] =
        (role.data?.upgradeExpertiseRank || 0) + unallocatedRanks;
      valuesToSet[`data.roles.${roleIndex}.data.maxFabricationExpertise`] =
        (role.data?.fabricationExpertiseRank || 0) + unallocatedRanks;
      valuesToSet[`data.roles.${roleIndex}.data.maxInventionExpertise`] =
        (role.data?.inventionExpertiseRank || 0) + unallocatedRanks;
    }

    // Check if netactions defined
    if (role.data.netActionsRank1) {
      valuesToSet[`data.roles.${roleIndex}.data.netActions`] =
        role.data[`netActionsRank${role.data.rank}`];
    }
  }
  valuesToSet["data.role"] = roleString;

  // Determine if we have a netrunner role added
  const netrunnerRole = roles.find((role) => role.data.netActionsRank1);
  if (netrunnerRole) {
    valuesToSet["fields.cyberdecks.hidden"] = false;
  } else {
    valuesToSet["fields.cyberdecks.hidden"] = true;
  }

  // If this is an NPC, hide the role panels if no roles are left
  if (record.data?.type === "mook") {
    valuesToSet["fields.rolePanels.hidden"] = roles.length === 0;
  }

  // Set the new roles on the character
  api.setValuesOnRecord(record, valuesToSet);
}

function addCondition(tokenOrRecord, recordLink, deductHp = 0) {
  // First requery to get the actual record
  const recordType = tokenOrRecord.recordType;
  const recordId =
    tokenOrRecord.recordType === "characters" && tokenOrRecord.recordId
      ? tokenOrRecord.recordId
      : tokenOrRecord._id;

  // This will get the Character record or the Token record (if NPC)
  api.getRecord(recordType, recordId, (actualRecord) => {
    addConditionToRecord(actualRecord, recordLink, deductHp);
  });
}

// Add a condition (injury, addiciton, cover) to a record
function addConditionToRecord(record, recordLink, deductHp = 0) {
  const conditionObj = {
    ...recordLink.value,
  };

  const recordType = record.recordType;
  const conditionType = conditionObj.data?.type || "critical_injury";
  const recordId =
    record.recordType === "characters" && record.recordId
      ? record.recordId
      : record._id;

  // After adding the condition, add the effects to the character sequentially
  const addEffects = (updatedRecord) => {
    // First update attributes based on modifiers
    const valuesToSet = {};
    const bestEquippedArmor = getBestEquippedArmor(record);
    updateAttributesOnRecord(
      // Merge updates with the original record
      updatedRecord,
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

    const token =
      record.linked !== undefined
        ? record
        : api.getSelectedOrDroppedToken()?.[0];

    if (deductHp > 0) {
      const curHp = valuesToSet["data.curhp"] || record.data?.curhp || 0;
      const newHp = Math.max(curHp - deductHp, 0);
      valuesToSet["data.curhp"] = newHp;
      // Float text
      if (token) {
        api.floatText(
          token,
          `Applied ${conditionObj.name}\n\n-${deductHp}`,
          "#FF0000"
        );
      }
    } else if (token) {
      api.floatText(token, `Applied ${conditionObj.name}`, "#FF0000");
    }

    if (Object.keys(valuesToSet).length > 0) {
      api.setValuesOnRecord(updatedRecord, valuesToSet);
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
  const isNpc = recordType === "npcs";
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
      isNpc ? "data.criticalInjuries" : "data.addictions",
      [conditionObj],
      addEffects
    );
  } else if (conditionType === "cover") {
    // For cover, we just reset the character's Cover HP
    const coverHp = conditionObj.data?.coverHp || 0;
    const coverName = conditionObj?.name || "Cover";
    addEffects(record);
    api.sendMessage(
      `Taking Cover: ${coverName}.`,
      undefined,
      [],
      [{ tooltip: `Cover (${coverHp}): ${coverName}`, name: "Cover" }]
    );
  }
}

// Map slot to option slot value
function getOptionSlotValue(cyberwareInstallSlot, leftOrRight) {
  const result = {
    fieldName: "",
    defaultValue: 0,
  };

  if (cyberwareInstallSlot === "neural link") {
    result.fieldName = "neuralLinkOptionSlots";
    result.defaultValue = 5;
  } else if (
    cyberwareInstallSlot === "right cybereye" ||
    cyberwareInstallSlot === "left cybereye"
  ) {
    if (leftOrRight === "left") {
      result.fieldName = "leftCyberEyeOptionSlots";
    } else {
      result.fieldName = "rightCyberEyeOptionSlots";
    }
    result.defaultValue = 3;
  } else if (cyberwareInstallSlot === "cyberaudio suite") {
    result.fieldName = "cyberaudioSuiteOptionSlots";
    result.defaultValue = 3;
  } else if (
    cyberwareInstallSlot === "right cyberarm" ||
    cyberwareInstallSlot === "left cyberarm"
  ) {
    if (leftOrRight === "left") {
      result.fieldName = "leftCyberArmOptionSlots";
    } else {
      result.fieldName = "rightCyberArmOptionSlots";
    }
    result.defaultValue = 4;
  } else if (
    cyberwareInstallSlot === "right cyberleg" ||
    cyberwareInstallSlot === "left cyberleg"
  ) {
    if (leftOrRight === "left") {
      result.fieldName = "leftCyberLegOptionSlots";
    } else {
      result.fieldName = "rightCyberLegOptionSlots";
    }
    result.defaultValue = 3;
  } else if (cyberwareInstallSlot === "internal body cyberware") {
    result.fieldName = "internalCyberwareOptionSlots";
    result.defaultValue = 7;
  } else if (cyberwareInstallSlot === "external body cyberware") {
    result.fieldName = "externalCyberwareOptionSlots";
    result.defaultValue = 7;
  } else if (cyberwareInstallSlot === "fashionware") {
    result.fieldName = "fashionwareOptionSlots";
    result.defaultValue = 7;
  }

  return result;
}

function getCyberwareSlotValue(cyberwareInstallSlot, leftOrRight) {
  if (cyberwareInstallSlot === "neuralware") {
    return "usedNeuralLinkOptionSlots";
  } else if (cyberwareInstallSlot === "chipware") {
    return "usedChipwareOptionSlots";
  } else if (cyberwareInstallSlot === "fashionware") {
    return "usedFashionwareOptionSlots";
  } else if (cyberwareInstallSlot === "cyberoptics") {
    if (leftOrRight === "left") {
      return "usedLeftCyberEyeOptionSlots";
    } else {
      return "usedRightCyberEyeOptionSlots";
    }
  } else if (cyberwareInstallSlot === "cyberaudio") {
    return "usedCyberaudioSuiteOptionSlots";
  } else if (cyberwareInstallSlot === "cyberfingers") {
    if (leftOrRight === "left") {
      return "usedLeftCyberFingerOptionSlots";
    } else {
      return "usedRightCyberFingerOptionSlots";
    }
  } else if (
    cyberwareInstallSlot === "cyberarms" ||
    cyberwareInstallSlot === "right hand" ||
    cyberwareInstallSlot === "left hand"
  ) {
    if (leftOrRight === "left") {
      return "usedLeftCyberArmOptionSlots";
    } else {
      return "usedRightCyberArmOptionSlots";
    }
  } else if (
    cyberwareInstallSlot === "cyberlegs" ||
    cyberwareInstallSlot === "right foot" ||
    cyberwareInstallSlot === "left foot"
  ) {
    if (leftOrRight === "left") {
      return "usedLeftCyberLegOptionSlots";
    } else {
      return "usedRightCyberLegOptionSlots";
    }
  } else if (cyberwareInstallSlot === "internal body cyberware") {
    return "usedInternalCyberwareOptionSlots";
  } else if (cyberwareInstallSlot === "external body cyberware") {
    return "usedExternalCyberwareOptionSlots";
  }

  return "";
}

function setCyberwareSlotValues(record) {
  // Update slots used as needed
  const valuesToSet = {};
  const cyberwareTables = [
    "fashionware",
    "neuralware",
    "chipware",
    "cyberoptics",
    "cyberaudio",
    "cyberfingers",
    "internal body cyberware",
    "external body cyberware",
    "cyberarms",
    "cyberlegs",
    "borgware",
  ];
  cyberwareTables.forEach((installSlot) => {
    // Adjust the slots used based on cyberwareInstallSlot
    let cyberwareFiltered = (record?.data?.inventory || []).filter(
      (item) =>
        item.data?.cyberwareInstallSlot === installSlot &&
        item.data?.carried === "equipped" &&
        item.data?.type === "cyberware" &&
        item.data?.withinGear !== true
    );
    if (installSlot === "cyberarms") {
      cyberwareFiltered = (record?.data?.inventory || []).filter(
        (item) =>
          (item.data?.cyberwareInstallSlot === installSlot &&
            item.data?.carried === "equipped" &&
            item.data?.type === "cyberware") ||
          (item.data?.cyberwareInstallSlot === "foundational" &&
            item.data?.carried === "equipped" &&
            item.data?.type === "cyberware" &&
            (item.data?.foundationalSlot === "right hand" ||
              item.data?.foundationalSlot === "left hand"))
      );
    } else if (installSlot === "cyberlegs") {
      cyberwareFiltered = (record?.data?.inventory || []).filter(
        (item) =>
          (item.data?.cyberwareInstallSlot === installSlot &&
            item.data?.carried === "equipped" &&
            item.data?.type === "cyberware") ||
          (item.data?.cyberwareInstallSlot === "foundational" &&
            item.data?.carried === "equipped" &&
            item.data?.type === "cyberware" &&
            (item.data?.foundationalSlot === "right foot" ||
              item.data?.foundationalSlot === "left foot"))
      );
    }
    let cyberwareFilteredLeft = cyberwareFiltered;
    let cyberwareFilteredRight = [];
    let leftOrRight = "";
    if (installSlot === "cyberoptics") {
      leftOrRight = "left";
      cyberwareFilteredLeft = cyberwareFiltered.filter(
        (item) => item.data?.cyberLocation === "left"
      );
      cyberwareFilteredRight = cyberwareFiltered.filter(
        (item) => item.data?.cyberLocation === "right"
      );
    } else if (installSlot === "cyberfingers") {
      leftOrRight = "left";
      cyberwareFilteredLeft = cyberwareFiltered.filter(
        (item) => item.data?.cyberLocation === "left"
      );
      cyberwareFilteredRight = cyberwareFiltered.filter(
        (item) => item.data?.cyberLocation === "right"
      );
    } else if (
      installSlot === "cyberarms" ||
      installSlot === "right hand" ||
      installSlot === "left hand"
    ) {
      leftOrRight = "left";
      cyberwareFilteredLeft = cyberwareFiltered.filter(
        (item) => item.data?.cyberLocation === "left"
      );
      cyberwareFilteredRight = cyberwareFiltered.filter(
        (item) => item.data?.cyberLocation === "right"
      );
    } else if (
      installSlot === "cyberlegs" ||
      installSlot === "right foot" ||
      installSlot === "left foot"
    ) {
      leftOrRight = "left";
      cyberwareFilteredLeft = cyberwareFiltered.filter(
        (item) => item.data?.cyberLocation === "left"
      );
      cyberwareFilteredRight = cyberwareFiltered.filter(
        (item) => item.data?.cyberLocation === "right"
      );
    }

    let slotValue = getCyberwareSlotValue(installSlot, leftOrRight);

    // If there's a left side, update the left side
    if (slotValue) {
      // Get the total slots used for this cyberware
      const totalSlots = cyberwareFilteredLeft.reduce(
        (acc, item) => acc + item.data?.slots,
        0
      );
      valuesToSet[`data.${slotValue}`] = totalSlots;
    }

    // If there's a right side, update the right side
    if (leftOrRight) {
      slotValue = getCyberwareSlotValue(installSlot, "right");
      if (slotValue) {
        const totalSlots = cyberwareFilteredRight.reduce(
          (acc, item) => acc + item.data?.slots,
          0
        );
        valuesToSet[`data.${slotValue}`] = totalSlots;
      }
    }
  });

  if (Object.keys(valuesToSet).length > 0) {
    api.setValuesOnRecord(record, valuesToSet);
  }
}

function isBlackICE(value) {
  return value.data?.type === "black ice";
}

function isProgram(value) {
  return value.data?.type === "program";
}

function isDemon(value) {
  return value.data?.type === "demon";
}

function isDrone(value) {
  return value.data?.type === "drone";
}

function isVehicle(value) {
  return value.data?.type === "vehicle";
}

function isProgramOrHardware(value) {
  return (
    value.data?.type === "program" ||
    value.data?.type === "program or hardware" ||
    value.data?.programHardwareType === "program"
  );
}

function isHardware(value) {
  return (
    value.data?.type === "program or hardware" &&
    value.data?.programHardwareType === "hardware"
  );
}

// Automatically determine an animation based on the attack or ability
function getAnimationFor({
  abilityName,
  isAutofireOrSuppressiveFire = false,
  isArrow = false,
  isAttack = false,
  isMartialArts = false,
  isBrawling = false,
  isRanged = false,
  isExplosive = false,
}) {
  if (!abilityName) return null;

  const animation = {
    moveToDestination: isRanged,
    stretchToDestination: false,
    destinationOnly: false,
    startAtCenter: false,
    count: 1,
  };

  // Based on the damage, set the animation name and props
  if (isAutofireOrSuppressiveFire) {
    animation.animationName = "bullet_2";
    animation.sound = "gun_1";
    animation.count = 3;
    return animation;
  }

  if (!isAttack && !isMartialArts && !isBrawling) {
    // We really don't know, so return null
    return null;
  }

  if (isMartialArts || isBrawling) {
    animation.animationName = "bludgeon_1";
    animation.sound = "bludgeon_1";
    return animation;
  }

  // If it's melee at this point return a slash...
  if (!isRanged) {
    animation.animationName = "slash_1";
    animation.sound = "slash_1";
    // Unless the item is named something that indicates a different animation
    if (abilityName.toLowerCase().includes("sword")) {
      animation.animationName = "slash_1";
      animation.sound = "slash_1";
    } else if (
      abilityName.toLowerCase().includes("axe") ||
      abilityName.toLowerCase().includes("sword") ||
      abilityName.toLowerCase().includes("katana")
    ) {
      animation.animationName = "slash_1";
      animation.sound = "slash_2";
    } else if (abilityName.toLowerCase().includes("whip")) {
      animation.animationName = "slash_1";
      animation.sound = "whip_1";
    } else if (
      abilityName.toLowerCase().includes("club") ||
      abilityName.toLowerCase().includes("mace") ||
      abilityName.toLowerCase().includes("hammer") ||
      abilityName.toLowerCase().includes("bat") ||
      abilityName.toLowerCase().includes("flail") ||
      abilityName.toLowerCase().includes("pipe") ||
      abilityName.toLowerCase().includes("staff") ||
      abilityName.toLowerCase().includes("pole") ||
      abilityName.toLowerCase().includes("wood") ||
      abilityName.toLowerCase().includes("lead")
    ) {
      animation.animationName = "bludgeon_1";
      animation.sound = "bludgeon_1";
    }
  }
  // If it's ranged, we need to determine the animation based on the weapon
  else {
    // Default gun animation
    animation.animationName = "bullet_2";
    animation.sound = "gun_1";
    // Unless it's a bow...
    if (isArrow) {
      animation.animationName = "arrow_1";
      animation.sound = "arrow_1";
    }
  }

  // If it's explosive, we need to determine the animation based on the weapon
  if (isExplosive) {
    animation.animationName = "bludgeon_1";
    animation.sound = "explosive_1";
    animation.destinationOnly = true;
  }

  if (!animation.animationName) {
    // If not a spell or ability, we can't determine an animation
    return null;
  }

  return animation;
}

// Used by Vehicle NPC records
function onUpgradeChange() {
  // Go through all upgrades and update vehicle stats as appropriate
  const upgrades = record.data?.upgrades || [];
  const vehicleStatsToUpdate = {};

  let seatsCount = record.data?.baseSeats || 0;
  let sdp = record.data?.baseSdp || 0;
  let coverHp = record.data?.baseCoverHp || 0;
  let bodyArmorSp = record.data?.baseBodyArmorSp || 0;

  upgrades.forEach((upgrade) => {
    if (upgrade.data?.type === "vehicle upgrade") {
      const count = upgrade.data?.count !== undefined ? upgrade.data?.count : 1;
      if (upgrade.data?.extraSeats) {
        seatsCount += upgrade.data?.extraSeats * count;
      }
      if (upgrade.data?.additionalSdp) {
        sdp += upgrade.data?.additionalSdp * count;
      }
      if (upgrade.data?.coverHp) {
        coverHp += upgrade.data?.coverHp * count;
      }
      if (upgrade.data?.armorSp) {
        bodyArmorSp += upgrade.data?.armorSp * count;
      }
    }
  });

  vehicleStatsToUpdate["data.seats"] = seatsCount;
  vehicleStatsToUpdate["data.hitpoints"] = sdp;
  vehicleStatsToUpdate["data.curhp"] = sdp;
  vehicleStatsToUpdate["data.coverHp"] = coverHp;
  vehicleStatsToUpdate["data.bodyArmorSP"] = bodyArmorSp;

  api.setValues(vehicleStatsToUpdate);
}

function getLobbyFloorEncounter() {
  // Roll 1d6
  const roll = Math.floor(Math.random() * 6) + 1;

  // Define the lobby encounter table with separate encounter and DV values
  const lobbyEncounterTable = {
    1: { encounter: "File", dv: 6 },
    2: { encounter: "Password", dv: 6 },
    3: { encounter: "Password", dv: 8 },
    4: { encounter: "Skunk", dv: null },
    5: { encounter: "Wisp", dv: null },
    6: { encounter: "Killer", dv: null },
  };

  // Return the encounter for the given roll
  return (
    lobbyEncounterTable[roll] || { encounter: "No encounter found", dv: null }
  );
}

function getRandomFloorEncounter(floorType = "Standard Floor") {
  // Roll 3d6
  const roll =
    Math.floor(Math.random() * 6) +
    1 +
    Math.floor(Math.random() * 6) +
    1 +
    Math.floor(Math.random() * 6) +
    1;

  // Define the encounter table with parsed encounter and DV values
  const encounterTable = {
    "Basic Floor": {
      3: { encounter: "Hellhound", dv: null },
      4: { encounter: "Sabertooth", dv: null },
      5: { encounter: "Raven x2", dv: null },
      6: { encounter: "Hellhound", dv: null },
      7: { encounter: "Wisp", dv: null },
      8: { encounter: "Raven", dv: null },
      9: { encounter: "Password", dv: 6 },
      10: { encounter: "File", dv: 6 },
      11: { encounter: "Control Node", dv: 6 },
      12: { encounter: "Password", dv: 6 },
      13: { encounter: "Skunk", dv: null },
      14: { encounter: "Asp", dv: null },
      15: { encounter: "Scorpion", dv: null },
      16: { encounter: "Killer, Skunk", dv: null },
      17: { encounter: "Wisp x3", dv: null },
      18: { encounter: "Liche", dv: null },
    },
    "Standard Floor": {
      3: { encounter: "Hellhound x2", dv: null },
      4: { encounter: "Hellhound, Killer", dv: null },
      5: { encounter: "Skunk x2", dv: null },
      6: { encounter: "Sabertooth", dv: null },
      7: { encounter: "Scorpion", dv: null },
      8: { encounter: "Hellhound", dv: null },
      9: { encounter: "Password", dv: 8 },
      10: { encounter: "File", dv: 8 },
      11: { encounter: "Control Node", dv: 8 },
      12: { encounter: "Password", dv: 8 },
      13: { encounter: "Asp", dv: null },
      14: { encounter: "Killer", dv: null },
      15: { encounter: "Liche", dv: null },
      16: { encounter: "Asp", dv: null },
      17: { encounter: "Raven x3", dv: null },
      18: { encounter: "Liche, Raven", dv: null },
    },
    "Uncommon Floor": {
      3: { encounter: "Kraken", dv: null },
      4: { encounter: "Hellhound, Scorpion", dv: null },
      5: { encounter: "Hellhound, Killer", dv: null },
      6: { encounter: "Raven x2", dv: null },
      7: { encounter: "Sabertooth", dv: null },
      8: { encounter: "Hellhound", dv: null },
      9: { encounter: "Password", dv: 10 },
      10: { encounter: "File", dv: 10 },
      11: { encounter: "Control Node", dv: 10 },
      12: { encounter: "Password", dv: 10 },
      13: { encounter: "Killer", dv: null },
      14: { encounter: "Liche", dv: null },
      15: { encounter: "Dragon", dv: null },
      16: { encounter: "Asp, Raven", dv: null },
      17: { encounter: "Dragon, Wisp", dv: null },
      18: { encounter: "Giant", dv: null },
    },
    "Advanced Floor": {
      3: { encounter: "Hellhound x3", dv: null },
      4: { encounter: "Asp x2", dv: null },
      5: { encounter: "Hellhound, Liche", dv: null },
      6: { encounter: "Wisp x3", dv: null },
      7: { encounter: "Hellhound, Sabertooth", dv: null },
      8: { encounter: "Kraken", dv: null },
      9: { encounter: "Password", dv: 12 },
      10: { encounter: "File", dv: 12 },
      11: { encounter: "Control Node", dv: 12 },
      12: { encounter: "Password", dv: 12 },
      13: { encounter: "Giant", dv: null },
      14: { encounter: "Dragon", dv: null },
      15: { encounter: "Killer, Scorpion", dv: null },
      16: { encounter: "Kraken", dv: null },
      17: { encounter: "Raven, Wisp, Hellhound", dv: null },
      18: { encounter: "Dragon x2", dv: null },
    },
  };

  // Return the encounter for the given roll and floor type
  return (
    encounterTable[floorType][roll] || {
      encounter: "No encounter found",
      dv: null,
    }
  );
}

function updateNetArchitectureBranchButtons(architecture, doUpdate = true) {
  const valuesToSet = {};

  // Process all floors and their branches recursively
  function processFloors(floors, basePath) {
    try {
      // First hide all branch buttons
      for (let i = 0; i < floors.length; i++) {
        const path = `${basePath}${i}.fields.addBranchButton.hidden`;
        valuesToSet[path] = true;
      }

      // Only show button on the last floor if it has no branches
      if (floors.length > 0) {
        const lastIndex = floors.length - 1;
        const lastFloor = floors[lastIndex];
        const branches = lastFloor?.data?.branches || [];
        // Show button only if this is the last floor AND it has no branches
        if (branches.length === 0) {
          const path = `${basePath}${lastIndex}.fields.addBranchButton.hidden`;
          valuesToSet[path] = false;
        }
      }

      // Process branches recursively
      for (let i = 0; i < floors.length; i++) {
        const currentFloor = floors[i];
        if (!currentFloor || !currentFloor.data) continue;

        const branches = currentFloor.data.branches || [];

        for (
          let branchIndex = 0;
          branchIndex < branches.length;
          branchIndex++
        ) {
          const branch = branches[branchIndex];
          if (!branch || !branch.data) continue;

          // Process left branch
          const leftBranch = branch.data.branch_left || [];
          if (leftBranch.length > 0) {
            const newPath = `${basePath}${i}.data.branches.${branchIndex}.data.branch_left.`;
            processFloors(leftBranch, newPath);
          }

          // Process right branch
          const rightBranch = branch.data.branch_right || [];
          if (rightBranch.length > 0) {
            const newPath = `${basePath}${i}.data.branches.${branchIndex}.data.branch_right.`;
            processFloors(rightBranch, newPath);
          }
        }
      }
    } catch (error) {
      // Do nothing
    }
  }

  try {
    // Start processing from the top-level floors
    const floors = architecture?.data?.floors || [];
    processFloors(floors, "data.floors.");

    // Apply all changes at once
    if (doUpdate) {
      api.setValuesOnRecord(architecture, valuesToSet);
    }
  } catch (error) {
    // Do nothing
  }

  return valuesToSet;
}

function rollOnTable(tableName, columnIndex = 0, callback) {
  // Look up the table by name
  api.getRecordByTypeAndName("tables", tableName, (table) => {
    if (!table) {
      api.showNotification(
        `No table found for ${tableName}. You may need to import the module that contains this table.`,
        "red",
        "Table Not Found"
      );
      // Always call callback even when table is not found
      if (callback) {
        callback({
          text: `[Table not found: ${tableName}]`,
          recordLink: null,
          roll: 0,
          dieRoll: "N/A",
          tableName: tableName,
          error: true,
        });
      }
      return;
    }

    // Parse the die roll string and generate a random result
    const dieRoll = table.dieRoll || "1d6";
    let total = 0;

    try {
      // Parse dice notation (e.g., "1d6", "2d6", "3d10+1")
      const diceMatch = dieRoll.match(/(\d+)d(\d+)([+-]\d+)?/);
      if (diceMatch) {
        const numDice = parseInt(diceMatch[1], 10);
        const dieSize = parseInt(diceMatch[2], 10);
        const modifier = diceMatch[3] ? parseInt(diceMatch[3], 10) : 0;

        // Roll the dice
        for (let i = 0; i < numDice; i++) {
          total += Math.floor(Math.random() * dieSize) + 1;
        }
        total += modifier;
      } else {
        // If we can't parse the die roll, default to 1d6
        total = Math.floor(Math.random() * 6) + 1;
      }
    } catch (error) {
      // If there's an error parsing, default to 1d6
      total = Math.floor(Math.random() * 6) + 1;
    }

    // Get the result from the table using the existing function
    const result = getResultFromTable(table, total);
    if (!result || !result.columns || result.columns.length <= columnIndex) {
      api.showNotification(
        `Error finding result for ${tableName} with total ${total} and column ${columnIndex}.`,
        "red",
        "Invalid Table Result"
      );
      // Always call callback even when result is invalid
      if (callback) {
        callback({
          text: `[Invalid result for ${tableName}]`,
          recordLink: null,
          roll: total,
          dieRoll: dieRoll,
          tableName: tableName,
          error: true,
        });
      }
      return;
    }

    // Get the text from the specified column
    const columnResult = result.columns[columnIndex];
    const resultText = columnResult?.text || "";
    const recordLink = columnResult?.recordLink;

    // Return the result via callback
    if (callback) {
      callback({
        text: resultText,
        recordLink: recordLink,
        roll: total,
        dieRoll: dieRoll,
        tableName: tableName,
        error: false,
      });
    }
  });
}

function generateNetArchitecture(
  architecture,
  difficultyRating = "Standard Floor"
) {
  const valuesToSet = {};

  // Step 1: Shape the Architecture
  // Roll 3d6 for total number of floors
  const totalFloors =
    Math.floor(Math.random() * 6) +
    1 +
    Math.floor(Math.random() * 6) +
    1 +
    Math.floor(Math.random() * 6) +
    1;

  // Check if we have a branch - only one branch on the main level
  let hasBranch = Math.floor(Math.random() * 10) + 1 >= 7;
  let branchFloorIndex = null;
  let leftBranchFloors = 0;
  let rightBranchFloors = 0;

  if (hasBranch) {
    // Branch can't appear until after the second floor, and must leave at least 1 floor after
    // So if we have 5 floors, branch can be on floor 3 or 4 (0-indexed: 2 or 3)
    const minBranchFloor = 2; // After floor 2 (0-indexed)
    const maxBranchFloor = totalFloors - 2; // Leave at least 1 floor after branch

    if (maxBranchFloor >= minBranchFloor) {
      branchFloorIndex =
        Math.floor(Math.random() * (maxBranchFloor - minBranchFloor + 1)) +
        minBranchFloor;

      // Calculate how many floors are available for the branches
      const floorsAfterBranch = totalFloors - branchFloorIndex - 1;

      // Distribute floors between left and right branches
      // Each branch needs at least 1 floor
      if (floorsAfterBranch >= 2) {
        leftBranchFloors =
          Math.floor(Math.random() * (floorsAfterBranch - 1)) + 1;
        rightBranchFloors = floorsAfterBranch - leftBranchFloors;
      } else {
        // Not enough floors for a proper branch, disable branching
        hasBranch = false;
      }
    } else {
      // Not enough floors for a branch, disable branching
      hasBranch = false;
    }
  }

  // Helper function to generate branch floors recursively
  function generateBranchFloors(floorCount, branchPrefix, currentDepth = 0) {
    const branchFloors = [];

    for (let i = 0; i < floorCount; i++) {
      const encounterData = getRandomFloorEncounter(difficultyRating);

      const floor = {
        _id: generateUuid(),
        name: "Floor",
        unidentifiedName: "Floor",
        recordType: "records",
        identified: true,
        data: {
          hidden: "true",
          floor: `${branchPrefix}${i + 1}`,
          encounter: encounterData.encounter,
          dv: encounterData.dv,
        },
        fields: {
          addBranchButton: {
            hidden: true,
          },
        },
      };

      // Randomly add sub-branches (with decreasing probability at deeper levels)
      const branchProbability = Math.max(0.1, 0.7 - currentDepth * 0.2);
      if (Math.random() < branchProbability && i >= 1 && i < floorCount - 1) {
        const remainingFloors = floorCount - i - 1;
        if (remainingFloors >= 2) {
          floor.data.branches = [];
          floor.fields.branchBox = { hidden: false };

          const subLeftFloors =
            Math.floor(Math.random() * (remainingFloors - 1)) + 1;
          const subRightFloors = remainingFloors - subLeftFloors;

          const branchObj = {
            _id: generateUuid(),
            data: {
              branch_left: generateBranchFloors(
                subLeftFloors,
                `${branchPrefix}L`,
                currentDepth + 1
              ),
              branch_right: generateBranchFloors(
                subRightFloors,
                `${branchPrefix}R`,
                currentDepth + 1
              ),
            },
          };

          floor.data.branches.push(branchObj);

          // If we added a branch, we don't need more floors after this one
          branchFloors.push(floor);
          break;
        }
      }

      branchFloors.push(floor);
    }

    return branchFloors;
  }

  // Step 2: Fill in the Architecture
  // Generate the main branch floors
  const floors = [];

  // Determine how many floors to generate in the main branch
  const mainFloorCount = hasBranch ? branchFloorIndex + 1 : totalFloors;

  for (let i = 0; i < mainFloorCount; i++) {
    let encounterData;

    // First two floors use Lobby table
    if (i < 2) {
      encounterData = getLobbyFloorEncounter();
    } else {
      // Remaining floors use the appropriate difficulty table
      encounterData = getRandomFloorEncounter(difficultyRating);
    }

    // Create the floor
    const floor = {
      _id: generateUuid(),
      name: "Floor",
      unidentifiedName: "Floor",
      recordType: "records",
      identified: true,
      data: {
        hidden: "true",
        floor: `${i + 1}`,
        encounter: encounterData.encounter,
        dv: encounterData.dv,
      },
      fields: {
        addBranchButton: {
          hidden: true,
        },
      },
    };

    // If this is the branch floor, add the branch
    if (hasBranch && i === branchFloorIndex) {
      floor.data.branches = [];
      floor.fields.branchBox = { hidden: false };

      const branchObj = {
        _id: generateUuid(),
        data: {
          branch_left: generateBranchFloors(leftBranchFloors, "L"),
          branch_right: generateBranchFloors(rightBranchFloors, "R"),
        },
      };

      floor.data.branches.push(branchObj);
    }

    floors.push(floor);
  }

  // Set the floors directly on the architecture
  valuesToSet["data.floors"] = floors;

  let tempArch = {
    ...architecture,
    data: { ...architecture.data, floors },
  };

  const buttonUpdates = updateNetArchitectureBranchButtons(tempArch, false);

  // First set the floors, then the button updates
  api.setValuesOnRecord(architecture, valuesToSet, (updatedRecord) => {
    api.setValuesOnRecord(updatedRecord, buttonUpdates);
  });

  return valuesToSet;
}
