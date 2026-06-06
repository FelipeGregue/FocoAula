<script setup lang="ts">
import { Bell, BookOpen } from '@lucide/vue'
import type { ReminderSettings, SubjectForm } from '../types'

defineProps<{
  subjectForm: SubjectForm
  reminders: ReminderSettings
}>()

defineEmits<{
  createSubject: []
  saveReminders: []
}>()
</script>

<template>
  <section class="screen">
    <form class="composer" @submit.prevent="$emit('createSubject')">
      <h2>Disciplina</h2>
      <input v-model="subjectForm.name" placeholder="Nome da disciplina" required />
      <input v-model="subjectForm.teacher" placeholder="Professor(a)" />
      <input v-model="subjectForm.color" type="color" />
      <button class="primary-action"><BookOpen :size="18" /> Criar disciplina</button>
    </form>

    <form class="composer" @submit.prevent="$emit('saveReminders')">
      <h2>Lembretes</h2>
      <label class="toggle-line">
        <input v-model="reminders.enabled" type="checkbox" />
        Notificacoes ativas
      </label>
      <label>
        Avisar antes
        <input v-model.number="reminders.defaultMinutesBefore" type="number" min="0" max="10080" />
      </label>
      <div class="form-grid">
        <label>
          Inicio silencio
          <input v-model="reminders.quietHoursStart" type="time" />
        </label>
        <label>
          Fim silencio
          <input v-model="reminders.quietHoursEnd" type="time" />
        </label>
      </div>
      <button class="primary-action"><Bell :size="18" /> Salvar lembretes</button>
    </form>
  </section>
</template>
