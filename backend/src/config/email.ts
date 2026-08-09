import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

if (EMAIL_USER && EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS, // Typically a Gmail App Password
    },
  });
  console.log("✉️ Email service initialized successfully.");
} else {
  console.warn(
    "⚠️ Email service configuration is missing (EMAIL_USER & EMAIL_PASS). " +
    "Forgot Password emails will be logged to the console instead."
  );
}

/**
 * Sends a transactional email.
 * Falls back to console logging in development if transport configuration is missing.
 */
export const sendEmail = async (to: string, subject: string, htmlContent: string) => {
  if (!to) return;

  if (!transporter) {
    console.log(
      `[DEV EMAIL BYPASS] To: ${to}\n` +
      `  Subject: ${subject}\n` +
      `  Body (HTML):\n${htmlContent}`
    );
    return;
  }

  try {
    const mailOptions = {
      from: `"SithaMithuru Support" <${EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("📨 Email sent successfully:", info.messageId);
  } catch (error: any) {
    console.error("❌ Failed to send email:", error.message || error);
  }
};
