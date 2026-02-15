document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("todo-form");
  const input = document.getElementById("todo-input");
  const list = document.getElementById("todo-list");
  const emptyMessage = document.getElementById("empty-message");

  let todos = JSON.parse(localStorage.getItem("todos")) || [];

  function saveTodos() {
    localStorage.setItem("todos", JSON.stringify(todos));
  }

  function updateEmptyMessage() {
    if (todos.length === 0) {
      emptyMessage.classList.remove("hidden");
    } else {
      emptyMessage.classList.add("hidden");
    }
  }

  function renderTodos() {
    list.innerHTML = "";
    todos.forEach((todo, index) => {
      const li = document.createElement("li");
      li.className = "todo-item" + (todo.completed ? " completed" : "");

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "todo-checkbox";
      checkbox.checked = todo.completed;
      checkbox.addEventListener("change", () => toggleTodo(index));

      const span = document.createElement("span");
      span.className = "todo-text";
      span.textContent = todo.text;

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "delete-btn";
      deleteBtn.textContent = "削除";
      deleteBtn.addEventListener("click", () => deleteTodo(index));

      li.appendChild(checkbox);
      li.appendChild(span);
      li.appendChild(deleteBtn);
      list.appendChild(li);
    });
    updateEmptyMessage();
  }

  function addTodo(text) {
    todos.push({ text: text, completed: false });
    saveTodos();
    renderTodos();
  }

  function toggleTodo(index) {
    todos[index].completed = !todos[index].completed;
    saveTodos();
    renderTodos();
  }

  function deleteTodo(index) {
    todos.splice(index, 1);
    saveTodos();
    renderTodos();
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

  renderTodos();
});
