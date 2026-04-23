/**
 * 国际化配置
 * 使用 vue-i18n 管理中英文翻译，默认中文，英文为回退语言
 * legacy: false 启用 Composition API 模式
 */
import { createI18n } from 'vue-i18n'
import zh from './zh'
import en from './en'

const i18n = createI18n({
  legacy: false,
  locale: 'zh',
  fallbackLocale: 'en',
  messages: { zh, en },
})

export default i18n
