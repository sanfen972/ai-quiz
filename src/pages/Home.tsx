import { useNavigate } from 'react-router-dom';
import { questions } from '../data/questions';
import { useMemo, useRef, useCallback } from 'react';

export default function Home() {
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);

  const stats = useMemo(() => {
    const chapters = [...new Set(questions.map((q) => q.chapter))];
    const types: Record<string, number> = { single: 0, multiple: 0, judgment: 0 };
    questions.forEach((q) => types[q.type]++);
    return { total: questions.length, chapters: chapters.length, types };
  }, []);

  const handleExport = useCallback(() => {
    const data: Record<string, string | null> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key === 'quiz-records' || key === 'wrong-mastered')) {
        data[key] = localStorage.getItem(key);
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-quiz-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleImport = useCallback(() => {
    fileInput.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        let imported = 0;
        for (const [key, value] of Object.entries(data)) {
          if ((key === 'quiz-records' || key === 'wrong-mastered') && typeof value === 'string') {
            // Merge: for quiz-records, combine arrays; for wrong-mastered, union
            if (key === 'quiz-records') {
              const existing = JSON.parse(localStorage.getItem(key) || '[]');
              const incoming = JSON.parse(value);
              const merged = existing.concat(incoming);
              localStorage.setItem(key, JSON.stringify(merged));
              imported += incoming.length;
            } else {
              const existing = JSON.parse(localStorage.getItem(key) || '[]');
              const incoming = JSON.parse(value);
              const merged = [...new Set([...existing, ...incoming])];
              localStorage.setItem(key, JSON.stringify(merged));
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

  return (
    <div className="page home-page">
      <h1>AI训练师 知识考题题库</h1>
      <p className="subtitle">辅助掌握人工智能训练相关知识的自测工具</p>

      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-num">{stats.total}</div>
          <div className="stat-label">总题量</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{stats.chapters}</div>
          <div className="stat-label">章节数</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{stats.types.single}</div>
          <div className="stat-label">单选题</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{stats.types.multiple}</div>
          <div className="stat-label">多选题</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{stats.types.judgment}</div>
          <div className="stat-label">判断题</div>
        </div>
      </div>

      <div className="mode-cards">
        <button className="mode-card practice" onClick={() => navigate('/practice')}>
          <div className="mode-icon">📝</div>
          <h2>练习模式</h2>
          <p>不限时，每道题即时反馈，适合日常学习巩固</p>
        </button>
        <button className="mode-card exam" onClick={() => navigate('/exam')}>
          <div className="mode-icon">⏱️</div>
          <h2>考试模式</h2>
          <p>限时答题，交卷后出成绩，模拟真实考试场景</p>
        </button>
      </div>

      <div className="home-links">
        <button className="link-btn" onClick={() => navigate('/wrong-book')}>查看错题本</button>
        <button className="link-btn" onClick={() => navigate('/stats')}>查看答题统计</button>
      </div>

      <div className="sync-section">
        <div className="sync-divider"><span>数据同步</span></div>
        <p className="sync-hint">在不同设备间手动同步答题记录和错题进度</p>
        <div className="sync-buttons">
          <button className="link-btn export" onClick={handleExport}>
            📤 导出数据
          </button>
          <button className="link-btn import" onClick={handleImport}>
            📥 导入数据
          </button>
          <input ref={fileInput} type="file" accept=".json" style={{ display: 'none' }} onChange={handleFileChange} />
        </div>
      </div>
    </div>
  );
}
