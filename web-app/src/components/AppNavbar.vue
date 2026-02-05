<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useWallet } from '../composables/useWallet';
import { usePrividium } from '../composables/usePrividium';
import BaseIcon from './BaseIcon.vue';

const router = useRouter();
const wallet = useWallet();
const { signOut } = usePrividium();

const companyName = import.meta.env.VITE_COMPANY_NAME || 'Prividium™';
const companyIcon = import.meta.env.VITE_COMPANY_ICON || 'CubeIcon';

const dropdownOpen = ref(false);
const copied = ref(false);

const copyAddress = () => {
  if (wallet.address.value) {
    void navigator.clipboard.writeText(wallet.address.value);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
      dropdownOpen.value = false;
    }, 2000);
  }
};

const logout = () => {
  try {
    signOut();
    void router.push('/login');
  } catch (error) {
    console.error('Logout error:', error);
  }
};

const closeDropdown = (e: MouseEvent) => {
  if (!(e.target as HTMLElement).closest('.wallet-dropdown-container')) {
    dropdownOpen.value = false;
  }
};

onMounted(() => window.addEventListener('click', closeDropdown));
onUnmounted(() => window.removeEventListener('click', closeDropdown));
</script>

<template>
  <nav class="floating-navbar">
    <div class="floating-navbar-inner">
      <div class="flex items-center gap-4 min-w-[200px]">
        <div class="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white shadow-lg">
          <BaseIcon :name="companyIcon" class="w-5 h-5" />
        </div>
        <span class="text-2xl font-bold text-slate-900 tracking-tight">{{ companyName }}</span>
      </div>
      
      <!-- Group 2: Network Info (Centered) -->
      <div class="hidden lg:flex items-center gap-3 px-8 border-x border-slate-100 h-8">
        <BaseIcon name="GlobeAltIcon" class="w-5 h-5 text-slate-400" />
        <span class="text-sm font-semibold text-slate-600 tracking-tight whitespace-nowrap">{{ companyName }} Prividium™</span>
      </div>

      <div class="flex items-center gap-6 min-w-[200px] justify-end">
        <div v-if="wallet.isConnected.value" class="relative wallet-dropdown-container">
          <button 
            @click="dropdownOpen = !dropdownOpen"
            class="bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 px-6 py-2.5 rounded-full transition-all flex items-center gap-3 shadow-sm text-sm font-medium"
          >
            <BaseIcon name="WalletIcon" class="w-4 h-4 text-slate-500" />
            <span class="font-mono">{{ wallet.address.value?.slice(0, 6) }}...{{ wallet.address.value?.slice(-4) }}</span>
            <BaseIcon name="ChevronDownIcon" :class="{ 'rotate-180': dropdownOpen }" class="w-3 h-3 text-slate-400 transition-transform" />
          </button>
          
          <div v-if="dropdownOpen" class="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <button 
              @click="copyAddress"
              class="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors text-left"
            >
              <BaseIcon :name="copied ? 'CheckIcon' : 'DocumentDuplicateIcon'" :class="copied ? 'text-green-500' : 'text-slate-400'" class="w-4 h-4" />
              <span>{{ copied ? 'Copied!' : 'Copy Address' }}</span>
            </button>
          </div>
        </div>

        <button 
          v-else
          @click="wallet.connectWallet"
          :disabled="wallet.isConnecting.value"
          class="bg-accent text-white px-8 py-3 rounded-full font-semibold text-sm hover:opacity-90 transition-all shadow-md active:scale-95 disabled:opacity-50"
        >
          {{ wallet.isConnecting.value ? 'Connecting...' : 'Connect Wallet' }}
        </button>
        
        <button 
          @click="logout"
          title="Sign Out"
          class="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all border border-transparent hover:border-red-100"
        >
          <BaseIcon name="ArrowRightOnRectangleIcon" class="w-5 h-5" />
        </button>
      </div>
    </div>
  </nav>
</template>
