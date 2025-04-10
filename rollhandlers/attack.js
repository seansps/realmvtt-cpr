// Get the die face
// Find the undropped d10
let roll = {
  ...data.roll,
  dice: [...(data?.roll?.dice || [])],
  total: data?.roll?.total !== undefined ? data?.roll?.total : 0,
};
const d10 = (roll?.dice || []).find(
  (d) => d.type === 10 && d.reason !== "dropped"
);

// Preserve modifiers and metadata
const metadata = data?.roll?.metadata;
const modifiers = metadata?.modifiers || [];
const attackName = metadata?.rollName;
const weaponName = metadata?.weaponName;
const weaponId = metadata?.weaponId;
const weaponDataPath = metadata?.weaponDataPath;
const tooltip = metadata?.tooltip;
const icon = metadata?.icon;
const targetName = metadata?.targetName;
let smartAmmoValue = metadata?.smartAmmoValue;
let smartBonus = metadata?.smartBonus || 10;
let isSmartReroll = metadata?.isSmartReroll || false; // Don't show the smart ammo re-roll if this is true
let showSmartAmmoReRoll = false;

// Get the record ID and type
const recordId = metadata?.recordId || metadata?.priorRoll?.metadata?.recordId;
let rollRecordType =
  metadata?.recordType || metadata?.priorRoll?.metadata?.recordType;
if (rollRecordType === "npcs") {
  rollRecordType = "tokens";
}

// If we used luck, we need to remove it from the token that rolled
let usedLuck = false;
if (modifiers.find((m) => m.name === "Luck Used")) {
  usedLuck = true;
}
if (usedLuck && record !== undefined && record !== null) {
  api.setValues({
    [`data.nextRoll`]: 0,
  });
}

const dv = metadata?.dv;

if (d10.value === 10 && !metadata.critSuccess && !metadata.critFail) {
  api.roll(
    `1d10`,
    {
      ...metadata,
      priorRoll: roll,
      critSuccess: true,
    },
    "attack"
  );
} else if (d10.value === 1 && !metadata.critSuccess && !metadata.critFail) {
  // On 1, roll again with - 1d10
  api.roll(
    `1d10`,
    {
      ...metadata,
      priorRoll: roll,
      critFail: true,
    },
    "attack"
  );
} else {
  const tags = [];
  if (metadata.priorRoll && metadata.priorRoll.tags) {
    tags.push(...metadata.priorRoll.tags);
  }

  if (metadata.critSuccess) {
    tags.push({
      name: "Critical Success",
      tooltip: "The roll was a Critical Success.",
    });
    // Merge in the new roll with the prior roll
    roll = {
      ...metadata.priorRoll,
      dice: [...metadata.priorRoll.dice, ...roll.dice],
      total: metadata.priorRoll.total + roll.total,
      modifier: metadata.priorRoll.modifier,
    };
    // Render the second d10 as green
    roll.dice[1].customColor = "green";
  } else if (metadata.critFail) {
    tags.push({
      name: "Critical Failure",
      tooltip: "The roll was a Critical Failure.",
    });
    roll = {
      ...metadata.priorRoll,
      dice: [...metadata.priorRoll.dice, ...roll.dice],
      total: metadata.priorRoll.total - roll.total,
      modifier: metadata.priorRoll.modifier,
    };
    // Make sure we render the second d10 as negative
    roll.dice[1].isNegative = true;
  }

  let message = "";

  // Report on the total, and accumulate modifiers
  tags.push({
    name: attackName,
    tooltip,
  });

  let damageType = "single";

  if (metadata.isMelee) {
    tags.push({
      name: "Melee",
      tooltip: `The target must roll DEX + Evasion + 1d10 against the attacker's roll`,
    });
  } else if (metadata.isSuppressive) {
    tags.push({
      name: "Suppressive Fire",
      tooltip: `Targets within 25 m/yds, out of cover, and within line of sight must roll WILL + Concentration + 1d10 against attacker's REF + Autofire Skill + 1d10. Anyone that fails must use their next Move Action to get into cover. If that Move Action would be insufficient to get into cover, they must also use the Run Action to get into cover or as close to cover as possible.`,
    });
  } else if (metadata.isAutofire) {
    tags.push({
      name: "Autofire",
      tooltip: `If you hit, roll 2d6 for damage, and multiply it by the amount you beat the DV to hit your target, up to a maximum denoted by the weapon's Autofire (3 for SMGS, 4 for Assault Rifles).`,
    });
    damageType = "autofire";
  } else {
    tags.push({
      name: "Ranged",
      tooltip: `A ranged attack's DV is determined by the weapon's range.`,
    });
  }

  if (metadata.targetedLocation === "head") {
    tags.push({
      name: `Head Shot`,
      tooltip: `The attack was aimed at the Head.`,
    });
  } else if (metadata.targetedLocation === "hand") {
    tags.push({
      name: `Hand Shot`,
      tooltip: `The attack was aimed at the Hand.`,
    });
  } else if (metadata.targetedLocation === "leg") {
    tags.push({
      name: `Leg Shot`,
      tooltip: `The attack was aimed at the Leg.`,
    });
  }

  // Only on single shot
  if (
    smartAmmoValue &&
    !isSmartReroll &&
    !metadata.isAutofire &&
    !metadata.isSuppressive &&
    !metadata.isMelee
  ) {
    tags.push({
      name: "Smart Ammo",
      tooltip: `If the attack misses by ${smartAmmoValue} or less, re-roll the attack using 1d10 + 10 + Luck Used.`,
    });
  } else {
    smartAmmoValue = 0;
  }

  let beatDvBy = 1;
  let afMultiplierMax = metadata?.afMultiplierMax || 3;

  if (dv !== undefined && dv !== null && dv > 0) {
    // Success or failure if DV was defined
    // In Cyberpunk RED, you need to roll higher than the DV to succeed
    if (dv >= 99) {
      message = `[center]${icon ? `:${icon}:` : ""} ${weaponName} ${
        targetName ? ` :IconTargetArrow: ${targetName}` : ""
      }[/center]\n\n**[center][color=red]IMPOSSIBLE SHOT[/color] (Out of Range)[/center]**`;
    } else if (roll.total > dv) {
      beatDvBy = roll.total - dv;
      message = `[center]${icon ? `:${icon}:` : ""} ${weaponName} ${
        targetName ? ` :IconTargetArrow: ${targetName}` : ""
      }[/center]\n\n**[center][color=green]Hit[/color] [gm](vs DV ${dv})[/gm][/center]**`;
    } else {
      message = `[center]${icon ? `:${icon}:` : ""} ${weaponName} ${
        targetName ? ` :IconTargetArrow: ${targetName}` : ""
      }[/center]\n\n**[center][color=red]MISS[/color] [gm](vs DV ${dv})[/gm][/center]**`;
      if (smartAmmoValue && dv - roll.total <= smartAmmoValue) {
        // Here we can check the DV and determine if we should show the smart ammo re-roll
        showSmartAmmoReRoll = true;
      }
    }
  } else {
    message = `[center]${icon ? `:${icon}:` : ""} ${weaponName} ${
      targetName ? ` :IconTargetArrow: ${targetName}` : ""
    }[/center]`;
    if (smartAmmoValue) {
      // Here we don't know the DV yet, so we need to show the smart ammo re-roll just in case
      showSmartAmmoReRoll = true;
    }
  }

  if (metadata.isAutofire) {
    // Store the multiplier for when we roll damage
    const afMultiplier = Math.min(beatDvBy, afMultiplierMax);
    api.getRecord(rollRecordType, recordId, (updatedRecord) => {
      api.setValuesOnRecord(updatedRecord, {
        "data.afMultiplier": afMultiplier,
      });
    });
  }

  const suppressiveMacro = metadata.isSuppressive
    ? `\n\n
 \`\`\`Roll_Concentration
  const selectedTokens = api.getSelectedOrDroppedToken();
  selectedTokens.forEach(token => {
    // Pass along the total of this roll as the DV for the evasion roll
    const concentrationMetadata = {
      vsSuppressive: true,
      dv: ${roll.total},
    };

    performSkillRoll(token, "Concentration", concentrationMetadata);
  });
\`\`\`
`
    : "";

  // Show the dodge macro if the DV is 0 (indicating that the target is trying to dodge)
  const dodgeMacro =
    dv === 0 && !metadata.isSuppressive
      ? `\n\n
  \`\`\`Roll_Evasion
  const selectedTokens = api.getSelectedOrDroppedToken();
  selectedTokens.forEach(token => {
    // Pass along the total of this roll as the DV for the evasion roll
    const evasionMetadata = {
      isDodge: true,
      dv: ${roll.total},
    };

    performSkillRoll(token, "Evasion", evasionMetadata);
  });
\`\`\`
`
      : "";

  // Damage macro for chat
  const damageMacro =
    weaponId && weaponDataPath && !metadata.isSuppressive
      ? `\n\n
  \`\`\`Roll_Damage
  // Get the record again and then get the weapon by ID
  api.getRecord('${rollRecordType}', '${recordId}', (updatedRecord) => {
    // First check direct inventory items
    let weapon = api.getValueOnRecord(updatedRecord, '${weaponDataPath}')
    
    if (weapon) {
      performDamageRoll(updatedRecord, weapon, '${damageType}');
    }
  });
\`\`\`
`
      : "";

  // Smart Ammo Re-roll Macro
  const smartAmmoReRollMacro = showSmartAmmoReRoll
    ? `\n\n
  \`\`\`Re-roll_With_Smart_Ammo
const attackModifiers = [
  {
    name: 'Smart Ammo',
    value: ${smartBonus},
    isSmartReroll: true,
    active: true,
  }
]
const attackMetadata = JSON.parse('${JSON.stringify(metadata)}');
// Get the record again and then prompt the roll
api.getRecord('${rollRecordType}', '${recordId}', (updatedRecord) => {
  api.promptRollForToken(updatedRecord, '${tooltip}', '1d10', attackModifiers, attackMetadata, 'attack');
});
\`\`\`
`
    : "";

  api.sendMessage(
    `${message}${dodgeMacro}${damageMacro}${suppressiveMacro}${smartAmmoReRollMacro}`,
    roll,
    [],
    tags
  );
}
