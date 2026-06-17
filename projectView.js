import { state } from '../state.js';
import { api } from '../api.js';
import { showToast, navigateTo } from '../app.js';

export const projectView = {
  async render(container) {
    if (!state.currentWorkspace) {
      container.innerHTML = `
        <div class="glass-card p-5 text-center my-auto">
          <i class="bi bi-briefcase-fill" style="font-size: 40px; color: var(--text-secondary);"></i>
          <h5 class="mt-3">No Workspace Selected</h5>
          <p style="color:var(--text-secondary);">Please choose a workspace to manage its projects.</p>
        </div>
      `;
      return;
    }

    const workspaceId = state.currentWorkspace._id;

    container.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h4 style="font-weight:700; margin:0;">Projects Dashboard</h4>
        <button class="btn btn-indigo" id="create-project-btn" style="background:var(--accent-gradient); border:none; color:white; font-weight:600; padding:10px 20px;">+ Create Project</button>
      </div>

      <!-- Projects Grid -->
      <div class="row g-4" id="projects-grid-container">
        <div class="col-12 text-center p-5">
          <div class="spinner-border text-primary" role="status"></div>
        </div>
      </div>
    `;

    this.bindEvents(workspaceId);
    await this.fetchProjects(workspaceId);
  },

  async fetchProjects(workspaceId) {
    try {
      const list = await api.get(`/projects/workspace/${workspaceId}`);
      state.projects = list;

      const grid = document.getElementById('projects-grid-container');
      if (list.length === 0) {
        grid.innerHTML = `
          <div class="col-12 text-center p-5">
            <h6 style="color:var(--text-secondary);">No projects found in this workspace. Click "Create Project" to get started.</h6>
          </div>
        `;
        return;
      }

      grid.innerHTML = '';
      list.forEach(proj => {
        const isArchived = proj.status === 'Archived';
        const col = document.createElement('div');
        col.className = 'col-md-4';
        col.innerHTML = `
          <div class="glass-card p-4 h-100 d-flex flex-column justify-content-between" style="border-top: 4px solid ${this.getPriorityColor(proj.priority)}; opacity: ${isArchived ? '0.6' : '1'};">
            <div>
              <div class="d-flex justify-content-between align-items-start mb-2">
                <span class="badge" style="font-size:10px; background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:var(--text-primary);">${proj.type}</span>
                <span class="badge bg-${proj.status === 'Active' ? 'success' : (isArchived ? 'secondary' : 'info')}" style="font-size:10px;">${proj.status}</span>
              </div>
              <h5 style="font-weight:600; margin-bottom:8px; cursor:pointer;" class="project-title-link">${proj.name}</h5>
              <p style="color:var(--text-secondary); font-size:13px; line-height:1.4; margin-bottom:16px;">${proj.description || 'No description provided.'}</p>
            </div>

            <div>
              <div style="font-size:11px; color:var(--text-secondary); margin-bottom:8px;">
                Deadline: ${proj.deadline ? new Date(proj.deadline).toLocaleDateString() : 'None'}
              </div>
              <div class="d-flex align-items-center justify-content-between mt-3 pt-3 border-top border-secondary">
                <button class="btn btn-sm btn-indigo view-board-btn" style="background:var(--accent-gradient); border:none; color:white; font-weight:600;">Kanban Board</button>
                <div class="dropdown">
                  <button class="btn btn-sm btn-outline-light dropdown-toggle" type="button" data-bs-toggle="dropdown"><i class="bi bi-three-dots"></i></button>
                  <ul class="dropdown-menu dropdown-menu-dark">
                    <li><a class="dropdown-item duplicate-proj-btn" style="cursor:pointer;">Duplicate</a></li>
                    <li><a class="dropdown-item clone-proj-btn" style="cursor:pointer;">Clone Details</a></li>
                    <li><a class="dropdown-item archive-proj-btn" style="cursor:pointer;">${isArchived ? 'Unarchive' : 'Archive'}</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item text-danger delete-proj-btn" style="cursor:pointer;">Delete</a></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        `;

        // Bind title link and board button
        const openBoard = () => navigateTo('kanban', { projectId: proj._id });
        col.querySelector('.project-title-link').addEventListener('click', openBoard);
        col.querySelector('.view-board-btn').addEventListener('click', openBoard);

        // Bind dropdown options
        col.querySelector('.duplicate-proj-btn').addEventListener('click', () => this.duplicateProject(proj._id));
        col.querySelector('.clone-proj-btn').addEventListener('click', () => this.cloneProject(proj._id));
        col.querySelector('.archive-proj-btn').addEventListener('click', () => this.archiveProject(proj._id));
        col.querySelector('.delete-proj-btn').addEventListener('click', () => this.deleteProject(proj._id));

        grid.appendChild(col);
      });

    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  getPriorityColor(p) {
    switch (p) {
      case 'Urgent': return 'var(--danger-color)';
      case 'High': return 'var(--warning-color)';
      case 'Medium': return 'var(--accent-color)';
      case 'Low': return 'var(--success-color)';
      default: return 'var(--text-secondary)';
    }
  },

  async duplicateProject(projectId) {
    try {
      await api.post(`/projects/${projectId}/duplicate`);
      showToast('Project duplicated successfully (tasks copied)');
      this.fetchProjects(state.currentWorkspace._id);
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async cloneProject(projectId) {
    try {
      await api.post(`/projects/${projectId}/clone`);
      showToast('Project details cloned successfully');
      this.fetchProjects(state.currentWorkspace._id);
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async archiveProject(projectId) {
    try {
      await api.post(`/projects/${projectId}/archive`);
      showToast('Project archive status toggled');
      this.fetchProjects(state.currentWorkspace._id);
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async deleteProject(projectId) {
    if (confirm('CAUTION: Are you sure you want to delete this project and all its tasks? This action is permanent.')) {
      try {
        await api.delete(`/projects/${projectId}`);
        showToast('Project deleted successfully');
        this.fetchProjects(state.currentWorkspace._id);
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  },

  bindEvents(workspaceId) {
    // Create Project trigger
    document.getElementById('create-project-btn').addEventListener('click', () => {
      this.showCreateProjectModal(workspaceId);
    });
  },

  showCreateProjectModal(workspaceId) {
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
      <div class="glass-card" style="width: 500px; padding: 24px; display:flex; flex-direction:column; gap:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <h5 style="margin:0;">Create New Project</h5>
          <button class="btn-close btn-close-white" id="close-proj-modal-btn"></button>
        </div>
        
        <form id="create-project-form" style="display:flex; flex-direction:column; gap:12px;">
          <div>
            <label class="form-label" style="font-size:12px;">Project Name</label>
            <input type="text" class="form-control bg-dark text-light border-secondary" id="proj-name-input" required>
          </div>
          <div>
            <label class="form-label" style="font-size:12px;">Description</label>
            <textarea class="form-control bg-dark text-light border-secondary" id="proj-desc-input" rows="3"></textarea>
          </div>
          <div class="row g-2">
            <div class="col-6">
              <label class="form-label" style="font-size:12px;">Priority</label>
              <select class="form-select bg-dark text-light border-secondary" id="proj-priority-input">
                <option value="Low">Low</option>
                <option value="Medium" selected>Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
            <div class="col-6">
              <label class="form-label" style="font-size:12px;">Type</label>
              <select class="form-select bg-dark text-light border-secondary" id="proj-type-input">
                <option value="Personal">Personal</option>
                <option value="Team" selected>Team</option>
                <option value="Client">Client</option>
              </select>
            </div>
          </div>
          <div class="row g-2">
            <div class="col-6">
              <label class="form-label" style="font-size:12px;">Budget ($)</label>
              <input type="number" class="form-control bg-dark text-light border-secondary" id="proj-budget-input" value="0">
            </div>
            <div class="col-6">
              <label class="form-label" style="font-size:12px;">Deadline</label>
              <input type="date" class="form-control bg-dark text-light border-secondary" id="proj-deadline-input">
            </div>
          </div>

          <div style="display:flex; gap:12px; justify-content:flex-end; margin-top:8px;">
            <button type="button" class="btn btn-secondary" id="cancel-proj-btn">Cancel</button>
            <button type="submit" class="btn btn-indigo" style="background:var(--accent-gradient); border:none; color:white;">Create Project</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => modal.remove();
    document.getElementById('close-proj-modal-btn').addEventListener('click', closeModal);
    document.getElementById('cancel-proj-btn').addEventListener('click', closeModal);

    document.getElementById('create-project-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('proj-name-input').value;
      const description = document.getElementById('proj-desc-input').value;
      const priority = document.getElementById('proj-priority-input').value;
      const type = document.getElementById('proj-type-input').value;
      const budget = document.getElementById('proj-budget-input').value;
      const deadline = document.getElementById('proj-deadline-input').value;

      try {
        await api.post(`/projects/workspace/${workspaceId}`, {
          name,
          description,
          priority,
          type,
          budget,
          deadline: deadline || null
        });

        showToast('Project created successfully!');
        closeModal();
        this.fetchProjects(workspaceId);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }
};
