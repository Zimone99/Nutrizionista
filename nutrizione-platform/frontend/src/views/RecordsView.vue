
<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../services/api'

const patients = ref([])
const visits = ref([])
const selectedPatient = ref(null)

const loadingPatients = ref(false)
const loadingVisits = ref(false)
const saving = ref(false)
const error = ref('')

const showModal = ref(false)
const editingVisit = ref(null)

const form = ref({
  visitDate: '',
  weight: '',
  height: '',
  notes: ''
})

const patientName = computed(() => {
  if (!selectedPatient.value) return ''
  return `${selectedPatient.value.first_name} ${selectedPatient.value.last_name}`
})

const latestVisit = computed(() => visits.value[0] || null)

const averageWeight = computed(() => {
  const values = visits.value
    .map(v => Number(v.weight))
    .filter(v => Number.isFinite(v) && v > 0)

  if (!values.length) return null

  return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)
})

const formatDate = date => {
  if (!date) return '—'

  return new Date(date).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

const formatDateTimeInput = date => {
  const d = date ? new Date(date) : new Date()
  const offset = d.getTimezoneOffset()
  return new Date(d.getTime() - offset * 60000)
    .toISOString()
    .slice(0, 16)
}

const loadPatients = async () => {
  loadingPatients.value = true
  error.value = ''

  try {
    const response = await api.get('/patients', {
      params: { limit: 100, page: 1, status: 'active' }
    })

    patients.value = response.data.data || []

    if (patients.value.length && !selectedPatient.value) {
      await selectPatient(patients.value[0])
    }
  } catch (err) {
    error.value = 'Impossibile caricare i pazienti.'
    console.error(err)
  } finally {
    loadingPatients.value = false
  }
}

const selectPatient = async patient => {
  selectedPatient.value = patient
  await loadVisits()
}

const loadVisits = async () => {
  if (!selectedPatient.value) return

  loadingVisits.value = true
  error.value = ''

  try {
    const response = await api.get(
      `/visits/patient/${selectedPatient.value.id}`
    )

    visits.value = response.data.data || []
  } catch (err) {
    error.value = 'Impossibile caricare lo storico delle visite.'
    console.error(err)
  } finally {
    loadingVisits.value = false
  }
}

const openNewVisit = () => {
  editingVisit.value = null

  form.value = {
    visitDate: formatDateTimeInput(new Date()),
    weight: '',
    height: '',
    notes: ''
  }

  showModal.value = true
}

const openEditVisit = visit => {
  editingVisit.value = visit

  form.value = {
    visitDate: formatDateTimeInput(visit.visit_date),
    weight: visit.weight ?? '',
    height: visit.height ?? '',
    notes: visit.notes || ''
  }

  showModal.value = true
}

const saveVisit = async () => {
  if (!selectedPatient.value) return

  if (form.value.weight !== '' && Number(form.value.weight) <= 0) {
    error.value = 'Inserisci un peso valido.'
    return
  }

  if (form.value.height !== '' && Number(form.value.height) <= 0) {
    error.value = 'Inserisci un’altezza valida.'
    return
  }

  saving.value = true
  error.value = ''

  const payload = {
    visitDate: form.value.visitDate
      ? new Date(form.value.visitDate).toISOString()
      : null,
    weight: form.value.weight === '' ? null : Number(form.value.weight),
    height: form.value.height === '' ? null : Number(form.value.height),
    notes: form.value.notes
  }

  try {
    if (editingVisit.value) {
      await api.put(`/visits/${editingVisit.value.id}`, payload)
    } else {
      await api.post('/visits', {
        ...payload,
        patientId: selectedPatient.value.id
      })
    }

    showModal.value = false
    await loadVisits()
  } catch (err) {
    error.value = err.response?.data?.message || 'Errore nel salvataggio.'
    console.error(err)
  } finally {
    saving.value = false
  }
}

const deleteVisit = async visit => {
  if (!confirm('Vuoi eliminare definitivamente questa visita?')) return

  try {
    await api.delete(`/visits/${visit.id}`)
    await loadVisits()
  } catch (err) {
    error.value = 'Errore durante l’eliminazione della visita.'
    console.error(err)
  }
}

onMounted(loadPatients)
</script>

<template>
  <div class="records-page">
    <div class="page-heading">
      <div>
        <span class="eyebrow">GESTIONE CLINICA</span>
        <h1>Cartelle nutrizionali</h1>
        <p>Monitora i pazienti, le misurazioni e lo storico delle visite.</p>
      </div>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
      <button @click="error = ''">×</button>
    </div>

    <div class="records-layout">
      <aside class="patients-panel">
        <div class="panel-heading">
          <div>
            <h3>Pazienti</h3>
            <span>{{ patients.length }} pazienti attivi</span>
          </div>
        </div>

        <div v-if="loadingPatients" class="empty-state">
          Caricamento pazienti...
        </div>

        <div v-else-if="!patients.length" class="empty-state">
          Nessun paziente attivo disponibile.
        </div>

        <button
          v-for="patient in patients"
          :key="patient.id"
          class="patient-item"
          :class="{ selected: selectedPatient?.id === patient.id }"
          @click="selectPatient(patient)"
        >
          <div class="patient-avatar">
            {{ patient.first_name?.charAt(0) }}{{ patient.last_name?.charAt(0) }}
          </div>

          <div class="patient-info">
            <strong>{{ patient.first_name }} {{ patient.last_name }}</strong>
            <span>{{ patient.email || patient.phone || 'Nessun contatto' }}</span>
          </div>

          <span class="patient-arrow">›</span>
        </button>
      </aside>

      <main class="record-content">
        <template v-if="selectedPatient">
          <div class="patient-header">
            <div class="patient-main">
              <div class="large-avatar">
                {{ selectedPatient.first_name?.charAt(0) }}{{ selectedPatient.last_name?.charAt(0) }}
              </div>

              <div>
                <span class="eyebrow">SCHEDA PAZIENTE</span>
                <h2>{{ patientName }}</h2>
                <p>{{ selectedPatient.email || 'Email non disponibile' }}</p>
              </div>
            </div>

            <button class="primary-button" @click="openNewVisit">
              <span>＋</span> Nuova visita
            </button>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <span>Visite registrate</span>
              <strong>{{ visits.length }}</strong>
              <small>Storico completo</small>
            </div>

            <div class="stat-card">
              <span>Ultimo peso</span>
              <strong>
                {{ latestVisit?.weight ? `${latestVisit.weight} kg` : '—' }}
              </strong>
              <small>Ultima misurazione</small>
            </div>

            <div class="stat-card">
              <span>Altezza</span>
              <strong>
                {{ latestVisit?.height ? `${latestVisit.height} cm` : '—' }}
              </strong>
              <small>Ultima misurazione</small>
            </div>

            <div class="stat-card">
              <span>Peso medio</span>
              <strong>{{ averageWeight ? `${averageWeight} kg` : '—' }}</strong>
              <small>Visite registrate</small>
            </div>
          </div>

          <section class="history-panel">
            <div class="section-heading">
              <div>
                <h3>Storico visite</h3>
                <p>Misurazioni e annotazioni nutrizionali</p>
              </div>
              <span class="visit-count">{{ visits.length }} visite</span>
            </div>

            <div v-if="loadingVisits" class="empty-state">
              Caricamento storico...
            </div>

            <div v-else-if="!visits.length" class="no-visits">
              <div class="empty-icon">＋</div>
              <h3>Nessuna visita registrata</h3>
              <p>Inizia a costruire lo storico nutrizionale di questo paziente.</p>
              <button class="primary-button" @click="openNewVisit">
                Registra la prima visita
              </button>
            </div>

            <div v-else class="visit-list">
              <article
                v-for="visit in visits"
                :key="visit.id"
                class="visit-card"
              >
                <div class="visit-date">
                  <div class="date-icon">▣</div>
                  <div>
                    <strong>{{ formatDate(visit.visit_date) }}</strong>
                    <span>Visita nutrizionale</span>
                  </div>
                </div>

                <div class="visit-measurements">
                  <div>
                    <span>Peso</span>
                    <strong>{{ visit.weight ? `${visit.weight} kg` : '—' }}</strong>
                  </div>
                  <div>
                    <span>Altezza</span>
                    <strong>{{ visit.height ? `${visit.height} cm` : '—' }}</strong>
                  </div>
                </div>

                <div class="visit-notes">
                  {{ visit.notes || 'Nessuna nota inserita.' }}
                </div>

                <div class="visit-actions">
                  <button class="secondary-button" @click="openEditVisit(visit)">
                    Modifica
                  </button>
                  <button class="delete-button" @click="deleteVisit(visit)">
                    Elimina
                  </button>
                </div>
              </article>
            </div>
          </section>
        </template>

        <div v-else-if="!loadingPatients" class="no-patient">
          <h3>Seleziona un paziente</h3>
          <p>Scegli un paziente dall'elenco per visualizzare la sua cartella.</p>
        </div>
      </main>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="visit-modal">
        <div class="modal-heading">
          <div>
            <span class="eyebrow">CARTELLA NUTRIZIONALE</span>
            <h2>{{ editingVisit ? 'Modifica visita' : 'Nuova visita' }}</h2>
            <p>{{ patientName }}</p>
          </div>
          <button class="close-button" @click="showModal = false">×</button>
        </div>

        <form @submit.prevent="saveVisit">
          <div class="form-field">
            <label>Data e ora della visita</label>
            <input v-model="form.visitDate" type="datetime-local" required />
          </div>

          <div class="form-row">
            <div class="form-field">
              <label>Peso (kg)</label>
              <input
                v-model="form.weight"
                type="number"
                min="0.1"
                step="0.1"
                placeholder="Es. 72.5"
              />
            </div>

            <div class="form-field">
              <label>Altezza (cm)</label>
              <input
                v-model="form.height"
                type="number"
                min="0.1"
                step="0.1"
                placeholder="Es. 175"
              />
            </div>
          </div>

          <div class="form-field">
            <label>Note della visita</label>
            <textarea
              v-model="form.notes"
              rows="5"
              placeholder="Inserisci osservazioni, progressi e indicazioni..."
            ></textarea>
          </div>

          <div class="modal-actions">
            <button type="button" class="secondary-button" @click="showModal = false">
              Annulla
            </button>
            <button type="submit" class="primary-button" :disabled="saving">
              {{ saving ? 'Salvataggio...' : 'Salva visita' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.records-page {
  color: var(--nutri-text, #304438);
  width: 100%;
}

.page-heading {
  margin-bottom: 25px;
}

.eyebrow {
  display: block;
  color: #438b68;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.4px;
  margin-bottom: 7px;
}

.page-heading h1 {
  font-size: 27px;
  margin: 0 0 7px;
  font-weight: 750;
}

.page-heading p,
.patient-main p,
.section-heading p,
.modal-heading p {
  color: #84948a;
  margin: 0;
  font-size: 13px;
}

.records-layout {
  display: grid;
  grid-template-columns: 275px minmax(0, 1fr);
  gap: 22px;
  align-items: start;
}

.patients-panel,
.history-panel,
.stat-card,
.patient-header {
  background: white;
  border: 1px solid #e5ede7;
  border-radius: 14px;
}

.patients-panel {
  padding: 16px 12px;
}

.panel-heading {
  padding: 3px 8px 15px;
}

.panel-heading h3,
.section-heading h3 {
  margin: 0 0 5px;
  font-size: 16px;
}

.panel-heading span {
  color: #89978e;
  font-size: 11px;
}

.patient-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 11px 9px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  text-align: left;
  cursor: pointer;
  margin-bottom: 4px;
}

.patient-item:hover,
.patient-item.selected {
  background: #edf5ef;
}

.patient-avatar,
.large-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e4f0e7;
  color: #39845b;
  border-radius: 50%;
  font-weight: 750;
  flex-shrink: 0;
}

.patient-avatar {
  width: 38px;
  height: 38px;
  font-size: 12px;
}

.patient-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1;
}

.patient-info strong {
  font-size: 12px;
}

.patient-info span {
  font-size: 10px;
  color: #89978e;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.patient-arrow {
  color: #8ba594;
  font-size: 21px;
}

.patient-header {
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 17px;
}

.patient-main {
  display: flex;
  align-items: center;
  gap: 14px;
}

.large-avatar {
  width: 55px;
  height: 55px;
  font-size: 18px;
}

.patient-main h2 {
  font-size: 19px;
  margin: 0 0 5px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.stat-card {
  padding: 17px 14px;
}

.stat-card span,
.stat-card small {
  display: block;
  color: #89978e;
  font-size: 11px;
}

.stat-card strong {
  display: block;
  font-size: 22px;
  margin: 9px 0 5px;
  color: #28583f;
}

.history-panel {
  padding: 20px;
}

.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

.visit-count {
  background: #edf5ef;
  color: #39845b;
  padding: 6px 10px;
  border-radius: 20px;
  font-size: 11px;
}

.visit-card {
  border: 1px solid #e8eee9;
  border-radius: 11px;
  padding: 16px;
  margin-bottom: 12px;
}

.visit-date {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 15px;
}

.date-icon {
  width: 37px;
  height: 37px;
  background: #edf5ef;
  color: #39845b;
  display: grid;
  place-items: center;
  border-radius: 9px;
}

.visit-date strong,
.visit-date span {
  display: block;
}

.visit-date strong {
  font-size: 13px;
}

.visit-date span {
  font-size: 10px;
  color: #89978e;
  margin-top: 4px;
}

.visit-measurements {
  display: flex;
  gap: 35px;
  padding: 12px 0;
  border-top: 1px solid #edf1ed;
  border-bottom: 1px solid #edf1ed;
}

.visit-measurements span,
.visit-measurements strong {
  display: block;
}

.visit-measurements span {
  font-size: 10px;
  color: #89978e;
  margin-bottom: 4px;
}

.visit-measurements strong {
  font-size: 15px;
}

.visit-notes {
  font-size: 12px;
  line-height: 1.6;
  color: #65766a;
  padding: 12px 0;
  white-space: pre-wrap;
}

.visit-actions,
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.primary-button,
.secondary-button,
.delete-button {
  border: 0;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 12px;
  font-weight: 650;
  cursor: pointer;
}

.primary-button {
  background: #39845b;
  color: white;
}

.primary-button:hover {
  background: #28583f;
}

.primary-button:disabled {
  opacity: .6;
  cursor: wait;
}

.secondary-button {
  background: #edf3ee;
  color: #45634f;
}

.delete-button {
  background: #fff0ee;
  color: #b34d42;
}

.no-visits,
.no-patient,
.empty-state {
  text-align: center;
  padding: 35px 15px;
  color: #89978e;
  font-size: 12px;
}

.no-visits h3,
.no-patient h3 {
  color: #304438;
  font-size: 15px;
}

.no-visits p,
.no-patient p {
  margin-bottom: 18px;
}

.empty-icon {
  font-size: 30px;
  color: #438b68;
}

.error-message {
  background: #fff0ee;
  color: #a53d35;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 15px;
  font-size: 12px;
  display: flex;
  justify-content: space-between;
}

.error-message button {
  border: 0;
  background: transparent;
  cursor: pointer;
  font-size: 18px;
  color: inherit;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(25, 45, 33, .48);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
}

.visit-modal {
  width: 100%;
  max-width: 520px;
  background: white;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 15px 60px rgba(0, 0, 0, .15);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-heading {
  display: flex;
  justify-content: space-between;
  margin-bottom: 23px;
}

.modal-heading h2 {
  font-size: 20px;
  margin: 0 0 5px;
}

.close-button {
  border: 0;
  background: transparent;
  font-size: 25px;
  color: #829187;
  cursor: pointer;
  align-self: flex-start;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin-bottom: 16px;
  flex: 1;
  min-width: 0;
}

.form-field label {
  font-size: 12px;
  font-weight: 650;
  color: #405849;
}

.form-field input,
.form-field textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 11px 12px;
  border: 1px solid #dfe8e1;
  border-radius: 8px;
  outline: none;
  font: inherit;
  font-size: 12px;
  color: #304438;
}

.form-field input:focus,
.form-field textarea:focus {
  border-color: #438b68;
}

.form-field textarea {
  resize: vertical;
}

.form-row {
  display: flex;
  gap: 13px;
}

.modal-actions {
  margin-top: 22px;
}

@media (max-width: 1050px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 750px) {
  .records-layout {
    grid-template-columns: 1fr;
  }

  .patients-panel {
    max-height: 260px;
    overflow-y: auto;
  }

  .patient-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 450px) {
  .form-row {
    flex-direction: column;
    gap: 0;
  }

  .visit-modal {
    padding: 18px;
  }
}
</style>
