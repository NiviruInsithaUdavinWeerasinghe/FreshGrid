const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const sendWelcomeEmail = async (email, name) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to Fresh Club VIP!</title>
      <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
        .header { background-color: #059669; padding: 40px 20px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
        .content { padding: 40px 30px; color: #374151; line-height: 1.6; font-size: 16px; }
        .content h2 { color: #111827; font-size: 22px; margin-top: 0; }
        .cta-container { text-align: center; margin: 30px 0; }
        .cta-button { display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 9999px; font-weight: bold; font-size: 16px; transition: background-color 0.2s; }
        .cta-button:hover { background-color: #047857; }
        .features { background-color: #ecfdf5; border-radius: 12px; padding: 20px; margin: 30px 0; }
        .features p { margin: 10px 0; color: #065f46; font-weight: 500; }
        .footer { background-color: #f3f4f6; padding: 24px; text-align: center; color: #6b7280; font-size: 13px; border-top: 1px solid #e5e7eb; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🌱 FreshGrid</h1>
        </div>
        <div class="content">
          <h2>Welcome to Fresh Club VIP, ${name}!</h2>
          <p>We're absolutely thrilled to have you join our community. As a VIP member, you'll be the first to know about our freshest harvests, exclusive discounts, and special bundles straight from local farms to your door.</p>
          
          <div class="features">
            <p>✨ <strong>What to expect:</strong></p>
            <p>🚚 Exclusive Free Delivery Offers</p>
            <p>🍎 Early Access to Seasonal Produce</p>
            <p>🎁 Secret VIP-only Bundles</p>
          </div>

          <p>Thank you for supporting local farmers and sustainable agriculture. We can't wait to deliver the best nature has to offer right to your kitchen.</p>
          
          <div class="cta-container">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/shop" class="cta-button">Shop Fresh Now</a>
          </div>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} FreshGrid. All rights reserved.</p>
          <p>You received this email because you subscribed to Fresh Club VIP.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: '"FreshGrid" <' + process.env.GMAIL_USER + '>',
      to: email,
      subject: 'Welcome to Fresh Club VIP! 🎁',
      html: htmlContent,
    });
    console.log('Welcome email sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
};

const sendPromotionEmails = async (emails, offerData) => {
  if (!emails || emails.length === 0) return;

  let detailsHtml = '';
  if (offerData.offerType === 'DELIVERY_SUBSIDY_OR_WEIGHT') {
    detailsHtml = `
      <div style="background-color:#ecfdf5; border:1px solid #a7f3d0; border-radius:12px; padding:20px; margin:20px 0; text-align:left;">
        <h3 style="margin-top:0; color:#065f46;">Delivery Subsidy Offer</h3>
        <ul style="color:#065f46; margin:0; padding-left:20px;">
          ${offerData.config.waiveBaseFee ? '<li><strong>Free Base Delivery!</strong></li>' : ''}
          ${offerData.config.minCartValue ? `<li>Minimum Cart Value: <strong>Rs. ${offerData.config.minCartValue}</strong></li>` : ''}
          ${offerData.config.discountedWeightRate ? `<li>Discounted Weight Rate: <strong>Rs. ${offerData.config.discountedWeightRate}/kg</strong></li>` : ''}
        </ul>
      </div>
    `;
  } else if (offerData.offerType === 'MULTI_BUY') {
    const productName = offerData.config.targetProductId?.name || 'Select Products';
    const originalPrice = offerData.config.targetProductId?.price;
    detailsHtml = `
      <div style="background-color:#ecfdf5; border:1px solid #a7f3d0; border-radius:12px; padding:20px; margin:20px 0; text-align:left;">
        <h3 style="margin-top:0; color:#065f46;">Multi-Buy Discount</h3>
        <p style="margin:0; color:#065f46;">Buy at least <strong>${offerData.config.minQuantity}</strong> of <strong>${productName}</strong> and get it for <strong>Rs. ${offerData.config.discountedUnitPrice}</strong> each! <span style="text-decoration:line-through; color:#9ca3af; font-size:14px; margin-left:8px;">(Regularly Rs. ${originalPrice})</span></p>
      </div>
    `;
  } else if (offerData.offerType === 'BUNDLE_PACKAGE') {
    let originalTotal = 0;
    const productsList = (offerData.config.bundleProducts || []).map(bp => {
      const pName = bp.productId?.name || 'Product';
      const pPrice = bp.productId?.price || 0;
      originalTotal += pPrice * bp.quantity;
      return `<li>${bp.quantity}x ${pName} <span style="color:#9ca3af;">(Rs. ${pPrice} each)</span></li>`;
    }).join('');
    detailsHtml = `
      <div style="background-color:#ecfdf5; border:1px solid #a7f3d0; border-radius:12px; padding:20px; margin:20px 0; text-align:left;">
        <h3 style="margin-top:0; color:#065f46;">
          Bundle Package for Rs. ${offerData.config.bundlePackagePrice} 
          <span style="text-decoration:line-through; color:#9ca3af; font-size:16px; margin-left:8px; font-weight:normal;">(Value: Rs. ${originalTotal})</span>
        </h3>
        <ul style="color:#065f46; margin:0; padding-left:20px;">
          ${productsList}
        </ul>
      </div>
    `;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>FreshGrid Special Offer</title>
      <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .header { background-color: #059669; padding: 30px 20px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
        .hero-image { width: 100%; height: auto; max-height: 250px; object-fit: cover; }
        .content { padding: 40px 30px; color: #374151; line-height: 1.6; font-size: 16px; text-align: center; }
        .badge { display: inline-block; background-color: #ecfdf5; color: #059669; padding: 6px 12px; border-radius: 9999px; font-size: 14px; font-weight: bold; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px; }
        .title { color: #111827; font-size: 26px; font-weight: 800; margin: 0 0 16px 0; }
        .desc { color: #4b5563; font-size: 16px; margin-bottom: 30px; }
        .cta-container { text-align: center; margin: 30px 0; }
        .cta-button { display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 9999px; font-weight: bold; font-size: 16px; transition: background-color 0.2s; }
        .cta-button:hover { background-color: #047857; }
        .footer { background-color: #f3f4f6; padding: 24px; text-align: center; color: #6b7280; font-size: 13px; border-top: 1px solid #e5e7eb; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🌱 FreshGrid</h1>
        </div>
        ${offerData.config.image ? `<img src="${offerData.config.image}" alt="Special Offer" class="hero-image" />` : ''}
        <div class="content">
          <div class="badge">Special Offer</div>
          <h2 class="title">${offerData.title}</h2>
          <p class="desc">${offerData.config.description || 'Log in to your FreshGrid account to check out our latest special offer!'}</p>
          
          ${detailsHtml}

          <div class="cta-container">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/shop" class="cta-button">Claim Offer Now</a>
          </div>
        </div>
        <div class="footer">
          <p>Valid until ${new Date(offerData.validTo).toLocaleDateString()}</p>
          <p>© ${new Date().getFullYear()} FreshGrid. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: '"FreshGrid" <' + process.env.GMAIL_USER + '>',
      to: process.env.GMAIL_USER, // Send to yourself
      bcc: emails, // BCC to subscribers for privacy
      subject: '🔥 FreshGrid Special Offer: ' + offerData.title,
      html: htmlContent,
    });
    console.log('Promotion email sent to %d subscribers', emails.length);
    return true;
  } catch (error) {
    console.error('Error sending promotion emails:', error);
    return false;
  }
};

module.exports = {
  sendWelcomeEmail,
  sendPromotionEmails,
};
