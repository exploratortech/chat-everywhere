import { v4 as uuidv4 } from 'uuid';

const localStorageKey = 'unique_user_id';

export const getOrGenerateUserId = (): string => {
  let uniqueId = localStorage.getItem(localStorageKey);
  if (!uniqueId) {
    uniqueId = uuidv4();
    localStorage.setItem(localStorageKey, uniqueId);
  }

  return uniqueId;
};

export const clearLocalUserId = () => {
  localStorage.removeItem(localStorageKey);
};
