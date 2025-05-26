<template>
  <header class="app-header">
    <div class="header-content">
      <!-- Logo and Title -->
      <div class="header-brand">
        <div class="logo">
          <VideoCameraIcon class="logo-icon" />
        </div>
        <h1 class="app-title">Camera Stream Manager</h1>
      </div>

      <!-- Navigation Tabs -->
      <nav class="header-nav">
        <button 
          @click="$emit('tab-change', 'streaming')" 
          :class="['nav-btn', { active: activeTab === 'streaming' }]"
        >
          <PlayIcon class="nav-icon" />
          <span>Live Streaming</span>
        </button>
        <button 
          @click="$emit('tab-change', 'files')" 
          :class="['nav-btn', { active: activeTab === 'files' }]"
        >
          <FolderIcon class="nav-icon" />
          <span>File Browser</span>
        </button>
        <button 
          @click="$emit('tab-change', 'email')" 
          :class="['nav-btn', { active: activeTab === 'email' }]"
        >
          <EnvelopeIcon class="nav-icon" />
          <span>Email</span>
          <span v-if="unreadCount > 0" class="unread-badge">{{ unreadCount }}</span>
        </button>
      </nav>

      <!-- User Controls -->
      <div class="header-controls">
        <!-- Dark Mode Toggle -->
        <button @click="$emit('toggle-dark-mode')" class="control-btn" title="Toggle Dark Mode">
          <SunIcon v-if="isDarkMode" class="control-icon" />
          <MoonIcon v-else class="control-icon" />
        </button>

        <!-- User Info -->
        <div class="user-info">
          <UserCircleIcon class="user-avatar" />
          <span class="user-email">{{ currentUser?.email }}</span>
        </div>

        <!-- Logout Button -->
        <button @click="$emit('logout')" class="logout-btn" title="Logout">
          <ArrowRightOnRectangleIcon class="control-icon" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  </header>
</template>

<script>
import {
  VideoCameraIcon,
  PlayIcon,
  FolderIcon,
  EnvelopeIcon,
  SunIcon,
  MoonIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/vue/24/outline'

export default {
  name: 'AppHeader',
  components: {
    VideoCameraIcon,
    PlayIcon,
    FolderIcon,
    EnvelopeIcon,
    SunIcon,
    MoonIcon,
    UserCircleIcon,
    ArrowRightOnRectangleIcon
  },
  props: {
    activeTab: {
      type: String,
      required: true
    },
    currentUser: {
      type: Object,
      default: null
    },
    unreadCount: {
      type: Number,
      default: 0
    },
    isDarkMode: {
      type: Boolean,
      default: true
    }
  },
  emits: ['tab-change', 'logout', 'toggle-dark-mode']
}
</script>

<style scoped>
.app-header {
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  margin-bottom: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 1rem;
  z-index: 100;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  gap: 1rem;
  flex-wrap: nowrap;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 0;
  flex-shrink: 0;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  background: linear-gradient(135deg, var(--accent-color), var(--accent-secondary));
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 255, 136, 0.3);
}

.logo-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--primary-color);
}

.app-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
  white-space: nowrap;
}

.header-nav {
  display: flex;
  gap: 0.5rem;
  flex: 0 1 auto;
  justify-content: flex-start;
  flex-wrap: nowrap;
  margin-left: 2rem;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  white-space: nowrap;
  flex-shrink: 0;
}

.nav-btn:hover {
  background: var(--glass-hover);
  color: var(--text-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(255, 255, 255, 0.1);
}

.nav-btn.active {
  background: var(--accent-color);
  color: var(--primary-color);
  border-color: var(--accent-color);
  box-shadow: 0 4px 20px rgba(0, 255, 136, 0.4);
}

.nav-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.unread-badge {
  position: absolute;
  top: -0.5rem;
  right: -0.5rem;
  background: var(--danger-color);
  color: white;
  border-radius: 50%;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  min-width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

.control-btn {
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

.control-btn:hover {
  background: var(--glass-hover);
  color: var(--text-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(255, 255, 255, 0.1);
}

.control-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  background: var(--glass-subtle);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
}

.user-avatar {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--accent-color);
}

.user-email {
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--danger-color);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.logout-btn:hover {
  background: var(--danger-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(239, 68, 68, 0.4);
}

/* Responsive Design */
@media (max-width: 1200px) {
  .header-nav {
    margin-left: 1rem;
  }
  
  .header-content {
    gap: 0.75rem;
  }
}

@media (max-width: 900px) {
  .header-nav {
    margin-left: 0.5rem;
  }
  
  .header-content {
    gap: 0.5rem;
  }
}

@media (max-width: 768px) {
  .header-content {
    padding: 1rem 1.5rem;
  }
  
  .app-title {
    font-size: 1.25rem;
  }
  
  .header-nav {
    margin-left: 0;
  }
  
  .nav-btn span {
    display: none;
  }
  
  .nav-btn {
    padding: 0.75rem;
  }
  
  .user-email {
    display: none;
  }
  
  .logout-btn span {
    display: none;
  }
  
  .logout-btn {
    padding: 0.75rem;
  }
}

@media (max-width: 600px) {
  .header-brand {
    gap: 0.5rem;
  }
  
  .app-title {
    font-size: 1rem;
  }
  
  .header-nav {
    gap: 0.25rem;
  }
  
  .nav-btn {
    padding: 0.5rem;
    min-width: 2.5rem;
    justify-content: center;
  }
  
  .header-controls {
    gap: 0.5rem;
  }
}
</style> 