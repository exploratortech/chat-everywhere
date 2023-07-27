export const isEmailValid = (email: string): boolean => {
  return !!email.trim().match(/^[^@]+@[^@]+\.[^@]+$/);
};
