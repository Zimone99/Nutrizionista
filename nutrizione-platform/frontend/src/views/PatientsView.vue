
<script setup>
import { ref, onMounted, watch } from 'vue'
import api from '../services/api'

const patients = ref([])
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const search = ref('')
const statusFilter = ref('')
const page = ref(1)
const totalPages = ref(1)
const total = ref(0)

const showModal = ref(false)
const editingId = ref(null)

const emptyForm = () => ({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: '',
    gender: '',
    status: 'active'
})

const form = ref(emptyForm())

let searchTimer

async function loadPatients() {
    loading.value = true
    error.value = ''

    try {
        const response = await api.get('/patients', {
            params: {
                page: page.value,
                limit: 10,
                search: search.value,
                status: statusFilter.value || undefined
            }
        })

        patients.value = response.data.data || []
        total.value = response.data.pagination?.total || 0
        totalPages.value = Math.max(1, response.data.pagination?.totalPages || 1)
    } catch (err) {
        error.value = err.response?.data?.message ||
            'Impossibile caricare i pazienti.'
    } finally {
        loading.value = false
    }
}

function searchPatients() {
    page.value = 1
    clearTimeout(searchTimer)
    searchTimer = setTimeout(loadPatients, 350)
}

watch(statusFilter, () => {
    page.value = 1
    loadPatients()
})

function changePage(value) {
    page.value = value
    loadPatients()
}

function openNew() {
    editingId.value = null
    form.value = emptyForm()
    showModal.value = true
    error.value = ''
}

function openEdit(patient) {
    editingId.value = patient.id

    form.value = {
        firstName: patient.firstName || '',
        lastName: patient.lastName || '',
        email: patient.email || '',
        phone: patient.phone || '',
        birthDate: patient.birthDate
            ? String(patient.birthDate).slice(0, 10)
            : '',
        gender: patient.gender || '',
        status: patient.status || 'active'
    }

    showModal.value = true
    error.value = ''
}

async function savePatient() {
    if (!form.value.firstName.trim() || !form.value.lastName.trim()) {
        error.value = 'Nome e cognome sono obbligatori.'
        return
    }

    saving.value = true
    error.value = ''

    try {
        const payload = {
            ...form.value,
            firstName: form.value.firstName.trim(),
            lastName: form.value.lastName.trim(),
            email: form.value.email.trim() || null,
            phone: form.value.phone.trim() || null,
            birthDate: form.value.birthDate || null,
            gender: form.value.gender || null
        }

        if (editingId.value) {
            await api.put(`/patients/${editingId.value}`, payload)
        } else {
            await api.post('/patients', payload)
        }

        showModal.value = false
        await loadPatients()
    } catch (err) {
        error.value = err.response?.data?.message ||
            'Errore durante il salvataggio.'
    } finally {
        saving.value = false
    }
}

async function archivePatient(patient) {
    const confirmed = window.confirm(
        `Vuoi archiviare ${patient.firstName} ${patient.lastName}?`
    )

    if (!confirmed) return

    try {
        await api.delete(`/patients/${patient.id}`)
        await loadPatients()
    } catch (err) {
        error.value = err.response?.data?.message ||
            'Errore durante l’archiviazione.'
    }
}

function formatDate(value) {
    if (!value) return '—'

    return new Date(`${String(value).slice(0, 10)}T12:00:00`)
        .toLocaleDateString('it-IT')
}

function genderLabel(value) {
    return {
        male: 'Uomo',
        female: 'Donna',
        other: 'Altro'
    }[value] || '—'
}

onMounted(loadPatients)
</script>

<template>
    <div class="patients-page">
        <div class="page-heading">
            <div>
                <span class="eyebrow">GESTIONE ANAGRAFICA</span>
                <h1>Pazienti</h1>
                <p>Gestisci le anagrafiche e i dati dei tuoi pazienti.</p>
            </div>

            <button class="primary-button" @click="openNew">
                <i class="pi pi-plus"></i>
                Nuovo paziente
            </button>
        </div>

        <div class="stats-card">
            <div class="stats-icon">
                <i class="pi pi-users"></i>
            </div>
            <div>
                <span>Pazienti registrati</span>
                <strong>{{ total }}</strong>
            </div>
        </div>

        <div class="patients-card">
            <div class="filters">
                <div class="search-box">
                    <i class="pi pi-search"></i>
                    <input
                        v-model="search"
                        @input="searchPatients"
                        placeholder="Cerca per nome, cognome o email..."
                    >
                </div>

                <select v-model="statusFilter">
                    <option value="">Tutti gli stati</option>
                    <option value="active">Attivi</option>
                    <option value="inactive">Inattivi</option>
                </select>
            </div>

            <div v-if="error" class="error-message">
                {{ error }}
            </div>

            <div v-if="loading" class="loading-message">
                Caricamento pazienti...
            </div>

            <div v-else-if="!patients.length" class="empty-state">
                <i class="pi pi-users"></i>
                <h3>Nessun paziente trovato</h3>
                <p>Prova a modificare la ricerca o inserisci un nuovo paziente.</p>
                <button class="primary-button" @click="openNew">
                    Aggiungi paziente
                </button>
            </div>

            <div v-else class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Paziente</th>
                            <th>Contatti</th>
                            <th>Data di nascita</th>
                            <th>Sesso</th>
                            <th>Stato</th>
                            <th>Azioni</th>
                        </tr>
                    </thead>

                    <tbody>
                        <tr v-for="patient in patients" :key="patient.id">
                            <td>
                                <div class="patient-info">
                                    <div class="patient-avatar">
                                        {{ patient.firstName?.charAt(0) }}{{ patient.lastName?.charAt(0) }}
                                    </div>
                                    <div>
                                        <strong>{{ patient.firstName }} {{ patient.lastName }}</strong>
                                        <small>Registrato il {{ formatDate(patient.createdAt) }}</small>
                                    </div>
                                </div>
                            </td>

                            <td>
                                <div class="contact-info">
                                    <span>{{ patient.email || 'Email non disponibile' }}</span>
                                    <small>{{ patient.phone || 'Telefono non disponibile' }}</small>
                                </div>
                            </td>

                            <td>{{ formatDate(patient.birthDate) }}</td>
                            <td>{{ genderLabel(patient.gender) }}</td>

                            <td>
                                <span class="status-badge" :class="patient.status">
                                    {{ patient.status === 'active' ? 'Attivo' : 'Inattivo' }}
                                </span>
                            </td>

                            <td>
                                <div class="actions">
                                    <button
                                        title="Modifica"
                                        @click="openEdit(patient)"
                                    >
                                        <i class="pi pi-pencil"></i>
                                    </button>
                                    <button
                                        title="Archivia"
                                        class="archive-button"
                                        @click="archivePatient(patient)"
                                    >
                                        <i class="pi pi-archive"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div v-if="patients.length" class="pagination">
                <span>
                    {{ total }} pazienti · Pagina {{ page }} di {{ totalPages }}
                </span>

                <div>
                    <button
                        :disabled="page <= 1"
                        @click="changePage(page - 1)"
                    >
                        <i class="pi pi-chevron-left"></i>
                    </button>

                    <button
                        :disabled="page >= totalPages"
                        @click="changePage(page + 1)"
                    >
                        <i class="pi pi-chevron-right"></i>
                    </button>
                </div>
            </div>
        </div>

        <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
            <div class="patient-modal">
                <div class="modal-heading">
                    <div>
                        <span class="eyebrow">ANAGRAFICA</span>
                        <h2>{{ editingId ? 'Modifica paziente' : 'Nuovo paziente' }}</h2>
                    </div>

                    <button class="close-button" @click="showModal = false">
                        <i class="pi pi-times"></i>
                    </button>
                </div>

                <form @submit.prevent="savePatient">
                    <div class="form-grid">
                        <div>
                            <label>Nome *</label>
                            <input v-model="form.firstName" required maxlength="100">
                        </div>

                        <div>
                            <label>Cognome *</label>
                            <input v-model="form.lastName" required maxlength="100">
                        </div>

                        <div>
                            <label>Email</label>
                            <input v-model="form.email" type="email" maxlength="255">
                        </div>

                        <div>
                            <label>Telefono</label>
                            <input v-model="form.phone" type="tel">
                        </div>

                        <div>
                            <label>Data di nascita</label>
                            <input v-model="form.birthDate" type="date">
                        </div>

                        <div>
                            <label>Sesso</label>
                            <select v-model="form.gender">
                                <option value="">Non specificato</option>
                                <option value="male">Uomo</option>
                                <option value="female">Donna</option>
                                <option value="other">Altro</option>
                            </select>
                        </div>

                        <div v-if="editingId">
                            <label>Stato</label>
                            <select v-model="form.status">
                                <option value="active">Attivo</option>
                                <option value="inactive">Inattivo</option>
                            </select>
                        </div>
                    </div>

                    <div v-if="error" class="error-message">
                        {{ error }}
                    </div>

                    <div class="modal-actions">
                        <button
                            type="button"
                            class="secondary-button"
                            @click="showModal = false"
                        >
                            Annulla
                        </button>

                        <button
                            type="submit"
                            class="primary-button"
                            :disabled="saving"
                        >
                            {{ saving ? 'Salvataggio...' : 'Salva paziente' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<style scoped>
.patients-page {
    color: #304438;
}

.page-heading, .modal-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
}

.page-heading {
    margin-bottom: 25px;
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

.page-heading p {
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

.stats-card, .patients-card {
    background: white;
    border: 1px solid #e5ede7;
    border-radius: 13px;
}

.stats-card {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 18px 22px;
    width: fit-content;
    min-width: 210px;
    margin-bottom: 20px;
}

.stats-icon {
    width: 43px;
    height: 43px;
    border-radius: 11px;
    background: #edf5ef;
    color: #438b68;
    display: grid;
    place-items: center;
    font-size: 19px;
}

.stats-card span, .stats-card strong {
    display: block;
}

.stats-card span {
    color: #87968b;
    font-size: 12px;
}

.stats-card strong {
    font-size: 23px;
    margin-top: 4px;
}

.patients-card {
    overflow: hidden;
}

.filters {
    padding: 18px;
    display: flex;
    gap: 12px;
    border-bottom: 1px solid #e5ede7;
}

.search-box {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;
    border: 1px solid #e5ede7;
    border-radius: 8px;
    padding: 0 12px;
    color: #87968b;
}

.search-box input {
    width: 100%;
    border: 0;
    outline: 0;
    padding: 11px 0;
    font: inherit;
}

.filters select, .patient-modal input, .patient-modal select {
    border: 1px solid #e5ede7;
    border-radius: 8px;
    padding: 11px;
    background: white;
    color: #304438;
    font: inherit;
}

.table-wrapper {
    overflow-x: auto;
}

table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
    white-space: nowrap;
}

th {
    background: #fafcfb;
    color: #87968b;
    font-size: 10px;
    letter-spacing: .7px;
    text-transform: uppercase;
    font-weight: 700;
    padding: 15px;
}

td {
    padding: 14px 15px;
    border-top: 1px solid #edf1ed;
    font-size: 12px;
}

.patient-info {
    display: flex;
    align-items: center;
    gap: 11px;
}

.patient-avatar {
    width: 37px;
    height: 37px;
    display: grid;
    place-items: center;
    background: #edf5ef;
    color: #28583f;
    border-radius: 50%;
    font-weight: 700;
}

.patient-info strong, .patient-info small,
.contact-info span, .contact-info small {
    display: block;
}

.patient-info small, .contact-info small {
    color: #96a399;
    margin-top: 4px;
    font-size: 10px;
}

.contact-info span {
    max-width: 190px;
    overflow: hidden;
    text-overflow: ellipsis;
}

.status-badge {
    padding: 5px 9px;
    border-radius: 20px;
    font-size: 10px;
    font-weight: 700;
}

.status-badge.active {
    background: #edf5ef;
    color: #438b68;
}

.status-badge.inactive {
    background: #f1f1f1;
    color: #777;
}

.actions {
    display: flex;
    gap: 6px;
}

.actions button {
    width: 31px;
    height: 31px;
    border: 1px solid #e5ede7;
    border-radius: 7px;
    background: white;
    color: #438b68;
    cursor: pointer;
}

.actions .archive-button {
    color: #b46b6b;
}

.pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 15px 18px;
    border-top: 1px solid #e5ede7;
    color: #87968b;
    font-size: 11px;
}

.pagination div {
    display: flex;
    gap: 7px;
}

.pagination button {
    width: 32px;
    height: 32px;
    background: white;
    border: 1px solid #e5ede7;
    border-radius: 7px;
    cursor: pointer;
}

.pagination button:disabled {
    opacity: .35;
    cursor: not-allowed;
}

.empty-state, .loading-message {
    padding: 45px 20px;
    text-align: center;
    color: #87968b;
}

.empty-state > i {
    font-size: 30px;
    color: #438b68;
}

.empty-state h3 {
    color: #304438;
}

.empty-state p {
    font-size: 12px;
    margin-bottom: 20px;
}

.error-message {
    padding: 12px;
    margin: 12px;
    color: #a33;
    background: #fff0f0;
    border-radius: 8px;
    font-size: 12px;
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

.patient-modal {
    background: white;
    width: min(100%, 560px);
    border-radius: 16px;
    padding: 25px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 15px 50px #0002;
}

.modal-heading {
    margin-bottom: 24px;
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

.form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
}

.form-grid > div {
    display: flex;
    flex-direction: column;
    gap: 7px;
}

.form-grid label {
    font-size: 12px;
    font-weight: 700;
}

.patient-modal input, .patient-modal select {
    width: 100%;
    box-sizing: border-box;
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 25px;
}

@media(max-width: 650px) {
    .page-heading {
        align-items: flex-start;
        flex-direction: column;
    }

    .filters {
        flex-direction: column;
    }

    .form-grid {
        grid-template-columns: 1fr;
    }

    .pagination {
        gap: 10px;
    }
}
</style>
