#!/usr/bin/env node

/**
 * Calendar Task MCP Server
 * 直接读写 calendar-tasks.json，让 AI 可以管理任务清单
 */

const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const z = require('zod');

// 数据文件路径
const DATA_FILE = path.join(process.env.APPDATA || '', 'calendar-list', 'calendar-tasks.json');

// 读取数据
function readData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

// 写入数据
function writeData(data) {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// 生成 ID
function genId() {
  return crypto.randomBytes(6).toString('hex');
}

// 创建 MCP Server
const server = new McpServer({
  name: 'TodoList',
  version: '1.0.0',
});

// 工具1：查看指定日期的任务
server.tool(
  'list_tasks',
  '查看指定日期的任务列表。date 格式为 YYYY-M-D（如 2026-4-29），不传则返回所有日期概览',
  { date: z.string().optional().describe('日期，格式 YYYY-M-D，如 2026-4-29。不传则返回所有日期概览') },
  async ({ date }) => {
    const data = readData();
    if (date) {
      const tasks = data[date];
      if (!tasks || tasks.length === 0) {
        return { content: [{ type: 'text', text: `${date} 没有任务` }] };
      }
      const lines = tasks.map((t, i) => `${i + 1}. [${t.done ? '✅' : '⬜'}] ${t.text}${t.done && t.text.includes('(已完成)') ? '' : ''}`);
      return { content: [{ type: 'text', text: `📅 ${date} 的任务（共${tasks.length}条）：\n${lines.join('\n')}` }] };
    }
    // 返回概览
    const dates = Object.keys(data).sort();
    if (dates.length === 0) {
      return { content: [{ type: 'text', text: '当前没有任何任务' }] };
    }
    const overview = dates.map(d => {
      const tasks = data[d];
      const done = tasks.filter(t => t.done).length;
      return `📅 ${d}：${tasks.length}条任务（${done}已完成）`;
    });
    return { content: [{ type: 'text', text: `任务清单概览（共${dates.length}天）：\n${overview.join('\n')}` }] };
  }
);

// 工具2：添加任务
server.tool(
  'add_task',
  '给指定日期添加任务。date 格式 YYYY-M-D，text 为任务内容',
  {
    date: z.string().describe('日期，格式 YYYY-M-D，如 2026-4-29'),
    text: z.string().describe('任务内容'),
  },
  async ({ date, text }) => {
    const data = readData();
    if (!data[date]) data[date] = [];
    const task = { id: genId(), text, done: false, createdAt: Date.now() };
    data[date].push(task);
    writeData(data);
    return { content: [{ type: 'text', text: `✅ 已添加任务到 ${date}：${text}` }] };
  }
);

// 工具3：完成任务
server.tool(
  'complete_task',
  '标记任务为已完成。可通过日期+序号或任务内容关键词来定位',
  {
    date: z.string().describe('日期，格式 YYYY-M-D'),
    index: z.number().optional().describe('任务序号（从1开始）'),
    keyword: z.string().optional().describe('任务内容关键词（模糊匹配）'),
  },
  async ({ date, index, keyword }) => {
    const data = readData();
    const tasks = data[date];
    if (!tasks || tasks.length === 0) {
      return { content: [{ type: 'text', text: `${date} 没有任务` }] };
    }

    let target = null;
    if (index) {
      target = tasks[index - 1];
    } else if (keyword) {
      target = tasks.find(t => t.text.includes(keyword) && !t.done);
    }

    if (!target) {
      return { content: [{ type: 'text', text: `未找到匹配的任务。${date} 的任务列表：\n${tasks.map((t, i) => `${i + 1}. [${t.done ? '✅' : '⬜'}] ${t.text}`).join('\n')}` }] };
    }

    target.done = true;
    if (!target.text.includes('(已完成)')) {
      target.text = target.text + ' (已完成)';
    }
    writeData(data);
    return { content: [{ type: 'text', text: `✅ 已完成：${target.text}` }] };
  }
);

// 工具4：删除任务
server.tool(
  'delete_task',
  '删除指定日期的任务。通过日期+序号定位',
  {
    date: z.string().describe('日期，格式 YYYY-M-D'),
    index: z.number().describe('任务序号（从1开始）'),
  },
  async ({ date, index }) => {
    const data = readData();
    const tasks = data[date];
    if (!tasks || tasks.length === 0) {
      return { content: [{ type: 'text', text: `${date} 没有任务` }] };
    }
    if (index < 1 || index > tasks.length) {
      return { content: [{ type: 'text', text: `序号超出范围（1-${tasks.length}）` }] };
    }
    const removed = tasks.splice(index - 1, 1)[0];
    if (tasks.length === 0) delete data[date];
    writeData(data);
    return { content: [{ type: 'text', text: `🗑️ 已删除：${removed.text}` }] };
  }
);

// 工具5：导出全部数据
server.tool(
  'export_all_tasks',
  '导出全部任务数据（JSON格式）',
  {},
  async () => {
    const data = readData();
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

// 工具6：批量添加任务
server.tool(
  'batch_add_tasks',
  '批量添加任务到指定日期。tasks 为任务内容数组',
  {
    date: z.string().describe('日期，格式 YYYY-M-D'),
    tasks: z.array(z.string()).describe('任务内容数组'),
  },
  async ({ date, tasks }) => {
    const data = readData();
    if (!data[date]) data[date] = [];
    const now = Date.now();
    const added = tasks.map((text, i) => ({
      id: genId(),
      text,
      done: false,
      createdAt: now + i,
    }));
    data[date].push(...added);
    writeData(data);
    return { content: [{ type: 'text', text: `✅ 已批量添加 ${added.length} 条任务到 ${date}` }] };
  }
);

// 启动
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(err => {
  console.error('MCP Server 启动失败:', err);
  process.exit(1);
});
