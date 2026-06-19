# Velora UI/UX Redesign — Task Tracker

## Phase 1: Design Foundation
- [x] Rewrite `index.css` — Complete Velora design system
- [x] Create `velora-animations.css` — Animation keyframes
- [x] Update `App.css` — Layout styles

## Phase 2: Navigation System
- [x] Delete/replace `Sidebar.jsx` → `FloatingNav.jsx`
- [x] Rewrite `Navbar.jsx` (top bar for desktop)
- [x] Update `App.jsx` — New layout + homepage route
- [x] Update `ProtectedRoute.jsx` — Light theme loading

## Phase 3: Shared Components
- [x] Create `WaveBackground.jsx`
- [x] Create `FloatingBubbles.jsx`
- [x] Create `VeloraMascot.jsx`
- [x] Create `StatCard.jsx`
- [x] Create `EmptyState.jsx`

## Phase 4: Homepage
- [x] Create `Homepage.jsx` — Startup landing page

## Phase 5: Auth Pages
- [x] Redesign `Login.jsx`
- [x] Redesign `Register.jsx`

## Phase 6: Customer Portal
- [x] Redesign `CustomerDashboard.jsx`
- [x] Redesign `CustomerOrders.jsx`
- [x] Redesign `CustomerPayments.jsx`
- [x] Redesign `CustomerReviews.jsx`
- [x] Redesign `PlaceOrderWizard.jsx`
- [x] Redesign `ReviewModal.jsx`

## Phase 7: Partner Portal
- [x] Backend Persistence Layer
  - [x] Add `cancellationPenaltyPerOrder` to `PartnerEntity.java`
- [x] Backend API & DTO Layer
  - [x] Create `CancellationEvent.java` record
  - [x] Update `PartnerProfileView.java` with new fields
  - [x] Update `AdminPartnerView.java` with new fields
- [x] Backend Service Layer
  - [x] Prepend `"Cancelled by laundry partner: "` to notes in `OrderService.java` when partner cancels accepted order
  - [x] Implement `getMonthlyCancellationsCount`, `getCancellationPercentage`, `getCancellationHistory` in `LaundryPartnerService.java`
  - [x] Update `mapToView` in `LaundryPartnerService.java`
  - [x] Integrate cancellation stats mapping into `AdminService.java`
  - [x] Implement `updateCancellationPenalty` in `AdminService.java`
- [x] Backend Controller Layer
  - [x] Add `PUT /partners/{email}/cancellation-penalty` endpoint to `AdminController.java`
- [x] Frontend Implementation
  - [x] Register new endpoint in `api.js`
  - [x] Integrate cancellation counter, warnings, and history in `PartnerDashboard.jsx`
  - [x] Add "Cancel Order" action to `PartnerDashboard.jsx` and `PartnerOrders.jsx`
  - [x] Add cancellation stats display and penalty configuration to `AdminPartners.jsx`
- [x] Verification & Tests
  - [x] Run backend tests (`./mvnw.cmd test`)
  - [x] Run frontend build (`npm run build`)

## Phase 8: Delivery Portal
- [x] Redesign `DeliveryDashboard.jsx`
- [x] Redesign `DeliveryTasks.jsx`

## Phase 9: Admin Portal
- [x] Redesign `AdminDashboard.jsx`
- [x] Redesign `AdminUsers.jsx`
- [x] Redesign `AdminPartners.jsx`
- [x] Redesign `AdminOrders.jsx`
- [x] Redesign `AdminPayments.jsx`
- [x] Redesign `AdminReports.jsx`

## Phase 10: Notifications
- [x] Redesign `NotificationCenter.jsx`

## Phase 11: Config & Polish
- [x] Update `index.html` — Meta tags, title
- [x] Final verification & testing
