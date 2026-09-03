package com.taaskr.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
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

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

@Service
public class EmailServiceImpl implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailServiceImpl.class);
    private static final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();
    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${brevo.api.key:${BREVO_API_KEY:${EMAIL_API_KEY:}}}")
    private String brevoApiKey;

    @Value("${resend.api.key:${RESEND_API_KEY:}}}")
    private String resendApiKey;

    @Value("${spring.mail.host:${MAIL_HOST:${SPRING_MAIL_HOST:smtp.gmail.com}}}")
    private String mailHost;

    @Value("${spring.mail.port:${MAIL_PORT:${SPRING_MAIL_PORT:465}}}")
    private int mailPort;

    @Value("${app.email.from:${MAIL_FROM:${SPRING_MAIL_FROM:${spring.mail.username:${MAIL_USERNAME:}}}}}")
    private String fromEmail;

    @Value("${spring.mail.username:${MAIL_USERNAME:${SPRING_MAIL_USERNAME:}}}")
    private String mailUsername;

    @Value("${spring.mail.password:${MAIL_PASSWORD:${SPRING_MAIL_PASSWORD:}}}")
    private String mailPassword;

    @Value("${app.email.simulation-mode:${EMAIL_SIMULATION_MODE:auto}}")
    private String simulationMode;

    private String resolveBrevoApiKey() {
        if (brevoApiKey != null && !brevoApiKey.trim().isBlank()) return brevoApiKey.trim();
        String env1 = System.getenv("BREVO_API_KEY");
        if (env1 != null && !env1.trim().isBlank()) return env1.trim();
        String env2 = System.getenv("EMAIL_API_KEY");
        if (env2 != null && !env2.trim().isBlank()) return env2.trim();
        return "";
    }

    private String resolveResendApiKey() {
        if (resendApiKey != null && !resendApiKey.trim().isBlank()) return resendApiKey.trim();
        String env = System.getenv("RESEND_API_KEY");
        if (env != null && !env.trim().isBlank()) return env.trim();
        return "";
    }

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
        try {
            String p = System.getenv("MAIL_PORT");
            if (p != null && !p.trim().isBlank()) return Integer.parseInt(p.trim());
        } catch (Exception ignored) {}
        if (mailPort > 0) return mailPort;
        return 465;
    }

    private boolean sendViaBrevoApi(String apiKey, String senderEmail, String toEmail, String subject, String htmlContent) throws Exception {
        Map<String, Object> payload = new HashMap<>();
        Map<String, String> sender = new HashMap<>();
        sender.put("name", "Taaskr");
        sender.put("email", senderEmail);
        payload.put("sender", sender);

        List<Map<String, String>> toList = new ArrayList<>();
        Map<String, String> to = new HashMap<>();
        to.put("email", toEmail);
        toList.add(to);
        payload.put("to", toList);

        payload.put("subject", subject);
        payload.put("htmlContent", htmlContent);

        String json = objectMapper.writeValueAsString(payload);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.brevo.com/v3/smtp/email"))
                .header("Content-Type", "application/json")
                .header("api-key", apiKey)
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .timeout(Duration.ofSeconds(8))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 200 && response.statusCode() < 300) {
            log.info("Brevo API dispatched successfully to {} (HTTP {})", toEmail, response.statusCode());
            return true;
        } else {
            log.error("Brevo API rejected request: HTTP {} - {}", response.statusCode(), response.body());
            throw new RuntimeException("Brevo API error (" + response.statusCode() + "): " + response.body());
        }
    }

    private boolean sendViaResendApi(String apiKey, String senderEmail, String toEmail, String subject, String htmlContent) throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("from", "Taaskr <" + (senderEmail.contains("@") ? senderEmail : "onboarding@resend.dev") + ">");
        payload.put("to", List.of(toEmail));
        payload.put("subject", subject);
        payload.put("html", htmlContent);

        String json = objectMapper.writeValueAsString(payload);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.resend.com/emails"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey)
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .timeout(Duration.ofSeconds(8))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 200 && response.statusCode() < 300) {
            log.info("Resend API dispatched successfully to {} (HTTP {})", toEmail, response.statusCode());
            return true;
        } else {
            log.error("Resend API error: HTTP {} - {}", response.statusCode(), response.body());
            throw new RuntimeException("Resend API error (" + response.statusCode() + "): " + response.body());
        }
    }

    private JavaMailSenderImpl createSender(String host, int port, String user, String pass) {
        JavaMailSenderImpl impl = new JavaMailSenderImpl();
        impl.setHost(host);
        impl.setPort(port);
        impl.setUsername(user);
        impl.setPassword(pass);
        impl.setDefaultEncoding("UTF-8");

        Properties props = impl.getJavaMailProperties();
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.connectiontimeout", "3000");
        props.put("mail.smtp.timeout", "4000");
        props.put("mail.smtp.writetimeout", "4000");
        props.put("mail.smtp.ssl.trust", "*");

        if (port == 465) {
            props.put("mail.transport.protocol", "smtps");
            props.put("mail.smtp.ssl.enable", "true");
            props.put("mail.smtp.socketFactory.port", "465");
            props.put("mail.smtp.socketFactory.class", "javax.net.ssl.SSLSocketFactory");
            props.put("mail.smtp.socketFactory.fallback", "false");
            props.put("mail.smtp.ssl.protocols", "TLSv1.2 TLSv1.3");
        } else {
            props.put("mail.transport.protocol", "smtp");
            props.put("mail.smtp.starttls.enable", "true");
            props.put("mail.smtp.starttls.required", "true");
            props.put("mail.smtp.ssl.protocols", "TLSv1.2 TLSv1.3");
        }
        return impl;
    }

    private void trySendSmtp(String host, int port, String user, String pass, String senderAddress, String toEmail, String subject, String htmlContent) throws Exception {
        JavaMailSenderImpl impl = createSender(host, port, user, pass);
        MimeMessage message = impl.createMimeMessage();
        org.springframework.mail.javamail.MimeMessageHelper helper = 
                new org.springframework.mail.javamail.MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom(senderAddress, "Taaskr");
        helper.setTo(toEmail);
        helper.setSubject(subject);
        helper.setText(htmlContent, true);

        impl.send(message);
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
        String brevoKey = resolveBrevoApiKey();
        String resendKey = resolveResendApiKey();
        String user = resolveUsername();
        String pass = resolvePassword();
        String host = resolveHost();
        int initialPort = resolvePort();
        boolean hasSmtpCredentials = !user.isBlank() && !pass.isBlank();
        boolean isExplicitSimulation = "true".equalsIgnoreCase(simulationMode);

        String senderAddress = (fromEmail != null && !fromEmail.isBlank() && !fromEmail.contains("noreply@taaskr.com"))
                ? fromEmail.trim()
                : (user.isBlank() ? "mayankdeployment@gmail.com" : user);

        log.info("========== [TAASKR EMAIL DISPATCHER] ==========");
        log.info("To: {}", toEmail);
        log.info("Subject: {}", subject);
        log.info("Payload Summary: {}", summary);
        log.info("Sender: {} | Brevo API: {} | Resend API: {} | SMTP: {}", 
                senderAddress, !brevoKey.isBlank(), !resendKey.isBlank(), hasSmtpCredentials);
        log.info("===============================================");

        if (isExplicitSimulation) {
            log.info("[SIMULATION MODE] Email payload logged to console.");
            return;
        }

        // 1. Try Brevo REST API (HTTPS Port 443 - 100% cloud firewall proof)
        if (!brevoKey.isBlank()) {
            try {
                sendViaBrevoApi(brevoKey, senderAddress, toEmail, subject, htmlContent);
                return;
            } catch (Exception e) {
                log.warn("Brevo API delivery failed: {}", e.getMessage());
            }
        }

        // 2. Try Resend REST API (HTTPS Port 443)
        if (!resendKey.isBlank()) {
            try {
                sendViaResendApi(resendKey, senderAddress, toEmail, subject, htmlContent);
                return;
            } catch (Exception e) {
                log.warn("Resend API delivery failed: {}", e.getMessage());
            }
        }

        // 3. Try SMTP (Ports 465 / 587)
        if (hasSmtpCredentials) {
            String smtpSender = (host.contains("gmail") || fromEmail == null || fromEmail.isBlank() || fromEmail.contains("noreply@taaskr.com")) 
                    ? user 
                    : fromEmail.trim();

            int[] portsToTry = initialPort == 465 ? new int[]{465, 587} : new int[]{initialPort, 465};
            for (int port : portsToTry) {
                try {
                    log.info("Attempting SMTP delivery on port {}...", port);
                    trySendSmtp(host, port, user, pass, smtpSender, toEmail, subject, htmlContent);
                    log.info("SUCCESS: Email dispatched via SMTP on port {} to: {}", port, toEmail);
                    return;
                } catch (Exception e) {
                    log.warn("SMTP attempt on port {} failed: {}", port, e.getMessage());
                }
            }
        }

        log.info("[FALLBACK] Could not deliver via real email provider. Code logged to console.");
    }

    @Override
    public Map<String, Object> testEmailDispatch(String toEmail) {
        Map<String, Object> result = new HashMap<>();
        String brevoKey = resolveBrevoApiKey();
        String resendKey = resolveResendApiKey();
        String user = resolveUsername();
        String pass = resolvePassword();
        String host = resolveHost();
        int initialPort = resolvePort();

        result.put("to", toEmail);
        result.put("hasBrevoApiKey", !brevoKey.isBlank());
        result.put("hasResendApiKey", !resendKey.isBlank());
        result.put("smtpUsername", user.isBlank() ? "NOT_CONFIGURED" : user);
        result.put("smtpPasswordConfigured", !pass.isBlank());
        result.put("smtpHost", host);
        result.put("smtpPort", initialPort);

        String senderAddress = (fromEmail != null && !fromEmail.isBlank() && !fromEmail.contains("noreply@taaskr.com"))
                ? fromEmail.trim()
                : (user.isBlank() ? "mayankdeployment@gmail.com" : user);

        // 1. Try Brevo API if key is present
        if (!brevoKey.isBlank()) {
            try {
                sendViaBrevoApi(brevoKey, senderAddress, toEmail, "Taaskr - Brevo API Test Ping",
                        "<div style='font-family:sans-serif;'><h2>Brevo API Test Successful!</h2><p>Your Taaskr emails are working via Brevo HTTPS API.</p></div>");
                result.put("status", "SUCCESS");
                result.put("provider", "Brevo HTTPS API (Port 443)");
                result.put("message", "Test email successfully sent to " + toEmail + " via Brevo API!");
                return result;
            } catch (Exception e) {
                result.put("brevoError", e.getMessage());
            }
        }

        // 2. Try Resend API if key is present
        if (!resendKey.isBlank()) {
            try {
                sendViaResendApi(resendKey, senderAddress, toEmail, "Taaskr - Resend API Test Ping",
                        "<div style='font-family:sans-serif;'><h2>Resend API Test Successful!</h2><p>Your Taaskr emails are working via Resend HTTPS API.</p></div>");
                result.put("status", "SUCCESS");
                result.put("provider", "Resend HTTPS API (Port 443)");
                result.put("message", "Test email successfully sent to " + toEmail + " via Resend API!");
                return result;
            } catch (Exception e) {
                result.put("resendError", e.getMessage());
            }
        }

        // 3. Try SMTP
        if (!user.isBlank() && !pass.isBlank()) {
            String smtpSender = (host.contains("gmail") || fromEmail == null || fromEmail.isBlank() || fromEmail.contains("noreply@taaskr.com")) 
                    ? user 
                    : fromEmail.trim();

            int[] portsToTry = initialPort == 465 ? new int[]{465, 587} : new int[]{initialPort, 465};
            for (int port : portsToTry) {
                try {
                    trySendSmtp(host, port, user, pass, smtpSender, toEmail,
                            "Taaskr - SMTP Test Ping",
                            "<div style='font-family:sans-serif;'><h2>SMTP Test Successful!</h2><p>Your Taaskr email service is working properly over port " + port + ".</p></div>");

                    result.put("status", "SUCCESS");
                    result.put("provider", "SMTP (Port " + port + ")");
                    result.put("message", "Test email successfully sent to " + toEmail + " via port " + port);
                    return result;
                } catch (Exception e) {
                    result.put("smtpPort" + port + "Error", e.getMessage());
                }
            }
        }

        result.put("status", "ERROR");
        result.put("error", "All delivery methods failed. On cloud hosts like Render, raw SMTP ports (465/587) are often firewalled. Recommend adding BREVO_API_KEY or RESEND_API_KEY.");
        return result;
    }
}
