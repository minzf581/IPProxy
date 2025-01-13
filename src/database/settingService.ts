import db from './index';
import type { SystemSetting } from '@/types/setting';

export async function getSystemSettings(): Promise<Record<string, any>> {
  const settings = await db.settings.toArray();
  return settings.reduce((acc, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {} as Record<string, any>);
}

export async function updateSystemSetting(key: string, value: any): Promise<void> {
  const setting = await db.settings.where('key').equals(key).first();
  const now = new Date();

  if (setting) {
    await db.settings.update(setting.id, {
      value,
      updatedAt: now
    });
  } else {
    await db.settings.add({
      key,
      value,
      createdAt: now,
      updatedAt: now
    });
  }
}

export async function getSettingByKey(key: string): Promise<SystemSetting | undefined> {
  return db.settings.where('key').equals(key).first();
}

export async function updateSettings(settings: Record<string, any>): Promise<void> {
  const now = new Date();
  
  await db.transaction('rw', db.settings, async () => {
    for (const [key, value] of Object.entries(settings)) {
      const setting = await db.settings.where('key').equals(key).first();
      
      if (setting) {
        await db.settings.update(setting.id, {
          value,
          updatedAt: now
        });
      } else {
        await db.settings.add({
          key,
          value,
          createdAt: now,
          updatedAt: now
        });
      }
    }
  });
}
