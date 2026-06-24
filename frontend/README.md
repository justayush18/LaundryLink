# 🧺 Velora React Frontend

A high-fidelity, responsive Single Page Application (SPA) built using **React 19** and **Vite 8** for the **Velora** smart laundry management platform.

---

## 🎨 Design Aesthetics & Theme

The frontend is built around a custom **glassmorphic design system** with a premium, responsive HSL dark theme.

- 🌑 **Dark Mode First** — Styled with dark space backgrounds (`#0d0e12` and `#12141c`) and neon gradient highlights.
- 🪟 **Glassmorphism** — Frosted cards and sidebar wrappers utilizing `backdrop-filter: blur(12px)` and thin semi-transparent borders.
- ✨ **Custom Animations** — Integrated HTML5 Canvas floating bubbles, SVG waves, and dynamic mascot triggers defined in `velora-animations.css`.
- 🔤 **Typography** — Clean Google Fonts Outfit (`sans-serif`) and Inter styling variables.

---

## 📁 Directory Structure

```
frontend/
│
├── 📄 index.html                      # DOM Mount Anchor point
├── 📄 package.json                     # Node script commands & dependencies
├── 📄 vite.config.js                  # Vite compiler configurations & reverse proxy
├── 📄 eslint.config.js                # Linter rules
│
├── 📂 public/                         # Static assets directory
│   ├── 📄 favicon.svg                 # Brand icon
│   ├── 📄 icons.svg                   # Reusable inline vectors
│   └── 📂 videos/
│       └── 📄 auth-bg.mp4             # High-quality auth card backdrop video
│
└── 📂 src/
    ├── 📄 main.jsx                    # React bootstrap entrypoint
    ├── 📄 App.jsx                     # Route paths mapping & main viewport wrapper
    ├── 📄 App.css                     # Global layout structure CSS
    ├── 📄 index.css                   # Theme variables and glassmorphic helpers
    ├── 📄 velora-animations.css       # Dynamic keyframes and interactive transitions
    │
    ├── 📂 assets/                     # Graphic resources
    │   └── 📄 hero.png                # Landing showcase image
    │
    ├── 📂 context/
    │   └── 📄 AuthContext.jsx          # Context API preserving active token & user profile
    │
    ├── 📂 services/
    │   └── 📄 api.js                  # Axios-style centralized fetch client wrapper
    │
    └── 📂 components/                 # Component Directory
        ├── 📂 Common/                 # Shared UI elements
        │   ├── 📄 Navbar.jsx          #   Top branding header
        │   ├── 📄 Sidebar.jsx         #   Classic system nav drawer
        │   ├── 📄 FloatingNav.jsx     #   Curved glass sidebar navigation drawer
        │   ├── 📄 ProtectedRoute.jsx  #   JWT gating wrapper redirecting sessions
        │   ├── 📄 StatCard.jsx        #   Reusable dashboard KPI cards
        │   ├── 📄 EmptyState.jsx      #   No-data fallback placeholder card
        │   ├── 📄 FloatingBubbles.jsx #   Dynamic canvas float animation
        │   ├── 📄 WaveBackground.jsx  #   Layered SVG backdrop element
        │   ├── 📄 VeloraMascot.jsx    #   Interactive mascot feedback
        │   └── 📄 TermsAndPolicies.jsx#   Static policy viewport
        │
        ├── 📂 Auth/                   # Sign-in & Onboarding
        │   ├── 📄 Login.jsx           #   Sign-in form card
        │   ├── 📄 Register.jsx        #   Multi-role registration card
        │   ├── 📄 VerifyOtp.jsx       #   OTP code verification dialog
        │   └── 📄 OnboardingTerms.jsx #   Legal onboarding gate checks
        │
        ├── 📂 Customer/               # Customer Portal
        │   ├── 📄 CustomerDashboard.jsx  #  Timeline trackers & overview stats
        │   ├── 📄 CustomerOrders.jsx     #  Detailed order timeline inspector
        │   ├── 📄 CustomerOrderHistory.jsx# Order logs card
        │   ├── 📄 CustomerPayments.jsx   #  Invoices list & payments triggers
        │   ├── 📄 CustomerReviews.jsx    #  Feedback center log
        │   ├── 📄 PlaceOrderWizard.jsx   #  Multi-step order wizard
        │   ├── 📄 ReviewModal.jsx        #  Ratings stars picker modal
        │   └── 📄 CheckoutModal.jsx      #  Checkout credit-card & UPI gateway card
        │
        ├── 📂 Partner/                # Laundry Vendor Portal
        │   ├── 📄 PartnerDashboard.jsx   #  Vendor performance graph & metrics
        │   ├── 📄 PartnerOrders.jsx      #  Garments status transition controls
        │   ├── 📄 PartnerPricing.jsx     #  Custom pricing rate cards builder
        │   └── 📄 PartnerDocuments.jsx   #  KYC PDF file uploads UI
        │
        ├── 📂 Delivery/               # Rider Portal
        │   ├── 📄 DeliveryDashboard.jsx  #  Availability status toggler & logs
        │   └── 📄 DeliveryTasks.jsx      #  Active pickups & deliveries runs lists
        │
        ├── 📂 Admin/                  # Administrator Panel
        │   ├── 📄 AdminDashboard.jsx     #  Platform-wide graphs, metrics, reset button
        │   ├── 📄 AdminOrders.jsx        #  Audit log of all orders
        │   ├── 📄 AdminPartners.jsx      #  KYC approvals console & penalties editor
        │   ├── 📄 AdminPayments.jsx      #  Financial logs & refund initiator
        │   ├── 📄 AdminReviews.jsx       #  Reviews catalog moderating
        │   ├── 📄 AdminReports.jsx       #  Tabbed revenue & user intelligence reports
        │   └── 📄 AdminUsers.jsx         #  Accounts activation directory (Block/Unblock)
        │
        └── 📂 Home/
            └── 📄 Homepage.jsx        #  Animated landing showcase page
```

---

## ⚡ Setup & Launch

### Prerequisites
- **Node.js** version 20+
- **npm** version 10+

### 1. Install Dependencies
Run from the `frontend/` directory:
```bash
npm install
```

### 2. Start the Development Server
Launch Vite development server:
```bash
npm run dev
```
The frontend starts on **http://localhost:5173**.

### 3. Build for Production
Bundle the production static assets:
```bash
npm run build
```
Production assets are generated in `frontend/dist/`.

---

## 🛡️ Router & Access Controls

Routing is configured inside `App.jsx` using React Router DOM. Access to internal directories is secured by the `<ProtectedRoute />` wrapper:

1. **Role Gating** — Checks the authenticated user's `role` claim in the decrypted token context. Redirects mismatching roles back to dashboard homes.
2. **First-Login Compliance Gate** — Validates `termsAccepted` and `emailVerified` flags. Directs unverified logins to OTP screens (`/verify-email`) and un-onboarded profiles to the Terms agreement portal (`/onboarding`).
3. **Admin Exclusivity** — Gated routes under `/admin/*` reject non-admin logins.

---

## 🔌 API & Proxy Configurations

A centralized fetch client is located in [api.js](src/services/api.js). 

- **Automatic Headers Injection** — Automatically intercepts requests and injects `Authorization: Bearer <JWT>` header from active contexts.
- **Vite Reverse Proxy** — Local API calls map to `/api/*` paths, which are proxied dynamically to the backend port **8080** via `vite.config.js`:
  ```javascript
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
  ```
  This resolves CORS blocks during local development without additional configuration.
