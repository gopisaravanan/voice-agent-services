const nodemailer = require('nodemailer');
const cron = require('node-cron');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

/**
 * Generate HTML email template
 * @param {Object} summary - Summary object with bullets and nextStep
 * @param {string} transcript - Original transcript
 * @returns {string} - HTML email content
 */
function generateEmailTemplate(summary, transcript) {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .container {
      background-color: #ffffff;
      border-radius: 10px;
      padding: 30px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 8px 8px 0 0;
      margin: -30px -30px 30px -30px;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .section {
      margin: 25px 0;
    }
    .section-title {
      color: #667eea;
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 15px;
      border-bottom: 2px solid #667eea;
      padding-bottom: 5px;
    }
    .bullets {
      list-style: none;
      padding: 0;
    }
    .bullets li {
      padding: 10px 0;
      padding-left: 30px;
      position: relative;
    }
    .bullets li:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #667eea;
      font-weight: bold;
      font-size: 18px;
    }
    .next-step {
      background-color: #f0f4ff;
      border-left: 4px solid #667eea;
      padding: 15px 20px;
      margin: 20px 0;
      border-radius: 4px;
      font-weight: 500;
    }
    .transcript-section {
      background-color: #f9f9f9;
      padding: 15px;
      border-radius: 5px;
      margin: 20px 0;
      font-size: 14px;
      color: #666;
      max-height: 200px;
      overflow-y: auto;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      text-align: center;
      color: #999;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎙️ Voice Conversation Summary</h1>
    </div>
    
    <div class="section">
      <div class="section-title">Key Points</div>
      <ul class="bullets">
        ${summary.bullets.map(bullet => `<li>${bullet}</li>`).join('')}
      </ul>
    </div>
    
    <div class="section">
      <div class="section-title">Next Step</div>
      <div class="next-step">
        ${summary.nextStep}
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">Full Transcript</div>
      <div class="transcript-section">
        ${transcript}
      </div>
    </div>
    
    <div class="footer">
      <p>Generated on ${currentDate}</p>
      <p>Voice Agent System</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Send email immediately
 * @param {string} toEmail - Recipient email address
 * @param {Object} summary - Summary object
 * @param {string} transcript - Original transcript
 * @returns {Promise<Object>} - Email send result
 */
async function sendEmail(toEmail, summary, transcript) {
  try {
    console.log(`Sending email to ${toEmail}...`);
    
    const htmlContent = generateEmailTemplate(summary, transcript);
    
    const mailOptions = {
      from: `"Voice Agent" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject: `Voice Conversation Summary - ${new Date().toLocaleDateString()}`,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Email send error:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

/**
 * Schedule email for later delivery
 * @param {string} toEmail - Recipient email address
 * @param {Object} summary - Summary object
 * @param {string} transcript - Original transcript
 * @param {string} scheduleOption - Delay option ('5min', '1hour', '1day')
 * @returns {Object} - Scheduled job info
 */
function scheduleEmail(toEmail, summary, transcript, scheduleOption) {
  const delayOptions = {
    '5min': { delay: 5 * 60 * 1000, label: '5 minutes' },
    '1hour': { delay: 60 * 60 * 1000, label: '1 hour' },
    '1day': { delay: 24 * 60 * 60 * 1000, label: '1 day' }
  };

  const option = delayOptions[scheduleOption];
  if (!option) {
    throw new Error('Invalid schedule option');
  }

  const scheduledTime = new Date(Date.now() + option.delay);
  
  console.log(`Scheduling email for ${scheduledTime.toISOString()}`);

  // Schedule using setTimeout (for simplicity in MVP)
  setTimeout(async () => {
    try {
      await sendEmail(toEmail, summary, transcript);
      console.log(`Scheduled email sent to ${toEmail}`);
    } catch (error) {
      console.error('Failed to send scheduled email:', error);
    }
  }, option.delay);

  return {
    success: true,
    scheduled: true,
    scheduledTime: scheduledTime.toISOString(),
    delay: option.label
  };
}

/**
 * Verify email configuration
 * @returns {Promise<boolean>} - True if configuration is valid
 */
async function verifyEmailConfig() {
  try {
    await transporter.verify();
    console.log('Email configuration verified successfully');
    return true;
  } catch (error) {
    console.error('Email configuration verification failed:', error);
    return false;
  }
}

module.exports = {
  sendEmail,
  scheduleEmail,
  verifyEmailConfig,
  generateEmailTemplate
};
