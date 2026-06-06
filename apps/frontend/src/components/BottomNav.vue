<script setup lang="ts">
import type { NavTab, Tab } from '../types'

defineProps<{
  tabs: NavTab[]
  activeTab: Tab
}>()

</script>

<template>
  <nav class="bottom-nav" aria-label="Navegacao principal">
    <RouterLink
      v-for="tab in tabs"
      :key="tab.id"
      v-slot="{ navigate, isActive }"
      :to="{ name: tab.id }"
      custom
    >
      <button :class="{ active: isActive || activeTab === tab.id }" :title="tab.label" @click="navigate">
        <component :is="tab.icon" :size="20" />
        <span>{{ tab.label }}</span>
      </button>
    </RouterLink>
  </nav>
</template>
