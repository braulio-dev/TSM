# Camera Stream Manager with Email System

A comprehensive streaming management system with integrated email functionality, user authentication, and automatic stream notifications.

## Features

### 🔐 User Authentication
- User registration and login system
- JWT-based authentication
- Secure password hashing with bcrypt

### 📧 Email System
- Complete email functionality with inbox, sent items, and compose
- SMTP integration using Postfix
- Automatic email notifications when streams start
- Email suggestions with user autocomplete
- Mark emails as read/unread

### 📹 Live Streaming
- Multiple camera stream support
- HLS (HTTP Live Streaming) integration
- Real-time stream connection and management
- Automatic stream notifications to all users

### 📁 File Management
- FTP file browser for HLS directory
- File download functionality
- Directory navigation
- File type recognition

## System Architecture

The system consists of several Docker containers:

1. **Backend API** (`tsm-backend`) - Node.js/Express server handling authentication and email
2. **Frontend** (`camera-webapp`) - Vue.js application with nginx
3. **SMTP Server** (`smtp-server`) - Postfix email server
4. **Streaming Server** (`stream-server`) - Nginx-RTMP for live streaming
5. **FTP Server** (`ftp-server`) - File access and management

## Quick Start

### Prerequisites
- Docker and Docker Compose
- At least 2GB RAM
- Ports 80, 25, 1935, 8080, 21, 3001 available

### Installation

1. **Clone and navigate to the project directory**
   ```bash
   cd TSM
   ```

2. **Build and start all services**
   ```bash
   docker-compose up --build
   ```

3. **Access the application**
   - Open your browser and go to `http://localhost`
   - You'll be prompted to register or login

### First Time Setup

1. **Register a new account**
   - Enter your email and password
   - You'll be automatically logged in

2. **Start using the system**
   - **Streaming Tab**: Add cameras and connect to streams
   - **Files Tab**: Browse HLS files and recordings
   - **Email Tab**: Send emails and receive notifications

## Email System Usage

### Registration and Login
- When you first visit the site, you'll see a login/register modal
- Register with any email address and password
- The system will automatically log you in

### Email Features

#### Inbox
- View all received emails
- Unread emails are highlighted in yellow
- Click on an email to read it (automatically marks as read)
- Unread count shown in the Email tab badge

#### Compose Email
- Click "Compose" to write a new email
- Use the autocomplete feature to select recipients
- All registered users appear in the suggestion list
- Emails are sent via SMTP and stored in the database

#### Sent Items
- View all emails you've sent
- Click on any sent email to view details

### Stream Notifications
When someone starts a live stream:
1. The system automatically detects the stream connection
2. An email notification is sent to ALL registered users
3. The notification includes:
   - Stream name
   - Start time
   - Formatted HTML email with stream details

## Streaming Setup

### Starting a Stream
1. Go to the "Live Streaming" tab
2. Enter a stream name (e.g., "cam1", "office-camera")
3. Click "Connect"
4. The system will:
   - Attempt to connect to the HLS stream
   - Send email notifications to all users if successful

### Stream URL Format
Streams should be available at: `http://localhost:8080/hls/{stream-name}.m3u8`

### Publishing Streams (via RTMP)
You can publish streams to the RTMP server:
- **RTMP URL**: `rtmp://localhost:1935/live`
- **Stream Key**: Your chosen stream name (e.g., "cam1")

Example with OBS Studio:
- Server: `rtmp://localhost:1935/live`
- Stream Key: `cam1`

## Configuration

### Environment Variables
The backend supports these environment variables:

```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=3001
NODE_ENV=production
SMTP_HOST=smtp
SMTP_PORT=25
SMTP_USER=braulio@admin.com
SMTP_PASS=admin
```

### SMTP Configuration
The system uses Postfix for email delivery. The configuration supports:
- Internal email delivery between registered users
- External email delivery (if configured with proper relay)
- HTML and plain text emails

### Database
- Uses SQLite for simplicity and portability
- Database file: `server/database.sqlite`
- Automatic table creation on first run

## API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - User login

### Email
- `GET /api/emails/inbox` - Get user's inbox
- `GET /api/emails/sent` - Get user's sent emails
- `POST /api/emails/send` - Send new email
- `PUT /api/emails/:id/read` - Mark email as read

### Users
- `GET /api/users` - Get all users (for email suggestions)

### Notifications
- `POST /api/notify/stream-start` - Send stream start notification

## File Structure

```
TSM/
├── server/                 # Backend API
│   ├── server.js          # Main server file
│   ├── package.json       # Backend dependencies
│   └── Dockerfile         # Backend container config
├── src/                   # Frontend Vue.js app
│   ├── App.vue           # Main application component
│   ├── services/         # API service layers
│   │   ├── auth.js       # Authentication service
│   │   └── email.js      # Email service
│   └── main.js           # Vue app entry point
├── public/               # Static files
├── data/                 # Persistent data
│   └── hls/             # HLS stream files
├── videos/              # Video storage
├── docker-compose.yml   # Container orchestration
├── Dockerfile          # Frontend container config
├── webapp.nginx.conf   # Frontend nginx config
└── rtmp.nginx.conf     # Streaming server config
```

## Troubleshooting

### Email Issues
1. **Emails not sending**: Check SMTP container logs
   ```bash
   docker-compose logs smtp
   ```

2. **Users not receiving notifications**: Ensure they're registered and the backend can connect to SMTP

### Streaming Issues
1. **Stream not connecting**: Verify the HLS files exist in `/data/hls/`
2. **No notifications**: Check backend logs for SMTP connection errors

### Authentication Issues
1. **Can't login**: Check backend container logs
2. **Token errors**: Clear browser localStorage and re-login

### General Debugging
```bash
# View all container logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs webapp
docker-compose logs smtp

# Restart services
docker-compose restart
```

## Security Considerations

### Production Deployment
1. **Change JWT Secret**: Update `JWT_SECRET` environment variable
2. **Use HTTPS**: Configure SSL certificates
3. **Database Security**: Use proper database with authentication
4. **SMTP Security**: Configure proper SMTP relay with authentication
5. **Network Security**: Restrict port access and use firewalls

### Current Security Features
- Password hashing with bcrypt
- JWT token authentication
- CORS protection
- Rate limiting
- Input validation
- SQL injection protection (parameterized queries)

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review container logs
3. Ensure all ports are available
4. Verify Docker and Docker Compose versions

## License

This project is for internal use and development purposes. 