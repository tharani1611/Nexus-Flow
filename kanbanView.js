import { state } from '../state.js';
import { api } from '../api.js';
import { showToast } from '../app.js';
import { socketService } from '../socket.js';

export const kanbanView = {
  activeProjectId: null,
  activeSprint: null,
  sprints: [],

  async render(container, projectId) {
    if (!projectId) {
      // Pick first project if available
      if (state.projects.length > 0) {
        projectId = state.projects[0]._id;
      } else {
        container.innerHTML = `
          <div class="glass-card p-5 text-center my-auto">
            <i class="bi bi-kanban" style="font-size: 40px; color: var(--text-secondary);"></i>
            <h5 class="mt-3">No Active Projects</h5>
            <p style="color:var(--text-secondary);">Create a project first in the "Projects" tab to access the Kanban board.</p>
          </div>
        `;
        return;
      }
    }

    this.activeProjectId = projectId;
    socketService.joinProject(projectId);

    // Initial skeleton
    container.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <h4 style="font-weight:700; margin:0;" id="kanban-project-title">Kanban Board</h4>
          <span style="font-size:12px; color:var(--text-secondary);" id="kanban-project-desc"></span>
        </div>

        <!-- Sprint Control Widget -->
        <div class="d-flex align-items-center gap-2 glass-card p-2" style="background:rgba(0,0,0,0.1); border-radius:12px;">
          <select class="form-select bg-dark text-light border-secondary form-select-sm" id="sprint-selector" style="width:160px;">
            <option value="all">All Sprints</option>
            <option value="none">No Sprint / Backlog</option>
          </select>
          <button class="btn btn-sm btn-indigo" id="create-sprint-btn" style="background:var(--accent-gradient); border:none; color:white; font-weight:600;">+ Sprint</button>
          <button class="btn btn-sm btn-outline-light" id="sprint-status-btn" style="display:none; font-weight:600;"></button>
        </div>
      </div>

      <!-- Quick Add Task Bar -->
      <div class="glass-card p-3 d-flex align-items-center gap-3">
        <input type="text" class="form-control bg-dark text-light border-secondary" id="quick-task-title-input" placeholder="Quickly add task to Todo (type and hit Enter)...">
        <button class="btn btn-indigo" id="quick-task-add-btn" style="background:var(--accent-gradient); border:none; color:white; font-weight:600; min-width:110px;">Add Task</button>
      </div>

      <!-- Columns Container -->
      <div class="kanban-board-container mt-2">
        <!-- Backlog -->
        <div class="kanban-column" data-status="Backlog">
          <div class="column-header">
            <span>Backlog</span>
            <span class="column-count" id="count-Backlog">0</span>
          </div>
          <div class="task-list-cards" id="list-Backlog"></div>
        </div>

        <!-- Todo -->
        <div class="kanban-column" data-status="Todo">
          <div class="column-header">
            <span>To Do</span>
            <span class="column-count" id="count-Todo">0</span>
          </div>
          <div class="task-list-cards" id="list-Todo"></div>
        </div>

        <!-- In Progress -->
        <div class="kanban-column" data-status="In Progress">
          <div class="column-header">
            <span>In Progress</span>
            <span class="column-count" id="count-In-Progress">0</span>
          </div>
          <div class="task-list-cards" id="list-In-Progress"></div>
        </div>

        <!-- Review -->
        <div class="kanban-column" data-status="Review">
          <div class="column-header">
            <span>Review</span>
            <span class="column-count" id="count-Review">0</span>
          </div>
          <div class="task-list-cards" id="list-Review"></div>
        </div>

        <!-- Testing -->
        <div class="kanban-column" data-status="Testing">
          <div class="column-header">
            <span>Testing</span>
            <span class="column-count" id="count-Testing">0</span>
          </div>
          <div class="task-list-cards" id="list-Testing"></div>
        </div>

        <!-- Done -->
        <div class="kanban-column" data-status="Done">
          <div class="column-header">
            <span>Done</span>
            <span class="column-count" id="count-Done">0</span>
          </div>
          <div class="task-list-cards" id="list-Done"></div>
        </div>
      </div>
    `;

    this.bindEvents();
    await this.fetchProjectMeta();
    await this.fetchSprints();
    await this.fetchTasks();
  },

  async fetchProjectMeta() {
    try {
      const proj = await api.get(`/projects/${this.activeProjectId}`);
      document.getElementById('kanban-project-title').textContent = proj.name;
      document.getElementById('kanban-project-desc').textContent = proj.description || '';
    } catch (err) {
      console.error(err);
    }
  },

  async fetchSprints() {
    try {
      const list = await api.get(`/sprints/project/${this.activeProjectId}`);
      this.sprints = list;

      const selector = document.getElementById('sprint-selector');
      // Keep only initial values
      selector.innerHTML = `
        <option value="all">All Sprints</option>
        <option value="none">No Sprint / Backlog</option>
      `;

      list.forEach(sp => {
        const option = document.createElement('option');
        option.value = sp._id;
        option.textContent = `${sp.name} [${sp.status}]`;
        selector.appendChild(option);
      });

      // Bind selector changes
      selector.addEventListener('change', () => {
        this.fetchTasks();
        this.updateSprintStatusWidget();
      });

    } catch (err) {
      console.error(err);
    }
  },

  updateSprintStatusWidget() {
    const sprintId = document.getElementById('sprint-selector').value;
    const btn = document.getElementById('sprint-status-btn');
    
    if (sprintId === 'all' || sprintId === 'none') {
      btn.style.display = 'none';
      return;
    }

    const sprint = this.sprints.find(s => s._id === sprintId);
    if (!sprint) {
      btn.style.display = 'none';
      return;
    }

    btn.style.display = 'inline-block';
    if (sprint.status === 'Planned') {
      btn.textContent = 'Start Sprint';
      btn.className = 'btn btn-sm btn-success';
    } else if (sprint.status === 'Active') {
      btn.textContent = 'Complete Sprint';
      btn.className = 'btn btn-sm btn-warning';
    } else {
      btn.textContent = 'Sprint Completed';
      btn.className = 'btn btn-sm btn-secondary disabled';
    }
  },

  async fetchTasks() {
    try {
      const allTasks = await api.get(`/tasks/project/${this.activeProjectId}`);
      const selectedSprint = document.getElementById('sprint-selector').value;

      // Filter tasks based on sprint selection
      let tasks = allTasks;
      if (selectedSprint === 'none') {
        tasks = allTasks.filter(t => !t.sprint);
      } else if (selectedSprint !== 'all') {
        tasks = allTasks.filter(t => t.sprint && t.sprint === selectedSprint);
      }

      // Clear all columns
      const cols = ['Backlog', 'Todo', 'In Progress', 'Review', 'Testing', 'Done'];
      cols.forEach(col => {
        const listDiv = document.getElementById(this.getColumnId(col));
        listDiv.innerHTML = '';
        document.getElementById(`count-${this.getColumnId(col).replace('list-', '')}`).textContent = '0';
      });

      // Render tasks in correct lists
      tasks.forEach(task => {
        const colId = this.getColumnId(task.status);
        const listDiv = document.getElementById(colId);
        if (!listDiv) return;

        const card = document.createElement('div');
        card.className = `glass-card task-card priority-${task.priority.toLowerCase()}`;
        card.draggable = true;
        card.dataset.taskid = task._id;
        card.innerHTML = `
          <div class="task-card-title">${task.title}</div>
          <div class="task-labels">
            ${task.labels.map(l => `<span class="label-badge">${l}</span>`).join('')}
          </div>
          <div class="task-card-meta">
            <span>Points: ${task.storyPoints || 0}</span>
            <img src="${task.assignee ? (task.assignee.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=50&q=80') : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=50&q=80'}" style="width:20px; height:20px; border-radius:50%; object-fit:cover;" title="${task.assignee ? task.assignee.name : 'Unassigned'}">
          </div>
        `;

        // Card drag start
        card.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/plain', task._id);
          card.style.opacity = '0.4';
        });

        card.addEventListener('dragend', () => {
          card.style.opacity = '1';
        });

        // Open details on double click
        card.addEventListener('dblclick', () => {
          window.dispatchEvent(new CustomEvent('open-task-detail', { detail: { taskId: task._id } }));
        });

        listDiv.appendChild(card);

        // Update count
        const countSpan = document.getElementById(`count-${task.status.replace(' ', '-')}`);
        if (countSpan) {
          countSpan.textContent = parseInt(countSpan.textContent) + 1;
        }
      });

    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  getColumnId(status) {
    switch (status) {
      case 'Backlog': return 'list-Backlog';
      case 'Todo': return 'list-Todo';
      case 'In Progress': return 'list-In-Progress';
      case 'Review': return 'list-Review';
      case 'Testing': return 'list-Testing';
      case 'Done': return 'list-Done';
      default: return 'list-Todo';
    }
  },

  bindEvents() {
    // Quick task creation
    const titleInput = document.getElementById('quick-task-title-input');
    const addBtn = document.getElementById('quick-task-add-btn');

    const handleQuickAdd = async () => {
      const title = titleInput.value;
      if (!title || !title.trim()) return;

      const selectedSprint = document.getElementById('sprint-selector').value;
      const sprintVal = (selectedSprint !== 'all' && selectedSprint !== 'none') ? selectedSprint : null;

      try {
        await api.post(`/tasks/workspace/${state.currentWorkspace._id}`, {
          title,
          project: this.activeProjectId,
          sprint: sprintVal,
          status: 'Todo'
        });

        titleInput.value = '';
        showToast('Task added!');
        this.fetchTasks();
      } catch (err) {
        showToast(err.message, 'error');
      }
    };

    addBtn.addEventListener('click', handleQuickAdd);
    titleInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleQuickAdd();
    });

    // Drag over lists configurations
    document.querySelectorAll('.task-list-cards').forEach(listDiv => {
      listDiv.addEventListener('dragover', (e) => {
        e.preventDefault();
        listDiv.style.background = 'rgba(255,255,255,0.03)';
      });

      listDiv.addEventListener('dragleave', () => {
        listDiv.style.background = 'transparent';
      });

      listDiv.addEventListener('drop', async (e) => {
        e.preventDefault();
        listDiv.style.background = 'transparent';

        const taskId = e.dataTransfer.getData('text/plain');
        const targetStatus = listDiv.id.replace('list-', '').replace('-', ' ');

        try {
          const task = await api.get(`/tasks/${taskId}`);
          const sourceStatus = task.task.status;

          if (sourceStatus === targetStatus) return;

          // Update status on API
          await api.put(`/tasks/${taskId}`, { status: targetStatus });

          // Notify socket server
          socketService.emitTaskMoved({
            taskId,
            project: this.activeProjectId,
            workspace: state.currentWorkspace._id,
            sourceStatus,
            targetStatus
          });

          showToast(`Task moved to ${targetStatus}`);
          this.fetchTasks();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    });

    // Create sprint button
    document.getElementById('create-sprint-btn').addEventListener('click', () => {
      this.showCreateSprintModal();
    });

    // Sprint actions start/complete
    document.getElementById('sprint-status-btn').addEventListener('click', async () => {
      const sprintId = document.getElementById('sprint-selector').value;
      const sprint = this.sprints.find(s => s._id === sprintId);
      if (!sprint) return;

      try {
        if (sprint.status === 'Planned') {
          await api.post(`/sprints/${sprintId}/start`);
          showToast('Sprint started successfully!');
        } else if (sprint.status === 'Active') {
          const moveOption = prompt('Sprint finished. Move incomplete tasks to: (type "backlog" or leave blank for none)', 'backlog');
          await api.post(`/sprints/${sprintId}/complete`, { moveIncompleteTo: moveOption || 'backlog' });
          showToast('Sprint completed successfully!');
        }
        await this.fetchSprints();
        this.updateSprintStatusWidget();
        this.fetchTasks();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });

    // Listen for realtime task movements from socket
    window.addEventListener('socket-task-moved', (e) => {
      const data = e.detail;
      if (data.project === this.activeProjectId) {
        this.fetchTasks();
      }
    });
  },

  showCreateSprintModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.background = 'rgba(0,0,0,0.6)';
    modal.style.backdropFilter = 'blur(10px)';
    modal.style.zIndex = '2000';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';

    modal.innerHTML = `
      <div class="glass-card" style="width: 450px; padding: 24px; display:flex; flex-direction:column; gap:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <h5 style="margin:0;">Create Agile Sprint</h5>
          <button class="btn-close btn-close-white" id="close-sprint-modal-btn"></button>
        </div>
        
        <form id="create-sprint-form" style="display:flex; flex-direction:column; gap:12px;">
          <div>
            <label class="form-label" style="font-size:12px;">Sprint Name</label>
            <input type="text" class="form-control bg-dark text-light border-secondary" id="sprint-name-input" required placeholder="Sprint 1">
          </div>
          <div>
            <label class="form-label" style="font-size:12px;">Sprint Goal</label>
            <textarea class="form-control bg-dark text-light border-secondary" id="sprint-goal-input" rows="2" placeholder="Complete authentication workflow."></textarea>
          </div>
          <div class="row g-2">
            <div class="col-6">
              <label class="form-label" style="font-size:12px;">Duration (Days)</label>
              <input type="number" class="form-control bg-dark text-light border-secondary" id="sprint-duration-input" value="14" required>
            </div>
            <div class="col-6">
              <label class="form-label" style="font-size:12px;">Capacity (Points)</label>
              <input type="number" class="form-control bg-dark text-light border-secondary" id="sprint-capacity-input" value="30" required>
            </div>
          </div>

          <div style="display:flex; gap:12px; justify-content:flex-end; margin-top:8px;">
            <button type="button" class="btn btn-secondary" id="cancel-sprint-btn">Cancel</button>
            <button type="submit" class="btn btn-indigo" style="background:var(--accent-gradient); border:none; color:white;">Create</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => modal.remove();
    document.getElementById('close-sprint-modal-btn').addEventListener('click', closeModal);
    document.getElementById('cancel-sprint-btn').addEventListener('click', closeModal);

    document.getElementById('create-sprint-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('sprint-name-input').value;
      const goal = document.getElementById('sprint-goal-input').value;
      const duration = document.getElementById('sprint-duration-input').value;
      const capacity = document.getElementById('sprint-capacity-input').value;

      try {
        await api.post(`/sprints/project/${this.activeProjectId}`, {
          name,
          goal,
          duration,
          capacity
        });

        showToast('Sprint created!');
        closeModal();
        await this.fetchSprints();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }
};
