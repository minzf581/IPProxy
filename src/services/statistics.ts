import { getStatistics } from './localDbService';

export const fetchStatistics = async () => {
  return await getStatistics();
};