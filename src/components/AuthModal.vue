<template>
  <div class="auth-overlay" @click.self="$emit('close')">
    <div class="auth-modal">
      <div class="auth-header">
        <div class="auth-logo">
          <VideoCameraIcon class="logo-icon" />
        </div>
        <h2 class="auth-title">{{ authMode === 'login' ? 'Welcome Back' : 'Create Account' }}</h2>
        <p class="auth-subtitle">
          {{ authMode === 'login' ? 'Sign in to your account' : 'Join Camera Stream Manager' }}
        </p>
      </div>

      <form @submit.prevent="$emit('submit')" class="auth-form">
        <div class="form-group">
          <label for="email" class="form-label">
            <EnvelopeIcon class="label-icon" />
            Email Address
          </label>
          <input 
            id="email"
            :value="email" 
            @input="$emit('update:email', $event.target.value)"
            type="email" 
            required 
            placeholder="Enter your email"
            class="form-input"
            :disabled="loading"
          >
        </div>

        <div class="form-group">
          <label for="password" class="form-label">
            <LockClosedIcon class="label-icon" />
            Password
          </label>
          <div class="password-input-wrapper">
            <input 
              id="password"
              :value="password"
              @input="$emit('update:password', $event.target.value)"
              :type="showPassword ? 'text' : 'password'"
              required 
              placeholder="Enter your password"
              class="form-input"
              :disabled="loading"
            >
            <button 
              type="button" 
              @click="showPassword = !showPassword"
              class="password-toggle"
              :disabled="loading"
            >
              <EyeIcon v-if="!showPassword" class="toggle-icon" />
              <EyeSlashIcon v-else class="toggle-icon" />
            </button>
          </div>
        </div>

        <div v-if="error" class="error-message">
          <ExclamationTriangleIcon class="error-icon" />
          {{ error }}
        </div>

        <button type="submit" class="auth-submit-btn" :disabled="loading">
          <div v-if="loading" class="loading-spinner"></div>
          <span v-else>{{ authMode === 'login' ? 'Sign In' : 'Create Account' }}</span>
        </button>

        <div class="auth-divider">
          <span>{{ authMode === 'login' ? "Don't have an account?" : "Already have an account?" }}</span>
        </div>

        <button 
          type="button" 
          @click="$emit('toggle-mode')" 
          class="auth-switch-btn"
          :disabled="loading"
        >
          {{ authMode === 'login' ? 'Create Account' : 'Sign In' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script>
import {
  VideoCameraIcon,
  EnvelopeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'

export default {
  name: 'AuthModal',
  components: {
    VideoCameraIcon,
    EnvelopeIcon,
    LockClosedIcon,
    EyeIcon,
    EyeSlashIcon,
    ExclamationTriangleIcon
  },
  props: {
    authMode: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    password: {
      type: String,
      required: true
    },
    error: {
      type: String,
      default: ''
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      showPassword: false
    }
  },
  emits: ['close', 'submit', 'toggle-mode', 'update:email', 'update:password']
}
</script>

<style scoped>
.auth-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
}

.auth-modal {
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: 24px;
  padding: 2.5rem;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
  background: linear-gradient(135deg, var(--accent-color), var(--accent-secondary));
  border-radius: 16px;
  margin-bottom: 1.5rem;
  box-shadow: 0 8px 24px rgba(0, 255, 136, 0.3);
}

.logo-icon {
  width: 2rem;
  height: 2rem;
  color: var(--primary-color);
}

.auth-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0 0 0.5rem 0;
}

.auth-subtitle {
  color: var(--text-secondary);
  margin: 0;
  font-size: 0.95rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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

.form-input {
  width: 100%;
  padding: 1rem 1.25rem;
  background: var(--glass-subtle);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  color: var(--text-color);
  font-size: 1rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(0, 255, 136, 0.1);
  background: var(--glass-hover);
}

.form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-input::placeholder {
  color: var(--text-muted);
}

.password-input-wrapper {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.password-toggle:hover:not(:disabled) {
  color: var(--text-color);
  background: var(--glass-border);
}

.password-toggle:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toggle-icon {
  width: 1.25rem;
  height: 1.25rem;
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

.auth-submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 1rem 1.5rem;
  background: var(--accent-color);
  color: var(--primary-color);
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 3rem;
}

.auth-submit-btn:hover:not(:disabled) {
  background: var(--accent-hover);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 255, 136, 0.4);
}

.auth-submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.loading-spinner {
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid var(--primary-color);
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.auth-divider {
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.875rem;
  position: relative;
  margin: 0.5rem 0;
}

.auth-divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--glass-border);
  z-index: 1;
}

.auth-divider span {
  background: var(--glass-bg);
  padding: 0 1rem;
  position: relative;
  z-index: 2;
}

.auth-switch-btn {
  width: 100%;
  padding: 0.875rem 1.5rem;
  background: transparent;
  color: var(--accent-color);
  border: 1px solid var(--accent-color);
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.auth-switch-btn:hover:not(:disabled) {
  background: var(--accent-color);
  color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 255, 136, 0.3);
}

.auth-switch-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Mobile Responsive */
@media (max-width: 480px) {
  .auth-modal {
    padding: 2rem 1.5rem;
    margin: 1rem;
    border-radius: 20px;
  }
  
  .auth-title {
    font-size: 1.5rem;
  }
  
  .form-input {
    padding: 0.875rem 1rem;
  }
}
</style> 