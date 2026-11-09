
import { createRouter, createWebHistory } from 'vue-router'
import api from '../services/api'

const routes = [
    {
        path: '/login',
        name: 'login',
        component: () => import('../views/LoginView.vue')
    },
    {
        path: '/admin',
        component: () => import('../layout/AppLayout.vue'),
        meta: { requiresAuth: true },
        children: [
            {
                path: '',
                name: 'dashboard',
                component: () => import('../views/DashboardView.vue')
            },
            {
                path: 'pazienti',
                name: 'patients',
                component: () => import('../views/PatientsView.vue')
            },
            {
                path: 'appuntamenti',
                name: 'appointments',
                component: () => import('../views/AppointmentsView.vue')
            },
            {
                path: 'cartelle',
                name: 'records',
                component: () => import('../views/RecordsView.vue')
            },
            {
                path: 'report',
                name: 'reports',
                component: () => import('../views/ReportsView.vue')
            }
        ]
    },
    {
        path: '/',
        redirect: '/admin'
    },
    {
        path: '/:pathMatch(.*)*',
        redirect: '/admin'
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach(async (to) => {
    if (to.meta.requiresAuth) {
        try {
            await api.get('/auth/me')
            return true
        } catch {
            return {
                name: 'login',
                query: { redirect: to.fullPath }
            }
        }
    }

    if (to.name === 'login') {
        try {
            await api.get('/auth/me')
            return { name: 'dashboard' }
        } catch {
            return true
        }
    }

    return true
})

export default router
