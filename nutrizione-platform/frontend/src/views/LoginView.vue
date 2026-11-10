```vue
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'
import api from '../services/api'

const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

async function login() {
    errorMessage.value = ''

    if (!email.value.trim() || !password.value) {
        errorMessage.value = 'Inserisci email e password.'
        return
    }

    loading.value = true

    try {
        const response = await api.post('/api/auth/login', {
            email: email.value.trim(),
            password: password.value
        })

        console.log('Login effettuato:', response.data)

        await router.push('/admin')

    } catch (error) {
        console.error('Errore login:', error)

        errorMessage.value =
            error.response?.data?.message ||
            'Impossibile effettuare il login. Verifica il server.'

    } finally {
        loading.value = false
    }
}
</script>

<template>
    <div class="login-page">
        <div class="login-card">

            <div class="login-logo">
                <i class="pi pi-leaf"></i>
            </div>

            <h1>NutriStudio</h1>
            <p>Area riservata alla dietologa</p>

            <Message
                v-if="errorMessage"
                severity="error"
                :closable="false"
                class="login-error"
            >
                {{ errorMessage }}
            </Message>

            <form @submit.prevent="login">

                <div class="field">
                    <label for="email">Email</label>

                    <InputText
                        id="email"
                        v-model="email"
                        type="email"
                        placeholder="demo@nutrizionista.local"
                        class="w-full"
                        autocomplete="username"
                        required
                    />
                </div>

                <div class="field">
                    <label for="password">Password</label>

                    <Password
                        v-model="password"
                        inputId="password"
                        placeholder="NutriDemo2026!Test"
                        class="w-full"
                        inputClass="w-full"
                        :feedback="false"
                        toggleMask
                        autocomplete="current-password"
                        required
                    />
                </div>

                <Button
                    label="Accedi"
                    icon="pi pi-sign-in"
                    type="submit"
                    class="w-full login-button"
                    :loading="loading"
                    :disabled="loading"
                />

            </form>

            <small>
                <i class="pi pi-lock"></i>
                Accesso riservato · NutriStudio
            </small>

        </div>
    </div>
</template>

<style scoped>
.login-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f0f7f1;
    padding: 20px;
}

.login-card {
    width: 100%;
    max-width: 420px;
    background: white;
    border-radius: 20px;
    padding: 40px;
    box-shadow: 0 10px 40px #28583f12;
}

.login-logo {
    width: 65px;
    height: 65px;
    background: #edf5ef;
    color: #438b68;
    display: grid;
    place-items: center;
    border-radius: 18px;
    font-size: 30px;
    margin: 0 auto 20px;
}

.login-card h1 {
    text-align: center;
    color: #28583f;
    margin-bottom: 5px;
}

.login-card p {
    text-align: center;
    color: #89998e;
    margin-bottom: 30px;
}

.field {
    margin-bottom: 22px;
}

.field label {
    display: block;
    margin-bottom: 8px;
    color: #304438;
    font-weight: 600;
}

.login-error {
    margin-bottom: 20px;
}

.login-button {
    background: #438b68;
    border-color: #438b68;
}

.login-card small {
    display: block;
    text-align: center;
    color: #a0aea4;
    margin-top: 25px;
}
</style>