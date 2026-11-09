
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Master from '../Master.js'

const router = useRouter()
const menu = Master
const mobileMenu = ref(false)

function navigate(path) {
    router.push(path)
    mobileMenu.value = false
}

function logout() {
    router.push('/login')
}
</script>

<template>
    <div class="admin-layout">

        <div
            v-if="mobileMenu"
            class="sidebar-overlay"
            @click="mobileMenu = false"
        />

        <aside
            class="admin-sidebar"
            :class="{ 'sidebar-open': mobileMenu }"
        >
            <div class="brand">
                <div class="brand-icon">
                    <i class="pi pi-leaf"></i>
                </div>

                <div>
                    <h2>NutriStudio</h2>
                    <span>GESTIONALE</span>
                </div>
            </div>

            <div
                v-for="group in menu"
                :key="group.label"
                class="menu-group"
            >
                <small>{{ group.label }}</small>

                <button
                    v-for="item in group.items"
                    :key="item.label"
                    class="menu-item"
                    :class="{
                        active: $route.path === item.to
                    }"
                    @click="navigate(item.to)"
                >
                    <i :class="item.icon"></i>
                    <span>{{ item.label }}</span>
                </button>
            </div>

            <div class="sidebar-bottom">
                <div class="doctor-profile">
                    <div class="doctor-avatar">D</div>
                    <div>
                        <strong>Dietologa</strong>
                        <span>Master account</span>
                    </div>
                </div>
            </div>
        </aside>

        <main class="admin-main">

            <header class="admin-topbar">
                <button
                    class="mobile-toggle"
                    @click="mobileMenu = !mobileMenu"
                    aria-label="Apri menu"
                >
                    <i class="pi pi-bars"></i>
                </button>

                <div class="breadcrumb">
                    Area amministrativa
                </div>

                <button
                    class="logout-button"
                    @click="logout"
                >
                    <i class="pi pi-sign-out"></i>
                    Esci
                </button>
            </header>

            <section class="page-content">
                <RouterView />
            </section>

        </main>
    </div>
</template>
