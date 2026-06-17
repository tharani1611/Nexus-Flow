import { state } from '../state.js';
import { api } from '../api.js';
import { showToast } from '../app.js';
import { socketService } from '../socket.js';

export const meetingView = {
  activeRoomName: null,
  micActive: true,
  videoActive: true,

  async render(container) {
    if (!state.currentWorkspace) {
      container.innerHTML = `
        <div class="glass-card p-5 text-center my-auto">
          <i class="bi bi-camera-video-fill" style="font-size: 40px; color: var(--text-secondary);"></i>
          <h5 class="mt-3">No Workspace Selected</h5>
          <p style="color:var(--text-secondary);">Select a workspace to organize meeting rooms.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="row g-4" id="meeting-main-row">
        <!-- Create / Join Room Form -->
        <div class="col-md-5">
          <div class="glass-card p-4">
            <h5 style="font-weight:600; margin-bottom:16px;">Video Conference Rooms</h5>
            <form id="create-meeting-form" style="display:flex; flex-direction:column; gap:12px;">
              <div>
                <label class="form-label" style="font-size:12px;">Room Name</label>
                <input type="text" class="form-control bg-dark text-light border-secondary" id="meeting-room-name-input" required placeholder="Daily Standup">
              </div>
              <div>
                <label class="form-label" style="font-size:12px;">Associated Project (Optional)</label>
                <select class="form-select bg-dark text-light border-secondary" id="meeting-project-select">
                  <option value="">None</option>
                </select>
              </div>
              <button type="submit" class="btn btn-indigo w-100 mt-2" style="background:var(--accent-gradient); border:none; color:white; font-weight:600; padding:12px;">Create & Join Room</button>
            </form>
          </div>

          <!-- Meeting history -->
          <div class="glass-card p-4 mt-4">
            <h6 style="font-weight:600; margin-bottom:12px;">Workspace Meeting History</h6>
            <div style="display:flex; flex-direction:column; gap:8px; max-height:220px; overflow-y:auto;" id="meeting-history-list">
              <span style="font-size:11px; color:var(--text-secondary);">No meeting records.</span>
            </div>
          </div>
        </div>

        <!-- Room interface placeholder (or actual panel when joined) -->
        <div class="col-md-7" id="meeting-video-area">
          <div class="glass-card p-4 h-100 d-flex flex-column align-items-center justify-content-center text-center py-5">
            <i class="bi bi-camera-video" style="font-size:48px; color:var(--text-secondary);"></i>
            <h6 class="mt-3" style="color:var(--text-secondary);">Join a meeting room to start streaming video and audio with team peers.</h6>
          </div>
        </div>
      </div>
    `;

    this.bindFormEvents();
    await this.fetchMeetingHistory();
    this.populateProjectSelect();
  },

  async fetchMeetingHistory() {
    try {
      const list = await api.get(`/meetings/workspace/${state.currentWorkspace._id}`);
      const history = document.getElementById('meeting-history-list');
      
      if (list.length > 0) {
        history.innerHTML = '';
        list.forEach(m => {
          const isAct = m.active;
          const div = document.createElement('div');
          div.className = 'p-3 rounded-3 d-flex align-items-center justify-content-between';
          div.style.background = 'rgba(255,255,255,0.01)';
          div.style.border = '1px solid rgba(255,255,255,0.05)';
          div.innerHTML = `
            <div>
              <div style="font-size:13px; font-weight:600;">${m.roomName}</div>
              <div style="font-size:10px; color:var(--text-secondary); margin-top:2px;">Host: ${m.host ? m.host.name : 'Unknown'}</div>
            </div>
            ${isAct ? `<button class="btn btn-sm btn-indigo join-active-room-btn" data-room="${m.roomName}">Join</button>` : `<span class="badge bg-secondary" style="font-size:9px;">Finished</span>`}
          `;

          if (isAct) {
            div.querySelector('.join-active-room-btn').onclick = () => {
              this.enterMeetingRoom(m.roomName, m._id);
            };
          }

          history.appendChild(div);
        });
      }
    } catch (err) {
      console.error(err);
    }
  },

  populateProjectSelect() {
    const sel = document.getElementById('meeting-project-select');
    state.projects.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p._id;
      opt.textContent = p.name;
      sel.appendChild(opt);
    });
  },

  bindFormEvents() {
    document.getElementById('create-meeting-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const roomName = document.getElementById('meeting-room-name-input').value;
      const project = document.getElementById('meeting-project-select').value;

      try {
        const meet = await api.post(`/meetings/workspace/${state.currentWorkspace._id}`, {
          roomName,
          project: project || null
        });

        showToast('Meeting room created!');
        this.enterMeetingRoom(roomName, meet._id);
        this.fetchMeetingHistory();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  },

  enterMeetingRoom(roomName, meetingId) {
    this.activeRoomName = roomName;
    const videoArea = document.getElementById('meeting-video-area');

    // Switch layout to active meeting
    videoArea.innerHTML = `
      <div class="glass-card p-4 h-100 d-flex flex-column justify-content-between meeting-container">
        <div class="d-flex justify-content-between align-items-center border-bottom pb-2">
          <div>
            <h5 style="font-weight:600; margin:0;">Room: ${roomName}</h5>
            <span style="font-size:10px; color:var(--text-secondary);" id="meeting-users-count">Participants: 1</span>
          </div>
          <button class="btn btn-sm btn-danger" id="leave-meeting-room-btn">End / Leave Call</button>
        </div>

        <!-- Video tiles layout grid -->
        <div class="meeting-grid mt-3 mb-3" id="meeting-video-grid">
          <!-- My Tile -->
          <div class="video-tile" id="my-video-tile">
            <img src="${state.user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}" class="video-avatar">
            <span class="video-overlay-name">You</span>
            <span class="video-overlay-mic" id="my-mic-overlay-badge"><i class="bi bi-mic-fill text-success"></i></span>
          </div>
        </div>

        <!-- Media toggles controls -->
        <div class="meeting-controls">
          <button class="control-btn active" id="mic-toggle-btn"><i class="bi bi-mic-fill"></i></button>
          <button class="control-btn active" id="video-toggle-btn"><i class="bi bi-camera-video-fill"></i></button>
        </div>
      </div>
    `;

    // Connect to sockets for meeting signaling
    socketService.emitJoinMeeting({
      roomName,
      userName: state.user.name,
      audioActive: this.micActive,
      videoActive: this.videoActive
    });

    this.bindMeetingControls(meetingId);
  },

  bindMeetingControls(meetingId) {
    const micBtn = document.getElementById('mic-toggle-btn');
    const videoBtn = document.getElementById('video-toggle-btn');

    micBtn.onclick = () => {
      this.micActive = !this.micActive;
      micBtn.className = `control-btn ${this.micActive ? 'active' : ''}`;
      micBtn.innerHTML = `<i class="bi ${this.micActive ? 'bi-mic-fill' : 'bi-mic-mute-fill'}"></i>`;
      document.getElementById('my-mic-overlay-badge').innerHTML = `<i class="bi ${this.micActive ? 'bi-mic-fill text-success' : 'bi-mic-mute-fill text-danger'}"></i>`;
      
      socketService.emitMediaToggle({
        roomName: this.activeRoomName,
        audioActive: this.micActive,
        videoActive: this.videoActive
      });
    };

    videoBtn.onclick = () => {
      this.videoActive = !this.videoActive;
      videoBtn.className = `control-btn ${this.videoActive ? 'active' : ''}`;
      videoBtn.innerHTML = `<i class="bi ${this.videoActive ? 'bi-camera-video-fill' : 'bi-camera-video-off-fill'}"></i>`;
      
      const avatar = document.querySelector('#my-video-tile img');
      if (avatar) avatar.style.display = this.videoActive ? 'block' : 'none';

      socketService.emitMediaToggle({
        roomName: this.activeRoomName,
        audioActive: this.micActive,
        videoActive: this.videoActive
      });
    };

    // Leave call button
    document.getElementById('leave-meeting-room-btn').addEventListener('click', async () => {
      // Disconnect from conference
      socketService.disconnect();
      
      // If host, try ending meeting
      try {
        await api.post(`/meetings/${meetingId}/end`).catch(() => {});
      } catch (err) {}

      // Re-init socket
      const wsIds = state.workspaces.map(ws => ws._id);
      socketService.init(state.user.id, wsIds);

      // Re-render view
      this.render(document.getElementById('main-content-area'));
    });

    // Listen for other users joining
    window.addEventListener('socket-meeting-join', (e) => {
      const peer = e.detail;
      const grid = document.getElementById('meeting-video-grid');
      if (!grid) return;

      // Add peer video tile
      const peerTile = document.createElement('div');
      peerTile.className = 'video-tile';
      peerTile.id = `peer-tile-${peer.socketId}`;
      peerTile.innerHTML = `
        <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80" class="video-avatar">
        <span class="video-overlay-name">${peer.userName}</span>
        <span class="video-overlay-mic" id="mic-badge-${peer.socketId}"><i class="bi ${peer.audioActive ? 'bi-mic-fill text-success' : 'bi-mic-mute-fill text-danger'}"></i></span>
      `;
      grid.appendChild(peerTile);

      showToast(`${peer.userName} joined the meeting`);
      this.updateMeetingCount();
    });

    // Listen for peer media changes
    window.addEventListener('socket-meeting-media', (e) => {
      const peer = e.detail;
      const badge = document.getElementById(`mic-badge-${peer.socketId}`);
      if (badge) {
        badge.innerHTML = `<i class="bi ${peer.audioActive ? 'bi-mic-fill text-success' : 'bi-mic-mute-fill text-danger'}"></i>`;
      }
    });

    // Listen for peer leaving
    window.addEventListener('socket-meeting-leave', (e) => {
      const peer = e.detail;
      const tile = document.getElementById(`peer-tile-${peer.socketId}`);
      if (tile) {
        tile.remove();
        showToast(`${peer.userName} left the meeting`);
        this.updateMeetingCount();
      }
    });
  },

  updateMeetingCount() {
    const tilesCount = document.querySelectorAll('.video-tile').length;
    const counter = document.getElementById('meeting-users-count');
    if (counter) counter.textContent = `Participants: ${tilesCount}`;
  }
};
