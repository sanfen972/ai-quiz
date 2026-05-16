import { useNavigate } from 'react-router-dom';
import { questions } from '../data/questions';
import { useMemo } from 'react';

export default function Home() {
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const chapters = [...new Set(questions.map((q) => q.chapter))];
    const types = { single: 0, multiple: 0, judgment: 0 };
    questions.forEach((q) => types[q.type]++);
    return { total: questions.length, chapters: chapters.length, types };
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
    </div>
  );
}
