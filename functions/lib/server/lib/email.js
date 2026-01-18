"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
const resend_1 = require("resend");
const resend = new resend_1.Resend(process.env.RESEND_API_KEY);
async function sendEmail(to, subject, html) {
    if (!process.env.RESEND_API_KEY) {
        console.log(`[Email Mock] To: ${to}, Subject: ${subject}`);
        return;
    }
    try {
        await resend.emails.send({
            from: 'WebStudioAMS <onboarding@resend.dev>', // Default resend sender
            to,
            subject,
            html,
        });
    }
    catch (error) {
        console.error("Email Error:", error);
    }
}
