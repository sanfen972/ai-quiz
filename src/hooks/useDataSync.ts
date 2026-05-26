import { useRef, useCallback } from 'react';

const SYNC_KEYS = ['quiz-records', 'wrong-mastered'] as const;

export function useDataSync() {
  const fileInput = useRef<HTMLInputElement>(null);

  const handleExport = useCallback(() => {
    const data: Record<string, string | null> = {};
    for (const key of SYNC_KEYS) {
      data[key] = localStorage.getItem(key);
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-quiz-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const triggerImport = useCallback(() => {
    fileInput.current?.click();
  }, []);

  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        let imported = 0;
        for (const [key, value] of Object.entries(data)) {
          if ((SYNC_KEYS as readonly string[]).includes(key) && typeof value === 'string') {
            if (key === 'quiz-records') {
              const existing = JSON.parse(localStorage.getItem(key) || '[]');
              const incoming = JSON.parse(value);
              localStorage.setItem(key, JSON.stringify(existing.concat(incoming)));
              imported += incoming.length;
            } else {
              const existing = JSON.parse(localStorage.getItem(key) || '[]');
              const incoming = JSON.parse(value);
              localStorage.setItem(key, JSON.stringify([...new Set([...existing, ...incoming])]));
              imported++;
            }
          }
        }
        alert(`导入成功！已合并 ${imported > 0 ? imported + ' 条记录' : '数据'}。即将刷新页面。`);
        window.location.reload();
      } catch {
        alert('导入失败：文件格式不正确，请选择有效的备份文件。');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  return { fileInput, handleExport, triggerImport, handleImport };
}
