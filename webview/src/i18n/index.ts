/**
 * 国际化配置
 * 使用 vue-i18n 管理多语言翻译
 * 启动时从 window.__LOCALE 读取后端注入的语言偏好，确保侧边栏和编辑器语言同步
 * legacy: false 启用 Composition API 模式
 */
import { createI18n } from 'vue-i18n'
import zh from './zh'
import zhTW from './zh-TW'
import en from './en'
import ja from './ja'
import ko from './ko'

/** 支持的语言列表，用于语言切换下拉菜单 */
export const SUPPORTED_LOCALES = [
  { value: 'zh', label: '简体中文' },
  { value: 'zh-TW', label: '繁體中文' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
] as const

/** 语言标识符类型 */
export type LocaleValue = typeof SUPPORTED_LOCALES[number]['value']

// 读取后端注入的语言偏好，默认简体中文
const savedLocale = window.__LOCALE || 'zh'

const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'en',
  messages: { zh, 'zh-TW': zhTW, en, ja, ko },
})

export default i18n
