<script setup lang="ts">
import { LogOut } from '@lucide/vue'
import type { ApiStatus, User } from '../types'

defineProps<{
  user: User
  apiStatus: ApiStatus
}>()

defineEmits<{
  logout: []
}>()
</script>

<template>
  <header class="app-header">
    <div>
      <span class="eyebrow">FocoAula</span>
      <h1>Oi, {{ user.name.split(' ')[0] }}</h1>
    </div>
    <button class="icon-button" title="Sair" @click="$emit('logout')">
      <LogOut :size="20" />
    </button>
  </header>
</template>
