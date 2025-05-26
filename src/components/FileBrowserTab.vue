<template>
  <div class="file-browser-tab">
    <div class="browser-header">
      <h2 class="tab-title">
        <FolderIcon class="title-icon" />
        FTP File Browser
      </h2>
      <div class="browser-controls">
        <div class="path-display">
          <HomeIcon class="path-icon" />
          <span class="path-label">Path:</span>
          <span class="current-path">{{ currentPath }}</span>
        </div>
        <div class="control-buttons">
          <button @click="$emit('refresh')" class="control-btn" :disabled="loading">
            <ArrowPathIcon class="btn-icon" :class="{ spinning: loading }" />
            {{ loading ? 'Loading...' : 'Refresh' }}
          </button>
          <button @click="$emit('navigate-up')" class="control-btn" :disabled="isRootPath">
            <ArrowUpIcon class="btn-icon" />
            Up Directory
          </button>
        </div>
      </div>
    </div>

    <div class="file-list-container">
      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <span class="loading-text">{{ loadingMessage }}</span>
      </div>
      
      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <ExclamationTriangleIcon class="error-icon" />
        <div class="error-content">
          <h3 class="error-title">Failed to load files</h3>
          <p class="error-message">{{ error }}</p>
          <button @click="$emit('refresh')" class="retry-btn">
            <ArrowPathIcon class="btn-icon" />
            Retry
          </button>
        </div>
      </div>
      
      <!-- File List -->
      <div v-else class="file-list">
        <div class="file-list-header">
          <div class="header-name">
            <DocumentIcon class="header-icon" />
            Name
          </div>
          <div class="header-size">Size</div>
          <div class="header-modified">Modified</div>
          <div class="header-actions">Actions</div>
        </div>
        
        <div 
          v-for="(file, index) in files" 
          :key="index"
          :class="['file-item', { 
            selected: selectedFile === file,
            folder: file.type === 'folder'
          }]"
          @click="$emit('select-file', file)"
          @dblclick="$emit('double-click', file)"
        >
          <div class="file-info">
            <div class="file-icon">
              <component :is="getFileIcon(file)" class="icon" />
            </div>
            <div class="file-name" :title="file.name">{{ file.name }}</div>
          </div>
          <div class="file-size">{{ formatFileSize(file.size) }}</div>
          <div class="file-modified">{{ formatDate(file.modified) }}</div>
          <div class="file-actions">
            <button 
              v-if="file.type !== 'folder'" 
              @click.stop="$emit('download-file', file)"
              class="action-btn download"
              :disabled="downloading === file.name"
              :title="downloading === file.name ? 'Downloading...' : 'Download file'"
            >
              <ArrowDownTrayIcon v-if="downloading !== file.name" class="action-icon" />
              <div v-else class="mini-spinner"></div>
            </button>
            <button 
              v-if="file.type === 'folder'" 
              @click.stop="$emit('navigate-to-folder', file)"
              class="action-btn open"
              title="Open folder"
            >
              <FolderOpenIcon class="action-icon" />
            </button>
          </div>
        </div>
        
        <div v-if="files.length === 0" class="empty-directory">
          <FolderIcon class="empty-icon" />
          <h3 class="empty-title">Empty Directory</h3>
          <p class="empty-message">This directory contains no files</p>
        </div>
      </div>
    </div>

    <!-- File Details Panel -->
    <div v-if="selectedFile" class="file-details">
      <div class="details-header">
        <component :is="getFileIcon(selectedFile)" class="details-icon" />
        <h4 class="details-title">File Details</h4>
      </div>
      <div class="details-grid">
        <div class="detail-item">
          <span class="detail-label">Name</span>
          <span class="detail-value">{{ selectedFile.name }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Type</span>
          <span class="detail-value">{{ getFileType(selectedFile) }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Size</span>
          <span class="detail-value">{{ formatFileSize(selectedFile.size) }}</span>
        </div>
        <div class="detail-item" v-if="selectedFile.modified">
          <span class="detail-label">Modified</span>
          <span class="detail-value">{{ formatDate(selectedFile.modified) }}</span>
        </div>
        <div class="detail-item" v-if="selectedFile.type !== 'folder'">
          <span class="detail-label">Download</span>
          <button 
            @click="$emit('download-file', selectedFile)"
            class="download-btn"
            :disabled="downloading === selectedFile.name"
          >
            <ArrowDownTrayIcon v-if="downloading !== selectedFile.name" class="btn-icon" />
            <div v-else class="loading-spinner small"></div>
            {{ downloading === selectedFile.name ? 'Downloading...' : 'Download File' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {
  FolderIcon,
  FolderOpenIcon,
  DocumentIcon,
  HomeIcon,
  ArrowPathIcon,
  ArrowUpIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  VideoCameraIcon,
  FilmIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon
} from '@heroicons/vue/24/outline'

export default {
  name: 'FileBrowserTab',
  components: {
    FolderIcon,
    FolderOpenIcon,
    DocumentIcon,
    HomeIcon,
    ArrowPathIcon,
    ArrowUpIcon,
    ArrowDownTrayIcon,
    ExclamationTriangleIcon,
    VideoCameraIcon,
    FilmIcon,
    DocumentTextIcon,
    ClipboardDocumentListIcon
  },
  props: {
    currentPath: {
      type: String,
      required: true
    },
    files: {
      type: Array,
      required: true
    },
    selectedFile: {
      type: Object,
      default: null
    },
    loading: {
      type: Boolean,
      default: false
    },
    loadingMessage: {
      type: String,
      default: 'Loading files...'
    },
    error: {
      type: String,
      default: null
    },
    downloading: {
      type: String,
      default: null
    },
    isRootPath: {
      type: Boolean,
      default: false
    }
  },
  emits: ['refresh', 'navigate-up', 'select-file', 'double-click', 'download-file', 'navigate-to-folder'],
  methods: {
    getFileIcon(file) {
      if (file.type === 'folder') return FolderIcon
      
      const ext = file.name.split('.').pop()?.toLowerCase()
      switch (ext) {
        case 'm3u8': return VideoCameraIcon
        case 'ts': return FilmIcon
        case 'mp4': return FilmIcon
        case 'txt': return DocumentTextIcon
        case 'log': return ClipboardDocumentListIcon
        default: return DocumentIcon
      }
    },
    
    getFileType(file) {
      if (file.type === 'folder') return 'Folder'
      
      const ext = file.name.split('.').pop()?.toLowerCase()
      switch (ext) {
        case 'm3u8': return 'HLS Playlist'
        case 'ts': return 'Transport Stream'
        case 'mp4': return 'MP4 Video'
        case 'txt': return 'Text File'
        case 'log': return 'Log File'
        default: return 'File'
      }
    },
    
    formatFileSize(bytes) {
      if (!bytes || bytes === 0) return '0 B'
      
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },
    
    formatDate(dateString) {
      if (!dateString) return 'Unknown'
      
      try {
        return new Date(dateString).toLocaleString()
      } catch (error) {
        return 'Invalid Date'
      }
    }
  }
}
</script>

<style scoped>
.file-browser-tab {
  padding: 1.5rem;
}

.browser-header {
  margin-bottom: 2rem;
}

.tab-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 1.5rem 0;
}

.title-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--accent-color);
}

.browser-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
}

.path-display {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}

.path-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--accent-color);
  flex-shrink: 0;
}

.path-label {
  font-weight: 600;
  color: var(--text-secondary);
  white-space: nowrap;
}

.current-path {
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  background: var(--glass-subtle);
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  border: 1px solid var(--glass-border);
  color: var(--text-color);
  font-size: 0.875rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  flex: 1;
}

.control-buttons {
  display: flex;
  gap: 0.75rem;
}

.control-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--glass-subtle);
  color: var(--text-color);
  border: 1px solid var(--glass-border);
  border-radius: 10px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
}

.control-btn:hover:not(:disabled) {
  background: var(--glass-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(255, 255, 255, 0.1);
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-icon {
  width: 1rem;
  height: 1rem;
}

.btn-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.file-list-container {
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  min-height: 400px;
  overflow: hidden;
  margin-bottom: 2rem;
}

.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;
}

.loading-spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 3px solid var(--glass-border);
  border-top: 3px solid var(--accent-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.loading-spinner.small {
  width: 1rem;
  height: 1rem;
  border-width: 2px;
  margin: 0;
}

.loading-text {
  color: var(--text-secondary);
  font-weight: 500;
}

.error-icon {
  width: 3rem;
  height: 3rem;
  color: var(--danger-color);
  margin-bottom: 1rem;
}

.error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.error-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.error-message {
  color: var(--text-secondary);
  margin: 0;
}

.retry-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--accent-color);
  color: var(--primary-color);
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.retry-btn:hover {
  background: var(--accent-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 255, 136, 0.4);
}

.file-list-header {
  display: grid;
  grid-template-columns: 1fr 100px 150px 80px;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: var(--glass-subtle);
  border-bottom: 1px solid var(--glass-border);
  font-weight: 600;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.header-name {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.header-icon {
  width: 1rem;
  height: 1rem;
}

.file-item {
  display: grid;
  grid-template-columns: 1fr 100px 150px 80px;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--glass-border);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.file-item:hover {
  background: var(--glass-subtle);
}

.file-item.selected {
  background: rgba(0, 255, 136, 0.1);
  border-color: rgba(0, 255, 136, 0.3);
}

.file-item.folder {
  font-weight: 500;
}

.file-item:last-child {
  border-bottom: none;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.file-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
}

.file-icon .icon {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--accent-color);
}

.file-item.folder .file-icon .icon {
  color: var(--warning-color);
}

.file-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-color);
  font-weight: 500;
}

.file-size, .file-modified {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
}

.file-actions {
  display: flex;
  justify-content: center;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.action-btn.download {
  background: var(--info-color);
  color: white;
}

.action-btn.download:hover:not(:disabled) {
  background: #2563eb;
  transform: scale(1.1);
}

.action-btn.open {
  background: var(--warning-color);
  color: white;
}

.action-btn.open:hover {
  background: #d97706;
  transform: scale(1.1);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.action-icon {
  width: 1rem;
  height: 1rem;
}

.mini-spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.empty-directory {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.empty-icon {
  width: 4rem;
  height: 4rem;
  color: var(--text-muted);
  margin-bottom: 1.5rem;
  opacity: 0.5;
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 0.5rem 0;
}

.empty-message {
  color: var(--text-secondary);
  margin: 0;
}

.file-details {
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  padding: 1.5rem;
}

.details-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--glass-border);
}

.details-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--accent-color);
}

.details-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-label {
  font-weight: 600;
  color: var(--text-secondary);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.detail-value {
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  background: var(--glass-subtle);
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid var(--glass-border);
  color: var(--text-color);
  font-size: 0.875rem;
  word-break: break-all;
}

.download-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--accent-color);
  color: var(--primary-color);
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.download-btn:hover:not(:disabled) {
  background: var(--accent-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 255, 136, 0.4);
}

.download-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .browser-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .control-buttons {
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .file-browser-tab {
    padding: 1rem;
  }
  
  .file-list-header,
  .file-item {
    grid-template-columns: 1fr 60px;
    gap: 0.5rem;
  }
  
  .file-size,
  .file-modified {
    display: none;
  }
  
  .details-grid {
    grid-template-columns: 1fr;
  }
  
  .current-path {
    font-size: 0.75rem;
  }
}
</style> 