import { state } from '../state.js';
import { api } from '../api.js';
import { showToast } from '../app.js';
import { socketService } from '../socket.js';

export const chatView = {
  activeChatType: 'Workspace', // 'Workspace', 'Project', 'Direct'
  activeTargetId: null,
  typingTimeout: null,

  async render(container) {
    if (!state.currentWorkspace) {
      container.innerHTML = `
        <div class="glass-card p-5 text-center my-auto">
          <i class="bi bi-chat-dots-fill" style="font-size: 40px; color: var(--text-secondary);"></i>
          <h5 class="mt-3">No Workspace Selected</h5>
          <p style="color:var(--text-secondary);">Select a workspace to chat with your team members.</p>
        </div>
      `;
      return;
    }

    this.activeTargetId = state.currentWorkspace._id;
    this.activeChatType = 'Workspace';

    container.innerHTML = `
      <div class="glass-card chat-window">
        <!-- Sidebar channels list -->
        <div class="chat-rooms">
          <h6 style="font-weight:600; font-size:12px; text-transform:uppercase; color:var(--text-secondary);">Channels</h6>
          <div class="chat-room-list" id="chat-channels-list">
            <div class="chat-room-item active" id="ws-channel-link">
              <i class="bi bi-hash"></i>
              <span>General Workspace</span>
            </div>
          </div>

          <h6 class="mt-3" style="font-weight:600; font-size:12px; text-transform:uppercase; color:var(--text-secondary);">Projects</h6>
          <div class="chat-room-list" id="chat-projects-list">
            <span style="font-size:11px; color:var(--text-secondary);">No projects active</span>
          </div>

          <h6 class="mt-3" style="font-weight:600; font-size:12px; text-transform:uppercase; color:var(--text-secondary);">Direct Messages</h6>
          <div class="chat-room-list" id="chat-users-list">
          </div>
        </div>

        <!-- Main Chat Box Area -->
        <div class="chat-main">
          <!-- Chat header -->
          <div class="chat-header">
            <div>
              <h5 style="font-weight:600; margin:0;" id="chat-title"># General Workspace</h5>
              <span style="font-size:11px; color:var(--text-secondary);" id="chat-subtitle">Workspace General channel chat</span>
              <div style="font-size:11px; color:var(--success-color); font-weight:600; height:12px; margin-top:2px;" id="chat-typing-indicator"></div>
            </div>
          </div>

          <!-- Chat messages area -->
          <div class="chat-messages" id="chat-messages-container">
            <div class="spinner-border text-primary align-self-center my-auto" role="status"></div>
          </div>

          <!-- Chat input -->
          <div class="chat-input-area">
            <input type="text" class="chat-input" id="chat-input-box" placeholder="Type a message...">
            <button class="btn btn-indigo rounded-pill px-4" id="chat-send-btn" style="background:var(--accent-gradient); border:none; color:white; font-weight:600;">Send</button>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
    await this.fetchChannelsAndUsers();
    await this.fetchMessages();
  },

  async fetchChannelsAndUsers() {
    try {
      const workspaceId = state.currentWorkspace._id;

      // Project lists
      const projects = await api.get(`/projects/workspace/${workspaceId}`);
      const projList = document.getElementById('chat-projects-list');
      if (projects.length > 0) {
        projList.innerHTML = '';
        projects.forEach(p => {
          const item = document.createElement('div');
          item.className = 'chat-room-item';
          item.innerHTML = `<i class="bi bi-folder2-open"></i> <span>${p.name}</span>`;
          item.onclick = () => {
            this.switchChat('Project', p._id, `# ${p.name}`, 'Project channel chat');
            this.highlightRoom(item);
          };
          projList.appendChild(item);
        });
      }

      // Users lists
      const userList = document.getElementById('chat-users-list');
      userList.innerHTML = '';
      state.currentWorkspace.members.forEach(m => {
        const u = m.user;
        if (!u || u._id === state.user.id) return; // skip self

        const item = document.createElement('div');
        item.className = 'chat-room-item';
        item.innerHTML = `
          <img src="${u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=50&q=80'}" style="width:20px; height:20px; border-radius:50%; object-fit:cover;">
          <span>${u.name}</span>
        `;
        item.onclick = () => {
          this.switchChat('Direct', u._id, `@ ${u.name}`, `Direct message conversation`);
          this.highlightRoom(item);
        };
        userList.appendChild(item);
      });

    } catch (err) {
      console.error(err);
    }
  },

  highlightRoom(element) {
    document.querySelectorAll('.chat-room-item').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
  },

  switchChat(chatType, targetId, title, subtitle) {
    this.activeChatType = chatType;
    this.activeTargetId = targetId;

    document.getElementById('chat-title').textContent = title;
    document.getElementById('chat-subtitle').textContent = subtitle;
    document.getElementById('chat-typing-indicator').textContent = '';

    this.fetchMessages();
  },

  async fetchMessages() {
    const container = document.getElementById('chat-messages-container');
    container.innerHTML = `<div class="spinner-border text-primary align-self-center my-auto" role="status"></div>`;
    
    try {
      let messages = [];
      if (this.activeChatType === 'Workspace') {
        messages = await api.get(`/chat/workspace/${this.activeTargetId}`);
      } else if (this.activeChatType === 'Project') {
        messages = await api.get(`/chat/project/${this.activeTargetId}`);
      } else if (this.activeChatType === 'Direct') {
        messages = await api.get(`/chat/direct/${this.activeTargetId}`);
      }

      container.innerHTML = '';
      if (messages.length === 0) {
        container.innerHTML = `<p style="font-size:12px; color:var(--text-secondary); text-align:center; margin:auto;">Start of the conversation</p>`;
      } else {
        messages.forEach(msg => {
          this.appendMessage(msg, false);
        });
      }

      this.scrollToBottom();
    } catch (err) {
      container.innerHTML = `<div style="text-align:center; color:var(--danger-color);">${err.message}</div>`;
    }
  },

  appendMessage(msg, shouldScroll = true) {
    const container = document.getElementById('chat-messages-container');
    if (!container) return;

    // Check if start conversation note exists and remove it
    if (container.querySelector('p')) {
      container.innerHTML = '';
    }

    const isSelf = msg.sender && (msg.sender._id === state.user.id || msg.sender === state.user.id);
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${isSelf ? 'outgoing' : 'incoming'}`;
    
    const senderName = isSelf ? 'You' : (msg.sender ? msg.sender.name : 'Unknown');
    const avatarSrc = msg.sender && msg.sender.avatar ? msg.sender.avatar : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=50&q=80';
    
    bubble.innerHTML = `
      <div class="chat-bubble-meta d-flex justify-content-between align-items-center gap-3">
        <span>${senderName}</span>
        <span>${new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      <div>${msg.content}</div>
    `;

    container.appendChild(bubble);

    if (shouldScroll) {
      this.scrollToBottom();
    }
  },

  scrollToBottom() {
    const container = document.getElementById('chat-messages-container');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  },

  bindEvents() {
    // Send actions
    const sendBtn = document.getElementById('chat-send-btn');
    const inputBox = document.getElementById('chat-input-box');

    const handleSend = () => {
      const content = inputBox.value;
      if (!content || !content.trim()) return;

      socketService.emitSendMessage({
        chatType: this.activeChatType,
        targetId: this.activeTargetId,
        content
      });

      inputBox.value = '';
      socketService.emitStopTyping({
        chatType: this.activeChatType,
        targetId: this.activeTargetId
      });
    };

    sendBtn.addEventListener('click', handleSend);
    inputBox.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSend();
    });

    // General workspace click
    document.getElementById('ws-channel-link').addEventListener('click', (e) => {
      this.switchChat('Workspace', state.currentWorkspace._id, '# General Workspace', 'Workspace General channel chat');
      this.highlightRoom(e.currentTarget);
    });

    // Typing Indicators emitters
    inputBox.addEventListener('input', () => {
      socketService.emitTyping({
        workspaceId: this.activeChatType === 'Workspace' ? this.activeTargetId : null,
        projectId: this.activeChatType === 'Project' ? this.activeTargetId : null,
        recipientId: this.activeChatType === 'Direct' ? this.activeTargetId : null,
        userName: state.user.name
      });

      clearTimeout(this.typingTimeout);
      this.typingTimeout = setTimeout(() => {
        socketService.emitStopTyping({
          workspaceId: this.activeChatType === 'Workspace' ? this.activeTargetId : null,
          projectId: this.activeChatType === 'Project' ? this.activeTargetId : null,
          recipientId: this.activeChatType === 'Direct' ? this.activeTargetId : null
        });
      }, 2000);
    });

    // Listen for realtime socket chat messages
    window.addEventListener('socket-chat-message', (e) => {
      const msg = e.detail;
      const matchesWorkspace = this.activeChatType === 'Workspace' && msg.chatType === 'Workspace' && msg.targetId === this.activeTargetId;
      const matchesProject = this.activeChatType === 'Project' && msg.chatType === 'Project' && msg.targetId === this.activeTargetId;
      const matchesDM = this.activeChatType === 'Direct' && msg.chatType === 'Direct' && 
                        (msg.targetId === this.activeTargetId || msg.sender._id === this.activeTargetId);

      if (matchesWorkspace || matchesProject || matchesDM) {
        this.appendMessage(msg, true);
      }
    });

    // Listen for typing indicators status
    window.addEventListener('socket-typing-status', (e) => {
      const data = e.detail;
      const indicator = document.getElementById('chat-typing-indicator');
      if (!indicator) return;

      const isForWorkspace = this.activeChatType === 'Workspace' && data.workspaceId === this.activeTargetId;
      const isForProject = this.activeChatType === 'Project' && data.projectId === this.activeTargetId;
      const isForDM = this.activeChatType === 'Direct' && data.senderId === this.activeTargetId;

      if (isForWorkspace || isForProject || isForDM) {
        if (data.isTyping) {
          indicator.textContent = `${data.userName} is typing...`;
        } else {
          indicator.textContent = '';
        }
      }
    });
  }
};
