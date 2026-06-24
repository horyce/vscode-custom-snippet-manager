/**
 * 前端语言配置入口
 * 从后端共享配置 src/shared/languages.ts re-export 语言配置数据
 * 本文件仅保留前端专用的"所有语言"选项、颜色/图标查询等辅助函数
 */
import { LANGUAGE_CONFIGS, type LanguageConfig } from '../../../src/shared/languages'

// re-export 共享类型与配置，供前端模块使用
export { LANGUAGE_CONFIGS, type LanguageConfig }

/** "所有语言"通配项 */
const ALL_LANGUAGES: LanguageConfig = {
  value: '*',
  label: 'All Languages',
  icon: 'carbon:code',
  color: 'var(--vscode-textPreformat-foreground)',
  aliases: [],
}

/** 支持的语言列表（含"所有语言"选项），用于下拉选择 */
export const SUPPORTED_LANGUAGES = [
  ALL_LANGUAGES,
  ...LANGUAGE_CONFIGS,
]

/** 按 value 快速查找语言配置 */
const configByValue = new Map(LANGUAGE_CONFIGS.map((c) => [c.value, c]))

/** 获取语言的品牌色 */
export function getLanguageColor(lang: string): string {
  return configByValue.get(lang)?.color ?? 'var(--vscode-textPreformat-foreground)'
}

/** 获取语言的 Iconify 图标标识 */
export function getLanguageIcon(lang: string): string {
  return configByValue.get(lang)?.icon ?? 'carbon:code'
}
