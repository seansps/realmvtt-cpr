const recordId = record?._id;
let dv = data?.roll?.metadata?.dv;

const roll = {
  ...data.roll,
  dice: [...(data?.roll?.dice || [])],
  total: data?.roll?.total !== undefined ? data?.roll?.total : 0,
};

// Compare roll to DC
const tags = [
  {
    name: "Loyalty",
    tooltip: "Loyalty Roll",
  },
];

// You must roll under the DV to success
if (roll.total < dv) {
  // SUCCESS
  api.sendMessage(
    `**[center][color=green]SUCCESS[/color] vs DV ${dv}[/center]**\n`,
    roll,
    [],
    tags
  );
} else {
  // FAILURE
  api.sendMessage(
    `**[center][color=red]FAILURE[/color] vs DV ${dv}[/center]**\n`,
    roll,
    [],
    tags
  );
}
