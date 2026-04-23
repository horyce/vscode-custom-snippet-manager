/**
 * 应用入口文件
 * 初始化 Vue 应用，注册 Naive UI 组件库和 vue-i18n 国际化插件
 */
import { createApp } from 'vue'
import naive from 'naive-ui'
import i18n from './i18n'
import App from './App.vue'

const app = createApp(App)
// 注册 Naive UI 组件库，提供 Button、Input、Form 等组件
app.use(naive)
// 注册国际化插件，支持中英文切换
app.use(i18n)
app.mount('#app')
