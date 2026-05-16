import { readFileSync, writeFileSync } from 'fs';

const base = 'D:/AI训练师相关/知识问答考题题库/AI训练题题库';
const files = [
  { file: '模块一：数据工程（标注、清洗、采样.txt', module: '数据工程（标注、清洗、采样）' },
  { file: '模块二：模型训练与调优（参数、评估指标）.txt', module: '模型训练与调优（参数、评估指标）' },
  { file: '模块三：提示词工程、模型评估与安全对齐.txt', module: '提示词工程、模型评估与安全对齐' },
  { file: '模块四：安全伦理与场景综合.txt', module: '安全伦理与场景综合' },
  { file: '模块五：Python 入门题库（100题）.txt', module: 'Python 入门' },
  { file: '模块六：大模型核心概念题库.txt', module: '大模型核心概念' },
];

function parseFormat1(text, module) {
  const questions = [];
  // Split by numbered questions: "N. " at start of line
  const blocks = text.split(/\n(?=\d+\.\s)/);
  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length < 5) continue;

    const qMatch = lines[0].match(/^\d+\.\s+(.+)/);
    if (!qMatch) continue;
    const questionText = qMatch[1].replace(/（.*?）$/, '').trim();

    // Find A/B/C/D lines and answer
    let opts = [];
    let answer = null;
    let explanation = '';

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const optMatch = line.match(/^([A-D])\.?\s+(.+)/);
      if (optMatch) {
        opts.push(optMatch[2].trim());
        continue;
      }
      // Answer format: [答案：X] or [答案：X] 注释：...
      const ansMatch = line.match(/\[答案[：:]\s*([A-D](?:[、,\s]*[A-D])*)\]/);
      if (ansMatch) {
        const letters = ansMatch[1].split(/[、,\s]+/).filter(Boolean);
        answer = letters.map((l) => l.charCodeAt(0) - 65);
        // Try to get explanation after 注释：
        const noteMatch = line.match(/注释[：:]\s*(.+)/);
        if (noteMatch) explanation = noteMatch[1].trim();
        continue;
      }
    }

    if (opts.length >= 2 && answer) {
      const type = answer.length > 1 ? 'multiple' : 'single';
      const section = block.includes('基础') ? '基础'
        : block.includes('进阶') ? '进阶'
        : block.includes('实战') ? '实战'
        : '基础';
      questions.push({
        id: '',
        type,
        chapter: module,
        difficulty: section === '基础' ? 1 : section === '进阶' ? 2 : 3,
        question: questionText,
        options: opts,
        answer,
        explanation,
      });
    }
  }
  return questions;
}

function parseFormat23(text, module) {
  const questions = [];
  // Split by QN: or QN：
  const blocks = text.split(/\n(?=Q\d+[:：])/);
  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length < 5) continue;

    const qMatch = lines[0].match(/^Q\d+[:：]\s*(.+)/);
    if (!qMatch) continue;
    const questionText = qMatch[1].trim();

    let opts = [];
    let answer = null;
    let explanation = '';
    let type = 'single';

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const optMatch = line.match(/^([A-D])[:：]\s*(.+)/);
      if (optMatch) {
        opts.push(optMatch[2].trim());
        continue;
      }
      const ansMatch = line.match(/^答案[:：]\s*(.+)/);
      if (ansMatch) {
        const letters = ansMatch[1].trim().split(/[、,，\s]+/).filter(Boolean);
        answer = letters.map((l) => l.charCodeAt(0) - 65).filter((n) => n >= 0 && n < 20);
        continue;
      }
      const expMatch = line.match(/^解析[:：]\s*(.+)/);
      if (expMatch) {
        explanation = expMatch[1].trim();
        continue;
      }
      const typeMatch = line.match(/^类型[:：]\s*(.+)/);
      if (typeMatch) {
        const t = typeMatch[1].trim().toLowerCase();
        if (t === 'multi' || t === 'multiple') type = 'multiple';
        if (t === 'judgment' || t === '判断') type = 'judgment';
        continue;
      }
    }

    if (opts.length >= 2 && answer && answer.length > 0) {
      questions.push({
        id: '',
        type: type || (answer.length > 1 ? 'multiple' : 'single'),
        chapter: module,
        difficulty: block.includes('基础') ? 1
          : block.includes('进阶') ? 2
          : block.includes('实战') ? 3
          : block.includes('应用') ? 2
          : 2,
        question: questionText,
        options: opts,
        answer,
        explanation,
      });
    }
  }
  return questions;
}

// Parse all files
let allQuestions = [];
for (const { file, module } of files) {
  const text = readFileSync(`${base}/${file}`, 'utf-8');
  // Detect format
  let parsed;
  if (text.match(/\nQ\d+[:：]/)) {
    parsed = parseFormat23(text, module);
    console.log(`${module}: ${parsed.length} questions (format 2/3)`);
  } else {
    parsed = parseFormat1(text, module);
    console.log(`${module}: ${parsed.length} questions (format 1)`);
  }
  // Filter questions with section headers as question text
  parsed = parsed.filter((q) => !q.question.match(/^基础篇|^进阶篇|^实战篇|^基础语法|^进阶语法|^应用与|^基础概念/));
  allQuestions.push(...parsed);
}

// Assign IDs
allQuestions.forEach((q, i) => {
  q.id = String(i + 1).padStart(3, '0');
});

console.log(`\nTotal: ${allQuestions.length} questions`);

// Generate TypeScript
const ts = `import type { Question } from '../types';

export const questions: Question[] = [
${allQuestions.map((q) => `  {
    id: '${q.id}',
    type: '${q.type}',
    chapter: '${q.chapter}',
    difficulty: ${q.difficulty},
    question: ${JSON.stringify(q.question)},
    options: ${JSON.stringify(q.options)},
    answer: ${JSON.stringify(q.answer)},
    explanation: ${JSON.stringify(q.explanation)},
  }`).join(',\n')}
];
`;

writeFileSync('src/data/questions.ts', ts, 'utf-8');
console.log('Written to src/data/questions.ts');
