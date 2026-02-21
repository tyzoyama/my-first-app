const express = require("express");
const fs = require("fs");
const path = require("path");
const { Redis } = require("@upstash/redis");

const app = express();
const PORT = process.env.PORT || 3000;
const isVercel = !!process.env.VERCEL;
const DATA_FILE = path.join(__dirname, "todos.json");
const REDIS_KEY = "todos";

// Upstash Redis クライアント（環境変数が設定されている場合のみ）
let redis = null;
const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
if (redisUrl && redisToken) {
  redis = new Redis({
    url: redisUrl,
    token: redisToken,
  });
}

app.use(express.json());
app.use(express.static(path.join(__dirname, "public"), { index: "index.html" }));

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ストレージ操作（Redis > ファイル のフォールバック）
async function readTodos() {
  if (redis) {
    const data = await redis.get(REDIS_KEY);
    return data || [];
  }
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

async function writeTodos(todos) {
  if (redis) {
    await redis.set(REDIS_KEY, todos);
    return;
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(todos, null, 2));
}

// 全タスク取得
app.get("/api/todos", async (_req, res) => {
  try {
    res.json(await readTodos());
  } catch (err) {
    res.status(500).json({ error: "データの取得に失敗しました" });
  }
});

// タスク追加
app.post("/api/todos", async (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "テキストは必須です" });
  }
  try {
    const todos = await readTodos();
    const todo = {
      id: Date.now().toString(),
      text: text.trim(),
      completed: false,
    };
    todos.push(todo);
    await writeTodos(todos);
    res.status(201).json(todo);
  } catch (err) {
    res.status(500).json({ error: "タスクの追加に失敗しました" });
  }
});

// タスク完了切り替え
app.patch("/api/todos/:id", async (req, res) => {
  try {
    const todos = await readTodos();
    const todo = todos.find((t) => t.id === req.params.id);
    if (!todo) {
      return res.status(404).json({ error: "タスクが見つかりません" });
    }
    todo.completed = !todo.completed;
    await writeTodos(todos);
    res.json(todo);
  } catch (err) {
    res.status(500).json({ error: "タスクの更新に失敗しました" });
  }
});

// タスク削除
app.delete("/api/todos/:id", async (req, res) => {
  try {
    let todos = await readTodos();
    const index = todos.findIndex((t) => t.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: "タスクが見つかりません" });
    }
    todos.splice(index, 1);
    await writeTodos(todos);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: "タスクの削除に失敗しました" });
  }
});

// Vercel 向けにエクスポート
module.exports = app;

// ローカル実行時のみリッスン
if (!isVercel) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`サーバー起動: http://localhost:${PORT}`);
  });
}
