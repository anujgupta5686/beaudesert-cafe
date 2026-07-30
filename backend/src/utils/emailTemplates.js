/**
 * Shared branded email chrome with CSS-animated coffee cup logo.
 */
const emailChrome = {
  logoSvg: `
    <div style="text-align:center;margin-bottom:8px;">
      <svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <style>
            @keyframes steam {
              0% { opacity: 0; transform: translateY(6px); }
              40% { opacity: 0.9; }
              100% { opacity: 0; transform: translateY(-10px); }
            }
            .steam { animation: steam 2.2s ease-in-out infinite; }
            .steam2 { animation-delay: 0.4s; }
            .steam3 { animation-delay: 0.8s; }
          </style>
        </defs>
        <rect width="64" height="64" rx="16" fill="#b45309"/>
        <ellipse class="steam" cx="28" cy="18" rx="2" ry="4" fill="#fef3c7" opacity="0.8"/>
        <ellipse class="steam steam2" cx="34" cy="16" rx="2" ry="5" fill="#fef3c7" opacity="0.7"/>
        <ellipse class="steam steam3" cx="40" cy="18" rx="2" ry="4" fill="#fef3c7" opacity="0.6"/>
        <path d="M18 28h24a4 4 0 0 1 4 4v10a10 10 0 0 1-10 10H24a10 10 0 0 1-10-10V32a4 4 0 0 1 4-4z" fill="#fff7ed"/>
        <path d="M46 32h4a6 6 0 0 1 0 12h-4" fill="none" stroke="#fff7ed" stroke-width="3" stroke-linecap="round"/>
        <ellipse cx="32" cy="34" rx="10" ry="3" fill="#b45309" opacity="0.25"/>
      </svg>
    </div>
  `,

  wrap({ title, preheader = '', bodyHtml, footerNote = '' }) {
    const year = new Date().getFullYear();
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <!--[if mso]><style>body,table,td{font-family:Arial,sans-serif!important}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
          <tr>
            <td style="background:linear-gradient(135deg,#b45309,#d97706);padding:28px 24px;text-align:center;">
              ${this.logoSvg}
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;letter-spacing:0.3px;">Beaudesert Cafe</h1>
              <p style="margin:6px 0 0;color:#fef3c7;font-size:13px;">Cafe &amp; Restaurant</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 24px;">
              <h2 style="margin:0 0 16px;color:#18181b;font-size:20px;">${title}</h2>
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px 28px;border-top:1px solid #f4f4f5;text-align:center;">
              ${footerNote ? `<p style="margin:0 0 8px;color:#71717a;font-size:13px;">${footerNote}</p>` : ''}
              <p style="margin:0;color:#a1a1aa;font-size:12px;">© ${year} Beaudesert Cafe. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  },

  button(href, label) {
    return `<a href="${href}" style="display:inline-block;background:#b45309;color:#ffffff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:14px;margin-top:8px;">${label}</a>`;
  },

  infoBox(html, bg = '#fef3c7') {
    return `<div style="background:${bg};padding:16px;border-radius:12px;margin:16px 0;">${html}</div>`;
  },
};

module.exports = emailChrome;
