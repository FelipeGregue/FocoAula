import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../common/database.service';
import { ReminderSettings } from '../common/domain.types';

@Injectable()
export class RemindersService {
  constructor(private readonly database: DatabaseService) {}

  async get(userId: string) {
    const db = await this.database.getDb();
    return (
      db.reminders.find((settings) => settings.userId === userId) ?? {
        userId,
        enabled: true,
        defaultMinutesBefore: 30,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
      }
    );
  }

  async update(userId: string, input: Partial<ReminderSettings>) {
    const db = await this.database.getDb();
    let settings = db.reminders.find((item) => item.userId === userId);
    if (!settings) {
      settings = await this.get(userId);
      db.reminders.push(settings);
    }
    Object.assign(settings, input, { userId });
    await this.database.saveDb();
    return settings;
  }
}
