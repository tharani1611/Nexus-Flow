import { state } from './state.js';

export const socketService = {
  socket: null,

  init(userId, workspaceIds) {
    if (this.socket) {
      this.socket.disconnect();
    }

    // Connect to same host
    // io is loaded in index.html via script src="/socket.io/socket.io.js"
    if (typeof io === 'undefined') {
      console.warn('Socket.io library not loaded yet.');
      return;
    }

    this.socket = io();
    state.socket = this.socket;

    this.socket.emit('setup', {
      userId,
      workspaceIds
    });

    // Register global listeners
    this.socket.on('user_status', (data) => {
      window.dispatchEvent(new CustomEvent('socket-user-status', { detail: data }));
    });

    this.socket.on('task_moved_update', (data) => {
      window.dispatchEvent(new CustomEvent('socket-task-moved', { detail: data }));
    });

    this.socket.on('typing_update', (data) => {
      window.dispatchEvent(new CustomEvent('socket-typing-status', { detail: data }));
    });

    this.socket.on('message_received', (data) => {
      window.dispatchEvent(new CustomEvent('socket-chat-message', { detail: data }));
    });

    this.socket.on('notification_received', (data) => {
      window.dispatchEvent(new CustomEvent('socket-notification', { detail: data }));
    });

    this.socket.on('user_joined_meeting', (data) => {
      window.dispatchEvent(new CustomEvent('socket-meeting-join', { detail: data }));
    });

    this.socket.on('user_media_updated', (data) => {
      window.dispatchEvent(new CustomEvent('socket-meeting-media', { detail: data }));
    });

    this.socket.on('user_left_meeting', (data) => {
      window.dispatchEvent(new CustomEvent('socket-meeting-leave', { detail: data }));
    });

    console.log('Socket client initialized.');
  },

  joinWorkspace(workspaceId) {
    if (this.socket) this.socket.emit('join_workspace', workspaceId);
  },

  joinProject(projectId) {
    if (this.socket) this.socket.emit('join_project', projectId);
  },

  emitTaskMoved(data) {
    if (this.socket) this.socket.emit('task_moved', data);
  },

  emitSendMessage(data) {
    if (this.socket) this.socket.emit('send_message', data);
  },

  emitTyping(data) {
    if (this.socket) this.socket.emit('typing', data);
  },

  emitStopTyping(data) {
    if (this.socket) this.socket.emit('stop_typing', data);
  },

  emitJoinMeeting(data) {
    if (this.socket) this.socket.emit('join_meeting', data);
  },

  emitMediaToggle(data) {
    if (this.socket) this.socket.emit('meeting_media_toggle', data);
  },

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      state.socket = null;
    }
  }
};
