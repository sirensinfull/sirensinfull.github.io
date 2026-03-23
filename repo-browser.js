/* ============================================================
   SONG REPOSITORY BROWSER — Extension for SpeedReader
   Adds file browsing from Song_Repository/ to the speed reader
   ============================================================ */
class RepoBrowser {
  constructor(speedReader) {
    this.sr = speedReader;
    this.manifest = null;
    this.repoBase = 'Books';
    this.githubUser = 'sirensinfull';
    this.githubRepo = 'sirensinfull.github.io';
    this.container = document.getElementById('repoLibrary');
    this.tree = document.getElementById('repoTree');
    this.status = document.getElementById('repoStatus');
    this.searchInput = document.getElementById('repoSearch');

    // Toggle button
    document.getElementById('repoToggle')?.addEventListener('click', () => this.toggle());
    // Search
    this.searchInput?.addEventListener('input', () => this._filterTree(this.searchInput.value));

    // Auto-load manifest on first open
    this._loaded = false;
  }

  toggle() {
    if (!this.container) return;
    const visible = !this.container.classList.contains('hidden');
    this.container.classList.toggle('hidden', visible);
    if (!visible && !this._loaded) this.loadManifest();
  }

  async loadManifest() {
    this._setStatus('Loading library...');
    try {
      // Try manifest first
      const resp = await fetch(`./${this.repoBase}/manifest.json?_=${Date.now()}`);
      if (resp.ok) {
        this.manifest = await resp.json();
        this._loaded = true;
        this._renderTree();
        this._setStatus(`${this._countFiles()} documents`);
        return;
      }
    } catch (e) { /* fallback */ }

    // Fallback: GitHub API discovery
    try {
      await this._discoverFromAPI();
      this._loaded = true;
      this._renderTree();
      this._setStatus(`${this._countFiles()} documents (via API)`);
    } catch (e) {
      this._setStatus('Could not load library');
      console.warn('RepoBrowser: manifest and API both failed', e);
    }
  }

  async _discoverFromAPI() {
    const apiBase = `https://api.github.com/repos/${this.githubUser}/${this.githubRepo}/contents/${this.repoBase}`;
    const resp = await fetch(apiBase);
    if (!resp.ok) throw new Error('API failed');
    const entries = await resp.json();

    // Build manifest from API response
    this.manifest = { base_path: this.repoBase, categories: [] };
    const songFolders = [];
    const otherFolders = [];

    for (const entry of entries) {
      if (entry.type !== 'dir') continue;
      const folder = { id: entry.name, label: entry.name.replace(/_/g, ' '), files: [] };

      // Try to list files in folder
      try {
        const fResp = await fetch(entry.url);
        if (fResp.ok) {
          const fEntries = await fResp.json();
          folder.files = fEntries
            .filter(f => f.type === 'file' && /\.(md|txt|html)$/i.test(f.name))
            .map(f => ({ name: f.name, label: f.name.replace(/\.(md|txt|html)$/i, '').replace(/_/g, ' ') }));
        }
      } catch (e) { /* skip */ }

      if (/^\d+-/.test(entry.name)) {
        songFolders.push(folder);
      } else {
        otherFolders.push(folder);
      }
    }

    // Sort song folders numerically
    songFolders.sort((a, b) => {
      const na = parseInt(a.id) || 999;
      const nb = parseInt(b.id) || 999;
      return na - nb;
    });

    if (songFolders.length) {
      this.manifest.categories.push({ id: 'songs', label: 'Songs', folders: songFolders });
    }
    for (const f of otherFolders) {
      this.manifest.categories.push({ id: f.id, label: f.label, folders: [f] });
    }
  }

  _renderTree() {
    if (!this.tree || !this.manifest) return;
    this.tree.innerHTML = '';

    for (const cat of this.manifest.categories) {
      const catEl = document.createElement('div');
      catEl.className = 'repo-category';

      const catHeader = document.createElement('div');
      catHeader.className = 'repo-cat-header';
      catHeader.textContent = cat.label;
      catHeader.addEventListener('click', () => catEl.classList.toggle('expanded'));
      catEl.appendChild(catHeader);

      const catBody = document.createElement('div');
      catBody.className = 'repo-cat-body';

      for (const folder of cat.folders) {
        if (folder.files && folder.files.length > 0) {
          // Folder has known files — render them
          const folderEl = this._renderFolder(folder);
          catBody.appendChild(folderEl);
        } else {
          // Folder with no files listed — make it clickable to discover
          const folderEl = this._renderDiscoverableFolder(folder);
          catBody.appendChild(folderEl);
        }
      }

      catEl.appendChild(catBody);
      this.tree.appendChild(catEl);
    }
  }

  _renderFolder(folder) {
    const el = document.createElement('div');
    el.className = 'repo-folder';

    const header = document.createElement('div');
    header.className = 'repo-folder-header';
    header.innerHTML = `<span class="repo-folder-icon">📁</span> ${this._esc(folder.label)}`;
    header.addEventListener('click', () => el.classList.toggle('expanded'));
    el.appendChild(header);

    const body = document.createElement('div');
    body.className = 'repo-folder-body';

    for (const file of folder.files) {
      const fileEl = document.createElement('div');
      fileEl.className = 'repo-file';
      fileEl.dataset.path = `${this.repoBase}/${folder.id}/${file.name}`;
      fileEl.dataset.search = (folder.label + ' ' + file.label).toLowerCase();

      const icon = /\.html$/i.test(file.name) ? '🔬' : /\.txt$/i.test(file.name) ? '📝' : '📄';
      fileEl.innerHTML = `<span class="repo-file-icon">${icon}</span> ${this._esc(file.label)}`;
      fileEl.addEventListener('click', () => this._loadFile(fileEl.dataset.path, file.label));
      body.appendChild(fileEl);
    }

    el.appendChild(body);
    return el;
  }

  _renderDiscoverableFolder(folder) {
    const el = document.createElement('div');
    el.className = 'repo-folder';

    const header = document.createElement('div');
    header.className = 'repo-folder-header discoverable';
    header.innerHTML = `<span class="repo-folder-icon">📁</span> ${this._esc(folder.label)} <span class="repo-discover-hint">⟳</span>`;
    header.addEventListener('click', async () => {
      if (el.classList.contains('loaded')) {
        el.classList.toggle('expanded');
        return;
      }
      header.querySelector('.repo-discover-hint').textContent = '⏳';
      try {
        const files = await this._discoverFolder(folder.id);
        folder.files = files;
        const body = document.createElement('div');
        body.className = 'repo-folder-body';
        for (const file of files) {
          const fileEl = document.createElement('div');
          fileEl.className = 'repo-file';
          fileEl.dataset.path = `${this.repoBase}/${folder.id}/${file.name}`;
          fileEl.dataset.search = (folder.label + ' ' + file.label).toLowerCase();
          const icon = /\.html$/i.test(file.name) ? '🔬' : /\.txt$/i.test(file.name) ? '📝' : '📄';
          fileEl.innerHTML = `<span class="repo-file-icon">${icon}</span> ${this._esc(file.label)}`;
          fileEl.addEventListener('click', () => this._loadFile(fileEl.dataset.path, file.label));
          body.appendChild(fileEl);
        }
        el.appendChild(body);
        el.classList.add('loaded', 'expanded');
        header.querySelector('.repo-discover-hint').textContent = `(${files.length})`;
      } catch (e) {
        header.querySelector('.repo-discover-hint').textContent = '✕';
      }
    });

    el.appendChild(header);
    return el;
  }

  async _discoverFolder(folderId) {
    const url = `https://api.github.com/repos/${this.githubUser}/${this.githubRepo}/contents/${this.repoBase}/${folderId}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('API error');
    const entries = await resp.json();
    return entries
      .filter(f => f.type === 'file' && /\.(md|txt|html)$/i.test(f.name))
      .map(f => ({ name: f.name, label: f.name.replace(/\.(md|txt|html)$/i, '').replace(/_/g, ' ') }));
  }

  async _loadFile(path, label) {
    this._setStatus(`Loading: ${label}...`);
    try {
      const resp = await fetch(`./${path}?_=${Date.now()}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const text = await resp.text();

      // Load into speedreader textarea
      if (this.sr.input) {
        this.sr.input.value = text;
      }

      this._setStatus(`Loaded: ${label} (${text.split(/\s+/).length} words)`);

      // Mark active
      this.tree.querySelectorAll('.repo-file.active').forEach(el => el.classList.remove('active'));
      const activeEl = this.tree.querySelector(`[data-path="${CSS.escape(path)}"]`);
      if (activeEl) activeEl.classList.add('active');

    } catch (e) {
      this._setStatus(`Error loading ${label}`);
      console.error('RepoBrowser load error:', e);
    }
  }

  _filterTree(query) {
    const q = (query || '').toLowerCase().trim();
    this.tree.querySelectorAll('.repo-file').forEach(el => {
      const match = !q || (el.dataset.search || '').includes(q);
      el.style.display = match ? '' : 'none';
    });
    // Auto-expand categories/folders with matches
    if (q) {
      this.tree.querySelectorAll('.repo-category, .repo-folder').forEach(el => {
        const hasVisible = el.querySelector('.repo-file:not([style*="display: none"])');
        el.classList.toggle('expanded', !!hasVisible);
      });
    }
  }

  _countFiles() {
    if (!this.manifest) return 0;
    let count = 0;
    for (const cat of this.manifest.categories) {
      for (const folder of cat.folders) {
        count += (folder.files || []).length;
      }
    }
    return count;
  }

  _setStatus(msg) {
    if (this.status) this.status.textContent = msg;
  }

  _esc(s) {
    return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}
