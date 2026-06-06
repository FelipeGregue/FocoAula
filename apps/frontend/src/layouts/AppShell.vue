<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CalendarDays, ClipboardList, Clock3, GraduationCap, Home, Settings } from '@lucide/vue'
import AppHeader from '../components/AppHeader.vue'
import BottomNav from '../components/BottomNav.vue'
import AuthPage from '../pages/AuthPage.vue'
import CalendarPage from '../pages/CalendarPage.vue'
import DashboardPage from '../pages/DashboardPage.vue'
import GradesPage from '../pages/GradesPage.vue'
import PomodoroPage from '../pages/PomodoroPage.vue'
import SettingsPage from '../pages/SettingsPage.vue'
import TasksPage from '../pages/TasksPage.vue'
import { LocalRepository } from '../services/localRepository'
import type {
  AcademicEvent,
  AcademicTask,
  ApiStatus,
  AuthForm,
  AuthMode,
  Average,
  EventForm,
  Grade,
  GradeForm,
  NavTab,
  PomodoroMode,
  ReminderSettings,
  Subject,
  SubjectForm,
  Tab,
  TaskForm,
  TaskStatus,
  User,
} from '../types'
import { datetimeLocal, dueLabel, formatDate } from '../utils/date'
import { readLocal, writeLocal } from '../utils/storage'

const localRepository = new LocalRepository()
const route = useRoute()
const router = useRouter()
const tabs: NavTab[] = [
  { id: 'painel', label: 'Painel', icon: Home },
  { id: 'tarefas', label: 'Tarefas', icon: ClipboardList },
  { id: 'calendario', label: 'Agenda', icon: CalendarDays },
  { id: 'pomodoro', label: 'Foco', icon: Clock3 },
  { id: 'notas', label: 'Notas', icon: GraduationCap },
  { id: 'ajustes', label: 'Ajustes', icon: Settings },
]

const token = ref(localStorage.getItem('focoaula.token') ?? '')
const user = ref<User | null>(readLocal<User | null>('focoaula.user', null))
const loading = ref(false)
const apiStatus = ref<ApiStatus>('local')
const message = ref('')
const authMode = ref<AuthMode>('register')

const subjects = ref<Subject[]>(readLocal('focoaula.subjects', []))
const tasks = ref<AcademicTask[]>(readLocal('focoaula.tasks', []))
const events = ref<AcademicEvent[]>(readLocal('focoaula.events', []))
const grades = ref<Grade[]>(readLocal('focoaula.grades', []))
const averages = ref<Average[]>(readLocal('focoaula.averages', []))
const reminders = ref<ReminderSettings>(
  readLocal('focoaula.reminders', {
    enabled: true,
    defaultMinutesBefore: 30,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
  }),
)

const authForm = reactive<AuthForm>({
  name: 'Felipe',
  email: 'felipe@focoaula.app',
  password: '123456',
})

const taskForm = reactive<TaskForm>({
  title: '',
  description: '',
  subjectId: '',
  dueDate: datetimeLocal(1),
  priority: 'alta',
  status: 'pendente',
  recurrence: 'nenhuma',
  reminderMinutesBefore: 30,
})

const eventForm = reactive<EventForm>({
  title: '',
  type: 'prova',
  subjectId: '',
  startsAt: datetimeLocal(3),
  location: '',
  notes: '',
  reminderMinutesBefore: 1440,
})

const gradeForm = reactive<GradeForm>({
  subjectId: '',
  title: '',
  score: 8,
  weight: 1,
  date: new Date().toISOString().slice(0, 10),
})

const gradeEditForm = reactive<GradeForm>({
  subjectId: '',
  title: '',
  score: 0,
  weight: 1,
  date: new Date().toISOString().slice(0, 10),
})

const subjectForm = reactive<SubjectForm>({
  name: '',
  teacher: '',
  color: '#6FAFC7',
})

const focusMinutes = ref(25)
const breakMinutes = ref(5)
const remainingSeconds = ref(focusMinutes.value * 60)
const pomodoroRunning = ref(false)
const pomodoroMode = ref<PomodoroMode>('foco')
const expandedSubjects = ref<string[]>([])
const editingGradeId = ref('')
let pomodoroInterval: number | undefined
let audioContext: AudioContext | undefined

const currentTab = computed<Tab>(() => {
  const routeName = String(route.name ?? 'painel')
  return tabs.some((tab) => tab.id === routeName) ? (routeName as Tab) : 'painel'
})
const pendingTasks = computed(() => tasks.value.filter((task) => task.status !== 'concluida'))
const urgentTasks = computed(() => tasks.value.filter((task) => task.priority === 'urgente'))
const nextTasks = computed(() =>
  [...pendingTasks.value].sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 4),
)
const nextEvents = computed(() =>
  [...events.value].sort((a, b) => a.startsAt.localeCompare(b.startsAt)).slice(0, 4),
)
const completedPercent = computed(() => {
  if (!tasks.value.length) return 0
  return Math.round((tasks.value.filter((task) => task.status === 'concluida').length / tasks.value.length) * 100)
})
const gradeGroups = computed(() =>
  averages.value.map((average) => ({
    ...average,
    grades: grades.value
      .filter((grade) => grade.subjectId === average.subjectId)
      .sort((a, b) => b.date.localeCompare(a.date)),
  })),
)
const pomodoroLabel = computed(() => {
  const minutes = Math.floor(remainingSeconds.value / 60).toString().padStart(2, '0')
  const seconds = (remainingSeconds.value % 60).toString().padStart(2, '0')
  return `${minutes}:${seconds}`
})

onMounted(async () => {
  if (user.value) {
    await localRepository.ensureSessionUser(user.value)
    await refreshAll()
  }
})

onUnmounted(() => {
  if (pomodoroInterval) window.clearInterval(pomodoroInterval)
})

async function submitAuth() {
  loading.value = true
  message.value = ''
  try {
    const response =
      authMode.value === 'login'
        ? await localRepository.login({ email: authForm.email, password: authForm.password })
        : await localRepository.register({
            name: authForm.name,
            email: authForm.email,
            password: authForm.password,
          })
    token.value = response.token
    user.value = response.user
    localStorage.setItem('focoaula.token', response.token)
    writeLocal('focoaula.user', response.user)
    await refreshAll()
  } catch (error) {
    message.value = readableError(error)
  } finally {
    loading.value = false
  }
}

async function refreshAll() {
  await Promise.all([loadSubjects(), loadTasks(), loadEvents(), loadGrades(), loadReminders()])
}

async function loadSubjects() {
  if (!user.value) return
  subjects.value = await localRepository.listSubjects(user.value.id)
  if (!taskForm.subjectId && subjects.value[0]) taskForm.subjectId = subjects.value[0].id
  if (!eventForm.subjectId && subjects.value[0]) eventForm.subjectId = subjects.value[0].id
  if (!gradeForm.subjectId && subjects.value[0]) gradeForm.subjectId = subjects.value[0].id
}

async function loadTasks() {
  if (!user.value) return
  tasks.value = await localRepository.listTasks(user.value.id)
}

async function loadEvents() {
  if (!user.value) return
  events.value = await localRepository.listEvents(user.value.id)
}

async function loadGrades() {
  if (!user.value) return
  const response = await localRepository.listGrades(user.value.id)
  grades.value = response.grades
  averages.value = response.averages
}

async function loadReminders() {
  if (!user.value) return
  reminders.value = await localRepository.getReminders(user.value.id)
}

async function createTask() {
  if (!user.value) return
  const payload = normalizePayload(taskForm)
  const created = await localRepository.createTask(user.value.id, payload as unknown as TaskForm)
  tasks.value = [...tasks.value, created]
  taskForm.title = ''
  taskForm.description = ''
  taskForm.dueDate = datetimeLocal(2)
}

async function cycleTask(task: AcademicTask) {
  if (!user.value) return
  const nextStatus: TaskStatus =
    task.status === 'pendente' ? 'fazendo' : task.status === 'fazendo' ? 'concluida' : 'pendente'
  const updated = await localRepository.updateTask(user.value.id, task.id, { status: nextStatus })
  tasks.value = tasks.value.map((item) => (item.id === task.id ? updated : item))
}

async function createEvent() {
  if (!user.value) return
  const created = await localRepository.createEvent(
    user.value.id,
    normalizePayload(eventForm) as unknown as EventForm,
  )
  events.value = [...events.value, created]
  eventForm.title = ''
  eventForm.location = ''
  eventForm.notes = ''
}

async function createGrade() {
  if (!user.value) return
  await localRepository.createGrade(user.value.id, {
      ...normalizePayload(gradeForm),
      date: new Date(gradeForm.date).toISOString(),
    } as GradeForm)
  gradeForm.title = ''
  await loadGrades()
}

function toggleSubjectGrades(subjectId: string) {
  expandedSubjects.value = expandedSubjects.value.includes(subjectId)
    ? expandedSubjects.value.filter((id) => id !== subjectId)
    : [...expandedSubjects.value, subjectId]
}

function isSubjectExpanded(subjectId: string) {
  return expandedSubjects.value.includes(subjectId)
}

function startGradeEdit(grade: Grade) {
  editingGradeId.value = grade.id
  gradeEditForm.subjectId = grade.subjectId
  gradeEditForm.title = grade.title
  gradeEditForm.score = grade.score
  gradeEditForm.weight = grade.weight
  gradeEditForm.date = grade.date.slice(0, 10)
}

function cancelGradeEdit() {
  editingGradeId.value = ''
}

async function saveGradeEdit(gradeId: string) {
  if (!user.value) return
  await localRepository.updateGrade(user.value.id, gradeId, {
      subjectId: gradeEditForm.subjectId,
      title: gradeEditForm.title,
      score: gradeEditForm.score,
      weight: gradeEditForm.weight,
      date: new Date(gradeEditForm.date).toISOString(),
    })
  editingGradeId.value = ''
  await loadGrades()
}

async function deleteGrade(gradeId: string) {
  if (!user.value) return
  await localRepository.deleteGrade(user.value.id, gradeId)
  if (editingGradeId.value === gradeId) editingGradeId.value = ''
  await loadGrades()
}

async function createSubject() {
  if (!user.value) return
  const created = await localRepository.createSubject(user.value.id, subjectForm)
  subjects.value = [...subjects.value, created]
  subjectForm.name = ''
  subjectForm.teacher = ''
}

async function saveReminders() {
  if (!user.value) return
  reminders.value = await localRepository.updateReminders(user.value.id, reminders.value)
}

function logout() {
  token.value = ''
  user.value = null
  localStorage.removeItem('focoaula.token')
  localStorage.removeItem('focoaula.user')
}

function startPomodoro() {
  if (pomodoroRunning.value) return
  prepareAudio()
  pomodoroRunning.value = true
  pomodoroInterval = window.setInterval(() => {
    remainingSeconds.value -= 1
    if (remainingSeconds.value <= 0) {
      pomodoroMode.value = pomodoroMode.value === 'foco' ? 'pausa' : 'foco'
      remainingSeconds.value = (pomodoroMode.value === 'foco' ? focusMinutes.value : breakMinutes.value) * 60
      navigateTo('pomodoro')
      playPomodoroSound()
      notify('Ciclo concluido', pomodoroMode.value === 'foco' ? 'Hora de voltar ao foco.' : 'Pausa curta liberada.')
    }
  }, 1000)
}

function pausePomodoro() {
  pomodoroRunning.value = false
  if (pomodoroInterval) window.clearInterval(pomodoroInterval)
}

function resetPomodoro() {
  pausePomodoro()
  pomodoroMode.value = 'foco'
  remainingSeconds.value = focusMinutes.value * 60
}

function navigateTo(tab: Tab) {
  if (currentTab.value !== tab) void router.push({ name: tab })
}

function subjectName(subjectId?: string) {
  return subjects.value.find((subject) => subject.id === subjectId)?.name ?? 'Sem disciplina'
}

function subjectColor(subjectId?: string) {
  return subjects.value.find((subject) => subject.id === subjectId)?.color ?? '#6FAFC7'
}

async function notify(title: string, body: string) {
  if (!('Notification' in window)) return
  if (Notification.permission === 'default') await Notification.requestPermission()
  if (Notification.permission === 'granted') new Notification(title, { body })
}

function prepareAudio() {
  const AudioContextClass = window.AudioContext
  audioContext ??= new AudioContextClass()
  if (audioContext.state === 'suspended') void audioContext.resume()
}

function playPomodoroSound() {
  if (!audioContext) prepareAudio()
  if (!audioContext) return

  const now = audioContext.currentTime
  ;[0, 0.18, 0.36].forEach((offset) => {
    const oscillator = audioContext!.createOscillator()
    const gain = audioContext!.createGain()

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(880, now + offset)
    gain.gain.setValueAtTime(0.0001, now + offset)
    gain.gain.exponentialRampToValueAtTime(0.18, now + offset + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.12)

    oscillator.connect(gain)
    gain.connect(audioContext!.destination)
    oscillator.start(now + offset)
    oscillator.stop(now + offset + 0.13)
  })
}

function normalizePayload<T extends Record<string, unknown>>(payload: T) {
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => {
      if (key.endsWith('At') || key.endsWith('Date')) {
        return [key, new Date(String(value)).toISOString()]
      }
      if (typeof value === 'string') return [key, value.trim()]
      return [key, value]
    }),
  )
}

function readableError(error: unknown) {
  return error instanceof Error ? error.message : 'Nao foi possivel concluir a acao.'
}
</script>

<template>
  <AuthPage
    v-if="!user"
    :auth-form="authForm"
    :auth-mode="authMode"
    :loading="loading"
    :message="message"
    @submit="submitAuth"
    @update:auth-mode="authMode = $event"
  />

  <main v-else class="app-shell">
    <AppHeader :user="user" :api-status="apiStatus" @logout="logout" />

    <DashboardPage
      v-if="currentTab === 'painel'"
      :pending-tasks="pendingTasks"
      :urgent-tasks="urgentTasks"
      :next-tasks="nextTasks"
      :completed-percent="completedPercent"
      :subject-name="subjectName"
      :subject-color="subjectColor"
      :due-label="dueLabel"
      @navigate="navigateTo"
    />

    <TasksPage
      v-else-if="currentTab === 'tarefas'"
      :task-form="taskForm"
      :tasks="tasks"
      :subjects="subjects"
      :subject-name="subjectName"
      :format-date="formatDate"
      @create="createTask"
      @cycle="cycleTask"
    />

    <CalendarPage
      v-else-if="currentTab === 'calendario'"
      :event-form="eventForm"
      :next-events="nextEvents"
      :subjects="subjects"
      :subject-name="subjectName"
      :format-date="formatDate"
      @create="createEvent"
    />

    <PomodoroPage
      v-else-if="currentTab === 'pomodoro'"
      :pomodoro-mode="pomodoroMode"
      :pomodoro-label="pomodoroLabel"
      :focus-minutes="focusMinutes"
      :break-minutes="breakMinutes"
      @start="startPomodoro"
      @pause="pausePomodoro"
      @reset="resetPomodoro"
      @update:focus-minutes="focusMinutes = $event"
      @update:break-minutes="breakMinutes = $event"
    />

    <GradesPage
      v-else-if="currentTab === 'notas'"
      :grade-form="gradeForm"
      :grade-edit-form="gradeEditForm"
      :grade-groups="gradeGroups"
      :subjects="subjects"
      :editing-grade-id="editingGradeId"
      :is-subject-expanded="isSubjectExpanded"
      @create="createGrade"
      @toggle="toggleSubjectGrades"
      @edit="startGradeEdit"
      @cancel-edit="cancelGradeEdit"
      @save-edit="saveGradeEdit"
      @delete="deleteGrade"
    />

    <SettingsPage
      v-else
      :subject-form="subjectForm"
      :reminders="reminders"
      @create-subject="createSubject"
      @save-reminders="saveReminders"
    />

    <BottomNav :tabs="tabs" :active-tab="currentTab" />
  </main>
</template>
