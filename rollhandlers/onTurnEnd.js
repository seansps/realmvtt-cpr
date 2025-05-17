const token = data?.token;

const valuesToSet = {};

// Check for persistant damage effects like On Fire
const modifiers = getEffectsAndModifiersForToken(
  token,
  ["persistentDamage"],
  ""
);

// This gets applied DIRECTLY to the token's HP
let damageToApply = 0;
let effectsNames = "";
modifiers.forEach((modifier) => {
  if (typeof modifier.value === "number" && modifier.value > 0) {
    damageToApply += modifier.value;
    if (effectsNames !== "") {
      effectsNames += ", ";
    }
    effectsNames += modifier.name;
  }
});

// Let's do this with a macro instead
const damageMacro = `
\`\`\`Apply_Damage
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

targets.forEach(target => {
  // Apply damage
  if (target && target.data) {
    const valuesToSet = {};

    let targetName = target.name || "Target";
    if (!target.identified) {
      targetName = target.unidentifiedName || target.name || "Target";
    }

    let damage = ${damageToApply};
    
    // For undo functionality, create a map of original values
    const oldValues = {};
    
    // Store original HP
    oldValues["data.curhp"] = parseInt(target.data.curhp || "0", 10);
    let curhp = oldValues["data.curhp"];
    
    // Apply damage direct to HP
    curhp = Math.max(0, curhp - damage);
    valuesToSet["data.curhp"] = curhp;

    // Apply changes to target
    if (Object.keys(valuesToSet).length > 0) {
      api.setValuesOnRecord(target, valuesToSet);
    }

    // Generate appropriate message based on what happened
    let message = \`Took \${damage} damage due to ${effectsNames}.\\n\`;
    
    // Apply visual effects
    if (curhp <= 0 && oldValues["data.curhp"] > 0) {
      api.addEffect("Mortally Wounded", target);
      message += \`Mortally Wounded!\\n\`;
    }
    
    // Show floating text based on what happened
    api.floatText(target, \`-\${damage}\`, "#FF0000");
         
    // UNDO macro using api.setValuesOnRecord to avoid race conditions
    const undoMacro = Object.keys(oldValues).length > 0 ? 
\`\\\`\\\`\\\`Undo
const oldValuesObj = JSON.parse('\$\{JSON.stringify(oldValues)\}\');
if (isGM) { 
  api.setValuesOnTokenById('\$\{target._id\}', '\$\{target.recordType\}', oldValuesObj, () => { 
    api.editMessage(null, '~\$\{message.replace(/\\n/g, " ").trim()\}~'); 
  }); 
} else { 
  api.showNotification('Only the GM can undo damage.', 'yellow', 'Notice'); 
} 
\\\`\\\`\\\`\` : '';

    api.sendMessage(\`\${message.trim()}\${undoMacro ? '\\n' + undoMacro : ''}\`, undefined, undefined, undefined, target);
  }
});
\`\`\`
`;

if (damageToApply > 0) {
  const message = `Taking ${damageToApply} damage due to ${effectsNames}.\n${damageMacro}`;
  api.sendMessage(message, undefined, undefined, undefined, token);
}
