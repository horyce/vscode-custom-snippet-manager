<!-- 片段语法帮助组件：折叠展示 VS Code SnippetString 语法提示 -->
<script setup lang="ts">
import { Icon } from '@iconify/vue'

// 展开/折叠状态
const expanded = ref(false)

// 切换展开状态
function toggle() {
  expanded.value = !expanded.value
}
</script>

<template>
  <div class="syntax-help" :class="{ 'syntax-help--expanded': expanded }">
    <button class="syntax-help__header" type="button" @click="toggle">
      <Icon icon="carbon:code" width="16" height="16" />
      <span class="syntax-help__title">VS Code 片段语法提示</span>
      <Icon
        class="syntax-help__arrow"
        icon="carbon:chevron-down"
        width="16"
        height="16"
      />
    </button>
    <transition name="expand">
      <div v-show="expanded" class="syntax-help__body">
        <div class="syntax-help__grid">
          <div class="syntax-help__item">
            <code class="syntax-help__code">$1</code>
            <span class="syntax-help__desc">按 Tab 跳转的第一个位置</span>
          </div>
          <div class="syntax-help__item">
            <code class="syntax-help__code">$0</code>
            <span class="syntax-help__desc">最终光标停留位置</span>
          </div>
          <div class="syntax-help__item">
            <code class="syntax-help__code">${1:label}</code>
            <span class="syntax-help__desc">带默认值的占位符</span>
          </div>
          <div class="syntax-help__item">
            <code class="syntax-help__code">${1|a,b,c|}</code>
            <span class="syntax-help__desc">可选值下拉列表</span>
          </div>
          <div class="syntax-help__item">
            <code class="syntax-help__code">$TM_SELECTED_TEXT</code>
            <span class="syntax-help__desc">插入时自动填入选中的文本</span>
          </div>
          <div class="syntax-help__item">
            <code class="syntax-help__code">$TM_FILENAME</code>
            <span class="syntax-help__desc">当前文件名</span>
          </div>
        </div>
        <p class="syntax-help__more">更多语法（变量、正则转换等）将在后续版本补充…</p>
      </div>
    </transition>
  </div>
</template>

<style scoped lang="scss">
.syntax-help {
  border: 1px solid $border-input;
  border-radius: $radius-lg;
  background: var(--vscode-editor-background);
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    width: 100%;
    padding: 10px $spacing-md;
    border: none;
    background: transparent;
    color: $color-foreground;
    font-size: $font-size-sm;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background: var(--vscode-list-hoverBackground, rgba(255, 255, 255, 0.05));
    }
  }

  &__title {
    flex: 1;
    text-align: left;
  }

  &__arrow {
    transition: transform 0.2s ease;
  }

  &--expanded &__arrow {
    transform: rotate(180deg);
  }

  &__body {
    padding: 0 $spacing-md 12px;
    border-top: 1px solid $border-input;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px 16px;
    padding-top: 12px;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }

  &__code {
    padding: 2px 6px;
    border-radius: $radius-sm;
    background: var(--vscode-textCodeBlock-background, rgba(120, 120, 120, 0.2));
    color: var(--vscode-textPreformat-foreground, #d4d4d4);
    font-family: var(--vscode-editor-font-family, monospace);
    font-size: $font-size-xs;
    white-space: nowrap;
  }

  &__desc {
    color: $color-description;
    font-size: $font-size-xs;
  }

  &__more {
    margin: 12px 0 0;
    color: $color-description;
    font-size: $font-size-xs;
    opacity: 0.7;
  }
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 300px;
}
</style>
