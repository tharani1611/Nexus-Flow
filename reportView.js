import { state } from '../state.js';
import { api } from '../api.js';
import { showToast } from '../app.js';

export const reportView = {
  async render(container) {
    if (!state.currentWorkspace) {
      container.innerHTML = `
        <div class="glass-card p-5 text-center my-auto">
          <i class="bi bi-file-earmark-bar-graph" style="font-size: 40px; color: var(--text-secondary);"></i>
          <h5 class="mt-3">No Workspace Selected</h5>
          <p style="color:var(--text-secondary);">Select a workspace to generate reports.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="row g-4">
        <!-- Generate Report Section -->
        <div class="col-md-5">
          <div class="glass-card p-4 d-flex flex-column gap-4">
            <h5 style="font-weight:600; margin:0;">Generate Report</h5>

            <div style="display:flex; flex-direction:column; gap:16px;">
              <div>
                <label class="form-label" style="font-size:12px; color:var(--text-secondary);">Report Name</label>
                <input type="text" class="form-control bg-dark text-light border-secondary" id="report-name-input" placeholder="Monthly Progress Report - June 2026">
              </div>
              <div>
                <label class="form-label" style="font-size:12px; color:var(--text-secondary);">Export Format</label>
                <div class="d-flex gap-3 mt-1">
                  <div class="form-check">
                    <input class="form-check-input" type="radio" name="report-format" id="format-pdf" value="PDF" checked>
                    <label class="form-check-label d-flex align-items-center gap-2" for="format-pdf" style="font-size:14px; cursor:pointer;">
                      <i class="bi bi-file-earmark-pdf-fill text-danger"></i> PDF Document
                    </label>
                  </div>
                  <div class="form-check">
                    <input class="form-check-input" type="radio" name="report-format" id="format-excel" value="Excel">
                    <label class="form-check-label d-flex align-items-center gap-2" for="format-excel" style="font-size:14px; cursor:pointer;">
                      <i class="bi bi-file-earmark-spreadsheet-fill text-success"></i> Excel Spreadsheet
                    </label>
                  </div>
                </div>
              </div>

              <!-- Report preview summary box -->
              <div style="background:rgba(99,102,241,0.05); border:1px solid rgba(99,102,241,0.15); border-radius:12px; padding:16px;">
                <h6 style="font-weight:600; font-size:12px; color:var(--accent-color); margin-bottom:10px;">REPORT WILL INCLUDE</h6>
                <ul style="font-size:12px; color:var(--text-secondary); margin:0; padding-left:16px; line-height:1.8;">
                  <li>All workspace projects summary</li>
                  <li>Task status breakdown analysis</li>
                  <li>Priority distribution metrics</li>
                  <li>Sprint progress tracking</li>
                  <li>Team assignments and assignments count</li>
                  <li>Task completion rate statistics</li>
                </ul>
              </div>

              <button class="btn btn-indigo w-100 py-3" id="generate-report-btn" style="background:var(--accent-gradient); border:none; color:white; font-weight:600; font-size:15px;">
                <i class="bi bi-download"></i> Generate & Download Report
              </button>

              <!-- Loading state -->
              <div id="report-generating-indicator" style="display:none; text-align:center; padding:12px;">
                <div class="spinner-border spinner-border-sm text-primary me-2"></div>
                <span style="font-size:13px; color:var(--text-secondary);">Generating report, please wait...</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Reports History List -->
        <div class="col-md-7">
          <div class="glass-card p-4 d-flex flex-column gap-3">
            <div class="d-flex justify-content-between align-items-center">
              <h5 style="font-weight:600; margin:0;">Report History</h5>
              <button class="btn btn-sm btn-outline-light" id="refresh-reports-btn"><i class="bi bi-arrow-clockwise"></i> Refresh</button>
            </div>

            <div style="display:flex; flex-direction:column; gap:10px; max-height:500px; overflow-y:auto;" id="reports-history-list">
              <span style="font-size:12px; color:var(--text-secondary); text-align:center;">Loading reports...</span>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
    await this.fetchReportsHistory();
  },

  async fetchReportsHistory() {
    const list = document.getElementById('reports-history-list');
    if (!list) return;

    try {
      const reports = await api.get(`/reports/workspace/${state.currentWorkspace._id}`);

      if (reports.length === 0) {
        list.innerHTML = `
          <div class="text-center py-4">
            <i class="bi bi-file-earmark-bar-graph" style="font-size:36px; color:var(--text-secondary);"></i>
            <p style="font-size:13px; color:var(--text-secondary); margin-top:12px;">No reports generated yet. Create your first report using the form on the left.</p>
          </div>
        `;
        return;
      }

      list.innerHTML = '';
      reports.forEach(r => {
        const isPDF = r.format === 'PDF';
        const div = document.createElement('div');
        div.className = 'd-flex align-items-center justify-content-between p-3 rounded-3';
        div.style.background = 'rgba(255,255,255,0.02)';
        div.style.border = '1px solid rgba(255,255,255,0.06)';
        div.style.transition = 'all 0.2s ease';
        div.innerHTML = `
          <div class="d-flex align-items-center gap-3">
            <div style="width:42px; height:42px; border-radius:10px; background:${isPDF ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)'}; border:1px solid ${isPDF ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
              <i class="bi ${isPDF ? 'bi-file-earmark-pdf-fill text-danger' : 'bi-file-earmark-spreadsheet-fill text-success'}" style="font-size:18px;"></i>
            </div>
            <div>
              <div style="font-weight:600; font-size:14px;">${r.name}</div>
              <div style="font-size:11px; color:var(--text-secondary); margin-top:2px;">
                Generated by ${r.generatedBy ? r.generatedBy.name : 'Unknown'} · ${new Date(r.createdAt).toLocaleString()}
              </div>
            </div>
          </div>
          <a href="${r.url}" target="_blank" download class="btn btn-sm btn-outline-light d-flex align-items-center gap-1" style="flex-shrink:0;">
            <i class="bi bi-download"></i> Download
          </a>
        `;
        div.addEventListener('mouseenter', () => div.style.background = 'rgba(255,255,255,0.04)');
        div.addEventListener('mouseleave', () => div.style.background = 'rgba(255,255,255,0.02)');
        list.appendChild(div);
      });

    } catch (err) {
      list.innerHTML = `<p style="color:var(--danger-color); font-size:12px;">${err.message}</p>`;
    }
  },

  bindEvents() {
    document.getElementById('generate-report-btn').addEventListener('click', async () => {
      const name = document.getElementById('report-name-input').value || `Workspace_Report_${Date.now()}`;
      const format = document.querySelector('input[name="report-format"]:checked').value;

      const btn = document.getElementById('generate-report-btn');
      const indicator = document.getElementById('report-generating-indicator');

      btn.disabled = true;
      indicator.style.display = 'block';

      try {
        const report = await api.post(`/reports/workspace/${state.currentWorkspace._id}`, { name, format });
        showToast(`${format} report generated! Click Download to save.`);
        // Auto open download
        window.open(report.url, '_blank');
        await this.fetchReportsHistory();
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        btn.disabled = false;
        indicator.style.display = 'none';
      }
    });

    document.getElementById('refresh-reports-btn').addEventListener('click', () => {
      this.fetchReportsHistory();
    });
  }
};
