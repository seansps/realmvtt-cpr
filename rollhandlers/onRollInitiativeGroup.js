const token =
  data?.tokens && data?.tokens.length > 0 ? data?.tokens[0] : undefined;

if (token) {
  const roll = "1d10";

  // Get modifiers for initiative, which is REF
  // TODO use a different value here for Drones/Vehicles/Programs, etc. when added as NPCs later
  const modifiers = [];

  // Add ref
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

  api.promptRollForToken(
    token,
    `Initiative for ${token?.record?.name} Group`,
    roll,
    modifiers,
    {
      rollName: "Initiative",
      tooltip: "Initiative Roll",
      recordType: token.recordType === "characters" ? "characters" : "tokens",
      group: (data?.tokens || []).map((token) => token?._id),
    },
    "initiative"
  );
}
