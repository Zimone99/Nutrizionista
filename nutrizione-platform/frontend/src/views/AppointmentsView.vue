<script setup>
defineProps({
    title: {
        type: String,
        default: 'Pagina in costruzione'
    }
})
</script>

<template>
    <div class="card">
        <h1>{{ title }}</h1>
        <p>Modulo NutriStudio in fase di sviluppo.</p>
    </div>
</template>