<script setup lang="ts">
const companyName = import.meta.env.VITE_COMPANY_NAME || 'Prividium™';
const year = new Date().getFullYear();
</script>

<template>
  <footer class="px-8 py-12 mt-auto relative z-10">
    <div class="max-w-7xl mx-auto flex flex-col items-center gap-8">
      <div class="flex flex-col md:flex-row justify-between items-center w-full gap-6">
        <div class="flex flex-col items-center md:items-start gap-1">
          <p class="font-semibold text-neutral-600">{{ companyName }}</p>
          <p class="text-sm text-neutral-600">&copy; {{ year }} Prividium™ Gateway</p>
        </div>

        <div class="flex gap-8 text-sm font-medium text-neutral-600">
          <a href="https://www.zksync.io/prividium" target="_blank" class="hover:text-neutral-900 transition-colors flex items-center gap-2">
            <span>Prividium™</span>
            <BaseIcon name="ArrowTopRightOnSquareIcon" class="w-3.5 h-3.5 opacity-50" />
          </a>
          <a href="https://docs.zksync.io/zk-stack/prividium/overview" target="_blank" class="hover:text-neutral-900 transition-colors flex items-center gap-2">
            <span>Documentation</span>
            <BaseIcon name="DocumentTextIcon" class="w-3.5 h-3.5 opacity-50" />
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>
