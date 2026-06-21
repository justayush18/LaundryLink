<p align="center">
  <img src="docs/images/features.png" alt="Velora – Smart Laundry Management Platform" width="800"/>
</p>

<h1 align="center">🧺 Velora (LaundryLink)</h1>

<p align="center">
  <b>A full-stack, multi-role laundry management platform connecting Customers, Laundry Partners, Delivery Riders, and Administrators.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Spring%20Boot-4.1.0-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white" alt="Spring Boot"/>
  <img src="https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"/>
  <img src="https://img.shields.io/badge/Vite-8.x-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite"/>
  <img src="https://img.shields.io/badge/MySQL-8.x-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL"/>
  <img src="https://img.shields.io/badge/Java-21-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white" alt="Java 21"/>
  <img src="https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=json-web-tokens&logoColor=white" alt="JWT"/>
</p>

<p align="center">
  <a href="#-overview">Overview</a> •
  <a href="#-features">Features</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-order-lifecycle">Order Lifecycle</a> •
  <a href="#-database-schema">Database Schema</a> •
  <a href="#-project-structure">Project Structure</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-database-reset--seeding">Database Reset</a> •
  <a href="#-demo-credentials">Demo Credentials</a> •
  <a href="#-api-documentation">API Docs</a> •
  <a href="#-testing">Testing</a> •
  <a href="#-design-system">Design System</a>
</p>

---

## 📖 Overview

**Velora** (formerly LaundryLink) is a production-style, full-stack web application designed to digitize the entire laundry service lifecycle. It connects customers, laundry business owners, delivery partners, and administrators in a single unified platform. 

The platform supports **four distinct user roles**, each with a dedicated dashboard, custom theme styling, and targeted features:

| Role | Description |
|------|-------------|
| 🧑‍💼 **Customer** | Place orders, select laundry partners, pick item-level options, track statuses in real-time, pay invoices, and review partners. |
| 🏪 **Laundry Partner** | Manage active orders, process clothes, configure item pricing cards, upload KYC/business documents, and monitor earnings analytics. |
| 🚚 **Delivery Partner** | Toggle online availability, fulfill assigned pickup and delivery runs, and track daily/weekly/monthly earnings. |
| 🛡️ **Admin** | Oversee platform operations, enable/disable accounts, verify and approve partners, audit orders/payments, and generate financial reports. |

The system ships with a **manual database reset endpoint** and a **PowerShell administration script** that clears operational transactional data and seeds a highly realistic historical dataset. It populates 33 completed orders, reviews, payments, and notifications spanning a multi-month period, creating a rich demonstration experience.

---

## ✨ Features

### Customer Portal
- 📦 **Multi-Step Order Wizard** — Choose laundry partners based on location and rating, select item categories (shirts, suits, blankets), choose wash methods (wash & fold, dry clean), and schedule pickup/delivery times.
- 📍 **Order Timeline & Tracking** — Live tracking using sequential human-readable IDs (`VL10001`, `VL10002`) across the 8-state simplified lifecycle.
- 💳 **Payments & Invoicing** — View receipts, invoice details, transaction history, and pay securely using simulated gateways.
- ⭐ **Reviews & Rating System** — Rate laundry partners on a 5-star scale and provide detailed feedback.
- 🔔 **Notification Center** — Real-time in-app badge alerts for order assignments, completions, and billing.

### Laundry Partner Portal
- 📋 **Order Processing** — Clean interface to manage incoming, processing, and ready orders.
- 💰 **Dynamic Rate Cards** — Define base prices for dry cleaning, ironing, and washing per garment type.
- 📄 **Document Submissions** — Upload GST certificate, business license, and ID proofs with dynamic format validation.
- 📊 **Revenue Dashboard** — Performance analytics detailing total order counts, average customer reviews, and monthly revenue.

### Delivery Partner (Rider) Portal
- 🏍️ **Task Fulfillment** — Receive automatically matched pickup and delivery jobs. Single-click actions to complete pickups or deliveries.
- 🟢 **Online/Offline Status** — Toggle online status to register with the auto-matching engine.
- 💵 **Earnings & Metrics** — Real-time tracking of successful run counts, average review rating, and total earnings.

### Admin Dashboard
- 👥 **User Management** — View and search registrations, and instantly enable/disable user accounts.
- 🏢 **Partner Moderation** — Review submitted KYC documents and approve/reject partner accounts.
- ⚙️ **Cancellation Penalty Settings** — Set custom cancellation penalty percentages for individual partners.
- 📊 **Platform Ledger** — Monitor all payments, refunds, active orders, and system notifications.
- ♻️ **Database Reset Control** — Single-click secure API to reset database transaction tables and seed realistic demo state.

---

## 🏛️ Architecture

<p align="center">
  <img src="docs/images/architecture.png" alt="System Architecture Diagram" width="800"/>
</p>

Velora follows a robust **three-tier architecture**:

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND                          │
│          React 19 + Vite 8 + React Router 7         │
│     Glassmorphic UI · Recharts · Lucide Icons       │
├─────────────────────────────────────────────────────┤
│                 REST API (JSON)                     │
│              JWT Authentication                     │
├─────────────────────────────────────────────────────┤
│                   BACKEND                           │
│           Spring Boot 4.1 · Java 21                 │
│    Spring Security · Spring Data JPA · Swagger      │
├─────────────────────────────────────────────────────┤
│                  DATABASE                           │
│              MySQL 8.x · Hibernate                  │
│   Users · Orders · Payments · Reviews · Invoices    │
└─────────────────────────────────────────────────────┘
```

### Key Design Upgrades

| Decision | Rationale |
|----------|-----------|
| **Sequential Display IDs** | Instead of exposing raw UUIDs to users, Velora generates sequential IDs (e.g. `VL10001`, `VL10002`). The generator dynamically scans the database for the highest existing numerical ID and increments it, preventing gaps or duplicates during deletions or resets. |
| **Simplified Workflow** | Intermediate, confusing order states have been consolidated into an elegant 8-state deterministic flow. Manual claiming flows are eliminated, ensuring all assignments are processed securely by the system. |
| **Separate Rider Matching** | The matching engine enforces a business rule where a different online rider is assigned to the pickup phase and the delivery phase (if multiple online riders are available). It falls back to the same rider only if no other rider is online. |
| **Secure Admin DB Reset** | A dedicated `/api/v1/admin/reset-database` endpoint truncates operational records while preserving the admin user configuration (`admin@velora.example`). |

---

## 🔄 Order Lifecycle

<p align="center">
  <img src="docs/images/order-flow.png" alt="Order Lifecycle Diagram" width="800"/>
</p>

Velora handles order progress deterministically through 8 status checkpoints:

```text
  ORDER_PLACED
       │
       ▼
  PICKUP_RIDER_ASSIGNED   <-- System matches online Rider 1
       │
       ▼
  PICKUP_COMPLETED        <-- Rider 1 collects clothes and delivers them to Vendor
       │
       ▼
  PROCESSING              <-- Vendor begins washing/ironing
       │
       ▼
  READY_FOR_DELIVERY      <-- Vendor finishes processing
       │
       ▼
  DELIVERY_RIDER_ASSIGNED <-- System matches online Rider 2 (Rider 2 != Rider 1 if available)
       │
       ▼
  DELIVERED               <-- Rider 2 delivers clothes to Customer
```

- **Riders**: Manually progress status from `PICKUP_RIDER_ASSIGNED` -> `PICKUP_COMPLETED` (delivered to partner) and `DELIVERY_RIDER_ASSIGNED` -> `DELIVERED`.
- **Vendors**: Manually progress status from `PICKUP_COMPLETED` -> `PROCESSING` -> `READY_FOR_DELIVERY`.
- **System**: Automatically assigns eligible riders immediately upon placement and when marked ready for delivery.

---

## 🗃️ Database Schema

<p align="center">
  <img src="docs/images/erd.png" alt="Entity Relationship Diagram" width="800"/>
</p>

### Core Entities

| Entity | Description | Key Fields |
|--------|-------------|------------|
| `UserEntity` | All users registered in the system. | `email` (PK), `name`, `password`, `phone`, `role`, `enabled`, `online` |
| `PartnerEntity` | Profile details for laundry business vendors. | `email` (FK), `businessName`, `approved`, `reputationScore`, `cancellationPenaltyPerOrder` |
| `OrderEntity` | Main laundry order records. | `id` (UUID), `displayOrderId`, `customerEmail`, `partnerEmail`, `pickupRiderEmail`, `deliveryPartnerEmail`, `status`, `totalCost` |
| `OrderItemEntity` | Item lines within an order. | `id`, `orderId`, `itemName`, `washType`, `quantity`, `pricePerItem` |
| `PaymentEntity` | Transaction states for billing. | `id`, `orderId`, `amount`, `paymentMethod`, `paymentStatus`, `transactionId` |
| `InvoiceEntity` | Customer billing document records. | `id`, `orderId`, `paymentId`, `invoiceNumber`, `totalAmount`, `invoiceStatus` |
| `ReviewEntity` | Star ratings and comments given to vendors. | `id`, `orderId`, `customerEmail`, `partnerEmail`, `rating`, `comment` |
| `NotificationEntity` | User alerts history database. | `id`, `recipientEmail`, `message`, `type`, `isRead` |

---

## 📁 Project Structure

```
laundrylink/
│
├── 📄 pom.xml                          # Maven project config (Spring Boot 4.1, Java 21)
├── 📄 mvnw / mvnw.cmd                  # Maven wrapper scripts for Linux/Windows
├── 📄 openapi_spec.json               # Exported static OpenAPI 3.0 specification
├── 📄 ARCHITECTURE.md                  # System architecture design notes
├── 📄 PROJECT_JOURNEY.md               # Core development progress journal
├── 📄 task.md                          # UI/UX redesign progress checklists
│
├── 📂 src/                             # ── BACKEND (Java & Spring Boot) ──────
│   ├── 📂 main/
│   │   ├── 📂 java/com/laundrylink/laundrylink/
│   │   │   ├── 📄 LaundrylinkApplication.java     # Backend Entrypoint class
│   │   │   │
│   │   │   ├── 📂 api/                             # Controllers & Data Transfer Objects (DTOs)
│   │   │   │   ├── 📄 AuthController.java          #   POST /api/v1/auth/login, /register, /verify-otp
│   │   │   │   ├── 📄 OrderController.java         #   CRUD /api/v1/orders, cancellation estimates
│   │   │   │   ├── 📄 PaymentController.java       #   POST /api/v1/payments/initiate, invoices lookup
│   │   │   │   ├── 📄 ReviewController.java        #   POST /api/v1/reviews, history lookups
│   │   │   │   ├── 📄 AdminController.java         #   GET /api/v1/admin/dashboard, reset database
│   │   │   │   ├── 📄 LaundryPartnerController.java#   GET/PUT rate cards, upload KYC docs
│   │   │   │   ├── 📄 DeliveryController.java      #   GET /api/v1/deliveries/dashboard, toggle availability
│   │   │   │   ├── 📄 NotificationController.java  #   GET/POST/PUT user in-app notifications
│   │   │   │   ├── 📄 UserManagementController.java#   GET/PUT user profile details
│   │   │   │   ├── 📄 BlueprintController.java     #   Endpoints returning system service blueprints
│   │   │   │   ├── 📄 StakeholderController.java   #   Mock endpoint detailing system roles
│   │   │   │   ├── 📄 HealthController.java        #   API health check responder
│   │   │   │   └── 📄 *View.java / *Request.java   #   Strict API DTOs (Request wrappers & Views)
│   │   │   │
│   │   │   ├── 📂 service/                         # Business Logic Implementation Layer
│   │   │   │   ├── 📄 AuthService.java             #   JWT generation, user registration, OTP codes
│   │   │   │   ├── 📄 OrderService.java            #   Display IDs generation, order transitions, rider matching
│   │   │   │   ├── 📄 PaymentService.java          #   Invoice mapping, refunds, simulated gateway triggers
│   │   │   │   ├── 📄 ReviewService.java           #   Review submissions, vendor reputation recalculations
│   │   │   │   ├── 📄 AdminService.java            #   Dashboard KPIs builder, profile toggles
│   │   │   │   ├── 📄 LaundryPartnerService.java   #   Document saves, rate card persistence
│   │   │   │   ├── 📄 NotificationService.java     #   Transactional messaging router
│   │   │   │   ├── 📄 UserManagementService.java   #   Updates password & phone records
│   │   │   │   ├── 📄 BlueprintCatalogService.java #   Predefined system services catalog
│   │   │   │   ├── 📄 StakeholderCatalogService.java#  System roles metadata catalog
│   │   │   │   ├── 📄 DemoDataSeeder.java          #   Manual DB truncator & 33 completed orders generator
│   │   │   │   ├── 📄 PaymentProcessor.java        #   Core payment interface
│   │   │   │   └── 📄 SimulatedPaymentProcessor.java # Mock payment processor implementation
│   │   │   │
│   │   │   ├── 📂 persistence/                     # Spring Data JPA Repository & Database Entities
│   │   │   │   ├── 📄 AuditedEntity.java           #   Base class providing createdAt/updatedAt columns
│   │   │   │   ├── 📄 UserEntity.java              #   Authentication logins table
│   │   │   │   ├── 📄 PartnerEntity.java           #   Business vendors registration records
│   │   │   │   ├── 📄 OrderEntity.java             #   Laundry orders transactional table
│   │   │   │   ├── 📄 OrderItemEntity.java         #   Garment items within orders
│   │   │   │   ├── 📄 PaymentEntity.java           #   Transaction ledgers
│   │   │   │   ├── 📄 InvoiceEntity.java           #   Invoices and payment receipts
│   │   │   │   ├── 📄 InvoiceItemEntity.java       #   Detailed items for invoices
│   │   │   │   ├── 📄 ReviewEntity.java            #   Customer feedback and ratings
│   │   │   │   ├── 📄 NotificationEntity.java      #   System alerts logs
│   │   │   │   ├── 📄 NotificationPreferencesEntity.java # User alert controls settings
│   │   │   │   ├── 📄 PartnerDocumentEntity.java   #   Uploaded verification docs
│   │   │   │   ├── 📄 AvailabilitySlotEntity.java  #   Rider slots timeline
│   │   │   │   ├── 📄 RateCardItemEntity.java      #   Pricing card records per vendor
│   │   │   │   ├── 📄 StatusTransitionEntity.java  #   Audit trail tracker of order transitions
│   │   │   │   └── 📄 *Repository.java             #   Spring Data JPA repositories (8 interfaces)
│   │   │   │
│   │   │   └── 📂 security/                        # Web Security and CORS Configurations
│   │   │       ├── 📄 SecurityConfig.java          #   Stateless session manager, endpoints restrictions
│   │   │       ├── 📄 JwtService.java              #   JWT signer, parser, and expiration checker
│   │   │       ├── 📄 JwtAuthenticationFilter.java #   Security interceptor validating Authorization headers
│   │   │       └── 📄 AuthenticatedPrincipal.java  #   CustomUserDetails implementation
│   │   │
│   │   └── 📂 resources/
│   │       └── 📄 application.properties           # Database URL, credentials, and Hibernate parameters
│   │
│   └── 📂 test/java/com/laundrylink/laundrylink/  # ── BACKEND UNIT & INTEGRATION TESTS ──
│       ├── 📂 integration/                         # E2E API Flow Verification Tests
│       │   ├── 📄 AdminDashboardTest.java          #   Validates user enabling, partner approvals, stats
│       │   ├── 📄 AuthenticationFlowTest.java      #   Tests registration, JWT, and invalid logons
│       │   ├── 📄 DeliveryLifecycleTest.java       #   Tests rider assignment, availability toggles
│       │   ├── 📄 NotificationTest.java            #   Tests notification center CRUD operations
│       │   ├── 📄 OrderLifecycleTest.java          #   Tests place orders, status moves, display order ID logic
│       │   ├── 📄 PaymentLifecycleTest.java        #   Tests payments, invoice generation, refunds
│       │   └── 📄 ReviewRatingTest.java           #   Tests partner rating updates and reviews history
│       └── 📂 service/                             # Unit tests for Business Logic
│           ├── 📄 AdminServiceTest.java
│           ├── 📄 AuthServiceTest.java
│           ├── 📄 NotificationServiceTest.java
│           ├── 📄 OrderServiceTest.java
│           ├── 📄 PaymentServiceTest.java
│           └── 📄 ReviewServiceTest.java
│
├── 📂 frontend/                        # ── FRONTEND (Vite + React App) ───────
│   ├── 📄 package.json                 # Node modules scripts & dependencies
│   ├── 📄 vite.config.js              # Vite config for proxies and build assets
│   ├── 📄 index.html                  # App DOM entry mount file
│   ├── 📄 eslint.config.js            # Linter rules
│   │
│   └── 📂 src/
│       ├── 📄 main.jsx                # React mount initiator
│       ├── 📄 App.jsx                 # Routes declarations and layout wrapper
│       ├── 📄 App.css                 # Main layout frame CSS
│       ├── 📄 index.css               # Velora primary design system (glassmorphism tokens)
│       ├── 📄 velora-animations.css   # Custom CSS keyframes and interactive animations
│       │
│       ├── 📂 components/              # Client Components
│       │   ├── 📂 Home/
│       │   │   └── 📄 Homepage.jsx        #   Landing page with animated call-to-actions
│       │   ├── 📂 Auth/
│       │   │   ├── 📄 Login.jsx           #   Interactive dark login card
│       │   │   ├── 📄 Register.jsx        #   Multi-role registration card
│       │   │   ├── 📄 VerifyOtp.jsx       #   OTP code verification dialog
│       │   │   └── 📄 OnboardingTerms.jsx #   Legal terms check dialog
│       │   ├── 📂 Common/
│       │   │   ├── 📄 Navbar.jsx          #   Top branding header
│       │   │   ├── 📄 Sidebar.jsx         #   Classic system navigation drawer
│       │   │   ├── 📄 FloatingNav.jsx     #   Velora curved glass sidebar navigation
│       │   │   ├── 📄 ProtectedRoute.jsx  #   JWT checker guarding routes
│       │   │   ├── 📄 StatCard.jsx        #   Reusable dashboard KPI cards
│       │   │   ├── 📄 EmptyState.jsx      #   Polished no-data illustration card
│       │   │   ├── 📄 FloatingBubbles.jsx #   Dynamic canvas float animation
│       │   │   ├── 📄 WaveBackground.jsx  #   Layered SVG background element
│       │   │   ├── 📄 VeloraMascot.jsx    #   Interactive system feedback mascot
│       │   │   └── 📄 TermsAndPolicies.jsx#   Legal policies viewport
│       │   ├── 📂 Customer/
│       │   │   ├── 📄 CustomerDashboard.jsx  #  Timeline tracker & stats summary
│       │   │   ├── 📄 CustomerOrders.jsx     #  Order detail inspector
│       │   │   ├── 📄 CustomerOrderHistory.jsx# Order history log
│       │   │   ├── 📄 CustomerPayments.jsx   #  Invoices and receipts payor
│       │   │   ├── 📄 CustomerReviews.jsx    #  Feedback center log
│       │   │   ├── 📄 PlaceOrderWizard.jsx   #  Laundry order multi-step workflow
│       │   │   ├── 📄 ReviewModal.jsx        #  Ratings stars trigger
│       │   │   └── 📄 CheckoutModal.jsx      #  Checkout payment gateway interface
│       │   ├── 📂 Partner/
│       │   │   ├── 📄 PartnerDashboard.jsx   #  Vendor performance graph & KPIs
│       │   │   ├── 📄 PartnerOrders.jsx      #  Garments status transition controls
│       │   │   ├── 📄 PartnerPricing.jsx     #  Interactive rate card catalog builder
│       │   │   └── 📄 PartnerDocuments.jsx   #  PDF uploads and status verification UI
│       │   ├── 📂 Delivery/
│       │   │   ├── 📄 DeliveryDashboard.jsx  #  Rider online status toggle, stats, maps
│       │   │   └── 📄 DeliveryTasks.jsx      #  Assigned runs list & history logs
│       │   ├── 📂 Admin/
│       │   │   ├── 📄 AdminDashboard.jsx     #  Platform-wide graphs, metrics, reset button
│       │   │   ├── 📄 AdminOrders.jsx        #  Audit log of all orders
│       │   │   ├── 📄 AdminPartners.jsx      #  KYC approval console & penalties editor
│       │   │   ├── 📄 AdminPayments.jsx      #  Financial logs & refund initiator
│       │   │   ├── 📄 AdminReviews.jsx       #  Reviews catalog moderating
│       │   │   ├── 📄 AdminReports.jsx       #  Exportable revenues data
│       │   │   └── 📄 AdminUsers.jsx         #  Accounts toggler (Enable/Disable)
│       │   └── 📂 Notifications/
│       │       └── 📄 NotificationCenter.jsx #  Glass popover displaying historical messages
│       │
│       ├── 📂 context/
│       │   └── 📄 AuthContext.jsx      # Authentication Context provider
│       └── 📂 services/
│           └── 📄 api.js              # Centralized custom fetch API utility
│
└── 📂 docs/                            # ── PROJECT DESIGN DOCUMENTATION ──────
    └── 📂 images/
        ├── 📄 architecture.png         # Tech Stack & Flow diagram
        ├── 📄 erd.png                  # Database Relationships layout
        ├── 📄 features.png             # Visual presentation mockup
        └── 📄 order-flow.png           # 8-state order status progression flow
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following software installed:

| Tool | Version | Purpose |
|------|---------|---------|
| **Java Development Kit (JDK)** | 21+ | Backend application compilation and runtime |
| **MySQL Server** | 8.x | Relational database engine |
| **Node.js** | 20+ | Frontend development utilities & bundler |
| **npm** | 10+ | Frontend package dependency management |

### 1. Clone the Repository

```bash
git clone https://github.com/justayush18/LaundryLink.git
cd LaundryLink
```

### 2. Configure MySQL Database

Open your MySQL client and initialize the project database and user permissions:

```sql
CREATE DATABASE laundrylink;
CREATE USER 'laundrylink_user'@'localhost' IDENTIFIED BY 'LaundryLink@123';
GRANT ALL PRIVILEGES ON laundrylink.* TO 'laundrylink_user'@'localhost';
FLUSH PRIVILEGES;
```

> **Note**: Database connection parameters are saved under `src/main/resources/application.properties`. Update this file if you customize the database name or passwords.

### 3. Launch the Spring Boot Backend

You can run the backend directly using the included Maven Wrapper script without needing a separate Maven installation.

```bash
# On Linux/macOS
./mvnw spring-boot:run

# On Windows (Command Prompt or PowerShell)
mvnw.cmd spring-boot:run
```

The server starts on **http://localhost:8080** and will automatically:
- Create database tables based on JPA entities via Hibernate DDL.
- Initialize the primary Admin account (`admin@velora.example`).

### 4. Launch the React Frontend

Open a separate terminal window, navigate to the frontend directory, install dependencies, and run Vite:

```bash
cd frontend
npm install
npm run dev
```

The frontend launches on **http://localhost:5173** with hot module replacement. Open your browser and navigate to this URL to view the application.

---

## 🔄 Database Reset & Seeding

Velora includes a manual seeder to clear mock data accumulation and establish a structured environment. To trigger the database reset and generate the controlled dataset:

1. Ensure the Spring Boot backend is actively running.
2. In a separate terminal shell, execute the administrative PowerShell script:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scratch\reset_database.ps1
   ```

The script will:
1. Log in securely as the default Admin using credentials.
2. Extract the JWT token.
3. Call the secure reset endpoint `/api/v1/admin/reset-database` to truncate operational records.
4. Populate 33 completed orders with corresponding payment profiles, feedback reviews, and customer notifications.

---

## 🔐 Demo Credentials

Use the following logins to test the platform roles after triggering the database reset:

| Role | Email | Password | Details |
|------|-------|----------|---------|
| 🛡️ **Admin** | `admin@velora.example` | `Password@123` | Control panel access |
| 🧑‍💼 **Customer 1** | `customer1@velora.example` | `Password@123` | Active customer profile |
| 🧑‍💼 **Customer 2** | `customer2@velora.example` | `Password@123` | Active customer profile |
| 🏪 **Vendor 1** | `vendor1@velora.example` | `Password@123` | Active laundry partner |
| 🏪 **Vendor 2** | `vendor2@velora.example` | `Password@123` | Active laundry partner |
| 🚚 **Rider 1** | `rider1@velora.example` | `Password@123` | Online delivery partner |
| 🚚 **Rider 2** | `rider2@velora.example` | `Password@123` | Online delivery partner |
| 🚚 **Rider 3** | `rider3@velora.example` | `Password@123` | Online delivery partner |

---

## 📡 API Documentation

Interactive API endpoint documentation is dynamically generated using **Swagger UI (OpenAPI 3.0)**:

| Resource | URL |
|----------|-----|
| **Swagger UI Page** | `http://localhost:8080/swagger-ui.html` |
| **OpenAPI Spec JSON** | `http://localhost:8080/v3/api-docs` |
| **Static Reference** | [`openapi_spec.json`](openapi_spec.json) |

### Key API Endpoints

<details>
<summary><b>🔑 Authentication</b></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/register` | Register a new customer, partner, or rider account. |
| `POST` | `/api/v1/auth/login` | Authenticate credentials and receive a JWT. |
| `POST` | `/api/v1/auth/verify-otp` | Verify an email registration OTP code. |
| `POST` | `/api/v1/auth/resend-otp` | Resend verification OTP code to the registration email. |

</details>

<details>
<summary><b>📦 Orders</b></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/orders` | Place a new order with multiple garment items. |
| `GET` | `/api/v1/orders/{orderId}` | Retrieve detailed order status by sequential display ID. |
| `GET` | `/api/v1/orders/history` | Get order history filtered automatically by the authenticated user's role. |
| `GET` | `/api/v1/orders/{orderId}/cancellation-estimate` | Fetch refund/fee details for cancelling an order. |
| `PUT` | `/api/v1/orders/{orderId}/status` | Transition order status (requires correct role). |
| `PUT` | `/api/v1/orders/{orderId}/assign-delivery` | Manually override delivery partner assignments. |

</details>

<details>
<summary><b>💳 Payments & Billing</b></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/payments/initiate` | Initiate billing for a placed laundry order. |
| `POST` | `/api/v1/payments/{paymentId}/process` | Process transaction payment status (simulated). |
| `POST` | `/api/v1/payments/{paymentId}/refund` | Process refund operations (Admin role required). |
| `GET` | `/api/v1/payments/{paymentId}` | Get payment ledger details. |
| `GET` | `/api/v1/payments/orders/{orderId}/invoice` | Fetch PDF-style invoice details for an order. |

</details>

<details>
<summary><b>⭐ Feedback & Reviews</b></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/reviews` | Submit star rating and comment feedback for completed orders. |
| `GET` | `/api/v1/reviews/history` | Get reviews list authored by the authenticated customer. |
| `GET` | `/api/v1/reviews/partners/{partnerEmail}` | Get average ratings and customer comment cards for a vendor. |
| `GET` | `/api/v1/reviews/{reviewId}` | Retrieve review details. |

</details>

<details>
<summary><b>🏪 Laundry Partners</b></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/partners` | Get lists of active, approved partners. |
| `GET` | `/api/v1/partners/profile` | Get current partner profile information. |
| `PUT` | `/api/v1/partners/profile` | Update address, business hours, and operational areas. |
| `GET` | `/api/v1/partners/pricing` | Retrieve custom pricing rate cards. |
| `PUT` | `/api/v1/partners/pricing` | Save customized items rates list. |
| `POST` | `/api/v1/partners/documents` | Upload business license or GST documentation. |
| `GET` | `/api/v1/partners/documents` | Retrieve verification documents status list. |

</details>

<details>
<summary><b>🚚 Delivery Operations</b></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/deliveries/dashboard` | Get rider metrics summary (ratings, run counts, earnings). |
| `GET` | `/api/v1/deliveries/{orderId}/tracking` | Get live delivery tracking timestamps. |
| `PUT` | `/api/v1/deliveries/availability` | Toggle online/offline status to trigger assignments. |

</details>

<details>
<summary><b>🛡️ Administrator Console</b></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/admin/dashboard` | Compile administrative system KPIs and revenue trends. |
| `GET` | `/api/v1/admin/users` | List all system accounts. |
| `PUT` | `/api/v1/admin/users/{email}/status` | Enable or disable user accounts. |
| `GET` | `/api/v1/admin/partners` | List all partner verification submissions. |
| `PUT` | `/api/v1/admin/partners/{email}/status` | Approve or reject laundry partners. |
| `PUT` | `/api/v1/admin/partners/{email}/cancellation-penalty` | Set custom partner penalty percentages. |
| `POST` | `/api/v1/admin/reset-database` | Truncate system logs and seed realistic historical orders. |

</details>

---

## 🧪 Testing

Velora includes a robust Spring Boot test suite featuring unit tests for service-layer boundaries and integration tests checking end-to-end API flows.

```bash
# Run the complete test suite
./mvnw test                    # On Linux/macOS
mvnw.cmd test                  # On Windows
```

### Test Coverage Details

| Category | File | Description |
|----------|------|-------------|
| **Integration** | `AuthenticationFlowTest` | Checks registrations, validations, JWTs, and login paths. |
| **Integration** | `OrderLifecycleTest` | Checks placement, status validation, sequential ID increments, and cancellations. |
| **Integration** | `DeliveryLifecycleTest` | Validates status updates, availability toggles, and auto-matching engines. |
| **Integration** | `PaymentLifecycleTest` | Checks invoice updates, payment completion, and refund workflows. |
| **Integration** | `ReviewRatingTest` | Validates review creation and partner score averages recalculations. |
| **Integration** | `NotificationTest` | Checks in-app message logs creation and read status. |
| **Integration** | `AdminDashboardTest` | Checks administrative analytics builders and user enable/disable actions. |
| **Unit Test** | `OrderServiceTest` | Checks sequential ID generation, auto-assignment rules, and separate matching constraints. |
| **Unit Test** | `PaymentServiceTest` | Checks pricing summaries, taxes calculations, and invoice metadata creators. |
| **Unit Test** | `ReviewServiceTest` | Tests vendor reputation score formulas and ratings updates. |
| **Unit Test** | `AdminServiceTest` | Verifies dashboard analytics maps and partner document verification flows. |
| **Unit Test** | `AuthServiceTest` | Validates passcode hashing, token parsing, and user lookup exceptions. |
| **Unit Test** | `NotificationServiceTest` | Validates event-driven notifications routing and state flags. |

---

## 🎨 Design System

Velora's UI is customized around a **glassmorphic design system** styled with custom CSS3 properties:

- 🌑 **Dark Mode First** — Deep charcoal (`#0d0e12`) and space navy (`#12141c`) background variables providing a highly premium theme.
- 🪟 **Glassmorphism** — Sleek cards and header components utilizing `backdrop-filter: blur(12px)` and subtle transparent borders.
- ✨ **Gradient Accents** — Teal-to-cyan vibrant gradients for highlights, buttons, and status timelines.
- 🔤 **Outfit & Inter Typography** — Modern sans-serif typography imported from Google Fonts.
- 🎬 **Micro-animations** — Custom hover effects, bouncing mascots, floating backgrounds, and sliding transitions defined in `velora-animations.css`.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <sub>Built with ❤️ as a full-stack smart logistics demonstration project</sub>
</p>
