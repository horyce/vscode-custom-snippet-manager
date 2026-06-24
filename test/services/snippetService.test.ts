/**
 * SnippetService 单元测试
 * 使用临时目录模拟 VS Code 全局存储，覆盖 CRUD、文件夹管理、批量导入等核心逻辑
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as vscode from 'vscode';
import { SnippetService, DEFAULT_FOLDER_ID, SnippetData } from '../../src/services/snippetService';

/**
 * 创建临时目录作为 VS Code 全局存储路径
 * 每个测试用例使用独立目录，避免相互干扰
 */
function createTempStorageDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'snippet-test-'));
}

/** 递归删除目录及其内容 */
function removeTempDir(dir: string): void {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/** 构造 mock ExtensionContext，globalStorageUri 指向临时目录 */
function createMockContext(storagePath: string): vscode.ExtensionContext {
  return {
    globalStorageUri: { fsPath: storagePath } as vscode.Uri,
  } as vscode.ExtensionContext;
}

/** 构造测试用片段数据（不含 id） */
function createSnippetData(overrides: Partial<Omit<SnippetData, 'id'>> = {}): Omit<SnippetData, 'id'> {
  return {
    name: '测试片段',
    prefix: 'test',
    body: 'console.log("test")',
    description: '测试用片段',
    language: 'javascript',
    ...overrides,
  };
}

describe('SnippetService', () => {
  let service: SnippetService;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = createTempStorageDir();
    service = new SnippetService(createMockContext(tempDir));
    await service.ready();
  });

  afterEach(() => {
    removeTempDir(tempDir);
  });

  describe('初始化', () => {
    it('首次启用时创建默认文件夹', () => {
      const folders = service.getFolders();
      expect(folders).toHaveLength(1);
      expect(folders[0].id).toBe(DEFAULT_FOLDER_ID);
    });

    it('存储目录结构正确创建', () => {
      expect(fs.existsSync(tempDir)).toBe(true);
      expect(fs.existsSync(path.join(tempDir, 'folders'))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, 'folders.json'))).toBe(true);
    });
  });

  describe('片段 CRUD', () => {
    it('创建片段并返回带 id 的副本', async () => {
      const created = await service.create(createSnippetData());
      expect(created.id).toBeTruthy();
      expect(created.name).toBe('测试片段');
      expect(created.folderId).toBe(DEFAULT_FOLDER_ID);
      expect(created.usageCount).toBe(0);
      expect(created.createdAt).toBeTruthy();
    });

    it('创建片段时 language 字段被规范化（去除空格）', async () => {
      const created = await service.create(createSnippetData({ language: ' javascript , typescript ' }));
      expect(created.language).toBe('javascript,typescript');
    });

    it('getAll 返回所有片段并附加 folderId', async () => {
      await service.create(createSnippetData({ name: '片段1' }));
      await service.create(createSnippetData({ name: '片段2' }));

      const all = service.getAll();
      expect(all).toHaveLength(2);
      expect(all[0].folderId).toBe(DEFAULT_FOLDER_ID);
      expect(all[1].folderId).toBe(DEFAULT_FOLDER_ID);
    });

    it('update 更新片段字段', async () => {
      const created = await service.create(createSnippetData());
      const updated = await service.update(created.id, createSnippetData({ name: '更新后的名称' }));

      expect(updated).not.toBeNull();
      expect(updated!.name).toBe('更新后的名称');
      expect(updated!.id).toBe(created.id);
      // usageCount 和 createdAt 应保留原值
      expect(updated!.usageCount).toBe(created.usageCount);
      expect(updated!.createdAt).toBe(created.createdAt);
    });

    it('update 不存在的片段返回 null', async () => {
      const result = await service.update('non-existent-id', createSnippetData());
      expect(result).toBeNull();
    });

    it('delete 删除片段', async () => {
      const created = await service.create(createSnippetData());
      const deleted = await service.delete(created.id);
      expect(deleted).toBe(true);
      expect(service.getAll()).toHaveLength(0);
    });

    it('delete 不存在的片段返回 false', async () => {
      const deleted = await service.delete('non-existent-id');
      expect(deleted).toBe(false);
    });

    it('incrementUsage 增加使用计数', async () => {
      const created = await service.create(createSnippetData());
      service.incrementUsage(created.id);
      service.incrementUsage(created.id);
      service.incrementUsage(created.id);

      const all = service.getAll();
      expect(all[0].usageCount).toBe(3);
    });

    it('incrementUsage 不存在的片段不报错', () => {
      expect(() => service.incrementUsage('non-existent-id')).not.toThrow();
    });
  });

  describe('文件夹管理', () => {
    it('createFolder 创建新文件夹', async () => {
      const folder = await service.createFolder('新文件夹');
      expect(folder).not.toBeNull();
      expect(folder!.name).toBe('新文件夹');
      expect(folder!.id).not.toBe(DEFAULT_FOLDER_ID);
    });

    it('createFolder 空名称返回 null', async () => {
      const folder = await service.createFolder('   ');
      expect(folder).toBeNull();
    });

    it('createFolder 重名返回 null（忽略大小写）', async () => {
      await service.createFolder('Folder');
      const duplicate = await service.createFolder('folder');
      expect(duplicate).toBeNull();
    });

    it('renameFolder 重命名文件夹', async () => {
      const folder = await service.createFolder('旧名称');
      const result = await service.renameFolder(folder!.id, '新名称');
      expect(result).toBe(true);
      const folders = service.getFolders();
      expect(folders.find((f) => f.id === folder!.id)!.name).toBe('新名称');
    });

    it('renameFolder 默认文件夹不可重命名', async () => {
      const result = await service.renameFolder(DEFAULT_FOLDER_ID, '新名称');
      expect(result).toBe(false);
    });

    it('deleteFolder move 模式将片段移入默认文件夹', async () => {
      const folder = await service.createFolder('待删除');
      await service.create(createSnippetData({ name: '片段1', folderId: folder!.id }));
      await service.create(createSnippetData({ name: '片段2', folderId: folder!.id }));

      const result = await service.deleteFolder(folder!.id, 'move');
      expect(result).toBe(true);

      // 文件夹被删除
      expect(service.getFolders()).toHaveLength(1);
      // 片段移入默认文件夹
      const all = service.getAll();
      expect(all).toHaveLength(2);
      expect(all.every((s) => s.folderId === DEFAULT_FOLDER_ID)).toBe(true);
    });

    it('deleteFolder delete 模式连同片段删除', async () => {
      const folder = await service.createFolder('待删除');
      await service.create(createSnippetData({ name: '片段1', folderId: folder!.id }));
      await service.create(createSnippetData({ name: '片段2', folderId: folder!.id }));

      const result = await service.deleteFolder(folder!.id, 'delete');
      expect(result).toBe(true);
      expect(service.getFolders()).toHaveLength(1);
      expect(service.getAll()).toHaveLength(0);
    });

    it('deleteFolder 默认文件夹不可删除', async () => {
      const result = await service.deleteFolder(DEFAULT_FOLDER_ID, 'delete');
      expect(result).toBe(false);
    });
  });

  describe('跨文件夹操作', () => {
    it('update 跨文件夹迁移片段', async () => {
      const folder = await service.createFolder('目标文件夹');
      const created = await service.create(createSnippetData({ folderId: DEFAULT_FOLDER_ID }));

      const updated = await service.update(created.id, createSnippetData({ folderId: folder!.id }));
      expect(updated).not.toBeNull();
      expect(updated!.folderId).toBe(folder!.id);

      // 原文件夹不再有该片段
      const defaultSnippets = service.getSnippetsByFolder(DEFAULT_FOLDER_ID);
      expect(defaultSnippets).toHaveLength(0);
      // 目标文件夹有该片段
      const targetSnippets = service.getSnippetsByFolder(folder!.id);
      expect(targetSnippets).toHaveLength(1);
    });

    it('getSnippetsByFolder 返回指定文件夹的片段', async () => {
      const folder = await service.createFolder('文件夹A');
      await service.create(createSnippetData({ name: '片段1', folderId: folder!.id }));
      await service.create(createSnippetData({ name: '片段2', folderId: DEFAULT_FOLDER_ID }));

      const folderSnippets = service.getSnippetsByFolder(folder!.id);
      expect(folderSnippets).toHaveLength(1);
      expect(folderSnippets[0].name).toBe('片段1');
    });
  });

  describe('批量导入', () => {
    it('batchImport create 操作批量创建片段', async () => {
      const operations = [
        {
          type: 'create' as const,
          folderId: DEFAULT_FOLDER_ID,
          data: createSnippetData({ name: '片段1', prefix: 'p1' }),
        },
        {
          type: 'create' as const,
          folderId: DEFAULT_FOLDER_ID,
          data: createSnippetData({ name: '片段2', prefix: 'p2' }),
        },
      ];

      await service.batchImport(operations);
      expect(service.getAll()).toHaveLength(2);
    });

    it('batchImport update 操作更新已有片段', async () => {
      const created = await service.create(createSnippetData({ name: '原名称' }));

      await service.batchImport([
        {
          type: 'update' as const,
          id: created.id,
          data: createSnippetData({ name: '更新名称' }),
        },
      ]);

      const all = service.getAll();
      expect(all).toHaveLength(1);
      expect(all[0].name).toBe('更新名称');
    });

    it('batchImport 混合 create 和 update 操作', async () => {
      const created = await service.create(createSnippetData({ name: '原片段' }));

      await service.batchImport([
        {
          type: 'create' as const,
          folderId: DEFAULT_FOLDER_ID,
          data: createSnippetData({ name: '新片段', prefix: 'new' }),
        },
        {
          type: 'update' as const,
          id: created.id,
          data: createSnippetData({ name: '更新后的原片段' }),
        },
      ]);

      const all = service.getAll();
      expect(all).toHaveLength(2);
      expect(all.some((s) => s.name === '新片段')).toBe(true);
      expect(all.some((s) => s.name === '更新后的原片段')).toBe(true);
    });
  });

  describe('clearAll', () => {
    it('清空所有数据仅保留默认文件夹', async () => {
      const folder = await service.createFolder('待清空');
      await service.create(createSnippetData({ name: '片段1', folderId: folder!.id }));
      await service.create(createSnippetData({ name: '片段2', folderId: DEFAULT_FOLDER_ID }));

      const count = await service.clearAll();
      expect(count).toBe(2);
      expect(service.getFolders()).toHaveLength(1);
      expect(service.getFolders()[0].id).toBe(DEFAULT_FOLDER_ID);
      expect(service.getAll()).toHaveLength(0);
    });
  });

  describe('数据持久化', () => {
    it('创建片段后重新加载服务，数据应一致', async () => {
      await service.create(createSnippetData({ name: '持久化测试' }));

      // 创建新服务实例模拟重新加载
      const reloadedService = new SnippetService(createMockContext(tempDir));
      await reloadedService.ready();

      const all = reloadedService.getAll();
      expect(all).toHaveLength(1);
      expect(all[0].name).toBe('持久化测试');
    });

    it('文件夹结构持久化后重新加载', async () => {
      const folder = await service.createFolder('持久化文件夹');
      await service.create(createSnippetData({ name: '片段', folderId: folder!.id }));

      const reloadedService = new SnippetService(createMockContext(tempDir));
      await reloadedService.ready();

      const folders = reloadedService.getFolders();
      expect(folders).toHaveLength(2);
      expect(folders.some((f) => f.name === '持久化文件夹')).toBe(true);

      const all = reloadedService.getAll();
      expect(all).toHaveLength(1);
    });
  });
});
