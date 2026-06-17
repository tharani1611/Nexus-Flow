import { state } from '../state.js';
import { api } from '../api.js';
import { showToast } from '../app.js';

export const attendanceView = {
  async render(container) {
    container.innerHTML = `
      <div class="row g-4">
        <!-- Status Card -->
        <div class="col-md-5">
          <div class="glass-card p-4 d-flex flex-column gap-4">
            <h5 style="font-weight:600; margin:0;">Attendance Tracker</h5>

            <!-- Clock Status Widget -->
            <div class="text-center p-4" style="background:rgba(255,255,255,0.02); border-radius:16px; border:1px solid var(--glass-border);">
              <div id="att-clock-display" style="font-size:42px; font-weight:700; font-family:monospace; color:var(--accent-color);">00:00:00</div>
              <div style="font-size:13px; color:var(--text-secondary); margin-top:8px;" id="att-status-label">Not clocked in</div>
              <div class="d-flex justify-content-center gap-3 mt-4">
                <button class="btn btn-success px-4" id="att-clock-in-btn">
                  <i class="bi bi-play-circle-fill"></i> Clock In
                </button>
                <button class="btn btn-danger px-4" id="att-clock-out-btn" disabled>
                  <i class="bi bi-stop-circle-fill"></i> Clock Out
                </button>
              </div>
            </div>

            <!-- Today's Summary Card -->
            <div id="att-today-summary" style="display:flex; flex-direction:column; gap:8px;">
              <h6 style="font-weight:600; font-size:13px; color:var(--text-secondary); margin:0;">TODAY'S SUMMARY</h6>
              <div class="row g-2">
                <div class="col-6">
                  <div style="background:rgba(255,255,255,0.02); border:1px solid var(--glass-border); border-radius:10px; padding:10px; text-align:center;">
                    <div style="font-size:10px; color:var(--text-secondary); text-transform:uppercase;">Clock In</div>
                    <div style="font-weight:700; font-size:14px; margin-top:4px;" id="att-today-in">---</div>
                  </div>
                </div>
                <div class="col-6">
                  <div style="background:rgba(255,255,255,0.02); border:1px solid var(--glass-border); border-radius:10px; padding:10px; text-align:center;">
                    <div style="font-size:10px; color:var(--text-secondary); text-transform:uppercase;">Clock Out</div>
                    <div style="font-weight:700; font-size:14px; margin-top:4px;" id="att-today-out">---</div>
                  </div>
                </div>
                <div class="col-12">
                  <div style="background:rgba(99,102,241,0.1); border:1px solid rgba(99,102,241,0.2); border-radius:10px; padding:10px; text-align:center;">
                    <div style="font-size:10px; color:var(--text-secondary); text-transform:uppercase;">Total Hours Today</div>
                    <div style="font-weight:700; font-size:20px; color:var(--accent-color); margin-top:4px;" id="att-today-hours">0.00 hrs</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Attendance Logs Table -->
        <div class="col-md-7">
          <div class="glass-card p-4 d-flex flex-column gap-3">
            <div class="d-flex justify-content-between align-items-center">
              <h5 style="font-weight:600; margin:0;">Attendance History</h5>
              <span style="font-size:11px; color:var(--text-secondary);">Last 30 sessions</span>
            </div>

            <!-- Summary stats row -->
            <div class="row g-2" id="att-summary-stats">
              <div class="col-4">
                <div class="text-center p-2" style="background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.2); border-radius:10px;">
                  <div style="font-size:10px; color:var(--text-secondary);">Total Days</div>
                  <div style="font-weight:700; color:var(--success-color);" id="att-stat-days">0</div>
                </div>
              </div>
              <div class="col-4">
                <div class="text-center p-2" style="background:rgba(99,102,241,0.1); border:1px solid rgba(99,102,241,0.2); border-radius:10px;">
                  <div style="font-size:10px; color:var(--text-secondary);">Total Hours</div>
                  <div style="font-weight:700; color:var(--accent-color);" id="att-stat-hours">0</div>
                </div>
              </div>
              <div class="col-4">
                <div class="text-center p-2" style="background:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.2); border-radius:10px;">
                  <div style="font-size:10px; color:var(--text-secondary);">Avg Hours/Day</div>
                  <div style="font-weight:700; color:var(--warning-color);" id="att-stat-avg">0</div>
                </div>
              </div>
            </div>

            <!-- Logs Table -->
            <div style="overflow-x:auto; max-height:380px; overflow-y:auto;">
              <table class="table table-dark table-hover table-sm" style="font-size:13px; color:var(--text-primary);">
                <thead style="position:sticky; top:0; background:#0a0a1a;">
                  <tr>
                    <th style="font-weight:600; font-size:11px; color:var(--text-secondary);">Date</th>
                    <th style="font-weight:600; font-size:11px; color:var(--text-secondary);">Clock In</th>
                    <th style="font-weight:600; font-size:11px; color:var(--text-secondary);">Clock Out</th>
                    <th style="font-weight:600; font-size:11px; color:var(--text-secondary);">Work Hours</th>
                    <th style="font-weight:600; font-size:11px; color:var(--text-secondary);">Status</th>
                  </tr>
                </thead>
                <tbody id="att-logs-tbody">
                  <tr><td colspan="5" class="text-center py-3" style="color:var(--text-secondary);">Loading...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
    await this.fetchAttendanceData();
    this.startLiveClock();
  },

  clockInterval: null,
  clockedInTime: null,

  startLiveClock() {
    clearInterval(this.clockInterval);
    this.clockInterval = setInterval(() => {
      const display = document.getElementById('att-clock-display');
      if (!display) {
        clearInterval(this.clockInterval);
        return;
      }
      const now = new Date();
      const h = now.getHours().toString().padStart(2, '0');
      const m = now.getMinutes().toString().padStart(2, '0');
      const s = now.getSeconds().toString().padStart(2, '0');
      display.textContent = `${h}:${m}:${s}`;
    }, 1000);
  },

  async fetchAttendanceData() {
    try {
      const [status, logs] = await Promise.all([
        api.get('/attendance/status'),
        api.get('/attendance/logs')
      ]);

      const clockInBtn = document.getElementById('att-clock-in-btn');
      const clockOutBtn = document.getElementById('att-clock-out-btn');
      const statusLabel = document.getElementById('att-status-label');

      if (status.clockedIn && status.activeLog) {
        clockInBtn.disabled = true;
        clockOutBtn.disabled = false;
        const clockInTime = new Date(status.activeLog.clockIn);
        statusLabel.innerHTML = `<span style="color:var(--success-color); font-weight:600;"><i class="bi bi-circle-fill" style="font-size:8px;"></i> Clocked In since ${clockInTime.toLocaleTimeString()}</span>`;
        document.getElementById('att-today-in').textContent = clockInTime.toLocaleTimeString();
      } else {
        clockInBtn.disabled = false;
        clockOutBtn.disabled = true;
        statusLabel.textContent = 'Not clocked in today';
      }

      // Populate today summary from last log
      const todayStr = new Date().toISOString().split('T')[0];
      const todayLogs = logs.filter(l => l.clockIn.startsWith(todayStr));

      if (todayLogs.length > 0) {
        const latest = todayLogs[0];
        document.getElementById('att-today-in').textContent = new Date(latest.clockIn).toLocaleTimeString();
        if (latest.clockOut) {
          document.getElementById('att-today-out').textContent = new Date(latest.clockOut).toLocaleTimeString();
          document.getElementById('att-today-hours').textContent = `${latest.workHours.toFixed(2)} hrs`;
        }
      }

      // Render logs table
      const tbody = document.getElementById('att-logs-tbody');
      if (logs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-3" style="color:var(--text-secondary);">No attendance records found.</td></tr>`;
        return;
      }

      // Stats
      const completedLogs = logs.filter(l => l.clockOut);
      const totalHours = completedLogs.reduce((sum, l) => sum + (l.workHours || 0), 0);
      const avgHours = completedLogs.length > 0 ? (totalHours / completedLogs.length).toFixed(1) : 0;

      document.getElementById('att-stat-days').textContent = completedLogs.length;
      document.getElementById('att-stat-hours').textContent = `${totalHours.toFixed(1)} hrs`;
      document.getElementById('att-stat-avg').textContent = `${avgHours} hrs`;

      tbody.innerHTML = '';
      logs.slice(0, 30).forEach(log => {
        const isActive = !log.clockOut;
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${new Date(log.clockIn).toLocaleDateString()}</td>
          <td>${new Date(log.clockIn).toLocaleTimeString()}</td>
          <td>${log.clockOut ? new Date(log.clockOut).toLocaleTimeString() : '---'}</td>
          <td>${log.workHours ? log.workHours.toFixed(2) + ' hrs' : (isActive ? '<span class="pulse-active" style="color:var(--success-color);">Active</span>' : '---')}</td>
          <td><span class="badge" style="background:${isActive ? 'rgba(16,185,129,0.15); border:1px solid var(--success-color); color:var(--success-color)' : 'rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:var(--text-secondary)'}; font-size:10px;">${isActive ? 'In Progress' : 'Complete'}</span></td>
        `;
        tbody.appendChild(tr);
      });

    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  bindEvents() {
    document.getElementById('att-clock-in-btn').addEventListener('click', async () => {
      try {
        const res = await api.post('/attendance/clock-in');
        showToast(`Clocked in at ${new Date(res.clockIn).toLocaleTimeString()}`);
        await this.fetchAttendanceData();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });

    document.getElementById('att-clock-out-btn').addEventListener('click', async () => {
      try {
        const res = await api.post('/attendance/clock-out');
        showToast(`Clocked out! Total hours: ${res.workHours.toFixed(2)} hrs`);
        await this.fetchAttendanceData();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }
};
