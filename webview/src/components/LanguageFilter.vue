<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { SUPPORTED_LANGUAGES } from '../types'

const model = defineModel<string>({ required: true })

const { t } = useI18n()

const options = [
  { label: t('filter.all'), value: '*' },
  ...SUPPORTED_LANGUAGES.filter((l) => l.value !== '*').map((l) => ({
    label: l.label,
    value: l.value,
  })),
]
</script>

<template>
  <n-select
    v-model:value="model"
    :options="options"
    :placeholder="t('filter.label')"
    size="small"
    clearable
    @clear="model = '*'"
  />
</template>
