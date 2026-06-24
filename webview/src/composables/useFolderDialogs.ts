/**
 * 文件夹管理对话框状态管理 composable
 * 从 SidebarView.vue 提取，管理文件夹编辑、删除、批量删除三个对话框的状态和操作
 */
import type { Ref } from 'vue'
import type { Snippet, Folder } from '../types'
import { DEFAULT_FOLDER_ID } from '../types'
import { postToExt } from './useMessage'

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
interface UseFolderDialogsOptions {
  /** 片段列表（用于统计文件夹下片段数量） */
  snippets: Ref<Snippet[]>
  /** 多选模式下已选中的文件夹 id 集合 */
  selectedFolderIds: Ref<Set<string>>
  /** i18n 翻译函数 */
  t: (key: string, params?: Record<string, unknown>) => string
  /** 显示确认弹窗 */
  showConfirm: (options: ConfirmOptions) => void
  /** 显示警告通知 */
  showWarning: (msg: string) => void
  /** 退出多选模式回调（批量删除成功后调用） */
  onExitMultiSelect: () => void
}

/** 文件夹编辑对话框状态：mode 区分新建和重命名 */
interface FolderDialogState {
  visible: boolean
  mode: 'create' | 'rename'
  id: string
  name: string
}

/** 删除文件夹对话框状态，展示该文件夹下的片段数量供用户决策 */
interface DeleteFolderDialogState {
  visible: boolean
  id: string
  name: string
  count: number
}

/** 批量删除文件夹对话框状态 */
interface BatchDeleteDialogState {
  visible: boolean
}

export function useFolderDialogs(options: UseFolderDialogsOptions) {
  const { snippets, selectedFolderIds, t, showConfirm, showWarning, onExitMultiSelect } = options

  // ===== 文件夹编辑对话框（新建/重命名） =====
  const folderDialog = ref<FolderDialogState>({
    visible: false,
    mode: 'create',
    id: '',
    name: '',
  })

  /** 打开新建文件夹对话框 */
  function openCreateFolder() {
    folderDialog.value = { visible: true, mode: 'create', id: '', name: '' }
  }

  /** 打开重命名文件夹对话框（默认文件夹不可重命名） */
  function openRenameFolder(folder: Folder) {
    if (folder.id === DEFAULT_FOLDER_ID) return
    folderDialog.value = { visible: true, mode: 'rename', id: folder.id, name: folder.name }
  }

  /** 提交文件夹对话框：新建或重命名 */
  function submitFolderDialog() {
    const name = folderDialog.value.name.trim()
    if (!name) {
      showWarning(t('folder.nameRequired'))
      return
    }
    if (folderDialog.value.mode === 'create') {
      postToExt('createFolder', { name })
    } else {
      postToExt('renameFolder', { id: folderDialog.value.id, name })
    }
    folderDialog.value.visible = false
  }

  /** 取消文件夹对话框 */
  function cancelFolderDialog() {
    folderDialog.value.visible = false
  }

  // ===== 删除文件夹对话框 =====
  const deleteFolderDialog = ref<DeleteFolderDialogState>({
    visible: false,
    id: '',
    name: '',
    count: 0,
  })

  /** 打开删除文件夹对话框（默认文件夹不可删除） */
  function openDeleteFolder(folder: Folder) {
    if (folder.id === DEFAULT_FOLDER_ID) return
    // 统计该文件夹下的片段数量
    const count = snippets.value.filter((s) => (s.folderId ?? DEFAULT_FOLDER_ID) === folder.id).length
    deleteFolderDialog.value = { visible: true, id: folder.id, name: folder.name, count }
  }

  /** 确认删除文件夹，action 决定片段处理方式 */
  function confirmDeleteFolder(action: 'move' | 'delete') {
    postToExt('deleteFolder', { id: deleteFolderDialog.value.id, action })
    deleteFolderDialog.value.visible = false
  }

  /** 取消删除文件夹 */
  function cancelDeleteFolder() {
    deleteFolderDialog.value.visible = false
  }

  // ===== 批量删除文件夹对话框 =====
  const batchDeleteDialog = ref<BatchDeleteDialogState>({ visible: false })

  /** 打开批量删除文件夹对话框（选择片段处理方式） */
  function openBatchDeleteFolderDialog() {
    batchDeleteDialog.value.visible = true
  }

  /** 确认批量删除，action 决定片段处理方式 */
  function confirmBatchDeleteFolder(action: 'move' | 'delete') {
    const folderIds = Array.from(selectedFolderIds.value)
    postToExt('batchDeleteFolders', { folderIds, action })
    batchDeleteDialog.value.visible = false
    // 退出多选模式
    onExitMultiSelect()
  }

  /** 取消批量删除 */
  function cancelBatchDeleteFolder() {
    batchDeleteDialog.value.visible = false
  }

  /** 批量删除选中文件夹（先弹出确认，再打开策略选择对话框） */
  function handleBatchDeleteFolders() {
    if (selectedFolderIds.value.size === 0) return
    const count = selectedFolderIds.value.size
    // 统计选中文件夹下的片段总数
    const totalSnippets = snippets.value.filter(
      (s) => selectedFolderIds.value.has((s.folderId ?? DEFAULT_FOLDER_ID))
    ).length
    showConfirm({
      title: t('folder.batchDeleteTitle'),
      content: t('folder.batchDeleteContent', { count, snippetCount: totalSnippets }),
      confirmLabel: t('folder.batchDeleteConfirm'),
      cancelLabel: t('folder.batchDeleteCancel'),
      danger: true,
      onConfirm: () => {
        openBatchDeleteFolderDialog()
      },
    })
  }

  return {
    // 文件夹编辑对话框
    folderDialog,
    openCreateFolder,
    openRenameFolder,
    submitFolderDialog,
    cancelFolderDialog,
    // 删除文件夹对话框
    deleteFolderDialog,
    openDeleteFolder,
    confirmDeleteFolder,
    cancelDeleteFolder,
    // 批量删除对话框
    batchDeleteDialog,
    openBatchDeleteFolderDialog,
    confirmBatchDeleteFolder,
    cancelBatchDeleteFolder,
    handleBatchDeleteFolders,
  }
}
