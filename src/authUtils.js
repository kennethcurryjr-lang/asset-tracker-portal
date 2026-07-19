export const getClientId = (user) => {
  if (!user) return "";

  const customId = 
    user.profile?.["custom:clientId"] || 
    user.idToken?.payload?.["custom:clientId"] || 
    user.attributes?.["custom:clientId"];

  return customId || "";
};
