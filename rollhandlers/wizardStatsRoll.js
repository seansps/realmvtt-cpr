const metadata = data?.roll?.metadata;
const role = metadata?.role;
const method = metadata?.method;
const stat = metadata?.stat; // For individual stat rolls in Edgerunner method
const roll = data?.roll?.total;

// Helper function to capitalize strings
function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Stat tables for each role (Streetrats/Edgerunner method) live in
// npcBuilder.js so the NPC wizard can share them
const statTables = {};
Object.keys(NPCB_ROLE_STAT_TABLES).forEach((tableRole) => {
  statTables[tableRole] = NPCB_ROLE_STAT_TABLES[tableRole].map((row, i) =>
    npcbRoleStatRow(tableRole, i + 1)
  );
});

if (!statTables || !statTables[role]) {
  api.showNotification("Error finding stats for roll " + roll, "red", "Error");
  return;
}

const selectedStats = statTables[role].find((entry) => entry.roll === roll);

if (!selectedStats) {
  api.showNotification("Error finding stats for roll " + roll, "red", "Error");
  return;
}

if (method === "streetrat") {
  // Streetrat method: Set all stats at once
  const valuesToSet = {
    "data.wizard.int": selectedStats.int,
    "data.wizard.ref": selectedStats.ref,
    "data.wizard.dex": selectedStats.dex,
    "data.wizard.tech": selectedStats.tech,
    "data.wizard.cool": selectedStats.cool,
    "data.wizard.will": selectedStats.will,
    "data.wizard.luck": selectedStats.luck,
    "data.wizard.move": selectedStats.move,
    "data.wizard.body": selectedStats.body,
    "data.wizard.emp": selectedStats.emp,
  };

  api.setValues(valuesToSet);
  api.sendMessage(
    `Rolled a ${roll} for ${capitalize(role)} using the ${capitalize(
      method
    )} method.`
  );
} else if (method === "edgerunner" && stat) {
  // Edgerunner method: Set individual stat
  const statValue = selectedStats[stat];

  if (statValue === undefined) {
    api.showNotification(
      `Error: Invalid stat "${stat}" for ${role}`,
      "red",
      "Error"
    );
    return;
  }

  const valuesToSet = {};
  valuesToSet[`data.wizard.${stat}`] = statValue;

  api.setValues(valuesToSet);
  api.sendMessage(
    `Rolled a ${roll} for ${stat.toUpperCase()}: ${statValue} (${capitalize(
      role
    )} ${capitalize(method)})`
  );
} else {
  api.showNotification(
    "Invalid method or missing stat parameter",
    "red",
    "Error"
  );
}
