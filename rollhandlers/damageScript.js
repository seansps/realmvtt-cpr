// Apply damage
// First deduct from Cover HP
let damage = value;
let coverDamaged = false;
let coverDestroyed = false;

let shieldDamaged = false;
let shieldDestroyed = false;

// Assume damage from this script is targetting the body armor
let targetLocation = "body";
let armorProtected = false;
let armorAblated = false;
// We ablate the armor by 1 (assume no penetrating ammo in this script)
let ablationAmount = 1;

const valuesToSet = {};

// Ignore negative damage as that is what healing is for
if (damage > 0) {
  const oldCoverHp = parseInt(record.data?.coverHp || "0", 10);
  const newCoverHp = Math.max(oldCoverHp - damage, 0);

  // In Cyberpunk Red, damage to cover doesn't affect the character
  // Only apply damage to character if there was no cover to begin with
  if (newCoverHp !== oldCoverHp) {
    valuesToSet["data.coverHp"] = newCoverHp;
    // Cover took the damage, so we don't damage the character
    damage = 0;
    coverDamaged = true;
    if (newCoverHp === 0) {
      coverDestroyed = true;
    }
  }

  const equippedArmor = getBestEquippedArmor(record);

  const shield = equippedArmor["shield"]?.[0];
  const bodyArmor = equippedArmor[targetLocation]?.[0];

  // If damage is greater than 0, check shield HP next if shield is up
  const shieldUp = record.data?.shieldDown === "shieldUp";
  const shieldHp = parseInt(record.data?.shieldHP || "0", 10);
  if (damage > 0 && shieldHp > 0 && shieldUp) {
    const oldShieldHp = shieldHp;
    const newShieldHp = Math.max(oldShieldHp - damage, 0);
    valuesToSet["data.shieldHP"] = newShieldHp;

    // Also set it on the item that represents the shield
    if (shield) {
      // Find the index directly by searching through the inventory array
      const inventoryArray = record?.data?.inventory || [];
      const armorItemIndex = inventoryArray.findIndex(
        (item) => item._id === shield._id
      );

      if (armorItemIndex !== -1) {
        valuesToSet[`data.inventory.${armorItemIndex}.data.curshieldSp`] =
          newShieldHp;
      }
    }

    shieldDamaged = true;
    damage = 0;
    if (newShieldHp === 0) {
      shieldDestroyed = true;
    }
  }

  // Ablate armor if needed
  let bodyArmorSp = parseInt(record.data?.bodyArmorSP || "0", 10);
  if (damage > 0 && bodyArmorSp > 0) {
    // We only get damaged if the damage is greater than the armor's SP
    if (damage > bodyArmorSp) {
      armorAblated = true;
      const newBodyArmorSp = Math.max(0, bodyArmorSp - ablationAmount);
      valuesToSet[`data.${targetLocation}ArmorSP`] = newBodyArmorSp;
      // Also set it on all armor equipped in the body location
      const inventoryArray = record?.data?.inventory || [];
      inventoryArray.forEach((item, armorItemIndex) => {
        const isCyberArmor = checkIfCyberwareArmor(item, targetLocation);
        if (
          item.data?.carried === "equipped" &&
          ((item.data?.type === "armor" &&
            item.data?.armorLocation === targetLocation) ||
            isCyberArmor)
        ) {
          const armorSp = parseInt(item.data?.sp || "0", 10) || 0;
          let curSp = parseInt(item.data?.[`cur${targetLocation}Sp`], 10);
          if (isNaN(curSp)) {
            curSp = armorSp;
          }
          valuesToSet[
            `data.inventory.${armorItemIndex}.data.cur${targetLocation}Sp`
          ] = curSp - ablationAmount;
        }
      });
      // Reduct damage by armor sp
      damage = damage - bodyArmorSp;
    } else {
      damage = 0;
      armorProtected = true;
    }
  }

  var curhp = parseInt(record.data?.curhp, "0", 10);
  curhp -= damage;
  if (curhp < 0) {
    curhp = 0;
  }
  if (curhp > record.data?.hitpoints) {
    curhp = record.data?.hitpoints;
  }
  valuesToSet["data.curhp"] = curhp;

  if (Object.keys(valuesToSet).length > 0) {
    api.setValues(valuesToSet);
  }
}

// If damage > 0, float text
const token = api.getToken();
if (value > 0 && token) {
  if (curhp <= 0) {
    api.addEffect("Mortally Wounded", token);
  }
  if (coverDamaged) {
    if (coverDestroyed) {
      api.floatText(token, `Cover Destroyed`, "#0000FF");
    } else {
      api.floatText(token, `Cover Damaged by ${value}`, "#0000FF");
    }
  } else if (shieldDamaged) {
    if (shieldDestroyed) {
      api.floatText(token, `Shield Destroyed`, "#0000FF");
    } else {
      api.floatText(token, `Shield Damaged by ${value}`, "#0000FF");
    }
  } else if (armorProtected) {
    api.floatText(
      token,
      `${capitalize(targetLocation)} Armor Prevented Damage`,
      "#0000FF"
    );
  } else {
    if (armorAblated) {
      api.floatText(
        token,
        `-${damage}\n${capitalize(
          targetLocation
        )} Armor Ablated by ${ablationAmount}`,
        "#FF0000"
      );
    } else {
      if (damage > 0) {
        api.floatText(token, `-${damage}`, "#FF0000");
      }
    }
  }
}
