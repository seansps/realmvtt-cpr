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
const recordId = metadata?.recordId || metadata?.priorRoll?.metadata?.recordId;
const rollRecordType =
  metadata?.recordType || metadata?.priorRoll?.metadata?.recordType;

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
    "initiative"
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
    "initiative"
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
    name: "Initiative",
    tooltip: "Initiative Roll",
  });

  api.getRecord(rollRecordType, recordId, (updatedRecord) => {
    api.setValuesOnRecord(updatedRecord, {
      "data.initiative": roll.total,
    });
  });

  api.sendMessage(message, roll, [], tags);
}
