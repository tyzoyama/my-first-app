const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const isVercel = !!process.env.VERCEL;
const DATA_FILE = path.join(__dirname, "todos.json");

// Vercel ではインメモリストアを使用
let memoryTodos = [];

app.use(express.json());
app.use(express.static(path.join(__dirname, "public"), { index: "index.html" }));

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

function readTodos() {
  if (isVercel) return memoryTodos;
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

function writeTodos(todos) {
  if (isVercel) {
    memoryTodos = todos;
    return;
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(todos, null, 2));
}

// 全タスク取得
app.get("/api/todos", (_req, res) => {
  res.json(readTodos());
});

// タスク追加
app.post("/api/todos", (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "テキストは必須です" });
  }
  const todos = readTodos();
  const todo = {
    id: Date.now().toString(),
    text: text.trim(),
    completed: false,
  };
  todos.push(todo);
  writeTodos(todos);
  res.status(201).json(todo);
});

// タスク完了切り替え
app.patch("/api/todos/:id", (req, res) => {
  const todos = readTodos();
  const todo = todos.find((t) => t.id === req.params.id);
  if (!todo) {
    return res.status(404).json({ error: "タスクが見つかりません" });
  }
  todo.completed = !todo.completed;
  writeTodos(todos);
  res.json(todo);
});

// タスク削除
app.delete("/api/todos/:id", (req, res) => {
  let todos = readTodos();
  const index = todos.findIndex((t) => t.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "タスクが見つかりません" });
  }
  todos.splice(index, 1);
  writeTodos(todos);
  res.status(204).end();
});

// Vercel 向けにエクスポート
module.exports = app;

// ローカル実行時のみリッスン
if (!isVercel) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`サーバー起動: http://localhost:${PORT}`);
  });
}
