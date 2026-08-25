import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendVerificationEmail = async (
  email: string,
  name: string,
  token: string,
) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: [email],
    subject: "Verify your Mock AI Interview account",

    html: `
    <!DOCTYPE html>
    <html>
      <body>
        <h2>Welcome, ${name}!</h2>

        <p>
          Thanks for creating your Mock AI Interview account.
        </p>

        <p>
          Please verify your email address by clicking the button below:
        </p>

        <p>
          <a
            href="${verificationUrl}"
            target="_blank"
            style="
              display: inline-block;
              padding: 12px 24px;
              background-color: #4f46e5;
              color: #ffffff;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
            "
          >
            Verify Email
          </a>
        </p>

        <p>
          This verification link will expire in 30 minutes.
        </p>

        <p>
          If the button doesn't work, copy and paste this URL into your browser:
        </p>

        <p>
          ${verificationUrl}
        </p>
      </body>
    </html>
  `,
  });

  if (error) {
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
  console.log(`Verification email sent to ${verificationUrl}`);

  return data;
};
export const sendPasswordResetEmail = async (
  email: string,
  name: string,
  token: string,
) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: [email],
    subject: "Reset your Mock AI Interview password",

    html: `
    <!DOCTYPE html>
    <html>
      <body>
        <h2>Hello, ${name}!</h2>

        <p>
          We received a request to reset your Mock AI Interview password.
        </p>

        <p>
          Click the button below to create a new password:
        </p>

        <p>
          <a
            href="${resetUrl}"
            target="_blank"
            style="
              display: inline-block;
              padding: 12px 24px;
              background-color: #4f46e5;
              color: #ffffff;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
            "
          >
            Reset Password
          </a>
        </p>

        <p>
          This password reset link will expire in 30 minutes.
        </p>

        <p>
          If you did not request a password reset, you can safely ignore this
          email.
        </p>

        <p>
          If the button doesn't work, copy and paste this URL into your browser:
        </p>

        <p>
          ${resetUrl}
        </p>
      </body>
    </html>
    `,
  });

  if (error) {
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }

  console.log(`Password reset email sent to ${email}`);

  return data;
};
