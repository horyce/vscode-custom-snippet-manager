/**
 * 语言配置唯一数据源（前后端共享）
 * 新增语言只需在 LANGUAGE_CONFIGS 数组中添加一项，后端别名映射自动派生
 * 前端通过 webview/src/utils/languages.ts re-export 此处配置
 */

/** 单个语言的配置 */
export interface LanguageConfig {
  /** VS Code languageId，如 'javascript'、'python' */
  value: string
  /** 显示名称，如 'JavaScript'、'Python' */
  label: string
  /** Iconify 图标标识，如 'simple-icons:javascript' */
  icon: string
  /** 语言品牌色，用于语言标签样式 */
  color: string
  /** 语言别名，片段的 language 匹配这些别名时也生效 */
  aliases: string[]
}

/**
 * 语言配置表：新增语言只需在此数组中添加一项
 * 各字段说明：
 * - value: VS Code languageId，需与 VS Code 内置标识符一致
 * - label: 下拉菜单显示名称
 * - icon: Iconify 图标，格式为 "图标集:图标名"
 * - color: 语言品牌色，用于语言标签的背景/边框
 * - aliases: 别名列表，补全时片段 language 匹配别名也生效
 */
export const LANGUAGE_CONFIGS: LanguageConfig[] = [
  { value: 'javascript', label: 'JavaScript', icon: 'simple-icons:javascript', color: '#f7df1e', aliases: ['javascript', 'javascriptreact'] },
  { value: 'typescript', label: 'TypeScript', icon: 'simple-icons:typescript', color: '#3178c6', aliases: ['typescript', 'typescriptreact'] },
  { value: 'python', label: 'Python', icon: 'simple-icons:python', color: '#3776ab', aliases: ['python'] },
  { value: 'html', label: 'HTML', icon: 'simple-icons:html5', color: '#e34f26', aliases: ['html'] },
  { value: 'css', label: 'CSS', icon: 'simple-icons:css3', color: '#1572b6', aliases: ['css'] },
  { value: 'json', label: 'JSON', icon: 'mdi:code-json', color: '#292929', aliases: ['json'] },
  { value: 'markdown', label: 'Markdown', icon: 'simple-icons:markdown', color: '#083fa1', aliases: ['markdown'] },
  { value: 'java', label: 'Java', icon: 'mdi:language-java', color: '#ed8b00', aliases: ['java'] },
  { value: 'csharp', label: 'C#', icon: 'simple-icons:csharp', color: '#239120', aliases: ['csharp'] },
  { value: 'cpp', label: 'C++', icon: 'simple-icons:cplusplus', color: '#00599c', aliases: ['cpp'] },
  { value: 'c', label: 'C', icon: 'simple-icons:c', color: '#a8b9cc', aliases: ['c'] },
  { value: 'go', label: 'Go', icon: 'simple-icons:go', color: '#00add8', aliases: ['go'] },
  { value: 'rust', label: 'Rust', icon: 'simple-icons:rust', color: '#dea584', aliases: ['rust'] },
  { value: 'php', label: 'PHP', icon: 'simple-icons:php', color: '#777bb4', aliases: ['php'] },
  { value: 'ruby', label: 'Ruby', icon: 'simple-icons:ruby', color: '#cc342d', aliases: ['ruby'] },
  { value: 'swift', label: 'Swift', icon: 'simple-icons:swift', color: '#fa7343', aliases: ['swift'] },
  { value: 'kotlin', label: 'Kotlin', icon: 'simple-icons:kotlin', color: '#7f52ff', aliases: ['kotlin'] },
  { value: 'vue', label: 'Vue', icon: 'simple-icons:vuedotjs', color: '#4fc08d', aliases: ['vue'] },
  { value: 'javascriptreact', label: 'React JSX', icon: 'simple-icons:react', color: '#61dafb', aliases: ['javascriptreact'] },
  { value: 'typescriptreact', label: 'React TSX', icon: 'simple-icons:react', color: '#61dafb', aliases: ['typescriptreact'] },
  { value: 'scss', label: 'SCSS', icon: 'simple-icons:sass', color: '#cc6699', aliases: ['scss'] },
  { value: 'less', label: 'LESS', icon: 'simple-icons:less', color: '#1d365d', aliases: ['less'] },
  { value: 'shellscript', label: 'Shell', icon: 'simple-icons:gnubash', color: '#89e051', aliases: ['shellscript'] },
  { value: 'sql', label: 'SQL', icon: 'simple-icons:sqlite', color: '#e38c00', aliases: ['sql'] },
  { value: 'yaml', label: 'YAML', icon: 'mdi:file-code-outline', color: '#cb171e', aliases: ['yaml'] },
  { value: 'xml', label: 'XML', icon: 'mdi:xml', color: '#e37933', aliases: ['xml'] },
  { value: 'dart', label: 'Dart', icon: 'simple-icons:dart', color: '#0175c2', aliases: ['dart'] },
  { value: 'lua', label: 'Lua', icon: 'simple-icons:lua', color: '#000080', aliases: ['lua'] },
  { value: 'r', label: 'R', icon: 'simple-icons:r', color: '#276dc3', aliases: ['r'] },
  { value: 'dockerfile', label: 'Dockerfile', icon: 'simple-icons:docker', color: '#2496ed', aliases: ['dockerfile'] },
];

/**
 * 语言别名映射，用于代码补全时的语言匹配
 * 从 LANGUAGE_CONFIGS 自动派生，无需手动维护
 */
export const LANGUAGE_ALIASES: Record<string, string[]> = Object.fromEntries(
  LANGUAGE_CONFIGS.map((c) => [c.value, c.aliases])
);
