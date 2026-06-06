<script setup lang="ts">
import { TimerReset } from '@lucide/vue'
import type { PomodoroMode } from '../types'

defineProps<{
  pomodoroMode: PomodoroMode
  pomodoroLabel: string
  focusMinutes: number
  breakMinutes: number
}>()

defineEmits<{
  start: []
  pause: []
  reset: []
  'update:focusMinutes': [value: number]
  'update:breakMinutes': [value: number]
}>()
</script>

<template>
  <section class="screen pomodoro-screen">
    <div class="timer-face">
      <span>{{ pomodoroMode === 'foco' ? 'Foco ativo' : 'Pausa curta' }}</span>
      <strong>{{ pomodoroLabel }}</strong>
    </div>
    <div class="timer-controls">
      <button class="primary-action" @click="$emit('start')">Iniciar</button>
      <button class="ghost-action" @click="$emit('pause')">Pausar</button>
      <button class="icon-button" title="Reiniciar" @click="$emit('reset')">
        <TimerReset :size="20" />
      </button>
    </div>
    <div class="slider-row">
      <label>
        Foco {{ focusMinutes }} min
        <input
          :value="focusMinutes"
          min="1"
          max="60"
          type="range"
          @input="$emit('update:focusMinutes', Number(($event.target as HTMLInputElement).value))"
          @change="$emit('reset')"
        />
      </label>
      <label>
        Pausa {{ breakMinutes }} min
        <input
          :value="breakMinutes"
          min="3"
          max="20"
          type="range"
          @input="$emit('update:breakMinutes', Number(($event.target as HTMLInputElement).value))"
          @change="$emit('reset')"
        />
      </label>
    </div>
  </section>
</template>
