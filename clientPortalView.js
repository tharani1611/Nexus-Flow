import { state } from '../state.js';
import { api } from '../api.js';
import { showToast } from '../app.js';

export const clientPortalView = {
  async render(container) {
    if (!state.currentWorkspace) {
      container.innerHTML = `
        <div class="glass-card p-5 text-center my-auto">
          <i class="bi bi-person-workspace" style="font-size: 40px; color: var(--text-secondary);"></i>
          <h5 class="mt-3">No Workspace Selected</h5>
          <p style="color:var(--text-secondary);">Select a workspace to access the client portal.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 style="font-weight:700; margin:0;">Client Portal</h4>
          <p style="color:var(--text-secondary); font-size:13px; margin-top:4px;">Read-only view shared with external clients to track project delivery progress</p>
        </div>
        <span class="badge py-2 px-3" style="background:rgba(99,102,241,0.15); border:1px solid var(--accent-color); color:var(--accent-color); font-size:12px;">
          <i class="bi bi-eye-fill"></i> Client View Mode
        </span>
      </div>

      <div class="row g-4" id="portal-projects-grid">
        <div class="col-12 text-center p-5">
          <div class="spinner-border text-primary" role="status"></div>
        </div>
      </div>
    `;

    await this.fetchPortalData();
  },

  async fetchPortalData() {
    const workspaceId = state.currentWorkspace._id;
    const grid = document.getElementById('portal-projects-grid');

    try {
      const projects = await api.get(`/projects/workspace/${workspaceId}`);
      const clientProjects = projects.filter(p => p.type === 'Client' || p.type === 'Team');

      if (clientProjects.length === 0) {
        grid.innerHTML = `
          <div class="col-12 text-center p-5">
            <i class="bi bi-building" style="font-size:40px; color:var(--text-secondary);"></i>
            <h6 class="mt-3" style="color:var(--text-secondary);">No client or team projects available in this workspace.</h6>
          </div>
        `;
        return;
      }

      grid.innerHTML = '';

      for (const proj of clientProjects) {
        // Fetch project tasks for progress
        let tasks = [];
        let completedTasks = 0;
        let totalTasks = 0;

        try {
          tasks = await api.get(`/tasks/project/${proj._id}`);
          totalTasks = tasks.length;
          completedTasks = tasks.filter(t => t.status === 'Done').length;
        } catch (e) {}

        const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        const isOnTrack = proj.deadline ? new Date(proj.deadline) > new Date() : true;

        const col = document.createElement('div');
        col.className = 'col-md-6';
        col.innerHTML = `
          <div class="glass-card p-4 d-flex flex-column gap-3" style="border-top: 4px solid ${this.getStatusColor(proj.status)};">
            <!-- Project Header -->
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <h5 style="font-weight:700; margin:0;">${proj.name}</h5>
                <span class="badge mt-1" style="background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:var(--text-secondary); font-size:10px;">${proj.type}</span>
              </div>
              <span class="badge" style="background:${this.getStatusBg(proj.status)}; font-size:11px;">${proj.status}</span>
            </div>

            <!-- Description -->
            <p style="font-size:13px; color:var(--text-secondary); line-height:1.5; margin:0;">${proj.description || 'No project description provided.'}</p>

            <!-- Progress Bar -->
            <div>
              <div class="d-flex justify-content-between mb-1">
                <span style="font-size:11px; color:var(--text-secondary);">Delivery Progress</span>
                <span style="font-size:11px; font-weight:700; color:${progressPct >= 80 ? 'var(--success-color)' : progressPct >= 40 ? 'var(--warning-color)' : 'var(--danger-color)'};">${progressPct}%</span>
              </div>
              <div class="progress bg-dark" style="height:8px; border-radius:4px;">
                <div class="progress-bar" style="width:${progressPct}%; background:${progressPct >= 80 ? 'var(--success-color)' : progressPct >= 40 ? 'var(--warning-color)' : 'var(--danger-color)'}; border-radius:4px; transition:width 0.5s ease;"></div>
              </div>
            </div>

            <!-- Stats Grid -->
            <div class="row g-2">
              <div class="col-4 text-center">
                <div style="background:rgba(255,255,255,0.02); border:1px solid var(--glass-border); border-radius:8px; padding:8px;">
                  <div style="font-size:18px; font-weight:700;">${totalTasks}</div>
                  <div style="font-size:9px; color:var(--text-secondary);">Total Tasks</div>
                </div>
              </div>
              <div class="col-4 text-center">
                <div style="background:rgba(16,185,129,0.05); border:1px solid rgba(16,185,129,0.2); border-radius:8px; padding:8px;">
                  <div style="font-size:18px; font-weight:700; color:var(--success-color);">${completedTasks}</div>
                  <div style="font-size:9px; color:var(--text-secondary);">Completed</div>
                </div>
              </div>
              <div class="col-4 text-center">
                <div style="background:rgba(245,158,11,0.05); border:1px solid rgba(245,158,11,0.2); border-radius:8px; padding:8px;">
                  <div style="font-size:18px; font-weight:700; color:var(--warning-color);">${totalTasks - completedTasks}</div>
                  <div style="font-size:9px; color:var(--text-secondary);">Remaining</div>
                </div>
              </div>
            </div>

            <!-- Deadline & Budget Info -->
            <div class="d-flex justify-content-between align-items-center pt-2 border-top" style="border-color:var(--glass-border)!important;">
              <div>
                <span style="font-size:11px; color:var(--text-secondary);">Deadline: </span>
                <span style="font-size:11px; font-weight:600; color:${isOnTrack ? 'var(--success-color)' : 'var(--danger-color)'};">
                  ${proj.deadline ? new Date(proj.deadline).toLocaleDateString() : 'Not Set'}
                  ${!isOnTrack ? ' (Overdue)' : ''}
                </span>
              </div>
              ${proj.budget > 0 ? `<div><span style="font-size:11px; color:var(--text-secondary);">Budget: </span><span style="font-size:11px; font-weight:600;">$${proj.budget.toLocaleString()}</span></div>` : ''}
            </div>
          </div>
        `;
        grid.appendChild(col);
      }

    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  getStatusColor(status) {
    switch (status) {
      case 'Active': return 'var(--success-color)';
      case 'Completed': return 'var(--accent-color)';
      case 'Archived': return 'var(--text-secondary)';
      default: return 'var(--accent-color)';
    }
  },

  getStatusBg(status) {
    switch (status) {
      case 'Active': return 'rgba(16,185,129,0.2)';
      case 'Completed': return 'rgba(99,102,241,0.2)';
      case 'Archived': return 'rgba(156,163,175,0.2)';
      default: return 'rgba(99,102,241,0.2)';
    }
  }
};
