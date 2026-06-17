import { state } from './state.js';
import { socketService } from './socket.js';
import { api } from './api.js';

// Import views
import { authView } from './views/authView.js';
import { dashboardView } from './views/dashboardView.js';
import { workspaceView } from './views/workspaceView.js';
import { projectView } from './views/projectView.js';
import { kanbanView } from './views/kanbanView.js';
import { chatView } from './views/chatView.js';
import { meetingView } from './views/meetingView.js';
import { calendarView } from './views/calendarView.js';
import { wikiView } from './views/wikiView.js';
import { attendanceView } from './views/attendanceView.js';
import { clientPortalView } from './views/clientPortalView.js';
import { reportView } from './views/reportView.js';
import { components } from './views/components.js';

// DOM Element Selectors
const appRoot = document.getElementById('app-root');

// Global Navigators
export function navigateTo(view, params = {}) {
  state.currentView = view;
  
  if (!state.user) {
    authView.render(appRoot);
    return;
  }

  // Ensure layouts are rendered
  if (!document.querySelector('.app-container')) {
    renderAppLayout();
  }

  const contentArea = document.getElementById('main-content-area');
  if (!contentArea) return;

  // Update active class on sidebar items
  document.querySelectorAll('.menu-item').forEach(item => {
    item.classList.remove('active');
    if (item.dataset.view === view) {
      item.classList.add('active');
    }
  });

  // Display specific view
  showLoader();
  try {
    switch (view) {
      case 'dashboard':
        dashboardView.render(contentArea);
        break;
      case 'workspaces':
        workspaceView.render(contentArea);
        break;
      case 'projects':
        projectView.render(contentArea, params.projectId);
        break;
      case 'kanban':
        kanbanView.render(contentArea, params.projectId);
        break;
      case 'chat':
        chatView.render(contentArea);
        break;
      case 'meetings':
        meetingView.render(contentArea);
        break;
      case 'calendar':
        calendarView.render(contentArea);
        break;
      case 'wiki':
        wikiView.render(contentArea);
        break;
      case 'attendance':
        attendanceView.render(contentArea);
        break;
      case 'portal':
        clientPortalView.render(contentArea);
        break;
      case 'reports':
        reportView.render(contentArea);
        break;
      default:
        dashboardView.render(contentArea);
    }
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    hideLoader();
  }
}

// App Layout Renderer
function renderAppLayout() {
  appRoot.innerHTML = `
    <div class="app-container">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-brand">
          <i class="bi bi-hexagon-fill"></i>
          <span>NexusFlow</span>
        </div>
        
        <ul class="sidebar-menu">
          <li><a class="menu-item active" data-view="dashboard"><i class="bi bi-grid-1x2-fill"></i> <span>Dashboard</span></a></li>
          <li><a class="menu-item" data-view="workspaces"><i class="bi bi-building"></i> <span>Workspaces</span></a></li>
          <li><a class="menu-item" data-view="projects"><i class="bi bi-briefcase"></i> <span>Projects</span></a></li>
          <li><a class="menu-item" data-view="chat"><i class="bi bi-chat-left-text-fill"></i> <span>Team Chat</span></a></li>
          <li><a class="menu-item" data-view="meetings"><i class="bi bi-camera-video-fill"></i> <span>Meetings</span></a></li>
          <li><a class="menu-item" data-view="calendar"><i class="bi bi-calendar-event"></i> <span>Calendar</span></a></li>
          <li><a class="menu-item" data-view="wiki"><i class="bi bi-book"></i> <span>Wiki Docs</span></a></li>
          <li><a class="menu-item" data-view="attendance"><i class="bi bi-clock"></i> <span>Attendance</span></a></li>
          <li><a class="menu-item" data-view="reports"><i class="bi bi-file-earmark-bar-graph"></i> <span>Reports</span></a></li>
          <li><a class="menu-item" data-view="portal"><i class="bi bi-person-workspace"></i> <span>Client Portal</span></a></li>
        </ul>

        <div style="margin-top: auto; display: flex; flex-direction: column; gap: 10px;">
          <a class="menu-item" id="theme-toggle-btn">
            <i class="bi bi-brightness-high-fill" id="theme-icon"></i>
            <span>Theme Toggle</span>
          </a>
          <a class="menu-item text-danger" id="logout-btn">
            <i class="bi bi-box-arrow-left"></i>
            <span>Logout</span>
          </a>
        </div>
      </aside>

      <!-- Main Panel -->
      <main class="main-content">
        <!-- Top Navigation -->
        <header class="top-navbar glass-card">
          <div class="search-container">
            <i class="bi bi-search search-icon"></i>
            <input type="text" class="search-input" id="global-search-input" placeholder="Search tasks, projects, wikis...">
          </div>

          <div class="user-nav-actions">
            <!-- Workspace indicator -->
            <span class="badge bg-indigo text-light p-2" id="current-workspace-badge" style="cursor: pointer; background: var(--accent-gradient);">
              Workspace: ${state.currentWorkspace ? state.currentWorkspace.name : 'Select'}
            </span>

            <!-- Notifications Center -->
            <div class="notification-bell" id="bell-dropdown-toggle">
              <i class="bi bi-bell-fill"></i>
              <span class="bell-badge" id="bell-badge-count" style="display:none;">0</span>
            </div>
            
            <!-- User avatar -->
            <img class="user-avatar-circle" id="profile-btn" src="${state.user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}" alt="profile">
          </div>
        </header>

        <!-- Dynamic Content Body -->
        <div id="main-content-area" style="flex-grow: 1; display: flex; flex-direction: column; gap: 24px;">
        </div>
      </main>
    </div>
  `;

  // Bind Sidebar navigation
  document.querySelectorAll('.menu-item[data-view]').forEach(item => {
    item.addEventListener('click', () => {
      navigateTo(item.dataset.view);
    });
  });

  // Theme logic
  const themeToggle = document.getElementById('theme-toggle-btn');
  const themeIcon = document.getElementById('theme-icon');
  
  const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    themeIcon.className = theme === 'dark' ? 'bi bi-brightness-high-fill' : 'bi bi-moon-fill';
  };
  
  applyTheme(state.theme);

  themeToggle.addEventListener('click', () => {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    state.theme = newTheme;
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  });

  // Logout binding
  document.getElementById('logout-btn').addEventListener('click', () => {
    api.post('/auth/logout', { token: state.refreshToken }).catch(() => {});
    state.clearSession();
    navigateTo('dashboard');
  });

  // Profile click
  document.getElementById('profile-btn').addEventListener('click', () => {
    // Navigate to profile editing view (part of workspaces or a generic modal)
    components.showProfileModal();
  });

  // Workspace badge click
  document.getElementById('current-workspace-badge').addEventListener('click', () => {
    navigateTo('workspaces');
  });

  // Bind notification bell
  document.getElementById('bell-dropdown-toggle').addEventListener('click', (e) => {
    components.showNotificationDropdown(e);
  });

  // Global search input
  const searchInput = document.getElementById('global-search-input');
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      components.showSearchModal(searchInput.value);
    }
  });

  // Fetch initial workspaces list to configure socket connection
  api.get('/workspaces').then(list => {
    state.workspaces = list;
    const wsIds = list.map(ws => ws._id);
    socketService.init(state.user.id, wsIds);
  }).catch(() => {});

  // Fetch initial notifications count
  components.updateNotificationsBadge();
}

// Global notification trigger
window.addEventListener('socket-notification', (e) => {
  const notif = e.detail;
  state.notifications.unshift(notif);
  components.updateNotificationsBadge();
  showToast(notif.title + ': ' + notif.message, 'success');
});

// Toast Notifications
export function showToast(message, type = 'success') {
  const toastContainer = document.getElementById('toast-container') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast-banner glass-card ${type}`;
  toast.innerHTML = `
    <div class="toast-body d-flex align-items-center gap-2" style="padding: 12px 20px;">
      <i class="bi ${type === 'success' ? 'bi-check-circle-fill text-success' : 'bi-exclamation-triangle-fill text-danger'}"></i>
      <span>${message}</span>
    </div>
  `;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.style.position = 'fixed';
  container.style.bottom = '20px';
  container.style.right = '20px';
  container.style.zIndex = '9999';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '10px';
  document.body.appendChild(container);
  return container;
}

// Loaders
export function showLoader() {
  const loader = document.getElementById('global-loader') || createLoader();
  loader.style.display = 'flex';
}

export function hideLoader() {
  const loader = document.getElementById('global-loader');
  if (loader) loader.style.display = 'none';
}

function createLoader() {
  const loader = document.createElement('div');
  loader.id = 'global-loader';
  loader.style.position = 'fixed';
  loader.style.top = '0';
  loader.style.left = '0';
  loader.style.width = '100vw';
  loader.style.height = '100vh';
  loader.style.background = 'rgba(0,0,0,0.5)';
  loader.style.backdropFilter = 'blur(5px)';
  loader.style.zIndex = '99999';
  loader.style.display = 'flex';
  loader.style.alignItems = 'center';
  loader.style.justifyContent = 'center';
  loader.innerHTML = `
    <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
      <span class="visually-hidden">Loading...</span>
    </div>
  `;
  document.body.appendChild(loader);
  return loader;
}

// Handle Token Auth failures
window.addEventListener('auth-failed', () => {
  showToast('Session expired, please log in again', 'error');
  navigateTo('dashboard');
});

// App Launch Initialization
window.addEventListener('DOMContentLoaded', () => {
  navigateTo('dashboard');
});
