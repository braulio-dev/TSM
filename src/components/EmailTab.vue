<template>
  <div class="email-tab">
    <div class="email-header">
      <h2 class="tab-title">
        <EnvelopeIcon class="title-icon" />
        Email
      </h2>
    </div>

    <div class="email-container">
      <!-- Email Sidebar -->
      <div class="email-sidebar">
        <div class="email-nav">
          <button 
            @click="$emit('change-view', 'inbox')" 
            :class="['email-nav-btn', { active: emailView === 'inbox' }]"
          >
            <InboxIcon class="nav-icon" />
            <span>Inbox</span>
            <span v-if="unreadCount > 0" class="unread-badge">{{ unreadCount }}</span>
          </button>
          <button 
            @click="$emit('change-view', 'sent')" 
            :class="['email-nav-btn', { active: emailView === 'sent' }]"
          >
            <PaperAirplaneIcon class="nav-icon" />
            <span>Sent</span>
          </button>
          <button 
            @click="$emit('change-view', 'compose')" 
            :class="['email-nav-btn', { active: emailView === 'compose' }]"
          >
            <PencilSquareIcon class="nav-icon" />
            <span>Compose</span>
          </button>
        </div>
      </div>

      <!-- Email Main Content -->
      <div class="email-main">
        <!-- Inbox View -->
        <div v-if="emailView === 'inbox'" class="email-list">
          <div class="list-header">
            <h3 class="list-title">Inbox</h3>
            <button @click="$emit('refresh-emails')" class="refresh-btn" :disabled="loading">
              <ArrowPathIcon class="btn-icon" :class="{ spinning: loading }" />
            </button>
          </div>
          
          <div v-if="loading" class="loading-state">
            <div class="loading-spinner"></div>
            <span class="loading-text">Loading emails...</span>
          </div>
          
          <div v-else-if="inbox.length === 0" class="empty-state">
            <InboxIcon class="empty-icon" />
            <h4 class="empty-title">No emails in your inbox</h4>
            <p class="empty-description">When you receive emails, they'll appear here</p>
          </div>
          
          <div v-else class="email-items">
            <div 
              v-for="email in inbox" 
              :key="email.id"
              :class="['email-item', { unread: !email.is_read }]"
              @click="$emit('select-email', email)"
            >
              <div class="email-avatar">
                <UserCircleIcon class="avatar-icon" />
              </div>
              <div class="email-content">
                <div class="email-from">{{ email.from_email }}</div>
                <div class="email-subject">{{ email.subject }}</div>
                <div class="email-preview">{{ getEmailPreview(email.body) }}</div>
              </div>
              <div class="email-meta">
                <div class="email-date">{{ formatEmailDate(email.received_at) }}</div>
                <div v-if="!email.is_read" class="unread-indicator"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sent View -->
        <div v-if="emailView === 'sent'" class="email-list">
          <div class="list-header">
            <h3 class="list-title">Sent</h3>
            <button @click="$emit('refresh-emails')" class="refresh-btn" :disabled="loading">
              <ArrowPathIcon class="btn-icon" :class="{ spinning: loading }" />
            </button>
          </div>
          
          <div v-if="loading" class="loading-state">
            <div class="loading-spinner"></div>
            <span class="loading-text">Loading emails...</span>
          </div>
          
          <div v-else-if="sentEmails.length === 0" class="empty-state">
            <PaperAirplaneIcon class="empty-icon" />
            <h4 class="empty-title">No sent emails</h4>
            <p class="empty-description">Emails you send will appear here</p>
          </div>
          
          <div v-else class="email-items">
            <div 
              v-for="email in sentEmails" 
              :key="email.id"
              class="email-item"
              @click="$emit('select-email', email)"
            >
              <div class="email-avatar">
                <UserCircleIcon class="avatar-icon" />
              </div>
              <div class="email-content">
                <div class="email-from">To: {{ email.to_email }}</div>
                <div class="email-subject">{{ email.subject }}</div>
                <div class="email-preview">{{ getEmailPreview(email.body) }}</div>
              </div>
              <div class="email-meta">
                <div class="email-date">{{ formatEmailDate(email.sent_at) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Compose View -->
        <div v-if="emailView === 'compose'" class="compose-email">
          <div class="compose-header">
            <h3 class="compose-title">Compose Email</h3>
          </div>
          
          <form @submit.prevent="$emit('send-email')" class="compose-form">
            <div class="form-group">
              <label for="email-to" class="form-label">
                <UserIcon class="label-icon" />
                To
              </label>
              <input 
                id="email-to"
                :value="composeForm.to"
                @input="$emit('update:compose-to', $event.target.value)"
                type="email" 
                required 
                placeholder="recipient@example.com"
                class="form-input"
                list="users-list"
                :disabled="sending"
              >
              <datalist id="users-list">
                <option v-for="user in users" :key="user.id" :value="user.email"></option>
              </datalist>
            </div>
            
            <div class="form-group">
              <label for="email-subject" class="form-label">
                <ChatBubbleLeftRightIcon class="label-icon" />
                Subject
              </label>
              <input 
                id="email-subject"
                :value="composeForm.subject"
                @input="$emit('update:compose-subject', $event.target.value)"
                type="text" 
                required 
                placeholder="Email subject"
                class="form-input"
                :disabled="sending"
              >
            </div>
            
            <div class="form-group">
              <label for="email-body" class="form-label">
                <DocumentTextIcon class="label-icon" />
                Message
              </label>
              <textarea 
                id="email-body"
                :value="composeForm.body"
                @input="$emit('update:compose-body', $event.target.value)"
                required 
                placeholder="Write your message here..."
                rows="12"
                class="form-textarea"
                :disabled="sending"
              ></textarea>
            </div>
            
            <div v-if="error" class="error-message">
              <ExclamationTriangleIcon class="error-icon" />
              {{ error }}
            </div>
            
            <div class="form-actions">
              <button type="submit" class="send-btn" :disabled="sending">
                <div v-if="sending" class="loading-spinner small"></div>
                <PaperAirplaneIcon v-else class="btn-icon" />
                {{ sending ? 'Sending...' : 'Send Email' }}
              </button>
              <button type="button" @click="$emit('clear-compose')" class="clear-btn" :disabled="sending">
                <TrashIcon class="btn-icon" />
                Clear
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Email Detail Modal -->
    <div v-if="selectedEmail" class="email-detail-overlay" @click.self="$emit('close-email')">
      <div class="email-detail">
        <div class="email-detail-header">
          <button @click="$emit('close-email')" class="back-btn">
            <ArrowLeftIcon class="btn-icon" />
            Back
          </button>
          <h4 class="detail-title">{{ selectedEmail.subject }}</h4>
        </div>
        
        <div class="email-meta-section">
          <div class="meta-item">
            <span class="meta-label">From:</span>
            <span class="meta-value">{{ selectedEmail.from_email || 'You' }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">To:</span>
            <span class="meta-value">{{ selectedEmail.to_email || currentUser?.email }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Date:</span>
            <span class="meta-value">{{ formatEmailDate(selectedEmail.sent_at || selectedEmail.received_at) }}</span>
          </div>
        </div>
        
        <div class="email-body-section">
          <div class="body-content">{{ selectedEmail.body }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {
  EnvelopeIcon,
  InboxIcon,
  PaperAirplaneIcon,
  PencilSquareIcon,
  ArrowPathIcon,
  UserCircleIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  ArrowLeftIcon
} from '@heroicons/vue/24/outline'

export default {
  name: 'EmailTab',
  components: {
    EnvelopeIcon,
    InboxIcon,
    PaperAirplaneIcon,
    PencilSquareIcon,
    ArrowPathIcon,
    UserCircleIcon,
    UserIcon,
    ChatBubbleLeftRightIcon,
    DocumentTextIcon,
    ExclamationTriangleIcon,
    TrashIcon,
    ArrowLeftIcon
  },
  props: {
    emailView: {
      type: String,
      required: true
    },
    inbox: {
      type: Array,
      required: true
    },
    sentEmails: {
      type: Array,
      required: true
    },
    selectedEmail: {
      type: Object,
      default: null
    },
    loading: {
      type: Boolean,
      default: false
    },
    error: {
      type: String,
      default: ''
    },
    sending: {
      type: Boolean,
      default: false
    },
    users: {
      type: Array,
      required: true
    },
    composeForm: {
      type: Object,
      required: true
    },
    currentUser: {
      type: Object,
      default: null
    },
    unreadCount: {
      type: Number,
      default: 0
    }
  },
  emits: [
    'change-view', 
    'refresh-emails', 
    'select-email', 
    'close-email', 
    'send-email', 
    'clear-compose',
    'update:compose-to',
    'update:compose-subject', 
    'update:compose-body'
  ],
  methods: {
    formatEmailDate(dateString) {
      if (!dateString) return 'Unknown'
      
      const date = new Date(dateString)
      const now = new Date()
      const diffTime = Math.abs(now - date)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays === 1) {
        return 'Today'
      } else if (diffDays === 2) {
        return 'Yesterday'
      } else if (diffDays <= 7) {
        return `${diffDays - 1} days ago`
      } else {
        return date.toLocaleDateString()
      }
    },
    
    getEmailPreview(body) {
      if (!body) return ''
      return body.length > 100 ? body.substring(0, 100) + '...' : body
    }
  }
}
</script>

<style scoped>
.email-tab {
  padding: 1.5rem;
}

.email-header {
  margin-bottom: 2rem;
}

.tab-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.title-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--accent-color);
}

.email-container {
  display: flex;
  height: 600px;
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.email-sidebar {
  width: 240px;
  background: var(--glass-subtle);
  border-right: 1px solid var(--glass-border);
  flex-shrink: 0;
}

.email-nav {
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.email-nav-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.875rem 1rem;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  text-align: left;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: var(--text-secondary);
  font-weight: 500;
}

.email-nav-btn:hover {
  background: var(--glass-hover);
  color: var(--text-color);
  transform: translateX(4px);
}

.email-nav-btn.active {
  background: var(--accent-color);
  color: var(--primary-color);
  border-color: var(--accent-color);
  box-shadow: 0 4px 16px rgba(0, 255, 136, 0.3);
}

.nav-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.unread-badge {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: var(--danger-color);
  color: white;
  border-radius: 50%;
  padding: 0.125rem 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  min-width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
}

.email-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem 1rem 2rem;
  border-bottom: 1px solid var(--glass-border);
}

.list-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.refresh-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background: var(--glass-subtle);
  color: var(--text-secondary);
  border: 1px solid var(--glass-border);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.refresh-btn:hover:not(:disabled) {
  background: var(--glass-hover);
  color: var(--text-color);
  transform: translateY(-2px);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.btn-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.email-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  text-align: center;
  padding: 2rem;
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
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

.empty-icon {
  width: 3rem;
  height: 3rem;
  color: var(--text-muted);
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 0.5rem 0;
}

.empty-description {
  color: var(--text-secondary);
  margin: 0;
}

.email-items {
  flex: 1;
  overflow-y: auto;
}

.email-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 2rem;
  border-bottom: 1px solid var(--glass-border);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.email-item:hover {
  background: var(--glass-subtle);
}

.email-item.unread {
  background: rgba(0, 255, 136, 0.05);
  border-left: 3px solid var(--accent-color);
}

.email-item:last-child {
  border-bottom: none;
}

.email-avatar {
  flex-shrink: 0;
}

.avatar-icon {
  width: 2.5rem;
  height: 2.5rem;
  color: var(--accent-color);
}

.email-content {
  flex: 1;
  min-width: 0;
}

.email-from {
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 0.25rem;
}

.email-subject {
  font-weight: 500;
  color: var(--text-color);
  margin-bottom: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.email-preview {
  font-size: 0.875rem;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.email-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
  flex-shrink: 0;
}

.email-date {
  font-size: 0.75rem;
  color: var(--text-muted);
  white-space: nowrap;
}

.unread-indicator {
  width: 0.5rem;
  height: 0.5rem;
  background: var(--accent-color);
  border-radius: 50%;
}

.compose-email {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.compose-header {
  padding: 1.5rem 2rem 1rem 2rem;
  border-bottom: 1px solid var(--glass-border);
}

.compose-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.compose-form {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1.5rem 2rem;
  gap: 1.5rem;
  overflow-y: auto;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: var(--text-color);
  font-size: 0.875rem;
}

.label-icon {
  width: 1rem;
  height: 1rem;
  color: var(--accent-color);
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.875rem 1rem;
  background: var(--glass-subtle);
  border: 1px solid var(--glass-border);
  border-radius: 10px;
  color: var(--text-color);
  font-size: 0.875rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: inherit;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(0, 255, 136, 0.1);
  background: var(--glass-hover);
}

.form-input:disabled,
.form-textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: var(--text-muted);
}

.form-textarea {
  resize: vertical;
  min-height: 200px;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--danger-color);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 10px;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
}

.error-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: auto;
  padding-top: 1rem;
}

.send-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  background: var(--accent-color);
  color: var(--primary-color);
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex: 1;
}

.send-btn:hover:not(:disabled) {
  background: var(--accent-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 255, 136, 0.4);
}

.send-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.clear-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1rem;
  background: var(--glass-subtle);
  color: var(--text-color);
  border: 1px solid var(--glass-border);
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.clear-btn:hover:not(:disabled) {
  background: var(--glass-hover);
  transform: translateY(-2px);
}

.clear-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.email-detail-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 2rem;
}

.email-detail {
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  width: 100%;
  max-width: 700px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.email-detail-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--glass-border);
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--glass-subtle);
  color: var(--text-color);
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.back-btn:hover {
  background: var(--glass-hover);
  transform: translateY(-2px);
}

.detail-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
  flex: 1;
}

.email-meta-section {
  padding: 1.5rem 2rem;
  background: var(--glass-subtle);
  border-bottom: 1px solid var(--glass-border);
}

.meta-item {
  display: flex;
  margin-bottom: 0.75rem;
}

.meta-item:last-child {
  margin-bottom: 0;
}

.meta-label {
  font-weight: 600;
  color: var(--text-secondary);
  width: 4rem;
  flex-shrink: 0;
}

.meta-value {
  color: var(--text-color);
  font-weight: 500;
}

.email-body-section {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
}

.body-content {
  line-height: 1.6;
  white-space: pre-wrap;
  color: var(--text-color);
  font-size: 0.95rem;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .email-container {
    flex-direction: column;
    height: auto;
  }
  
  .email-sidebar {
    width: 100%;
  }
  
  .email-nav {
    flex-direction: row;
    overflow-x: auto;
  }
  
  .email-nav-btn {
    white-space: nowrap;
  }
}

@media (max-width: 768px) {
  .email-tab {
    padding: 1rem;
  }
  
  .email-item {
    padding: 1rem;
  }
  
  .email-preview {
    display: none;
  }
  
  .compose-form {
    padding: 1rem;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .email-detail-overlay {
    padding: 1rem;
  }
  
  .email-detail-header {
    padding: 1rem;
  }
  
  .email-meta-section,
  .email-body-section {
    padding: 1rem;
  }
}
</style> 