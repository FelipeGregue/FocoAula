<script setup lang="ts">
import { CalendarDays } from '@lucide/vue'
import type { AcademicEvent, EventForm, Subject } from '../types'

defineProps<{
  eventForm: EventForm
  nextEvents: AcademicEvent[]
  subjects: Subject[]
  subjectName: (subjectId?: string) => string
  formatDate: (value: string) => string
}>()

defineEmits<{
  create: []
}>()
</script>

<template>
  <section class="screen">
    <form class="composer" @submit.prevent="$emit('create')">
      <h2>Calendario academico</h2>
      <input v-model="eventForm.title" placeholder="Prova, aula ou compromisso" required />
      <div class="form-grid">
        <select v-model="eventForm.type">
          <option value="prova">Prova</option>
          <option value="aula">Aula</option>
          <option value="reuniao">Reuniao</option>
          <option value="compromisso">Compromisso</option>
        </select>
        <select v-model="eventForm.subjectId">
          <option value="">Sem disciplina</option>
          <option v-for="subject in subjects" :key="subject.id" :value="subject.id">{{ subject.name }}</option>
        </select>
      </div>
      <input v-model="eventForm.startsAt" type="datetime-local" required />
      <input v-model="eventForm.location" placeholder="Local" />
      <textarea v-model="eventForm.notes" placeholder="Conteudo, materiais ou observacoes"></textarea>
      <button class="primary-action"><CalendarDays :size="18" /> Salvar data</button>
    </form>

    <article v-for="event in nextEvents" :key="event.id" class="event-card">
      <div class="date-badge">
        <strong>{{ new Date(event.startsAt).getDate().toString().padStart(2, '0') }}</strong>
        <span>{{ new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(new Date(event.startsAt)) }}</span>
      </div>
      <div>
        <strong>{{ event.title }}</strong>
        <p>{{ subjectName(event.subjectId) }} · {{ event.location || event.type }}</p>
        <small>{{ formatDate(event.startsAt) }}</small>
      </div>
    </article>
  </section>
</template>
