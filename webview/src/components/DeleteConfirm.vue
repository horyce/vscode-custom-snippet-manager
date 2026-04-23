<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Snippet } from '../types'

defineProps<{
  snippet: Snippet | null
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const { t } = useI18n()
</script>

<template>
  <n-modal
    v-if="snippet"
    preset="dialog"
    :title="t('delete.title')"
    type="error"
    :positive-text="t('delete.confirm')"
    :negative-text="t('delete.cancel')"
    @positive-click="emit('confirm')"
    @negative-click="emit('cancel')"
    @close="emit('cancel')"
  >
    <p>{{ t('delete.content', { name: snippet?.name }) }}</p>
  </n-modal>
</template>
