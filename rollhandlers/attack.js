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
const tooltip = metadata?.tooltip;
const icon = metadata?.icon;
const targetName = metadata?.targetName;

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

  // TODO create macros for damage / suppressive fire / melee dodge, etc.

  // Report on the total, and accumulate modifiers
  tags.push({
    name: attackName,
    tooltip,
  });

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
  } else {
    tags.push({
      name: "Ranged",
      tooltip: `A ranged attack's DV is determined by the weapon's range.`,
    });
  }

  if (dv !== undefined && dv !== null && dv > 0) {
    // Success or failure if DV was defined
    // In Cyberpunk RED, you need to roll higher than the DV to succeed
    if (roll.total > dv) {
      message = `[center]${icon ? `:${icon}:` : ""} ${weaponName} ${
        targetName ? ` :IconTargetArrow: ${targetName}` : ""
      }[/center]\n\n**[center][color=green]Hit[/color] [gm](vs DV ${dv})[/gm][/center]**`;
    } else {
      message = `[center]${icon ? `:${icon}:` : ""} ${weaponName} ${
        targetName ? ` :IconTargetArrow: ${targetName}` : ""
      }[/center]\n\n**[center][color=red]MISS[/color] [gm](vs DV ${dv})[/gm][/center]**`;
    }
  } else {
    message = `[center]${icon ? `:${icon}:` : ""} ${weaponName} ${
      targetName ? ` :IconTargetArrow: ${targetName}` : ""
    }[/center]`;
  }

  api.sendMessage(message, roll, [], tags);
}
