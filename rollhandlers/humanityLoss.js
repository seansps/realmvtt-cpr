const recordId = record?._id;
let halfHumanityLoss = data?.roll?.metadata?.halfHumanityLoss;
let isBaseLoss = data?.roll?.metadata?.isBaseLoss;

const roll = {
  ...data.roll,
  dice: [...(data?.roll?.dice || [])],
  total: data?.roll?.total !== undefined ? data?.roll?.total : 0,
};

// Requery the record incase rolling multiple death saves
api.getRecord("characters", recordId, (record) => {
  // Compare roll to DC
  const tags = [
    {
      name: "Humanity Loss",
      tooltip: isBaseLoss ? "Base Humanity Loss" : "Humanity Loss Roll",
    },
  ];

  // You must roll under the DV to success
  if (roll.total > 0) {
    // Apply the loss, halving it (rounded up) if needed
    let loss = roll.total;
    if (halfHumanityLoss) {
      loss = Math.ceil(loss / 2);
    }

    // Apply the loss
    const newCurHumanity = record.data.curHumanity - loss;
    const bestEquippedArmor = getBestEquippedArmor(record);
    const penalty = bestEquippedArmor.highestPenalty;
    setStatsAndSkills(
      record,
      newCurHumanity,
      "curHumanity",
      null,
      penalty,
      true
    );

    // SUCCESS - no death
    api.sendMessage(
      `**[center]Applied ${loss} Humanity Loss[/center]**\n`,
      roll,
      [],
      tags
    );

    const token = api.getToken() || record;

    // Float text
    api.floatText(token, `-${loss} Humanity Loss`, "#0000FF");
  }
});
