<script setup lang="ts">
import { Bell, CheckCircle2, ClipboardList, TimerReset } from '@lucide/vue'
import type { AcademicTask, Tab } from '../types'

defineProps<{
  pendingTasks: AcademicTask[]
  urgentTasks: AcademicTask[]
  nextTasks: AcademicTask[]
  completedPercent: number
  subjectName: (subjectId?: string) => string
  subjectColor: (subjectId?: string) => string
  dueLabel: (value: string) => string
}>()

defineEmits<{
  navigate: [tab: Tab]
}>()
</script>

<template>
  <section class="screen">
    <div class="metric-grid">
      <article class="metric">
        <ClipboardList :size="22" />
        <strong>{{ pendingTasks.length }}</strong>
        <span>pendentes</span>
      </article>
      <article class="metric">
        <Bell :size="22" />
        <strong>{{ urgentTasks.length }}</strong>
        <span>urgentes</span>
      </article>
      <article class="metric">
        <CheckCircle2 :size="22" />
        <strong>{{ completedPercent }}%</strong>
        <span>concluidas</span>
      </article>
    </div>

    <section class="focus-banner">
      <div>
        <span>Proximo ciclo</span>
        <h2>{{ nextTasks[0]?.title ?? 'Nenhuma tarefa pendente' }}</h2>
        <p>{{ nextTasks[0] ? dueLabel(nextTasks[0].dueDate) : 'Cadastre uma atividade para comecar.' }}</p>
      </div>
      <button class="round-action" @click="$emit('navigate', 'pomodoro')">
        <TimerReset :size="22" />
      </button>
    </section>

    <section class="section-block">
      <div class="section-title">
        <h2>Prioridades</h2>
        <button @click="$emit('navigate', 'tarefas')">Ver todas</button>
      </div>
      <article v-for="task in nextTasks" :key="task.id" class="item-row">
        <span class="subject-dot" :style="{ backgroundColor: subjectColor(task.subjectId) }"></span>
        <div>
          <strong>{{ task.title }}</strong>
          <small>{{ subjectName(task.subjectId) }} · {{ dueLabel(task.dueDate) }}</small>
        </div>
        <span class="priority-chip" :class="task.priority">{{ task.priority }}</span>
      </article>
    </section>
  </section>
</template>
