import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../common/database.service';
import { AcademicTask } from '../common/domain.types';

@Injectable()
export class TasksService {
  constructor(private readonly database: DatabaseService) {}

  async list(userId: string) {
    const db = await this.database.getDb();
    return db.tasks
      .filter((task) => task.userId === userId)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }

  async create(
    userId: string,
    input: Omit<AcademicTask, 'id' | 'userId' | 'createdAt'>,
  ) {
    const db = await this.database.getDb();
    const task: AcademicTask = {
      ...input,
      id: this.database.id(),
      userId,
      createdAt: new Date().toISOString(),
    };
    db.tasks.push(task);
    await this.database.saveDb();
    return task;
  }

  async update(userId: string, taskId: string, input: Partial<AcademicTask>) {
    const db = await this.database.getDb();
    const task = db.tasks.find((item) => item.id === taskId && item.userId === userId);
    if (!task) throw new NotFoundException('Tarefa nao encontrada.');

    Object.assign(task, input, { id: task.id, userId: task.userId });
    await this.database.saveDb();
    return task;
  }

  async remove(userId: string, taskId: string) {
    const db = await this.database.getDb();
    const before = db.tasks.length;
    db.tasks = db.tasks.filter((task) => !(task.id === taskId && task.userId === userId));
    if (db.tasks.length === before) throw new NotFoundException('Tarefa nao encontrada.');
    await this.database.saveDb();
    return { deleted: true };
  }
}
