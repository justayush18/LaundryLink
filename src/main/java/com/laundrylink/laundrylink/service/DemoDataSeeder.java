package com.laundrylink.laundrylink.service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.laundrylink.laundrylink.api.*;
import com.laundrylink.laundrylink.persistence.*;

@Component
public class DemoDataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PartnerRepository partnerRepository;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    private final ReviewRepository reviewRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationPreferencesRepository notificationPreferencesRepository;
    private final PasswordEncoder passwordEncoder;

    public DemoDataSeeder(
            UserRepository userRepository,
            PartnerRepository partnerRepository,
            OrderRepository orderRepository,
            PaymentRepository paymentRepository,
            InvoiceRepository invoiceRepository,
            ReviewRepository reviewRepository,
            NotificationRepository notificationRepository,
            NotificationPreferencesRepository notificationPreferencesRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.partnerRepository = partnerRepository;
        this.orderRepository = orderRepository;
        this.paymentRepository = paymentRepository;
        this.invoiceRepository = invoiceRepository;
        this.reviewRepository = reviewRepository;
        this.notificationRepository = notificationRepository;
        this.notificationPreferencesRepository = notificationPreferencesRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        // Do nothing on startup to prevent automatic database resets/seeding.
    }

    @Transactional
    public void manualResetAndSeed() {
        System.out.println("[RESET LOG] Starting manual database reset and controlled seeding...");

        // 1. Clear operational data (using try-catch blocks and entity-level deleteAll to cascade properly)
        try {
            System.out.println("[RESET LOG] Deleting reviews...");
            reviewRepository.deleteAll();
            System.out.println("[RESET LOG] Reviews deleted successfully.");
        } catch (Exception e) {
            System.err.println("[RESET ERROR] Failed to delete reviews: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }

        try {
            System.out.println("[RESET LOG] Deleting notifications...");
            notificationRepository.deleteAll();
            System.out.println("[RESET LOG] Notifications deleted successfully.");
        } catch (Exception e) {
            System.err.println("[RESET ERROR] Failed to delete notifications: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }

        try {
            System.out.println("[RESET LOG] Deleting notification preferences...");
            notificationPreferencesRepository.deleteAll();
            System.out.println("[RESET LOG] Notification preferences deleted successfully.");
        } catch (Exception e) {
            System.err.println("[RESET ERROR] Failed to delete notification preferences: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }

        try {
            System.out.println("[RESET LOG] Deleting invoices...");
            invoiceRepository.deleteAll();
            System.out.println("[RESET LOG] Invoices deleted successfully.");
        } catch (Exception e) {
            System.err.println("[RESET ERROR] Failed to delete invoices: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }

        try {
            System.out.println("[RESET LOG] Deleting payments...");
            paymentRepository.deleteAll();
            System.out.println("[RESET LOG] Payments deleted successfully.");
        } catch (Exception e) {
            System.err.println("[RESET ERROR] Failed to delete payments: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }

        try {
            System.out.println("[RESET LOG] Deleting orders...");
            orderRepository.deleteAll();
            System.out.println("[RESET LOG] Orders deleted successfully.");
        } catch (Exception e) {
            System.err.println("[RESET ERROR] Failed to delete orders: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }

        try {
            System.out.println("[RESET LOG] Deleting partners...");
            partnerRepository.deleteAll();
            System.out.println("[RESET LOG] Partners deleted successfully.");
        } catch (Exception e) {
            System.err.println("[RESET ERROR] Failed to delete partners: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }

        try {
            System.out.println("[RESET LOG] Deleting users except Admin...");
            List<UserEntity> allUsers = userRepository.findAll();
            int deletedUsersCount = 0;
            for (UserEntity user : allUsers) {
                if (user.getRole() != UserRoleType.ADMIN && !user.getEmail().equalsIgnoreCase("admin@velora.example")) {
                    userRepository.delete(user);
                    deletedUsersCount++;
                }
            }
            userRepository.flush();
            System.out.println("[RESET LOG] Deleted " + deletedUsersCount + " users successfully.");
        } catch (Exception e) {
            System.err.println("[RESET ERROR] Failed to delete users: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }

        String passwordHash = passwordEncoder.encode("Password@123");

        // 2. Seed Controlled Demo Data
        List<UserEntity> customers = new ArrayList<>();
        try {
            System.out.println("[RESET LOG] Creating 3 Customers...");
            for (int i = 1; i <= 3; i++) {
                String email = "customer" + i + "@velora.example";
                UserEntity customer = new UserEntity(email, passwordHash, "Customer " + i, "+91-90000-1000" + i, UserRoleType.CUSTOMER);
                customer.setEmailVerified(true);
                userRepository.save(customer);
                notificationPreferencesRepository.save(new NotificationPreferencesEntity(email));
                customers.add(customer);
            }
            System.out.println("[RESET LOG] Customers created successfully.");
        } catch (Exception e) {
            System.err.println("[RESET ERROR] Failed to create customers: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }

        List<PartnerEntity> vendors = new ArrayList<>();
        try {
            System.out.println("[RESET LOG] Creating 2 Vendors...");
            for (int i = 1; i <= 2; i++) {
                String email = "vendor" + i + "@velora.example";
                String bizName = i == 1 ? "FreshFold Hub" : "SpinCycle Cleaners";

                UserEntity userPartner = new UserEntity(email, passwordHash, bizName, "+91-90000-2000" + i, UserRoleType.LAUNDRY_PARTNER);
                userPartner.setEmailVerified(true);
                userRepository.save(userPartner);
                notificationPreferencesRepository.save(new NotificationPreferencesEntity(email));

                PartnerEntity partner = new PartnerEntity(
                        email,
                        bizName,
                        "Premium professional laundry service specializing in wash, fold, dry clean, and iron.",
                        "Unit " + i + ", Metro Commercial Hub, Sector 15",
                        "ACTIVE"
                );
                partner.setOpeningTime("08:00");
                partner.setClosingTime("22:00");
                partner.setServiceSlaHours(24);
                partner.setDailyCapacityLimit(40);
                partner.setReputationScore(4.9);
                partner.setTotalReviews(15);

                List<String> zips = new ArrayList<>();
                zips.add("110017");
                partner.setServiceAreas(zips);

                List<RateCardItemEntity> rateCard = new ArrayList<>();
                rateCard.add(new RateCardItemEntity("SHIRT", "WASH_AND_FOLD", 40.0));
                rateCard.add(new RateCardItemEntity("SHIRT", "DRY_CLEAN", 80.0));
                rateCard.add(new RateCardItemEntity("PANTS", "WASH_AND_FOLD", 45.0));
                rateCard.add(new RateCardItemEntity("PANTS", "DRY_CLEAN", 90.0));
                rateCard.add(new RateCardItemEntity("SUIT", "DRY_CLEAN", 300.0));
                rateCard.add(new RateCardItemEntity("BLANKET", "DRY_CLEAN", 200.0));
                partner.setPricingRateCard(rateCard);

                partnerRepository.save(partner);
                vendors.add(partner);
            }
            System.out.println("[RESET LOG] Vendors created successfully.");
        } catch (Exception e) {
            System.err.println("[RESET ERROR] Failed to create vendors: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }

        List<UserEntity> riders = new ArrayList<>();
        try {
            System.out.println("[RESET LOG] Creating 3 Riders...");
            for (int i = 1; i <= 3; i++) {
                String email = "rider" + i + "@velora.example";
                UserEntity rider = new UserEntity(email, passwordHash, "Rider " + i, "+91-90000-3000" + i, UserRoleType.DELIVERY_PARTNER);
                rider.setEmailVerified(true);
                rider.setOnline(true);
                userRepository.save(rider);
                notificationPreferencesRepository.save(new NotificationPreferencesEntity(email));
                riders.add(rider);
            }
            System.out.println("[RESET LOG] Riders created successfully.");
        } catch (Exception e) {
            System.err.println("[RESET ERROR] Failed to create riders: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }

        try {
            System.out.println("[RESET LOG] Creating 33 Completed Historical Orders...");
            long now = System.currentTimeMillis() / 1000L;
            for (int j = 1; j <= 33; j++) {
                long orderTime = now - (j * 2L * 86400L); // Spaced by 2 days each

                UserEntity customer = customers.get(j % customers.size());
                PartnerEntity vendor = vendors.get(j % vendors.size());
                UserEntity pickupRider = riders.get(j % riders.size());
                UserEntity deliveryRider = riders.get((j + 1) % riders.size());

                String address = "Apartment " + (j % 10 + 101) + ", Sunshine Gardens, Sector 15";
                String orderId = UUID.randomUUID().toString();

                OrderEntity order = new OrderEntity();
                order.setOrderId(orderId);
                order.setCustomerEmail(customer.getEmail());
                order.setPartnerEmail(vendor.getEmail());
                order.setStatus(OrderStatus.DELIVERED);
                order.setPickupAddress(address);
                order.setPickupSlot("Monday 09:00 - 11:00");
                order.setDeliveryAddress(address);
                order.setDeliverySlot("Wednesday 14:00 - 16:00");
                order.setPickupRiderEmail(pickupRider.getEmail());
                order.setDeliveryPartnerEmail(deliveryRider.getEmail());
                order.setAcceptedByRider(true);
                order.setDisplayOrderId("VL" + (10000 + j));

                // Items and pricing
                List<OrderItemEntity> items = new ArrayList<>();
                items.add(new OrderItemEntity("SHIRT", "WASH_AND_FOLD", 2));
                items.add(new OrderItemEntity("PANTS", "WASH_AND_FOLD", 1));
                double totalCost = 40.0 * 2 + 45.0 * 1; // 125.0
                order.setItems(items);
                order.setTotalCost(totalCost);

                order.setCreatedAt(orderTime);
                long pickupAssignedTime = orderTime + 300;
                long pickupCompletedTime = orderTime + 2700;
                long processingTime = orderTime + 3600;
                long readyForDeliveryTime = orderTime + 18000;
                long deliveryAssignedTime = orderTime + 19000;
                long deliveredTime = orderTime + 21600;
                order.setUpdatedAt(deliveredTime);

                List<StatusTransitionEntity> history = new ArrayList<>();
                history.add(new StatusTransitionEntity(OrderStatus.PLACED, orderTime, "Order placed successfully."));
                history.add(new StatusTransitionEntity(OrderStatus.PICKUP_ASSIGNED, pickupAssignedTime, "Pickup rider assigned: " + pickupRider.getEmail()));
                history.add(new StatusTransitionEntity(OrderStatus.PICKUP_COMPLETED, pickupCompletedTime, "Clothes picked up from customer and delivered to vendor."));
                history.add(new StatusTransitionEntity(OrderStatus.PROCESSING, processingTime, "Laundry partner received clothes. Processing started."));
                history.add(new StatusTransitionEntity(OrderStatus.READY_FOR_DELIVERY, readyForDeliveryTime, "Laundry partner completed processing. Clothes ready for delivery."));
                history.add(new StatusTransitionEntity(OrderStatus.DELIVERY_ASSIGNED, deliveryAssignedTime, "Delivery rider assigned: " + deliveryRider.getEmail()));
                history.add(new StatusTransitionEntity(OrderStatus.DELIVERED, deliveredTime, "Laundry delivered successfully."));
                order.setHistory(history);

                // Payment
                String payId = "PAY-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
                PaymentEntity payment = new PaymentEntity(payId, orderId, totalCost, PaymentMethod.UPI, "TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
                payment.setCreatedAt(orderTime);
                payment.setStatus(PaymentStatus.SUCCESS);
                payment.setUpdatedAt(deliveredTime);

                order.setPaymentId(payId);

                orderRepository.save(order);
                paymentRepository.save(payment);

                // Invoice
                InvoiceEntity invoice = new InvoiceEntity(orderId, payId, customer.getEmail(), vendor.getEmail(), totalCost);
                invoice.setCreatedAt(deliveredTime);
                invoice.setGeneratedAt(deliveredTime);
                invoice.setUpdatedAt(deliveredTime);

                List<InvoiceItemEntity> invItems = new ArrayList<>();
                invItems.add(new InvoiceItemEntity("SHIRT", "WASH_AND_FOLD", 2));
                invItems.add(new InvoiceItemEntity("PANTS", "WASH_AND_FOLD", 1));
                invoice.setItems(invItems);
                invoiceRepository.save(invoice);

                // Review
                int rating = (j % 5 == 0) ? 4 : 5;
                String comment = (j % 2 == 0) ? "Clean washing and super fast delivery!" : "Great service, highly professional laundry partner!";
                ReviewEntity review = new ReviewEntity(orderId, customer.getEmail(), vendor.getEmail(), rating, comment);
                review.setCreatedAt(deliveredTime + 600);
                review.setUpdatedAt(deliveredTime + 600);
                reviewRepository.save(review);
            }
            System.out.println("[RESET LOG] 33 Completed Historical Orders created successfully.");
        } catch (Exception e) {
            System.err.println("[RESET ERROR] Failed to create historical orders: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }

        System.out.println("[RESET LOG] Manual reset and controlled demo seeding completed successfully!");
    }
}
