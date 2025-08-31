function createMessageService(twilioClient) {
  async function sendMessage(phoneNumber, message) {
    await twilioClient.messages.create({ body: message, from: 'whatsapp:+14155238886', to: phoneNumber });
  }
  return { sendMessage };
}

module.exports = { createMessageService };

