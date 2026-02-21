document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("todo-form");
  const input = document.getElementById("todo-input");
  const list = document.getElementById("todo-list");
  const emptyMessage = document.getElementById("empty-message");

  let todos = [];

  function updateEmptyMessage() {
    if (todos.length === 0) {
      emptyMessage.classList.remove("hidden");
    } else {
      emptyMessage.classList.add("hidden");
    }
  }

  function renderTodos() {
    list.innerHTML = "";
    todos.forEach((todo) => {
      const li = document.createElement("li");
      li.className = "todo-item" + (todo.completed ? " completed" : "");

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "todo-checkbox";
      checkbox.checked = todo.completed;
      checkbox.addEventListener("change", () => toggleTodo(todo.id));

      const span = document.createElement("span");
      span.className = "todo-text";
      span.textContent = todo.text;

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "delete-btn";
      deleteBtn.textContent = "削除";
      deleteBtn.addEventListener("click", () => deleteTodo(todo.id));

      li.appendChild(checkbox);
      li.appendChild(span);
      li.appendChild(deleteBtn);
      list.appendChild(li);
    });
    updateEmptyMessage();
  }

  async function fetchTodos() {
    const res = await fetch("/api/todos");
    todos = await res.json();
    renderTodos();
  }

  async function addTodo(text) {
    await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    await fetchTodos();
  }

  async function toggleTodo(id) {
    await fetch(`/api/todos/${id}`, { method: "PATCH" });
    await fetchTodos();
  }

  async function deleteTodo(id) {
    await fetch(`/api/todos/${id}`, { method: "DELETE" });
    await fetchTodos();
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (text) {
      addTodo(text);
      input.value = "";
      input.focus();
    }
  });

  fetchTodos();
});
