
<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'

import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Chart from 'primevue/chart'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'

import StatCard from '@/components/StatCard.vue'

const loading = ref(true)
const error = ref(null)

const stats = ref({
    totalPatients: 0,
    activePatients: 0,
    monthlyVisits: 0,
    newPatients: 0
})

const patients = ref([])
const appointments = ref([])

const chartData = ref({
    labels: [],
    datasets: [{
        label: 'Nuovi pazienti',
        data: [],
        borderColor: '#39845b',
        backgroundColor: 'rgba(57,132,91,0.12)',
        fill: true,
        tension: 0.4
    }]
})

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: false
        }
    },
    scales: {
        y: {
            beginAtZero: true
        }
    }
}

async function loadDashboard() {
    loading.value = true
    error.value = null

    try {
        const { data } = await api.get('/dashboard')

        stats.value = data.stats
        patients.value = data.recentPatients
        appointments.value = data.upcomingAppointments

        chartData.value = {
            labels: data.chart.labels,
            datasets: [{
                label: 'Nuovi pazienti',
                data: data.chart.values,
                borderColor: '#39845b',
                backgroundColor: 'rgba(57,132,91,0.12)',
                fill: true,
                tension: 0.4
            }]
        }
    } catch (err) {
        error.value = 'Impossibile caricare la dashboard.'
    } finally {
        loading.value = false
    }
}

function formatDate(value) {
    return new Date(value).toLocaleDateString('it-IT')
}

onMounted(loadDashboard)
</script>

<template>
    <div class="dashboard">

        <div class="flex justify-content-between align-items-center mb-4">
            <div>
                <h1 class="text-2xl font-bold mb-1">
                    Dashboard
                </h1>
                <span class="text-500">
                    Panoramica della tua attività
                </span>
            </div>

            <Button
                icon="pi pi-refresh"
                label="Aggiorna"
                outlined
                @click="loadDashboard"
            />
        </div>

        <div v-if="loading" class="flex justify-content-center p-6">
            <ProgressSpinner />
        </div>

        <div v-else-if="error">
            <p class="text-red-500">{{ error }}</p>
            <Button label="Riprova" @click="loadDashboard" />
        </div>

        <template v-else>

            <div class="grid">

                <div class="col-12 md:col-6 xl:col-3">
                    <StatCard
                        title="Pazienti totali"
                        :value="stats.totalPatients"
                        icon="pi pi-users"
                        description="Totale anagrafiche"
                        color="green"
                    />
                </div>

                <div class="col-12 md:col-6 xl:col-3">
                    <StatCard
                        title="Pazienti attivi"
                        :value="stats.activePatients"
                        icon="pi pi-user-check"
                        description="Pazienti in trattamento"
                        color="blue"
                    />
                </div>

                <div class="col-12 md:col-6 xl:col-3">
                    <StatCard
                        title="Visite mensili"
                        :value="stats.monthlyVisits"
                        icon="pi pi-calendar"
                        description="Visite registrate"
                        color="orange"
                    />
                </div>

                <div class="col-12 md:col-6 xl:col-3">
                    <StatCard
                        title="Nuovi pazienti"
                        :value="stats.newPatients"
                        icon="pi pi-user-plus"
                        description="Inseriti questo mese"
                        color="purple"
                    />
                </div>

            </div>

            <div class="grid mt-2">

                <div class="col-12 xl:col-8">
                    <Card>
                        <template #title>
                            Andamento nuovi pazienti
                        </template>

                        <template #content>
                            <div style="height: 300px">
                                <Chart
                                    type="line"
                                    :data="chartData"
                                    :options="chartOptions"
                                />
                            </div>
                        </template>
                    </Card>
                </div>

                <div class="col-12 xl:col-4">
                    <Card>
                        <template #title>
                            Prossimi appuntamenti
                        </template>

                        <template #content>
                            <div
                                v-for="appointment in appointments"
                                :key="appointment.id"
                                class="appointment-item mb-3"
                            >
                                <div class="font-semibold">
                                    {{ appointment.patientName }}
                                </div>

                                <div class="text-500 text-sm">
                                    {{ formatDate(appointment.date) }}
                                    · {{ appointment.time }}
                                </div>
                            </div>

                            <p v-if="!appointments.length"
                               class="text-500">
                                Nessun appuntamento imminente.
                            </p>
                        </template>
                    </Card>
                </div>

                <div class="col-12">
                    <Card>
                        <template #title>
                            Ultimi pazienti inseriti
                        </template>

                        <template #content>
                            <DataTable
                                :value="patients"
                                stripedRows
                                responsiveLayout="scroll"
                            >
                                <Column
                                    field="firstName"
                                    header="Nome"
                                />

                                <Column
                                    field="lastName"
                                    header="Cognome"
                                />

                                <Column
                                    field="email"
                                    header="Email"
                                />

                                <Column
                                    field="createdAt"
                                    header="Inserimento"
                                >
                                    <template #body="{ data }">
                                        {{ formatDate(data.createdAt) }}
                                    </template>
                                </Column>

                                <Column header="Stato">
                                    <template #body="{ data }">
                                        <Tag
                                            :value="data.status"
                                            :severity="
                                                data.status === 'Attivo'
                                                ? 'success'
                                                : 'secondary'
                                            "
                                        />
                                    </template>
                                </Column>
                            </DataTable>
                        </template>
                    </Card>
                </div>

            </div>

        </template>
    </div>
</template>
