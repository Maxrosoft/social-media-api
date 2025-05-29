import nodemailer, { Transporter } from "nodemailer";
import "dotenv/config";

const BREVO_LOGIN: string = process.env.BREVO_LOGIN as string;
const BREVO_KEY: string = process.env.BREVO_KEY as string;
const BREVO_SENDER: string = process.env.BREVO_SENDER as string;

class Mailer {
    private transporter: Transporter;
    private email: string;

    constructor(email: string) {
        this.transporter = nodemailer.createTransport({
            host: "smtp-relay.brevo.com",
            port: 587,
            auth: {
                user: BREVO_LOGIN,
                pass: BREVO_KEY,
            },
        });
        this.email = email;
    }

    async sendVerificationToken(token: string) {
        const mailOptions = {
            from: BREVO_SENDER,
            to: this.email,
            subject: "Verify your email",
            html: `<p>Click <a href="http://localhost:3000/api/auth/verify-email?token=${token}">here</a> to verify your email</p>`,
        };
        await this.transporter.sendMail(mailOptions);
    }
}

export default Mailer;
