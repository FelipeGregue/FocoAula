import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../common/database.service';
import { AcademicEvent } from '../common/domain.types';

@Injectable()
export class EventsService {
  constructor(private readonly database: DatabaseService) {}

  async list(userId: string) {
    const db = await this.database.getDb();
    return db.events
      .filter((event) => event.userId === userId)
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }

  async create(userId: string, input: Omit<AcademicEvent, 'id' | 'userId'>) {
    const db = await this.database.getDb();
    const event: AcademicEvent = { ...input, id: this.database.id(), userId };
    db.events.push(event);
    await this.database.saveDb();
    return event;
  }
}
