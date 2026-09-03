package com.taaskr.service.impl;

import com.taaskr.service.EmailService;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailServiceImpl implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailServiceImpl.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@taaskr.com}")
    private String fromEmail;

    @Value("${app.email.simulation-mode:true}")
    private boolean simulationMode;

    @Override
    @Async
    public void sendVerificationOtp(String toEmail, String userName, String otp) {
        String subject = "Taaskr - Verify Your Email Address";
        String htmlContent = """
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <div style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); padding: 28px 24px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Taaskr</h1>
                    <p style="color: #94a3b8; margin: 6px 0 0 0; font-size: 13px;">On-Demand Home & Freight Services</p>
                </div>
                <div style="padding: 32px 24px; color: #1e293b;">
                    <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #0f172a;">Welcome to Taaskr, %s!</h2>
                    <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #475569;">
                        Thank you for signing up. Please use the following 6-digit verification code to verify your email address and activate your account:
                    </p>
                    <div style="text-align: center; margin: 28px 0;">
                        <div style="display: inline-block; background-color: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 14px 32px; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0284c7; font-family: monospace;">
                            %s
                        </div>
                    </div>
                    <p style="margin: 0 0 12px 0; font-size: 13px; color: #64748b;">
                        This code will expire in <strong>15 minutes</strong>. If you did not create an account with Taaskr, please safely disregard this email.
                    </p>
                </div>
                <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 12px; color: #94a3b8;">
                    &copy; 2026 Taaskr Technologies Inc. All rights reserved.
                </div>
            </div>
            """.formatted(userName != null ? userName : "User", otp);

        sendHtmlEmail(toEmail, subject, htmlContent, "VERIFICATION OTP: " + otp);
    }

    @Override
    @Async
    public void sendPasswordResetOtp(String toEmail, String userName, String otp) {
        String subject = "Taaskr - Password Reset Request";
        String htmlContent = """
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <div style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); padding: 28px 24px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Taaskr</h1>
                    <p style="color: #94a3b8; margin: 6px 0 0 0; font-size: 13px;">Security & Account Services</p>
                </div>
                <div style="padding: 32px 24px; color: #1e293b;">
                    <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #0f172a;">Password Reset Request</h2>
                    <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #475569;">
                        Hello %s, we received a request to reset the password for your Taaskr account. Enter the 6-digit OTP below to proceed with resetting your password:
                    </p>
                    <div style="text-align: center; margin: 28px 0;">
                        <div style="display: inline-block; background-color: #fef2f2; border: 2px dashed #fca5a5; border-radius: 8px; padding: 14px 32px; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #dc2626; font-family: monospace;">
                            %s
                        </div>
                    </div>
                    <p style="margin: 0 0 12px 0; font-size: 13px; color: #64748b;">
                        This code is valid for <strong>15 minutes</strong>. If you did not request a password reset, please change your password immediately or contact Taaskr support.
                    </p>
                </div>
                <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 12px; color: #94a3b8;">
                    &copy; 2026 Taaskr Technologies Inc. All rights reserved.
                </div>
            </div>
            """.formatted(userName != null ? userName : "User", otp);

        sendHtmlEmail(toEmail, subject, htmlContent, "PASSWORD RESET OTP: " + otp);
    }

    @Override
    @Async
    public void sendWelcomeEmail(String toEmail, String userName) {
        String subject = "Taaskr - Welcome Aboard!";
        String htmlContent = """
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); padding: 28px 24px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Taaskr</h1>
                </div>
                <div style="padding: 32px 24px; color: #1e293b;">
                    <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #0f172a;">Account Verified Successfully!</h2>
                    <p style="font-size: 15px; line-height: 1.6; color: #475569;">
                        Hello %s, your email has been verified. You can now book trusted home and freight services or manage your professional service catalog seamlessly.
                    </p>
                </div>
            </div>
            """.formatted(userName != null ? userName : "User");

        sendHtmlEmail(toEmail, subject, htmlContent, "WELCOME EMAIL");
    }

    private void sendHtmlEmail(String toEmail, String subject, String htmlContent, String summary) {
        log.info("========== [TAASKR EMAIL DISPATCHER] ==========");
        log.info("To: {}", toEmail);
        log.info("Subject: {}", subject);
        log.info("Payload Summary: {}", summary);
        log.info("===============================================");

        if (mailSender != null && !simulationMode) {
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
                helper.setFrom(fromEmail);
                helper.setTo(toEmail);
                helper.setSubject(subject);
                helper.setText(htmlContent, true);
                mailSender.send(message);
                log.info("Email successfully sent via SMTP to: {}", toEmail);
            } catch (Exception e) {
                log.warn("SMTP mail delivery failed (falling back to simulated log delivery): {}", e.getMessage());
            }
        }
    }
}
