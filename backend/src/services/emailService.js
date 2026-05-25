const sgMail = require('@sendgrid/mail');
const dotenv = require('dotenv');

dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const FROM = { email: process.env.GMAIL_USER, name: 'FreshGrid' };

// ─── Shared Design Tokens ───────────────────────────────────────────────────────
const green      = '#059669';
const greenDark  = '#047857';
const greenLight = '#ecfdf5';
const greenMid   = '#d1fae5';
const textDark   = '#111827';
const textMid    = '#374151';
const textLight  = '#6b7280';
const bgPage     = '#f0fdf4';
const bgCard     = '#ffffff';

const baseStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: ${bgPage}; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
  .wrapper { background-color: ${bgPage}; padding: 40px 16px; }
  .card { max-width: 600px; margin: 0 auto; background: ${bgCard}; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(5,150,105,0.12), 0 4px 16px rgba(0,0,0,0.06); }
  .header { background: linear-gradient(135deg, #059669 0%, #047857 50%, #065f46 100%); padding: 48px 32px 40px; text-align: center; position: relative; }
  .header-logo { font-size: 36px; margin-bottom: 8px; }
  .header-brand { color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; margin: 0; }
  .header-tagline { color: rgba(255,255,255,0.8); font-size: 13px; margin-top: 6px; letter-spacing: 1px; text-transform: uppercase; }
  .body { padding: 48px 40px; }
  .badge { display: inline-block; background: ${greenLight}; color: ${green}; border: 1px solid ${greenMid}; font-size: 12px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; padding: 6px 14px; border-radius: 999px; margin-bottom: 24px; }
  .heading { font-size: 26px; font-weight: 800; color: ${textDark}; line-height: 1.25; margin-bottom: 16px; }
  .subheading { font-size: 16px; color: ${textMid}; line-height: 1.7; margin-bottom: 24px; }
  .divider { height: 1px; background: linear-gradient(90deg, transparent, ${greenMid}, transparent); margin: 32px 0; }
  .btn-wrap { text-align: center; margin: 36px 0; }
  .btn { display: inline-block; background: linear-gradient(135deg, ${green}, ${greenDark}); color: #ffffff !important; text-decoration: none; padding: 16px 40px; border-radius: 999px; font-size: 16px; font-weight: 700; letter-spacing: 0.3px; box-shadow: 0 8px 24px rgba(5,150,105,0.35); }
  .feature-box { background: linear-gradient(135deg, ${greenLight}, #f0fdf4); border: 1px solid ${greenMid}; border-radius: 16px; padding: 28px; margin: 28px 0; }
  .feature-title { font-size: 14px; font-weight: 700; color: ${green}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; }
  .feature-item { display: flex; align-items: flex-start; margin-bottom: 12px; }
  .feature-icon { font-size: 18px; margin-right: 12px; flex-shrink: 0; }
  .feature-text { font-size: 15px; color: #065f46; font-weight: 500; line-height: 1.4; }
  .fallback-link { font-size: 12px; color: ${textLight}; line-height: 1.6; text-align: center; word-break: break-all; }
  .fallback-link a { color: ${green}; }
  .footer { background: #f9fafe; border-top: 1px solid #e5e7eb; padding: 28px 40px; text-align: center; }
  .footer p { font-size: 12px; color: ${textLight}; line-height: 1.8; }
  .footer a { color: ${green}; text-decoration: none; }
  .stat-row { display: flex; gap: 12px; margin: 24px 0; }
  .stat-box { flex: 1; background: ${greenLight}; border-radius: 12px; padding: 16px; text-align: center; }
  .stat-num { font-size: 22px; font-weight: 800; color: ${green}; }
  .stat-lbl { font-size: 11px; color: #065f46; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }
  .offer-card { border: 2px solid ${greenMid}; border-radius: 16px; padding: 24px; margin: 20px 0; text-align: left; }
  .offer-label { font-size: 11px; font-weight: 700; color: ${green}; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px; }
  .offer-name { font-size: 20px; font-weight: 800; color: ${textDark}; margin-bottom: 8px; }
  .offer-detail { font-size: 14px; color: ${textMid}; line-height: 1.6; }
  .price-highlight { font-size: 28px; font-weight: 800; color: ${green}; }
  .price-original { font-size: 16px; color: ${textLight}; text-decoration: line-through; margin-left: 8px; }
`;

// ─── Welcome Email ──────────────────────────────────────────────────────────────

const sendWelcomeEmail = async (email, name) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Welcome to Fresh Club VIP</title>
<style>${baseStyles}</style></head>
<body>
<div class="wrapper">
  <div class="card">
    <div class="header">
      <div class="header-logo">🌱</div>
      <h1 class="header-brand">FreshGrid</h1>
      <p class="header-tagline">Farm to Table · Sri Lanka</p>
    </div>
    <div class="body">
      <div class="badge">🎉 VIP Member</div>
      <h2 class="heading">You're officially in the club, ${name}!</h2>
      <p class="subheading">Welcome to <strong>Fresh Club VIP</strong> — your passport to the freshest produce, exclusive deals, and farm-to-table magic delivered straight to your door.</p>

      <div class="divider"></div>

      <div class="feature-box">
        <div class="feature-title">✨ Your VIP Benefits</div>
        <div class="feature-item">
          <span class="feature-icon">🚚</span>
          <span class="feature-text"><strong>Free Delivery Offers</strong> — exclusive subsidized delivery just for members</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">🍎</span>
          <span class="feature-text"><strong>Early Harvest Access</strong> — be first to grab seasonal produce before it sells out</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">🎁</span>
          <span class="feature-text"><strong>Secret VIP Bundles</strong> — members-only curated bundles at unbeatable prices</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">⚡</span>
          <span class="feature-text"><strong>Flash Sale Priority</strong> — get notified first when limited offers drop</span>
        </div>
      </div>

      <div class="btn-wrap">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/shop" class="btn">Start Shopping Fresh →</a>
      </div>

      <p style="font-size:13px; color:${textLight}; text-align:center; line-height:1.6;">Thank you for supporting local Sri Lankan farmers and sustainable agriculture. 🌿</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} FreshGrid · Farm to Table Sri Lanka</p>
      <p style="margin-top:6px;">You're receiving this because you joined <strong>Fresh Club VIP</strong>.</p>
    </div>
  </div>
</div>
</body></html>`;

  try {
    await sgMail.send({ from: FROM, to: email, subject: '🎉 Welcome to Fresh Club VIP — You\'re in!', html });
    console.log('[EMAIL] Welcome email sent to:', email);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error?.response?.body || error.message);
    return false;
  }
};

// ─── Promotion Email ────────────────────────────────────────────────────────────

const sendPromotionEmails = async (emails, offerData) => {
  if (!emails || emails.length === 0) return;

  let offerDetailHtml = '';

  if (offerData.offerType === 'DELIVERY_SUBSIDY_OR_WEIGHT') {
    const perks = [];
    if (offerData.config.waiveBaseFee) perks.push(`<div class="feature-item"><span class="feature-icon">🚚</span><span class="feature-text"><strong>Free Base Delivery Fee</strong> — waived completely!</span></div>`);
    if (offerData.config.minCartValue) perks.push(`<div class="feature-item"><span class="feature-icon">🛒</span><span class="feature-text">Minimum cart value: <strong>Rs. ${offerData.config.minCartValue}</strong></span></div>`);
    if (offerData.config.discountedWeightRate) perks.push(`<div class="feature-item"><span class="feature-icon">⚖️</span><span class="feature-text">Discounted weight rate: <strong>Rs. ${offerData.config.discountedWeightRate}/kg</strong></span></div>`);
    offerDetailHtml = `
      <div class="offer-card">
        <div class="offer-label">🚚 Delivery Subsidy Offer</div>
        ${perks.join('')}
      </div>`;
  } else if (offerData.offerType === 'MULTI_BUY') {
    const productName = offerData.config.targetProductId?.name || 'Select Products';
    const originalPrice = offerData.config.targetProductId?.price;
    offerDetailHtml = `
      <div class="offer-card">
        <div class="offer-label">📦 Multi-Buy Deal</div>
        <div class="offer-name">${productName}</div>
        <div style="margin: 12px 0;">
          <span class="price-highlight">Rs. ${offerData.config.discountedUnitPrice}</span>
          ${originalPrice ? `<span class="price-original">Rs. ${originalPrice}</span>` : ''}
          <span style="font-size:13px; color:${textMid}"> per unit</span>
        </div>
        <div class="offer-detail">Buy at least <strong>${offerData.config.minQuantity} units</strong> to unlock this exclusive price.</div>
      </div>`;
  } else if (offerData.offerType === 'BUNDLE_PACKAGE') {
    let originalTotal = 0;
    const productsList = (offerData.config.bundleProducts || []).map(bp => {
      const pName = bp.productId?.name || 'Product';
      const pPrice = bp.productId?.price || 0;
      originalTotal += pPrice * bp.quantity;
      return `<div class="feature-item"><span class="feature-icon">🌿</span><span class="feature-text">${bp.quantity}× <strong>${pName}</strong> <span style="color:${textLight}">(Rs. ${pPrice} each)</span></span></div>`;
    }).join('');
    const savings = originalTotal - offerData.config.bundlePackagePrice;
    offerDetailHtml = `
      <div class="offer-card">
        <div class="offer-label">🎁 Bundle Package</div>
        <div style="margin-bottom:16px;">
          <span class="price-highlight">Rs. ${offerData.config.bundlePackagePrice}</span>
          <span class="price-original">Rs. ${originalTotal}</span>
        </div>
        ${savings > 0 ? `<div style="display:inline-block; background:#fef3c7; color:#92400e; padding:4px 12px; border-radius:999px; font-size:12px; font-weight:700; margin-bottom:16px;">Save Rs. ${savings}!</div>` : ''}
        <div class="feature-title" style="margin-bottom:12px;">What's in the bundle:</div>
        ${productsList}
      </div>`;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>FreshGrid Special Offer</title>
<style>${baseStyles}</style></head>
<body>
<div class="wrapper">
  <div class="card">
    <div class="header">
      ${offerData.config.image ? `<img src="${offerData.config.image}" alt="${offerData.title}" style="width:100%;max-height:220px;object-fit:cover;border-radius:0;display:block;margin-bottom:24px;" />` : ''}
      <div class="header-logo">🔥</div>
      <h1 class="header-brand">Special Offer</h1>
      <p class="header-tagline">Exclusive for Fresh Club VIP Members</p>
    </div>
    <div class="body" style="text-align:center;">
      <div class="badge">⚡ Limited Time</div>
      <h2 class="heading">${offerData.title}</h2>
      <p class="subheading">${offerData.config.description || 'An exclusive offer just for FreshGrid VIP members. Don\'t miss out!'}</p>

      ${offerDetailHtml}

      <div class="divider"></div>

      <p style="font-size:14px; color:${textLight}; margin-bottom:24px;">⏰ Valid until <strong style="color:${textDark};">${new Date(offerData.validTo).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })}</strong></p>

      <div class="btn-wrap">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/shop" class="btn">Claim This Offer →</a>
      </div>

      <p style="font-size:12px; color:${textLight};">Log into your FreshGrid account to apply this offer at checkout.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} FreshGrid · Farm to Table Sri Lanka</p>
      <p style="margin-top:6px;">You're receiving this as a <strong>Fresh Club VIP</strong> member.</p>
    </div>
  </div>
</div>
</body></html>`;

  try {
    await sgMail.send({
      from: FROM,
      to: process.env.GMAIL_USER,
      bcc: emails,
      subject: `🔥 FreshGrid VIP Offer: ${offerData.title}`,
      html,
    });
    console.log('[EMAIL] Promotion email sent to %d subscribers', emails.length);
    return true;
  } catch (error) {
    console.error('Error sending promotion emails:', error?.response?.body || error.message);
    return false;
  }
};

// ─── Verification Email ─────────────────────────────────────────────────────────

const sendVerificationEmail = async (email, name, verificationUrl) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Verify your FreshGrid Account</title>
<style>${baseStyles}
.steps { counter-reset: step; margin: 24px 0; }
.step  { display: flex; align-items: flex-start; margin-bottom: 14px; }
.step-num { width: 28px; height: 28px; min-width: 28px; background: ${green}; color: #fff; border-radius: 50%; font-size: 13px; font-weight: 700; text-align: center; line-height: 28px; display: inline-block; margin-right: 14px; vertical-align: middle; }
.step-text { font-size: 14px; color: ${textMid}; line-height: 1.5; padding-top: 4px; }
</style></head>
<body>
<div class="wrapper">
  <div class="card">
    <div class="header">
      <div class="header-logo">🌱</div>
      <h1 class="header-brand">FreshGrid</h1>
      <p class="header-tagline">Verify your account</p>
    </div>
    <div class="body" style="text-align:center;">
      <div class="badge">✉️ Email Verification</div>
      <h2 class="heading">Hello, ${name}! 👋</h2>
      <p class="subheading">You're almost there! Just one click to verify your email address and unlock your FreshGrid account.</p>

      <div class="btn-wrap">
        <a href="${verificationUrl}" class="btn">✅ Verify My Email Address</a>
      </div>

      <div class="divider"></div>

      <div class="feature-box" style="text-align:left;">
        <div class="feature-title">What happens next?</div>
        <div class="steps">
          <div class="step"><div class="step-num">1</div><div class="step-text">Click the button above to verify your email</div></div>
          <div class="step"><div class="step-num">2</div><div class="step-text">You'll be redirected back to login automatically</div></div>
          <div class="step"><div class="step-num">3</div><div class="step-text">Start browsing fresh produce from local farms 🥬</div></div>
        </div>
      </div>

      <div class="divider"></div>

      <div class="fallback-link">
        <p>Button not working? Copy and paste this link into your browser:</p>
        <p style="margin-top:8px;"><a href="${verificationUrl}">${verificationUrl}</a></p>
        <p style="margin-top:12px; color:#9ca3af;">This link expires in <strong>24 hours</strong>.</p>
      </div>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} FreshGrid · Farm to Table Sri Lanka</p>
      <p style="margin-top:6px;">If you didn't create an account, you can safely ignore this email.</p>
    </div>
  </div>
</div>
</body></html>`;

  try {
    await sgMail.send({
      from: FROM,
      to: email,
      subject: '✅ Verify your FreshGrid Account',
      html,
    });
    console.log('[EMAIL] Verification email sent to:', email);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error?.response?.body || error.message);
    return false;
  }
};

// ─── Contact Admin Email ────────────────────────────────────────────────────────

const sendContactEmail = async (name, email, message) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>New Contact Message</title>
<style>${baseStyles}</style></head>
<body>
<div class="wrapper">
  <div class="card">
    <div class="header">
      <div class="header-logo">📨</div>
      <h1 class="header-brand">New Contact Message</h1>
      <p class="header-tagline">From FreshGrid Website</p>
    </div>
    <div class="body">
      <div class="badge">New Inquiry</div>
      <h2 class="heading">Message from ${name}</h2>
      
      <div class="feature-box" style="text-align:left;">
        <div class="feature-title">Sender Details</div>
        <div class="feature-item"><span class="feature-icon">👤</span><span class="feature-text"><strong>Name:</strong> ${name}</span></div>
        <div class="feature-item"><span class="feature-icon">📧</span><span class="feature-text"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></span></div>
      </div>

      <div class="divider"></div>
      
      <h3 style="font-size: 16px; color: #374151; margin-bottom: 12px; font-weight: 700;">Message Content:</h3>
      <div style="background: #f9fafe; border-left: 4px solid #059669; padding: 16px; font-size: 15px; color: #111827; line-height: 1.6; border-radius: 4px; white-space: pre-wrap;">${message}</div>

    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} FreshGrid System</p>
      <p style="margin-top:6px;">You can reply directly to this email to respond to the user.</p>
    </div>
  </div>
</div>
</body></html>`;

  try {
    await sgMail.send({
      from: FROM,
      to: process.env.GMAIL_USER,
      replyTo: email,
      subject: `New Contact Message from ${name}`,
      html,
    });
    console.log('[EMAIL] Contact email sent from:', email);
    return true;
  } catch (error) {
    console.error('Error sending contact email:', error?.response?.body || error.message);
    return false;
  }
};

module.exports = {
  sendWelcomeEmail,
  sendPromotionEmails,
  sendVerificationEmail,
  sendContactEmail,
};
