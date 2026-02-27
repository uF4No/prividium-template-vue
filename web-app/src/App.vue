<script setup lang="ts">
import { onMounted } from 'vue';
import AppFooter from './components/AppFooter.vue';
import AppNavbar from './components/AppNavbar.vue';

const companyName = import.meta.env.VITE_COMPANY_NAME || 'Prividium™';

onMounted(() => {
  document.title = `${companyName} | Prividium`;
});
</script>

<template>
  <div class="min-h-screen flex flex-col font-sans relative overflow-hidden">
    <!-- Rotating background globes -->
    <div class="bg-globes">
      <img
        src="/illustrations/globe-1.svg"
        alt=""
        class="globe globe-1"
      />
      <img
        src="/illustrations/globe-2.svg"
        alt=""
        class="globe globe-2"
      />
    </div>

    <AppNavbar />

    <main class="flex-grow container mx-auto px-4 py-12 max-w-7xl relative z-10">
      <RouterView />
    </main>

    <AppFooter />
  </div>
</template>
