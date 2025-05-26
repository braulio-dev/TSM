const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Database setup
const db = new sqlite3.Database('./database.sqlite');

// Initialize database tables
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Emails table
  db.run(`CREATE TABLE IF NOT EXISTS emails (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_user_id INTEGER,
    to_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_system BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (from_user_id) REFERENCES users (id)
  )`);

  // Received emails table (for inbox)
  db.run(`CREATE TABLE IF NOT EXISTS received_emails (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    from_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);
});

// Email transporter setup
const transporter = nodemailer.createTransport({
  host: 'smtp', // Docker service name
  port: 25,
  secure: false,
  auth: {
    user: 'braulio@admin.com',
    pass: 'admin'
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// User registration
app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user already exists
    db.get('SELECT id FROM users WHERE email = ?', [email], async (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (row) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user
      db.run('INSERT INTO users (email, password) VALUES (?, ?)', 
        [email, hashedPassword], 
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to create user' });
          }

          const token = jwt.sign({ id: this.lastID, email }, JWT_SECRET);
          res.json({ token, user: { id: this.lastID, email } });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// User login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
    res.json({ token, user: { id: user.id, email: user.email } });
  });
});

// Get user's received emails (inbox)
app.get('/api/emails/inbox', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM received_emails WHERE user_id = ? ORDER BY received_at DESC',
    [req.user.id],
    (err, emails) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(emails);
    }
  );
});

// Get user's sent emails
app.get('/api/emails/sent', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM emails WHERE from_user_id = ? AND from_user_id IS NOT NULL ORDER BY sent_at DESC',
    [req.user.id],
    (err, emails) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(emails);
    }
  );
});

// Send email
app.post('/api/emails/send', authenticateToken, async (req, res) => {
  try {
    const { to, subject, body } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'To, subject, and body are required' });
    }

    // Send email via SMTP
    const mailOptions = {
      from: req.user.email,
      to: to,
      subject: subject,
      text: body,
      html: `<p>${body.replace(/\n/g, '<br>')}</p>`
    };

    await transporter.sendMail(mailOptions);

    // Save to sent emails
    db.run(
      'INSERT INTO emails (from_user_id, to_email, subject, body) VALUES (?, ?, ?, ?)',
      [req.user.id, to, subject, body],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to save email' });
        }

        // Check if recipient is a registered user and add to their inbox
        db.get('SELECT id FROM users WHERE email = ?', [to], (err, recipient) => {
          if (!err && recipient) {
            db.run(
              'INSERT INTO received_emails (user_id, from_email, subject, body) VALUES (?, ?, ?, ?)',
              [recipient.id, req.user.email, subject, body],
              function(inboxErr) {
                if (inboxErr) {
                  console.error('Failed to add email to recipient inbox:', inboxErr);
                }
              }
            );
          } else {
            console.log(`Recipient ${to} not found in users table or database error:`, err);
          }
        });

        res.json({ message: 'Email sent successfully', id: this.lastID });
      }
    );
  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Mark email as read
app.put('/api/emails/:id/read', authenticateToken, (req, res) => {
  db.run(
    'UPDATE received_emails SET is_read = TRUE WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ message: 'Email marked as read' });
    }
  );
});

// Get all users (for admin purposes or email suggestions)
app.get('/api/users', authenticateToken, (req, res) => {
  db.all('SELECT id, email FROM users', (err, users) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(users);
  });
});

// Streaming notification endpoint
app.post('/api/notify/stream-start', authenticateToken, async (req, res) => {
  try {
    const { streamName } = req.body;

    if (!streamName) {
      return res.status(400).json({ error: 'Stream name is required' });
    }

    // Get all users
    db.all('SELECT email FROM users', async (err, users) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const subject = `🔴 Live Stream Started: ${streamName}`;
      const body = `A new live stream "${streamName}" has started! Join now to watch the live broadcast.`;

      // Send email to all users
      for (const user of users) {
        try {
          const mailOptions = {
            from: 'system@intranet.local',
            to: user.email,
            subject: subject,
            text: body,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #e74c3c;">🔴 Live Stream Started</h2>
                <p>A new live stream <strong>"${streamName}"</strong> has started!</p>
                <p>Join now to watch the live broadcast.</p>
                <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #e74c3c;">
                  <strong>Stream Name:</strong> ${streamName}<br>
                  <strong>Started:</strong> ${new Date().toLocaleString()}
                </div>
                <p style="color: #666; font-size: 12px;">This is an automated notification from the Camera Stream Manager.</p>
              </div>
            `
          };

          await transporter.sendMail(mailOptions);

          // Add to user's inbox if they're registered
          db.get('SELECT id FROM users WHERE email = ?', [user.email], (err, recipient) => {
            if (!err && recipient) {
              db.run(
                'INSERT INTO received_emails (user_id, from_email, subject, body) VALUES (?, ?, ?, ?)',
                [recipient.id, 'system@intranet.local', subject, body]
              );
            }
          });
        } catch (emailError) {
          console.error(`Failed to send email to ${user.email}:`, emailError);
        }
      }

      // Save system email record
      db.run(
        'INSERT INTO emails (from_user_id, to_email, subject, body, is_system) VALUES (?, ?, ?, ?, ?)',
        [null, 'all-users', subject, body, true]
      );

      res.json({ message: `Stream notification sent to ${users.length} users` });
    });
  } catch (error) {
    console.error('Stream notification error:', error);
    res.status(500).json({ error: 'Failed to send stream notifications' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// File browser endpoint
app.get('/api/files*', (req, res) => {
  const fs = require('fs');
  const pathModule = require('path');
  
  const basePath = '/opt/data/hls';
  let requestPath = req.path.replace('/api/files', '') || '/';
  
  // Normalize the path
  if (requestPath.startsWith('/data/hls')) {
    requestPath = requestPath.replace('/data/hls', '');
  }
  
  const fullPath = pathModule.join(basePath, requestPath);
  
  // Security check - ensure we don't go outside the base directory
  const realBasePath = fs.realpathSync(basePath);
  let realFullPath;
  
  try {
    realFullPath = fs.realpathSync(fullPath);
  } catch (error) {
    return res.status(404).json({ error: 'Directory not found' });
  }
  
  if (!realFullPath.startsWith(realBasePath)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  // Handle file download
  if (req.query.download === 'true') {
    try {
      if (fs.statSync(fullPath).isFile()) {
        const filename = pathModule.basename(fullPath);
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', fs.statSync(fullPath).size);
        
        const fileStream = fs.createReadStream(fullPath);
        fileStream.pipe(res);
        return;
      } else {
        return res.status(404).json({ error: 'File not found' });
      }
    } catch (error) {
      return res.status(404).json({ error: 'File not found' });
    }
  }
  
  // List directory contents
  try {
    const stats = fs.statSync(fullPath);
    if (!stats.isDirectory()) {
      return res.status(404).json({ error: 'Directory not found' });
    }
    
    const files = [];
    const items = fs.readdirSync(fullPath);
    
    for (const item of items) {
      if (item === '.' || item === '..') {
        continue;
      }
      
      const itemPath = pathModule.join(fullPath, item);
      const itemStats = fs.statSync(itemPath);
      const isDir = itemStats.isDirectory();
      
      files.push({
        name: item,
        type: isDir ? 'folder' : 'file',
        size: isDir ? 0 : itemStats.size,
        modified: itemStats.mtime.toISOString()
      });
    }
    
    // Sort: folders first, then files, both alphabetically
    files.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
    
    res.json({ files });
    
  } catch (error) {
    console.error('File listing error:', error);
    res.status(404).json({ error: 'Directory not found' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
}); 