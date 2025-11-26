<script setup lang="ts">
import { usePrividium } from './composables/usePrividium';

const { isAuthenticated } = usePrividium();
</script>

<template>
    <div id="app">
        <header v-if="isAuthenticated">
            <img alt="Vue logo" class="logo" src="@/assets/logo.svg" width="60" height="60" />
            <h1>Sample DApp</h1>
        </header>

        <RouterView />
    </div>
</template>

<style scoped>
#app {
    min-height: 100vh;
    background: var(--color-background);
}

header {
    display: flex;
    align-items: center;
    padding: 1rem 2rem;
    background: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
    gap: 1rem;
    box-shadow:
        0 1px 3px 0 rgba(0, 0, 0, 0.1),
        0 1px 2px 0 rgba(0, 0, 0, 0.06);
}

.logo {
    display: block;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
}

h1 {
    margin: 0;
    color: var(--color-heading);
    font-size: 1.5rem;
    font-weight: 600;
}

@media (max-width: 768px) {
    header {
        padding: 1rem;
    }

    h1 {
        font-size: 1.25rem;
    }

    .logo {
        width: 40px;
        height: 40px;
    }
}
</style>
