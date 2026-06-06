import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import AppShell from '../layouts/AppShell.vue'
import type { Tab } from '../types'

export const defaultRoute: Tab = 'painel'

export const routes: RouteRecordRaw[] = [
  { path: '/', redirect: `/${defaultRoute}` },
  { path: '/painel', name: 'painel', component: AppShell },
  { path: '/tarefas', name: 'tarefas', component: AppShell },
  { path: '/calendario', name: 'calendario', component: AppShell },
  { path: '/pomodoro', name: 'pomodoro', component: AppShell },
  { path: '/notas', name: 'notas', component: AppShell },
  { path: '/ajustes', name: 'ajustes', component: AppShell },
  { path: '/:pathMatch(.*)*', redirect: `/${defaultRoute}` },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
})
