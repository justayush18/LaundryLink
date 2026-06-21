package com.laundrylink.laundrylink.persistence;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderRepository extends JpaRepository<OrderEntity, String> {
    List<OrderEntity> findByCustomerEmail(String email);
    List<OrderEntity> findByPartnerEmail(String email);
    List<OrderEntity> findByDeliveryPartnerEmail(String email);
    List<OrderEntity> findByUpdatedAtGreaterThanEqual(long timestamp);
    List<OrderEntity> findByPickupRiderEmailOrDeliveryPartnerEmail(String pickupRiderEmail, String deliveryPartnerEmail);
    java.util.Optional<OrderEntity> findByDisplayOrderId(String displayOrderId);
}
