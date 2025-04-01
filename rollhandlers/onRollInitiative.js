const token = data?.token;

const roll = "1d10";

// Get modifiers for initiative, which is REF
const modifiers = [];

// Add ref
// TODO use a different value here for Drones/Vehicles/Programs, etc. when added as NPCs later
const ref = parseInt(token?.data?.totalRef || "0", 10);
modifiers.push({
  name: "REF",
  value: ref,
  active: true,
});

// Check effects for all initiative bonuses and penalties
const initiativeModifiers = getEffectsAndModifiersForToken(token, [
  "initiativeBonus",
  "initiativePenalty",
]);
initiativeModifiers.forEach((modifier) => {
  modifiers.push(modifier);
});

const tokenName = token.name || token.record?.name;

api.promptRollForToken(
  token,
  `Initiative for ${tokenName}`,
  roll,
  modifiers,
  {
    rollName: "Initiative",
    tooltip: "Initiative Roll",
    recordType: token.recordType === "characters" ? "characters" : "tokens",
  },
  "initiative"
);
