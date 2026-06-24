/**
 * webviewHtmlBuilder 共享逻辑测试
 * 覆盖 locale 解析的纯函数逻辑和 HTML 构建的关键行为
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// mock vscode 模块，避免依赖真实 VS Code API
vi.mock('vscode', () => ({
  Uri: {
    joinPath: (...parts: string[]) => ({
      fsPath: parts.join('/'),
      with: ({ scheme }: { scheme: string }) => ({ fsPath: `${scheme}://` }),
    }),
  },
  env: {
    language: 'en',
  },
}));

import { mapVscodeLocale, resolveLocale, getLocaleSource } from '../../src/shared/webviewHtmlBuilder';

describe('mapVscodeLocale', () => {
  it('精确匹配支持的语言（忽略大小写）', () => {
    expect(mapVscodeLocale('zh')).toBe('zh');
    expect(mapVscodeLocale('ZH')).toBe('zh');
    expect(mapVscodeLocale('en')).toBe('en');
    expect(mapVscodeLocale('EN')).toBe('en');
    expect(mapVscodeLocale('ja')).toBe('ja');
    expect(mapVscodeLocale('ko')).toBe('ko');
  });

  it('前缀匹配：zh-cn 映射到 zh，pt-br 映射到 pt', () => {
    expect(mapVscodeLocale('zh-cn')).toBe('zh');
    expect(mapVscodeLocale('zh-CN')).toBe('zh');
    expect(mapVscodeLocale('pt-br')).toBe('pt');
    expect(mapVscodeLocale('pt-BR')).toBe('pt');
    expect(mapVscodeLocale('en-us')).toBe('en');
    expect(mapVscodeLocale('en-GB')).toBe('en');
  });

  it('未匹配的语言回退到英文', () => {
    expect(mapVscodeLocale('fr')).toBe('fr'); // fr 是支持的语言
    expect(mapVscodeLocale('xyz')).toBe('en');
    expect(mapVscodeLocale('')).toBe('en');
  });

  it('zh-TW 不应被前缀匹配为 zh（因为 zh-TW 是独立支持的语言）', () => {
    // zh-TW 精确匹配（忽略大小写）
    expect(mapVscodeLocale('zh-TW')).toBe('zh-TW');
    expect(mapVscodeLocale('zh-tw')).toBe('zh-TW');
  });
});

describe('getLocaleSource', () => {
  // mock 的 ExtensionContext，仅保留 globalState.get
  const createMockContext = (localeSource?: string) => ({
    globalState: {
      get: vi.fn((key: string, defaultValue: string) => {
        if (key === 'localeSource') return localeSource ?? defaultValue;
        return defaultValue;
      }),
    },
  });

  it('未设置时默认返回 auto', () => {
    const ctx = createMockContext(undefined) as any;
    expect(getLocaleSource(ctx)).toBe('auto');
  });

  it('设置为 manual 时返回 manual', () => {
    const ctx = createMockContext('manual') as any;
    expect(getLocaleSource(ctx)).toBe('manual');
  });

  it('设置为 auto 时返回 auto', () => {
    const ctx = createMockContext('auto') as any;
    expect(getLocaleSource(ctx)).toBe('auto');
  });
});

describe('resolveLocale', () => {
  const createMockContext = (localeSource: string, locale?: string) => ({
    globalState: {
      get: vi.fn((key: string, defaultValue: string) => {
        if (key === 'localeSource') return localeSource;
        if (key === 'locale') return locale ?? defaultValue;
        return defaultValue;
      }),
    },
  });

  beforeEach(() => {
    // 重置 vscode.env.language 为默认值
    vi.resetModules();
  });

  it('manual 模式返回手动设置的 locale', () => {
    const ctx = createMockContext('manual', 'ja') as any;
    expect(resolveLocale(ctx)).toBe('ja');
  });

  it('manual 模式未设置 locale 时默认返回 zh', () => {
    const ctx = createMockContext('manual', undefined) as any;
    expect(resolveLocale(ctx)).toBe('zh');
  });

  it('auto 模式根据 vscode.env.language 映射', () => {
    // vscode.env.language 在 mock 中默认为 'en'
    const ctx = createMockContext('auto') as any;
    expect(resolveLocale(ctx)).toBe('en');
  });
});
