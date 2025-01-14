import { getCurrentUser } from './localDbService';

export const fetchMainUser = async () => {
  return await getCurrentUser();
};
