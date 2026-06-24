/**
 * 导入导出对话框状态管理 composable
 * 从 SidebarView.vue 提取，管理导出范围、重复策略、导入存放方式三个对话框的状态和消息监听
 */
import type { Ref } from 'vue'
import type { Snippet, Folder } from '../types'
import { DEFAULT_FOLDER_ID } from '../types'
import { postToExt, onExtMessage } from './useMessage'

/** 确认弹窗配置（与 useConfirm 的 ConfirmOptions 兼容） */
interface ConfirmOptions {
  title: string
  content: string
  confirmLabel: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
}

/** composable 依赖配置 */
interface UseImportExportDialogsOptions {
  /** 文件夹清单（用于导出对话框显示列表） */
  folders: Ref<Folder[]>
  /** 片段列表（用于判断是否有数据可导出） */
  snippets: Ref<Snippet[]>
  /** i18n 翻译函数 */
  t: (key: string, params?: Record<string, unknown>) => string
  /** 显示确认弹窗 */
  showConfirm: (options: ConfirmOptions) => void
  /** 显示错误通知 */
  showError: (msg: string) => void
  /** 显示成功通知 */
  showSuccess: (msg: string) => void
  /** 显示警告通知 */
  showWarning: (msg: string) => void
}

/** 导出文件夹选择对话框状态 */
interface ExportDialogState {
  visible: boolean
  selectedIds: Set<string>
}

/** 重复片段策略对话框状态 */
interface DuplicateDialogState {
  visible: boolean
  count: number
}

/** 导入存放方式对话框状态 */
interface PlacementDialogState {
  visible: boolean
  // 来源文件夹推荐名（来自导入 JSON 的 folder.name）
  suggestedName: string
  // 待导入片段数量
  count: number
  // 可选的已有文件夹清单
  folders: Folder[]
  // 当前选择的存放模式
  mode: 'new' | 'existing'
  // 新建文件夹名称输入
  newName: string
  // 导入到已有文件夹时选中的文件夹 id
  targetFolderId: string
  // 名称校验错误的 i18n key，空表示无错误
  nameError: string
}

export function useImportExportDialogs(options: UseImportExportDialogsOptions) {
  const { folders, snippets, t, showConfirm, showError, showSuccess, showWarning } = options

  // ===== 导出文件夹选择对话框 =====
  const exportDialog = ref<ExportDialogState>({
    visible: false,
    selectedIds: new Set(),
  })

  /** 点击导出配置按钮，打开文件夹多选对话框（默认全选） */
  function handleExport() {
    if (snippets.value.length === 0) {
      showError(t('importExport.noDataToExport'))
      return
    }
    // 默认勾选全部文件夹
    exportDialog.value = {
      visible: true,
      selectedIds: new Set(folders.value.map((f) => f.id)),
    }
  }

  /** 是否已全选 */
  const exportAllSelected = computed(
    () => folders.value.length > 0 && exportDialog.value.selectedIds.size === folders.value.length
  )

  /** 切换单个文件夹勾选状态 */
  function toggleExportFolder(folderId: string) {
    const next = new Set(exportDialog.value.selectedIds)
    if (next.has(folderId)) {
      next.delete(folderId)
    } else {
      next.add(folderId)
    }
    exportDialog.value.selectedIds = next
  }

  /** 切换全选/全不选 */
  function toggleExportAll() {
    if (exportAllSelected.value) {
      exportDialog.value.selectedIds = new Set()
    } else {
      exportDialog.value.selectedIds = new Set(folders.value.map((f) => f.id))
    }
  }

  /** 确认导出：将勾选的文件夹 id 列表发送给后端，每个文件夹各导出一个 JSON */
  function confirmExport() {
    const ids = Array.from(exportDialog.value.selectedIds)
    if (ids.length === 0) {
      return
    }
    exportDialog.value.visible = false
    postToExt('exportSnippets', { folderIds: ids })
  }

  /** 取消导出 */
  function cancelExport() {
    exportDialog.value.visible = false
  }

  /** 点击导入配置按钮 */
  function handleImport() {
    showConfirm({
      title: t('importExport.importConfirmTitle'),
      content: t('importExport.importConfirmContent'),
      confirmLabel: t('importExport.importConfig'),
      danger: true,
      onConfirm: () => {
        postToExt('importSnippets')
      },
    })
  }

  // 监听后端返回的导出结果
  onExtMessage('exportResult', (payload) => {
    const result = payload as {
      success: boolean
      folderCount?: number
      count?: number
      failedCount?: number
      failedNames?: string[]
    }
    if (result.success) {
      // 部分文件夹导出失败时给出警告提示，让用户知道并非全部成功
      if (result.failedCount && result.failedCount > 0) {
        showWarning(
          t('importExport.exportPartialDetail', {
            folderCount: result.folderCount ?? 0,
            failedCount: result.failedCount,
          })
        )
      } else {
        showSuccess(
          t('importExport.exportSuccessDetail', {
            folderCount: result.folderCount ?? 0,
            count: result.count ?? 0,
          })
        )
      }
    } else if (result.failedCount && result.failedCount > 0) {
      // 全部导出失败时显示错误
      showError(t('importExport.exportFailed'))
    }
  })

  // 监听后端返回的导入结果
  onExtMessage('importResult', (payload) => {
    const result = payload as {
      imported: number
      skipped: number
      overwritten: number
      merged: number
      total: number
      folderName: string
      errors: string[]
    }
    if (result.errors.length > 0) {
      showWarning(
        t('importExport.importPartialDetail', {
          imported: result.imported,
          errors: result.errors.length,
        })
      )
    } else {
      showSuccess(
        t('importExport.importSuccessDetail', {
          count: result.imported,
          folder: result.folderName || t('folder.defaultName'),
        })
      )
    }
  })

  // 监听后端返回的导入错误（文件读取失败、JSON 无效、验证失败等）
  onExtMessage('importError', (payload) => {
    const data = payload as { errorKey: string; errorParams?: Record<string, string | number> }
    showError(t(`importExport.${data.errorKey}`, data.errorParams ?? {}))
  })

  // ===== 重复片段策略对话框 =====
  const duplicateDialog = ref<DuplicateDialogState>({
    visible: false,
    count: 0,
  })

  // 监听后端请求显示重复策略对话框
  onExtMessage('showDuplicateDialog', (payload) => {
    const data = payload as { count: number }
    duplicateDialog.value = {
      visible: true,
      count: data.count,
    }
  })

  /** 用户选择重复处理策略，通知后端 */
  function handleDuplicateStrategy(strategy: string) {
    duplicateDialog.value.visible = false
    postToExt('duplicateStrategyChoice', strategy)
  }

  /** 用户取消重复策略对话框 */
  function handleDuplicateCancel() {
    duplicateDialog.value.visible = false
    postToExt('duplicateStrategyChoice', null)
  }

  // ===== 导入存放方式对话框 =====
  const placementDialog = ref<PlacementDialogState>({
    visible: false,
    suggestedName: '',
    count: 0,
    folders: [],
    mode: 'new',
    newName: '',
    targetFolderId: DEFAULT_FOLDER_ID,
    nameError: '',
  })

  // 监听后端请求显示导入存放方式对话框
  onExtMessage('showImportPlacementDialog', (payload) => {
    const data = payload as { suggestedName: string; count: number; folders: Folder[] }
    const list = Array.isArray(data.folders) ? data.folders : []
    placementDialog.value = {
      visible: true,
      suggestedName: data.suggestedName ?? '',
      count: data.count ?? 0,
      folders: list,
      mode: 'new',
      // 推荐名为空（来源为默认文件夹）时留空让用户填写
      newName: data.suggestedName ?? '',
      targetFolderId: list[0]?.id ?? DEFAULT_FOLDER_ID,
      nameError: '',
    }
  })

  /** 导入存放方式对话框的文件夹下拉选项，默认文件夹用 i18n 名称 */
  const placementFolderOptions = computed(() =>
    placementDialog.value.folders.map((f) => ({
      value: f.id,
      label: f.id === DEFAULT_FOLDER_ID ? t('folder.defaultName') : f.name,
    }))
  )

  /** 校验新建文件夹名称：非空且不与现有文件夹重名（忽略大小写、去空格） */
  function validatePlacementName(): boolean {
    const trimmed = placementDialog.value.newName.trim()
    if (!trimmed) {
      placementDialog.value.nameError = 'folder.nameRequired'
      return false
    }
    const lower = trimmed.toLowerCase()
    // 使用 f.name 校验，与后端 folderNameExists 逻辑一致
    // 默认文件夹 name 为空字符串，不会与用户输入冲突
    const conflict = placementDialog.value.folders.some(
      (f) => f.name.trim().toLowerCase() === lower
    )
    if (conflict) {
      placementDialog.value.nameError = 'importExport.placementNameConflict'
      return false
    }
    placementDialog.value.nameError = ''
    return true
  }

  /** 确认存放方式，回传后端 */
  function confirmPlacement() {
    if (placementDialog.value.mode === 'new') {
      if (!validatePlacementName()) {
        return
      }
      const name = placementDialog.value.newName.trim()
      placementDialog.value.visible = false
      postToExt('importPlacementChoice', { mode: 'new', name })
    } else {
      placementDialog.value.visible = false
      postToExt('importPlacementChoice', { mode: 'existing', folderId: placementDialog.value.targetFolderId })
    }
  }

  /** 取消存放方式选择，终止导入 */
  function cancelPlacement() {
    placementDialog.value.visible = false
    postToExt('importPlacementChoice', null)
  }

  return {
    // 导出对话框
    exportDialog,
    exportAllSelected,
    handleExport,
    toggleExportFolder,
    toggleExportAll,
    confirmExport,
    cancelExport,
    // 导入
    handleImport,
    // 重复策略对话框
    duplicateDialog,
    handleDuplicateStrategy,
    handleDuplicateCancel,
    // 导入存放方式对话框
    placementDialog,
    placementFolderOptions,
    confirmPlacement,
    cancelPlacement,
  }
}
