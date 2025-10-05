const taskInput = document.getElementById("task-input");
const taskDescriptionInput = document.getElementById("task-description-input");
const addBtn = document.getElementById("add-task");
const taskList = document.getElementById("task-list");
const filterBtns = document.querySelectorAll(".filters button[data-filter]");
const clearAllBtn = document.getElementById("clear-all");
const totalTasksSpan = document.getElementById("total-tasks");
const completedTasksSpan = document.getElementById("completed-tasks");
const datetimeDiv = document.getElementById("datetime");
const modeToggle = document.getElementById("mode-toggle");
const filtersDiv = document.querySelector(".filters");
const filterToggleMobile = document.getElementById("filter-toggle-mobile");

const modalOverlay = document.getElementById("confirmation-modal");
const modalTaskText = document.getElementById("modal-task-text");
const modalConfirmBtn = document.getElementById("modal-confirm-btn");
const modalCancelBtn = document.getElementById("modal-cancel-btn");

const editModalOverlay = document.getElementById("edit-modal");
const editTaskForm = document.getElementById("edit-task-form");
const editTaskTitle = document.getElementById("edit-task-title");
const editTaskDescription = document.getElementById("edit-task-description");
const editCancelBtn = document.getElementById("edit-cancel-btn");

// --- Initialization and Persistence ---

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
tasks = tasks.map(task => ({
    ...task,
    description: task.description || "",
    isEdited: task.isEdited || false,
}));

function applyThemePreference() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
        modeToggle.textContent = "☀";
    } else {
        document.body.classList.remove('dark');
        modeToggle.textContent = "🌙";
    }
}
applyThemePreference();

// --- Confirmation Modal ---

function hideConfirmModal() {
    modalOverlay.classList.remove('visible');
    modalConfirmBtn.dataset.actionType = '';
    modalConfirmBtn.dataset.taskIndex = ''; 
    modalConfirmBtn.textContent = 'Delete';
}

function showConfirmModal(actionType, index = null) {
    if (actionType === 'single' && index !== null) {
        const taskName = tasks[index].text;
        modalTaskText.innerHTML = `Are you sure you want to delete the task: <strong>"${taskName}"</strong>?`;
        modalConfirmBtn.dataset.taskIndex = index;
        modalConfirmBtn.dataset.actionType = 'single';
        modalConfirmBtn.textContent = 'Delete';
    } else if (actionType === 'all') {
        modalTaskText.innerHTML = `Are you sure you want to delete <strong>ALL</strong> ${tasks.length} tasks? This action cannot be undone.`;
        modalConfirmBtn.dataset.actionType = 'all'; 
        modalConfirmBtn.dataset.taskIndex = '';
        modalConfirmBtn.textContent = 'Delete All';
    } else {
        return; 
    }
    
    modalOverlay.classList.add('visible');
}

modalConfirmBtn.addEventListener('click', () => {
    const actionType = modalConfirmBtn.dataset.actionType;
    
    if (actionType === 'single') {
        const index = parseInt(modalConfirmBtn.dataset.taskIndex);
        if (!isNaN(index)) {
            tasks.splice(index, 1);
        }
    } else if (actionType === 'all') {
        tasks = [];
    }
    
    saveTasks();
    const currentFilter = document.querySelector('.filters button.active')?.dataset.filter || 'all';
    renderTasks(currentFilter);
    hideConfirmModal();
});

modalCancelBtn.addEventListener('click', hideConfirmModal);
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
        hideConfirmModal();
    }
});

// --- Edit Modal ---

let currentEditIndex = null;

function hideEditModal() {
    editModalOverlay.classList.remove('visible');
    currentEditIndex = null;
    editTaskForm.reset();
}

function showEditModal(index) {
    currentEditIndex = index;
    editTaskTitle.value = tasks[index].text;
    editTaskDescription.value = tasks[index].description;
    editModalOverlay.classList.add('visible');
}

editCancelBtn.addEventListener('click', hideEditModal);
editModalOverlay.addEventListener('click', (e) => {
    if (e.target === editModalOverlay) {
        hideEditModal();
    }
});

editTaskForm.addEventListener('submit', (e) => {
    e.preventDefault();

    if (currentEditIndex === null) return;

    const newTitle = editTaskTitle.value.trim();
    const newDescription = editTaskDescription.value.trim();
    const task = tasks[currentEditIndex];

    const titleChanged = newTitle !== task.text;
    const descriptionChanged = newDescription !== task.description;

    if (titleChanged || descriptionChanged) {
        task.text = newTitle;
        task.description = newDescription;
        task.isEdited = true;
        saveTasks();
        
        const currentFilter = document.querySelector('.filters button.active')?.dataset.filter || 'all';
        renderTasks(currentFilter);
    }
    
    hideEditModal();
});

// --- Task Rendering and Actions ---

function renderTasks(filter="all") {
    taskList.innerHTML = "";
    let filteredTasks = tasks;
    
    if(filter === "completed") filteredTasks = tasks.filter(t => t.completed);
    if(filter === "pending") filteredTasks = tasks.filter(t => !t.completed);

    filteredTasks.forEach((task, index) => {
        const originalIndex = tasks.findIndex(t => t === task); 

        const li = document.createElement("li");
        li.className = task.completed ? "completed" : "";
        
        const taskInfo = document.createElement("div");
        taskInfo.className = "task-info";

        const numberSpan = document.createElement("span");
        numberSpan.className = "task-number";
        numberSpan.textContent = `${index + 1}. `; 
        taskInfo.appendChild(numberSpan);

        const textSpan = document.createElement("span");
        textSpan.className = "task-text"; 
        textSpan.textContent = task.text;
        taskInfo.appendChild(textSpan);
        
        if (task.isEdited) {
            const editedTag = document.createElement("span");
            editedTag.className = "edited-tag";
            editedTag.textContent = "Edited";
            taskInfo.appendChild(editedTag);
        }

        let toggleBtn;
        if (task.description) {
            toggleBtn = document.createElement("button");
            toggleBtn.className = "description-toggle";
            toggleBtn.innerHTML = "▼";
            toggleBtn.title = "Toggle Description";
            if (task.isDescriptionExpanded) {
                 toggleBtn.classList.add('rotated');
            }
            toggleBtn.addEventListener("click", () => toggleDescription(task));
            taskInfo.appendChild(toggleBtn);
        }
        
        const timeSpan = document.createElement("span");
        timeSpan.className = "task-time";
        timeSpan.textContent = task.completed 
            ? `Completed: ${task.completedTime}` 
            : `Added: ${task.addedTime}`;
        taskInfo.appendChild(timeSpan);

        const badge = document.createElement("span");
        badge.className = `badge ${task.completed ? 'completed' : 'pending'}`;
        badge.textContent = task.completed ? 'Completed' : 'Pending';
        taskInfo.appendChild(badge);
        
        li.appendChild(taskInfo);

        const actionsDiv = document.createElement("div");
        actionsDiv.className = "task-actions";

        const toggleCompleteBtn = document.createElement("button");
        toggleCompleteBtn.textContent = task.completed ? "↩" : "✔";
        toggleCompleteBtn.title = task.completed ? "Mark as Pending" : "Mark as Completed";
        toggleCompleteBtn.addEventListener("click", () => toggleComplete(originalIndex));
        actionsDiv.appendChild(toggleCompleteBtn);
        
        const editBtn = document.createElement("button");
        editBtn.className = "edit-icon";
        editBtn.textContent = "✏️";
        editBtn.title = "Edit Task";
        editBtn.addEventListener("click", () => showEditModal(originalIndex));
        actionsDiv.appendChild(editBtn);

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "🗑";
        deleteBtn.addEventListener("click", () => showConfirmModal('single', originalIndex)); 
        actionsDiv.appendChild(deleteBtn);
        
        li.appendChild(actionsDiv);
        
        if (task.description) {
            const descriptionDiv = document.createElement("div");
            descriptionDiv.className = "task-description";
            descriptionDiv.innerHTML = task.description.replace(/\n/g, '<br>');
            if (task.isDescriptionExpanded) {
                descriptionDiv.classList.add('expanded');
            }
            li.appendChild(descriptionDiv);
        }
        
        taskList.appendChild(li);
    });
    updateCounts();
}

function toggleDescription(task) {
    task.isDescriptionExpanded = !task.isDescriptionExpanded;
    const currentFilter = document.querySelector('.filters button.active')?.dataset.filter || 'all';
    renderTasks(currentFilter);
}

addBtn.addEventListener("click", () => {
    const text = taskInput.value.trim();
    const description = taskDescriptionInput.value.trim();

    if(text) {
        const now = new Date();
        const addedTime = now.toLocaleString();
        tasks.push({
            text, 
            description,
            completed: false, 
            addedTime, 
            completedTime: null,
            isEdited: false 
        });
        saveTasks();
        taskInput.value = "";
        taskDescriptionInput.value = "";
        
        const currentFilter = document.querySelector('.filters button.active')?.dataset.filter || 'all';
        renderTasks(currentFilter); 
    }
});

function toggleComplete(index) {
    tasks[index].completed = !tasks[index].completed;
    if(tasks[index].completed) {
        const now = new Date();
        tasks[index].completedTime = now.toLocaleString();
    } else {
        tasks[index].completedTime = null;
    }
    saveTasks();
    const currentFilter = document.querySelector('.filters button.active')?.dataset.filter || 'all';
    renderTasks(currentFilter);
}

clearAllBtn.addEventListener("click", () => {
    if (tasks.length === 0) {
        alert("Your TO-DO list is already empty!"); 
        return;
    }
    showConfirmModal('all'); 
});

filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderTasks(btn.dataset.filter);
        
        if (window.innerWidth <= 600) {
            filtersDiv.classList.remove('active');
            filterToggleMobile.textContent = 'Filter Tasks ▼';
        }
    });
});

filterToggleMobile.addEventListener("click", () => {
    filtersDiv.classList.toggle("active");
    if (filtersDiv.classList.contains('active')) {
        filterToggleMobile.textContent = 'Filter Tasks ▲';
    } else {
        filterToggleMobile.textContent = 'Filter Tasks ▼';
    }
});

document.querySelector('.filters button[data-filter="all"]').classList.add('active');

modeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    modeToggle.textContent = isDark ? "🔆" : "🌙";
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

function saveTasks() {
    const tasksToSave = tasks.map(({ isDescriptionExpanded, ...rest }) => rest);
    localStorage.setItem("tasks", JSON.stringify(tasksToSave));
}

function updateCounts() {
    totalTasksSpan.textContent = `Total Tasks: ${tasks.length}`;
    completedTasksSpan.textContent = `Completed: ${tasks.filter(t => t.completed).length}`;
}

function updateDateTime() {
    const now = new Date();
    datetimeDiv.textContent = now.toLocaleString();
}
setInterval(updateDateTime, 1000); 
updateDateTime();
renderTasks();
