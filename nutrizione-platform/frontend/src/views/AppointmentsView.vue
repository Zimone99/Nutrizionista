
<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../services/api'

const appointments = ref([])
const patients = ref([])
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const currentDate = ref(new Date())
const showModal = ref(false)
const editingId = ref(null)

const form = ref({
    patientId: '',
    date: '',
    time: '09:00',
    notes: ''
})

const hours = Array.from({ length: 13 }, (_, i) => i + 8)

const weekDays = computed(() => {
    const date = new Date(currentDate.value)
    const day = (date.getDay() + 6) % 7
    date.setDate(date.getDate() - day)

    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(date)
        d.setDate(date.getDate() + i)
        return d
    })
})

const weekLabel = computed(() => {
    const first = weekDays.value[0]
    const last = weekDays.value[6]

    return `${first.toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'long'
    })} – ${last.toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    })}`
})

function dateKey(date) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}

function isToday(date) {
    return dateKey(date) === dateKey(new Date())
}

function appointmentsFor(date, hour) {
    return appointments.value.filter(item => {
        const d = new Date(item.scheduledAt)

        return dateKey(d) === dateKey(date) &&
            d.getHours() === hour
    })
}

function patientName(item) {
    return `${item.firstName || ''} ${item.lastName || ''}`.trim() ||
        patients.value.find(p => p.id === item.patientId)?.firstName ||
        'Paziente'
}

async function loadData() {
    loading.value = true
    error.value = ''

    try {
        const [appointmentsResponse, patientsResponse] = await Promise.all([
            api.get('/appointments'),
            api.get('/patients', { params: { limit: 100 } })
        ])

        appointments.value = appointmentsResponse.data.data || []
        patients.value = patientsResponse.data.data || []
    } catch (err) {
        error.value = err.response?.data?.message ||
            'Impossibile caricare gli appuntamenti. Verifica la connessione.'
    } finally {
        loading.value = false
    }
}

function changeWeek(amount) {
    const next = new Date(currentDate.value)
    next.setDate(next.getDate() + amount * 7)
    currentDate.value = next
}

function openNew(date, hour) {
    editingId.value = null
    form.value = {
        patientId: '',
        date: dateKey(date),
        time: `${String(hour).padStart(2, '0')}:00`,
        notes: ''
    }
    showModal.value = true
}

function openEdit(item) {
    editingId.value = item.id

    const date = new Date(item.scheduledAt)

    form.value = {
        patientId: item.patientId,
        date: dateKey(date),
        time: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`,
        notes: item.notes || ''
    }

    showModal.value = true
}

async function saveAppointment() {
    if (!form.value.patientId || !form.value.date || !form.value.time) {
        error.value = 'Seleziona un paziente, una data e un orario.'
        return
    }

    saving.value = true
    error.value = ''

    try {
        const scheduledAt = new Date(
            `${form.value.date}T${form.value.time}:00`
        ).toISOString()

        const payload = {
            patientId: form.value.patientId,
            scheduledAt,
            notes: form.value.notes
        }

        if (editingId.value) {
            await api.put(`/appointments/${editingId.value}`, payload)
        } else {
            await api.post('/appointments', payload)
        }

        showModal.value = false
        await loadData()
    } catch (err) {
        error.value = err.response?.data?.message ||
            'Errore durante il salvataggio.'
    } finally {
        saving.value = false
    }
}

async function updateStatus(item, status) {
    try {
        await api.patch(`/appointments/${item.id}/status`, { status })
        await loadData()
    } catch (err) {
        error.value = err.response?.data?.message ||
            'Errore durante la modifica dello stato.'
    }
}

function statusLabel(status) {
    return {
        scheduled: 'Programmato',
        completed: 'Completato',
        cancelled: 'Annullato'
    }[status] || status
}

onMounted(loadData)
</script>

<template>
    <div class="appointments-page">
        <div class="page-heading">
            <div>
                <span class="eyebrow">ORGANIZZAZIONE</span>
                <h1>Appuntamenti</h1>
                <p>Gestisci gli incontri con i tuoi pazienti.</p>
            </div>

            <button class="primary-button" @click="openNew(new Date(), 9)">
                <i class="pi pi-plus"></i>
                Nuovo appuntamento
            </button>
        </div>

        <div class="calendar-toolbar">
            <div>
                <h2>{{ weekLabel }}</h2>
                <span>Vista settimanale</span>
            </div>

            <div class="calendar-navigation">
                <button @click="changeWeek(-1)" aria-label="Settimana precedente">
                    <i class="pi pi-chevron-left"></i>
                </button>
                <button @click="currentDate = new Date()">Oggi</button>
                <button @click="changeWeek(1)" aria-label="Settimana successiva">
                    <i class="pi pi-chevron-right"></i>
                </button>
            </div>
        </div>

        <div v-if="error" class="error-message">
            {{ error }}
        </div>

        <div v-if="loading" class="loading-message">
            Caricamento calendario...
        </div>

        <div v-else class="calendar-card">
            <div class="calendar-grid">
                <div class="time-header"></div>

                <div
                    v-for="day in weekDays"
                    :key="dateKey(day)"
                    class="day-header"
                    :class="{ today: isToday(day) }"
                >
                    <span>{{ day.toLocaleDateString('it-IT', { weekday: 'short' }) }}</span>
                    <strong>{{ day.getDate() }}</strong>
                </div>

                <template v-for="hour in hours" :key="hour">
                    <div class="time-cell">
                        {{ String(hour).padStart(2, '0') }}:00
                    </div>

                    <div
                        v-for="day in weekDays"
                        :key="`${dateKey(day)}-${hour}`"
                        class="calendar-cell"
                        @click="openNew(day, hour)"
                    >
                        <div
                            v-for="item in appointmentsFor(day, hour)"
                            :key="item.id"
                            class="appointment-event"
                            :class="item.status"
                            @click.stop="openEdit(item)"
                        >
                            <strong>{{ patientName(item) }}</strong>
                            <span>
                                {{ new Date(item.scheduledAt).toLocaleTimeString('it-IT', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                }) }}
                            </span>
                            <small>{{ statusLabel(item.status) }}</small>
                        </div>
                    </div>
                </template>
            </div>
        </div>

        <div class="calendar-legend">
            <span><i class="dot scheduled-dot"></i> Programmato</span>
            <span><i class="dot completed-dot"></i> Completato</span>
            <span><i class="dot cancelled-dot"></i> Annullato</span>
        </div>

        <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
            <div class="appointment-modal">
                <div class="modal-heading">
                    <div>
                        <span class="eyebrow">GESTIONE AGENDA</span>
                        <h2>{{ editingId ? 'Modifica appuntamento' : 'Nuovo appuntamento' }}</h2>
                    </div>
                    <button class="close-button" @click="showModal = false">
                        <i class="pi pi-times"></i>
                    </button>
                </div>

                <form @submit.prevent="saveAppointment">
                    <label>Paziente</label>
                    <select v-model="form.patientId" required>
                        <option value="" disabled>Seleziona un paziente</option>
                        <option
                            v-for="patient in patients"
                            :key="patient.id"
                            :value="patient.id"
                        >
                            {{ patient.firstName }} {{ patient.lastName }}
                        </option>
                    </select>

                    <label>Data</label>
                    <input v-model="form.date" type="date" required>

                    <label>Orario</label>
                    <input v-model="form.time" type="time" required>

                    <label>Note</label>
                    <textarea
                        v-model="form.notes"
                        rows="3"
                        maxlength="5000"
                        placeholder="Aggiungi eventuali note..."
                    ></textarea>

                    <div class="modal-actions">
                        <button type="button" class="secondary-button" @click="showModal = false">
                            Annulla
                        </button>
                        <button type="submit" class="primary-button" :disabled="saving">
                            {{ saving ? 'Salvataggio...' : 'Salva appuntamento' }}
                        </button>
                    </div>
                </form>

                <div v-if="editingId" class="status-actions">
                    <button type="button" @click="updateStatus({ id: editingId }, 'completed')">
                        Segna completato
                    </button>
                    <button type="button" @click="updateStatus({ id: editingId }, 'cancelled')">
                        Annulla appuntamento
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.appointments-page {
    color: #304438;
}

.page-heading, .calendar-toolbar, .modal-heading {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
}

.page-heading {
    margin-bottom: 28px;
}

.eyebrow {
    color: #438b68;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 1.5px;
}

.page-heading h1 {
    margin: 7px 0;
    font-size: 29px;
}

.page-heading p, .calendar-toolbar span {
    color: #87968b;
    margin: 0;
    font-size: 13px;
}

.primary-button, .secondary-button {
    border: 0;
    border-radius: 9px;
    padding: 12px 17px;
    cursor: pointer;
    font-weight: 600;
}

.primary-button {
    background: #438b68;
    color: white;
}

.primary-button:disabled {
    opacity: .6;
    cursor: wait;
}

.secondary-button {
    background: #edf5ef;
    color: #28583f;
}

.calendar-toolbar {
    background: white;
    border: 1px solid #e5ede7;
    border-radius: 13px 13px 0 0;
    padding: 18px 22px;
}

.calendar-toolbar h2 {
    margin: 0 0 5px;
    font-size: 17px;
    text-transform: capitalize;
}

.calendar-navigation {
    display: flex;
    gap: 7px;
}

.calendar-navigation button {
    background: white;
    border: 1px solid #e5ede7;
    border-radius: 7px;
    padding: 9px 12px;
    cursor: pointer;
    color: #28583f;
}

.calendar-card {
    overflow-x: auto;
    background: white;
    border: 1px solid #e5ede7;
    border-top: 0;
    border-radius: 0 0 13px 13px;
}

.calendar-grid {
    min-width: 750px;
    display: grid;
    grid-template-columns: 65px repeat(7, minmax(90px, 1fr));
}

.time-header, .day-header {
    min-height: 66px;
    border-bottom: 1px solid #e5ede7;
}

.day-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5px;
    border-left: 1px solid #edf1ed;
    text-transform: capitalize;
}

.day-header span {
    color: #87968b;
    font-size: 12px;
}

.day-header strong {
    font-size: 18px;
}

.day-header.today strong {
    background: #438b68;
    color: white;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: grid;
    place-items: center;
}

.time-cell {
    height: 76px;
    box-sizing: border-box;
    padding: 10px 8px;
    color: #94a297;
    font-size: 11px;
    border-bottom: 1px solid #edf1ed;
}

.calendar-cell {
    height: 76px;
    box-sizing: border-box;
    padding: 4px;
    border-left: 1px solid #edf1ed;
    border-bottom: 1px solid #edf1ed;
    cursor: pointer;
}

.calendar-cell:hover {
    background: #f7faf8;
}

.appointment-event {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 6px;
    border-radius: 6px;
    background: #edf5ef;
    border-left: 3px solid #438b68;
    cursor: pointer;
    font-size: 10px;
    overflow: hidden;
}

.appointment-event strong, .appointment-event span, .appointment-event small {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.appointment-event.completed {
    background: #edf2fa;
    border-color: #6c8fc2;
}

.appointment-event.cancelled {
    background: #faeeee;
    border-color: #c77979;
    opacity: .75;
}

.calendar-legend {
    display: flex;
    gap: 22px;
    padding: 18px 4px;
    color: #87968b;
    font-size: 12px;
}

.calendar-legend span {
    display: flex;
    align-items: center;
    gap: 7px;
}

.dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
}

.scheduled-dot { background: #438b68; }
.completed-dot { background: #6c8fc2; }
.cancelled-dot { background: #c77979; }

.error-message {
    padding: 12px;
    margin-bottom: 15px;
    color: #a33;
    background: #fff0f0;
    border-radius: 8px;
}

.loading-message {
    padding: 40px;
    text-align: center;
    color: #87968b;
}

.modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 2000;
    background: rgba(20, 35, 25, .45);
    display: grid;
    place-items: center;
    padding: 15px;
}

.appointment-modal {
    background: white;
    width: min(100%, 470px);
    border-radius: 16px;
    padding: 25px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 15px 50px #0002;
}

.modal-heading {
    margin-bottom: 25px;
}

.modal-heading h2 {
    font-size: 20px;
    margin: 6px 0 0;
}

.close-button {
    border: 0;
    background: transparent;
    color: #87968b;
    cursor: pointer;
    font-size: 17px;
}

.appointment-modal form {
    display: flex;
    flex-direction: column;
    gap: 9px;
}

.appointment-modal label {
    font-size: 12px;
    font-weight: 700;
    margin-top: 8px;
}

.appointment-modal input, .appointment-modal select, .appointment-modal textarea {
    width: 100%;
    box-sizing: border-box;
    padding: 11px;
    border: 1px solid #e5ede7;
    border-radius: 8px;
    font: inherit;
    color: #304438;
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 15px;
}

.status-actions {
    display: flex;
    gap: 10px;
    border-top: 1px solid #e5ede7;
    margin-top: 20px;
    padding-top: 15px;
}

.status-actions button {
    border: 0;
    background: #edf5ef;
    color: #28583f;
    padding: 9px;
    border-radius: 7px;
    cursor: pointer;
    font-size: 11px;
}

@media (max-width: 650px) {
    .page-heading {
        align-items: flex-start;
        flex-direction: column;
    }

    .calendar-toolbar {
        align-items: flex-start;
        flex-direction: column;
    }

    .calendar-legend {
        flex-wrap: wrap;
    }

    .modal-actions, .status-actions {
        flex-wrap: wrap;
    }
}
</style>
