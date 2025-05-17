const token = data?.token;

const valuesToSet = {};

// Check if usedDamageReduction is true and reset it to false
(token?.data?.roles || []).forEach((role, index) => {
  if (role.data?.usedDamageReduction) {
    role.data.usedDamageReduction = false;
    valuesToSet[`data.roles.${index}.data.usedDamageReduction`] = false;
  }
});

if (Object.keys(valuesToSet).length > 0) {
  api.setValuesOnTokenById(token._id, token.recordType, valuesToSet);
}
