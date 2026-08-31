(function () {
    'use strict';

    const STORAGE_KEY = 'agenda_tasks_by_date';
    const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const dayNameEl = document.getElementById('day-name');
    const dayDateEl = document.getElementById('day-date');
    const taskListEl = document.getElementById('task-list');
    const emptyStateEl = document.getElementById('empty-state');
    const addFormEl = document.getElementById('add-form');
    const timeInputEl = document.getElementById('task-time');
    const titleInputEl = document.getElementById('task-title');

    function dateKey(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function loadStore() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
        } catch {
            return {};
        }
    }

    function saveStore(store) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    }

    function getTasksForCurrentDay() {
        const store = loadStore();
        return store[dateKey(currentDate)] || [];
    }

    function setTasksForCurrentDay(tasks) {
        const store = loadStore();
        store[dateKey(currentDate)] = tasks;
        saveStore(store);
    }

    function renderHeader() {
        dayNameEl.textContent = DAY_NAMES[currentDate.getDay()];
        dayDateEl.textContent = currentDate.toLocaleDateString('he-IL', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
    }

    function renderTasks() {
        const tasks = getTasksForCurrentDay()
            .slice()
            .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

        taskListEl.innerHTML = '';
        emptyStateEl.classList.toggle('hidden', tasks.length > 0);

        tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = 'task-item' + (task.done ? ' done' : '');
            li.dataset.id = task.id;

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'task-checkbox';
            checkbox.checked = task.done;
            checkbox.addEventListener('change', () => toggleDone(task.id));

            const time = document.createElement('span');
            time.className = 'task-time';
            time.textContent = task.time || '';

            const title = document.createElement('span');
            title.className = 'task-title';
            title.textContent = task.title;

            const del = document.createElement('button');
            del.className = 'delete-btn';
            del.setAttribute('aria-label', 'מחק');
            del.textContent = '×';
            del.addEventListener('click', () => deleteTask(task.id));

            li.append(checkbox, time, title, del);
            taskListEl.appendChild(li);
        });
    }

    function render() {
        renderHeader();
        renderTasks();
    }

    function addTask(time, title) {
        const tasks = getTasksForCurrentDay();
        tasks.push({
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            time,
            title,
            done: false
        });
        setTasksForCurrentDay(tasks);
        render();
    }

    function toggleDone(id) {
        const tasks = getTasksForCurrentDay();
        const task = tasks.find(t => t.id === id);
        if (task) task.done = !task.done;
        setTasksForCurrentDay(tasks);
        render();
    }

    function deleteTask(id) {
        const tasks = getTasksForCurrentDay().filter(t => t.id !== id);
        setTasksForCurrentDay(tasks);
        render();
    }

    function changeDay(offset) {
        currentDate.setDate(currentDate.getDate() + offset);
        render();
    }

    addFormEl.addEventListener('submit', e => {
        e.preventDefault();
        const title = titleInputEl.value.trim();
        if (!title) return;
        addTask(timeInputEl.value, title);
        titleInputEl.value = '';
        timeInputEl.value = '';
        titleInputEl.focus();
    });

    document.getElementById('prev-day').addEventListener('click', () => changeDay(-1));
    document.getElementById('next-day').addEventListener('click', () => changeDay(1));
    document.getElementById('today-btn').addEventListener('click', () => {
        currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        render();
    });

    render();
})();
