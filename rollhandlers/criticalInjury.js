// Roll handler for critical injuries
const metadata = data?.roll?.metadata;
let tableName = metadata?.tableName || "Critical Injuries to the Body";
let deductHP = metadata?.deductHP || 5;
let targetId = metadata?.targetId || "";
let targetName = metadata?.targetName || "";

let total = data?.roll?.total || 0;

const NO_INJURIES = ["program", "black ice", "vehicle", "drone", "defenses"];

if (total < 2) {
  return;
}

let tags = [];
if (tableName.toLowerCase().includes("head")) {
  tags.push({
    name: "Head Injury",
    tooltip: "Critical Injury to the Head",
  });
} else if (tableName.toLowerCase().includes("body")) {
  tags.push({
    name: "Body Injury",
    tooltip: "Critical Injury to the Body",
  });
}

let message = "[center]Critical Injury Inflicted[/center]";

const sendFinalMessage = () => {
  api.sendMessage(message, data?.roll, [], tags);
};

// Look up the result on the table
api.getRecordByTypeAndName("tables", tableName, (table) => {
  if (!table) {
    api.showNotification(
      `No table found for ${tableName}. You may need to import the module that contains this table.`,
      "red",
      "Table Not Found"
    );

    sendFinalMessage();
    return;
  }

  // First get the result from the table
  const result = getResultFromTable(table, total);
  if (!result || !result.columns || !result.columns.length) {
    api.showNotification(
      `Error finding result for ${tableName} with total ${total}.`,
      "red",
      "Invalid Critical Injury"
    );
    sendFinalMessage();
    return;
  }

  const injuryRecordLink = result.columns[0]?.recordLink;

  if (!injuryRecordLink) {
    api.showNotification(
      `Error finding injury for ${tableName} with total ${total}.`,
      "red",
      "Invalid Critical Injury"
    );
    sendFinalMessage();
    return;
  }

  // Get the status, quick fix, and treatment from the result and add them to the message
  const injuryStatus = result.columns[0]?.text;
  const injuryQuickFix = result.columns?.[1]?.text;
  const injuryTreatment = result.columns?.[2]?.text;

  const injuryId = injuryRecordLink.value._id;
  const injuryName = injuryRecordLink.tooltip;

  if (targetName) {
    message = `[center]${injuryName} :IconArrowBigRight: ${targetName}[/center]\n`;
  } else {
    message = `[center]${injuryName}[/center]\n`;
  }
  if (injuryStatus) {
    message += ` - Effect: ${injuryStatus}\n`;
  }

  if (injuryQuickFix) {
    message += ` - Quick Fix: ${injuryQuickFix}\n`;
  }

  if (injuryTreatment) {
    message += ` - Treatment: ${injuryTreatment}\n`;
  }

  // Build macro to apply the injury unless there is a target, we apply it to the target
  const macro = `
\`\`\`Apply_${injuryName.replaceAll(" ", "_")}
let targets = api.getSelectedOrDroppedToken();

// If record is not null, check if we're the GM or owner and use it
if (record) {
  if (isGM || record?.record?.ownerId === userId) {
    targets = [record];
  }
}

// If we're a player and we did not drop on a record, get our owned tokens
if (!isGM && targets.length === 0) {
    targets = api.getSelectedOwnedTokens().map(target => target.token);
}

// First re-query the injury record
api.getRecord('conditions', '${injuryId}', (injuryRecord) => {
  if (injuryRecord) {
    const injuryRecordLink = {
      value: injuryRecord,
      tooltip: injuryRecord?.name || "Injury",
    };
    targets.forEach(target => {
      addCondition(target, injuryRecordLink, ${deductHP});
    });
  }
});
\`\`\``;

  const reRollMacro = `
\`\`\`Re-roll_Critical_Injury
const tableName = '${tableName}';
const criticalInjuryMetadata = {
  tableName: tableName,
  deductHP: ${deductHP},
  targetId: '${targetId}',
  targetName: '${targetName}',
};
const targetLocation = tableName.toLowerCase().includes("head") ? "Head" : "Body";
// Roll without target IDs
api.roll(
  "2d6",
  criticalInjuryMetadata,
  "criticalInjury"
);
\`\`\``;

  message += `\n${macro}\n${reRollMacro}`;

  sendFinalMessage();
});
