import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const sendExpiryAlert = async (vehicle) => {
  try {
    const daysLeft = Math.ceil(
      (new Date(vehicle.expiry) - new Date()) / (1000 * 60 * 60 * 24)
    );

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const formattedDate = new Date(vehicle.expiry).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
        <h2 style="color: #d9534f;">⚠ Vehicle Insurance Expiry Alert</h2>
        <p>Dear User,</p>
        <p>This is a reminder that the insurance for the following vehicle is expiring soon:</p>
        <table style="border-collapse: collapse; margin-top: 10px;">
          <tr>
            <td style="padding: 8px; font-weight: bold;">Vehicle Name:</td>
            <td style="padding: 8px;">${vehicle.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Expiry Date:</td>
            <td style="padding: 8px;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Days Left:</td>
            <td style="padding: 8px;">${daysLeft} day(s)</td>
          </tr>
        </table>
        <p style="margin-top: 20px;">
          Please take the necessary action to renew the insurance on time.
        </p>
        <p>Regards,<br/><strong>Insurance Alert System</strong></p>
        <hr style="margin-top: 30px;"/>
        <small style="color: #777;">This is an automated message. Please do not reply to this email.</small>
      </div>
    `;

    const mailOptions = {
      from: `"Insurance Alert" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `⚠️ Vehicle "${vehicle.name}" insurance expiring soon ⚠️`,
      html: htmlBody,
    };

    const info = await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error("Error sending email:", err);
  }
};

export default sendExpiryAlert;
