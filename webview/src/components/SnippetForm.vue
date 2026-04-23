<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Snippet } from '../types'
import { SUPPORTED_LANGUAGES } from '../types'

const props = defineProps<{
  snippet?: Snippet | null
}>()

const emit = defineEmits<{
  save: [data: Omit<Snippet, 'id'>]
  cancel: []
}>()

const { t } = useI18n()

const form = ref({
  name: '',
  prefix: '',
  body: '',
  description: '',
  language: '*',
})

const formRef = ref()

// 编辑模式下回填数据
watch(
  () => props.snippet,
  (val) => {
    if (val) {
      form.value = {
        name: val.name,
        prefix: val.prefix,
        body: val.body,
        description: val.description,
        language: val.language,
      }
    } else {
      form.value = { name: '', prefix: '', body: '', description: '', language: '*' }
    }
  },
  { immediate: true }
)

const rules = {
  name: { required: true, message: () => t('form.nameRequired'), trigger: 'blur' },
  prefix: { required: true, message: () => t('form.prefixRequired'), trigger: 'blur' },
  body: { required: true, message: () => t('form.bodyRequired'), trigger: 'blur' },
}

const languageOptions = SUPPORTED_LANGUAGES.map((l) => ({
  label: l.value === '*' ? t('form.allLanguages') : l.label,
  value: l.value,
}))

async function handleSave() {
  try {
    await formRef.value?.validate()
    emit('save', { ...form.value })
  } catch {
    // 校验未通过
  }
}
</script>

<template>
  <div class="snippet-form">
    <h3 class="form-title">
      {{ snippet ? t('form.editTitle') : t('form.createTitle') }}
    </h3>

    <n-form ref="formRef" :model="form" :rules="rules" label-placement="top" size="small">
      <n-form-item :label="t('form.name')" path="name">
        <n-input v-model:value="form.name" :placeholder="t('form.namePlaceholder')" />
      </n-form-item>

      <n-form-item :label="t('form.prefix')" path="prefix">
        <n-input v-model:value="form.prefix" :placeholder="t('form.prefixPlaceholder')" />
      </n-form-item>

      <n-form-item :label="t('form.body')" path="body">
        <n-input
          v-model:value="form.body"
          type="textarea"
          :placeholder="t('form.bodyPlaceholder')"
          :rows="6"
          :autosize="{ minRows: 4, maxRows: 12 }"
          font="monospace"
        />
      </n-form-item>

      <n-form-item :label="t('form.description')" path="description">
        <n-input v-model:value="form.description" :placeholder="t('form.descriptionPlaceholder')" />
      </n-form-item>

      <n-form-item :label="t('form.language')" path="language">
        <n-select v-model:value="form.language" :options="languageOptions" />
      </n-form-item>

      <div class="form-actions">
        <n-button type="primary" @click="handleSave">{{ t('form.save') }}</n-button>
        <n-button @click="emit('cancel')">{{ t('form.cancel') }}</n-button>
      </div>
    </n-form>
  </div>
</template>

<style scoped>
.snippet-form {
  padding: 0 4px;
}

.form-title {
  margin: 0 0 16px 0;
  font-size: 16px;
}

.form-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 8px;
}
</style>
