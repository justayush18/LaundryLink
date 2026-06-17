package com.laundrylink.laundrylink.persistence;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationPreferencesRepository extends JpaRepository<NotificationPreferencesEntity, String> {
    Optional<NotificationPreferencesEntity> findByRecipientEmail(String email);
}
