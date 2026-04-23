/**
 * 片段数据服务
 * 负责代码片段的持久化存储和 CRUD 操作
 * 数据存储在 VS Code 全局存储目录下的 snippets.json 文件中
 */
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/** 片段数据结构 */
export interface SnippetData {
  id: string;
  name: string;
  prefix: string;
  body: string;
  description: string;
  language: string;
}

export class SnippetService {
  /** VS Code 全局存储 URI */
  private readonly storageUri: vscode.Uri;
  /** 数据文件路径 */
  private readonly filePath: string;
  /** 内存中的片段数据缓存 */
  private snippets: SnippetData[] = [];

  constructor(context: vscode.ExtensionContext) {
    this.storageUri = context.globalStorageUri;
    this.filePath = path.join(this.storageUri.fsPath, 'snippets.json');
    this.ensureStorageDir();
    this.load();
  }

  /** 确保存储目录存在，不存在则递归创建 */
  private ensureStorageDir(): void {
    const dir = this.storageUri.fsPath;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /** 从文件加载片段数据到内存，解析失败时重置为空数组 */
  private load(): void {
    if (fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.snippets = JSON.parse(raw) as SnippetData[];
      } catch {
        this.snippets = [];
      }
    } else {
      this.snippets = [];
    }
  }

  /** 将内存中的片段数据持久化到文件 */
  private save(): void {
    fs.writeFileSync(this.filePath, JSON.stringify(this.snippets, null, 2), 'utf-8');
  }

  /** 获取所有片段的浅拷贝 */
  getAll(): SnippetData[] {
    return [...this.snippets];
  }

  /** 创建新片段，自动生成唯一 ID 并持久化 */
  create(data: Omit<SnippetData, 'id'>): SnippetData {
    const snippet: SnippetData = {
      id: this.generateId(),
      ...data,
    };
    this.snippets.push(snippet);
    this.save();
    return snippet;
  }

  /** 根据 ID 更新片段，返回更新后的数据，未找到时返回 null */
  update(id: string, data: Omit<SnippetData, 'id'>): SnippetData | null {
    const idx = this.snippets.findIndex((s) => s.id === id);
    if (idx === -1) {
      return null;
    }
    this.snippets[idx] = { id, ...data };
    this.save();
    return this.snippets[idx];
  }

  /** 根据 ID 删除片段，返回是否删除成功 */
  delete(id: string): boolean {
    const idx = this.snippets.findIndex((s) => s.id === id);
    if (idx === -1) {
      return false;
    }
    this.snippets.splice(idx, 1);
    this.save();
    return true;
  }

  /** 基于时间戳和随机数生成唯一 ID */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
  }
}
