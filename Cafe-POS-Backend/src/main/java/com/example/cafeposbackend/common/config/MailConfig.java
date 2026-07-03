package com.example.cafeposbackend.common.config;

import com.example.cafeposbackend.common.util.EmailUtil;
import java.util.Properties;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

@Configuration
public class MailConfig {
  @Bean
  JavaMailSender javaMailSender(
      @Value("${spring.mail.host:}") String host,
      @Value("${spring.mail.port:587}") int port,
      @Value("${spring.mail.username:}") String username,
      @Value("${spring.mail.password:}") String password,
      @Value("${spring.mail.properties.mail.smtp.auth:true}") boolean auth,
      @Value("${spring.mail.properties.mail.smtp.starttls.enable:true}") boolean startTlsEnabled,
      @Value("${spring.mail.properties.mail.smtp.starttls.required:true}") boolean startTlsRequired,
      @Value("${spring.mail.properties.mail.smtp.ssl.enable:false}") boolean sslEnabled,
      @Value("${spring.mail.properties.mail.smtp.connectiontimeout:5000}") int connectionTimeout,
      @Value("${spring.mail.properties.mail.smtp.timeout:10000}") int timeout,
      @Value("${spring.mail.properties.mail.smtp.writetimeout:10000}") int writeTimeout) {
    if (sanitize(host).isBlank()) {
      return null;
    }

    JavaMailSenderImpl sender = new JavaMailSenderImpl();
    sender.setHost(sanitize(host));
    sender.setPort(port);
    sender.setUsername(sanitize(username));
    sender.setPassword(sanitize(password).replace(" ", ""));

    Properties properties = sender.getJavaMailProperties();
    properties.put("mail.smtp.auth", Boolean.toString(auth));
    properties.put("mail.smtp.starttls.enable", Boolean.toString(startTlsEnabled));
    properties.put("mail.smtp.starttls.required", Boolean.toString(startTlsRequired));
    properties.put("mail.smtp.ssl.enable", Boolean.toString(sslEnabled));
    properties.put("mail.smtp.connectiontimeout", Integer.toString(connectionTimeout));
    properties.put("mail.smtp.timeout", Integer.toString(timeout));
    properties.put("mail.smtp.writetimeout", Integer.toString(writeTimeout));
    return sender;
  }

  @Bean
  EmailUtil emailUtil(
      ObjectProvider<JavaMailSender> mailSender,
      @Value("${app.mail.from:${spring.mail.username:no-reply@cafepos.local}}") String from,
      @Value("${app.mail.from-name:Cafe Etoile}") String fromName,
      @Value("${spring.mail.username:}") String username,
      @Value("${spring.mail.port:587}") int port,
      @Value("${spring.mail.properties.mail.smtp.ssl.enable:false}") boolean sslEnabled,
      @Value("${spring.mail.properties.mail.smtp.starttls.enable:true}") boolean startTlsEnabled) {
    return new EmailUtil(
        mailSender,
        sanitize(from),
        sanitize(fromName),
        sanitize(username),
        port,
        sslEnabled,
        startTlsEnabled);
  }

  private String sanitize(String value) {
    if (value == null) {
      return "";
    }
    String trimmed = value.trim();
    if (trimmed.length() >= 2
        && ((trimmed.startsWith("\"") && trimmed.endsWith("\""))
            || (trimmed.startsWith("'") && trimmed.endsWith("'")))) {
      return trimmed.substring(1, trimmed.length() - 1).trim();
    }
    return trimmed;
  }
}
