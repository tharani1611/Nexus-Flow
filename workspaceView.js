import { state } from '../state.js';
import { api } from '../api.js';
import { showToast, navigateTo } from '../app.js';
import { socketService } from '../socket.js';

export const workspaceView = {
  async render(container) {
    container.innerHTML = `
      <div class="row g-4">
        <!-- Workspaces list panel -->
        <div class="col-md-6">
          <div class="glass-card p-4">
            <div class="d-flex justify-content-between align-items-center mb-4">
              <h5 style="font-weight:600; margin:0;">Organizations & Workspaces</h5>
              <button class="btn btn-sm btn-indigo" id="create-ws-btn" style="background:var(--accent-gradient); border:none; color:white; padding:6px 14px; font-weight:600;">+ Create</button>
            </div>
            
            <div id="workspaces-list-panel" style="display:flex; flex-direction:column; gap:12px;">
              <p style="color:var(--text-secondary); font-size:12px; text-align:center;">No workspaces found.</p>
            </div>
          </div>
        </div>

        <!-- Selected Workspace details & Member management -->
        <div class="col-md-6">
          <div id="workspace-details-panel">
            <div class="glass-card p-4 text-center my-auto">
              <i class="bi bi-building" style="font-size:40px; color:var(--text-secondary);"></i>
              <h6 class="mt-2" style="color:var(--text-secondary);">Select a workspace to manage membership and settings.</h6>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents(container);
    await this.fetchWorkspaces();
  },

  async fetchWorkspaces() {
    try {
      const list = await api.get('/workspaces');
      state.workspaces = list;

      const listPanel = document.getElementById('workspaces-list-panel');
      if (list.length > 0) {
        listPanel.innerHTML = '';
        list.forEach(ws => {
          const isActive = state.currentWorkspace && state.currentWorkspace._id === ws._id;
          const div = document.createElement('div');
          div.className = `p-3 rounded-3 d-flex align-items-center justify-content-between ${isActive ? 'bg-indigo text-light' : 'bg-dark border-secondary'}`;
          div.style.cursor = 'pointer';
          div.style.border = isActive ? 'none' : '1px solid var(--glass-border)';
          div.style.background = isActive ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.02)';
          div.innerHTML = `
            <div>
              <div style="font-weight:600;">${ws.name}</div>
              <div style="font-size:11px; opacity:0.8; margin-top:2px;">Members: ${ws.members.length}</div>
            </div>
            ${isActive ? '<i class="bi bi-check-circle-fill" style="font-size:20px;"></i>' : '<button class="btn btn-sm btn-outline-light ws-select-btn">Switch</button>'}
          `;
          
          if (!isActive) {
            div.querySelector('.ws-select-btn').addEventListener('click', (e) => {
              e.stopPropagation();
              this.selectWorkspace(ws);
            });
          }
          
          div.addEventListener('click', () => {
            this.renderWorkspaceDetails(ws);
          });

          listPanel.appendChild(div);
        });
      }

      // If active workspace exists, render its details on load
      if (state.currentWorkspace) {
        const fullWs = list.find(w => w._id === state.currentWorkspace._id);
        if (fullWs) {
          this.renderWorkspaceDetails(fullWs);
        }
      }

    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  selectWorkspace(workspace) {
    state.setWorkspace(workspace);
    socketService.joinWorkspace(workspace._id);
    
    // Update Layout badge
    const badge = document.getElementById('current-workspace-badge');
    if (badge) badge.textContent = `Workspace: ${workspace.name}`;

    showToast(`Switched workspace to: ${workspace.name}`);
    this.fetchWorkspaces();
  },

  renderWorkspaceDetails(ws) {
    const detailsPanel = document.getElementById('workspace-details-panel');
    const isCreator = ws.createdBy && (ws.createdBy._id === state.user.id || ws.createdBy === state.user.id);
    
    detailsPanel.innerHTML = `
      <div class="glass-card p-4 d-flex flex-direction-column gap-3" style="display:flex; flex-direction:column; gap:16px;">
        <div class="d-flex justify-content-between align-items-center border-bottom pb-2">
          <h5 style="font-weight:600; margin:0;">${ws.name} Settings</h5>
          ${isCreator ? '<button class="btn btn-sm btn-danger" id="delete-ws-btn">Delete Workspace</button>' : '<button class="btn btn-sm btn-outline-danger" id="leave-ws-btn">Leave Workspace</button>'}
        </div>

        <!-- Invite Section -->
        <div>
          <h6 style="font-weight:600; font-size:14px; margin-bottom:8px;">Invite Team Member</h6>
          <form id="invite-member-form" class="row g-2">
            <div class="col-8">
              <input type="email" class="form-control bg-dark text-light border-secondary" id="invite-email-input" required placeholder="member@company.com">
            </div>
            <div class="col-4">
              <select class="form-select bg-dark text-light border-secondary" id="invite-role-input">
                <option value="Developer">Developer</option>
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
                <option value="Team Lead">Team Lead</option>
                <option value="Tester">Tester</option>
                <option value="Viewer">Viewer</option>
              </select>
            </div>
            <div class="col-12 mt-2">
              <button type="submit" class="btn btn-indigo w-100" style="background:var(--accent-gradient); border:none; color:white;">Send Invitation</button>
            </div>
          </form>
        </div>

        <!-- Members list -->
        <div>
          <h6 style="font-weight:600; font-size:14px; margin-bottom:12px;">Workspace Members</h6>
          <div style="display:flex; flex-direction:column; gap:8px; max-height:220px; overflow-y:auto;" id="ws-members-list">
          </div>
        </div>
      </div>
    `;

    // Render Members
    const membersList = document.getElementById('ws-members-list');
    ws.members.forEach(m => {
      const memberUser = m.user;
      if (!memberUser) return;

      const isSelf = memberUser._id === state.user.id;
      const div = document.createElement('div');
      div.className = 'd-flex align-items-center justify-content-between p-2 rounded-3';
      div.style.background = 'rgba(255,255,255,0.01)';
      div.style.border = '1px solid rgba(255,255,255,0.05)';
      div.innerHTML = `
        <div class="d-flex align-items-center gap-2">
          <img src="${memberUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=50&q=80'}" style="width:32px; height:32px; border-radius:50%; object-fit:cover;">
          <div>
            <div style="font-size:13px; font-weight:600;">${memberUser.name} ${isSelf ? '(You)' : ''}</div>
            <div style="font-size:10px; color:var(--text-secondary);">${memberUser.email}</div>
          </div>
        </div>
        <div class="d-flex align-items-center gap-2">
          <span class="badge bg-secondary" style="font-size:10px;">${m.role}</span>
          ${isCreator && !isSelf ? `<button class="btn btn-sm text-danger remove-member-btn" data-userid="${memberUser._id}"><i class="bi bi-trash"></i></button>` : ''}
        </div>
      `;

      if (isCreator && !isSelf) {
        div.querySelector('.remove-member-btn').addEventListener('click', async () => {
          if (confirm(`Are you sure you want to remove ${memberUser.name} from the workspace?`)) {
            try {
              const res = await api.post(`/workspaces/${ws._id}/remove`, { userId: memberUser._id });
              showToast('Member removed');
              this.fetchWorkspaces();
            } catch (err) {
              showToast(err.message, 'error');
            }
          }
        });
      }

      membersList.appendChild(div);
    });

    // Delete workspace action
    if (isCreator) {
      document.getElementById('delete-ws-btn').addEventListener('click', async () => {
        if (confirm('CAUTION: Are you absolutely sure you want to delete this workspace? This cannot be undone.')) {
          try {
            await api.delete(`/workspaces/${ws._id}`);
            showToast('Workspace deleted successfully');
            if (state.currentWorkspace && state.currentWorkspace._id === ws._id) {
              state.setWorkspace(null);
              const badge = document.getElementById('current-workspace-badge');
              if (badge) badge.textContent = 'Workspace: Select';
            }
            navigateTo('workspaces');
          } catch (err) {
            showToast(err.message, 'error');
          }
        }
      });
    } else {
      // Leave workspace action
      document.getElementById('leave-ws-btn').addEventListener('click', async () => {
        if (confirm('Are you sure you want to leave this workspace?')) {
          try {
            await api.post(`/workspaces/${ws._id}/leave`);
            showToast('You left the workspace');
            state.setWorkspace(null);
            navigateTo('workspaces');
          } catch (err) {
            showToast(err.message, 'error');
          }
        }
      });
    }

    // Invite submit action
    document.getElementById('invite-member-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('invite-email-input').value;
      const role = document.getElementById('invite-role-input').value;

      try {
        const res = await api.post(`/workspaces/${ws._id}/invite`, { email, role });
        showToast('Member invited successfully!');
        document.getElementById('invite-email-input').value = '';
        this.fetchWorkspaces();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  },

  bindEvents(container) {
    // Create workspace modal trigger
    container.querySelector('#create-ws-btn').addEventListener('click', () => {
      const name = prompt('Enter new workspace name:');
      if (name && name.trim()) {
        api.post('/workspaces', { name }).then(ws => {
          showToast('Workspace created successfully!');
          this.selectWorkspace(ws);
        }).catch(err => {
          showToast(err.message, 'error');
        });
      }
    });
  }
};
