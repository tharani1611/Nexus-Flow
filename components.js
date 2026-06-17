import { state } from '../state.js';
import { api } from '../api.js';
import { showToast } from '../app.js';
import { navigateTo } from '../app.js';

export const components = {
  // Update Notification Badge and content
  async updateNotificationsBadge() {
    try {
      if (!state.user) return;
      const notifications = await api.get('/notifications');
      state.notifications = notifications;
      
      const unreadCount = notifications.filter(n => !n.read).length;
      const badge = document.getElementById('bell-badge-count');
      if (badge) {
        if (unreadCount > 0) {
          badge.textContent = unreadCount;
          badge.style.display = 'flex';
        } else {
          badge.style.display = 'none';
        }
      }
    } catch (err) {
      console.error(err);
    }
  },

  // Notification Bell Dropdown
  showNotificationDropdown(event) {
    const existing = document.getElementById('notification-dropdown-panel');
    if (existing) {
      existing.remove();
      return;
    }

    const panel = document.createElement('div');
    panel.id = 'notification-dropdown-panel';
    panel.className = 'glass-card';
    panel.style.position = 'absolute';
    panel.style.top = `${event.clientY + 20}px`;
    panel.style.right = '40px';
    panel.style.width = '320px';
    panel.style.maxHeight = '400px';
    panel.style.overflowY = 'auto';
    panel.style.zIndex = '1000';
    panel.style.padding = '16px';
    panel.style.display = 'flex';
    panel.style.flexDirection = 'column';
    panel.style.gap = '10px';

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.borderBottom = '1px solid var(--glass-border)';
    header.style.paddingBottom = '8px';
    header.innerHTML = `
      <h6 style="margin:0;">Notifications</h6>
      <button class="btn btn-sm btn-link text-indigo p-0" id="mark-all-read-btn" style="text-decoration:none; font-size:12px;">Mark all read</button>
    `;
    panel.appendChild(header);

    const list = document.createElement('div');
    list.style.display = 'flex';
    list.style.flexDirection = 'column';
    list.style.gap = '8px';

    if (state.notifications.length === 0) {
      list.innerHTML = `<p style="font-size:12px; color:var(--text-secondary); text-align:center; margin: 10px 0;">No notifications yet</p>`;
    } else {
      state.notifications.forEach(n => {
        const item = document.createElement('div');
        item.style.padding = '8px';
        item.style.borderRadius = '8px';
        item.style.background = n.read ? 'transparent' : 'var(--glass-hover)';
        item.style.fontSize = '12px';
        item.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
        item.style.cursor = 'pointer';
        item.innerHTML = `
          <div style="font-weight:600; color:var(--text-primary);">${n.title}</div>
          <div style="color:var(--text-secondary); margin-top:2px;">${n.message}</div>
          <div style="font-size:9px; color:var(--text-secondary); margin-top:4px;">${new Date(n.createdAt).toLocaleString()}</div>
        `;
        item.addEventListener('click', async () => {
          if (!n.read) {
            await api.put(`/notifications/${n._id}/read`);
            this.updateNotificationsBadge();
          }
          panel.remove();
          if (n.link && n.link.startsWith('#task-')) {
            const taskId = n.link.split('-')[1];
            // Open task modal
            window.dispatchEvent(new CustomEvent('open-task-detail', { detail: { taskId } }));
          }
        });
        list.appendChild(item);
      });
    }

    panel.appendChild(list);
    document.body.appendChild(panel);

    // Mark all read binding
    document.getElementById('mark-all-read-btn').addEventListener('click', async () => {
      await api.put('/notifications/read-all');
      this.updateNotificationsBadge();
      panel.remove();
    });

    // Close on click outside
    const clickOutside = (e) => {
      if (!panel.contains(e.target) && !document.getElementById('bell-dropdown-toggle').contains(e.target)) {
        panel.remove();
        document.removeEventListener('click', clickOutside);
      }
    };
    setTimeout(() => document.addEventListener('click', clickOutside), 100);
  },

  // Edit profile settings modal
  showProfileModal() {
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
          <h5 style="margin:0;">Profile Settings</h5>
          <button class="btn-close btn-close-white" id="close-profile-modal-btn"></button>
        </div>
        
        <div class="d-flex align-items-center gap-3">
          <img src="${state.user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}" id="profile-modal-avatar" style="width:70px; height:70px; border-radius:50%; object-fit:cover; border:2px solid var(--accent-color);">
          <div>
            <label class="btn btn-sm btn-outline-light" style="cursor:pointer;">
              Change Avatar
              <input type="file" id="profile-avatar-file-input" style="display:none;" accept="image/*">
            </label>
          </div>
        </div>

        <div>
          <label class="form-label" style="font-size:12px; color:var(--text-secondary);">Full Name</label>
          <input type="text" class="form-control bg-dark text-light border-secondary" id="profile-name-input" value="${state.user.name}">
        </div>

        <div>
          <label class="form-label" style="font-size:12px; color:var(--text-secondary);">Email (Read Only)</label>
          <input type="email" class="form-control bg-dark text-light border-secondary" value="${state.user.email}" readonly disabled>
        </div>

        <div style="display:flex; gap:12px; justify-content:flex-end; margin-top:8px;">
          <button class="btn btn-secondary" id="cancel-profile-btn">Cancel</button>
          <button class="btn btn-indigo" id="save-profile-btn" style="background:var(--accent-gradient); border:none; color:white;">Save Changes</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => modal.remove();
    document.getElementById('close-profile-modal-btn').addEventListener('click', closeModal);
    document.getElementById('cancel-profile-btn').addEventListener('click', closeModal);

    // Avatar upload handler
    const fileInput = document.getElementById('profile-avatar-file-input');
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('avatar', file);

      try {
        const res = await api.post('/auth/avatar', formData);
        state.user.avatar = res.avatar;
        localStorage.setItem('user', JSON.stringify(state.user));
        document.getElementById('profile-modal-avatar').src = res.avatar;
        const mainAvatar = document.getElementById('profile-btn');
        if (mainAvatar) mainAvatar.src = res.avatar;
        showToast('Avatar updated successfully');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });

    // Save profile settings handler
    document.getElementById('save-profile-btn').addEventListener('click', async () => {
      const nameVal = document.getElementById('profile-name-input').value;
      if (!nameVal.trim()) {
        showToast('Name cannot be empty', 'error');
        return;
      }

      try {
        const res = await api.put('/auth/profile', { name: nameVal });
        state.user.name = res.name;
        localStorage.setItem('user', JSON.stringify(state.user));
        showToast('Profile updated successfully');
        closeModal();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  },

  // Global search query results modal
  async showSearchModal(query) {
    if (!query || !query.trim()) return;
    
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
      <div class="glass-card" style="width: 600px; max-height: 80vh; padding: 24px; display:flex; flex-direction:column; gap:16px; overflow-y:auto;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid var(--glass-border); padding-bottom:12px;">
          <h5 style="margin:0;">Search Results for: "${query}"</h5>
          <button class="btn-close btn-close-white" id="close-search-modal-btn"></button>
        </div>
        
        <div id="search-results-list" style="display:flex; flex-direction:column; gap:12px;">
          <div class="spinner-border text-primary align-self-center" role="status"></div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    document.getElementById('close-search-modal-btn').addEventListener('click', () => modal.remove());

    const resultsList = document.getElementById('search-results-list');

    try {
      if (!state.currentWorkspace) {
        resultsList.innerHTML = `<div style="text-align:center; color:var(--text-secondary);">Please select a workspace first.</div>`;
        return;
      }

      // We will perform multi-entity search: Tasks & Wikis
      const workspaceId = state.currentWorkspace._id;
      
      // Get all projects for tasks
      const projects = await api.get(`/projects/workspace/${workspaceId}`);
      let allTasks = [];
      for (const proj of projects) {
        const tasks = await api.get(`/tasks/project/${proj._id}`);
        allTasks.push(...tasks);
      }

      // Filter tasks locally
      const filteredTasks = allTasks.filter(t => 
        t.title.toLowerCase().includes(query.toLowerCase()) || 
        t.description.toLowerCase().includes(query.toLowerCase())
      );

      // Get Wikis
      const wikis = await api.get(`/wikis/workspace/${workspaceId}`);
      const filteredWikis = wikis.filter(w => 
        w.title.toLowerCase().includes(query.toLowerCase()) || 
        w.content.toLowerCase().includes(query.toLowerCase())
      );

      resultsList.innerHTML = '';

      if (filteredTasks.length === 0 && filteredWikis.length === 0) {
        resultsList.innerHTML = `<div style="text-align:center; color:var(--text-secondary);">No results found.</div>`;
        return;
      }

      // Render Tasks
      if (filteredTasks.length > 0) {
        const taskHeading = document.createElement('h6');
        taskHeading.textContent = 'Tasks';
        taskHeading.style.color = 'var(--accent-color)';
        resultsList.appendChild(taskHeading);

        filteredTasks.forEach(t => {
          const div = document.createElement('div');
          div.style.padding = '12px';
          div.style.borderRadius = '8px';
          div.style.background = 'var(--glass-hover)';
          div.style.cursor = 'pointer';
          div.innerHTML = `
            <div style="font-weight:600; font-size:14px;">${t.title}</div>
            <div style="font-size:12px; color:var(--text-secondary); margin-top:4px;">${t.description ? t.description.substring(0, 100) : 'No description'}</div>
          `;
          div.addEventListener('click', () => {
            modal.remove();
            window.dispatchEvent(new CustomEvent('open-task-detail', { detail: { taskId: t._id } }));
          });
          resultsList.appendChild(div);
        });
      }

      // Render Wikis
      if (filteredWikis.length > 0) {
        const wikiHeading = document.createElement('h6');
        wikiHeading.textContent = 'Wiki Pages';
        wikiHeading.style.color = 'var(--success-color)';
        wikiHeading.style.marginTop = '10px';
        resultsList.appendChild(wikiHeading);

        filteredWikis.forEach(w => {
          const div = document.createElement('div');
          div.style.padding = '12px';
          div.style.borderRadius = '8px';
          div.style.background = 'var(--glass-hover)';
          div.style.cursor = 'pointer';
          div.innerHTML = `
            <div style="font-weight:600; font-size:14px;">${w.title}</div>
            <div style="font-size:12px; color:var(--text-secondary); margin-top:4px;">${w.content.substring(0, 100)}...</div>
          `;
          div.addEventListener('click', () => {
            modal.remove();
            navigateTo('wiki');
          });
          resultsList.appendChild(div);
        });
      }

    } catch (err) {
      resultsList.innerHTML = `<div style="text-align:center; color:var(--danger-color);">${err.message}</div>`;
    }
  }
};
