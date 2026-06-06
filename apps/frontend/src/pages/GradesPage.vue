<script setup lang="ts">
import { ChevronDown, GraduationCap, Pencil, Save, Trash2, X } from '@lucide/vue'
import type { Grade, GradeForm, GradeGroup, Subject } from '../types'

defineProps<{
  gradeForm: GradeForm
  gradeEditForm: GradeForm
  gradeGroups: GradeGroup[]
  subjects: Subject[]
  editingGradeId: string
  isSubjectExpanded: (subjectId: string) => boolean
}>()

defineEmits<{
  create: []
  toggle: [subjectId: string]
  edit: [grade: Grade]
  cancelEdit: []
  saveEdit: [gradeId: string]
  delete: [gradeId: string]
}>()
</script>

<template>
  <section class="screen">
    <form class="composer" @submit.prevent="$emit('create')">
      <h2>Notas e medias</h2>
      <select v-model="gradeForm.subjectId" required>
        <option v-for="subject in subjects" :key="subject.id" :value="subject.id">{{ subject.name }}</option>
      </select>
      <input v-model="gradeForm.title" placeholder="Avaliacao" required />
      <div class="form-grid">
        <label>
          Nota
          <input v-model.number="gradeForm.score" max="10" min="0" placeholder="Ex.: 8.5" step="0.1" type="number" />
        </label>
        <label>
          Peso
          <input v-model.number="gradeForm.weight" max="10" min="0.1" placeholder="Ex.: 2" step="0.1" type="number" />
        </label>
      </div>
      <input v-model="gradeForm.date" type="date" />
      <button class="primary-action"><GraduationCap :size="18" /> Registrar nota</button>
    </form>

    <article v-for="group in gradeGroups" :key="group.subjectId" class="grade-collapse">
      <button class="grade-summary" type="button" @click="$emit('toggle', group.subjectId)">
        <span class="subject-dot" :style="{ backgroundColor: group.color }"></span>
        <span>
          <strong>{{ group.subjectName }}</strong>
          <small>{{ group.assessments }} avaliacao(oes)</small>
        </span>
        <b>{{ group.average.toFixed(1) }}</b>
        <ChevronDown :class="{ open: isSubjectExpanded(group.subjectId) }" :size="20" />
      </button>

      <div v-if="isSubjectExpanded(group.subjectId)" class="grade-detail-list">
        <p v-if="!group.grades.length" class="empty-state">Nenhuma nota cadastrada para esta disciplina.</p>

        <div v-for="grade in group.grades" :key="grade.id" class="grade-detail">
          <form v-if="editingGradeId === grade.id" class="grade-edit-form" @submit.prevent="$emit('saveEdit', grade.id)">
            <select v-model="gradeEditForm.subjectId" required>
              <option v-for="subject in subjects" :key="subject.id" :value="subject.id">{{ subject.name }}</option>
            </select>
            <input v-model="gradeEditForm.title" placeholder="Avaliacao" required />
            <div class="form-grid">
              <label>
                Nota
                <input
                  v-model.number="gradeEditForm.score"
                  max="10"
                  min="0"
                  placeholder="Ex.: 8.5"
                  step="0.1"
                  type="number"
                />
              </label>
              <label>
                Peso
                <input
                  v-model.number="gradeEditForm.weight"
                  max="10"
                  min="0.1"
                  placeholder="Ex.: 2"
                  step="0.1"
                  type="number"
                />
              </label>
            </div>
            <input v-model="gradeEditForm.date" type="date" />
            <div class="grade-actions">
              <button class="mini-action save" type="submit" title="Salvar nota">
                <Save :size="17" />
              </button>
              <button class="mini-action" type="button" title="Cancelar edicao" @click="$emit('cancelEdit')">
                <X :size="17" />
              </button>
            </div>
          </form>

          <template v-else>
            <div>
              <strong>{{ grade.title }}</strong>
              <small>{{ new Date(grade.date).toLocaleDateString('pt-BR') }} · peso {{ grade.weight }}</small>
            </div>
            <b>{{ grade.score.toFixed(1) }}</b>
            <div class="grade-actions">
              <button class="mini-action" type="button" title="Editar nota" @click="$emit('edit', grade)">
                <Pencil :size="17" />
              </button>
              <button class="mini-action danger" type="button" title="Excluir nota" @click="$emit('delete', grade.id)">
                <Trash2 :size="17" />
              </button>
            </div>
          </template>
        </div>
      </div>
    </article>
  </section>
</template>
