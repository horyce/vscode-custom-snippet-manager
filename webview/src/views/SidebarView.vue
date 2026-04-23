<!-- 侧边栏视图组件：展示代码片段列表，支持搜索、筛选、新建/编辑/删除 -->
<script setup lang="ts">
/**
 * 侧边栏视图组件
 * 点击新建或编辑时通过 postMessage 通知后端打开编辑器面板
 * 操作按钮使用原生 HTML 确保在 webview 中点击可靠
 * 删除确认弹窗使用自定义浮层替代 n-modal，避免 teleport 兼容问题
 */
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import Fuse from 'fuse.js'
import type { Snippet } from '../types'
import { SUPPORTED_LANGUAGES } from '../types'
import { postToExt, onExtMessage } from '../composables/useMessage'

const { t, locale } = useI18n()

// 片段列表数据
const snippets = ref<Snippet[]>([])
// 搜索关键词
const searchQuery = ref('')
// 语言筛选值，'*' 表示全部
const languageFilter = ref('*')
// 当前待删除的片段，用于弹窗确认
const deletingSnippet = ref<Snippet | null>(null)

// 语言下拉选项，动态生成以支持 i18n
const languageOptions = computed(() => [
  { label: t('filter.all'), value: '*' },
  ...SUPPORTED_LANGUAGES.filter((l) => l.value !== '*').map((l) => ({
    label: l.label,
    value: l.value,
  })),
])

// 根据 Fuse.js 模糊搜索 + 语言筛选过滤片段列表
const filteredSnippets = computed(() => {
  let result = snippets.value

  // 按语言筛选
  if (languageFilter.value && languageFilter.value !== '*') {
    result = result.filter(
      (s) => s.language === languageFilter.value || s.language === '*'
    )
  }

  // 按关键词模糊搜索
  if (searchQuery.value.trim()) {
    const fuse = new Fuse(result, {
      keys: ['name', 'prefix', 'description'],
      threshold: 0.4,
    })
    return fuse.search(searchQuery.value).map((r) => r.item)
  }

  return result
})

/** 获取语言缩写图标，用于列表项的语言标签 */
function getLanguageIcon(lang: string): string {
  const iconMap: Record<string, string> = {
    javascript: 'JS', typescript: 'TS', python: 'PY', html: 'HT',
    css: 'CS', json: 'JS', java: 'JA', csharp: 'C#',
    cpp: 'C+', c: 'C', go: 'GO', rust: 'RS',
    php: 'PH', ruby: 'RB', swift: 'SW', kotlin: 'KT',
    vue: 'VU', javascriptreact: 'JX', typescriptreact: 'TX',
    scss: 'SC', less: 'LE', shellscript: 'SH', sql: 'SQ',
    yaml: 'YM', xml: 'XM', dart: 'DA', lua: 'LU',
    r: 'R', dockerfile: 'DK', markdown: 'MD',
  }
  return iconMap[lang] || lang.substring(0, 2).toUpperCase()
}

/** 获取语言对应的品牌色，用于语言标签的背景和边框 */
function getLanguageColor(lang: string): string {
  const colorMap: Record<string, string> = {
    javascript: '#f7df1e', typescript: '#3178c6', python: '#3776ab',
    html: '#e34f26', css: '#1572b6', json: '#292929', java: '#ed8b00',
    csharp: '#239120', cpp: '#00599c', c: '#a8b9cc', go: '#00add8',
    rust: '#dea584', php: '#777bb4', ruby: '#cc342d', swift: '#fa7343',
    kotlin: '#7f52ff', vue: '#4fc08d', javascriptreact: '#61dafb',
    typescriptreact: '#61dafb', scss: '#cc6699', less: '#1d365d',
    shellscript: '#89e051', sql: '#e38c00', yaml: '#cb171e',
    xml: '#e37933', dart: '#0175c2', lua: '#000080', r: '#276dc3',
    dockerfile: '#2496ed', markdown: '#083fa1',
  }
  return colorMap[lang] || 'var(--vscode-textPreformat-foreground)'
}

/** 点击新建按钮，通知后端打开空白编辑器 */
function handleCreate() {
  postToExt('openEditor', null)
}

/** 点击编辑按钮，通知后端打开编辑器并传入片段数据 */
/** 使用展开运算符将 Vue 响应式 Proxy 转为纯对象，确保 postMessage 能正确序列化 */
function handleEdit(snippet: Snippet) {
  postToExt('openEditor', { ...snippet })
}

/** 点击删除按钮，弹出确认弹窗 */
function handleDelete(snippet: Snippet) {
  deletingSnippet.value = snippet
}

/** 确认删除，发送删除消息并关闭弹窗 */
function handleDeleteConfirm() {
  if (deletingSnippet.value) {
    postToExt('deleteSnippet', { id: deletingSnippet.value.id })
  }
  deletingSnippet.value = null
}

/** 取消删除，关闭弹窗 */
function handleDeleteCancel() {
  deletingSnippet.value = null
}

/** 切换中英文语言 */
function toggleLocale() {
  locale.value = locale.value === 'zh' ? 'en' : 'zh'
}

// 监听后端返回的片段列表数据（包括删除后自动刷新）
onExtMessage('snippetsList', (payload) => {
  snippets.value = payload as Snippet[]
})

// 组件挂载时请求片段列表
onMounted(() => {
  postToExt('getSnippets')
})
</script>

<template>
  <div class="sidebar-view">
    <!-- 顶部标题栏：标题 + 语言切换 + 新建按钮 -->
    <div class="sidebar-header">
      <div class="header-row">
        <h3 class="header-title">{{ t('app.title') }}</h3>
        <n-button size="tiny" quaternary class="locale-btn" @click="toggleLocale">
          {{ t('lang.switchTo') }}
        </n-button>
      </div>
      <!-- 新建片段按钮，点击后打开编辑器面板 -->
      <n-button type="primary" size="small" block class="create-btn" @click="handleCreate">
        <template #icon>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </template>
        {{ t('actions.create') }}
      </n-button>
    </div>

    <!-- 搜索框 -->
    <div class="sidebar-search">
      <n-input
        v-model:value="searchQuery"
        :placeholder="t('list.searchPlaceholder')"
        clearable
        size="small"
      >
        <template #prefix>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </template>
      </n-input>
    </div>

    <!-- 语言筛选下拉 -->
    <div class="sidebar-filter">
      <n-select
        v-model:value="languageFilter"
        :options="languageOptions"
        :placeholder="t('filter.label')"
        size="small"
        consistent-menu-width
      />
    </div>

    <!-- 片段列表区域 -->
    <div class="sidebar-list">
      <!-- 空状态：没有任何片段 -->
      <div v-if="snippets.length === 0" class="empty-state">
        <div class="empty-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.3">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
        </div>
        <p class="empty-title">{{ t('list.empty') }}</p>
        <p class="empty-desc">{{ t('list.emptyDesc') }}</p>
      </div>

      <!-- 筛选无结果 -->
      <div v-else-if="filteredSnippets.length === 0" class="empty-state">
        <p class="empty-desc">{{ t('list.empty') }}</p>
      </div>

      <!-- 片段列表 -->
      <div v-else class="snippet-items">
        <div
          v-for="snippet in filteredSnippets"
          :key="snippet.id"
          class="snippet-item"
        >
          <!-- 片段信息：名称、语言标签、前缀、描述 -->
          <div class="item-main">
            <div class="item-top">
              <span class="item-name">{{ snippet.name }}</span>
              <!-- 语言标签，使用对应品牌色 -->
              <span
                class="lang-badge"
                :style="{ backgroundColor: getLanguageColor(snippet.language) + '22', color: getLanguageColor(snippet.language), borderColor: getLanguageColor(snippet.language) + '44' }"
              >
                {{ snippet.language === '*' ? t('form.allLanguages') : getLanguageIcon(snippet.language) }}
              </span>
            </div>
            <div class="item-meta">
              <code class="item-prefix">{{ snippet.prefix }}</code>
              <span v-if="snippet.description" class="item-desc">{{ snippet.description }}</span>
            </div>
          </div>
          <!-- 操作按钮区：使用原生 button 确保点击可靠，悬浮时显示 -->
          <div class="item-actions">
            <!-- 编辑按钮 -->
            <button class="action-btn" :title="t('actions.edit')" @click.stop="handleEdit(snippet)">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <!-- 删除按钮 -->
            <button class="action-btn action-btn-danger" :title="t('actions.delete')" @click.stop="handleDelete(snippet)">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 删除确认弹窗：自定义浮层，避免 n-modal 的 teleport 兼容问题 -->
    <div v-if="deletingSnippet" class="modal-overlay" @click.self="handleDeleteCancel">
      <div class="modal-dialog">
        <div class="modal-header">
          <span class="modal-title">{{ t('delete.title') }}</span>
        </div>
        <div class="modal-body">
          <p>{{ t('delete.content', { name: deletingSnippet?.name }) }}</p>
        </div>
        <div class="modal-footer">
          <button class="modal-btn modal-btn-cancel" @click="handleDeleteCancel">{{ t('delete.cancel') }}</button>
          <button class="modal-btn modal-btn-danger" @click="handleDeleteConfirm">{{ t('delete.confirm') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 侧边栏整体布局：纵向排列，撑满视口高度 */
.sidebar-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

/* 顶部标题栏，底部带分隔线 */
.sidebar-header {
  padding: 12px 12px 8px;
  border-bottom: 1px solid var(--vscode-panel-border, rgba(255,255,255,0.06));
}

/* 标题行：标题与语言切换按钮两端对齐 */
.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.header-title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--vscode-editor-foreground);
}

/* 语言切换按钮，降低视觉权重 */
.locale-btn {
  font-size: 11px;
  opacity: 0.7;
}

.create-btn {
  font-weight: 500;
}

.sidebar-search {
  padding: 8px 12px 4px;
}

.sidebar-filter {
  padding: 4px 12px 8px;
}

/* 列表区域：占据剩余空间，可滚动 */
.sidebar-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 8px 8px;
}

/* 空状态居中展示 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  text-align: center;
}

.empty-icon {
  margin-bottom: 12px;
  color: var(--vscode-editor-foreground);
}

.empty-title {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 500;
  color: var(--vscode-editor-foreground);
  opacity: 0.7;
}

.empty-desc {
  margin: 0;
  font-size: 12px;
  color: var(--vscode-descriptionForeground);
  line-height: 1.5;
}

/* 列表项容器，紧凑间距 */
.snippet-items {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* 单个片段项：横向布局，悬浮高亮 */
.snippet-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: default;
  transition: background-color 0.15s ease;
}

.snippet-item:hover {
  background-color: var(--vscode-list-hoverBackground, rgba(255,255,255,0.04));
}

/* 片段信息区域，占满剩余宽度 */
.item-main {
  flex: 1;
  min-width: 0;
}

/* 名称行：片段名 + 语言标签 */
.item-top {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
}

/* 片段名称，超长时省略 */
.item-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--vscode-editor-foreground);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 语言标签：使用品牌色背景和边框 */
.lang-badge {
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 600;
  padding: 0 5px;
  border-radius: 3px;
  border: 1px solid;
  line-height: 16px;
  letter-spacing: 0.3px;
}

/* 元信息行：前缀 + 描述 */
.item-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

/* 触发前缀，等宽字体显示 */
.item-prefix {
  flex-shrink: 0;
  font-size: 11px;
  font-family: var(--vscode-editor-font-family, 'Cascadia Code', Consolas, monospace);
  background-color: var(--vscode-textCodeBlock-background, rgba(255,255,255,0.06));
  color: var(--vscode-textPreformat-foreground);
  padding: 0 4px;
  border-radius: 3px;
}

/* 描述文本，超长时省略 */
.item-desc {
  font-size: 11px;
  color: var(--vscode-descriptionForeground);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 操作按钮区：默认隐藏，悬浮时显示 */
.item-actions {
  flex-shrink: 0;
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.snippet-item:hover .item-actions {
  opacity: 1;
}

/* 原生操作按钮：重置默认样式，确保点击区域足够大 */
.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--vscode-editor-foreground);
  opacity: 0.7;
  cursor: pointer;
  transition: background-color 0.15s, opacity 0.15s;
}

.action-btn:hover {
  background: var(--vscode-toolbar-hoverBackground, rgba(255,255,255,0.08));
  opacity: 1;
}

/* 删除按钮悬浮时变红 */
.action-btn-danger:hover {
  color: var(--vscode-errorForeground, #f48771);
  background: rgba(244, 135, 113, 0.1);
}

/* ===== 删除确认弹窗 ===== */

/* 遮罩层：半透明背景，点击可关闭 */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
}

/* 弹窗卡片 */
.modal-dialog {
  width: 320px;
  max-width: 90%;
  background: var(--vscode-editorWidget-background, #252526);
  border: 1px solid var(--vscode-panel-border, rgba(255,255,255,0.1));
  border-radius: 8px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
  overflow: hidden;
}

.modal-header {
  padding: 14px 16px 0;
}

.modal-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--vscode-editor-foreground);
}

.modal-body {
  padding: 12px 16px 16px;
}

.modal-body p {
  margin: 0;
  font-size: 13px;
  color: var(--vscode-descriptionForeground);
  line-height: 1.5;
}

/* 弹窗底部按钮栏 */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--vscode-panel-border, rgba(255,255,255,0.06));
}

/* 弹窗按钮基础样式 */
.modal-btn {
  padding: 4px 14px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s;
}

/* 取消按钮 */
.modal-btn-cancel {
  background: var(--vscode-button-secondaryBackground, #3a3d41);
  color: var(--vscode-button-secondaryForeground, #fff);
}

.modal-btn-cancel:hover {
  background: var(--vscode-button-secondaryHoverBackground, #45494e);
}

/* 危险操作按钮（删除确认） */
.modal-btn-danger {
  background: var(--vscode-errorBackground, #5a1d1d);
  color: var(--vscode-errorForeground, #f48771);
}

.modal-btn-danger:hover {
  background: rgba(244, 135, 113, 0.2);
}
</style>
