// Set up the roll so we can re-color d6s
let roll = {
  ...data.roll,
  dice: [...(data?.roll?.dice || [])],
  total: data?.roll?.total !== undefined ? data?.roll?.total : 0,
};

// Find all undropped d6s that rolled a 6 and color them red
const d6s = (roll?.dice || []).filter(
  (d) => d.value === 6 && d.reason !== "dropped"
);

// We roll critical injuries by rolling 2 or more d6s
let isCritical = false;

// If there are 2 or more d6s, color them red
if (d6s.length >= 2) {
  isCritical = true;
  // "Damage" roll handlers use the types array
  roll.types = roll.types.map((die) => {
    if (die.die === 6 && die.value === 6) {
      return {
        ...die,
        customColor: "red",
      };
    }
    return die;
  });
}

let isHalfSp = roll.metadata?.ignoreHalfSp === true;
let isExplosive = roll.metadata?.explosive === true;
let isAutofire = roll.metadata?.isAutofire === true;
let ablationAmount = roll.metadata?.ablationAmount || 1;
let afMultiplier = roll.metadata?.afMultiplier || 1;
let targetLocation = roll.metadata?.targetedLocation || "body";
let isHeadshot = targetLocation === "head";
let isHand = targetLocation === "hand";
let isLeg = targetLocation === "leg";
let ignoresArmorUnder = roll.metadata?.ignoresArmorUnder || 0;

// TODO handle these
let nonLethal = roll.metadata?.nonLethal || false;
let nonLethalGreaterThanOne = roll.metadata?.nonLethalGreaterThanOne || false;

// TODO MACROS FOR ROLLING CRITICAL INJURIES IF TABLE EXISTS
// AND APPLYING THEM TO THE TARGET IN THE CRITICAL INJURY ROLL HANDLER

// Here we need to determine if it was a hit or miss and display in the chat.
const tags = [
  {
    name: "Damage",
    tooltip: `Damage Roll with ${roll.metadata?.weaponName || "Weapon"}`,
  },
];

if (isCritical) {
  tags.push({
    name: "Critical",
    tooltip: "Critical Injury Inflicted",
  });
}

if (isHalfSp && ignoresArmorUnder === 0) {
  tags.push({
    name: "Half SP",
    tooltip: "Half of Target's SP (rounded up) Ignored",
  });
}

if (isExplosive) {
  tags.push({
    name: "Explosive",
    tooltip: "Explosive Damage Carries Through Cover",
  });
}

if (isAutofire) {
  tags.push({
    name: "Autofire",
    tooltip: "Autofire Damage Multiplied by " + afMultiplier,
  });
}

if (isHeadshot) {
  tags.push({
    name: "Headshot",
    tooltip:
      "Damage that gets through the target's head armor is multiplied by 2.",
  });
} else if (isHand) {
  tags.push({
    name: "Hand",
    tooltip: "Target drops one item of your choice held in their hand.",
  });
} else if (isLeg) {
  tags.push({
    name: "Leg",
    tooltip:
      "Target suffers a Broken Leg Critical Injury if they have any legs left that aren't broken.",
  });
}

if (ignoresArmorUnder > 0) {
  tags.push({
    name: `Ignores SP < ${ignoresArmorUnder}`,
    tooltip: `Damage ignores armor SP if it is less than ${ignoresArmorUnder}.`,
  });
}

if (nonLethal) {
  tags.push({
    name: "Non-Lethal",
    tooltip: "Damage is non-lethal.",
  });
}

if (nonLethalGreaterThanOne) {
  tags.push({
    name: "Non-Lethal",
    tooltip: "Damage is non-lethal if at least 1 HP is left.",
  });
}

if (ablationAmount > 1) {
  tags.push({
    name: `Armor Piercing`,
    tooltip: `Damage ablates ${ablationAmount} SP from armor.`,
  });
}

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
    if (!target.identifier) {
      targetName = target.unidentifiedName || target.name || "Target";
    }

    let damage = ${
      isAutofire ? `${roll.total} * ${afMultiplier}` : `${roll.total}`
    };
    
    // For undo functionality, create a map of original values
    const oldValues = {};
    
    // Store original HP
    oldValues["data.curhp"] = parseInt(target.data.curhp || "0", 10);
    let curhp = oldValues["data.curhp"];
    
    // Store original cover HP
    oldValues["data.coverHp"] = parseInt(target.data.coverHp || "0", 10);
    
    // Store original shield HP
    oldValues["data.shieldHP"] = parseInt(target.data.shieldHP || "0", 10);
    
    // Determine which location's armor we need to track for ablation
    // For hand/leg, we use body armor
    const ablationLocation = (${isHand} || ${isLeg}) ? "body" : "${targetLocation}";
    
    // Track status for message generation
    let coverDamaged = false;
    let coverDestroyed = false;
    let shieldDamaged = false;
    let shieldDestroyed = false;
    let armorProtected = false;
    let armorAblated = false;
    let coverDamage = 0;
    let shieldDamage = 0;
    
    // Get all equipped armor from inventory
    const equippedArmor = getBestEquippedArmor(target);
    
    // First deduct from Cover HP if available
    if (damage > 0) {
      const oldCoverHp = oldValues["data.coverHp"];
      coverDamage = Math.min(damage, oldCoverHp);
      const newCoverHp = Math.max(oldCoverHp - damage, 0);
      
      if (newCoverHp !== oldCoverHp) {
        valuesToSet["data.coverHp"] = newCoverHp;
        coverDamaged = true;
        if (newCoverHp === 0) {
          coverDestroyed = true;
        }
        
        if (!${isExplosive}) {
          // Cover took the damage, so don't damage the character unless it's explosive
          damage = 0;
        }
      }
      
      // Check for shield
      const shieldUp = target.data?.shieldDown === "shieldUp";
      const shieldHp = oldValues["data.shieldHP"];
      if (damage > 0 && shieldHp > 0 && shieldUp) {
        shieldDamage = Math.min(damage, shieldHp);
        const oldShieldHp = shieldHp;
        const newShieldHp = Math.max(oldShieldHp - damage, 0);
        valuesToSet["data.shieldHP"] = newShieldHp;
        
        // Get the primary shield from equipped armor (if any)
        const shield = equippedArmor["shield"]?.[0];
        
        // Also update the shield item if we have it
        if (shield) {
          const inventoryArray = target.data?.inventory || [];
          const armorItemIndex = inventoryArray.findIndex(
            (item) => item._id === shield._id
          );
          
          if (armorItemIndex !== -1) {
            const invPath = \`data.inventory.\${armorItemIndex}.data.curSp\`;
            oldValues[invPath] = parseInt(shield.data?.curSp || "0", 10);
            valuesToSet[invPath] = newShieldHp;
          }
        }
        
        shieldDamaged = true;
        damage = 0;
        if (newShieldHp === 0) {
          shieldDestroyed = true;
        }
      }
      
      // Get armor SP for the target location
      const armorField = \`data.\${ablationLocation}ArmorSP\`;
      oldValues[armorField] = parseInt(target.data[ablationLocation + "ArmorSP"] || "0", 10);
      let armorSp = oldValues[armorField];

      // If we ignore armor under, set armorSp to 0
      let armorIgnored = false;
      if (${ignoresArmorUnder} > 0 && armorSp < ${ignoresArmorUnder} && armorSp > 0) {
        armorSp = 0;
        armorIgnored = true;
      }
      
      // If Half SP is active, halve the armor (rounded up)
      if (${isHalfSp}) {
        armorSp = Math.ceil(armorSp / 2);
      }
      
      if (damage > 0 && (armorSp > 0 || armorIgnored)) {
        // We only get damaged if damage is greater than armor's SP
        if (damage > armorSp) {
          armorAblated = true;
          const newArmorSp = Math.max(0, oldValues[armorField] - ${ablationAmount});
          valuesToSet[armorField] = newArmorSp;
          
          // Ablate all armor items equipped in the target location
          const inventoryArray = target.data?.inventory || [];
          inventoryArray.forEach((item, armorItemIndex) => {
            const isCyberArmor = checkIfCyberwareArmor(item, ablationLocation);
            if (
              item.data?.carried === "equipped" &&
              ((item.data?.type === "armor" &&
                item.data?.armorLocation === ablationLocation) ||
                isCyberArmor)
            ) {
              const invPath = \`data.inventory.\${armorItemIndex}.data\`;
              const armorSp = parseInt(item.data?.sp || "0", 10) || 0;
              const curSp = parseInt(item.data?.curSp || "0", 10) || armorSp;
              
              oldValues[\`\${invPath}.curSp\`] = curSp;
              valuesToSet[\`\${invPath}.curSp\`] = Math.max(0, curSp - ${ablationAmount});
            }
          });
          
          // Reduce damage by armor SP
          damage = damage - armorSp;
          
          // If this is a headshot and damage gets through, multiply it by 2
          if (${isHeadshot} && damage > 0) {
            damage = damage * 2;
          }
        } else {
          damage = 0;
          armorProtected = true;
        }
      }
      
      // Apply remaining damage to HP
      if (damage > 0) {
        curhp = Math.max(0, curhp - damage);
        valuesToSet["data.curhp"] = curhp;
      }
      
      // Apply changes to target
      if (Object.keys(valuesToSet).length > 0) {
        api.setValuesOnRecord(target, valuesToSet);
      }
    }

    // Generate appropriate message based on what happened
    let message = '';
    
    // Apply special location effects
    if (${isLeg} && damage > 0) {
      // TODO -- ADD MACRO TO APPLY BROKEN LEG CRITICAL INJURY CONDITION
      message += \`Suffered a Broken Leg Critical Injury!\\n\`;
    } else if (${isHand} && damage > 0) {
      message += \`Held item dropped.\\n\`;
    }
    
    // Apply visual effects
    if (curhp <= 0 && oldValues["data.curhp"] > 0) {
      api.addEffect("Mortally Wounded", target);
      message += \`Mortally Wounded!\\n\`;
    }
    
    // Show floating text based on what happened
    if (damage > 0 || coverDamaged || shieldDamaged) {
      if (coverDamaged) {
        if (coverDestroyed) {
          api.floatText(target, \`Cover Destroyed\`, "#0000FF");
          message += \`Cover was destroyed!\\n\`;
        } else {
          api.floatText(target, \`Cover Damaged by \${coverDamage}\`, "#0000FF");
          message += \`Cover was damaged by \${coverDamage}.\\n\`;
        }
      } else if (shieldDamaged) {
        if (shieldDestroyed) {
          api.floatText(target, \`Shield Destroyed\`, "#0000FF");
          message += \`Shield was destroyed!\\n\`;
        } else {
          api.floatText(target, \`Shield Damaged by \${shieldDamage}\`, "#0000FF");
          message += \`Shield was damaged by \${shieldDamage}.\\n\`;
        }
      } else if (armorProtected) {
        api.floatText(target, \`\${ablationLocation.charAt(0).toUpperCase() + ablationLocation.slice(1)} Armor Prevented Damage\`, "#0000FF");
        message += \`Armor blocked the damage.\\n\`;
      } else {
        if (armorAblated) {
          api.floatText(
            target, 
            \`-\${damage}\\n\${ablationLocation.charAt(0).toUpperCase() + ablationLocation.slice(1)} Armor Ablated by \${${ablationAmount}}\`, 
            "#FF0000"
          );
          message += \`Took \${damage} damage${
            isHeadshot ? " due to headshot" : ""
          } and armor was ablated.\\n\`;
        } else {
          api.floatText(target, \`-\${damage}\`, "#FF0000");
          message += \`Took \${damage} damage${
            isHeadshot ? " due to headshot" : ""
          }.\\n\`;
        }
      }
    } else {
      if (armorProtected) {
        message = \`Armor blocked the damage.\\n\`;
      } else {
        message = \`No damage was applied to \${targetName}.\`;
      }
    }
    
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

const totalDamage = isAutofire
  ? `${roll.total} * ${afMultiplier} = ${roll.total * afMultiplier}`
  : `${roll.total}`;

const message = isAutofire
  ? `
**[center]Autofire Damage: ${totalDamage}[/center]**
${damageMacro}
`
  : `
${damageMacro}
`;
api.sendMessage(message, roll, [], tags);
