let tasks = [];
let nextId = 1;
let currentFilter = "all";

const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const warning = document.getElementById("warning");
const taskList = document.getElementById("taskList");
const activeCount = document.getElementById("activeCount");
const completedCount = document.getElementById("completedCount");
const filterButtons = document.querySelectorAll(".filter-btn");

function addTask() {
  const text = taskInput.value.trim();

  if (text === "") {
    warning.classList.remove("hidden");
    return;
  }

  warning.classList.add("hidden");

  tasks.push({
    id: nextId++,
    text: text,
    completed: false
  });

  taskInput.value = "";
  render();
}

function toggleTask(id) {
  tasks = tasks.map(function (task) {
    if (task.id === id) {
      return Object.assign({}, task, { completed: !task.completed });
    }
    return task;
  });
  render();
}

function deleteTask(id) {
  tasks = tasks.filter(function (task) {
    return task.id !== id;
  });
  render();
}

function matchesFilter(task) {
  if (currentFilter === "active") {
    return !task.completed;
  }
  if (currentFilter === "completed") {
    return task.completed;
  }
  return true;
}

function updateCounters() {
  const active = tasks.filter(function (task) {
    return !task.completed;
  }).length;

  const completed = tasks.filter(function (task) {
    return task.completed;
  }).length;

  activeCount.textContent = "Осталось: " + active;
  completedCount.textContent = "Выполнено: " + completed;
}

function createTaskElement(task) {
  const li = document.createElement("li");
  li.className = "task-item";
  li.style.display = matchesFilter(task) ? "" : "none";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = task.completed;
  checkbox.addEventListener("change", function () {
    toggleTask(task.id);
  });

  const span = document.createElement("span");
  span.className = "task-text" + (task.completed ? " completed" : "");
  span.textContent = task.text;

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-btn";
  deleteBtn.textContent = "Удалить";
  deleteBtn.addEventListener("click", function () {
    deleteTask(task.id);
  });

  li.appendChild(checkbox);
  li.appendChild(span);
  li.appendChild(deleteBtn);

  return li;
}

function render() {
  taskList.innerHTML = "";

  tasks.forEach(function (task) {
    const el = createTaskElement(task);
    taskList.appendChild(el);
  });

  updateCounters();
}

function applyFilter() {
  const items = taskList.querySelectorAll(".task-item");

  items.forEach(function (item, index) {
    const task = tasks[index];
    item.style.display = matchesFilter(task) ? "" : "none";
  });
}

addBtn.addEventListener("click", addTask);

taskInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    addTask();
  }
});

filterButtons.forEach(function (btn) {
  btn.addEventListener("click", function () {
    filterButtons.forEach(function (b) {
      b.classList.remove("active");
    });
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    applyFilter();
  });
});

render();
