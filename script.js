// Task Manager App - JavaScript with CRUD Operations

class TaskManager {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.render();
    }

    cacheDOM() {
        this.taskInput = document.getElementById('taskInput');
        this.addBtn = document.getElementById('addBtn');
        this.taskList = document.getElementById('taskList');
        this.emptyState = document.getElementById('emptyState');
        this.clearBtn = document.getElementById('clearBtn');
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.totalTasksSpan = document.getElementById('totalTasks');
        this.completedTasksSpan = document.getElementById('completedTasks');
        this.pendingTasksSpan = document.getElementById('pendingTasks');
    }

    bindEvents() {
        // Add Task
        this.addBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        // Clear Completed
        this.clearBtn.addEventListener('click', () => this.clearCompleted());

        // Filter Tasks
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.render();
            });
        });

        // Event Delegation for Task Actions
        this.taskList.addEventListener('click', (e) => {
            const taskItem = e.target.closest('.task-item');
            if (!taskItem) return;

            const taskId = parseInt(taskItem.dataset.id);

            if (e.target.classList.contains('checkbox')) {
                this.toggleTask(taskId);
            } else if (e.target.classList.contains('btn-delete')) {
                this.deleteTask(taskId);
            } else if (e.target.classList.contains('btn-edit')) {
                this.enterEditMode(taskItem, taskId);
            } else if (e.target.classList.contains('btn-save')) {
                this.saveEditedTask(taskItem, taskId);
            } else if (e.target.classList.contains('btn-cancel')) {
                this.exitEditMode(taskItem);
            }
        });
    }

    // CREATE: Add a new task
    addTask() {
        const taskText = this.taskInput.value.trim();

        if (!taskText) {
            alert('Please enter a task!');
            this.taskInput.focus();
            return;
        }

        const newTask = {
            id: Date.now(),
            text: taskText,
            completed: false,
            createdAt: new Date().toLocaleString()
        };

        this.tasks.push(newTask);
        this.saveTasks();
        this.taskInput.value = '';
        this.taskInput.focus();
        this.render();
    }

    // READ: Get filtered tasks
    getFilteredTasks() {
        if (this.currentFilter === 'completed') {
            return this.tasks.filter(task => task.completed);
        } else if (this.currentFilter === 'pending') {
            return this.tasks.filter(task => !task.completed);
        }
        return this.tasks;
    }

    // UPDATE: Toggle task completion
    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.render();
        }
    }

    // UPDATE: Enter edit mode
    enterEditMode(taskItem, taskId) {
        if (taskItem.classList.contains('edit-mode')) return;

        const taskText = taskItem.querySelector('.task-text');
        const currentText = taskText.textContent;

        taskItem.classList.add('edit-mode');

        const editHTML = `
            <input type="text" class="edit-input" value="${currentText}" autofocus>
            <button class="btn-save">Save</button>
            <button class="btn-cancel">Cancel</button>
        `;

        taskItem.innerHTML = `
            <input type="checkbox" class="checkbox" ${taskItem.classList.contains('completed') ? 'checked' : ''}>
            ${editHTML}
        `;

        taskItem.querySelector('.edit-input').focus();
    }

    // UPDATE: Save edited task
    saveEditedTask(taskItem, taskId) {
        const editInput = taskItem.querySelector('.edit-input');
        const newText = editInput.value.trim();

        if (!newText) {
            alert('Task cannot be empty!');
            editInput.focus();
            return;
        }

        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.text = newText;
            this.saveTasks();
            this.render();
        }
    }

    // EXIT: Exit edit mode
    exitEditMode(taskItem) {
        this.render();
    }

    // DELETE: Remove a task
    deleteTask(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(task => task.id !== id);
            this.saveTasks();
            this.render();
        }
    }

    // DELETE: Clear completed tasks
    clearCompleted() {
        const completedCount = this.tasks.filter(t => t.completed).length;
        if (completedCount === 0) {
            alert('No completed tasks to clear!');
            return;
        }

        if (confirm(`Delete ${completedCount} completed task(s)?`)) {
            this.tasks = this.tasks.filter(task => !task.completed);
            this.saveTasks();
            this.currentFilter = 'all';
            this.filterBtns.forEach(b => b.classList.remove('active'));
            this.filterBtns[0].classList.add('active');
            this.render();
        }
    }

    // Persistence: Load tasks from localStorage
    loadTasks() {
        const saved = localStorage.getItem('tasks');
        return saved ? JSON.parse(saved) : [];
    }

    // Persistence: Save tasks to localStorage
    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    // RENDER: Display tasks
    render() {
        this.taskList.innerHTML = '';
        const filteredTasks = this.getFilteredTasks();

        if (filteredTasks.length === 0) {
            this.emptyState.classList.add('show');
            this.taskList.innerHTML = '';
        } else {
            this.emptyState.classList.remove('show');
            filteredTasks.forEach(task => {
                const li = document.createElement('li');
                li.className = `task-item ${task.completed ? 'completed' : ''}`;
                li.dataset.id = task.id;

                li.innerHTML = `
                    <input type="checkbox" class="checkbox" ${task.completed ? 'checked' : ''}>
                    <span class="task-text">${this.escapeHtml(task.text)}</span>
                    <div class="task-actions">
                        <button class="btn-edit">Edit</button>
                        <button class="btn-delete">Delete</button>
                    </div>
                `;

                this.taskList.appendChild(li);
            });
        }

        this.updateStats();
        this.updateClearButtonState();
    }

    // Update statistics
    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const pending = total - completed;

        this.totalTasksSpan.textContent = total;
        this.completedTasksSpan.textContent = completed;
        this.pendingTasksSpan.textContent = pending;
    }

    // Update clear button state
    updateClearButtonState() {
        const hasCompleted = this.tasks.some(t => t.completed);
        this.clearBtn.disabled = !hasCompleted;
    }

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new TaskManager();
});
