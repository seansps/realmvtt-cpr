// Apply damage
// First deduct from Cover HP
let damage = value;
let coverDamaged = false;
let coverDestroyed = false;
// Ignore negative damage as that is what healing is for
if (damage > 0) {
  const oldCoverHp = parseInt(record.data?.coverHp || "0", 10);
  const newCoverHp = Math.max(oldCoverHp - damage, 0);

  // In Cyberpunk Red, damage to cover doesn't affect the character
  // Only apply damage to character if there was no cover to begin with
  if (newCoverHp !== oldCoverHp) {
    api.setValue("data.coverHp", newCoverHp);
    // Cover took the damage, so we don't damage the character
    damage = 0;
    coverDamaged = true;
    if (newCoverHp === 0) {
      coverDestroyed = true;
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
  api.setValue("data.curhp", curhp);
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
  } else {
    api.floatText(token, `-${value}`, "#FF0000");
  }
}
