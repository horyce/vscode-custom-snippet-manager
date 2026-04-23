<!-- 编辑器视图组件：片段新建/编辑表单，保存后自动关闭并刷新侧边栏 -->
<script setup lang="ts">
/**
 * 编辑器视图组件
 * 支持新建和编辑两种模式，通过后端 setSnippet 消息切换
 */
import { ref, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Snippet } from '../types'
import { SUPPORTED_LANGUAGES } from '../types'
import { postToExt, onExtMessage } from '../composables/useMessage'

const { t } = useI18n()

// 当前编辑的片段数据，为 null 时表示新建模式
const editingSnippet = ref<Snippet | null>(null)
// 表单数据
const form = ref({
  name: '',
  prefix: '',
  body: '',
  description: '',
  language: '*',
})
// Naive UI 表单引用，用于触发表单校验
const formRef = ref()
// 保存中状态，防止重复提交
const saving = ref(false)

// 语言下拉选项
const languageOptions = SUPPORTED_LANGUAGES.map((l) => ({
  label: l.value === '*' ? t('form.allLanguages') : l.label,
  value: l.value,
}))

// 是否为编辑模式
const isEditing = ref(false)

// 监听编辑片段变化，回填或清空表单
watch(
  () => editingSnippet.value,
  (val) => {
    if (val) {
      // 编辑模式：回填片段数据到表单
      isEditing.value = true
      form.value = {
        name: val.name,
        prefix: val.prefix,
        body: val.body,
        description: val.description,
        language: val.language,
      }
    } else {
      // 新建模式：清空表单
      isEditing.value = false
      form.value = { name: '', prefix: '', body: '', description: '', language: '*' }
    }
  },
  { immediate: true }
)

// 表单校验规则：名称、前缀、代码内容为必填
const rules = {
  name: { required: true, message: () => t('form.nameRequired'), trigger: 'blur' },
  prefix: { required: true, message: () => t('form.prefixRequired'), trigger: 'blur' },
  body: { required: true, message: () => t('form.bodyRequired'), trigger: 'blur' },
}

/** 保存片段：校验通过后发送创建或更新消息 */
async function handleSave() {
  try {
    await formRef.value?.validate()
    saving.value = true
    if (editingSnippet.value) {
      // 编辑模式：发送更新消息
      postToExt('updateSnippet', { id: editingSnippet.value.id, ...form.value })
    } else {
      // 新建模式：发送创建消息
      postToExt('createSnippet', { ...form.value })
    }
  } catch {
    // 校验未通过，不执行保存
  } finally {
    saving.value = false
  }
}

/** 关闭编辑器面板 */
function handleClose() {
  postToExt('closeEditor', null)
}

// 监听后端发送的片段数据，进入编辑模式
onExtMessage('setSnippet', (payload) => {
  editingSnippet.value = payload as Snippet
})

// 创建成功后关闭面板
onExtMessage('snippetCreated', () => {
  handleClose()
})

// 更新成功后关闭面板
onExtMessage('snippetUpdated', () => {
  handleClose()
})

// 组件挂载时通知后端编辑器已就绪
onMounted(() => {
  postToExt('editorReady', null)
})
</script>

<template>
  <div class="editor-view">
    <!-- 顶部标题栏：图标 + 标题 -->
    <div class="editor-header">
      <div class="header-left">
        <!-- 编辑图标，使用 VS Code 按钮色作为背景 -->
        <div class="header-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </div>
        <!-- 根据模式显示不同标题 -->
        <h3 class="header-title">
          {{ isEditing ? t('form.editTitle') : t('form.createTitle') }}
        </h3>
      </div>
    </div>

    <!-- 表单主体区域，可滚动 -->
    <div class="editor-body">
      <n-form ref="formRef" :model="form" :rules="rules" label-placement="top" size="medium">
        <!-- 名称和前缀并排显示 -->
        <div class="form-row">
          <n-form-item :label="t('form.name')" path="name" class="form-item-flex">
            <n-input v-model:value="form.name" :placeholder="t('form.namePlaceholder')" />
          </n-form-item>

          <n-form-item :label="t('form.prefix')" path="prefix" class="form-item-flex">
            <n-input v-model:value="form.prefix" :placeholder="t('form.prefixPlaceholder')" />
          </n-form-item>
        </div>

        <!-- 代码内容，等宽字体多行输入 -->
        <n-form-item :label="t('form.body')" path="body">
          <n-input
            v-model:value="form.body"
            type="textarea"
            :placeholder="t('form.bodyPlaceholder')"
            :rows="10"
            :autosize="{ minRows: 6, maxRows: 20 }"
            font="monospace"
            class="body-input"
          />
        </n-form-item>

        <!-- 描述和语言并排显示 -->
        <div class="form-row">
          <n-form-item :label="t('form.description')" path="description" class="form-item-flex">
            <n-input v-model:value="form.description" :placeholder="t('form.descriptionPlaceholder')" />
          </n-form-item>

          <n-form-item :label="t('form.language')" path="language" class="form-item-flex">
            <n-select v-model:value="form.language" :options="languageOptions" />
          </n-form-item>
        </div>
      </n-form>
    </div>

    <!-- 底部操作栏：取消和保存按钮 -->
    <div class="editor-footer">
      <n-button @click="handleClose">{{ t('form.cancel') }}</n-button>
      <n-button type="primary" :loading="saving" @click="handleSave">
        <template #icon>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
        </template>
        {{ t('form.save') }}
      </n-button>
    </div>
  </div>
</template>

<style scoped>
/* 编辑器整体布局：纵向三段式（头部 + 主体 + 底部） */
.editor-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

/* 顶部标题栏 */
.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 12px;
  border-bottom: 1px solid var(--vscode-panel-border, rgba(255,255,255,0.06));
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 编辑图标容器，使用主题按钮色 */
.header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--vscode-button-background, #0e639c);
  color: var(--vscode-button-foreground, #fff);
}

.header-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--vscode-editor-foreground);
}

/* 表单主体区域，可滚动 */
.editor-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}

/* 表单行：两个字段并排显示 */
.form-row {
  display: flex;
  gap: 16px;
}

.form-item-flex {
  flex: 1;
}

/* 代码输入框：使用等宽字体，适配 VS Code 编辑器风格 */
.body-input :deep(textarea) {
  font-family: var(--vscode-editor-font-family, 'Cascadia Code', Consolas, monospace) !important;
  font-size: var(--vscode-editor-font-size, 13px) !important;
  line-height: 1.6 !important;
}

/* 底部操作栏，固定在底部 */
.editor-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid var(--vscode-panel-border, rgba(255,255,255,0.06));
  background: var(--vscode-editor-background);
}
</style>
