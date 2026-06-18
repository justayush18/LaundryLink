package com.laundrylink.laundrylink.service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.Random;

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
        if (isRunningTest()) {
            return;
        }
        // Run seeder only if our production dataset is not yet loaded
        if (userRepository.findByEmail("cust100@velora.example").isEmpty()) {
            seedProductionData();
        }
    }

    private boolean isRunningTest() {
        String command = System.getProperty("sun.java.command", "").toLowerCase();
        if (command.contains("surefire") || command.contains("junit") || command.contains("test")) {
            return true;
        }
        for (StackTraceElement element : Thread.currentThread().getStackTrace()) {
            String className = element.getClassName().toLowerCase();
            if (className.contains("junit") || className.contains("surefire") || className.contains("test")) {
                return true;
            }
        }
        return false;
    }

    private void seedProductionData() {
        System.out.println("[SEED] Starting realistic production data seeding...");

        String passwordHash = passwordEncoder.encode("Password@123");
        Random rand = new Random(42);

        // Predefined pools for name generation
        String[] firstNames = {
            "Aarav", "Neha", "Vikram", "Ananya", "Rohan", "Pooja", "Sanjay", "Kiran", "Aditya", "Priya",
            "Karan", "Ishita", "Vijay", "Deepa", "Rajesh", "Divya", "Suresh", "Sunita", "Arjun", "Meera",
            "Amit", "Shweta", "Kabir", "Riya", "Yash", "Tanya", "Nikhil", "Kavita", "Rahul", "Sneha",
            "Harish", "Shalini", "Vivek", "Aarti", "Anil", "Jyoti", "Sunil", "Preeti", "Manoj", "Ritu"
        };

        String[] lastNames = {
            "Mehta", "Gupta", "Singh", "Patel", "Sharma", "Yadav", "Joshi", "Iyer", "Nair", "Rao",
            "Verma", "Reddy", "Choudhury", "Mishra", "Das", "Sen", "Bose", "Kapoor", "Khanna", "Trivedi",
            "Bhatia", "Malhotra", "Saxena", "Gill", "Dhillon", "Pillai", "Hegde", "Shenoy", "Prabhu"
        };

        // 1. Seed 110 Customers
        List<UserEntity> customers = new ArrayList<>();
        // Add default customer if not already in list
        userRepository.findByEmail("aarav@example.com").ifPresent(customers::add);

        for (int i = 1; i <= 110; i++) {
            String fName = firstNames[i % firstNames.length];
            String lName = lastNames[(i * 3) % lastNames.length];
            String displayName = fName + " " + lName;
            String email = "cust" + i + "@velora.example";
            String phone = "+91-98765-" + String.format("%05d", i);

            if (userRepository.findByEmail(email).isEmpty()) {
                UserEntity customer = new UserEntity(email, passwordHash, displayName, phone, UserRoleType.CUSTOMER);
                userRepository.save(customer);
                notificationPreferencesRepository.save(new NotificationPreferencesEntity(email));
                customers.add(customer);
            }
        }
        System.out.println("[SEED] Seeded " + customers.size() + " customers.");

        // 2. Seed 18 Laundry Partners
        String[] businessNames = {
            "WashPro Express", "LuxeDry Cleaners", "Elite Garment Care", "QuickWash Laundromat",
            "Sparkle & Shine", "The Green Laundry Co.", "Urban Cleaners", "Fresh & Fold Station",
            "White Glove Laundry", "Soapy Bubbles Wash", "Royal Dry Cleaning", "Fabric Care Hub",
            "Pure Cleaners", "Spin Cycle Studio", "EcoWash Boutique", "Steam & Iron Experts",
            "Blue Ribbon Cleaners", "Neighborhood Wash"
        };

        List<PartnerEntity> activePartners = new ArrayList<>();
        for (int i = 1; i <= 18; i++) {
            String bizName = businessNames[i - 1];
            String email = "partner" + i + "@velora.example";
            String phone = "+91-90000-" + String.format("20%03d", i);

            // Register user entity
            UserEntity userPartner = userRepository.findByEmail(email)
                    .orElseGet(() -> userRepository.save(new UserEntity(email, passwordHash, bizName, phone, UserRoleType.LAUNDRY_PARTNER)));
            notificationPreferencesRepository.save(new NotificationPreferencesEntity(email));

            // Onboarding status: 16 active, 1 pending, 1 rejected
            String status = "ACTIVE";
            if (i == 17) status = "PENDING";
            if (i == 18) status = "REJECTED";

            PartnerEntity partner = partnerRepository.findByEmail(email).orElse(null);
            if (partner == null) {
                partner = new PartnerEntity(
                        email,
                        bizName,
                        "Your trusted laundry expert. Specializing in dry cleaning, express washing, and hand-pressed ironing.",
                        "Unit " + i + ", Block C, Industrial Sector, Metro City",
                        status
                );

                // Set reputation
                if (status.equals("ACTIVE")) {
                    double reputation = 4.8 - (i % 6) * 0.3;
                    if (i == 16) {
                        reputation = 2.5; // Poor performer
                    }
                    partner.setReputationScore(reputation);
                    partner.setTotalReviews(i == 16 ? 15 : (i * 2));
                }

                // Service zip codes
                List<String> zips = new ArrayList<>();
                zips.add("110017");
                zips.add(String.valueOf(110000 + i % 100));
                partner.setServiceAreas(zips);

                // Availability slots
                List<AvailabilitySlotEntity> slots = new ArrayList<>();
                slots.add(new AvailabilitySlotEntity("Monday", "08:00", "17:00", 30));
                slots.add(new AvailabilitySlotEntity("Wednesday", "08:00", "17:00", 30));
                slots.add(new AvailabilitySlotEntity("Friday", "08:00", "20:00", 40));
                partner.setAvailabilitySlots(slots);

                // Documents
                List<PartnerDocumentEntity> docs = new ArrayList<>();
                String docStatus = status.equals("PENDING") ? "PENDING_VERIFICATION" : (status.equals("REJECTED") ? "REJECTED" : "VERIFIED");
                String rejectReason = status.equals("REJECTED") ? "Scanned document is blurry and illegible." : null;
                docs.add(new PartnerDocumentEntity(UUID.randomUUID().toString(), "GSTIN", "gst_cert_" + i + ".pdf", docStatus, rejectReason));
                docs.add(new PartnerDocumentEntity(UUID.randomUUID().toString(), "BUSINESS_LICENSE", "license_" + i + ".png", docStatus, rejectReason));
                partner.setDocuments(docs);

                // Rate Card
                List<RateCardItemEntity> rateCard = new ArrayList<>();
                rateCard.add(new RateCardItemEntity("SHIRT", "WASH_AND_FOLD", 40.0 + (i % 3) * 5));
                rateCard.add(new RateCardItemEntity("SHIRT", "DRY_CLEAN", 80.0 + (i % 4) * 10));
                rateCard.add(new RateCardItemEntity("PANTS", "WASH_AND_FOLD", 45.0 + (i % 3) * 5));
                rateCard.add(new RateCardItemEntity("PANTS", "DRY_CLEAN", 90.0 + (i % 4) * 10));
                rateCard.add(new RateCardItemEntity("SUIT", "DRY_CLEAN", 300.0 + (i % 5) * 20));
                rateCard.add(new RateCardItemEntity("BLANKET", "DRY_CLEAN", 200.0 + (i % 5) * 15));
                partner.setPricingRateCard(rateCard);

                partnerRepository.save(partner);
            }
            if (status.equals("ACTIVE")) {
                activePartners.add(partner);
            }
        }
        // Include default partner
        partnerRepository.findByEmail("partner@freshfold.example").ifPresent(activePartners::add);
        System.out.println("[SEED] Seeded " + activePartners.size() + " active partners.");

        // 3. Seed 25 Delivery Partners
        List<UserEntity> riders = new ArrayList<>();
        userRepository.findByEmail("ravi.delivery@example.com").ifPresent(riders::add);

        for (int i = 1; i <= 25; i++) {
            String fName = firstNames[(i * 2) % firstNames.length];
            String lName = lastNames[(i * 4) % lastNames.length];
            String displayName = fName + " " + lName + " (Delivery)";
            String email = "rider" + i + "@velora.example";
            String phone = "+91-90000-" + String.format("30%03d", i);

            if (userRepository.findByEmail(email).isEmpty()) {
                UserEntity rider = new UserEntity(email, passwordHash, displayName, phone, UserRoleType.DELIVERY_PARTNER);
                userRepository.save(rider);
                notificationPreferencesRepository.save(new NotificationPreferencesEntity(email));
                riders.add(rider);
            }
        }
        System.out.println("[SEED] Seeded " + riders.size() + " delivery riders.");

        // 4. Seed 360 Historical Orders spread across past 90 days
        long now = System.currentTimeMillis() / 1000L;
        long secondsIn90Days = 90L * 86400L;
        int orderCount = 360;

        System.out.println("[SEED] Seeding " + orderCount + " historical orders, payments, invoices, and reviews...");
        int reviewCount = 0;
        int notifCount = 0;

        for (int j = 1; j <= orderCount; j++) {
            // Distribute orders chronologically
            long orderTime = now - secondsIn90Days + (j * secondsIn90Days / orderCount);

            // Determine status
            OrderStatus status = OrderStatus.DELIVERED;
            if (j > 354) {
                status = OrderStatus.CANCELLED;
            } else if (j > 350) {
                status = OrderStatus.PLACED;
            } else if (j > 345) {
                status = OrderStatus.ACCEPTED;
            } else if (j > 337) {
                status = OrderStatus.PICKUP_ASSIGNED;
            } else if (j > 327) {
                status = OrderStatus.PICKED_UP;
            } else if (j > 315) {
                status = OrderStatus.PROCESSING;
            } else if (j > 300) {
                status = OrderStatus.READY_FOR_DELIVERY;
            }

            UserEntity customer = customers.get(j % customers.size());
            PartnerEntity partner = activePartners.get(j % activePartners.size());
            UserEntity rider = riders.get(j % riders.size());

            // Order attributes
            String address = "Apartment " + (j % 60 + 1) + ", Oakwood Residency, Zip 110017";
            String orderId = "ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

            OrderEntity order = new OrderEntity();
            order.setOrderId(orderId);
            order.setCustomerEmail(customer.getEmail());
            order.setPartnerEmail(partner.getEmail());
            order.setStatus(status);
            order.setPickupAddress(address);
            order.setPickupSlot("Monday 09:00 - 11:00");
            order.setDeliveryAddress(address);
            order.setDeliverySlot("Wednesday 14:00 - 16:00");

            if (status != OrderStatus.PLACED && status != OrderStatus.ACCEPTED && status != OrderStatus.CANCELLED) {
                order.setDeliveryPartnerEmail(rider.getEmail());
            }

            // Items and pricing
            List<OrderItemEntity> items = new ArrayList<>();
            double totalCost = 0.0;
            int numItems = 1 + (j % 3);

            for (int k = 0; k < numItems; k++) {
                String category = "SHIRT";
                if (k == 1) category = "PANTS";
                if (k == 2) category = "SUIT";
                if (k == 3) category = "BLANKET";

                String service = (j % 2 == 0) ? "WASH_AND_FOLD" : "DRY_CLEAN";
                if (category.equals("SUIT")) service = "DRY_CLEAN";

                String finalCat = category;
                String finalServ = service;
                double ratePrice = partner.getPricingRateCard().stream()
                        .filter(rc -> rc.getItemCategory().equals(finalCat) && rc.getServiceType().equals(finalServ))
                        .findFirst()
                        .map(RateCardItemEntity::getPrice)
                        .orElse(50.0);

                int qty = 1 + (j % 2);
                items.add(new OrderItemEntity(category, service, qty));
                totalCost += ratePrice * qty;
            }
            order.setItems(items);
            order.setTotalCost(totalCost);

            // Set timestamps
            order.setCreatedAt(orderTime);
            long updateTime = orderTime + 14400; // 4 hours later by default
            if (status == OrderStatus.DELIVERED) {
                updateTime = orderTime + 2 * 86400; // 2 days later completed
            }
            order.setUpdatedAt(updateTime);

            // History transition logs
            List<StatusTransitionEntity> history = new ArrayList<>();
            history.add(new StatusTransitionEntity(OrderStatus.PLACED, orderTime, "Order placed successfully."));

            if (status != OrderStatus.PLACED && status != OrderStatus.CANCELLED) {
                history.add(new StatusTransitionEntity(OrderStatus.ACCEPTED, orderTime + 300, "Laundry partner accepted."));
                if (status != OrderStatus.ACCEPTED) {
                    history.add(new StatusTransitionEntity(OrderStatus.PICKUP_ASSIGNED, orderTime + 900, "Rider assigned for pickup."));
                    if (status != OrderStatus.PICKUP_ASSIGNED) {
                        history.add(new StatusTransitionEntity(OrderStatus.PICKED_UP, orderTime + 1800, "Order picked up."));
                        if (status != OrderStatus.PICKED_UP) {
                            history.add(new StatusTransitionEntity(OrderStatus.PROCESSING, orderTime + 3600, "Processing inside laundry shop."));
                            if (status != OrderStatus.PROCESSING) {
                                history.add(new StatusTransitionEntity(OrderStatus.READY_FOR_DELIVERY, orderTime + 10800, "Laundry ready."));
                                if (status != OrderStatus.READY_FOR_DELIVERY) {
                                    history.add(new StatusTransitionEntity(OrderStatus.DELIVERY_ASSIGNED, orderTime + 12000, "Out for delivery."));
                                    if (status == OrderStatus.DELIVERED) {
                                        history.add(new StatusTransitionEntity(OrderStatus.DELIVERED, updateTime, "Delivered successfully."));
                                    }
                                }
                            }
                        }
                    }
                }
            } else if (status == OrderStatus.CANCELLED) {
                history.add(new StatusTransitionEntity(OrderStatus.CANCELLED, orderTime + 600, "Order cancelled by system/user."));
            }
            order.setHistory(history);

            // Payments
            PaymentMethod method = (j % 3 == 0) ? PaymentMethod.UPI : ((j % 3 == 1) ? PaymentMethod.RAZORPAY : PaymentMethod.COD);
            String payId = "PAY-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            String txnId = "TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

            PaymentEntity payment = new PaymentEntity(payId, orderId, totalCost, method, txnId);
            payment.setCreatedAt(orderTime);

            PaymentStatus payStatus = PaymentStatus.PENDING;
            if (status == OrderStatus.DELIVERED) {
                payStatus = PaymentStatus.SUCCESS;
            } else if (status == OrderStatus.CANCELLED) {
                payStatus = PaymentStatus.FAILED;
            } else if (method != PaymentMethod.COD) {
                payStatus = PaymentStatus.SUCCESS; // Prepaid online successful
            }
            payment.setStatus(payStatus);
            payment.setUpdatedAt(updateTime);

            order.setPaymentId(payId);

            // Save order and payment
            orderRepository.save(order);
            paymentRepository.save(payment);

            // Invoice
            if (payStatus == PaymentStatus.SUCCESS) {
                InvoiceEntity invoice = new InvoiceEntity(orderId, payId, customer.getEmail(), partner.getEmail(), totalCost);
                invoice.setCreatedAt(updateTime);
                invoice.setGeneratedAt(updateTime);
                invoice.setUpdatedAt(updateTime);

                List<InvoiceItemEntity> invItems = new ArrayList<>();
                for (OrderItemEntity oi : items) {
                    invItems.add(new InvoiceItemEntity(oi.getItemCategory(), oi.getServiceType(), oi.getQuantity()));
                }
                invoice.setItems(invItems);
                invoiceRepository.save(invoice);
            }

            // Reviews (around 90 reviews total for completed orders)
            if (status == OrderStatus.DELIVERED && j <= 100) {
                int rating = 4;
                String comment = "Great service and clean washing!";
                if (partner.getEmail().equals("partner16@velora.example")) {
                    rating = 2; // Poor rating
                    comment = "Clothes had a bad odor and delivery was extremely late.";
                } else if (j % 5 == 0) {
                    rating = 5;
                    comment = "Exceptional quality, clothes look and smell like new!";
                } else if (j % 7 == 0) {
                    rating = 3;
                    comment = "Clean but minor delays in pickup.";
                }

                ReviewEntity review = new ReviewEntity(orderId, customer.getEmail(), partner.getEmail(), rating, comment);
                review.setCreatedAt(updateTime + 1800);
                review.setUpdatedAt(updateTime + 1800);
                reviewRepository.save(review);
                reviewCount++;
            }

            // Notifications
            if (j >= 280) { // Limit notifications to latest 80 orders to keep database clean
                NotificationEntity notifCust = new NotificationEntity(
                        customer.getEmail(),
                        NotificationType.ORDER_STATUS,
                        "Your order " + orderId + " is now in " + status + " status.",
                        true
                );
                notifCust.setCreatedAt(updateTime);
                notifCust.setUpdatedAt(updateTime);
                notifCust.setRead(j % 5 == 0); // Seed some read notifications
                notificationRepository.save(notifCust);
                notifCount++;
            }
        }

        System.out.println("[SEED] Seeded 360 orders, payments and invoices.");
        System.out.println("[SEED] Seeded " + reviewCount + " customer reviews.");
        System.out.println("[SEED] Seeded " + notifCount + " notifications.");
        System.out.println("[SEED] Completed database populating successfully!");
    }
}
