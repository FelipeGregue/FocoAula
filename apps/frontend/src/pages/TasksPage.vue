<script setup lang="ts">
import { CheckCircle2, Plus } from '@lucide/vue'
import type { AcademicTask, Subject, TaskForm } from '../types'

defineProps<{
  taskForm: TaskForm
  tasks: AcademicTask[]
  subjects: Subject[]
  subjectName: (subjectId?: string) => string
  formatDate: (value: string) => string
}>()

defineEmits<{
  create: []
  cycle: [task: AcademicTask]
}>()
</script>

<template>
  <section class="screen">
    <form class="composer" @submit.prevent="$emit('create')">
      <h2>Nova atividade</h2>
      <input v-model="taskForm.title" placeholder="Titulo da tarefa" required />
      <textarea v-model="taskForm.description" placeholder="Descricao curta"></textarea>
      <div class="form-grid">
        <select v-model="taskForm.subjectId">
          <option value="">Sem disciplina</option>
          <option v-for="subject in subjects" :key="subject.id" :value="subject.id">{{ subject.name }}</option>
        </select>
        <select v-model="taskForm.priority">
          <option value="baixa">Baixa</option>
          <option value="media">Media</option>
          <option value="alta">Alta</option>
          <option value="urgente">Urgente</option>
        </select>
      </div>
      <div class="form-grid">
        <input v-model="taskForm.dueDate" type="datetime-local" required />
        <select v-model="taskForm.recurrence">
          <option value="nenhuma">Sem repeticao</option>
          <option value="diaria">Diaria</option>
          <option value="semanal">Semanal</option>
          <option value="mensal">Mensal</option>
        </select>
      </div>
      <button class="primary-action"><Plus :size="18" /> Adicionar</button>
    </form>

    <article v-for="task in tasks" :key="task.id" class="task-card">
      <button class="status-button" :class="task.status" @click="$emit('cycle', task)">
        <CheckCircle2 :size="22" />
      </button>
      <div>
        <strong>{{ task.title }}</strong>
        <p>{{ task.description || subjectName(task.subjectId) }}</p>
        <small>{{ formatDate(task.dueDate) }} · {{ task.recurrence }}</small>
      </div>
      <span class="priority-chip" :class="task.priority">{{ task.priority }}</span>
    </article>
  </section>
</template>
