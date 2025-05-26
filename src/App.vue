<template>
  <div class="app" :data-theme="isDarkMode ? 'dark' : 'light'">
    <!-- Authentication Modal -->
    <AuthModal
      v-if="!isAuthenticated"
      :auth-mode="authMode"
      :email="authForm.email"
      :password="authForm.password"
      :error="authError"
      :loading="authLoading"
      @close="authError = ''"
      @submit="handleAuth"
      @toggle-mode="toggleAuthMode"
      @update:email="authForm.email = $event"
      @update:password="authForm.password = $event"
    />

    <!-- Main Application -->
    <div v-else class="container">
      <!-- App Header -->
      <AppHeader
        :active-tab="activeTab"
        :current-user="currentUser"
        :unread-count="unreadCount"
        :is-dark-mode="isDarkMode"
        @tab-change="activeTab = $event"
        @logout="logout"
        @toggle-dark-mode="toggleDarkMode"
      />

      <!-- Streaming Tab -->
      <StreamingTab
        v-show="activeTab === 'streaming'"
        :cameras="cameras"
        @add-camera="addCamera"
        @remove-camera="removeCamera"
        @connect-stream="connectStream"
        @update-stream-name="updateStreamName"
      />

      <!-- File Browser Tab -->
      <FileBrowserTab
        v-show="activeTab === 'files'"
        :current-path="currentPath"
        :files="files"
        :selected-file="selectedFile"
        :loading="loading"
        :loading-message="loadingMessage"
        :error="error"
        :downloading="downloading"
        :is-root-path="isRootPath"
        @refresh="refreshFiles"
        @navigate-up="navigateUp"
        @select-file="selectFile"
        @double-click="handleDoubleClick"
        @download-file="downloadFile"
        @navigate-to-folder="navigateToFolder"
      />

      <!-- Email Tab -->
      <EmailTab
        v-show="activeTab === 'email'"
        :email-view="emailView"
        :inbox="inbox"
        :sent-emails="sentEmails"
        :selected-email="selectedEmail"
        :loading="emailLoading"
        :error="emailError"
        :sending="emailSending"
        :users="users"
        :compose-form="composeForm"
        :current-user="currentUser"
        :unread-count="unreadCount"
        @change-view="emailView = $event"
        @refresh-emails="loadEmails"
        @select-email="selectEmail"
        @close-email="selectedEmail = null"
        @send-email="sendEmail"
        @clear-compose="clearCompose"
        @update:compose-to="composeForm.to = $event"
        @update:compose-subject="composeForm.subject = $event"
        @update:compose-body="composeForm.body = $event"
      />
    </div>
  </div>
</template>

<script>
import Hls from 'hls.js'
import AuthService from './services/auth.js'
import EmailService from './services/email.js'
import AppHeader from './components/AppHeader.vue'
import AuthModal from './components/AuthModal.vue'
import StreamingTab from './components/StreamingTab.vue'
import FileBrowserTab from './components/FileBrowserTab.vue'
import EmailTab from './components/EmailTab.vue'

export default {
  name: 'App',
  components: {
    AppHeader,
    AuthModal,
    StreamingTab,
    FileBrowserTab,
    EmailTab
  },
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
      isDarkMode: true,
      
      // Streaming
      cameras: [
        { 
          streamName: 'cam1', 
          hls: null, 
          connected: false, 
          connecting: false, 
          error: null,
          quality: null
        }
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
    // Initialize dark mode from localStorage
    const savedDarkMode = localStorage.getItem('darkMode')
    if (savedDarkMode !== null) {
      this.isDarkMode = savedDarkMode === 'true'
    }
    
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

    toggleDarkMode() {
      this.isDarkMode = !this.isDarkMode
      localStorage.setItem('darkMode', this.isDarkMode.toString())
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
        hls: null,
        connected: false,
        connecting: false,
        error: null,
        quality: null
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
        camera.error = 'Please enter a stream name'
        return
      }

      // Reset state
      camera.connecting = true
      camera.error = null
      camera.connected = false

      // Clean up existing HLS instance
      if (camera.hls) {
        camera.hls.destroy()
      }

      const streamUrl = `http://${window.location.hostname}/hls/${camera.streamName}.m3u8`

      try {
        if (Hls.isSupported()) {
          camera.hls = new Hls()
          camera.hls.loadSource(streamUrl)
          camera.hls.attachMedia(video)
          
          camera.hls.on(Hls.Events.MANIFEST_PARSED, async () => {
            console.log(`Stream ${camera.streamName} connected successfully`)
            camera.connected = true
            camera.connecting = false
            camera.error = null
            
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
            camera.connecting = false
            if (data.fatal) {
              camera.connected = false
              camera.error = `Stream error: ${data.details}`
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
          camera.connected = true
          camera.connecting = false
        } else {
          camera.error = 'HLS is not supported in this browser'
          camera.connecting = false
        }
      } catch (error) {
        camera.error = `Failed to connect: ${error.message}`
        camera.connecting = false
        camera.connected = false
      }
    },

    updateStreamName(index, value) {
      this.cameras[index].streamName = value
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