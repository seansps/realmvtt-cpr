// TODO add default subskills, or a function to return them
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
        },
        {
          name: "Science",
          stat: "int",
          isDefault: false,
          hasSubskills: true,
          isTimesTwo: false,
          recordType: "skill",
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

function setStatsAndSkills(record, value, stat, moreValuesToSet = null) {
  // Create an object to hold all the values we want to set
  const valuesToSet = {};

  // Parse the stat value
  const val = parseInt(value, 10);
  if (isNaN(val)) {
    return;
  }

  // Store the base stat value
  valuesToSet[`data.${stat}`] = val;

  // Handle hitpoints calculation when body or will changes
  if (stat === "body" || stat === "will") {
    // Get the current values of body and will
    let bodyValue =
      stat === "body"
        ? val
        : moreValuesToSet?.["data.body"] || record.data.body;
    let willValue =
      stat === "will"
        ? val
        : moreValuesToSet?.["data.will"] || record.data.will;

    // Calculate hitpoints using the formula: 10 + (5 * (average of BODY and WILL, rounded up))
    const average = Math.ceil((bodyValue + willValue) / 2);
    const hitpoints = 10 + 5 * average;

    valuesToSet["data.hitpoints"] = hitpoints;
    if (record?.data?.initialHp) {
      valuesToSet["data.curhp"] = hitpoints;
      valuesToSet["data.initialHp"] = hitpoints;
    }

    // Set deathSave equal to body when body changes if deathSave is not already set
    if (stat === "body" && !record?.data?.initialDeathSave) {
      valuesToSet["data.initialDeathSave"] = val;
      valuesToSet["data.deathSave"] = val;
    }
  }

  // If the stat was emp, we set maxHumanity
  if (stat === "emp") {
    valuesToSet["data.maxHumanity"] = val * 10;
    // Only set humanity if it's not already set
    if (!record?.data?.humanity && !moreValuesToSet?.["data.initialHumanity"]) {
      valuesToSet["data.initialHumanity"] = val * 10;
      valuesToSet["data.humanity"] = val * 10;
    }
  }

  // // Update derived stats for specific attributes
  // switch (stat) {
  //   case "ref":
  //     // REF affects initiative in Cyberpunk RED
  //     valuesToSet["data.initiative"] = val;
  //     break;
  //   case "cool":
  //     // COOL affects reputation
  //     valuesToSet["data.reputation"] = val;
  //     break;
  //   case "move":
  //     // Calculate movement speed (in m/turn)
  //     valuesToSet["data.movementSpeed"] = val * 3;
  //     break;
  //   case "emp":
  //     // Calculate humanity
  //     const baseHumanity = val * 10;
  //     valuesToSet["data.humanity"] = baseHumanity;
  //     break;
  // }

  // // Update all skills based on this stat
  // const allSkills = getAllSkills();
  // allSkills.forEach((group) => {
  //   group.skills.forEach((skill) => {
  //     if (skill.stat === stat) {
  //       // For skills with this stat as base, set the skill level
  //       const skillField = `data.skills.${skill.name}`;
  //       const skillLevel = api.getValue(skillField) || 0;

  //       // In Cyberpunk RED, skill checks are STAT + SKILL
  //       const totalValue = val + parseInt(skillLevel, 10);
  //       valuesToSet[`${skillField}Total`] = totalValue;
  //     }
  //   });
  // });

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
