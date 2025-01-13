import type { SystemSetting } from '@/types/setting';
import * as dbService from '@/database/settingService';

export async function getSystemSettings(): Promise<Record<string, any>> {
  return dbService.getSystemSettings();
}

export async function updateSystemSetting(key: string, value: any): Promise<void> {
  return dbService.updateSystemSetting(key, value);
}

export async function getSettingByKey(key: string): Promise<SystemSetting | undefined> {
  return dbService.getSettingByKey(key);
}

export async function updateSettings(settings: Record<string, any>): Promise<void> {
  return dbService.updateSettings(settings);
}
