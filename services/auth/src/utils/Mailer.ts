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

    async sendVerificationToken(verificationToken: string) {
        const mailOptions = {
            from: BREVO_SENDER,
            to: this.email,
            subject: "Verify your email",
            html: `<p>Click <a href="${process.env.DOMEN}/api/auth/verify-email?verificationToken=${verificationToken}">here</a> to verify your email</p>`,
        };
        await this.transporter.sendMail(mailOptions);
    }

    async sendMfaToken(mfaFourDigitCode: string) {
        const mailOptions = {
            from: BREVO_SENDER,
            to: this.email,
            subject: "MFA Verification",
            html: `<p>Your MFA code is: ${mfaFourDigitCode}</p>`,
        };
        await this.transporter.sendMail(mailOptions);
    }

    async sendPasswordResetEmail(passwordResetToken: string) {
        const mailOptions = {
            from: BREVO_SENDER,
            to: this.email,
            subject: "Password Reset",
            html: `<p>Your password reset token is: ${passwordResetToken}</p>`,
        }
        await this.transporter.sendMail(mailOptions);
    }
}

export default Mailer;
