<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Fuse from 'fuse.js'
import type { Snippet } from '../types'

const props = defineProps<{
  snippets: Snippet[]
  searchQuery: string
  languageFilter: string
}>()

const emit = defineEmits<{
  edit: [snippet: Snippet]
  delete: [snippet: Snippet]
}>()

const { t } = useI18n()

// 根据 Fuse.js 模糊搜索 + 语言筛选过滤
const filteredSnippets = computed(() => {
  let result = props.snippets

  if (props.languageFilter && props.languageFilter !== '*') {
    result = result.filter(
      (s) => s.language === props.languageFilter || s.language === '*'
    )
  }

  if (props.searchQuery.trim()) {
    const fuse = new Fuse(result, {
      keys: ['name', 'prefix', 'description'],
      threshold: 0.4,
    })
    return fuse.search(props.searchQuery).map((r) => r.item)
  }

  return result
})

function getLanguageLabel(lang: string): string {
  if (lang === '*') return t('form.allLanguages')
  return lang
}
</script>

<template>
  <div class="snippet-list">
    <n-empty v-if="snippets.length === 0" :description="t('list.emptyDesc')">
      <template #header>
        <p style="font-size: 16px; margin: 0">{{ t('list.empty') }}</p>
      </template>
    </n-empty>

    <div v-else-if="filteredSnippets.length === 0" class="no-results">
      <n-text depth="3">{{ t('list.empty') }}</n-text>
    </div>

    <div v-else class="snippet-cards">
      <n-card
        v-for="snippet in filteredSnippets"
        :key="snippet.id"
        size="small"
        hoverable
        class="snippet-card"
      >
        <div class="card-header">
          <div class="card-title">
            <n-text strong>{{ snippet.name }}</n-text>
            <n-tag size="small" :bordered="false" type="info">
              {{ snippet.prefix }}
            </n-tag>
          </div>
          <n-tag size="tiny" :bordered="false">
            {{ getLanguageLabel(snippet.language) }}
          </n-tag>
        </div>

        <n-text v-if="snippet.description" depth="3" class="card-desc">
          {{ snippet.description }}
        </n-text>

        <n-code :code="snippet.body" language="typescript" word-wrap class="card-body" />

        <div class="card-actions">
          <n-button text type="primary" size="small" @click="emit('edit', snippet)">
            {{ t('actions.edit') }}
          </n-button>
          <n-button text type="error" size="small" @click="emit('delete', snippet)">
            {{ t('actions.delete') }}
          </n-button>
        </div>
      </n-card>
    </div>
  </div>
</template>

<style scoped>
.snippet-list {
  padding: 0 4px;
}

.no-results {
  text-align: center;
  padding: 40px 0;
}

.snippet-cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.snippet-card {
  border-radius: 6px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-desc {
  display: block;
  margin-bottom: 8px;
  font-size: 12px;
}

.card-body {
  margin-bottom: 8px;
}

.card-actions {
  display: flex;
  gap: 12px;
}
</style>
