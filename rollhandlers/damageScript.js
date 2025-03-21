// Apply damage
// First deduct from Cover HP
let damage = value;
let coverDamaged = false;
let coverDestroyed = false;

let shieldDamaged = false;
let shieldDestroyed = false;

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

  // If damage is greater than 0, check shield HP next if shield is up
  const shieldUp = record.data?.shieldDown === "shieldUp";
  const shieldHp = parseInt(record.data?.shieldHP || "0", 10);
  if (damage > 0 && shieldHp > 0 && shieldUp) {
    const oldShieldHp = shieldHp;
    const newShieldHp = Math.max(oldShieldHp - damage, 0);
    valuesToSet["data.shieldHP"] = newShieldHp;
    shieldDamaged = true;
    damage = 0;
    if (newShieldHp === 0) {
      shieldDestroyed = true;
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

  api.setValues(valuesToSet);
}

// If damage > 0, float text
const token = api.getToken();
if (value > 0 && token) {
  if (curhp <= 0 && token.recordType === "npcs") {
    api.addEffect("Dead", token);
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
  } else {
    api.floatText(token, `-${value}`, "#FF0000");
  }
}
