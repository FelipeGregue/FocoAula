import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import {
  AcademicEvent,
  AcademicTask,
  Database,
  emptyDb,
  Grade,
  ReminderSettings,
  Subject,
  User,
} from './domain.types';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly sqlitePath = join(process.cwd(), 'data', 'focoaula.sqlite');
  private readonly legacyJsonPath = join(process.cwd(), 'data', 'focoaula.json');
  private sqlite: DatabaseSync | null = null;
  private db: Database | null = null;

  async getDb() {
    if (this.db) return this.db;

    await this.open();
    await this.importLegacyJsonIfNeeded();
    this.db = this.loadSnapshot();
    return this.db;
  }

  async saveDb() {
    if (!this.db) return;
    await this.open();
    this.persistSnapshot(this.db);
  }

  id() {
    return randomUUID();
  }

  onModuleDestroy() {
    this.sqlite?.close();
    this.sqlite = null;
  }

  private async open() {
    if (this.sqlite) return;

    await mkdir(dirname(this.sqlitePath), { recursive: true });
    this.sqlite = new DatabaseSync(this.sqlitePath);
    this.sqlite.exec('PRAGMA foreign_keys = ON');
    this.sqlite.exec('PRAGMA journal_mode = WAL');
    this.createSchema();
  }

  private createSchema() {
    this.sqlite!.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS subjects (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        teacher TEXT,
        color TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        subject_id TEXT,
        due_date TEXT NOT NULL,
        priority TEXT NOT NULL,
        status TEXT NOT NULL,
        recurrence TEXT NOT NULL,
        reminder_minutes_before INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        type TEXT NOT NULL,
        subject_id TEXT,
        starts_at TEXT NOT NULL,
        location TEXT,
        notes TEXT,
        reminder_minutes_before INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS grades (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        subject_id TEXT NOT NULL,
        title TEXT NOT NULL,
        score REAL NOT NULL,
        weight REAL NOT NULL,
        date TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS reminders (
        user_id TEXT PRIMARY KEY,
        enabled INTEGER NOT NULL,
        default_minutes_before INTEGER NOT NULL,
        quiet_hours_start TEXT NOT NULL,
        quiet_hours_end TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
    this.dropSubjectIconColumnIfPresent();
  }

  private dropSubjectIconColumnIfPresent() {
    const columns = this.sqlite!.prepare('PRAGMA table_info(subjects)').all() as Array<{
      name: string;
    }>;
    if (!columns.some((column) => column.name === 'icon')) return;

    this.sqlite!.exec(`
      PRAGMA foreign_keys = OFF;
      CREATE TABLE subjects_new (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        teacher TEXT,
        color TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
      INSERT INTO subjects_new (id, user_id, name, teacher, color)
      SELECT id, user_id, name, teacher, color FROM subjects;
      DROP TABLE subjects;
      ALTER TABLE subjects_new RENAME TO subjects;
      PRAGMA foreign_keys = ON;
    `);
  }

  private async importLegacyJsonIfNeeded() {
    const userCount = this.sqlite!.prepare('SELECT COUNT(*) as count FROM users').get() as {
      count: number;
    };

    if (userCount.count > 0 || !existsSync(this.legacyJsonPath)) return;

    const raw = await readFile(this.legacyJsonPath, 'utf8');
    const legacyDb = JSON.parse(raw) as Database;
    this.persistSnapshot({
      ...structuredClone(emptyDb),
      ...legacyDb,
    });
  }

  private loadSnapshot(): Database {
    return {
      users: this.loadUsers(),
      subjects: this.loadSubjects(),
      tasks: this.loadTasks(),
      events: this.loadEvents(),
      grades: this.loadGrades(),
      reminders: this.loadReminders(),
    };
  }

  private persistSnapshot(db: Database) {
    this.sqlite!.exec('BEGIN IMMEDIATE');
    try {
      this.sqlite!.exec(`
        DELETE FROM reminders;
        DELETE FROM grades;
        DELETE FROM events;
        DELETE FROM tasks;
        DELETE FROM subjects;
        DELETE FROM users;
      `);

      this.insertUsers(db.users);
      this.insertSubjects(db.subjects);
      this.insertTasks(db.tasks);
      this.insertEvents(db.events);
      this.insertGrades(db.grades);
      this.insertReminders(db.reminders);

      this.sqlite!.exec('COMMIT');
    } catch (error) {
      this.sqlite!.exec('ROLLBACK');
      throw error;
    }
  }

  private loadUsers(): User[] {
    return this.sqlite!.prepare(
      'SELECT id, name, email, password, created_at as createdAt FROM users ORDER BY created_at',
    ).all() as unknown as User[];
  }

  private loadSubjects(): Subject[] {
    return this.sqlite!.prepare(
      `SELECT
        id,
        user_id as userId,
        name,
        teacher,
        color
      FROM subjects
      ORDER BY name`,
    ).all() as unknown as Subject[];
  }

  private loadTasks(): AcademicTask[] {
    return this.sqlite!.prepare(
      `SELECT
        id,
        user_id as userId,
        title,
        description,
        subject_id as subjectId,
        due_date as dueDate,
        priority,
        status,
        recurrence,
        reminder_minutes_before as reminderMinutesBefore,
        created_at as createdAt
      FROM tasks
      ORDER BY due_date`,
    ).all() as unknown as AcademicTask[];
  }

  private loadEvents(): AcademicEvent[] {
    return this.sqlite!.prepare(
      `SELECT
        id,
        user_id as userId,
        title,
        type,
        subject_id as subjectId,
        starts_at as startsAt,
        location,
        notes,
        reminder_minutes_before as reminderMinutesBefore
      FROM events
      ORDER BY starts_at`,
    ).all() as unknown as AcademicEvent[];
  }

  private loadGrades(): Grade[] {
    return this.sqlite!.prepare(
      `SELECT
        id,
        user_id as userId,
        subject_id as subjectId,
        title,
        score,
        weight,
        date
      FROM grades
      ORDER BY date DESC`,
    ).all() as unknown as Grade[];
  }

  private loadReminders(): ReminderSettings[] {
    const rows = this.sqlite!.prepare(
      `SELECT
        user_id as userId,
        enabled,
        default_minutes_before as defaultMinutesBefore,
        quiet_hours_start as quietHoursStart,
        quiet_hours_end as quietHoursEnd
      FROM reminders`,
    ).all() as Array<Omit<ReminderSettings, 'enabled'> & { enabled: number }>;

    return rows.map((row) => ({
      ...row,
      enabled: Boolean(row.enabled),
    }));
  }

  private insertUsers(users: User[]) {
    const statement = this.sqlite!.prepare(
      'INSERT INTO users (id, name, email, password, created_at) VALUES (?, ?, ?, ?, ?)',
    );
    users.forEach((user) => {
      statement.run(user.id, user.name, user.email, user.password, user.createdAt);
    });
  }

  private insertSubjects(subjects: Subject[]) {
    const statement = this.sqlite!.prepare(
      'INSERT INTO subjects (id, user_id, name, teacher, color) VALUES (?, ?, ?, ?, ?)',
    );
    subjects.forEach((subject) => {
      statement.run(
        subject.id,
        subject.userId,
        subject.name,
        subject.teacher ?? null,
        subject.color,
      );
    });
  }

  private insertTasks(tasks: AcademicTask[]) {
    const statement = this.sqlite!.prepare(
      `INSERT INTO tasks (
        id,
        user_id,
        title,
        description,
        subject_id,
        due_date,
        priority,
        status,
        recurrence,
        reminder_minutes_before,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    tasks.forEach((task) => {
      statement.run(
        task.id,
        task.userId,
        task.title,
        task.description ?? null,
        task.subjectId ?? null,
        task.dueDate,
        task.priority,
        task.status,
        task.recurrence,
        task.reminderMinutesBefore,
        task.createdAt,
      );
    });
  }

  private insertEvents(events: AcademicEvent[]) {
    const statement = this.sqlite!.prepare(
      `INSERT INTO events (
        id,
        user_id,
        title,
        type,
        subject_id,
        starts_at,
        location,
        notes,
        reminder_minutes_before
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    events.forEach((event) => {
      statement.run(
        event.id,
        event.userId,
        event.title,
        event.type,
        event.subjectId ?? null,
        event.startsAt,
        event.location ?? null,
        event.notes ?? null,
        event.reminderMinutesBefore,
      );
    });
  }

  private insertGrades(grades: Grade[]) {
    const statement = this.sqlite!.prepare(
      `INSERT INTO grades (
        id,
        user_id,
        subject_id,
        title,
        score,
        weight,
        date
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    );
    grades.forEach((grade) => {
      statement.run(
        grade.id,
        grade.userId,
        grade.subjectId,
        grade.title,
        grade.score,
        grade.weight,
        grade.date,
      );
    });
  }

  private insertReminders(reminders: ReminderSettings[]) {
    const statement = this.sqlite!.prepare(
      `INSERT INTO reminders (
        user_id,
        enabled,
        default_minutes_before,
        quiet_hours_start,
        quiet_hours_end
      ) VALUES (?, ?, ?, ?, ?)`,
    );
    reminders.forEach((reminder) => {
      statement.run(
        reminder.userId,
        reminder.enabled ? 1 : 0,
        reminder.defaultMinutesBefore,
        reminder.quietHoursStart,
        reminder.quietHoursEnd,
      );
    });
  }
}
