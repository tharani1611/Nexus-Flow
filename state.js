/**
 * Global Frontend State Store
 */
export const state = {
  user: JSON.parse(localStorage.getItem('user')) || null,
  accessToken: localStorage.getItem('accessToken') || null,
  refreshToken: localStorage.getItem('refreshToken') || null,
  currentWorkspace: JSON.parse(localStorage.getItem('currentWorkspace')) || null,
  currentProject: null,
  workspaces: [],
  projects: [],
  notifications: [],
  socket: null,
  currentView: 'dashboard',
  theme: localStorage.getItem('theme') || 'dark',

  // Clear session data
  clearSession() {
    this.user = null;
    this.accessToken = null;
    this.refreshToken = null;
    this.currentWorkspace = null;
    this.currentProject = null;
    this.workspaces = [];
    this.projects = [];
    this.notifications = [];
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentWorkspace');
  },

  // Save session data
  setSession(user, accessToken, refreshToken) {
    this.user = user;
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  },

  setWorkspace(workspace) {
    this.currentWorkspace = workspace;
    if (workspace) {
      localStorage.setItem('currentWorkspace', JSON.stringify(workspace));
    } else {
      localStorage.removeItem('currentWorkspace');
    }
  }
};
