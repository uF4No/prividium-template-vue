<template>
    <div class="login-container">
        <div class="login-card">
            <h1>Welcome to Prividium Sample DApp</h1>
            <p>Experience secure blockchain interactions with OAuth scope requirements</p>

            <div v-if="isAuthenticating" class="loading">
                <p>Authenticating...</p>
            </div>

            <div v-else>
                <button class="login-button" @click="login">Sign in with Prividium</button>
                <div class="checkbox-container">
                    <input type="checkbox" id="read-only-access" v-model="readOnlyAccess" class="checkbox">
                    <label for="read-only-access" class="checkbox-label">Read only access (no wallet)</label>
                </div>
            </div>

            <div v-if="authError" class="error">
                <p>{{ authError }}</p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, watch, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { usePrividium } from '../composables/usePrividium';

const router = useRouter();
const route = useRoute();
const { isAuthenticated, isAuthenticating, authError, authenticate } = usePrividium();

const readOnlyAccess = ref(false);

onMounted(() => {
    if (isAuthenticated.value) {
        const redirectPath = (route.query.redirect as string) || '/';
        void router.push(redirectPath);
    }
});

watch(isAuthenticated, (newValue) => {
    if (newValue) {
        const redirectPath = (route.query.redirect as string) || '/';
        void router.push(redirectPath);
    }
});

const login = async () => {
    const success = await authenticate(readOnlyAccess.value);
    if (success) {
        const redirectPath = (route.query.redirect as string) || '/';
        await router.push(redirectPath);
    }
};
</script>

<style scoped>
.login-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-background-soft);
    padding: 1rem;
}

.login-card {
    background: var(--color-surface);
    padding: 3rem 2rem;
    border-radius: 12px;
    border: 1px solid var(--color-border);
    box-shadow:
        0 4px 6px -1px rgba(0, 0, 0, 0.1),
        0 2px 4px -1px rgba(0, 0, 0, 0.06);
    text-align: center;
    max-width: 400px;
    width: 100%;
}

h1 {
    color: var(--color-heading);
    font-size: 1.875rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
}

p {
    color: var(--color-text-muted);
    margin-bottom: 2rem;
    font-size: 1rem;
}

.login-button {
    background: var(--color-primary-500);
    color: var(--color-white);
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    width: 100%;
}

.login-button:hover {
    background: var(--color-primary-600);
    transform: translateY(-1px);
}

.login-button:active {
    transform: translateY(0);
}

.login-button:disabled {
    background: var(--color-gray-300);
    color: var(--color-gray-500);
    cursor: not-allowed;
    transform: none;
}

.loading {
    padding: 1rem 0;
    color: var(--color-text-muted);
}

.error {
    margin-top: 1.5rem;
    padding: 0.75rem 1rem;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    color: var(--color-danger-600);
    font-size: 0.875rem;
}

.checkbox-container {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 1.5rem;
    gap: 0.5rem;
}

.checkbox {
    width: 1rem;
    height: 1rem;
    border: 2px solid var(--color-border);
    border-radius: 4px;
    background: var(--color-surface);
    cursor: pointer;
    transition: all 0.2s ease;
    appearance: none;
    position: relative;
}

.checkbox:checked {
    background: var(--color-primary-500);
    border-color: var(--color-primary-500);
}

.checkbox:checked::after {
    content: '✓';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: white;
    font-size: 0.75rem;
    font-weight: bold;
}

.checkbox:hover {
    border-color: var(--color-primary-400);
}

.checkbox:focus {
    outline: 2px solid var(--color-primary-200);
    outline-offset: 2px;
}

.checkbox-label {
    color: var(--color-text);
    font-size: 0.875rem;
    cursor: pointer;
    user-select: none;
}

@media (max-width: 480px) {
    .login-card {
        padding: 2rem 1.5rem;
    }

    h1 {
        font-size: 1.5rem;
    }
}
</style>
