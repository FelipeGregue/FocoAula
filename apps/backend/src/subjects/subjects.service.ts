import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../common/database.service';
import { Subject } from '../common/domain.types';

@Injectable()
export class SubjectsService {
  constructor(private readonly database: DatabaseService) {}

  async list(userId: string) {
    const db = await this.database.getDb();
    return db.subjects.filter((subject) => subject.userId === userId);
  }

  async create(userId: string, input: Omit<Subject, 'id' | 'userId'>) {
    const db = await this.database.getDb();
    const subject: Subject = { ...input, id: this.database.id(), userId };
    db.subjects.push(subject);
    await this.database.saveDb();
    return subject;
  }
}
