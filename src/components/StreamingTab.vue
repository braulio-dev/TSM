<template>
  <div class="streaming-tab">
    <div class="streaming-header">
      <h2 class="tab-title">
        <PlayIcon class="title-icon" />
        Live Streaming
      </h2>
      <div class="streaming-controls">
        <button @click="$emit('add-camera')" class="control-btn primary">
          <PlusIcon class="btn-icon" />
          Add Camera
        </button>
        <button @click="$emit('remove-camera')" class="control-btn secondary" :disabled="cameras.length <= 1">
          <MinusIcon class="btn-icon" />
          Remove Camera
        </button>
      </div>
    </div>

    <div class="camera-grid" :class="{ 'single-camera': cameras.length === 1 }">
      <div 
        v-for="(camera, index) in cameras" 
        :key="index" 
        class="camera-container"
      >
        <div class="camera-header">
          <div class="camera-info">
            <VideoCameraIcon class="camera-icon" />
            <span class="camera-label">Camera {{ index + 1 }}</span>
          </div>
          <div class="connection-status" :class="{ connected: camera.connected }">
            <div class="status-indicator"></div>
            <span class="status-text">{{ camera.connected ? 'Connected' : 'Disconnected' }}</span>
          </div>
        </div>

        <div class="stream-input-section">
          <div class="input-group">
            <label class="input-label">
              <SignalIcon class="label-icon" />
              Stream Name
            </label>
            <div class="input-wrapper">
              <input 
                :value="camera.streamName"
                @input="$emit('update-stream-name', index, $event.target.value)"
                type="text" 
                placeholder="Enter stream name (e.g., cam1)"
                class="stream-input"
              >
              <button 
                @click="$emit('connect-stream', index)" 
                class="connect-btn"
                :disabled="!camera.streamName || camera.connecting"
              >
                <div v-if="camera.connecting" class="loading-spinner"></div>
                <span v-else>{{ camera.connected ? 'Reconnect' : 'Connect' }}</span>
              </button>
            </div>
          </div>
        </div>

        <div class="video-container">
          <video 
            :id="'video-' + index" 
            autoplay 
            controls
            class="video-player"
            :class="{ 'has-stream': camera.connected }"
          ></video>
          
          <div v-if="!camera.connected" class="video-placeholder">
            <VideoCameraSlashIcon class="placeholder-icon" />
            <p class="placeholder-text">No stream connected</p>
            <p class="placeholder-hint">Enter a stream name and click Connect</p>
          </div>

          <div v-if="camera.error" class="video-error">
            <ExclamationTriangleIcon class="error-icon" />
            <p class="error-text">{{ camera.error }}</p>
          </div>
        </div>

        <div class="camera-footer">
          <div class="stream-info">
            <div v-if="camera.streamName" class="info-item">
              <span class="info-label">Stream:</span>
              <span class="info-value">{{ camera.streamName }}</span>
            </div>
            <div v-if="camera.quality" class="info-item">
              <span class="info-label">Quality:</span>
              <span class="info-value">{{ camera.quality }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="cameras.length === 0" class="empty-state">
      <VideoCameraIcon class="empty-icon" />
      <h3 class="empty-title">No Cameras Added</h3>
      <p class="empty-description">Add your first camera to start streaming</p>
      <button @click="$emit('add-camera')" class="empty-action-btn">
        <PlusIcon class="btn-icon" />
        Add Camera
      </button>
    </div>
  </div>
</template>

<script>
import {
  PlayIcon,
  PlusIcon,
  MinusIcon,
  VideoCameraIcon,
  VideoCameraSlashIcon,
  SignalIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'

export default {
  name: 'StreamingTab',
  components: {
    PlayIcon,
    PlusIcon,
    MinusIcon,
    VideoCameraIcon,
    VideoCameraSlashIcon,
    SignalIcon,
    ExclamationTriangleIcon
  },
  props: {
    cameras: {
      type: Array,
      required: true
    }
  },
  emits: ['add-camera', 'remove-camera', 'connect-stream', 'update-stream-name']
}
</script>

<style scoped>
.streaming-tab {
  padding: 1.5rem;
}

.streaming-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
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

.streaming-controls {
  display: flex;
  gap: 0.75rem;
}

.control-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.control-btn.primary {
  background: var(--accent-color);
  color: var(--primary-color);
}

.control-btn.primary:hover {
  background: var(--accent-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 255, 136, 0.4);
}

.control-btn.secondary {
  background: var(--glass-subtle);
  color: var(--text-color);
  border: 1px solid var(--glass-border);
}

.control-btn.secondary:hover:not(:disabled) {
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

.camera-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
}

.camera-grid.single-camera {
  grid-template-columns: 1fr;
  max-width: 800px;
  margin: 0 auto;
}

.camera-container {
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.camera-container:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.camera-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.camera-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.camera-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--accent-color);
}

.camera-label {
  font-weight: 600;
  color: var(--text-color);
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  background: var(--glass-subtle);
  border: 1px solid var(--glass-border);
}

.connection-status.connected {
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.3);
}

.status-indicator {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: var(--danger-color);
}

.connection-status.connected .status-indicator {
  background: var(--success-color);
}

.status-text {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.connection-status.connected .status-text {
  color: var(--success-color);
}

.stream-input-section {
  margin-bottom: 1.5rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-label {
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

.input-wrapper {
  display: flex;
  gap: 0.75rem;
}

.stream-input {
  flex: 1;
  padding: 0.75rem 1rem;
  background: var(--glass-subtle);
  border: 1px solid var(--glass-border);
  border-radius: 10px;
  color: var(--text-color);
  font-size: 0.875rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.stream-input:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(0, 255, 136, 0.1);
  background: var(--glass-hover);
}

.stream-input::placeholder {
  color: var(--text-muted);
}

.connect-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: var(--accent-color);
  color: var(--primary-color);
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  min-width: 100px;
}

.connect-btn:hover:not(:disabled) {
  background: var(--accent-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 255, 136, 0.4);
}

.connect-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.loading-spinner {
  width: 1rem;
  height: 1rem;
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

.video-container {
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
  border-radius: 12px;
  overflow: hidden;
  background: var(--glass-subtle);
  margin-bottom: 1rem;
  min-height: 200px;
}

.video-player {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: transparent;
  display: block;
  border-radius: 0;
}

.video-player.has-stream {
  background: #000;
}

.video-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
}

.placeholder-icon {
  width: 3rem;
  height: 3rem;
  color: var(--text-muted);
  margin-bottom: 1rem;
}

.placeholder-text {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0 0 0.5rem 0;
}

.placeholder-hint {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin: 0;
}

.video-error {
  position: absolute;
  top: 1rem;
  left: 1rem;
  right: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.error-icon {
  width: 1rem;
  height: 1rem;
  color: var(--danger-color);
  flex-shrink: 0;
}

.error-text {
  font-size: 0.875rem;
  color: var(--danger-color);
  margin: 0;
}

.camera-footer {
  border-top: 1px solid var(--glass-border);
  padding-top: 1rem;
}

.stream-info {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.info-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-value {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-color);
  font-family: monospace;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 4rem 2rem;
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  margin-top: 2rem;
}

.empty-icon {
  width: 4rem;
  height: 4rem;
  color: var(--text-muted);
  margin-bottom: 1.5rem;
}

.empty-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 0.5rem 0;
}

.empty-description {
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 0 0 2rem 0;
}

.empty-action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  background: var(--accent-color);
  color: var(--primary-color);
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.empty-action-btn:hover {
  background: var(--accent-hover);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 255, 136, 0.4);
}

/* Responsive Design */
@media (max-width: 768px) {
  .streaming-tab {
    padding: 1rem;
  }
  
  .streaming-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .streaming-controls {
    justify-content: center;
  }
  
  .camera-grid {
    grid-template-columns: 1fr;
  }
  
  .input-wrapper {
    flex-direction: column;
  }
  
  .connect-btn {
    min-width: auto;
  }
  
  .stream-info {
    justify-content: center;
  }
}
</style> 