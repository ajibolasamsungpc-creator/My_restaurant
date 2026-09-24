import express from "express";
import { sendEmail } from "../utils/mailer.js";

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        await sendEmail({
            to: process.env.EMAIL_USER,
            subject: "Restaurant Ordering System Test",
            html: `
                <h2>Email system is working! 🎉</h2>
                <p>This is a test email from your Restaurant Ordering System.</p>
            `,
        });

        res.json({
            success: true,
            message: "Test email sent successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to send test email",
        });
    }
});

export default router;