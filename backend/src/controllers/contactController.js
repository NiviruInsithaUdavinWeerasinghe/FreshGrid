const emailService = require('../services/emailService');

const sendContactMessage = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and message.' });
    }

    const success = await emailService.sendContactEmail(name, email, message);

    if (success) {
      res.status(200).json({ success: true, message: 'Message sent successfully.' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to send message. Please try again later.' });
    }
  } catch (error) {
    console.error('Error in sendContactMessage:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  sendContactMessage
};
