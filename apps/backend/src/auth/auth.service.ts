import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { DatabaseService } from '../common/database.service';
import { AcademicEvent, AcademicTask, Grade, Subject, User } from '../common/domain.types';

@Injectable()
export class AuthService {
  constructor(private readonly database: DatabaseService) {}

  async register(input: Pick<User, 'name' | 'email' | 'password'>) {
    const db = await this.database.getDb();
    const email = input.email.trim().toLowerCase();

    if (db.users.some((user) => user.email === email)) {
      throw new BadRequestException('E-mail ja cadastrado.');
    }

    const user: User = {
      id: this.database.id(),
      name: input.name.trim(),
      email,
      password: input.password,
      createdAt: new Date().toISOString(),
    };

    db.users.push(user);
    db.reminders.push({
      userId: user.id,
      enabled: true,
      defaultMinutesBefore: 30,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
    });
    this.seedAcademicData(user.id, db.subjects, db.tasks, db.events, db.grades);
    await this.database.saveDb();

    return this.authPayload(user);
  }

  async login(input: Pick<User, 'email' | 'password'>) {
    const db = await this.database.getDb();
    const user = db.users.find(
      (item) =>
        item.email === input.email.trim().toLowerCase() &&
        item.password === input.password,
    );

    if (!user) {
      throw new UnauthorizedException('Credenciais invalidas.');
    }

    return this.authPayload(user);
  }

  async getMe(userId: string) {
    const user = await this.findUser(userId);
    return this.publicUser(user);
  }

  private async findUser(userId: string) {
    const db = await this.database.getDb();
    const user = db.users.find((item) => item.id === userId);
    if (!user) throw new UnauthorizedException('Usuario nao autenticado.');
    return user;
  }

  private authPayload(user: User) {
    return {
      token: Buffer.from(user.id).toString('base64url'),
      user: this.publicUser(user),
    };
  }

  private publicUser(user: User) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    };
  }

  private seedAcademicData(
    userId: string,
    subjectsStore: Subject[],
    tasksStore: AcademicTask[],
    eventsStore: AcademicEvent[],
    gradesStore: Grade[],
  ) {
    const colors = ['#6FAFC7', '#F2B56B', '#88B77B'];
    const subjects: Subject[] = [
      {
        id: this.database.id(),
        userId,
        name: 'Engenharia de Software',
        teacher: 'Prof. Paulo',
        color: colors[0],
      },
      {
        id: this.database.id(),
        userId,
        name: 'Banco de Dados',
        teacher: 'Prof. Ana',
        color: colors[1],
      },
      {
        id: this.database.id(),
        userId,
        name: 'Interacao Humano-Computador',
        teacher: 'Prof. Lara',
        color: colors[2],
      },
    ];

    subjectsStore.push(...subjects);
    tasksStore.push({
      id: this.database.id(),
      userId,
      title: 'Revisar requisitos funcionais do MVP',
      description: 'Conferir RF01 a RF12 e transformar em checklist.',
      subjectId: subjects[0].id,
      dueDate: this.daysFromNow(1),
      priority: 'alta',
      status: 'fazendo',
      recurrence: 'nenhuma',
      reminderMinutesBefore: 60,
      createdAt: new Date().toISOString(),
    });
    eventsStore.push({
      id: this.database.id(),
      userId,
      title: 'Prova de Banco de Dados',
      type: 'prova',
      subjectId: subjects[1].id,
      startsAt: this.daysFromNow(5),
      location: 'Sala 12',
      notes: 'Revisar normalizacao e SQL.',
      reminderMinutesBefore: 1440,
    });
    gradesStore.push(
      {
        id: this.database.id(),
        userId,
        subjectId: subjects[0].id,
        title: 'Entrega parcial',
        score: 8.5,
        weight: 2,
        date: this.daysFromNow(-4),
      },
      {
        id: this.database.id(),
        userId,
        subjectId: subjects[1].id,
        title: 'Lista SQL',
        score: 9,
        weight: 1,
        date: this.daysFromNow(-2),
      },
    );
  }

  private daysFromNow(days: number) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    date.setHours(days >= 0 ? 9 : 12, 0, 0, 0);
    return date.toISOString();
  }
}
