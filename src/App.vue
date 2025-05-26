<template>
  <div class="app">
    <!-- Login/Register Modal -->
    <div v-if="!isAuthenticated" class="auth-overlay">
      <div class="auth-modal">
        <h2>{{ authMode === 'login' ? 'Login' : 'Register' }}</h2>
        <form @submit.prevent="handleAuth">
          <div class="form-group">
            <label for="email">Email:</label>
            <input 
              id="email"
              v-model="authForm.email" 
              type="email" 
              required 
              placeholder="Enter your email"
            >
          </div>
          <div class="form-group">
            <label for="password">Password:</label>
            <input 
              id="password"
              v-model="authForm.password" 
              type="password" 
              required 
              placeholder="Enter your password"
            >
          </div>
          <div v-if="authError" class="error-message">{{ authError }}</div>
          <button type="submit" class="btn btn-primary" :disabled="authLoading">
            {{ authLoading ? 'Please wait...' : (authMode === 'login' ? 'Login' : 'Register') }}
          </button>
          <p class="auth-switch">
            {{ authMode === 'login' ? "Don't have an account?" : "Already have an account?" }}
            <a href="#" @click.prevent="toggleAuthMode">
              {{ authMode === 'login' ? 'Register' : 'Login' }}
            </a>
          </p>
        </form>
      </div>
    </div>

    <!-- Main Application -->
    <div v-else class="container">
      <div class="header">
        <h1>Camera Stream Manager</h1>
        <div class="user-info">
          <span>Welcome, {{ currentUser?.email }}</span>
          <button @click="logout" class="btn btn-logout">Logout</button>
        </div>
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
          <button 
            @click="activeTab = 'email'" 
            :class="['tab-btn', { active: activeTab === 'email' }]"
          >
            Email
            <span v-if="unreadCount > 0" class="unread-badge">{{ unreadCount }}</span>
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

      <!-- Email Tab -->
      <div v-show="activeTab === 'email'" class="tab-content">
        <div class="email-container">
          <div class="email-sidebar">
            <div class="email-nav">
              <button 
                @click="emailView = 'inbox'" 
                :class="['email-nav-btn', { active: emailView === 'inbox' }]"
              >
                Inbox
                <span v-if="unreadCount > 0" class="unread-badge">{{ unreadCount }}</span>
              </button>
              <button 
                @click="emailView = 'sent'" 
                :class="['email-nav-btn', { active: emailView === 'sent' }]"
              >
                Sent
              </button>
              <button 
                @click="emailView = 'compose'" 
                :class="['email-nav-btn', { active: emailView === 'compose' }]"
              >
                Compose
              </button>
            </div>
          </div>

          <div class="email-main">
            <!-- Inbox View -->
            <div v-if="emailView === 'inbox'" class="email-list">
              <h3>Inbox</h3>
              <div v-if="emailLoading" class="loading-state">
                <div class="spinner"></div>
                <span>Loading emails...</span>
              </div>
              <div v-else-if="inbox.length === 0" class="empty-state">
                <div class="empty-icon">📧</div>
                <div class="empty-message">No emails in your inbox</div>
              </div>
              <div v-else class="email-items">
                <div 
                  v-for="email in inbox" 
                  :key="email.id"
                  :class="['email-item', { unread: !email.is_read }]"
                  @click="selectEmail(email)"
                >
                  <div class="email-from">{{ email.from_email }}</div>
                  <div class="email-subject">{{ email.subject }}</div>
                  <div class="email-date">{{ formatEmailDate(email.received_at) }}</div>
                </div>
              </div>
            </div>

            <!-- Sent View -->
            <div v-if="emailView === 'sent'" class="email-list">
              <h3>Sent</h3>
              <div v-if="emailLoading" class="loading-state">
                <div class="spinner"></div>
                <span>Loading emails...</span>
              </div>
              <div v-else-if="sentEmails.length === 0" class="empty-state">
                <div class="empty-icon">📤</div>
                <div class="empty-message">No sent emails</div>
              </div>
              <div v-else class="email-items">
                <div 
                  v-for="email in sentEmails" 
                  :key="email.id"
                  class="email-item"
                  @click="selectEmail(email)"
                >
                  <div class="email-from">To: {{ email.to_email }}</div>
                  <div class="email-subject">{{ email.subject }}</div>
                  <div class="email-date">{{ formatEmailDate(email.sent_at) }}</div>
                </div>
              </div>
            </div>

            <!-- Compose View -->
            <div v-if="emailView === 'compose'" class="compose-email">
              <h3>Compose Email</h3>
              <form @submit.prevent="sendEmail">
                <div class="form-group">
                  <label for="email-to">To:</label>
                  <input 
                    id="email-to"
                    v-model="composeForm.to" 
                    type="email" 
                    required 
                    placeholder="recipient@example.com"
                    list="users-list"
                  >
                                     <datalist id="users-list">
                     <option v-for="user in users" :key="user.id" :value="user.email"></option>
                   </datalist>
                </div>
                <div class="form-group">
                  <label for="email-subject">Subject:</label>
                  <input 
                    id="email-subject"
                    v-model="composeForm.subject" 
                    type="text" 
                    required 
                    placeholder="Email subject"
                  >
                </div>
                <div class="form-group">
                  <label for="email-body">Message:</label>
                  <textarea 
                    id="email-body"
                    v-model="composeForm.body" 
                    required 
                    placeholder="Write your message here..."
                    rows="10"
                  ></textarea>
                </div>
                <div v-if="emailError" class="error-message">{{ emailError }}</div>
                <div class="form-actions">
                  <button type="submit" class="btn btn-primary" :disabled="emailSending">
                    {{ emailSending ? 'Sending...' : 'Send Email' }}
                  </button>
                  <button type="button" @click="clearCompose" class="btn btn-secondary">
                    Clear
                  </button>
                </div>
              </form>
            </div>
          </div>

          <!-- Email Detail View -->
          <div v-if="selectedEmail" class="email-detail">
            <div class="email-detail-header">
              <button @click="selectedEmail = null" class="btn btn-back">← Back</button>
              <h4>{{ selectedEmail.subject }}</h4>
            </div>
            <div class="email-meta">
              <div><strong>From:</strong> {{ selectedEmail.from_email || 'You' }}</div>
              <div><strong>To:</strong> {{ selectedEmail.to_email || currentUser?.email }}</div>
              <div><strong>Date:</strong> {{ formatEmailDate(selectedEmail.sent_at || selectedEmail.received_at) }}</div>
            </div>
            <div class="email-body">
              {{ selectedEmail.body }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Hls from 'hls.js'
import AuthService from './services/auth.js'
import EmailService from './services/email.js'

export default {
  name: 'App',
  data() {
    return {
      // Authentication
      isAuthenticated: false,
      currentUser: null,
      authMode: 'login',
      authForm: {
        email: '',
        password: ''
      },
      authError: '',
      authLoading: false,

      // Main app
      activeTab: 'streaming',
      
      // Streaming
      cameras: [
        { streamName: 'cam1', hls: null }
      ],
      
      // FTP Browser
      currentPath: '/data/hls',
      files: [],
      selectedFile: null,
      loading: false,
      loadingMessage: '',
      error: null,
      downloading: null,

      // Email
      emailView: 'inbox',
      inbox: [],
      sentEmails: [],
      selectedEmail: null,
      emailLoading: false,
      emailError: '',
      emailSending: false,
      users: [],
      composeForm: {
        to: '',
        subject: '',
        body: ''
      }
    }
  },
  computed: {
    isRootPath() {
      return this.currentPath === '/data/hls'
    },
    unreadCount() {
      return this.inbox.filter(email => !email.is_read).length
    }
  },
  async mounted() {
    this.checkAuthentication()
    if (this.isAuthenticated) {
      await this.initializeApp()
    }
  },
  methods: {
    // Authentication methods
    checkAuthentication() {
      this.isAuthenticated = AuthService.isAuthenticated()
      this.currentUser = AuthService.getUser()
    },

    async handleAuth() {
      this.authLoading = true
      this.authError = ''

      try {
        let result
        if (this.authMode === 'login') {
          result = await AuthService.login(this.authForm.email, this.authForm.password)
        } else {
          result = await AuthService.register(this.authForm.email, this.authForm.password)
        }

        if (result.success) {
          this.isAuthenticated = true
          this.currentUser = result.user
          await this.initializeApp()
        } else {
          this.authError = result.error
        }
      } catch (error) {
        this.authError = 'An unexpected error occurred'
      } finally {
        this.authLoading = false
      }
    },

    toggleAuthMode() {
      this.authMode = this.authMode === 'login' ? 'register' : 'login'
      this.authError = ''
    },

    logout() {
      AuthService.logout()
      this.isAuthenticated = false
      this.currentUser = null
      this.resetAppState()
    },

    resetAppState() {
      this.activeTab = 'streaming'
      this.inbox = []
      this.sentEmails = []
      this.selectedEmail = null
      this.users = []
    },

    async initializeApp() {
      await Promise.all([
        this.refreshFiles(),
        this.loadEmails(),
        this.loadUsers()
      ])
    },

    // Email methods
    async loadEmails() {
      this.emailLoading = true
      try {
        const [inboxResult, sentResult] = await Promise.all([
          EmailService.getInbox(),
          EmailService.getSentEmails()
        ])

        if (inboxResult.success) {
          this.inbox = inboxResult.emails
        }

        if (sentResult.success) {
          this.sentEmails = sentResult.emails
        }
      } catch (error) {
        console.error('Failed to load emails:', error)
      } finally {
        this.emailLoading = false
      }
    },

    async loadUsers() {
      const result = await EmailService.getUsers()
      if (result.success) {
        this.users = result.users
      }
    },

    async sendEmail() {
      this.emailSending = true
      this.emailError = ''

      try {
        const result = await EmailService.sendEmail(
          this.composeForm.to,
          this.composeForm.subject,
          this.composeForm.body
        )

        if (result.success) {
          this.clearCompose()
          this.emailView = 'sent'
          await this.loadEmails()
        } else {
          this.emailError = result.error
        }
      } catch (error) {
        this.emailError = 'Failed to send email'
      } finally {
        this.emailSending = false
      }
    },

    async selectEmail(email) {
      this.selectedEmail = email
      
      // Mark as read if it's an inbox email
      if (email.received_at && !email.is_read) {
        await EmailService.markAsRead(email.id)
        email.is_read = true
      }
    },

    clearCompose() {
      this.composeForm = {
        to: '',
        subject: '',
        body: ''
      }
      this.emailError = ''
    },

    formatEmailDate(dateString) {
      return new Date(dateString).toLocaleString()
    },

    // Streaming methods
    addCamera() {
      this.cameras.push({ 
        streamName: `cam${this.cameras.length + 1}`,
        hls: null 
      })
    },

    removeCamera() {
      if (this.cameras.length > 1) {
        const camera = this.cameras.pop()
        if (camera.hls) {
          camera.hls.destroy()
        }
      }
    },

    async connectStream(index) {
      const camera = this.cameras[index]
      const video = document.getElementById(`video-${index}`)
      
      if (!camera.streamName) {
        alert('Please enter a stream name')
        return
      }

      // Clean up existing HLS instance
      if (camera.hls) {
        camera.hls.destroy()
      }

      const streamUrl = `http://${window.location.hostname}/hls/${camera.streamName}.m3u8`

      if (Hls.isSupported()) {
        camera.hls = new Hls()
        camera.hls.loadSource(streamUrl)
        camera.hls.attachMedia(video)
        
        camera.hls.on(Hls.Events.MANIFEST_PARSED, async () => {
          console.log(`Stream ${camera.streamName} connected successfully`)
          
          // Send notification to all users
          try {
            await EmailService.notifyStreamStart(camera.streamName)
            console.log('Stream notification sent to all users')
          } catch (error) {
            console.error('Failed to send stream notification:', error)
          }
        })

        camera.hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('HLS error:', data)
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.log('Network error, trying to recover...')
                camera.hls.startLoad()
                break
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.log('Media error, trying to recover...')
                camera.hls.recoverMediaError()
                break
              default:
                console.log('Fatal error, destroying HLS instance')
                camera.hls.destroy()
                break
            }
          }
        })
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = streamUrl
      } else {
        alert('HLS is not supported in this browser')
      }
    },

    // File browser methods (keeping existing implementation)
    async refreshFiles() {
      this.loading = true
      this.loadingMessage = 'Loading files...'
      this.error = null

      try {
        const response = await fetch(`/api/files${this.currentPath}`)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        this.files = data.files || []
      } catch (error) {
        console.error('Error fetching files:', error)
        this.error = `Failed to load files: ${error.message}`
        this.files = []
      } finally {
        this.loading = false
      }
    },

    navigateUp() {
      if (!this.isRootPath) {
        const pathParts = this.currentPath.split('/').filter(part => part)
        pathParts.pop()
        this.currentPath = '/' + pathParts.join('/')
        if (this.currentPath === '/') {
          this.currentPath = '/data/hls'
        }
        this.refreshFiles()
      }
    },

    navigateToFolder(folder) {
      this.currentPath = this.currentPath.endsWith('/') 
        ? this.currentPath + folder.name 
        : this.currentPath + '/' + folder.name
      this.refreshFiles()
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

    async downloadFile(file) {
      this.downloading = file.name
      try {
        const filePath = this.currentPath.endsWith('/') 
          ? this.currentPath + file.name 
          : this.currentPath + '/' + file.name
        
        const response = await fetch(`/api/files${filePath}?download=true`)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = file.name
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } catch (error) {
        console.error('Download error:', error)
        alert(`Failed to download file: ${error.message}`)
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
        case 'txt': return '📄'
        case 'log': return '📋'
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

  /* Authentication Styles */
  .auth-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .auth-modal {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 400px;
  }

  .auth-modal h2 {
    margin-bottom: 1.5rem;
    text-align: center;
    color: #333;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: bold;
    color: #555;
  }

  .form-group input,
  .form-group textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    box-sizing: border-box;
  }

  .form-group textarea {
    resize: vertical;
    min-height: 100px;
  }

  .error-message {
    color: #e74c3c;
    margin: 1rem 0;
    padding: 0.5rem;
    background-color: #fdf2f2;
    border: 1px solid #fecaca;
    border-radius: 4px;
  }

  .btn-primary {
    background-color: #3498db;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    width: 100%;
    margin-bottom: 1rem;
  }

  .btn-primary:hover:not(:disabled) {
    background-color: #2980b9;
  }

  .btn-primary:disabled {
    background-color: #bdc3c7;
    cursor: not-allowed;
  }

  .auth-switch {
    text-align: center;
    margin-top: 1rem;
  }

  .auth-switch a {
    color: #3498db;
    text-decoration: none;
  }

  .auth-switch a:hover {
    text-decoration: underline;
  }

  /* Header Updates */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .btn-logout {
    background-color: #e74c3c;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
  }

  .btn-logout:hover {
    background-color: #c0392b;
  }

  .unread-badge {
    background-color: #e74c3c;
    color: white;
    border-radius: 50%;
    padding: 0.2rem 0.5rem;
    font-size: 0.8rem;
    margin-left: 0.5rem;
  }

  /* Email Styles */
  .email-container {
    display: flex;
    height: 600px;
    border: 1px solid #ddd;
    border-radius: 8px;
    overflow: hidden;
  }

  .email-sidebar {
    width: 200px;
    background-color: #f8f9fa;
    border-right: 1px solid #ddd;
  }

  .email-nav {
    padding: 1rem;
  }

  .email-nav-btn {
    display: block;
    width: 100%;
    padding: 0.75rem;
    margin-bottom: 0.5rem;
    background: none;
    border: 1px solid transparent;
    border-radius: 4px;
    cursor: pointer;
    text-align: left;
    position: relative;
  }

  .email-nav-btn:hover {
    background-color: #e9ecef;
  }

  .email-nav-btn.active {
    background-color: #3498db;
    color: white;
  }

  .email-main {
    flex: 1;
    padding: 1rem;
    overflow-y: auto;
  }

  .email-list h3 {
    margin-bottom: 1rem;
    color: #333;
  }

  .email-items {
    border: 1px solid #ddd;
    border-radius: 4px;
  }

  .email-item {
    display: grid;
    grid-template-columns: 1fr 2fr auto;
    gap: 1rem;
    padding: 1rem;
    border-bottom: 1px solid #eee;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .email-item:hover {
    background-color: #f8f9fa;
  }

  .email-item.unread {
    background-color: #fff3cd;
    font-weight: bold;
  }

  .email-item:last-child {
    border-bottom: none;
  }

  .email-from {
    font-weight: 500;
    color: #333;
  }

  .email-subject {
    color: #666;
  }

  .email-date {
    color: #999;
    font-size: 0.9rem;
    text-align: right;
  }

  .compose-email {
    max-width: 600px;
  }

  .compose-email h3 {
    margin-bottom: 1.5rem;
    color: #333;
  }

  .form-actions {
    display: flex;
    gap: 1rem;
  }

  .btn-secondary {
    background-color: #6c757d;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    cursor: pointer;
  }

  .btn-secondary:hover {
    background-color: #5a6268;
  }

  .email-detail {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: white;
    z-index: 999;
    padding: 2rem;
    overflow-y: auto;
  }

  .email-detail-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #ddd;
  }

  .btn-back {
    background-color: #6c757d;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
  }

  .btn-back:hover {
    background-color: #5a6268;
  }

  .email-meta {
    background-color: #f8f9fa;
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 1.5rem;
  }

  .email-meta div {
    margin-bottom: 0.5rem;
  }

  .email-body {
    line-height: 1.6;
    white-space: pre-wrap;
    background-color: white;
    padding: 1.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
  }

  .empty-state {
    text-align: center;
    padding: 3rem;
    color: #666;
  }

  .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .empty-message {
    font-size: 1.1rem;
  }
</style> 