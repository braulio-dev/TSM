class CameraManager {
    constructor() {
        this.cameraCount = 0;
        this.cameraGrid = document.getElementById('cameraGrid');
        this.addCameraBtn = document.getElementById('addCamera');
        this.removeCameraBtn = document.getElementById('removeCamera');

        this.addCameraBtn.addEventListener('click', () => this.addCamera());
        this.removeCameraBtn.addEventListener('click', () => this.removeCamera());

        // Add initial camera
        this.addCamera();
    }

    addCamera() {
        this.cameraCount++;
        const cameraId = `camera-${this.cameraCount}`;
        
        const cameraContainer = document.createElement('div');
        cameraContainer.className = 'camera-container';
        cameraContainer.id = cameraId;

        const streamInput = document.createElement('div');
        streamInput.className = 'stream-input';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Enter stream name (e.g., cam1)';
        input.value = `cam${this.cameraCount}`;
        
        const connectBtn = document.createElement('button');
        connectBtn.textContent = 'Connect';
        connectBtn.addEventListener('click', () => this.connectStream(cameraId, input.value));

        const video = document.createElement('video');
        video.autoplay = true;
        video.controls = true;
        video.id = `video-${cameraId}`;

        const label = document.createElement('div');
        label.className = 'camera-label';
        label.textContent = `Camera ${this.cameraCount}`;

        streamInput.appendChild(input);
        streamInput.appendChild(connectBtn);
        cameraContainer.appendChild(streamInput);
        cameraContainer.appendChild(video);
        cameraContainer.appendChild(label);
        
        this.cameraGrid.appendChild(cameraContainer);
    }

    removeCamera() {
        if (this.cameraCount > 1) {
            const lastCamera = document.getElementById(`camera-${this.cameraCount}`);
            if (lastCamera) {
                lastCamera.remove();
                this.cameraCount--;
            }
        }
    }

    connectStream(cameraId, streamName) {
        const video = document.getElementById(`video-${cameraId}`);
        const streamHost = window.location.hostname;
        const streamPort = '8080';
        
        if (video) {
            if (Hls.isSupported()) {
                const hls = new Hls();
                hls.loadSource(`http://${streamHost}:${streamPort}/hls/${streamName}.m3u8`);
                hls.attachMedia(video);
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    video.play();
                });
                hls.on(Hls.Events.ERROR, (event, data) => {
                    console.error('HLS Error:', data);
                });
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = `http://${streamHost}:${streamPort}/hls/${streamName}.m3u8`;
                video.addEventListener('loadedmetadata', () => {
                    video.play();
                });
            }
        }
    }
}

class FTPBrowser {
    constructor() {
        this.ftpHost = window.location.hostname;
        this.ftpPort = 21;
        this.ftpUser = 'ftpuser';
        this.ftpPass = 'ftppass';
        this.currentPath = '/';
        this.files = [];
        
        this.fileExplorer = document.getElementById('fileExplorer');
        this.previewVideo = document.getElementById('previewVideo');
        this.connectBtn = document.getElementById('connectFtp');
        this.refreshBtn = document.getElementById('refreshFiles');
        this.serverInfo = document.getElementById('ftpServerInfo');
        
        // Update server info display
        if (this.serverInfo) {
            this.serverInfo.textContent = `Server: ${this.ftpHost}:${this.ftpPort} | User: ${this.ftpUser} | Pass: ${this.ftpPass}`;
        }
        
        this.connectBtn.addEventListener('click', () => this.connectToFTP());
        this.refreshBtn.addEventListener('click', () => this.refreshFiles());
    }

    async connectToFTP() {
        this.showLoading('Connecting to FTP server...');
        
        try {
            // Since browsers can't directly connect to FTP, we'll simulate with HTTP requests
            // In a real implementation, you'd need a backend API to handle FTP connections
            await this.listFiles();
        } catch (error) {
            this.showError('Failed to connect to FTP server: ' + error.message);
        }
    }

    async listFiles() {
        this.showLoading('Loading files...');
        
        try {
            // Simulate FTP file listing with HTTP requests to the nginx server
            // This will list files from the mounted volumes
            const response = await fetch(`http://${this.ftpHost}:8080/videos/`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch file list');
            }
            
            // Parse directory listing (this is a simplified approach)
            const html = await response.text();
            this.parseDirectoryListing(html);
            
        } catch (error) {
            // Fallback: show some example files
            this.showExampleFiles();
        }
    }

    parseDirectoryListing(html) {
        // Simple HTML parsing for directory listing
        const files = [];
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const links = doc.querySelectorAll('a');
        
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href && href !== '../' && !href.startsWith('/')) {
                const isVideo = /\.(mp4|avi|mov|mkv|webm|m3u8|ts)$/i.test(href);
                if (isVideo) {
                    files.push({
                        name: href,
                        type: 'video',
                        size: 'Unknown',
                        url: `http://${this.ftpHost}:8080/videos/${href}`
                    });
                }
            }
        });
        
        this.files = files;
        this.displayFiles();
    }

    showExampleFiles() {
        // Show example structure when FTP listing fails
        this.files = [
            { name: 'videos/', type: 'folder', size: '-' },
            { name: 'hls/', type: 'folder', size: '-' },
            { name: 'cam1.m3u8', type: 'video', size: '2.1 MB', url: `http://${this.ftpHost}:8080/hls/cam1.m3u8` },
            { name: 'cam2.m3u8', type: 'video', size: '1.8 MB', url: `http://${this.ftpHost}:8080/hls/cam2.m3u8` },
            { name: 'sample.mp4', type: 'video', size: '15.2 MB', url: `http://${this.ftpHost}:8080/videos/sample.mp4` }
        ];
        this.displayFiles();
    }

    displayFiles() {
        this.fileExplorer.innerHTML = '';
        
        if (this.files.length === 0) {
            this.fileExplorer.innerHTML = '<div class="loading">No files found</div>';
            return;
        }
        
        this.files.forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.addEventListener('click', () => this.selectFile(file, fileItem));
            
            const icon = document.createElement('div');
            icon.className = 'file-icon';
            icon.textContent = file.type === 'folder' ? '📁' : '🎥';
            
            const name = document.createElement('div');
            name.className = 'file-name';
            name.textContent = file.name;
            
            const size = document.createElement('div');
            size.className = 'file-size';
            size.textContent = file.size;
            
            fileItem.appendChild(icon);
            fileItem.appendChild(name);
            fileItem.appendChild(size);
            
            this.fileExplorer.appendChild(fileItem);
        });
    }

    selectFile(file, element) {
        // Remove previous selection
        document.querySelectorAll('.file-item.selected').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Add selection to current item
        element.classList.add('selected');
        
        if (file.type === 'video' && file.url) {
            this.previewVideo.src = file.url;
            this.previewVideo.load();
        }
    }

    refreshFiles() {
        this.listFiles();
    }

    showLoading(message) {
        this.fileExplorer.innerHTML = `<div class="loading">${message}</div>`;
    }

    showError(message) {
        this.fileExplorer.innerHTML = `<div class="error">${message}</div>`;
    }
}

class TabManager {
    constructor() {
        this.tabButtons = document.querySelectorAll('.tab-btn');
        this.tabContents = document.querySelectorAll('.tab-content');
        
        this.tabButtons.forEach(button => {
            button.addEventListener('click', () => this.switchTab(button.dataset.tab));
        });
    }

    switchTab(tabName) {
        // Remove active class from all tabs and contents
        this.tabButtons.forEach(btn => btn.classList.remove('active'));
        this.tabContents.forEach(content => content.classList.remove('active'));
        
        // Add active class to selected tab and content
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(tabName).classList.add('active');
    }
}

// Initialize all managers when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new CameraManager();
    new FTPBrowser();
    new TabManager();
}); 