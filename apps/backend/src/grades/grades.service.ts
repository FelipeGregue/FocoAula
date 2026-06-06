import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../common/database.service';
import { Grade } from '../common/domain.types';
import { gradeAverages } from '../common/grade-average';

@Injectable()
export class GradesService {
  constructor(private readonly database: DatabaseService) {}

  async list(userId: string) {
    const db = await this.database.getDb();
    const subjects = db.subjects.filter((subject) => subject.userId === userId);
    const grades = db.grades.filter((grade) => grade.userId === userId);
    return {
      grades,
      averages: gradeAverages(subjects, grades),
    };
  }

  async create(userId: string, input: Omit<Grade, 'id' | 'userId'>) {
    const db = await this.database.getDb();
    const grade: Grade = { ...input, id: this.database.id(), userId };
    db.grades.push(grade);
    await this.database.saveDb();
    return grade;
  }

  async update(userId: string, gradeId: string, input: Partial<Grade>) {
    const db = await this.database.getDb();
    const grade = db.grades.find((item) => item.id === gradeId && item.userId === userId);
    if (!grade) throw new NotFoundException('Nota nao encontrada.');

    Object.assign(grade, input, { id: grade.id, userId: grade.userId });
    await this.database.saveDb();
    return grade;
  }

  async remove(userId: string, gradeId: string) {
    const db = await this.database.getDb();
    const before = db.grades.length;
    db.grades = db.grades.filter(
      (grade) => !(grade.id === gradeId && grade.userId === userId),
    );
    if (db.grades.length === before) throw new NotFoundException('Nota nao encontrada.');
    await this.database.saveDb();
    return { deleted: true };
  }
}
