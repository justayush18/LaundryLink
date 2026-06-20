package com.laundrylink.laundrylink.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.laundrylink.laundrylink.api.NotificationHistoryResponse;
import com.laundrylink.laundrylink.api.NotificationPreferencesDto;
import com.laundrylink.laundrylink.api.NotificationType;
import com.laundrylink.laundrylink.api.NotificationView;
import com.laundrylink.laundrylink.persistence.NotificationEntity;
import com.laundrylink.laundrylink.persistence.NotificationPreferencesEntity;
import com.laundrylink.laundrylink.persistence.NotificationPreferencesRepository;
import com.laundrylink.laundrylink.persistence.NotificationRepository;
import com.laundrylink.laundrylink.persistence.UserRepository;
import com.laundrylink.laundrylink.api.UserRoleType;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationPreferencesRepository preferencesRepository;
    private final UserRepository userRepository;
    private final org.springframework.mail.javamail.JavaMailSender mailSender;

    public NotificationService(NotificationRepository notificationRepository, NotificationPreferencesRepository preferencesRepository) {
        this(notificationRepository, preferencesRepository, null, null);
    }

    @org.springframework.beans.factory.annotation.Autowired
    public NotificationService(
            NotificationRepository notificationRepository, 
            NotificationPreferencesRepository preferencesRepository,
            UserRepository userRepository,
            @org.springframework.beans.factory.annotation.Autowired(required = false) org.springframework.mail.javamail.JavaMailSender mailSender) {
        this.notificationRepository = notificationRepository;
        this.preferencesRepository = preferencesRepository;
        this.userRepository = userRepository;
        this.mailSender = mailSender;
    }

    public void sendNotification(String recipientEmail, NotificationType type, String message) {
        String normalizedEmail = recipientEmail.trim().toLowerCase();
        NotificationPreferencesEntity preferences = getOrCreatePreferences(normalizedEmail);

        boolean allowed = switch (type) {
            case ORDER_STATUS -> preferences.isOrderStatusAlerts();
            case PAYMENT -> preferences.isPaymentAlerts();
            case DELIVERY -> preferences.isDeliveryAlerts();
            case REVIEW_REMINDER -> preferences.isReviewReminders();
        };

        if (!allowed) {
            System.out.println("[SIMULATION] Notification skipped for " + recipientEmail + " (Preference disabled) | Type: " + type);
            return;
        }

        boolean emailSent = true;
        NotificationEntity notification = new NotificationEntity(
                normalizedEmail,
                type,
                message,
                emailSent
        );

        notificationRepository.save(notification);
        System.out.println("[SIMULATION] Email sent to " + recipientEmail + " | Subject: " + type + " Alert | Message: " + message);

        // Check if recipient is CUSTOMER to send a real email copy
        boolean isCustomer = false;
        if (userRepository != null) {
            isCustomer = userRepository.findByEmail(normalizedEmail)
                    .map(u -> u.getRole() == UserRoleType.CUSTOMER)
                    .orElse(false);
        }

        if (isCustomer) {
            sendRealNotificationEmail(normalizedEmail, type, message);
        }
    }

    private void sendRealNotificationEmail(String toEmail, NotificationType type, String messageText) {
        String subject = "Velora Update: " + type.name().replace('_', ' ');
        String body = "Hello,\n\nYou have a new update on your Velora laundry order:\n\n" + messageText + "\n\nThank you,\nVelora Team";
        
        System.out.println("[NOTIFICATION EMAIL SIMULATION] Sending notification email to: " + toEmail + " | Type: " + type + " | Msg: " + messageText);
        
        if (mailSender != null) {
            try {
                org.springframework.mail.SimpleMailMessage message = new org.springframework.mail.SimpleMailMessage();
                message.setTo(toEmail);
                message.setSubject(subject);
                message.setText(body);
                mailSender.send(message);
                System.out.println("[SMTP] Notification email successfully sent to customer: " + toEmail);
            } catch (Exception e) {
                System.err.println("[SMTP ERROR] Failed to send notification email to customer: " + toEmail + ". Error: " + e.getMessage());
            }
        }
    }

    public NotificationHistoryResponse getHistoryResponse(String email) {
        String normalizedEmail = email.trim().toLowerCase();
        List<NotificationEntity> list = notificationRepository.findByRecipientEmailOrderByCreatedAtDesc(normalizedEmail);

        int total = list.size();
        int unread = (int) list.stream().filter(n -> !n.isRead()).count();
        int read = total - unread;

        List<NotificationView> views = list.stream()
                .map(this::toView)
                .collect(Collectors.toList());

        return new NotificationHistoryResponse(total, unread, read, views);
    }

    public NotificationPreferencesDto getPreferences(String email) {
        String normalizedEmail = email.trim().toLowerCase();
        NotificationPreferencesEntity prefs = getOrCreatePreferences(normalizedEmail);
        return toPrefsDto(prefs);
    }

    public NotificationPreferencesDto updatePreferences(String email, NotificationPreferencesDto dto) {
        String normalizedEmail = email.trim().toLowerCase();
        NotificationPreferencesEntity prefs = getOrCreatePreferences(normalizedEmail);

        prefs.setOrderStatusAlerts(dto.orderStatusAlerts());
        prefs.setPaymentAlerts(dto.paymentAlerts());
        prefs.setDeliveryAlerts(dto.deliveryAlerts());
        prefs.setReviewReminders(dto.reviewReminders());

        preferencesRepository.save(prefs);
        return toPrefsDto(prefs);
    }

    public void markAsRead(String email, String notificationId) {
        String normalizedEmail = email.trim().toLowerCase();
        Long id = null;
        try {
            id = Long.parseLong(notificationId);
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found");
        }

        NotificationEntity found = notificationRepository.findById(id).orElse(null);
        if (found == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found");
        }

        if (!found.getRecipientEmail().equalsIgnoreCase(normalizedEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: You do not own this notification");
        }

        found.setRead(true);
        notificationRepository.save(found);
    }

    private NotificationPreferencesEntity getOrCreatePreferences(String email) {
        String normalized = email.trim().toLowerCase();
        return preferencesRepository.findByRecipientEmail(normalized)
                .orElseGet(() -> preferencesRepository.save(new NotificationPreferencesEntity(normalized)));
    }

    private NotificationView toView(NotificationEntity n) {
        return new NotificationView(
                String.valueOf(n.getId()),
                n.getRecipientEmail(),
                n.getType(),
                n.getMessage(),
                n.getCreatedAt(),
                n.isRead(),
                n.isEmailSent()
        );
    }

    private NotificationPreferencesDto toPrefsDto(NotificationPreferencesEntity p) {
        return new NotificationPreferencesDto(
                p.isOrderStatusAlerts(),
                p.isPaymentAlerts(),
                p.isDeliveryAlerts(),
                p.isReviewReminders()
        );
    }
}
