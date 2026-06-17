import { state } from '../state.js';
import { api } from '../api.js';
import { showToast } from '../app.js';

export const wikiView = {
  activeWiki: null,

  async render(container) {
    if (!state.currentWorkspace) {
      container.innerHTML = `
        <div class="glass-card p-5 text-center my-auto">
          <i class="bi bi-book" style="font-size: 40px; color: var(--text-secondary);"></i>
          <h5 class="mt-3">No Workspace Selected</h5>
          <p style="color:var(--text-secondary);">Select a workspace to access the knowledge base wiki.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="row g-4">
        <!-- Wiki Sidebar List -->
        <div class="col-md-4">
          <div class="glass-card p-4">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h5 style="font-weight:600; margin:0;">Knowledge Base</h5>
              <button class="btn btn-sm btn-indigo" id="create-wiki-btn" style="background:var(--accent-gradient); border:none; color:white;">+ New Page</button>
            </div>

            <!-- Search Bar -->
            <div class="mb-3">
              <input type="text" class="form-control bg-dark text-light border-secondary form-control-sm" id="wiki-search-input" placeholder="Search wiki pages...">
            </div>

            <div style="display:flex; flex-direction:column; gap:8px; max-height:500px; overflow-y:auto;" id="wiki-list-panel">
              <span style="font-size:12px; color:var(--text-secondary); text-align:center;">Loading wiki pages...</span>
            </div>
          </div>
        </div>

        <!-- Wiki Content Reading Area -->
        <div class="col-md-8">
          <div id="wiki-content-area">
            <div class="glass-card p-5 text-center h-100 d-flex flex-column align-items-center justify-content-center">
              <i class="bi bi-journal-text" style="font-size:48px; color:var(--text-secondary);"></i>
              <h5 class="mt-3" style="color:var(--text-secondary);">Select a page to read its content.</h5>
              <p style="color:var(--text-secondary); font-size:13px;">Create your first wiki article by clicking "+ New Page"</p>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
    await this.fetchWikis();
  },

  async fetchWikis(searchQuery = '') {
    const workspaceId = state.currentWorkspace._id;
    const listPanel = document.getElementById('wiki-list-panel');
    if (!listPanel) return;

    try {
      let wikis;
      if (searchQuery.trim()) {
        wikis = await api.get(`/wikis/workspace/${workspaceId}/search?query=${encodeURIComponent(searchQuery)}`);
      } else {
        wikis = await api.get(`/wikis/workspace/${workspaceId}`);
      }

      if (wikis.length === 0) {
        listPanel.innerHTML = `<span style="font-size:12px; color:var(--text-secondary); text-align:center;">No wiki pages found.</span>`;
        return;
      }

      listPanel.innerHTML = '';
      wikis.forEach(wiki => {
        const item = document.createElement('div');
        item.className = 'p-2 rounded-3 d-flex align-items-center gap-2';
        item.style.cursor = 'pointer';
        item.style.transition = 'all 0.2s ease';
        item.style.border = '1px solid transparent';
        item.innerHTML = `
          <i class="bi bi-file-text" style="font-size:14px; color:var(--accent-color); flex-shrink:0;"></i>
          <div style="flex:1; min-width:0;">
            <div style="font-size:13px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${wiki.title}</div>
            <div style="font-size:10px; color:var(--text-secondary);">v${wiki.version} · ${new Date(wiki.updatedAt).toLocaleDateString()}</div>
          </div>
        `;

        item.addEventListener('mouseenter', () => {
          item.style.background = 'var(--glass-hover)';
          item.style.borderColor = 'var(--glass-border)';
        });
        item.addEventListener('mouseleave', () => {
          item.style.background = 'transparent';
          item.style.borderColor = 'transparent';
        });

        item.addEventListener('click', () => {
          this.activeWiki = wiki;
          this.renderWikiContent(wiki);
        });

        listPanel.appendChild(item);
      });
    } catch (err) {
      listPanel.innerHTML = `<span style="font-size:12px; color:var(--danger-color);">Failed to load: ${err.message}</span>`;
    }
  },

  renderWikiContent(wiki) {
    const contentArea = document.getElementById('wiki-content-area');
    contentArea.innerHTML = `
      <div class="glass-card p-4 d-flex flex-column gap-3">
        <!-- Header -->
        <div class="d-flex justify-content-between align-items-start border-bottom pb-3">
          <div>
            <h4 style="font-weight:700; margin:0;">${wiki.title}</h4>
            <span style="font-size:11px; color:var(--text-secondary);">
              Version ${wiki.version} · Created by ${wiki.createdBy ? wiki.createdBy.name : 'Unknown'} · Last updated ${new Date(wiki.updatedAt).toLocaleString()}
            </span>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-outline-light" id="edit-wiki-btn"><i class="bi bi-pencil"></i> Edit</button>
            <button class="btn btn-sm btn-outline-danger" id="delete-wiki-btn"><i class="bi bi-trash"></i></button>
          </div>
        </div>

        <!-- Content rendering -->
        <div id="wiki-rendered-content" style="line-height:1.7; color:var(--text-primary); font-size:14px; white-space:pre-wrap; min-height:300px; max-height:500px; overflow-y:auto; padding:4px;">
          ${wiki.content}
        </div>
      </div>
    `;

    // Edit Wiki
    document.getElementById('edit-wiki-btn').onclick = () => {
      this.renderWikiEditor(wiki);
    };

    // Delete Wiki
    document.getElementById('delete-wiki-btn').onclick = async () => {
      if (confirm('Delete this wiki page? This cannot be undone.')) {
        try {
          await api.delete(`/wikis/${wiki._id}`);
          showToast('Wiki page deleted');
          document.getElementById('wiki-content-area').innerHTML = `
            <div class="glass-card p-5 text-center h-100 d-flex flex-column align-items-center justify-content-center">
              <i class="bi bi-journal-text" style="font-size:48px; color:var(--text-secondary);"></i>
              <h5 class="mt-3" style="color:var(--text-secondary);">Select a page to read its content.</h5>
            </div>
          `;
          this.fetchWikis();
        } catch (err) {
          showToast(err.message, 'error');
        }
      }
    };
  },

  renderWikiEditor(existingWiki = null) {
    const contentArea = document.getElementById('wiki-content-area');
    const isEdit = !!existingWiki;

    contentArea.innerHTML = `
      <div class="glass-card p-4 d-flex flex-column gap-3">
        <div class="d-flex justify-content-between align-items-center border-bottom pb-3">
          <h5 style="font-weight:600; margin:0;">${isEdit ? 'Edit Wiki Page' : 'Create New Wiki Page'}</h5>
          <button class="btn btn-sm btn-outline-secondary" id="cancel-wiki-editor-btn">Cancel</button>
        </div>

        <form id="wiki-editor-form" style="display:flex; flex-direction:column; gap:16px;">
          <div>
            <label class="form-label" style="font-size:12px; color:var(--text-secondary);">Page Title</label>
            <input type="text" class="form-control bg-dark text-light border-secondary" id="wiki-title-input" required value="${isEdit ? existingWiki.title : ''}" placeholder="e.g. API Integration Guide">
          </div>
          <div>
            <label class="form-label" style="font-size:12px; color:var(--text-secondary);">Content (Markdown supported)</label>
            <textarea class="form-control bg-dark text-light border-secondary" id="wiki-content-input" rows="14" style="resize:vertical; font-family:monospace; font-size:13px;" placeholder="# Heading&#10;&#10;Write your documentation here...">${isEdit ? existingWiki.content : ''}</textarea>
          </div>
          <div class="d-flex gap-3 justify-content-end">
            <button type="submit" class="btn btn-indigo px-4" style="background:var(--accent-gradient); border:none; color:white; font-weight:600;">${isEdit ? 'Save Changes' : 'Publish Page'}</button>
          </div>
        </form>
      </div>
    `;

    document.getElementById('cancel-wiki-editor-btn').onclick = () => {
      if (this.activeWiki) {
        this.renderWikiContent(this.activeWiki);
      } else {
        contentArea.innerHTML = `
          <div class="glass-card p-5 text-center h-100 d-flex flex-column align-items-center justify-content-center">
            <i class="bi bi-journal-text" style="font-size:48px; color:var(--text-secondary);"></i>
            <h5 class="mt-3" style="color:var(--text-secondary);">Select a page to read its content.</h5>
          </div>
        `;
      }
    };

    document.getElementById('wiki-editor-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('wiki-title-input').value;
      const content = document.getElementById('wiki-content-input').value;

      try {
        let saved;
        if (isEdit) {
          saved = await api.put(`/wikis/${existingWiki._id}`, { title, content });
          showToast('Wiki page updated!');
        } else {
          saved = await api.post(`/wikis/workspace/${state.currentWorkspace._id}`, { title, content });
          showToast('Wiki page published!');
        }
        this.activeWiki = saved;
        this.renderWikiContent(saved);
        this.fetchWikis();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  },

  bindEvents() {
    document.getElementById('create-wiki-btn').onclick = () => {
      this.activeWiki = null;
      this.renderWikiEditor();
    };

    let searchDebounce;
    document.getElementById('wiki-search-input').addEventListener('input', (e) => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        this.fetchWikis(e.target.value);
      }, 300);
    });
  }
};
