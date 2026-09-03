package com.taaskr.service.impl;

import com.taaskr.service.EmailService;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Properties;

@Service
public class EmailServiceImpl implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailServiceImpl.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.host:${MAIL_HOST:${SPRING_MAIL_HOST:smtp.gmail.com}}}")
    private String mailHost;

    @Value("${spring.mail.port:${MAIL_PORT:${SPRING_MAIL_PORT:587}}}")
    private int mailPort;

    @Value("${app.email.from:${MAIL_FROM:${SPRING_MAIL_FROM:${spring.mail.username:${MAIL_USERNAME:}}}}}")
    private String fromEmail;

    @Value("${spring.mail.username:${MAIL_USERNAME:${SPRING_MAIL_USERNAME:}}}")
    private String mailUsername;

    @Value("${spring.mail.password:${MAIL_PASSWORD:${SPRING_MAIL_PASSWORD:}}}")
    private String mailPassword;

    @Value("${app.email.simulation-mode:${EMAIL_SIMULATION_MODE:auto}}")
    private String simulationMode;

    private String resolveUsername() {
        if (mailUsername != null && !mailUsername.trim().isBlank()) return mailUsername.trim();
        String env1 = System.getenv("MAIL_USERNAME");
        if (env1 != null && !env1.trim().isBlank()) return env1.trim();
        String env2 = System.getenv("SPRING_MAIL_USERNAME");
        if (env2 != null && !env2.trim().isBlank()) return env2.trim();
        return "";
    }

    private String resolvePassword() {
        if (mailPassword != null && !mailPassword.trim().isBlank()) return mailPassword.trim();
        String env1 = System.getenv("MAIL_PASSWORD");
        if (env1 != null && !env1.trim().isBlank()) return env1.trim();
        String env2 = System.getenv("SPRING_MAIL_PASSWORD");
        if (env2 != null && !env2.trim().isBlank()) return env2.trim();
        return "";
    }

    private String resolveHost() {
        if (mailHost != null && !mailHost.trim().isBlank()) return mailHost.trim();
        String env = System.getenv("MAIL_HOST");
        if (env != null && !env.trim().isBlank()) return env.trim();
        return "smtp.gmail.com";
    }

    private int resolvePort() {
        if (mailPort > 0) return mailPort;
        try {
            String p = System.getenv("MAIL_PORT");
            if (p != null && !p.trim().isBlank()) return Integer.parseInt(p.trim());
        } catch (Exception ignored) {}
        return 587;
    }

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
        String user = resolveUsername();
        String pass = resolvePassword();
        String host = resolveHost();
        int port = resolvePort();
        boolean hasCredentials = !user.isBlank() && !pass.isBlank();
        boolean isExplicitSimulation = "true".equalsIgnoreCase(simulationMode);

        log.info("========== [TAASKR EMAIL DISPATCHER] ==========");
        log.info("To: {}", toEmail);
        log.info("Subject: {}", subject);
        log.info("Payload Summary: {}", summary);
        log.info("SMTP Host: {}:{} | Authenticated User: {} | Real Delivery: {}", 
                host, port, user.isBlank() ? "NONE" : user, (hasCredentials && !isExplicitSimulation));
        log.info("===============================================");

        if (hasCredentials && !isExplicitSimulation) {
            try {
                JavaMailSenderImpl impl = new JavaMailSenderImpl();
                impl.setHost(host);
                impl.setPort(port);
                impl.setUsername(user);
                impl.setPassword(pass);
                impl.setDefaultEncoding("UTF-8");

                Properties props = impl.getJavaMailProperties();
                props.put("mail.transport.protocol", "smtp");
                props.put("mail.smtp.auth", "true");
                props.put("mail.smtp.starttls.enable", "true");
                props.put("mail.smtp.starttls.required", "true");
                props.put("mail.smtp.ssl.protocols", "TLSv1.2");
                props.put("mail.smtp.ssl.trust", "*");
                props.put("mail.smtp.connectiontimeout", "10000");
                props.put("mail.smtp.timeout", "10000");
                props.put("mail.smtp.writetimeout", "10000");

                MimeMessage message = impl.createMimeMessage();
                org.springframework.mail.javamail.MimeMessageHelper helper = 
                        new org.springframework.mail.javamail.MimeMessageHelper(message, true, "UTF-8");

                // Sender is always the authenticated user for Gmail
                String senderAddress = (host.contains("gmail") || fromEmail == null || fromEmail.isBlank() || fromEmail.contains("noreply@taaskr.com")) 
                        ? user 
                        : fromEmail.trim();

                helper.setFrom(senderAddress, "Taaskr");
                helper.setTo(toEmail);
                helper.setSubject(subject);
                helper.setText(htmlContent, true);

                impl.send(message);
                log.info("SUCCESS: Email dispatched via SMTP to: {} from: {}", toEmail, senderAddress);
            } catch (Exception e) {
                log.error("ERROR: SMTP mail delivery failed to {}: {}", toEmail, e.getMessage(), e);
            }
        } else {
            log.info("[SIMULATION / CONSOLE MODE] Real SMTP credentials missing or simulation mode enabled. Email payload logged to console.");
        }
    }
}
