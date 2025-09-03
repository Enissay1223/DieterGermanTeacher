const twilio = require('twilio');

class MessageService {
  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }

  async sendMessage(phoneNumber, message) {
    try {
      if (typeof message === 'string') {
        await this.client.messages.create({
          body: message,
          from: 'whatsapp:+14155238886',
          to: phoneNumber
        });
      } else if (message && typeof message === 'object') {
        // Wenn message ein Objekt mit verschiedenen Sprachen ist
        const defaultLang = 'english';
        const text = message[defaultLang] || message.english || Object.values(message)[0] || 'Nachricht gesendet';
        await this.client.messages.create({
          body: text,
          from: 'whatsapp:+14155238886',
          to: phoneNumber
        });
      }
    } catch (error) {
      console.error('Fehler beim Senden der Nachricht:', error);
    }
  }
}

module.exports = { MessageService };

