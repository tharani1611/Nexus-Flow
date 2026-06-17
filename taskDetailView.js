import { state } from '../state.js';
import { api } from '../api.js';
import { showToast } from '../app.js';

export const taskDetailView = {
  activeTaskId: null,
  timerInterval: null,

  init() {
    window.addEventListener('open-task-detail', (e) => {
      this.showTaskModal(e.detail.taskId);
    });
  },

  async showTaskModal(taskId) {
    this.activeTaskId = taskId;
    
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.id = 'task-detail-modal';
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
      <div class="glass-card" style="width: 850px; max-height: 90vh; padding: 28px; display:flex; flex-direction:column; gap:20px; overflow-y:auto;">
        <!-- Header -->
        <div class="d-flex justify-content-between align-items-start border-bottom pb-2">
          <div>
            <h4 style="font-weight:700; margin:0;" id="modal-task-title">Loading...</h4>
            <span style="font-size:11px; color:var(--text-secondary);" id="modal-task-breadcrumb"></span>
          </div>
          <div class="d-flex align-items-center gap-2">
            <button class="btn btn-sm btn-outline-light" id="modal-duplicate-btn"><i class="bi bi-files"></i> Duplicate</button>
            <button class="btn btn-sm btn-outline-light" id="modal-archive-btn"><i class="bi bi-archive"></i> Archive</button>
            <button class="btn btn-sm btn-outline-danger" id="modal-delete-btn"><i class="bi bi-trash"></i> Delete</button>
            <button class="btn-close btn-close-white ms-2" id="close-task-modal-btn"></button>
          </div>
        </div>

        <div class="row g-4">
          <!-- Left Column (Core description, subtasks, checklists, comments, files) -->
          <div class="col-md-7 d-flex flex-column gap-3" style="max-height: 65vh; overflow-y:auto; padding-right:10px;">
            <!-- Description -->
            <div>
              <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 style="font-weight:600; margin:0;">Description</h6>
                <button class="btn btn-sm btn-outline-light" id="ai-generate-desc-btn" style="font-size:10px;"><i class="bi bi-cpu"></i> Generate with AI</button>
              </div>
              <textarea class="form-control bg-dark text-light border-secondary" id="modal-desc-input" rows="3" placeholder="Describe this task..."></textarea>
            </div>

            <!-- Subtasks -->
            <div>
              <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 style="font-weight:600; margin:0;">Subtasks</h6>
                <button class="btn btn-sm btn-outline-light" id="add-subtask-btn" style="font-size:10px;">+ Add Subtask</button>
              </div>
              <div style="display:flex; flex-direction:column; gap:6px;" id="modal-subtasks-list"></div>
            </div>

            <!-- Checklists -->
            <div>
              <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 style="font-weight:600; margin:0;">Checklists</h6>
                <button class="btn btn-sm btn-outline-light" id="add-checklist-btn" style="font-size:10px;">+ Add Checklist</button>
              </div>
              <div style="display:flex; flex-direction:column; gap:12px;" id="modal-checklists-list"></div>
            </div>

            <!-- File Upload / Attachments -->
            <div>
              <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 style="font-weight:600; margin:0;">Attachments</h6>
                <label class="btn btn-sm btn-outline-light" style="font-size:10px; cursor:pointer; margin:0;">
                  + Upload File
                  <input type="file" id="modal-file-upload-input" style="display:none;">
                </label>
              </div>
              <div style="display:flex; flex-direction:column; gap:6px;" id="modal-files-list"></div>
            </div>

            <!-- Comments -->
            <div>
              <h6 style="font-weight:600; margin-bottom:12px;">Comments System</h6>
              <div style="display:flex; flex-direction:column; gap:10px; max-height:220px; overflow-y:auto; margin-bottom:12px;" id="modal-comments-list"></div>
              <div class="d-flex gap-2">
                <input type="text" class="form-control bg-dark text-light border-secondary form-control-sm" id="modal-comment-input" placeholder="Write a comment...">
                <button class="btn btn-sm btn-indigo" id="modal-comment-submit-btn" style="background:var(--accent-gradient); border:none; color:white;">Send</button>
              </div>
            </div>
          </div>

          <!-- Right Column (Meta status, priority, assignments, timer) -->
          <div class="col-md-5 d-flex flex-column gap-3">
            <!-- Progress Tracker -->
            <div class="glass-card p-3">
              <h6 style="font-weight:600; margin-bottom:8px;">Task Progress</h6>
              <div class="progress bg-dark" style="height: 10px; border-radius:5px;">
                <div class="progress-bar progress-bar-striped progress-bar-animated" id="modal-progress-bar" role="progressbar" style="width: 0%; background: var(--accent-gradient);"></div>
              </div>
              <span id="modal-progress-text" style="font-size:11px; color:var(--text-secondary); margin-top:4px; display:inline-block;">0% complete</span>
            </div>

            <!-- Time Tracker Widget -->
            <div class="glass-card p-3">
              <h6 style="font-weight:600; margin-bottom:8px;">Work Time Tracking</h6>
              <div class="d-flex justify-content-between align-items-center">
                <span style="font-size:24px; font-weight:700; font-family:monospace;" id="modal-timer-clock">00:00:00</span>
                <div class="d-flex gap-2">
                  <button class="btn btn-sm btn-success" id="timer-start-btn"><i class="bi bi-play-fill"></i></button>
                  <button class="btn btn-sm btn-warning" id="timer-pause-btn" style="display:none;"><i class="bi bi-pause-fill"></i></button>
                  <button class="btn btn-sm btn-danger" id="timer-stop-btn" style="display:none;"><i class="bi bi-stop-fill"></i></button>
                </div>
              </div>
            </div>

            <!-- Settings fields -->
            <div class="glass-card p-3 d-flex flex-column gap-3">
              <!-- Status -->
              <div>
                <label class="form-label" style="font-size:11px; color:var(--text-secondary);">Status</label>
                <select class="form-select bg-dark text-light border-secondary form-select-sm" id="modal-status-select">
                  <option value="Backlog">Backlog</option>
                  <option value="Todo">Todo</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Review">Review</option>
                  <option value="Testing">Testing</option>
                  <option value="Done">Done</option>
                </select>
              </div>

              <!-- Priority -->
              <div>
                <div class="d-flex justify-content-between align-items-center">
                  <label class="form-label" style="font-size:11px; color:var(--text-secondary); margin:0;">Priority</label>
                  <button class="btn btn-sm btn-link text-indigo p-0" id="ai-suggest-priority-btn" style="font-size:10px; text-decoration:none;"><i class="bi bi-cpu"></i> Suggest</button>
                </div>
                <select class="form-select bg-dark text-light border-secondary form-select-sm" id="modal-priority-select">
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <!-- Assignee -->
              <div>
                <label class="form-label" style="font-size:11px; color:var(--text-secondary);">Assignee</label>
                <select class="form-select bg-dark text-light border-secondary form-select-sm" id="modal-assignee-select">
                  <option value="">Unassigned</option>
                </select>
              </div>

              <!-- Points & Dates -->
              <div class="row g-2">
                <div class="col-6">
                  <label class="form-label" style="font-size:11px; color:var(--text-secondary);">Story Points</label>
                  <input type="number" class="form-control bg-dark text-light border-secondary form-control-sm" id="modal-points-input" value="0">
                </div>
                <div class="col-6">
                  <label class="form-label" style="font-size:11px; color:var(--text-secondary);">Due Date</label>
                  <input type="date" class="form-control bg-dark text-light border-secondary form-control-sm" id="modal-date-input">
                </div>
              </div>

              <!-- AI Estimation -->
              <button class="btn btn-sm btn-outline-light w-100" id="ai-estimate-time-btn"><i class="bi bi-cpu"></i> Estimate Work Hours with AI</button>
              <div style="font-size:11px; color:var(--text-secondary); text-align:center;" id="ai-estimate-result"></div>
            </div>

            <!-- Save settings -->
            <button class="btn btn-indigo w-100 p-2" id="modal-save-changes-btn" style="background:var(--accent-gradient); border:none; color:white; font-weight:600;">Save Changes</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    await this.fetchTaskDetails();

    // Bind Close events
    const closeModal = () => {
      clearInterval(this.timerInterval);
      modal.remove();
      // Refresh kanban tasks
      const activeBoard = document.querySelector('.task-list-cards');
      if (activeBoard) {
        // Trigger Kanban reload
        window.dispatchEvent(new CustomEvent('kanban-reload'));
      }
    };

    document.getElementById('close-task-modal-btn').addEventListener('click', closeModal);
    document.getElementById('modal-save-changes-btn').addEventListener('click', async () => {
      await this.saveChanges();
      closeModal();
    });
  },

  async fetchTaskDetails() {
    try {
      const data = await api.get(`/tasks/${this.activeTaskId}`);
      const { task, subtasks, checklists, comments } = data;

      document.getElementById('modal-task-title').textContent = task.title;
      document.getElementById('modal-task-breadcrumb').textContent = `Workspace: ${state.currentWorkspace.name} / Project: ${task.project ? task.project.name : 'N/A'}`;
      document.getElementById('modal-desc-input').value = task.description || '';
      document.getElementById('modal-status-select').value = task.status;
      document.getElementById('modal-priority-select').value = task.priority;
      document.getElementById('modal-points-input').value = task.storyPoints || 0;
      document.getElementById('modal-date-input').value = task.dueDate ? task.dueDate.split('T')[0] : '';

      // Populate Assignee Select
      const assSelect = document.getElementById('modal-assignee-select');
      assSelect.innerHTML = `<option value="">Unassigned</option>`;
      state.currentWorkspace.members.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.user._id;
        opt.textContent = `${m.user.name} (${m.role})`;
        assSelect.appendChild(opt);
      });
      assSelect.value = task.assignee ? (task.assignee._id || task.assignee) : '';

      // Set Progress
      this.renderProgress(subtasks, checklists, task.status);

      // Render Subtasks
      this.renderSubtasks(subtasks);

      // Render Checklists
      this.renderChecklists(checklists);

      // Render Files
      this.renderFiles();

      // Render Comments
      this.renderComments(comments);

      // Render Timer Widget
      this.renderTimer(task);

      // Bind dynamic actions
      this.bindModalActions(task);

    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  renderProgress(subtasks, checklists, status) {
    const totalSub = subtasks.length;
    const compSub = subtasks.filter(s => s.status === 'Completed').length;

    let totalCheck = 0;
    let compCheck = 0;
    checklists.forEach(c => {
      totalCheck += c.items.length;
      compCheck += c.items.filter(i => i.isCompleted).length;
    });

    const total = totalSub + totalCheck;
    const completed = compSub + compCheck;

    let progress = 0;
    if (total > 0) {
      progress = Math.round((completed / total) * 100);
    } else {
      progress = status === 'Done' ? 100 : 0;
    }

    document.getElementById('modal-progress-bar').style.width = `${progress}%`;
    document.getElementById('modal-progress-text').textContent = `${progress}% complete`;
  },

  renderSubtasks(subtasks) {
    const list = document.getElementById('modal-subtasks-list');
    list.innerHTML = '';
    
    if (subtasks.length === 0) {
      list.innerHTML = `<span style="font-size:12px; color:var(--text-secondary);">No subtasks added yet</span>`;
      return;
    }

    subtasks.forEach(s => {
      const isComp = s.status === 'Completed';
      const div = document.createElement('div');
      div.className = 'd-flex align-items-center justify-content-between p-2 rounded-3';
      div.style.background = 'rgba(255,255,255,0.01)';
      div.style.border = '1px solid rgba(255,255,255,0.05)';
      div.innerHTML = `
        <div class="d-flex align-items-center gap-2">
          <input type="checkbox" class="form-check-input" ${isComp ? 'checked' : ''} id="sub-${s._id}">
          <span style="font-size:13px; text-decoration: ${isComp ? 'line-through' : 'none'}; opacity: ${isComp ? '0.6' : '1'};">${s.title}</span>
        </div>
        <button class="btn btn-sm text-danger delete-sub-btn" data-id="${s._id}"><i class="bi bi-trash"></i></button>
      `;

      div.querySelector('input[type="checkbox"]').addEventListener('change', async (e) => {
        const newStatus = e.target.checked ? 'Completed' : 'Pending';
        try {
          await api.put(`/tasks/subtasks/${s._id}`, { status: newStatus });
          this.fetchTaskDetails();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });

      div.querySelector('.delete-sub-btn').addEventListener('click', async () => {
        try {
          await api.delete(`/tasks/subtasks/${s._id}`);
          this.fetchTaskDetails();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });

      list.appendChild(div);
    });
  },

  renderChecklists(checklists) {
    const list = document.getElementById('modal-checklists-list');
    list.innerHTML = '';

    if (checklists.length === 0) {
      list.innerHTML = `<span style="font-size:12px; color:var(--text-secondary);">No checklists added yet</span>`;
      return;
    }

    checklists.forEach(c => {
      const card = document.createElement('div');
      card.className = 'p-3 rounded-3';
      card.style.background = 'rgba(255,255,255,0.02)';
      card.style.border = '1px solid rgba(255,255,255,0.06)';
      card.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-secondary">
          <span style="font-weight:600; font-size:13px;">${c.title}</span>
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-link text-light p-0 add-item-btn" style="text-decoration:none; font-size:11px;">+ Item</button>
            <button class="btn btn-sm text-danger p-0 delete-check-btn"><i class="bi bi-trash" style="font-size:12px;"></i></button>
          </div>
        </div>
        <div style="display:flex; flex-direction:column; gap:6px;" class="checklist-items-container"></div>
      `;

      const itemsDiv = card.querySelector('.checklist-items-container');
      c.items.forEach(item => {
        const itemRow = document.createElement('div');
        itemRow.className = 'd-flex align-items-center gap-2';
        itemRow.innerHTML = `
          <input type="checkbox" class="form-check-input" ${item.isCompleted ? 'checked' : ''}>
          <span style="font-size:12px; text-decoration: ${item.isCompleted ? 'line-through' : 'none'}; opacity: ${item.isCompleted ? '0.6' : '1'};">${item.title}</span>
        `;

        itemRow.querySelector('input').addEventListener('change', async () => {
          try {
            await api.put(`/tasks/checklists/${c._id}/items/${item._id}/toggle`);
            this.fetchTaskDetails();
          } catch (err) {
            showToast(err.message, 'error');
          }
        });

        itemsDiv.appendChild(itemRow);
      });

      // Bind add item
      card.querySelector('.add-item-btn').addEventListener('click', async () => {
        const title = prompt('Enter checklist item title:');
        if (title && title.trim()) {
          try {
            await api.post(`/tasks/checklists/${c._id}/items`, { title });
            this.fetchTaskDetails();
          } catch (err) {
            showToast(err.message, 'error');
          }
        }
      });

      // Bind delete checklist
      card.querySelector('.delete-check-btn').addEventListener('click', async () => {
        try {
          await api.delete(`/tasks/checklists/${c._id}`);
          this.fetchTaskDetails();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });

      list.appendChild(card);
    });
  },

  async renderFiles() {
    const list = document.getElementById('modal-files-list');
    list.innerHTML = '';
    try {
      const files = await api.get(`/files/task/${this.activeTaskId}`);
      if (files.length === 0) {
        list.innerHTML = `<span style="font-size:12px; color:var(--text-secondary);">No attachments uploaded</span>`;
        return;
      }

      files.forEach(f => {
        const div = document.createElement('div');
        div.className = 'd-flex align-items-center justify-content-between p-2 rounded-3';
        div.style.background = 'rgba(255,255,255,0.01)';
        div.style.border = '1px solid rgba(255,255,255,0.05)';
        div.innerHTML = `
          <div class="d-flex align-items-center gap-2">
            <i class="bi bi-file-earmark-arrow-down" style="font-size:16px;"></i>
            <a href="${f.path}" target="_blank" style="font-size:12px; color:var(--text-primary); text-decoration:none;">${f.name}</a>
            <span style="font-size:9px; color:var(--text-secondary);">(${(f.size/1024/1024).toFixed(2)} MB)</span>
          </div>
          <button class="btn btn-sm text-danger delete-file-btn" data-id="${f._id}"><i class="bi bi-trash"></i></button>
        `;

        div.querySelector('.delete-file-btn').addEventListener('click', async () => {
          try {
            await api.delete(`/files/${f._id}`);
            showToast('Attachment deleted');
            this.renderFiles();
          } catch (err) {
            showToast(err.message, 'error');
          }
        });

        list.appendChild(div);
      });
    } catch (err) {
      console.error(err);
    }
  },

  renderComments(comments) {
    const list = document.getElementById('modal-comments-list');
    list.innerHTML = '';

    if (comments.length === 0) {
      list.innerHTML = `<span style="font-size:12px; color:var(--text-secondary); text-align:center;">No comments yet</span>`;
      return;
    }

    comments.forEach(c => {
      const div = document.createElement('div');
      div.style.display = 'flex';
      div.style.gap = '10px';
      div.style.padding = '8px';
      div.style.borderRadius = '8px';
      div.style.background = 'rgba(255,255,255,0.02)';
      div.style.border = '1px solid rgba(255,255,255,0.05)';
      div.innerHTML = `
        <img src="${c.author ? (c.author.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=50&q=80') : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=50&q=80'}" style="width:28px; height:28px; border-radius:50%; object-fit:cover; margin-top:2px;">
        <div style="flex-grow:1;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:12px; font-weight:600;">${c.author ? c.author.name : 'Unknown'}</span>
            <span style="font-size:9px; color:var(--text-secondary);">${new Date(c.createdAt).toLocaleString()}</span>
          </div>
          <div style="font-size:12px; color:var(--text-primary); margin-top:4px; line-height:1.4;">${c.text}</div>
        </div>
      `;
      list.appendChild(div);
    });
  },

  renderTimer(task) {
    let currentSeconds = task.timeSpent || 0;
    const clock = document.getElementById('modal-timer-clock');
    
    const formatTime = (totalSecs) => {
      const hrs = Math.floor(totalSecs / 3600);
      const mins = Math.floor((totalSecs % 3600) / 60);
      const secs = totalSecs % 60;
      return [
        hrs.toString().padStart(2, '0'),
        mins.toString().padStart(2, '0'),
        secs.toString().padStart(2, '0')
      ].join(':');
    };

    clock.textContent = formatTime(currentSeconds);

    const startBtn = document.getElementById('timer-start-btn');
    const pauseBtn = document.getElementById('timer-pause-btn');
    const stopBtn = document.getElementById('timer-stop-btn');

    if (task.timerActive) {
      startBtn.style.display = 'none';
      pauseBtn.style.display = 'inline-block';
      stopBtn.style.display = 'inline-block';

      // Increment clock live
      const startedAt = new Date(task.timerStartedAt);
      const elapsedOnStart = Math.round((new Date() - startedAt) / 1000);
      currentSeconds += elapsedOnStart;

      this.timerInterval = setInterval(() => {
        currentSeconds++;
        clock.textContent = formatTime(currentSeconds);
      }, 1000);
    } else {
      startBtn.style.display = 'inline-block';
      pauseBtn.style.display = 'none';
      stopBtn.style.display = 'none';
    }

    const triggerTimer = async (action) => {
      try {
        const res = await api.post(`/tasks/${this.activeTaskId}/timer`, { action });
        clearInterval(this.timerInterval);
        this.fetchTaskDetails();
        showToast(`Timer ${action}ed`);
      } catch (err) {
        showToast(err.message, 'error');
      }
    };

    startBtn.onclick = () => triggerTimer('start');
    pauseBtn.onclick = () => triggerTimer('pause');
    stopBtn.onclick = () => triggerTimer('stop');
  },

  bindModalActions(task) {
    // Add Subtask
    document.getElementById('add-subtask-btn').onclick = async () => {
      const title = prompt('Enter subtask title:');
      if (title && title.trim()) {
        try {
          await api.post(`/tasks/${task._id}/subtasks`, { title });
          this.fetchTaskDetails();
        } catch (err) {
          showToast(err.message, 'error');
        }
      }
    };

    // Add Checklist
    document.getElementById('add-checklist-btn').onclick = async () => {
      const title = prompt('Enter checklist title:');
      if (title && title.trim()) {
        try {
          await api.post(`/tasks/${task._id}/checklists`, { title });
          this.fetchTaskDetails();
        } catch (err) {
          showToast(err.message, 'error');
        }
      }
    };

    // File upload change
    document.getElementById('modal-file-upload-input').onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const fd = new FormData();
      fd.append('file', file);
      fd.append('taskId', this.activeTaskId);
      fd.append('projectId', task.project ? (task.project._id || task.project) : '');

      try {
        await api.post('/files/upload', fd);
        showToast('File uploaded successfully!');
        this.renderFiles();
      } catch (err) {
        showToast(err.message, 'error');
      }
    };

    // Comment submission
    document.getElementById('modal-comment-submit-btn').onclick = async () => {
      const input = document.getElementById('modal-comment-input');
      const text = input.value;
      if (!text || !text.trim()) return;

      try {
        await api.post(`/tasks/${task._id}/comments`, { text });
        input.value = '';
        this.fetchTaskDetails();
      } catch (err) {
        showToast(err.message, 'error');
      }
    };

    // AI Assist: Generate description template
    document.getElementById('ai-generate-desc-btn').onclick = async () => {
      try {
        const res = await api.post('/ai/description', { title: task.title });
        document.getElementById('modal-desc-input').value = res.description;
        showToast('AI Description Template generated!');
      } catch (err) {
        showToast(err.message, 'error');
      }
    };

    // AI Assist: Suggest priority
    document.getElementById('ai-suggest-priority-btn').onclick = async () => {
      const descVal = document.getElementById('modal-desc-input').value;
      try {
        const res = await api.post('/ai/priority', { title: task.title, description: descVal });
        document.getElementById('modal-priority-select').value = res.priority;
        showToast(`AI recommends priority: ${res.priority}`);
      } catch (err) {
        showToast(err.message, 'error');
      }
    };

    // AI Assist: Estimate time duration
    document.getElementById('ai-estimate-time-btn').onclick = async () => {
      const ptsVal = document.getElementById('modal-points-input').value;
      const prioVal = document.getElementById('modal-priority-select').value;
      try {
        const res = await api.post('/ai/estimate', { title: task.title, storyPoints: ptsVal, priority: prioVal });
        document.getElementById('ai-estimate-result').innerHTML = `
          <div class="alert alert-info py-2 px-3 mt-1" style="font-size:12px; background:rgba(99,102,241,0.1); border:1px solid rgba(99,102,241,0.2); color:white;">
            AI Estimate: <strong>${res.estimate}</strong> of active focus time.
          </div>
        `;
      } catch (err) {
        showToast(err.message, 'error');
      }
    };

    // Task Actions: Duplicate
    document.getElementById('modal-duplicate-btn').onclick = async () => {
      try {
        await api.post(`/tasks/${task._id}/duplicate`);
        showToast('Task duplicated successfully!');
        document.getElementById('close-task-modal-btn').click();
      } catch (err) {
        showToast(err.message, 'error');
      }
    };

    // Task Actions: Archive
    document.getElementById('modal-archive-btn').onclick = async () => {
      try {
        await api.post(`/tasks/${task._id}/archive`);
        showToast('Task archive status toggled');
        document.getElementById('close-task-modal-btn').click();
      } catch (err) {
        showToast(err.message, 'error');
      }
    };

    // Task Actions: Delete
    document.getElementById('modal-delete-btn').onclick = async () => {
      if (confirm('CAUTION: Are you sure you want to permanently delete this task?')) {
        try {
          await api.delete(`/tasks/${task._id}`);
          showToast('Task deleted successfully');
          document.getElementById('close-task-modal-btn').click();
        } catch (err) {
          showToast(err.message, 'error');
        }
      }
    };
  },

  async saveChanges() {
    const desc = document.getElementById('modal-desc-input').value;
    const status = document.getElementById('modal-status-select').value;
    const priority = document.getElementById('modal-priority-select').value;
    const assignee = document.getElementById('modal-assignee-select').value;
    const points = document.getElementById('modal-points-input').value;
    const dueDate = document.getElementById('modal-date-input').value;

    try {
      await api.put(`/tasks/${this.activeTaskId}`, {
        description: desc,
        status,
        priority,
        assignee: assignee || null,
        storyPoints: points,
        dueDate: dueDate || null
      });
      showToast('Changes saved successfully');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
};
