
<script setup>
defineProps({
    title: String,
    value: [String, Number],
    icon: String,
    description: String,
    color: {
        type: String,
        default: 'green'
    }
})
</script>

<template>
    <Card class="stat-card">
        <template #content>
            <div class="flex justify-content-between align-items-center">
                <div>
                    <span class="text-500 font-medium">{{ title }}</span>
                    <div class="text-3xl font-bold mt-2">
                        {{ value }}
                    </div>
                    <small class="text-500">{{ description }}</small>
                </div>

                <div
                    class="stat-icon"
                    :class="`stat-${color}`"
                >
                    <i :class="icon"></i>
                </div>
            </div>
        </template>
    </Card>
</template>

<style scoped>
.stat-card {
    border-radius: 14px;
    border: 1px solid #e8eee9;
    box-shadow: 0 2px 10px rgba(0,0,0,.03);
}

.stat-icon {
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    font-size: 22px;
}

.stat-green {
    color: #278653;
    background: #e5f5eb;
}

.stat-blue {
    color: #3278c8;
    background: #e7f0fc;
}

.stat-orange {
    color: #d68a24;
    background: #fff2df;
}

.stat-purple {
    color: #8257c7;
    background: #f0eafd;
}
</style>
