/**
 * 国际化配置
 * 使用 vue-i18n 管理多语言翻译
 * 启动时从 window.__LOCALE 读取后端注入的语言偏好，确保侧边栏和编辑器语言同步
 * legacy: false 启用 Composition API 模式
 */
import { createI18n } from 'vue-i18n'
import zh from '@/i18n/zh'
import zhTW from '@/i18n/zh-TW'
import en from '@/i18n/en'
import ja from '@/i18n/ja'
import ko from '@/i18n/ko'
import ru from '@/i18n/ru'
import de from '@/i18n/de'
import fr from '@/i18n/fr'
import es from '@/i18n/es'
import pt from '@/i18n/pt'
import it from '@/i18n/it'
import pl from '@/i18n/pl'
import tr from '@/i18n/tr'
import sv from '@/i18n/sv'
import da from '@/i18n/da'
import fi from '@/i18n/fi'
import nl from '@/i18n/nl'
import cs from '@/i18n/cs'
import hu from '@/i18n/hu'
import th from '@/i18n/th'
import vi from '@/i18n/vi'
import uk from '@/i18n/uk'
import ro from '@/i18n/ro'
import el from '@/i18n/el'
import hi from '@/i18n/hi'
import type { LocaleOption } from '@/i18n/locales'

/** 支持的语言列表，用于语言切换下拉菜单 */
export { SUPPORTED_LOCALES } from '@/i18n/locales'
export type { LocaleOption } from '@/i18n/locales'

/** 语言标识符类型 */
export type LocaleValue = LocaleOption['value']

// 读取后端注入的语言偏好，默认简体中文
const savedLocale = window.__LOCALE || 'zh'

const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'en',
  messages: { zh, 'zh-TW': zhTW, en, ja, ko, ru, de, fr, es, pt, it, pl, tr, sv, da, fi, nl, cs, hu, th, vi, uk, ro, el, hi },
})

export default i18n
