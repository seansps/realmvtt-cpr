const recordId = record?._id;
let dv = data?.roll?.metadata?.dv;

const roll = {
  ...data.roll,
  dice: [...(data?.roll?.dice || [])],
  total: data?.roll?.total !== undefined ? data?.roll?.total : 0,
};

// Requery the record incase rolling multiple death saves
api.getRecord(recordType, recordId, (record) => {
  // Compare roll to DC
  const tags = [
    {
      name: "Death Save",
      tooltip: "Death Save Roll",
    },
  ];

  // Get any death save penalties and subtract them from the DV
  let totalPenalty = 0;
  const deathSavePenalties = getEffectsAndModifiersForToken(record, [
    "deathSavePenalty",
  ]);
  deathSavePenalties.forEach((penalty) => {
    dv += parseInt(penalty.value, 10);
    totalPenalty += parseInt(penalty.value, 10);
  });
  if (totalPenalty > 0) {
    tags.push({
      name: "Save Penalty",
      tooltip: `Death Save Penalty: ${totalPenalty}`,
    });
  }

  // Pass or fail, we add a penalty of 1 to the next death save roll
  const token = api.getToken() || record;

  // You must roll under the DV to success
  if (roll.total < dv) {
    // SUCCESS - no death
    api.sendMessage(
      `**[center][color=green]SUCCESS[/color] vs DV ${dv}[/center]**\n`,
      roll,
      [],
      tags
    );
    if (token) {
      api.addEffect("Death Save Penalty", token);
    }
  } else {
    // FAILURE - death
    api.sendMessage(
      `**[center][color=red]FAILURE[/color] vs DV ${dv}[/center]**\n`,
      roll,
      [],
      tags
    );
    if (token) {
      api.addEffect("Dead", token);
    }
  }
});
