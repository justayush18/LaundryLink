package com.laundrylink.laundrylink.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.*;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import com.laundrylink.laundrylink.api.*;
import com.laundrylink.laundrylink.persistence.*;

@ExtendWith(MockitoExtension.class)
public class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private NotificationPreferencesRepository preferencesRepository;

    @InjectMocks
    private NotificationService notificationService;

    @Test
    public void testSendNotification_PreferencesEnabled() {
        NotificationPreferencesEntity prefs = new NotificationPreferencesEntity("test@example.com");
        prefs.setPaymentAlerts(true);

        when(preferencesRepository.findByRecipientEmail("test@example.com")).thenReturn(Optional.of(prefs));

        notificationService.sendNotification("test@example.com", NotificationType.PAYMENT, "Payment processed");

        verify(notificationRepository, times(1)).save(any(NotificationEntity.class));
    }

    @Test
    public void testSendNotification_PreferencesDisabled() {
        NotificationPreferencesEntity prefs = new NotificationPreferencesEntity("test@example.com");
        prefs.setPaymentAlerts(false);

        when(preferencesRepository.findByRecipientEmail("test@example.com")).thenReturn(Optional.of(prefs));

        notificationService.sendNotification("test@example.com", NotificationType.PAYMENT, "Payment processed");

        verify(notificationRepository, never()).save(any(NotificationEntity.class));
    }

    @Test
    public void testGetHistoryResponse() {
        NotificationEntity n1 = new NotificationEntity("test@example.com", NotificationType.PAYMENT, "Msg1", true);
        n1.setRead(false);
        NotificationEntity n2 = new NotificationEntity("test@example.com", NotificationType.ORDER_STATUS, "Msg2", true);
        n2.setRead(true);

        when(notificationRepository.findByRecipientEmailOrderByCreatedAtDesc("test@example.com")).thenReturn(List.of(n1, n2));

        NotificationHistoryResponse res = notificationService.getHistoryResponse("test@example.com");

        assertNotNull(res);
        assertEquals(2, res.totalNotifications());
        assertEquals(1, res.unreadNotifications());
        assertEquals(1, res.readNotifications());
    }

    @Test
    public void testUpdatePreferences() {
        NotificationPreferencesEntity prefs = new NotificationPreferencesEntity("test@example.com");
        when(preferencesRepository.findByRecipientEmail("test@example.com")).thenReturn(Optional.of(prefs));

        NotificationPreferencesDto dto = new NotificationPreferencesDto(true, false, true, false);

        NotificationPreferencesDto result = notificationService.updatePreferences("test@example.com", dto);

        assertNotNull(result);
        assertTrue(result.orderStatusAlerts());
        assertFalse(result.paymentAlerts());
        assertTrue(result.deliveryAlerts());
        assertFalse(result.reviewReminders());

        verify(preferencesRepository, times(1)).save(prefs);
    }

    @Test
    public void testMarkAsRead_Success() {
        NotificationEntity notification = new NotificationEntity("test@example.com", NotificationType.PAYMENT, "Msg", true);
        notification.setId(123L);
        notification.setRead(false);

        when(notificationRepository.findById(123L)).thenReturn(Optional.of(notification));

        notificationService.markAsRead("test@example.com", "123");

        assertTrue(notification.isRead());
        verify(notificationRepository, times(1)).save(notification);
    }

    @Test
    public void testMarkAsRead_AccessDenied() {
        NotificationEntity notification = new NotificationEntity("other@example.com", NotificationType.PAYMENT, "Msg", true);
        notification.setId(123L);

        when(notificationRepository.findById(123L)).thenReturn(Optional.of(notification));

        assertThrows(ResponseStatusException.class, () -> {
            notificationService.markAsRead("test@example.com", "123");
        });
    }
}
