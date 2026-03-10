<script setup lang="ts">
import * as OutlineIcons from '@heroicons/vue/24/outline';
import { computed } from 'vue';

interface Props {
  name: string;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  class: 'w-6 h-6'
});

const iconComponent = computed(() => {
  // @ts-ignore - Dynamic access to icon set
  return OutlineIcons[props.name] || OutlineIcons.QuestionMarkCircleIcon;
});
</script>

<template>
  <component :is="iconComponent" :class="props.class" aria-hidden="true" />
</template>
