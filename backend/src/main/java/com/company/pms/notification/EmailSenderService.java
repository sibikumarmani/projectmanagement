package com.company.pms.notification;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailSenderService {

    private static final Logger log = LoggerFactory.getLogger(EmailSenderService.class);

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final String fromAddress;

    public EmailSenderService(ObjectProvider<JavaMailSender> mailSenderProvider, @Value("${app.mail.from}") String fromAddress) {
        this.mailSenderProvider = mailSenderProvider;
        this.fromAddress = fromAddress;
    }

    public DeliveryResult sendVerificationCode(String toEmail, String fullName, String code) {
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            log.warn("SMTP is not configured. Verification code for {} is {}", toEmail, code);
            return new DeliveryResult(false, "SMTP is not configured. Verification code was logged on the server.", code);
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(toEmail);
        message.setSubject("Your PMS verification code");
        message.setText("""
            Hello %s,

            Your Project Management System verification code is: %s

            This code will expire in 10 minutes.
            If you did not request this account, you can ignore this email.
            """.formatted(fullName, code));

        try {
            mailSender.send(message);
            return new DeliveryResult(true, "Verification code sent to the registered email", null);
        } catch (MailException ex) {
            log.warn("Email delivery failed for {}. Verification code: {}", toEmail, code, ex);
            return new DeliveryResult(false, "Email delivery failed. Verification code was logged on the server.", code);
        }
    }

    public DeliveryResult sendPasswordResetCode(String toEmail, String fullName, String code) {
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            log.warn("SMTP is not configured. Password reset code for {} is {}", toEmail, code);
            return new DeliveryResult(false, "SMTP is not configured. Password reset code was logged on the server.", code);
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(toEmail);
        message.setSubject("Your PMS password reset code");
        message.setText("""
            Hello %s,

            Your Project Management System password reset code is: %s

            This code will expire in 10 minutes.
            If you did not request a password reset, you can ignore this email.
            """.formatted(fullName, code));

        try {
            mailSender.send(message);
            return new DeliveryResult(true, "Password reset code sent to the registered email", null);
        } catch (MailException ex) {
            log.warn("Password reset email delivery failed for {}. Reset code: {}", toEmail, code, ex);
            return new DeliveryResult(false, "Email delivery failed. Password reset code was logged on the server.", code);
        }
    }

    public record DeliveryResult(boolean delivered, String message, String verificationCode) {
    }
}
