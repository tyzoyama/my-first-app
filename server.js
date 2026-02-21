const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "todos.json");

app.use(express.json());
app.use(express.static(__dirname));

function readTodos() {
  if (!fs.existsSync(DATA_FILE)) {
    return [];
  }
  const data = fs.readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(data);
}

function writeTodos(todos) {
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

app.listen(PORT, () => {
  console.log(`サーバー起動: http://localhost:${PORT}`);
});
