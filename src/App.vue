<template>
  <div class="container">
    <div class="header">
      <h1>Camera Stream Manager</h1>
      <div class="tab-navigation">
        <button 
          @click="activeTab = 'streaming'" 
          :class="['tab-btn', { active: activeTab === 'streaming' }]"
        >
          Live Streaming
        </button>
        <button 
          @click="activeTab = 'files'" 
          :class="['tab-btn', { active: activeTab === 'files' }]"
        >
          FTP File Browser
        </button>
      </div>
    </div>

    <!-- Streaming Tab -->
    <div v-show="activeTab === 'streaming'" class="tab-content">
      <div class="controls">
        <button @click="addCamera" class="btn">Add Camera</button>
        <button @click="removeCamera" class="btn">Remove Camera</button>
      </div>
      <div class="camera-grid">
        <div v-for="(camera, index) in cameras" :key="index" class="camera-container">
          <div class="stream-input">
            <input 
              v-model="camera.streamName" 
              type="text" 
              placeholder="Enter stream name (e.g., cam1)"
            >
            <button @click="connectStream(index)" class="btn">Connect</button>
          </div>
          <video 
            :id="'video-' + index" 
            autoplay 
            controls
          ></video>
          <div class="camera-label">Camera {{ index + 1 }}</div>
        </div>
      </div>
    </div>

    <!-- FTP File Browser Tab -->
    <div v-show="activeTab === 'files'" class="tab-content">
      <div class="ftp-browser">
        <div class="ftp-header">
          <h3>FTP File Browser - HLS Directory</h3>
          <div class="ftp-controls">
            <div class="path-display">
              <span class="path-label">Path:</span>
              <span class="current-path">{{ currentPath }}</span>
            </div>
            <div class="control-buttons">
              <button @click="refreshFiles" class="btn" :disabled="loading">
                {{ loading ? 'Loading...' : 'Refresh' }}
              </button>
              <button @click="navigateUp" class="btn" :disabled="isRootPath">
                Up Directory
              </button>
            </div>
          </div>
        </div>

        <div class="file-list-container">
          <div v-if="loading" class="loading-state">
            <div class="spinner"></div>
            <span>{{ loadingMessage }}</span>
          </div>
          
          <div v-else-if="error" class="error-state">
            <div class="error-icon">⚠️</div>
            <div class="error-message">{{ error }}</div>
            <button @click="refreshFiles" class="btn">Retry</button>
          </div>
          
          <div v-else class="file-list">
            <div class="file-list-header">
              <div class="header-name">Name</div>
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
              @click="selectFile(file)"
              @dblclick="handleDoubleClick(file)"
            >
              <div class="file-info">
                <div class="file-icon">
                  {{ getFileIcon(file) }}
                </div>
                <div class="file-name" :title="file.name">{{ file.name }}</div>
              </div>
              <div class="file-size">{{ formatFileSize(file.size) }}</div>
              <div class="file-modified">{{ formatDate(file.modified) }}</div>
              <div class="file-actions">
                <button 
                  v-if="file.type !== 'folder'" 
                  @click.stop="downloadFile(file)"
                  class="btn-small download-btn"
                  :disabled="downloading === file.name"
                >
                  {{ downloading === file.name ? 'Downloading...' : 'Download' }}
                </button>
                <button 
                  v-if="file.type === 'folder'" 
                  @click.stop="navigateToFolder(file)"
                  class="btn-small"
                >
                  Open
                </button>
              </div>
            </div>
            
            <div v-if="files.length === 0" class="empty-directory">
              <div class="empty-icon">📁</div>
              <div class="empty-message">This directory is empty</div>
            </div>
          </div>
        </div>

        <div class="file-details" v-if="selectedFile">
          <h4>File Details</h4>
          <div class="details-grid">
            <div class="detail-item">
              <span class="detail-label">Name:</span>
              <span class="detail-value">{{ selectedFile.name }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Type:</span>
              <span class="detail-value">{{ getFileType(selectedFile) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Size:</span>
              <span class="detail-value">{{ formatFileSize(selectedFile.size) }}</span>
            </div>
            <div class="detail-item" v-if="selectedFile.modified">
              <span class="detail-label">Modified:</span>
              <span class="detail-value">{{ formatDate(selectedFile.modified) }}</span>
            </div>
            <div class="detail-item" v-if="selectedFile.type !== 'folder'">
              <span class="detail-label">Download:</span>
              <button 
                @click="downloadFile(selectedFile)"
                class="btn download-btn"
                :disabled="downloading === selectedFile.name"
              >
                {{ downloading === selectedFile.name ? 'Downloading...' : 'Download File' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Hls from 'hls.js'

export default {
  name: 'App',
  data() {
    return {
      activeTab: 'streaming',
      cameras: [
        { streamName: 'cam1', hls: null }
      ],
      // FTP Browser data
      currentPath: '/data/hls',
      files: [],
      selectedFile: null,
      loading: false,
      loadingMessage: '',
      error: null,
      downloading: null
    }
  },
  computed: {
    isRootPath() {
      return this.currentPath === '/data/hls'
    }
  },
  mounted() {
    this.refreshFiles()
  },
  methods: {
    addCamera() {
      this.cameras.push({ 
        streamName: `cam${this.cameras.length + 1}`,
        hls: null
      })
    },
    removeCamera() {
      if (this.cameras.length > 1) {
        const lastCamera = this.cameras.pop()
        if (lastCamera.hls) {
          lastCamera.hls.destroy()
        }
      }
    },
    connectStream(index) {
      const camera = this.cameras[index]
      const video = document.getElementById(`video-${index}`)
      
      if (!video) return

      // Destroy existing HLS instance if any
      if (camera.hls) {
        camera.hls.destroy()
      }

      const streamHost = window.location.hostname

      if (Hls.isSupported()) {
        camera.hls = new Hls()
        camera.hls.loadSource(`http://${streamHost}:8080/hls/${camera.streamName}.m3u8`)
        camera.hls.attachMedia(video)
        camera.hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play()
        })
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = `http://${streamHost}:8080/hls/${camera.streamName}.m3u8`
        video.addEventListener('loadedmetadata', () => {
          video.play()
        })
      }
    },
    
    // FTP Browser methods
    async refreshFiles() {
      this.loading = true
      this.loadingMessage = 'Loading directory contents...'
      this.error = null
      
      try {
        await this.listFiles()
      } catch (error) {
        this.error = 'Failed to load directory: ' + error.message
        console.error('Error loading files:', error)
      } finally {
        this.loading = false
      }
    },
    
    async listFiles() {
      try {
        // Convert current path to URL path for nginx autoindex
        const urlPath = this.currentPath.replace('/data/', '')
        const response = await fetch(`/${urlPath}/`)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const html = await response.text()
        this.parseDirectoryListing(html)
        
      } catch (error) {
        // If directory listing fails, show empty directory
        this.files = []
        throw error
      }
    },
    
    parseDirectoryListing(html) {
      const files = []
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')
      
      // Look for both <a> tags and <pre> content (nginx autoindex format)
      const links = doc.querySelectorAll('a')
      
      links.forEach(link => {
        const href = link.getAttribute('href')
        if (href && href !== '../' && !href.startsWith('/') && !href.startsWith('http')) {
          const isFolder = href.endsWith('/')
          const name = isFolder ? href.slice(0, -1) : href
          
          // Try to extract file info from the parent row
          const parentRow = link.closest('tr') || link.parentElement
          const rowText = parentRow?.textContent || ''
          
          // Extract size - look for patterns like "1.2M", "345K", "1234", etc.
          let size = 'Unknown'
          let modified = null
          
          if (parentRow) {
            // Try to find size in various formats
            const sizeMatch = rowText.match(/(\d+(?:\.\d+)?[KMGTB]+|\d+\s*bytes?)/i)
            if (sizeMatch) {
              size = sizeMatch[1]
            }
            
            // Try to extract date/time
            const dateMatch = rowText.match(/(\d{2}-\w{3}-\d{4}\s+\d{2}:\d{2}|\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})/i)
            if (dateMatch) {
              modified = dateMatch[1]
            }
          }
          
          // Skip hidden files and system files
          if (!name.startsWith('.') && name !== 'index.html') {
            files.push({
              name: name,
              type: isFolder ? 'folder' : 'file',
              size: isFolder ? '-' : size,
              modified: modified,
              url: `${window.location.origin}${this.currentPath}/${name}`.replace(/\/+/g, '/')
            })
          }
        }
      })
      
      // Sort files: folders first, then files, both alphabetically
      files.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1
        }
        return a.name.localeCompare(b.name)
      })
      
      this.files = files
    },
    
    selectFile(file) {
      this.selectedFile = file
    },
    
    handleDoubleClick(file) {
      if (file.type === 'folder') {
        this.navigateToFolder(file)
      } else {
        this.downloadFile(file)
      }
    },
    
    navigateToFolder(folder) {
      // Ensure proper path construction
      let newPath = this.currentPath
      if (!newPath.endsWith('/')) {
        newPath += '/'
      }
      newPath += folder.name
      
      this.currentPath = newPath.replace(/\/+/g, '/')
      this.selectedFile = null
      this.refreshFiles()
    },
    
    navigateUp() {
      if (!this.isRootPath) {
        const pathParts = this.currentPath.split('/').filter(p => p)
        pathParts.pop()
        this.currentPath = '/' + pathParts.join('/')
        
        // Ensure we don't go above the root HLS directory
        if (!this.currentPath.startsWith('/data/hls')) {
          this.currentPath = '/data/hls'
        }
        
        this.selectedFile = null
        this.refreshFiles()
      }
    },
    
    async downloadFile(file) {
      if (this.downloading === file.name) return
      
      this.downloading = file.name
      
      try {
        const downloadUrl = file.url || `${window.location.origin}${this.currentPath}/${file.name}`
        
        // Create a temporary link element and trigger download
        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = file.name
        link.style.display = 'none'
        
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
      } catch (error) {
        console.error('Download failed:', error)
        this.error = 'Download failed: ' + error.message
      } finally {
        this.downloading = null
      }
    },
    
    getFileIcon(file) {
      if (file.type === 'folder') return '📁'
      
      const ext = file.name.split('.').pop()?.toLowerCase()
      switch (ext) {
        case 'm3u8': return '📺'
        case 'ts': return '🎬'
        case 'mp4': return '🎥'
        case 'avi': case 'mov': case 'mkv': case 'webm': return '🎞️'
        case 'txt': case 'log': return '📄'
        case 'json': return '📋'
        default: return '📄'
      }
    },
    
    getFileType(file) {
      if (file.type === 'folder') return 'Folder'
      
      const ext = file.name.split('.').pop()?.toLowerCase()
      switch (ext) {
        case 'm3u8': return 'HLS Playlist'
        case 'ts': return 'Transport Stream'
        case 'mp4': return 'MP4 Video'
        case 'avi': return 'AVI Video'
        case 'mov': return 'QuickTime Video'
        case 'mkv': return 'Matroska Video'
        case 'webm': return 'WebM Video'
        case 'txt': return 'Text File'
        case 'log': return 'Log File'
        case 'json': return 'JSON File'
        default: return 'File'
      }
    },
    
    formatFileSize(size) {
      if (!size || size === '-' || size === 'Unknown') return size || '-'
      
      // If size is already formatted, return as is
      if (typeof size === 'string' && /[KMGT]B?$/i.test(size)) {
        return size
      }
      
      // Convert bytes to human readable format
      const bytes = parseInt(size)
      if (isNaN(bytes)) return size
      
      const units = ['B', 'KB', 'MB', 'GB', 'TB']
      let unitIndex = 0
      let fileSize = bytes
      
      while (fileSize >= 1024 && unitIndex < units.length - 1) {
        fileSize /= 1024
        unitIndex++
      }
      
      return `${fileSize.toFixed(1)} ${units[unitIndex]}`
    },
    
    formatDate(date) {
      if (!date) return '-'
      
      try {
        return new Date(date).toLocaleString()
      } catch {
        return date
      }
    }
  },
  
  beforeUnmount() {
    // Clean up HLS instances
    this.cameras.forEach(camera => {
      if (camera.hls) {
        camera.hls.destroy()
      }
    })
  }
}
</script>

<style>
@import './assets/styles.css';

/* FTP Browser specific styles */
.ftp-browser {
  padding: 20px;
}

.ftp-header {
  margin-bottom: 20px;
  border-bottom: 2px solid #333;
  padding-bottom: 15px;
}

.ftp-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

.path-display {
  display: flex;
  align-items: center;
  gap: 10px;
}

.path-label {
  font-weight: bold;
  color: #666;
}

.current-path {
  font-family: monospace;
  background: #f5f5f5;
  padding: 5px 10px;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.control-buttons {
  display: flex;
  gap: 10px;
}

.file-list-container {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  min-height: 400px;
}

.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.file-list-header {
  display: grid;
  grid-template-columns: 1fr 100px 150px 120px;
  gap: 15px;
  padding: 15px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #ddd;
  font-weight: bold;
  color: #666;
}

.file-item {
  display: grid;
  grid-template-columns: 1fr 100px 150px 120px;
  gap: 15px;
  padding: 12px 20px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background-color 0.2s;
}

.file-item:hover {
  background-color: #f8f9fa;
}

.file-item.selected {
  background-color: #e3f2fd;
}

.file-item.folder {
  font-weight: 500;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.file-icon {
  font-size: 18px;
  width: 24px;
  text-align: center;
}

.file-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size, .file-modified {
  font-size: 14px;
  color: #666;
}

.file-actions {
  display: flex;
  gap: 5px;
}

.btn-small {
  padding: 4px 8px;
  font-size: 12px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-small:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #007bff;
}

.btn-small:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.download-btn {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.download-btn:hover:not(:disabled) {
  background: #0056b3;
}

.empty-directory {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #666;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 15px;
  opacity: 0.5;
}

.empty-message {
  font-size: 18px;
}

.file-details {
  margin-top: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #ddd;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.detail-label {
  font-weight: bold;
  color: #666;
  font-size: 14px;
}

.detail-value {
  font-family: monospace;
  background: white;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ddd;
}
</style> 