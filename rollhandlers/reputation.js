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

const metadata = data?.roll?.metadata;
const dv = Math.abs(metadata?.dv);

const tags = [
  {
    name: "Reputation Check",
    tooltip: "Reputation Check is 1d10 rolling under your Reputation value.",
  },
];

let message = "";

// If a DV check is provided, we check it
if (dv !== undefined && dv !== null) {
  // Success or failure if DV was defined
  // In Cyberpunk RED, you need to roll higher than the DV to succeed
  if (roll.total < dv) {
    message = `\n\**[center][color=green]Success[/color] (vs DV ${dv})[/center]**\n`;
    message += `\n\n**[center]They have heard of you.[/center]**\n`;
  } else {
    message = `\n\n**[center][color=red]Failure[/color] (vs DV ${dv})[/center]**\n`;
    message += `\n\n**[center]They have not heard of you.[/center]**\n$`;
  }
}

api.sendMessage(message, roll, [], tags);
