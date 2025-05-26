import axios from 'axios';

const API_BASE_URL = '/api';

class EmailService {
  async getInbox() {
    try {
      const response = await axios.get(`${API_BASE_URL}/emails/inbox`);
      return { success: true, emails: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch inbox'
      };
    }
  }

  async getSentEmails() {
    try {
      const response = await axios.get(`${API_BASE_URL}/emails/sent`);
      return { success: true, emails: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch sent emails'
      };
    }
  }

  async sendEmail(to, subject, body) {
    try {
      const response = await axios.post(`${API_BASE_URL}/emails/send`, {
        to,
        subject,
        body
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to send email'
      };
    }
  }

  async markAsRead(emailId) {
    try {
      const response = await axios.put(`${API_BASE_URL}/emails/${emailId}/read`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to mark email as read'
      };
    }
  }

  async getUsers() {
    try {
      const response = await axios.get(`${API_BASE_URL}/users`);
      return { success: true, users: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch users'
      };
    }
  }

  async notifyStreamStart(streamName) {
    try {
      const response = await axios.post(`${API_BASE_URL}/notify/stream-start`, {
        streamName
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to send stream notification'
      };
    }
  }
}

export default new EmailService(); 