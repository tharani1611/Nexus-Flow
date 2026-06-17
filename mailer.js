/**
 * Mailer Utility.
 * Logs email output to the console for testing and verification, avoiding the need for an active SMTP server.
 */

class Mailer {
  async sendVerificationEmail(email, token) {
    const verificationLink = `http://localhost:5000/api/auth/verify?token=${token}`;
    console.log('\n==================================================');
    console.log(`[EMAIL SEND OUT TO: ${email}]`);
    console.log('Subject: Verify Your NexusFlow Account');
    console.log(`Link: ${verificationLink}`);
    console.log('==================================================\n');
    return true;
  }

  async sendResetPasswordEmail(email, token) {
    const resetLink = `http://localhost:5000/api/auth/reset-password?token=${token}`;
    console.log('\n==================================================');
    console.log(`[EMAIL SEND OUT TO: ${email}]`);
    console.log('Subject: Reset Your NexusFlow Password');
    console.log(`Link: ${resetLink}`);
    console.log('==================================================\n');
    return true;
  }
}

module.exports = new Mailer();
