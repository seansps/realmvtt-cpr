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
const skillName = metadata?.rollName;
const tooltip = `Skill Roll for ${skillName}`;
const overrideDescription = metadata?.overrideDescription;
const defenderSkill = metadata?.defenderSkill;
const isSeriouslyWounded = metadata?.isSeriouslyWounded || false;
const isMortallyWounded = metadata?.isMortallyWounded || false;

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
    "skill"
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
    "skill"
  );
} else {
  const tags = [];

  if (metadata.isAttack) {
    tags.push({
      name: "Attack",
      tooltip: "This skill check was used to make a melee attack.",
    });
  }

  if (metadata.abilityName) {
    tags.push({
      name: `Ability: ${metadata.abilityName}`,
      tooltip: `This skill check was rolled as part of the ${metadata.abilityName} ability.`,
    });
  }

  if (metadata.priorRoll && metadata.priorRoll.tags) {
    tags.push(...metadata.priorRoll.tags);
  }

  if (metadata.targetedLocation === "head" && metadata.isAttack) {
    tags.push({
      name: `Head Shot`,
      tooltip: `At a max of 1 ROF, the attack was aimed at the Head.`,
    });
  } else if (metadata.targetedLocation === "hand") {
    tags.push({
      name: `Hand Shot`,
      tooltip: `At a max of 1 ROF, the attack was aimed at the Hand.`,
    });
  } else if (metadata.targetedLocation === "leg") {
    tags.push({
      name: `Leg Shot`,
      tooltip: `At a max of 1 ROF, the attack was aimed at the Leg.`,
    });
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
    name: skillName,
    tooltip,
  });

  if (isMortallyWounded) {
    tags.push({
      name: "Mortally Wounded",
      tooltip: "Mortally wounded incurs a -4 penalty to all actions.",
    });
  } else if (isSeriouslyWounded) {
    tags.push({
      name: "Seriously Wounded",
      tooltip: "Seriously wounded incurs a -2 penalty to all actions.",
    });
  }

  if (overrideDescription) {
    message = overrideDescription;
  }

  // If a DV check is provided, we check it
  if (dv !== undefined && dv !== null) {
    // Success or failure if DV was defined
    // In Cyberpunk RED, you need to roll higher than the DV to succeed
    if (roll.total > dv) {
      message = `\n\**[center][color=green]Success[/color] (vs DV ${dv})[/center]**\n${message}`;
    } else {
      message = `\n\n**[center][color=red]Failure[/color] (vs DV ${dv})[/center]**\n${message}`;
    }
  }
  // Else if a defender skill was provided we add a macro to roll it with this total as the DV
  else if (defenderSkill) {
    const skillRollButton = `\`\`\`Roll_${defenderSkill.replace(/ /g, "_")}
    const selectedTokens = api.getSelectedOrDroppedToken();
    selectedTokens.forEach(token => {
      // Pass along the total of this roll as the DV for the skill check
      const skillCheckMetadata = {
        isDodge: false,
        dv: ${roll.total},
        defenderSkill: "${defenderSkill}",
      };
  
      performSkillRoll(token, "${defenderSkill}", skillCheckMetadata);
    }); 
  \`\`\``;
    message += `\n${skillRollButton}`;
  }

  api.sendMessage(message, roll, [], tags);
}
