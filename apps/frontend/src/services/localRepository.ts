import type {
  AcademicEvent,
  AcademicTask,
  Average,
  EventForm,
  Grade,
  GradeForm,
  ReminderSettings,
  Subject,
  SubjectForm,
  TaskForm,
  User,
} from '../types'

interface StoredUser extends User {
  password: string
}

type StoreName = 'users' | 'subjects' | 'tasks' | 'events' | 'grades' | 'reminders'

const DB_NAME = 'focoaula-local'
const DB_VERSION = 1

export class LocalRepository {
  private dbPromise: Promise<IDBDatabase> | null = null

  async register(input: { name: string; email: string; password: string }) {
    const users = await this.getAll<StoredUser>('users')
    const email = input.email.trim().toLowerCase()

    if (users.some((user) => user.email === email)) {
      throw new Error('E-mail ja cadastrado neste dispositivo.')
    }

    const user: StoredUser = {
      id: this.id(),
      name: input.name.trim(),
      email,
      password: input.password,
      createdAt: new Date().toISOString(),
    }

    await this.put('users', user)
    await this.put('reminders', this.defaultReminders(user.id))

    return this.authPayload(user)
  }

  async login(input: { email: string; password: string }) {
    const users = await this.getAll<StoredUser>('users')
    const user = users.find(
      (item) =>
        item.email === input.email.trim().toLowerCase() && item.password === input.password,
    )

    if (!user) {
      throw new Error('Credenciais invalidas neste dispositivo.')
    }

    return this.authPayload(user)
  }

  async ensureSessionUser(user: User) {
    const existing = await this.getById<StoredUser>('users', user.id)
    if (existing) return

    await this.put('users', { ...user, password: '' })
    await this.put('reminders', this.defaultReminders(user.id))
  }

  async listSubjects(userId: string) {
    const subjects = await this.getAll<Subject>('subjects')
    return subjects.filter((subject) => subject.id && subjectNameOwner(subject) === userId)
  }

  async createSubject(userId: string, input: SubjectForm) {
    const subject: Subject = {
      id: this.id(),
      name: input.name.trim(),
      teacher: input.teacher.trim() || undefined,
      color: input.color,
    }
    await this.put('subjects', withUserId(subject, userId))
    return subject
  }

  async listTasks(userId: string) {
    const tasks = await this.getAll<AcademicTask & { userId: string }>('tasks')
    return tasks
      .filter((task) => task.userId === userId)
      .map(stripUserId)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  }

  async createTask(userId: string, input: TaskForm) {
    const task: AcademicTask = {
      ...input,
      id: this.id(),
      createdAt: new Date().toISOString(),
    }
    await this.put('tasks', withUserId(task, userId))
    return task
  }

  async updateTask(userId: string, taskId: string, input: Partial<AcademicTask>) {
    const task = await this.getOwned<AcademicTask>('tasks', taskId, userId, 'Tarefa nao encontrada.')
    const updated = { ...task, ...input, id: task.id }
    await this.put('tasks', withUserId(updated, userId))
    return updated
  }

  async listEvents(userId: string) {
    const events = await this.getAll<AcademicEvent & { userId: string }>('events')
    return events
      .filter((event) => event.userId === userId)
      .map(stripUserId)
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
  }

  async createEvent(userId: string, input: EventForm) {
    const event: AcademicEvent = {
      ...input,
      id: this.id(),
    }
    await this.put('events', withUserId(event, userId))
    return event
  }

  async listGrades(userId: string) {
    const subjects = await this.listSubjects(userId)
    const grades = (await this.getAll<Grade & { userId: string }>('grades'))
      .filter((grade) => grade.userId === userId)
      .map(stripUserId)

    return {
      grades,
      averages: gradeAverages(subjects, grades),
    }
  }

  async createGrade(userId: string, input: GradeForm) {
    const grade: Grade = {
      ...input,
      id: this.id(),
    }
    await this.put('grades', withUserId(grade, userId))
    return grade
  }

  async updateGrade(userId: string, gradeId: string, input: Partial<Grade>) {
    const grade = await this.getOwned<Grade>('grades', gradeId, userId, 'Nota nao encontrada.')
    const updated = { ...grade, ...input, id: grade.id }
    await this.put('grades', withUserId(updated, userId))
    return updated
  }

  async deleteGrade(userId: string, gradeId: string) {
    await this.getOwned<Grade>('grades', gradeId, userId, 'Nota nao encontrada.')
    await this.delete('grades', gradeId)
    return { deleted: true }
  }

  async getReminders(userId: string) {
    const reminders = await this.getById<ReminderSettings>('reminders', userId)
    if (reminders) return reminders

    const defaults = this.defaultReminders(userId)
    await this.put('reminders', defaults)
    return defaults
  }

  async updateReminders(userId: string, input: ReminderSettings) {
    const reminders = { ...input, userId }
    await this.put('reminders', reminders)
    return input
  }

  private defaultReminders(userId: string): ReminderSettings {
    return {
      userId,
      enabled: true,
      defaultMinutesBefore: 30,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
    }
  }

  private authPayload(user: StoredUser) {
    return {
      token: user.id,
      user: publicUser(user),
    }
  }

  private async getOwned<T extends { id: string }>(
    storeName: StoreName,
    id: string,
    userId: string,
    notFoundMessage: string,
  ) {
    const item = await this.getById<T & { userId: string }>(storeName, id)
    if (!item || item.userId !== userId) throw new Error(notFoundMessage)
    return stripUserId(item)
  }

  private async getDb() {
    if (this.dbPromise) return this.dbPromise

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onupgradeneeded = () => {
        const db = request.result
        this.createStore(db, 'users', 'id')
        this.createStore(db, 'subjects', 'id')
        this.createStore(db, 'tasks', 'id')
        this.createStore(db, 'events', 'id')
        this.createStore(db, 'grades', 'id')
        this.createStore(db, 'reminders', 'userId')
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    return this.dbPromise
  }

  private createStore(db: IDBDatabase, name: StoreName, keyPath: string) {
    if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath })
  }

  private async getAll<T>(storeName: StoreName) {
    const store = await this.store(storeName, 'readonly')
    return new Promise<T[]>((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result as T[])
      request.onerror = () => reject(request.error)
    })
  }

  private async getById<T>(storeName: StoreName, id: string) {
    const store = await this.store(storeName, 'readonly')
    return new Promise<T | undefined>((resolve, reject) => {
      const request = store.get(id)
      request.onsuccess = () => resolve(request.result as T | undefined)
      request.onerror = () => reject(request.error)
    })
  }

  private async put<T>(storeName: StoreName, value: T) {
    const store = await this.store(storeName, 'readwrite')
    return new Promise<void>((resolve, reject) => {
      const request = store.put(value)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  private async delete(storeName: StoreName, id: string) {
    const store = await this.store(storeName, 'readwrite')
    return new Promise<void>((resolve, reject) => {
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  private async store(storeName: StoreName, mode: IDBTransactionMode) {
    const db = await this.getDb()
    return db.transaction(storeName, mode).objectStore(storeName)
  }

  private id() {
    return crypto.randomUUID()
  }
}

function withUserId<T extends object>(value: T, userId: string) {
  return { ...value, userId }
}

function stripUserId<T extends { userId?: string }>(value: T) {
  const { userId: _userId, ...rest } = value
  return rest
}

function subjectNameOwner(subject: Subject & { userId?: string }) {
  return subject.userId
}

function publicUser(user: StoredUser): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  }
}

function gradeAverages(subjects: Subject[], grades: Grade[]): Average[] {
  return subjects.map((subject) => {
    const subjectGrades = grades.filter((grade) => grade.subjectId === subject.id)
    const totalWeight = subjectGrades.reduce((sum, grade) => sum + grade.weight, 0)
    const average =
      totalWeight === 0
        ? 0
        : subjectGrades.reduce((sum, grade) => sum + grade.score * grade.weight, 0) / totalWeight

    return {
      subjectId: subject.id,
      subjectName: subject.name,
      color: subject.color,
      average: Number(average.toFixed(2)),
      assessments: subjectGrades.length,
    }
  })
}
