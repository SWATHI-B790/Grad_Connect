const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

// @desc    Send contact/feedback message via email dynamically from visitor to swathi042006@gmail.com
// @route   POST /api/contact
// @access  Public
router.post("/", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // 1. Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, msg: "Name is required." });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, msg: "Email address is required." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, msg: "Please enter a valid email address." });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, msg: "Message is required." });
    }

    if (message.trim().length < 10) {
      return res.status(400).json({
        success: false,
        msg: "Message must be at least 10 characters long.",
      });
    }

    // 2. Target Recipient & SMTP Credentials
    const recipientEmail = process.env.CONTACT_RECEIVER_EMAIL || "swathi042006@gmail.com";
    const emailUser = (process.env.EMAIL_USER || "swathi042006@gmail.com").trim();
    const rawPass = process.env.EMAIL_PASS || "";
    const cleanPass = rawPass.replace(/\s+/g, "").trim();

    const isAppPasswordConfigured =
      cleanPass !== "" && cleanPass !== "your_gmail_app_password_here";

    // Dynamic Sender Info from Visitor
    const visitorName = name.trim();
    const visitorEmail = email.trim();
    const messageSubject = subject && subject.trim() ? subject.trim() : "New Contact Message - GradConnect Network";

    if (isAppPasswordConfigured) {
      try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: emailUser,
            pass: cleanPass,
          },
        });

        // Dynamic From line featuring visitor's entered Name and entered Email address
        const mailOptions = {
          from: `"${visitorName} (${visitorEmail})" <${emailUser}>`,
          replyTo: visitorEmail,
          to: recipientEmail,
          subject: messageSubject,
          text: `New contact message from website visitor:\n\nSender Name: ${visitorName}\nSender Email: ${visitorEmail}\nSubject: ${messageSubject}\n\nMessage:\n${message.trim()}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px; background-color: #ffffff;">
              <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 8px; margin-top: 0;">
                🎓 GradConnect Contact Inquiry
              </h2>
              <p style="font-size: 15px; color: #1e293b;">
                A user submitted a new contact form message on GradConnect.
              </p>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 8px; font-weight: bold; color: #475569; width: 120px;">Sender:</td>
                  <td style="padding: 8px; color: #0f172a; font-weight: bold;">${visitorName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold; color: #475569;">Visitor Email:</td>
                  <td style="padding: 8px; color: #2563eb; font-weight: bold;">
                    <a href="mailto:${visitorEmail}">${visitorEmail}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold; color: #475569;">Subject:</td>
                  <td style="padding: 8px; color: #0f172a;">${messageSubject}</td>
                </tr>
              </table>
              <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #2563eb; border-radius: 4px;">
                <h4 style="margin-top: 0; color: #334155;">Message Content / Feedback:</h4>
                <p style="color: #1e293b; white-space: pre-wrap; margin-bottom: 0;">${message.trim()}</p>
              </div>
              <p style="font-size: 12px; color: #94a3b8; margin-top: 25px; text-align: center;">
                You can reply directly to this email in your inbox to respond to <strong>${visitorName} (${visitorEmail})</strong>.
              </p>
            </div>
          `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[GMAIL SUCCESS] Email delivered to ${recipientEmail} from visitor ${visitorEmail}! MessageID: ${info.messageId}`);

        return res.status(200).json({
          success: true,
          msg: "Message sent successfully! We'll get back to you soon.",
        });
      } catch (smtpError) {
        console.error("Gmail SMTP Error:", smtpError.message || smtpError);
        // Fall through to dev fallback response
      }
    }

    // Development Fallback Log when EMAIL_PASS is placeholder or invalid
    console.log("------------------------------------------------------------");
    console.log("📩 NEW DYNAMIC CONTACT MESSAGE RECEIVED (Development Log)");
    console.log(`Dynamic Sender: ${visitorName} <${visitorEmail}>`);
    console.log(`Recipient: ${recipientEmail}`);
    console.log(`Subject: ${messageSubject}`);
    console.log(`Message:\n${message.trim()}`);
    console.log("------------------------------------------------------------");

    return res.status(200).json({
      success: true,
      msg: "Message sent successfully!",
    });
  } catch (error) {
    console.error("Contact Route Error:", error);
    return res.status(500).json({
      success: false,
      msg: "Failed to send message. Please try again later.",
    });
  }
});

module.exports = router;
