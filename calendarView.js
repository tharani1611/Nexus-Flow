import { state } from '../state.js';
import { api } from '../api.js';
import { showToast } from '../app.js';

export const calendarView = {
  currentDate: new Date(),

  async render(container) {
    if (!state.currentWorkspace) {
      container.innerHTML = `
        <div class="glass-card p-5 text-center my-auto">
          <i class="bi bi-calendar-event" style="font-size: 40px; color: var(--text-secondary);"></i>
          <h5 class="mt-3">No Workspace Selected</h5>
          <p style="color:var(--text-secondary);">Select a workspace to view task deadlines on your calendar.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="glass-card p-4">
        <!-- Calendar Header -->
        <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <h5 style="font-weight:600; margin:0;" id="calendar-month-year">June 2026</h5>
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-outline-light" id="calendar-prev-btn"><i class="bi bi-chevron-left"></i> Prev</button>
            <button class="btn btn-sm btn-outline-light" id="calendar-today-btn">Today</button>
            <button class="btn btn-sm btn-outline-light" id="calendar-next-btn">Next <i class="bi bi-chevron-right"></i></button>
          </div>
        </div>

        <!-- Days of Week Headers -->
        <div class="row text-center fw-bold border-bottom pb-2" style="font-size:12px; color:var(--text-secondary);">
          <div class="col" style="width:14%">Sun</div>
          <div class="col" style="width:14%">Mon</div>
          <div class="col" style="width:14%">Tue</div>
          <div class="col" style="width:14%">Wed</div>
          <div class="col" style="width:14%">Thu</div>
          <div class="col" style="width:14%">Fri</div>
          <div class="col" style="width:14%">Sat</div>
        </div>

        <!-- Grid Days -->
        <div id="calendar-grid-body" style="display:flex; flex-direction:column; gap:8px; margin-top:8px;"></div>
      </div>
    `;

    this.bindControls();
    await this.renderMonthGrid();
  },

  async renderMonthGrid() {
    const gridBody = document.getElementById('calendar-grid-body');
    const title = document.getElementById('calendar-month-year');
    if (!gridBody) return;

    // Set Month Year Title
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    title.textContent = `${monthNames[month]} ${year}`;

    // Fetch workspace tasks
    let tasks = [];
    try {
      const projects = await api.get(`/projects/workspace/${state.currentWorkspace._id}`);
      for (const p of projects) {
        const t = await api.get(`/tasks/project/${p._id}`);
        tasks.push(...t);
      }
    } catch (err) {
      showToast(err.message, 'error');
    }

    // Filter tasks with valid due date
    const datedTasks = tasks.filter(t => t.dueDate);

    // Calculate dates
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    gridBody.innerHTML = '';

    let row = document.createElement('div');
    row.className = 'row text-center';
    row.style.minHeight = '90px';

    // Render leading prev month buffer days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const col = document.createElement('div');
      col.className = 'col p-1 border border-secondary rounded-2';
      col.style.width = '14%';
      col.style.opacity = '0.2';
      col.innerHTML = `<span style="font-size:12px;">${prevMonthTotalDays - i}</span>`;
      row.appendChild(col);
    }

    // Render current month days
    for (let day = 1; day <= totalDays; day++) {
      if (row.children.length === 7) {
        gridBody.appendChild(row);
        row = document.createElement('div');
        row.className = 'row text-center';
        row.style.minHeight = '90px';
      }

      const col = document.createElement('div');
      col.className = 'col p-1 border border-secondary rounded-2 position-relative';
      col.style.width = '14%';
      col.style.background = 'rgba(255,255,255,0.01)';
      
      const dayDateStr = new Date(year, month, day).toISOString().split('T')[0];
      const isToday = new Date().toISOString().split('T')[0] === dayDateStr;

      col.innerHTML = `
        <span style="font-size:12px; font-weight:${isToday ? '700' : '400'}; color: ${isToday ? 'var(--accent-color)' : 'inherit'};">
          ${day}
        </span>
        <div class="calendar-day-tasks-container mt-1 d-flex flex-column gap-1" style="max-height:60px; overflow-y:auto;"></div>
      `;

      // Plot tasks due on this day
      const dayTasks = datedTasks.filter(t => t.dueDate.split('T')[0] === dayDateStr);
      const itemsContainer = col.querySelector('.calendar-day-tasks-container');
      dayTasks.forEach(task => {
        const item = document.createElement('div');
        item.style.fontSize = '9px';
        item.style.padding = '2px 4px';
        item.style.borderRadius = '4px';
        item.style.background = 'var(--accent-gradient)';
        item.style.color = 'white';
        item.style.textAlign = 'left';
        item.style.cursor = 'pointer';
        item.style.whiteSpace = 'nowrap';
        item.style.overflow = 'hidden';
        item.style.textOverflow = 'ellipsis';
        item.textContent = task.title;
        item.onclick = (e) => {
          e.stopPropagation();
          window.dispatchEvent(new CustomEvent('open-task-detail', { detail: { taskId: task._id } }));
        };
        itemsContainer.appendChild(item);
      });

      row.appendChild(col);
    }

    // Render trailing post month buffer days
    let nextMonthDay = 1;
    while (row.children.length < 7) {
      const col = document.createElement('div');
      col.className = 'col p-1 border border-secondary rounded-2';
      col.style.width = '14%';
      col.style.opacity = '0.2';
      col.innerHTML = `<span style="font-size:12px;">${nextMonthDay++}</span>`;
      row.appendChild(col);
    }
    gridBody.appendChild(row);
  },

  bindControls() {
    document.getElementById('calendar-prev-btn').onclick = () => {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1);
      this.renderMonthGrid();
    };

    document.getElementById('calendar-next-btn').onclick = () => {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1);
      this.renderMonthGrid();
    };

    document.getElementById('calendar-today-btn').onclick = () => {
      this.currentDate = new Date();
      this.renderMonthGrid();
    };
  }
};
