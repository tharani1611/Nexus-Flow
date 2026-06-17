import { state } from '../state.js';
import { api } from '../api.js';
import { showToast } from '../app.js';

export const dashboardView = {
  async render(container) {
    if (!state.currentWorkspace) {
      container.innerHTML = `
        <div class="glass-card p-5 text-center my-auto">
          <i class="bi bi-building-exclamation" style="font-size: 48px; color: var(--accent-color);"></i>
          <h4 class="mt-3">No Workspace Selected</h4>
          <p style="color: var(--text-secondary); max-width: 450px; margin: 10px auto;">
            Please select or create an organization workspace to view your project dashboard analytics.
          </p>
          <button class="btn btn-indigo mt-3" id="select-ws-dash-btn" style="background:var(--accent-gradient); border:none; color:white;">Select Workspace</button>
        </div>
      `;
      document.getElementById('select-ws-dash-btn').addEventListener('click', () => {
        const wsTab = document.querySelector('.menu-item[data-view="workspaces"]');
        if (wsTab) wsTab.click();
      });
      return;
    }

    const workspaceId = state.currentWorkspace._id;

    // Structure layout
    container.innerHTML = `
      <!-- Stats Cards Row -->
      <div class="row g-4" id="stats-grid-row">
        <div class="col-md-3">
          <div class="glass-card p-4">
            <div style="font-size:12px; color:var(--text-secondary); font-weight:600; text-transform:uppercase;">Projects</div>
            <div style="font-size:32px; font-weight:700; margin-top:8px;" id="stat-projects-count">0</div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="glass-card p-4">
            <div style="font-size:12px; color:var(--text-secondary); font-weight:600; text-transform:uppercase;">Total Tasks</div>
            <div style="font-size:32px; font-weight:700; margin-top:8px;" id="stat-tasks-count">0</div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="glass-card p-4">
            <div style="font-size:12px; color:var(--text-secondary); font-weight:600; text-transform:uppercase;">Team Size</div>
            <div style="font-size:32px; font-weight:700; margin-top:8px;" id="stat-team-count">0</div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="glass-card p-4">
            <div style="font-size:12px; color:var(--text-secondary); font-weight:600; text-transform:uppercase;">Sprints</div>
            <div style="font-size:32px; font-weight:700; margin-top:8px;" id="stat-sprints-count">0</div>
          </div>
        </div>
      </div>

      <!-- Quick Action: Attendance & Time Tracker -->
      <div class="row g-4 mt-1">
        <div class="col-md-6">
          <div class="glass-card p-4 d-flex align-items-center justify-content-between">
            <div>
              <h5 style="font-weight:600; margin:0;">Attendance Board</h5>
              <p style="color:var(--text-secondary); font-size:13px; margin-top:4px;" id="attendance-status-text">Checking status...</p>
            </div>
            <button class="btn btn-indigo" id="quick-clock-btn" style="background:var(--accent-gradient); border:none; color:white; padding:10px 24px; font-weight:600;">Clock In</button>
          </div>
        </div>

        <div class="col-md-6">
          <div class="glass-card p-4 d-flex align-items-center justify-content-between">
            <div>
              <h5 style="font-weight:600; margin:0;">AI Helper Insight</h5>
              <p style="color:var(--text-secondary); font-size:13px; margin-top:4px;">Ask AI assistant to optimize your workflow plan.</p>
            </div>
            <button class="btn btn-outline-light" id="ai-helper-btn" style="padding:10px 20px; font-weight:600;">Ask AI</button>
          </div>
        </div>
      </div>

      <!-- Charts Grid -->
      <div class="row g-4 mt-1">
        <div class="col-md-6">
          <div class="glass-card p-4">
            <h6 class="mb-3" style="font-weight:600;">Task Status Breakdown</h6>
            <div style="height:250px; display:flex; align-items:center; justify-content:center;">
              <canvas id="chart-status-pie"></canvas>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="glass-card p-4">
            <h6 class="mb-3" style="font-weight:600;">Priority Distribution</h6>
            <div style="height:250px; display:flex; align-items:center; justify-content:center;">
              <canvas id="chart-priority-bar"></canvas>
            </div>
          </div>
        </div>
      </div>

      <!-- Activity Logs Feed -->
      <div class="row g-4 mt-1">
        <div class="col-12">
          <div class="glass-card p-4">
            <h6 class="mb-3" style="font-weight:600;">Recent Workspace Activities</h6>
            <div style="max-height: 250px; overflow-y:auto; display:flex; flex-direction:column; gap:12px;" id="dashboard-activity-list">
              <p style="color:var(--text-secondary); font-size:12px; text-align:center;">No recent activities logged.</p>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
    await this.fetchDashboardData(workspaceId);
  },

  async fetchDashboardData(workspaceId) {
    try {
      const projects = await api.get(`/projects/workspace/${workspaceId}`);
      const membersCount = state.currentWorkspace.members.length;

      let allTasks = [];
      let allSprints = [];

      for (const proj of projects) {
        const tasks = await api.get(`/tasks/project/${proj._id}`);
        const sprints = await api.get(`/sprints/project/${proj._id}`);
        allTasks.push(...tasks);
        allSprints.push(...sprints);
      }

      // Update counters
      document.getElementById('stat-projects-count').textContent = projects.length;
      document.getElementById('stat-tasks-count').textContent = allTasks.length;
      document.getElementById('stat-team-count').textContent = membersCount;
      document.getElementById('stat-sprints-count').textContent = allSprints.length;

      // Update Attendance status
      const attStatus = await api.get('/attendance/status');
      const clockBtn = document.getElementById('quick-clock-btn');
      const statusText = document.getElementById('attendance-status-text');

      if (attStatus.clockedIn) {
        clockBtn.textContent = 'Clock Out';
        clockBtn.className = 'btn btn-danger';
        clockBtn.style.background = 'var(--danger-color)';
        statusText.textContent = `You clocked in at: ${new Date(attStatus.activeLog.clockIn).toLocaleTimeString()}`;
      } else {
        clockBtn.textContent = 'Clock In';
        clockBtn.className = 'btn btn-indigo';
        clockBtn.style.background = 'var(--accent-gradient)';
        statusText.textContent = 'Ready to clock in for your shift today.';
      }

      // Render Charts
      this.renderCharts(allTasks);

      // Fetch activity logs
      const activities = await api.get(`/activities/workspace/${workspaceId}`);
      const logList = document.getElementById('dashboard-activity-list');
      if (activities.length > 0) {
        logList.innerHTML = '';
        activities.forEach(act => {
          const div = document.createElement('div');
          div.style.display = 'flex';
          div.style.justifyContent = 'space-between';
          div.style.alignItems = 'center';
          div.style.padding = '10px 14px';
          div.style.borderRadius = '8px';
          div.style.background = 'rgba(255,255,255,0.02)';
          div.style.border = '1px solid rgba(255,255,255,0.05)';
          div.innerHTML = `
            <div>
              <span style="font-weight:600;">${act.user ? act.user.name : 'System'}</span>
              <span style="color:var(--text-secondary); margin-left:6px;">${act.details}</span>
            </div>
            <div style="font-size:10px; color:var(--text-secondary);">${new Date(act.createdAt).toLocaleString()}</div>
          `;
          logList.appendChild(div);
        });
      }

    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  renderCharts(tasks) {
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js library is not available.');
      return;
    }

    // Task status counts
    const statuses = ['Backlog', 'Todo', 'In Progress', 'Review', 'Testing', 'Done'];
    const statusCounts = statuses.map(s => tasks.filter(t => t.status === s).length);

    // Pie Chart
    const pieCtx = document.getElementById('chart-status-pie').getContext('2d');
    new Chart(pieCtx, {
      type: 'pie',
      data: {
        labels: statuses,
        datasets: [{
          data: statusCounts,
          backgroundColor: [
            'rgba(148, 163, 184, 0.7)',
            'rgba(99, 102, 241, 0.7)',
            'rgba(245, 158, 11, 0.7)',
            'rgba(168, 85, 247, 0.7)',
            'rgba(236, 72, 153, 0.7)',
            'rgba(16, 185, 129, 0.7)'
          ],
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#f3f4f6' }
          }
        }
      }
    });

    // Task Priorities
    const priorities = ['Low', 'Medium', 'High', 'Urgent'];
    const priorityCounts = priorities.map(p => tasks.filter(t => t.priority === p).length);

    // Bar Chart
    const barCtx = document.getElementById('chart-priority-bar').getContext('2d');
    new Chart(barCtx, {
      type: 'bar',
      data: {
        labels: priorities,
        datasets: [{
          label: 'Tasks Count',
          data: priorityCounts,
          backgroundColor: 'rgba(99, 102, 241, 0.7)',
          borderColor: '#6366f1',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } },
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af', stepSize: 1 } }
        }
      }
    });
  },

  bindEvents() {
    // Attendance quick action
    const clockBtn = document.getElementById('quick-clock-btn');
    clockBtn.addEventListener('click', async () => {
      try {
        const attStatus = await api.get('/attendance/status');
        if (attStatus.clockedIn) {
          const res = await api.post('/attendance/clock-out');
          showToast(`Clocked out successfully! Total work hours: ${res.workHours} hours.`);
        } else {
          const res = await api.post('/attendance/clock-in');
          showToast(`Clocked in successfully at: ${new Date(res.clockIn).toLocaleTimeString()}`);
        }
        // Refresh dashboard data
        this.fetchDashboardData(state.currentWorkspace._id);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });

    // AI Helper click
    document.getElementById('ai-helper-btn').addEventListener('click', () => {
      // Navigate to chat or open AI helper description builder
      const chatTab = document.querySelector('.menu-item[data-view="chat"]');
      if (chatTab) chatTab.click();
    });
  }
};
