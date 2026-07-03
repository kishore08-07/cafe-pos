package com.example.cafeposbackend.common.util;

import com.example.cafeposbackend.common.exception.EmailDeliveryException;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.nio.charset.StandardCharsets;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.core.NestedExceptionUtils;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;

public class EmailUtil {
  private final ObjectProvider<JavaMailSender> mailSender;
  private final String from;
  private final String fromName;
  private final String username;
  private final int port;
  private final boolean sslEnabled;
  private final boolean startTlsEnabled;

  public EmailUtil(
      ObjectProvider<JavaMailSender> mailSender,
      String from,
      String fromName,
      String username,
      int port,
      boolean sslEnabled,
      boolean startTlsEnabled) {
    this.mailSender = mailSender;
    this.from = from;
    this.fromName = fromName;
    this.username = username;
    this.port = port;
    this.sslEnabled = sslEnabled;
    this.startTlsEnabled = startTlsEnabled;
  }

  public void sendReceipt(
      String to, String subject, String body, byte[] receiptPdf, String attachmentName) {
    JavaMailSender sender = mailSender.getIfAvailable();
    if (sender == null) {
      throw new EmailDeliveryException(
          "SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS.");
    }
    try {
      MimeMessage message = sender.createMimeMessage();
      MimeMessageHelper helper =
          new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
      String effectiveFrom = username.isBlank() ? from : username;
      helper.setFrom(effectiveFrom, fromName);
      if (!from.isBlank()
          && !effectiveFrom.equalsIgnoreCase(from)
          && from.contains("@")) {
        helper.setReplyTo(from);
      }
      helper.setTo(to);
      helper.setSubject(subject);
      helper.setText(body, false);
      helper.addAttachment(
          attachmentName, new ByteArrayResource(receiptPdf), "application/pdf");
      sender.send(message);
    } catch (MessagingException | java.io.UnsupportedEncodingException exception) {
      throw new EmailDeliveryException("The receipt email could not be created.", exception);
    } catch (RuntimeException exception) {
      throw new EmailDeliveryException(deliveryFailureMessage(exception), exception);
    }
  }

  private String deliveryFailureMessage(RuntimeException exception) {
    if (sslEnabled && startTlsEnabled && port == 465) {
      return "SMTP is misconfigured: port 465 uses SSL, so set SMTP_STARTTLS=false.";
    }
    String rootCause = NestedExceptionUtils.getMostSpecificCause(exception).getMessage();
    if (rootCause == null || rootCause.isBlank()) {
      return "The SMTP server rejected or could not deliver the receipt email.";
    }
    return "The SMTP server rejected or could not deliver the receipt email: " + rootCause;
  }
}
