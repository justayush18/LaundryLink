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

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationPreferencesRepository preferencesRepository;

    public NotificationService(NotificationRepository notificationRepository, NotificationPreferencesRepository preferencesRepository) {
        this.notificationRepository = notificationRepository;
        this.preferencesRepository = preferencesRepository;
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
