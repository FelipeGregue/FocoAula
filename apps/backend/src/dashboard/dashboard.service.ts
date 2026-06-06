import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../common/database.service';
import { gradeAverages } from '../common/grade-average';

@Injectable()
export class DashboardService {
  constructor(private readonly database: DatabaseService) {}

  async get(userId: string) {
    const db = await this.database.getDb();
    const tasks = db.tasks.filter((task) => task.userId === userId);
    const events = db.events.filter((event) => event.userId === userId);
    const grades = db.grades.filter((grade) => grade.userId === userId);
    const subjects = db.subjects.filter((subject) => subject.userId === userId);
    const now = Date.now();
    const sevenDays = 1000 * 60 * 60 * 24 * 7;

    return {
      counts: {
        pendingTasks: tasks.filter((task) => task.status !== 'concluida').length,
        urgentTasks: tasks.filter((task) => task.priority === 'urgente').length,
        weekEvents: events.filter((event) => {
          const time = new Date(event.startsAt).getTime();
          return time >= now && time <= now + sevenDays;
        }).length,
        subjects: subjects.length,
      },
      nextTasks: tasks
        .filter((task) => task.status !== 'concluida')
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        .slice(0, 4),
      nextEvents: events
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
        .slice(0, 4),
      gradeAverages: gradeAverages(subjects, grades),
    };
  }
}
