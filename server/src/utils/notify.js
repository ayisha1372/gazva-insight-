import nodemailer from 'nodemailer';
import { config } from '../config.js';

let transporter = null;
const enabled = () => !!(config.smtp.host && config.smtp.notifyTo);

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
    });
  }
  return transporter;
}

const LABELS = { contact: 'New contact form message', question: 'New question', comment: 'New article comment' };

/** Email the editors about a new submission (replaces the old Web3Forms emails). Never throws. */
export async function notifyNewMessage(m) {
  if (!enabled()) return;
  try {
    const lines = [
      `From: ${m.name} <${m.email}>`,
      m.phone ? `Phone: ${m.phone}` : null,
      m.category ? `Category: ${m.category}` : null,
      m.article_title ? `Article: ${m.article_title}` : null,
      m.subject ? `Subject: ${m.subject}` : null,
      '',
      m.message,
    ].filter((l) => l !== null);
    await getTransporter().sendMail({
      from: config.smtp.from,
      to: config.smtp.notifyTo,
      replyTo: m.email,
      subject: `${LABELS[m.type] || 'New message'} — Gazva Insight`,
      text: lines.join('\n'),
    });
  } catch (err) {
    console.error('[notify] email failed:', err.message);
  }
}
