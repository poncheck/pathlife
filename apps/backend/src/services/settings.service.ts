import { PrismaClient } from '@prisma/client';
import CryptoJS from 'crypto-js';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export class SettingsService {
  private encryptionKey: string;

  constructor() {
    this.encryptionKey = process.env.ENCRYPTION_KEY || 'change-me-in-production-32-chars';

    if (this.encryptionKey === 'change-me-in-production-32-chars') {
      logger.warn('⚠️  Using default ENCRYPTION_KEY! Set a secure key in production.');
    }
  }

  /**
   * Encrypt sensitive data
   */
  private encrypt(value: string): string {
    return CryptoJS.AES.encrypt(value, this.encryptionKey).toString();
  }

  /**
   * Decrypt sensitive data
   */
  private decrypt(encryptedValue: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedValue, this.encryptionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  /**
   * Get setting value (decrypted)
   */
  async get(key: string): Promise<string | null> {
    try {
      const setting = await prisma.settings.findUnique({
        where: { key },
      });

      if (!setting) {
        return null;
      }

      return this.decrypt(setting.value);
    } catch (error: any) {
      logger.error(`Error getting setting '${key}':`, error.message);
      return null;
    }
  }

  /**
   * Set setting value (encrypted)
   */
  async set(key: string, value: string, type: string = 'system'): Promise<void> {
    try {
      const encryptedValue = this.encrypt(value);

      await prisma.settings.upsert({
        where: { key },
        update: { value: encryptedValue, type },
        create: { key, value: encryptedValue, type },
      });

      logger.info(`Setting '${key}' updated (type: ${type})`);
    } catch (error: any) {
      logger.error(`Error setting '${key}':`, error.message);
      throw new Error('Failed to save setting');
    }
  }

  /**
   * Get all settings by type (decrypted values)
   */
  async getByType(type: string): Promise<Record<string, string>> {
    try {
      const settings = await prisma.settings.findMany({
        where: { type },
      });

      const result: Record<string, string> = {};

      for (const setting of settings) {
        try {
          result[setting.key] = this.decrypt(setting.value);
        } catch (error) {
          logger.error(`Failed to decrypt setting '${setting.key}'`);
          result[setting.key] = '';
        }
      }

      return result;
    } catch (error: any) {
      logger.error(`Error getting settings by type '${type}':`, error.message);
      return {};
    }
  }

  /**
   * Get all settings (keys only, no values for security)
   */
  async getAllKeys(): Promise<Array<{ key: string; type: string; hasValue: boolean }>> {
    try {
      const settings = await prisma.settings.findMany({
        select: {
          key: true,
          type: true,
          value: true,
        },
      });

      return settings.map((s) => ({
        key: s.key,
        type: s.type,
        hasValue: !!s.value,
      }));
    } catch (error: any) {
      logger.error('Error getting all settings keys:', error.message);
      return [];
    }
  }

  /**
   * Delete setting
   */
  async delete(key: string): Promise<void> {
    try {
      await prisma.settings.delete({
        where: { key },
      });

      logger.info(`Setting '${key}' deleted`);
    } catch (error: any) {
      logger.error(`Error deleting setting '${key}':`, error.message);
      throw new Error('Failed to delete setting');
    }
  }

  /**
   * Update multiple settings at once
   */
  async updateMultiple(settings: Array<{ key: string; value: string; type: string }>): Promise<void> {
    try {
      for (const setting of settings) {
        if (setting.value) {
          // Only update if value is not empty
          await this.set(setting.key, setting.value, setting.type);
        }
      }

      logger.info(`Updated ${settings.length} settings`);
    } catch (error: any) {
      logger.error('Error updating multiple settings:', error.message);
      throw new Error('Failed to update settings');
    }
  }

  /**
   * Get decrypted connection settings for services
   */
  async getServiceConfig(service: 'immich' | 'strava' | 'traccar'): Promise<Record<string, string>> {
    return await this.getByType(service);
  }
}

export const settingsService = new SettingsService();
