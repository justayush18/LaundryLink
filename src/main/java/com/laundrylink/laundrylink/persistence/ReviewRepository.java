package com.laundrylink.laundrylink.persistence;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReviewRepository extends JpaRepository<ReviewEntity, Long> {
    Optional<ReviewEntity> findByOrderId(String orderId);
    List<ReviewEntity> findByPartnerEmail(String email);
    List<ReviewEntity> findByCustomerEmail(String email);
}
