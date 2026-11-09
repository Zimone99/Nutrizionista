
<script setup>
import { ref, onMounted } from 'vue'
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import Chart from 'primevue/chart'

const stats = ref([
    { label: 'Pazienti totali', value: '0', icon: 'pi-users', color: 'green', detail: 'Archivio pazienti' },
    { label: 'Pazienti attivi', value: '0', icon: 'pi-user-check', color: 'blue', detail: 'In trattamento' },
    { label: 'Appuntamenti oggi', value: '0', icon: 'pi-calendar', color: 'orange', detail: 'Agenda giornaliera' },
    { label: 'Nuovi pazienti', value: '0', icon: 'pi-user-plus', color: 'purple', detail: 'Questo mese' }
])

const chartData = ref({
    labels: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'],
    datasets: [{
        label: 'Nuovi pazienti',
        data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        borderColor: '#438b68',
        backgroundColor: 'rgba(67,139,104,0.12)',
        fill: true,
        tension: 0.4
    }]
})

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false }
    },
    scales: {
        y: {
            beginAtZero: true,
            ticks: { precision: 0 }
        }
    }
}

const recentPatients = ref([])

const today = new Date().toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
})
</script>

<template>
    <div class="dashboard">

        <div class="dashboard-heading">
            <div>
                <h1>Buongiorno, Dottoressa 🌿</h1>
                <p>Benvenuta nel tuo spazio di gestione nutrizionale.</p>
            </div>

            <Tag severity="success" value="Master Account" />
        </div>

        <div class="dashboard-date">
            <i class="pi pi-calendar"></i>
            {{ today }}
        </div>

        <div class="grid mt-3">

            <div
                v-for="stat in stats"
                :key="stat.label"
                class="col-12 md:col-6 xl:col-3"
            >
                <Card class="stat-card">
                    <template #content>
                        <div class="flex justify-content-between align-items-center">

                            <div>
                                <span class="stat-label">{{ stat.label }}</span>
                                <div class="stat-value">{{ stat.value }}</div>
                                <small>{{ stat.detail }}</small>
                            </div>

                            <div class="stat-icon" :class="stat.color">
                                <i :class="`pi ${stat.icon}`"></i>
                            </div>

                        </div>
                    </template>
                </Card>
            </div>

        </div>

        <div class="grid mt-2">

            <div class="col-12 xl:col-8">
                <Card>
                    <template #title>
                        Andamento pazienti
                    </template>

                    <template #subtitle>
                        Nuovi pazienti durante l'anno
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
                <Card class="welcome-card">
                    <template #content>
                        <div class="welcome-icon">
                            <i class="pi pi-leaf"></i>
                        </div>

                        <h2>Il tuo studio, in equilibrio.</h2>

                        <p>
                            Gestisci i tuoi pazienti, organizza le visite
                            e monitora i percorsi nutrizionali da un unico
                            spazio.
                        </p>

                        <Button
                            label="Gestisci pazienti"
                            icon="pi pi-arrow-right"
                            iconPos="right"
                            @click="$router.push('/admin/pazienti')"
                        />
                    </template>
                </Card>
            </div>

        </div>

        <div class="grid mt-2">
            <div class="col-12">
                <Card>
                    <template #title>
                        Ultimi pazienti inseriti
                    </template>

                    <template #content>
                        <div v-if="recentPatients.length === 0"
                             class="empty-state">
                            <i class="pi pi-users"></i>
                            <p>Non ci sono ancora pazienti da mostrare.</p>
                            <Button
                                label="Inserisci primo paziente"
                                icon="pi pi-plus"
                                @click="$router.push('/admin/pazienti')"
                            />
                        </div>
                    </template>
                </Card>
            </div>
        </div>

    </div>
</template>

<style scoped>
.dashboard-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 15px;
}

.dashboard-heading h1 {
    font-size: 25px;
    color: #28583f;
    margin: 0 0 8px;
}

.dashboard-heading p {
    color: #89998e;
    margin: 0;
}

.dashboard-date {
    margin-top: 20px;
    color: #829287;
    font-size: 13px;
}

.stat-card {
    border: 1px solid #e5ede7;
    box-shadow: 0 3px 12px #28583f08;
}

.stat-label {
    font-size: 13px;
    color: #829287;
}

.stat-value {
    font-size: 30px;
    font-weight: 700;
    color: #28583f;
    margin: 10px 0 5px;
}

.stat-card small {
    color: #a0aea4;
}

.stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 13px;
    display: grid;
    place-items: center;
    font-size: 21px;
}

.green { background: #edf5ef; color: #438b68; }
.blue { background: #edf4fa; color: #528bb7; }
.orange { background: #fff4e9; color: #d99546; }
.purple { background: #f4effb; color: #9474bb; }

.welcome-card {
    background: #f0f7f1;
    border: 1px solid #e1ede3;
    height: 100%;
}

.welcome-icon {
    color: #438b68;
    font-size: 30px;
}

.welcome-card h2 {
    color: #28583f;
    font-size: 21px;
}

.welcome-card p {
    color: #738478;
    line-height: 1.7;
    margin-bottom: 25px;
}

.empty-state {
    text-align: center;
    padding: 25px;
    color: #829287;
}

.empty-state i {
    font-size: 35px;
    color: #438b68;
}

.empty-state p {
    margin: 15px 0;
}
</style>
