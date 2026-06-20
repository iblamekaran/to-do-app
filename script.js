let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

let stats = JSON.parse(localStorage.getItem("stats")) || {
  completedSessions: 0,
  focusTime: 0,
  streak: 0
};

let currentFilter = "all";

// ============================
// DOM ELEMENTS
// ============================

const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskList = document.getElementById("taskList");

const totalTasks = document.getElementById("totalTasks");
const completedTasks = document.getElementById("completedTasks");

const searchInput = document.getElementById("searchInput");

const filterButtons = document.querySelectorAll(".filter-btn");

// ============================
// ADD TASK
// ============================

addTaskBtn.addEventListener("click", addTask);

taskInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    addTask();
  }
});

function addTask() {

  const text = taskInput.value.trim();

  const priority = document.getElementById("prioritySelect").value;

  if (text === "") return;

  const task = {
    id: Date.now(),
    text,
    completed: false,
    priority,
    createdAt: new Date().toLocaleString()
  };

  tasks.push(task);

  saveTasks();

  renderTasks();

  taskInput.value = "";
}

// ============================
// RENDER TASKS
// ============================

function renderTasks() {

  taskList.innerHTML = "";

  let filteredTasks = tasks;

  // FILTER
  if (currentFilter === "completed") {
    filteredTasks = tasks.filter(task => task.completed);
  }

  if (currentFilter === "pending") {
    filteredTasks = tasks.filter(task => !task.completed);
  }

  // SEARCH
  const searchText = searchInput.value.toLowerCase();

  filteredTasks = filteredTasks.filter(task =>
    task.text.toLowerCase().includes(searchText)
  );

  filteredTasks.forEach(task => {

    const li = document.createElement("li");

    li.className = `
      task
      ${task.completed ? "completed" : ""}
      priority-${task.priority.toLowerCase()}
    `;

    li.innerHTML = `
      <div class="task-left">
        <input type="checkbox" ${task.completed ? "checked" : ""}>
        
        <div>
          <p class="task-text">${task.text}</p>
          <small>${task.createdAt}</small>
        </div>
      </div>

      <div>
        <button onclick="editTask(${task.id})">✏️</button>
        <button onclick="deleteTask(${task.id})">🗑️</button>
      </div>
    `;

    const checkbox = li.querySelector("input");

    checkbox.addEventListener("change", () => {
      toggleTask(task.id);
    });

    taskList.appendChild(li);
  });

  updateStats();
}

// ============================
// TOGGLE TASK
// ============================

function toggleTask(id) {

  tasks = tasks.map(task => {
    if (task.id === id) {
      return {
        ...task,
        completed: !task.completed
      };
    }
    return task;
  });

  saveTasks();
  renderTasks();
}

// ============================
// DELETE TASK
// ============================

function deleteTask(id) {

  tasks = tasks.filter(task => task.id !== id);

  saveTasks();
  renderTasks();
}

// ============================
// EDIT TASK
// ============================

function editTask(id) {

  const task = tasks.find(task => task.id === id);

  const updatedText = prompt("Edit task:", task.text);

  if (updatedText === null) return;

  task.text = updatedText;

  saveTasks();
  renderTasks();
}

// ============================
// FILTER BUTTONS
// ============================

filterButtons.forEach(btn => {

  btn.addEventListener("click", () => {

    document
      .querySelector(".filter-btn.active")
      .classList.remove("active");

    btn.classList.add("active");

    currentFilter = btn.dataset.filter;

    renderTasks();
  });
});

// ============================
// SEARCH
// ============================

searchInput.addEventListener("input", renderTasks);

// ============================
// SAVE TASKS
// ============================

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// ============================
// UPDATE STATS
// ============================

function updateStats() {

  totalTasks.textContent = tasks.length;

  const completed = tasks.filter(task => task.completed).length;

  completedTasks.textContent = completed;

  document.getElementById("completedSessions").textContent =
    stats.completedSessions;

  document.getElementById("focusTime").textContent =
    `${stats.focusTime} mins`;

  document.getElementById("streak").textContent =
    stats.streak;
}

// ============================
// POMODORO TIMER
// ============================

let timer;
let timeLeft;
let currentSession = "work";
let workSessions = 0;
let isRunning = false;

const timerDisplay = document.getElementById("timerDisplay");

const workDurationInput =
  document.getElementById("workDuration");

const shortDurationInput =
  document.getElementById("shortDuration");

const longDurationInput =
  document.getElementById("longDuration");

// ============================
// GET DURATION
// ============================

function getDuration(session) {

  if (session === "work") {
    return workDurationInput.value * 60;
  }

  if (session === "short") {
    return shortDurationInput.value * 60;
  }

  return longDurationInput.value * 60;
}

// ============================
// UPDATE DISPLAY
// ============================

function updateTimerDisplay() {

  const minutes = Math.floor(timeLeft / 60);

  const seconds = timeLeft % 60;

  timerDisplay.textContent =
    `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

// ============================
// START TIMER
// ============================

document.getElementById("startBtn")
.addEventListener("click", startTimer);

function startTimer() {

  if (isRunning) return;

  isRunning = true;

  timer = setInterval(() => {

    if (timeLeft > 0) {

      timeLeft--;

      updateTimerDisplay();

    } else {

      clearInterval(timer);

      isRunning = false;

      sessionComplete();
    }

  }, 1000);
}

// ============================
// PAUSE TIMER
// ============================

document.getElementById("pauseBtn")
.addEventListener("click", () => {

  clearInterval(timer);

  isRunning = false;
});

// ============================
// RESET TIMER
// ============================

document.getElementById("resetBtn")
.addEventListener("click", () => {

  clearInterval(timer);

  isRunning = false;

  timeLeft = getDuration(currentSession);

  updateTimerDisplay();
});

// ============================
// SESSION COMPLETE
// ============================

function sessionComplete() {

  document.getElementById("alarmSound").play();

  // NOTIFICATION
  if (Notification.permission === "granted") {

    new Notification("Session Completed!");
  }

  // WORK SESSION FINISHED
  if (currentSession === "work") {

    workSessions++;

    stats.completedSessions++;

    stats.focusTime += Number(workDurationInput.value);

    // LONG BREAK AFTER 4 SESSIONS
    if (workSessions % 4 === 0) {

      switchSession("long");

    } else {

      switchSession("short");
    }

  } else {

    switchSession("work");
  }

  saveStats();

  renderTasks();

  startTimer();
}

// ============================
// SWITCH SESSION
// ============================

function switchSession(session) {

  currentSession = session;

  document
    .querySelector(".active-session")
    .classList.remove("active-session");

  document
    .querySelector(`[data-session="${session}"]`)
    .classList.add("active-session");

  timeLeft = getDuration(session);

  updateTimerDisplay();
}

// ============================
// SESSION BUTTONS
// ============================

document.querySelectorAll(".session-btn")
.forEach(btn => {

  btn.addEventListener("click", () => {

    clearInterval(timer);

    isRunning = false;

    switchSession(btn.dataset.session);
  });
});

// ============================
// SAVE STATS
// ============================

function saveStats() {

  localStorage.setItem("stats", JSON.stringify(stats));
}

// ============================
// SAVE TIMER SETTINGS
// ============================

function saveTimerSettings() {

  const settings = {
    work: workDurationInput.value,
    short: shortDurationInput.value,
    long: longDurationInput.value
  };

  localStorage.setItem(
    "timerSettings",
    JSON.stringify(settings)
  );
}

// ============================
// LOAD TIMER SETTINGS
// ============================

function loadTimerSettings() {

  const settings =
    JSON.parse(localStorage.getItem("timerSettings"));

  if (!settings) return;

  workDurationInput.value = settings.work;

  shortDurationInput.value = settings.short;

  longDurationInput.value = settings.long;
}

// SAVE SETTINGS ON CHANGE

[
  workDurationInput,
  shortDurationInput,
  longDurationInput
].forEach(input => {

  input.addEventListener("change", () => {

    saveTimerSettings();

    switchSession(currentSession);
  });
});

// ============================
// DARK MODE
// ============================

const themeToggle =
  document.getElementById("themeToggle");

themeToggle.addEventListener("click", () => {

  document.body.classList.toggle("light");
});

// ============================
// NOTIFICATION PERMISSION
// ============================

if ("Notification" in window) {

  Notification.requestPermission();
}
