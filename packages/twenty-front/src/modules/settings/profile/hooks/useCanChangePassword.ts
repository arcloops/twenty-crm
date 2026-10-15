export const useCanChangePassword = () => {
  // Profile always offers set/change password, including Microsoft sign-in accounts.
  return { canChangePassword: true };
};
