<script setup lang="ts">
import { onMounted, watch, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { usePrividium } from '../composables/usePrividium';
import BaseIcon from '../components/BaseIcon.vue';

const router = useRouter();
const route = useRoute();
const { isAuthenticated, isAuthenticating, authError, authenticate } = usePrividium();

const companyName = import.meta.env.VITE_COMPANY_NAME || 'Prividium™';
const companyIcon = import.meta.env.VITE_COMPANY_ICON || 'CubeIcon';

const login = async () => {
  const success = await authenticate();
  if (success) {
    const redirectPath = (route.query.redirect as string) || '/';
    await router.push(redirectPath);
  }
};
</script>

<template>
  <div class="min-h-[70vh] flex items-center justify-center p-6">
    <div class="w-full max-w-md enterprise-card overflow-hidden">
      <div class="p-10">
        <!-- Enterprise Branding -->
        <div class="flex flex-col items-center mb-10">
          <div class="w-16 h-16 bg-slate-900 flex items-center justify-center rounded-full shadow-lg mb-6 text-white">
            <BaseIcon :name="companyIcon" class="w-8 h-8" />
          </div>
          <h1 class="text-3xl font-bold text-slate-900 tracking-tight text-center">{{ companyName }}</h1>
          <p class="text-slate-500 font-medium mt-2">Prividium™ Gateway</p>
        </div>

        <div class="text-center mb-10">
          <h2 class="text-lg font-semibold text-slate-800 mb-2">Secure Access</h2>
          <p class="text-slate-500 text-sm">Please authenticate to access your dashboard.</p>
        </div>

        <div v-if="isAuthenticating" class="flex flex-col items-center py-8">
          <div class="w-10 h-10 border-4 border-accent/10 border-t-accent rounded-full animate-spin mb-4"></div>
          <p class="text-slate-500 text-xs font-bold uppercase tracking-widest animate-pulse">Authenticating...</p>
        </div>

        <div v-else class="space-y-6">
          <button 
            @click="login"
            class="enterprise-button-primary w-full py-4 text-base"
          >
            Authenticate via Prividium
          </button>
        </div>

        <div v-if="authError" class="mt-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
          <BaseIcon name="ExclamationTriangleIcon" class="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p class="text-xs text-red-700 font-bold leading-relaxed">{{ authError }}</p>
        </div>
      </div>
      
      <div class="bg-slate-50/50 px-8 py-5 flex justify-center items-center gap-2 border-t border-slate-100">
        <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Powered by ZKsync Prividium™</p>
      </div>
    </div>
  </div>
</template>
