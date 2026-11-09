
<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'

import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import Tag from 'primevue/tag'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'

import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

const toast = useToast()
const confirm = useConfirm()

const patients = ref([])
const loading = ref(false)

const search = ref('')
const statusFilter = ref(null)

const page = ref(1)
const rows = ref(10)
const totalRecords = ref(0)

const dialogVisible = ref(false)
const editing = ref(false)
const saving = ref(false)

const selectedId = ref(null)

const emptyForm = () => ({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: null,
    gender: null,
    status: 'active'
})

const form = ref(emptyForm())

const statusOptions = [
    { label: 'Tutti', value: null },
    { label: 'Attivi', value: 'active' },
    { label: 'Inattivi', value: 'inactive' }
]

const genderOptions = [
    { label: 'Donna', value: 'Donna' },
    { label: 'Uomo', value: 'Uomo' },
    { label: 'Altro', value: 'Altro' },
    { label: 'Non specificato', value: 'Non specificato' }
]

async function loadPatients() {
    loading.value = true

    try {
        const response = await api.get('/patients', {
            params: {
                page: page.value,
                limit: rows.value,
                search: search.value,
                status: statusFilter.value
            }
        })

        patients.value = response.data.data
        totalRecords.value = response.data.pagination.total

    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Errore',
            detail: 'Impossibile caricare i pazienti',
            life: 3000
        })
    } finally {
        loading.value = false
    }
}

function onPage(event) {
    page.value = event.page + 1
    rows.value = event.rows
    loadPatients()
}

function searchPatients() {
    page.value = 1
    loadPatients()
}

function openNewPatient() {
    editing.value = false
    selectedId.value = null
    form.value = emptyForm()
    dialogVisible.value = true
}

function openEditPatient(patient) {
    editing.value = true
    selectedId.value = patient.id

    form.value = {
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email || '',
        phone: patient.phone || '',
        birthDate: patient.birthDate
            ? new Date(`${patient.birthDate}T12:00:00`)
            : null,
        gender: patient.gender || null,
        status: patient.status
    }

    dialogVisible.value = true
}

function getDateValue(date) {
    if (!date) return null

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}

async function savePatient() {
    if (!form.value.firstName.trim() ||
        !form.value.lastName.trim()) {
        toast.add({
            severity: 'warn',
            summary: 'Attenzione',
            detail: 'Nome e cognome sono obbligatori',
            life: 3000
        })
        return
    }

    saving.value = true

    try {
        const payload = {
            ...form.value,
            birthDate: getDateValue(form.value.birthDate)
        }

        if (editing.value) {
            await api.put(
                `/patients/${selectedId.value}`,
                payload
            )
        } else {
            await api.post('/patients', payload)
        }

        toast.add({
            severity: 'success',
            summary: 'Operazione completata',
            detail: editing.value
                ? 'Paziente aggiornato'
                : 'Paziente inserito',
            life: 3000
        })

        dialogVisible.value = false
        await loadPatients()

    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Errore',
            detail: error.response?.data?.message ||
                'Impossibile salvare il paziente',
            life: 3000
        })
    } finally {
        saving.value = false
    }
}

function archivePatient(patient) {
    confirm.require({
        message: `Vuoi archiviare ${patient.firstName} ${patient.lastName}?`,
        header: 'Conferma archiviazione',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Archivia',
        rejectLabel: 'Annulla',

        accept: async () => {
            try {
                await api.delete(`/patients/${patient.id}`)

                toast.add({
                    severity: 'success',
                    summary: 'Completato',
                    detail: 'Paziente archiviato',
                    life: 3000
                })

                await loadPatients()

            } catch {
                toast.add({
                    severity: 'error',
                    summary: 'Errore',
                    detail: 'Impossibile archiviare il paziente',
                    life: 3000
                })
            }
        }
    })
}

function formatDate(value) {
    if (!value) return '-'

    return new Date(value).toLocaleDateString('it-IT')
}

onMounted(loadPatients)
</script>

<template>
    <Toast />
    <ConfirmDialog />

    <div class="patients-page">

        <div class="flex justify-content-between align-items-center mb-4 flex-wrap gap-3">

            <div>
                <h1 class="text-2xl font-bold mb-1">
                    Pazienti
                </h1>

                <span class="text-500">
                    Gestione anagrafica pazienti
                </span>
            </div>

            <Button
                label="Nuovo paziente"
                icon="pi pi-plus"
                @click="openNewPatient"
            />

        </div>

        <Card>

            <template #content>

                <div class="flex flex-wrap gap-3 mb-4">

                    <InputText
                        v-model="search"
                        placeholder="Cerca nome, cognome o email..."
                        class="flex-1"
                        @keyup.enter="searchPatients"
                    />

                    <Select
                        v-model="statusFilter"
                        :options="statusOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Stato"
                    />

                    <Button
                        icon="pi pi-search"
                        label="Cerca"
                        @click="searchPatients"
                    />

                </div>

                <DataTable
                    :value="patients"
                    :loading="loading"
                    lazy
                    paginator
                    :rows="rows"
                    :first="(page - 1) * rows"
                    :totalRecords="totalRecords"
                    :rowsPerPageOptions="[10, 20, 50]"
                    @page="onPage"
                    stripedRows
                    responsiveLayout="scroll"
                    dataKey="id"
                >

                    <Column header="Paziente">

                        <template #body="{ data }">
                            <div class="font-semibold">
                                {{ data.firstName }} {{ data.lastName }}
                            </div>
                        </template>

                    </Column>

                    <Column field="email" header="Email" />

                    <Column field="phone" header="Telefono" />

                    <Column header="Data nascita">

                        <template #body="{ data }">
                            {{ formatDate(data.birthDate) }}
                        </template>

                    </Column>

                    <Column header="Stato">

                        <template #body="{ data }">
                            <Tag
                                :value="data.status === 'active' ? 'Attivo' : 'Inattivo'"
                                :severity="data.status === 'active' ? 'success' : 'secondary'"
                            />
                        </template>

                    </Column>

                    <Column header="Azioni">

                        <template #body="{ data }">

                            <div class="flex gap-2">

                                <Button
                                    icon="pi pi-pencil"
                                    severity="secondary"
                                    text
                                    rounded
                                    aria-label="Modifica"
                                    @click="openEditPatient(data)"
                                />

                                <Button
                                    icon="pi pi-archive"
                                    severity="danger"
                                    text
                                    rounded
                                    aria-label="Archivia"
                                    @click="archivePatient(data)"
                                />

                            </div>

                        </template>

                    </Column>

                    <template #empty>
                        Nessun paziente trovato.
                    </template>

                </DataTable>

            </template>

        </Card>

        <Dialog
            v-model:visible="dialogVisible"
            :header="editing ? 'Modifica paziente' : 'Nuovo paziente'"
            modal
            :style="{ width: '600px', maxWidth: '95vw' }"
        >

            <form @submit.prevent="savePatient">

                <div class="grid">

                    <div class="col-12 md:col-6">
                        <label class="block mb-2">Nome *</label>
                        <InputText
                            v-model="form.firstName"
                            class="w-full"
                            required
                        />
                    </div>

                    <div class="col-12 md:col-6">
                        <label class="block mb-2">Cognome *</label>
                        <InputText
                            v-model="form.lastName"
                            class="w-full"
                            required
                        />
                    </div>

                    <div class="col-12 md:col-6">
                        <label class="block mb-2">Email</label>
                        <InputText
                            v-model="form.email"
                            type="email"
                            class="w-full"
                        />
                    </div>

                    <div class="col-12 md:col-6">
                        <label class="block mb-2">Telefono</label>
                        <InputText
                            v-model="form.phone"
                            class="w-full"
                        />
                    </div>

                    <div class="col-12 md:col-6">
                        <label class="block mb-2">Data di nascita</label>
                        <DatePicker
                            v-model="form.birthDate"
                            dateFormat="dd/mm/yy"
                            class="w-full"
                            showIcon
                        />
                    </div>

                    <div class="col-12 md:col-6">
                        <label class="block mb-2">Sesso</label>
                        <Select
                            v-model="form.gender"
                            :options="genderOptions"
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Seleziona"
                            class="w-full"
                        />
                    </div>

                    <div v-if="editing" class="col-12">
                        <label class="block mb-2">Stato</label>
                        <Select
                            v-model="form.status"
                            :options="[
                                { label: 'Attivo', value: 'active' },
                                { label: 'Inattivo', value: 'inactive' }
                            ]"
                            optionLabel="label"
                            optionValue="value"
                            class="w-full"
                        />
                    </div>

                </div>

                <div class="flex justify-content-end gap-2 mt-4">

                    <Button
                        label="Annulla"
                        severity="secondary"
                        outlined
                        type="button"
                        @click="dialogVisible = false"
                    />

                    <Button
                        label="Salva paziente"
                        icon="pi pi-check"
                        type="submit"
                        :loading="saving"
                    />

                </div>

            </form>

        </Dialog>

    </div>
</template>
