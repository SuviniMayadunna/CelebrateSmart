// Shared HTML wrapper
function layout(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>CelebrateSmart</title>
</head>
<body style="margin:0;padding:0;background:#f4f7f4;font-family:Inter,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f4;padding:40px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">
      <!-- Header -->
      <tr>
        <td style="background:linear-gradient(135deg,#0d3320,#1a5c38);padding:32px 40px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:0.5px;">CelebrateSmart</h1>
          <p style="margin:6px 0 0;color:#a8d5b8;font-size:13px;">Premium Event Planning</p>
        </td>
      </tr>
      <!-- Body -->
      <tr><td style="padding:40px;">
        ${body}
      </td></tr>
      <!-- Footer -->
      <tr>
        <td style="background:#f0f4f1;padding:24px 40px;text-align:center;border-top:1px solid #e0e8e2;">
          <p style="margin:0;color:#6b7c72;font-size:12px;">
            &copy; ${new Date().getFullYear()} CelebrateSmart. All rights reserved.<br/>
            This email was sent regarding your activity on CelebrateSmart.
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// ── Order Confirmation (payment succeeded) ────────────────────────────────────
export function orderConfirmationEmail(data: {
  customerName:     string;
  orderNumber:      string;
  totalAmount:      number;
  items:            { productName: string; quantity: number; unitPrice: number }[];
  eventName?:       string;
  deliveryAddress?: string;
}): { subject: string; html: string } {
  const itemRows = data.items.map(i => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #eef1ee;color:#1a2e22;font-size:14px;">${i.productName}</td>
      <td style="padding:10px 0;border-bottom:1px solid #eef1ee;color:#4a6355;font-size:14px;text-align:center;">×${i.quantity}</td>
      <td style="padding:10px 0;border-bottom:1px solid #eef1ee;color:#1a2e22;font-size:14px;text-align:right;font-weight:600;">$${(i.unitPrice * i.quantity).toLocaleString()}</td>
    </tr>`).join('');

  const body = `
    <h2 style="margin:0 0 8px;color:#0d3320;font-size:22px;">Payment Confirmed!</h2>
    <p style="margin:0 0 24px;color:#4a6355;font-size:15px;line-height:1.6;">
      Hi ${data.customerName}, your order has been paid successfully. Here's your receipt.
    </p>

    <div style="background:#f0f7f3;border-radius:8px;padding:20px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="color:#4a6355;font-size:13px;">Order Number</td>
          <td style="color:#0d3320;font-size:13px;font-weight:700;text-align:right;">#${data.orderNumber}</td>
        </tr>
        ${data.eventName ? `<tr><td style="color:#4a6355;font-size:13px;padding-top:8px;">Event</td><td style="color:#0d3320;font-size:13px;text-align:right;padding-top:8px;">${data.eventName}</td></tr>` : ''}
        ${data.deliveryAddress ? `<tr><td style="color:#4a6355;font-size:13px;padding-top:8px;">Delivery Address</td><td style="color:#0d3320;font-size:13px;text-align:right;padding-top:8px;">${data.deliveryAddress}</td></tr>` : ''}
      </table>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
      <tr>
        <th style="text-align:left;font-size:12px;color:#6b7c72;text-transform:uppercase;letter-spacing:0.5px;padding-bottom:8px;">Item</th>
        <th style="text-align:center;font-size:12px;color:#6b7c72;text-transform:uppercase;letter-spacing:0.5px;padding-bottom:8px;">Qty</th>
        <th style="text-align:right;font-size:12px;color:#6b7c72;text-transform:uppercase;letter-spacing:0.5px;padding-bottom:8px;">Amount</th>
      </tr>
      ${itemRows}
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
      <tr>
        <td style="color:#0d3320;font-size:16px;font-weight:700;">Total Paid</td>
        <td style="color:#1a5c38;font-size:20px;font-weight:700;text-align:right;">$${data.totalAmount.toLocaleString()}</td>
      </tr>
    </table>

    <p style="margin:24px 0 0;color:#4a6355;font-size:14px;line-height:1.6;">
      Our team will be in touch to confirm the details. We look forward to making your celebration unforgettable.
    </p>`;

  return {
    subject: `Order Confirmed — #${data.orderNumber} | CelebrateSmart`,
    html:    layout(body),
  };
}

// ── Admin: New Paid Order Alert ───────────────────────────────────────────────
export function adminNewOrderEmail(data: {
  orderNumber:  string;
  customerName: string;
  customerEmail: string;
  totalAmount:  number;
  items:        { productName: string; quantity: number; unitPrice: number }[];
  eventName?:   string;
}): { subject: string; html: string } {
  const itemRows = data.items.map(i => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #eef1ee;color:#1a2e22;font-size:14px;">${i.productName} ×${i.quantity}</td>
      <td style="padding:8px 0;border-bottom:1px solid #eef1ee;color:#1a2e22;font-size:14px;text-align:right;font-weight:600;">$${(i.unitPrice * i.quantity).toLocaleString()}</td>
    </tr>`).join('');

  const body = `
    <div style="display:inline-block;padding:6px 16px;border-radius:20px;background:#fff3cd;color:#856404;font-size:12px;font-weight:700;letter-spacing:0.5px;margin-bottom:16px;">
      🛎 NEW ORDER RECEIVED
    </div>
    <h2 style="margin:0 0 8px;color:#0d3320;font-size:22px;">Order #${data.orderNumber}</h2>
    <p style="margin:0 0 24px;color:#4a6355;font-size:15px;">A new paid order requires your attention.</p>

    <div style="background:#f0f7f3;border-radius:8px;padding:20px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="color:#4a6355;font-size:13px;">Customer</td>
          <td style="color:#0d3320;font-size:13px;font-weight:700;text-align:right;">${data.customerName}</td>
        </tr>
        <tr>
          <td style="color:#4a6355;font-size:13px;padding-top:8px;">Email</td>
          <td style="color:#0d3320;font-size:13px;text-align:right;padding-top:8px;">${data.customerEmail}</td>
        </tr>
        ${data.eventName ? `<tr><td style="color:#4a6355;font-size:13px;padding-top:8px;">Event</td><td style="color:#0d3320;font-size:13px;text-align:right;padding-top:8px;">${data.eventName}</td></tr>` : ''}
      </table>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      ${itemRows}
    </table>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="color:#0d3320;font-size:16px;font-weight:700;">Total Paid</td>
        <td style="color:#1a5c38;font-size:20px;font-weight:700;text-align:right;">$${data.totalAmount.toLocaleString()}</td>
      </tr>
    </table>

    <p style="margin:24px 0 0;color:#4a6355;font-size:13px;">
      Log in to the admin panel to update the order status and begin processing.
    </p>`;

  return {
    subject: `🛎 New Order — #${data.orderNumber} ($${data.totalAmount.toLocaleString()}) | CelebrateSmart`,
    html:    layout(body),
  };
}

// ── Event Countdown Reminder ─────────────────────────────────────────────────
export function eventReminderEmail(data: {
  customerName: string;
  eventName:    string;
  eventType:    string;
  eventDate:    string;
  venue:        string;
  daysUntil:    number;
}): { subject: string; html: string } {
  const isOneWeek = data.daysUntil >= 6;
  const badge = isOneWeek ? '📅 One Week to Go!' : '⏰ 3 Days to Go!';
  const badgeBg = isOneWeek ? '#dbeafe' : '#fef3c7';
  const badgeColor = isOneWeek ? '#1a4a8a' : '#92400e';

  const eventTypeLabel = data.eventType.replace('_', ' ').toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());

  const body = `
    <div style="display:inline-block;padding:6px 16px;border-radius:20px;background:${badgeBg};color:${badgeColor};font-size:12px;font-weight:700;letter-spacing:0.5px;margin-bottom:16px;">
      ${badge}
    </div>
    <h2 style="margin:0 0 8px;color:#0d3320;font-size:22px;">Your ${eventTypeLabel} is Almost Here!</h2>
    <p style="margin:0 0 24px;color:#4a6355;font-size:15px;line-height:1.6;">
      Hi ${data.customerName}, just a reminder that your event is coming up in <strong>${data.daysUntil} day${data.daysUntil !== 1 ? 's' : ''}</strong>.
    </p>

    <div style="background:#f0f7f3;border-radius:8px;padding:20px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="color:#4a6355;font-size:13px;">Event</td>
          <td style="color:#0d3320;font-size:13px;font-weight:700;text-align:right;">${data.eventName}</td>
        </tr>
        <tr>
          <td style="color:#4a6355;font-size:13px;padding-top:8px;">Date</td>
          <td style="color:#0d3320;font-size:13px;text-align:right;padding-top:8px;">📅 ${data.eventDate}</td>
        </tr>
        <tr>
          <td style="color:#4a6355;font-size:13px;padding-top:8px;">Venue</td>
          <td style="color:#0d3320;font-size:13px;text-align:right;padding-top:8px;">📍 ${data.venue || 'To be confirmed'}</td>
        </tr>
      </table>
    </div>

    <p style="margin:0 0 16px;color:#1a2e22;font-size:15px;line-height:1.7;background:#f8faf8;border-left:3px solid #2d7a50;padding:14px 18px;border-radius:0 8px 8px 0;">
      ${isOneWeek
        ? 'Now is a great time to review your event plan, confirm your guest list, and make sure all arrangements are in place.'
        : 'Please double-check your event plan, confirm all bookings, and make sure your venue is ready. Almost there!'}
    </p>

    <p style="margin:0;color:#4a6355;font-size:13px;line-height:1.6;">
      Log in to CelebrateSmart to view your full event plan and checklist.
    </p>`;

  return {
    subject: `${badge} Your "${data.eventName}" is in ${data.daysUntil} day${data.daysUntil !== 1 ? 's' : ''} | CelebrateSmart`,
    html:    layout(body),
  };
}

// ── 24-Hour Venue Confirmation ────────────────────────────────────────────────
export function venueConfirmationEmail(data: {
  customerName: string;
  eventName:    string;
  eventType:    string;
  eventDate:    string;
  eventTime:    string;
  venue:        string;
}): { subject: string; html: string } {
  const eventTypeLabel = data.eventType.replace('_', ' ').toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());

  const body = `
    <div style="display:inline-block;padding:6px 16px;border-radius:20px;background:#fce7f3;color:#9d174d;font-size:12px;font-weight:700;letter-spacing:0.5px;margin-bottom:16px;">
      📍 Venue Confirmation Required
    </div>
    <h2 style="margin:0 0 8px;color:#0d3320;font-size:22px;">Tomorrow is Your ${eventTypeLabel}!</h2>
    <p style="margin:0 0 24px;color:#4a6355;font-size:15px;line-height:1.6;">
      Hi ${data.customerName}, your big day is tomorrow! Please take a moment to confirm your venue is fully booked and ready.
    </p>

    <div style="background:#f0f7f3;border-radius:8px;padding:20px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="color:#4a6355;font-size:13px;">Event</td>
          <td style="color:#0d3320;font-size:13px;font-weight:700;text-align:right;">${data.eventName}</td>
        </tr>
        <tr>
          <td style="color:#4a6355;font-size:13px;padding-top:8px;">Date</td>
          <td style="color:#0d3320;font-size:13px;text-align:right;padding-top:8px;">📅 ${data.eventDate}</td>
        </tr>
        <tr>
          <td style="color:#4a6355;font-size:13px;padding-top:8px;">Time</td>
          <td style="color:#0d3320;font-size:13px;text-align:right;padding-top:8px;">🕐 ${data.eventTime}</td>
        </tr>
        <tr>
          <td style="color:#4a6355;font-size:13px;padding-top:8px;">Venue</td>
          <td style="color:#0d3320;font-size:13px;font-weight:700;text-align:right;padding-top:8px;">📍 ${data.venue || 'To be confirmed'}</td>
        </tr>
      </table>
    </div>

    <div style="background:#fff8e1;border-radius:8px;padding:18px;margin-bottom:24px;border-left:4px solid #f59e0b;">
      <p style="margin:0 0 10px;color:#92400e;font-size:14px;font-weight:700;">✅ Pre-Event Checklist</p>
      <ul style="margin:0;padding-left:18px;color:#1a2e22;font-size:14px;line-height:2;">
        <li>Confirm venue booking and access time</li>
        <li>Verify all vendors have the correct address</li>
        <li>Check that decorations and setup crew are scheduled</li>
        <li>Confirm final headcount with catering</li>
        <li>Have a contact number for each vendor ready</li>
      </ul>
    </div>

    <p style="margin:0;color:#4a6355;font-size:14px;line-height:1.6;">
      We wish you a wonderful celebration! Our team has everything prepared on our end.
    </p>`;

  return {
    subject: `📍 Tomorrow: Confirm Your Venue for "${data.eventName}" | CelebrateSmart`,
    html:    layout(body),
  };
}

// ── Order Status Update ───────────────────────────────────────────────────────
export function orderStatusEmail(data: {
  customerName: string;
  orderNumber:  string;
  status:       string;
  message:      string;
}): { subject: string; html: string } {
  const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
    PAID:             { label: 'Paid',             color: '#1a5c38', bg: '#e8f5ed' },
    PREPARING:        { label: 'Preparing',        color: '#1a4a8a', bg: '#dbeafe' },
    READY_FOR_PICKUP: { label: 'Ready for Pickup', color: '#6b21a8', bg: '#f3e8ff' },
    OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: '#92400e', bg: '#fef3c7' },
    DELIVERED:        { label: 'Delivered',        color: '#0d3320', bg: '#d4edda' },
    CANCELED:         { label: 'Canceled',         color: '#842029', bg: '#f8d7da' },
  };

  const style = STATUS_STYLE[data.status] ?? { label: data.status, color: '#1a2e22', bg: '#f0f4f1' };

  const body = `
    <h2 style="margin:0 0 8px;color:#0d3320;font-size:22px;">Order Update</h2>
    <p style="margin:0 0 24px;color:#4a6355;font-size:15px;">Hi ${data.customerName}, here's an update on your order.</p>

    <div style="background:#f0f7f3;border-radius:8px;padding:20px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="color:#4a6355;font-size:13px;">Order Number</td>
          <td style="color:#0d3320;font-size:13px;font-weight:700;text-align:right;">#${data.orderNumber}</td>
        </tr>
        <tr>
          <td style="color:#4a6355;font-size:13px;padding-top:8px;">New Status</td>
          <td style="text-align:right;padding-top:8px;">
            <span style="display:inline-block;padding:4px 12px;border-radius:20px;background:${style.bg};color:${style.color};font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">
              ${style.label}
            </span>
          </td>
        </tr>
      </table>
    </div>

    <p style="margin:0;color:#1a2e22;font-size:15px;line-height:1.7;background:#f8faf8;border-left:3px solid #2d7a50;padding:14px 18px;border-radius:0 8px 8px 0;">
      ${data.message}
    </p>

    <p style="margin:24px 0 0;color:#4a6355;font-size:13px;">
      Questions? Reply to this email or contact our support team.
    </p>`;

  return {
    subject: `Order ${style.label} — #${data.orderNumber} | CelebrateSmart`,
    html:    layout(body),
  };
}

// ── Cancellation & Refund ─────────────────────────────────────────────────────
export function cancellationEmail(data: {
  customerName:    string;
  eventName:       string;
  orderNumber:     string;
  totalPaid:       number;
  cancellationFee: number;
  refundAmount:    number;
}): { subject: string; html: string } {
  const fmt = (n: number) => `$${n.toFixed(2)}`;
  const body = `
    <h2 style="margin:0 0 6px;color:#1a2e22;font-size:22px;font-weight:700;">Booking Cancelled</h2>
    <p style="margin:0 0 24px;color:#4a6355;font-size:15px;">Hi ${data.customerName}, your booking has been cancelled and your refund is being processed.</p>

    <div style="background:#f8faf8;border:1px solid #d4e6da;border-radius:10px;padding:20px 24px;margin-bottom:24px;">
      <p style="margin:0 0 4px;color:#6b7c72;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;">Event</p>
      <p style="margin:0 0 16px;color:#1a2e22;font-size:16px;font-weight:600;">${data.eventName}</p>
      <p style="margin:0 0 4px;color:#6b7c72;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;">Order Number</p>
      <p style="margin:0;color:#1a2e22;font-size:15px;font-weight:500;">#${data.orderNumber}</p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:8px 0;color:#4a6355;font-size:14px;">Amount Paid</td>
        <td style="padding:8px 0;color:#1a2e22;font-size:14px;text-align:right;font-weight:600;">${fmt(data.totalPaid)}</td>
      </tr>
      <tr style="border-top:1px solid #e0e8e2;">
        <td style="padding:8px 0;color:#c0392b;font-size:14px;">Cancellation Fee (10%)</td>
        <td style="padding:8px 0;color:#c0392b;font-size:14px;text-align:right;font-weight:600;">−${fmt(data.cancellationFee)}</td>
      </tr>
      <tr style="border-top:2px solid #2d7a50;">
        <td style="padding:12px 0 0;color:#1a2e22;font-size:16px;font-weight:700;">Refund Amount</td>
        <td style="padding:12px 0 0;color:#2d7a50;font-size:18px;font-weight:700;text-align:right;">${fmt(data.refundAmount)}</td>
      </tr>
    </table>

    <p style="margin:0 0 12px;color:#1a2e22;font-size:14px;line-height:1.6;background:#fff8e1;border-left:3px solid #f59e0b;padding:14px 18px;border-radius:0 8px 8px 0;">
      Your refund of <strong>${fmt(data.refundAmount)}</strong> will be returned to your original payment method within <strong>3–5 business days</strong>, depending on your bank.
    </p>

    <p style="margin:0;color:#4a6355;font-size:13px;">
      Questions? Reply to this email or contact our support team.
    </p>`;

  return {
    subject: `Booking Cancelled — Refund of ${fmt(data.refundAmount)} Initiated | CelebrateSmart`,
    html:    layout(body),
  };
}
