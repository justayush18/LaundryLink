# PROJECT JOURNEY

This file is an append-only development diary for LaundryLink. New work must be added chronologically, without deleting earlier entries.

## Development Log

### 2026-06-18 - Project Baseline Verification
- Date and phase: 2026-06-18, baseline verification before phase planning.
- Goal of the task: Confirm the Spring Boot project was stable before adding any application features.
- What was implemented: Verified the existing minimal Spring Boot bootstrap and confirmed the workspace was intentionally kept free of persistence configuration.
- Files created: None.
- Files modified: None.
- Problems encountered: The first attempt to run Maven from the tool was skipped by the environment.
- Errors faced: No application code errors were found during file inspection.
- Root cause of the issue: The initial validation command did not execute through the tool path; it was an environment/tooling limitation rather than a project defect.
- How the issue was resolved: Re-ran validation through the terminal and later confirmed the application could start successfully.
- Important design decisions: Keep the project minimal, avoid JPA/MySQL until the persistence phase, and preserve the existing stable setup.
- What I learned from this step: A clean baseline should be verified before introducing feature scaffolding.
- Next planned step: Start the first implementation phase with a safe, non-persistent API layer.

### 2026-06-18 - Phase 1 Foundation API Scaffold
- Date and phase: 2026-06-18, Phase 1.
- Goal of the task: Create a small API foundation that reflects the LaundryLink blueprint without adding database or security complexity.
- What was implemented: Added a health endpoint, a blueprint endpoint, and a stakeholder endpoint, each powered by simple in-memory service classes.
- Files created:
  - [src/main/java/com/laundrylink/laundrylink/api/HealthController.java](src/main/java/com/laundrylink/laundrylink/api/HealthController.java)
  - [src/main/java/com/laundrylink/laundrylink/api/BlueprintController.java](src/main/java/com/laundrylink/laundrylink/api/BlueprintController.java)
  - [src/main/java/com/laundrylink/laundrylink/api/ServiceCatalogItem.java](src/main/java/com/laundrylink/laundrylink/api/ServiceCatalogItem.java)
  - [src/main/java/com/laundrylink/laundrylink/service/BlueprintCatalogService.java](src/main/java/com/laundrylink/laundrylink/service/BlueprintCatalogService.java)
  - [src/main/java/com/laundrylink/laundrylink/api/StakeholderController.java](src/main/java/com/laundrylink/laundrylink/api/StakeholderController.java)
  - [src/main/java/com/laundrylink/laundrylink/api/StakeholderProfile.java](src/main/java/com/laundrylink/laundrylink/api/StakeholderProfile.java)
  - [src/main/java/com/laundrylink/laundrylink/service/StakeholderCatalogService.java](src/main/java/com/laundrylink/laundrylink/service/StakeholderCatalogService.java)
- Files modified: None outside the new phase-one files.
- Problems encountered: Needed to keep the implementation compatible with the current stable setup and avoid touching `pom.xml`, persistence, or application configuration.
- Errors faced: No Java compilation errors were found in the touched files.
- Root cause of the issue: The project constraints intentionally excluded database wiring and dependency changes at this stage.
- How the issue was resolved: Used constructor-injected controllers backed by simple in-memory services, avoiding all persistence-related configuration.
- Important design decisions: Use thin controllers, keep business data in service classes, and expose only the minimal API surface needed for the project blueprint.
- What I learned from this step: Starting with in-memory services makes the API shape visible early while keeping the build stable.
- Next planned step: Wait for approval before starting the next phase.

### 2026-06-18 - Project Development Log Setup
- Date and phase: 2026-06-18, project documentation workflow setup.
- Goal of the task: Create a permanent project development log that can support the presentation, viva, and final documentation.
- What was implemented: Added this append-only diary file with dedicated sections for the development log, lessons learned, and mistakes and fixes.
- Files created: [PROJECT_JOURNEY.md](PROJECT_JOURNEY.md).
- Files modified: None.
- Problems encountered: The diary did not exist yet, so there was no historical record to append to.
- Errors faced: None in the markdown structure.
- Root cause of the issue: This was a new documentation requirement, not a code defect.
- How the issue was resolved: Created the file and seeded it with the project baseline and phase-one history.
- Important design decisions: Keep the log append-only, chronological, and detailed enough to support future reporting and presentation prep.
- What I learned from this step: A disciplined project diary is useful when the project needs to be explained later under time pressure.
- Next planned step: Continue appending new entries after each significant development milestone.

### 2026-06-18 - Phase 2 User Management Foundation
- Date and phase: 2026-06-18, Phase 2.
- Goal of the task: Start the user-management slice for Customer, Laundry Partner, Delivery Partner, and Admin, including profile and address management, without introducing persistence.
- What was implemented: Added a user-management controller and service with read-only endpoints for role summaries, role profiles, and customer addresses.
- Files created:
  - [src/main/java/com/laundrylink/laundrylink/api/AddressView.java](src/main/java/com/laundrylink/laundrylink/api/AddressView.java)
  - [src/main/java/com/laundrylink/laundrylink/api/UserProfileView.java](src/main/java/com/laundrylink/laundrylink/api/UserProfileView.java)
  - [src/main/java/com/laundrylink/laundrylink/api/UserRoleSummary.java](src/main/java/com/laundrylink/laundrylink/api/UserRoleSummary.java)
  - [src/main/java/com/laundrylink/laundrylink/api/UserRoleType.java](src/main/java/com/laundrylink/laundrylink/api/UserRoleType.java)
  - [src/main/java/com/laundrylink/laundrylink/api/UserManagementController.java](src/main/java/com/laundrylink/laundrylink/api/UserManagementController.java)
  - [src/main/java/com/laundrylink/laundrylink/service/UserManagementService.java](src/main/java/com/laundrylink/laundrylink/service/UserManagementService.java)
- Files modified:
  - [PROJECT_JOURNEY.md](PROJECT_JOURNEY.md)
- Problems encountered: None in the code itself.
- Errors faced: No compile errors in the touched files.
- Root cause of the issue: This phase was intentionally designed to stay read-only and in-memory, so no persistence or configuration errors were introduced.
- How the issue was resolved: Used an `EnumMap`-backed in-memory catalog, constructor injection, and enum-based path variables for simple, type-safe lookups.
- Important design decisions: Keep profile data and addresses separate, expose role summaries and full profiles as read-only responses, and avoid database wiring until the persistence phase.
- What I learned from this step: `EnumMap` is a clean fit for fixed role-based catalogs, and enum path variables keep controller endpoints expressive without extra parsing code.
- Next planned step: Wait for approval before adding the next phase.

### 2026-06-18 - API Inventory Snapshot
- Date and phase: 2026-06-18, post-Phase 2 architecture review.
- Goal of the task: Capture a clear snapshot of the current API architecture before starting the next phase.
- What was implemented: Documented the current controller/service inventory and identified the future database-backed replacements for each read-only endpoint.
- Files created: None.
- Files modified: [PROJECT_JOURNEY.md](PROJECT_JOURNEY.md).
- Problems encountered: None.
- Errors faced: None.
- Root cause of the issue: This was a documentation and architecture review task, not a runtime defect.
- How the issue was resolved: Summarized the current in-memory API layout and noted the planned persistence-layer replacements.
- Important design decisions: Keep the API layer thin, keep domain data in services for now, and defer repositories until the database phase.
- What I learned from this step: A stable API inventory makes later persistence mapping and presentation prep much easier.
- Next planned step: Use this inventory as the baseline for Phase 3 planning.

### 2026-06-18 - Phase 3 Authentication and Security
- Date and phase: 2026-06-18, Phase 3.
- Goal of the task: Add registration, login, JWT-based authentication, password encryption, and role-based access control.
- What was implemented: Added an auth controller, auth service, custom JWT generation and validation, BCrypt password hashing, Spring Security configuration, and method-level role checks on user-management endpoints.
- Files created:
  - [src/main/java/com/laundrylink/laundrylink/api/AuthLoginRequest.java](src/main/java/com/laundrylink/laundrylink/api/AuthLoginRequest.java)
  - [src/main/java/com/laundrylink/laundrylink/api/AuthRegisterRequest.java](src/main/java/com/laundrylink/laundrylink/api/AuthRegisterRequest.java)
  - [src/main/java/com/laundrylink/laundrylink/api/AuthResponse.java](src/main/java/com/laundrylink/laundrylink/api/AuthResponse.java)
  - [src/main/java/com/laundrylink/laundrylink/api/AuthenticatedUserView.java](src/main/java/com/laundrylink/laundrylink/api/AuthenticatedUserView.java)
  - [src/main/java/com/laundrylink/laundrylink/api/AuthController.java](src/main/java/com/laundrylink/laundrylink/api/AuthController.java)
  - [src/main/java/com/laundrylink/laundrylink/service/AuthService.java](src/main/java/com/laundrylink/laundrylink/service/AuthService.java)
  - [src/main/java/com/laundrylink/laundrylink/service/RegisteredAccount.java](src/main/java/com/laundrylink/laundrylink/service/RegisteredAccount.java)
  - [src/main/java/com/laundrylink/laundrylink/security/AuthenticatedPrincipal.java](src/main/java/com/laundrylink/laundrylink/security/AuthenticatedPrincipal.java)
  - [src/main/java/com/laundrylink/laundrylink/security/JwtService.java](src/main/java/com/laundrylink/laundrylink/security/JwtService.java)
  - [src/main/java/com/laundrylink/laundrylink/security/JwtAuthenticationFilter.java](src/main/java/com/laundrylink/laundrylink/security/JwtAuthenticationFilter.java)
  - [src/main/java/com/laundrylink/laundrylink/security/SecurityConfig.java](src/main/java/com/laundrylink/laundrylink/security/SecurityConfig.java)
- Files modified:
  - [pom.xml](pom.xml)
  - [src/main/java/com/laundrylink/laundrylink/api/UserManagementController.java](src/main/java/com/laundrylink/laundrylink/api/UserManagementController.java)
  - [PROJECT_JOURNEY.md](PROJECT_JOURNEY.md)
- Problems encountered: Security was not available in the original build, so the project needed a security starter and a custom JWT implementation.
- Errors faced: None in the final code path after the phase-three implementation.
- Root cause of the issue: The project initially had no authentication layer, no password hashing, and no request authorization rules.
- How the issue was resolved: Added Spring Security, BCrypt password encoding, in-memory accounts, JWT issuance/validation, and method security for role checks.
- Important design decisions: Keep auth data in memory for now, seed known users for testing, use stateless bearer tokens, and gate user-management endpoints by role.
- What I learned from this step: Security is easiest to introduce cleanly when the login flow, token format, and authorization rules are separated into small focused classes.
- Next planned step: Verify the app starts, test registration/login, and confirm authorized access to protected endpoints.

### 2026-06-18 - Phase 3 Verification
- Date and phase: 2026-06-18, Phase 3 Verification.
- Goal of the task: Verify Phase 3 implementation, including build success, startup, and full test of public and protected endpoints.
- What was implemented: Ran Maven build and tests successfully. Tested registration and login endpoints, showing JSON responses with JWTs. Tested protected endpoints without a token, with an admin token, and with a customer token, confirming expected auth/access control behavior. Tweaked `SecurityConfig.java` to permit `/error` requests, resolving the issue where HTTP 403 Forbidden was masked as 401.
- Files created: None.
- Files modified:
  - [src/main/java/com/laundrylink/laundrylink/security/SecurityConfig.java](src/main/java/com/laundrylink/laundrylink/security/SecurityConfig.java)
  - [PROJECT_JOURNEY.md](PROJECT_JOURNEY.md)
- Problems encountered: Accessing a forbidden endpoint using a valid CUSTOMER token was returning HTTP 401 with a Basic Auth prompt instead of HTTP 403 Forbidden.
- Errors faced: No compilation or system errors.
- Root cause of the issue: Spring Security intercepted the forward to the `/error` path since `/error` was not in the permit list of request matchers, which caused the request to be rejected as unauthenticated on error dispatch.
- How the issue was resolved: Added `"/error"` to the permitted requestMatchers in `SecurityConfig.java` so that 403 Forbidden errors (and other HTTP errors) are correctly bubbled up to the client.
- Important design decisions: Ensure proper error path handling in stateless JWT architectures.
- What I learned from this step: In Spring Security 6, always permit the `/error` path if you want to avoid masking 403 Forbidden/400 Bad Request errors behind basic auth 401s during internal servlet forwards.
- Next planned step: Start Phase 4 (Laundry Partner Management).

### 2026-06-18 - Phase 4 Laundry Partner Management Planning
- Date and phase: 2026-06-18, Phase 4.
- Goal of the task: Plan the Laundry Partner Management slice covering partner profiles, service areas, availability, documents, and pricing rate cards using an in-memory database-free model.
- What was implemented: Outlined DTOs, controllers, services, and in-memory structures to model partner configuration details, including access control rules.
- Files created: None.
- Files modified: None.
- Problems encountered: None during the planning phase.
- Errors faced: None.
- Root cause of the issue: None.
- How the issue was resolved: None.
- Important design decisions: Key all in-memory structures by the partner's unique authenticated email address; seed default profiles to enable instant out-of-the-box testing.
- What I learned from this step: Defining API views and DTOs before implementation keeps security mapping clear.
- Next planned step: Implement DTOs, in-memory domain models, laundry partner service, and REST controllers.

### 2026-06-18 - Phase 4 Laundry Partner Management Implementation
- Date and phase: 2026-06-18, Phase 4.
- Goal of the task: Implement the Laundry Partner Management slice covering partner profiles, service areas, availability, documents, and pricing rate cards using an in-memory model.
- What was implemented:
  - Request DTOs: `PartnerProfileRequest`, `ServiceAreaRequest`, `AvailabilityRequest`, `PartnerDocumentRequest`, `DocumentVerifyRequest`, `PricingRequest`, `RateCardItem`, `AvailabilitySlot`.
  - View DTOs: `PartnerProfileView`, `ServiceAreaView`, `AvailabilityView`, `PartnerDocumentView`, `PricingView`.
  - Service: `LaundryPartnerService` utilizing thread-safe in-memory maps keyed by partner email address.
  - Controller: `LaundryPartnerController` exposing REST endpoints for fetching/updating all partner metadata with strict role validation (e.g. only Laundry Partners can modify their details; only Admin can verify documents).
  - Seeded initial active partner config for `partner@freshfold.example` for immediate test coverage.
- Files created:
  - [src/main/java/com/laundrylink/laundrylink/api/PartnerProfileRequest.java](src/main/java/com/laundrylink/laundrylink/api/PartnerProfileRequest.java)
  - [src/main/java/com/laundrylink/laundrylink/api/PartnerProfileView.java](src/main/java/com/laundrylink/laundrylink/api/PartnerProfileView.java)
  - [src/main/java/com/laundrylink/laundrylink/api/ServiceAreaRequest.java](src/main/java/com/laundrylink/laundrylink/api/ServiceAreaRequest.java)
  - [src/main/java/com/laundrylink/laundrylink/api/ServiceAreaView.java](src/main/java/com/laundrylink/laundrylink/api/ServiceAreaView.java)
  - [src/main/java/com/laundrylink/laundrylink/api/AvailabilitySlot.java](src/main/java/com/laundrylink/laundrylink/api/AvailabilitySlot.java)
  - [src/main/java/com/laundrylink/laundrylink/api/AvailabilityRequest.java](src/main/java/com/laundrylink/laundrylink/api/AvailabilityRequest.java)
  - [src/main/java/com/laundrylink/laundrylink/api/AvailabilityView.java](src/main/java/com/laundrylink/laundrylink/api/AvailabilityView.java)
  - [src/main/java/com/laundrylink/laundrylink/api/PartnerDocumentRequest.java](src/main/java/com/laundrylink/laundrylink/api/PartnerDocumentRequest.java)
  - [src/main/java/com/laundrylink/laundrylink/api/PartnerDocumentView.java](src/main/java/com/laundrylink/laundrylink/api/PartnerDocumentView.java)
  - [src/main/java/com/laundrylink/laundrylink/api/DocumentVerifyRequest.java](src/main/java/com/laundrylink/laundrylink/api/DocumentVerifyRequest.java)
  - [src/main/java/com/laundrylink/laundrylink/api/RateCardItem.java](src/main/java/com/laundrylink/laundrylink/api/RateCardItem.java)
  - [src/main/java/com/laundrylink/laundrylink/api/PricingRequest.java](src/main/java/com/laundrylink/laundrylink/api/PricingRequest.java)
  - [src/main/java/com/laundrylink/laundrylink/api/PricingView.java](src/main/java/com/laundrylink/laundrylink/api/PricingView.java)
  - [src/main/java/com/laundrylink/laundrylink/api/LaundryPartnerController.java](src/main/java/com/laundrylink/laundrylink/api/LaundryPartnerController.java)
  - [src/main/java/com/laundrylink/laundrylink/service/PartnerProfile.java](src/main/java/com/laundrylink/laundrylink/service/PartnerProfile.java)
  - [src/main/java/com/laundrylink/laundrylink/service/LaundryPartnerService.java](src/main/java/com/laundrylink/laundrylink/service/LaundryPartnerService.java)
- Files modified: None.
- Problems encountered: None. The implementation built cleanly without any errors.
- Errors faced: None.
- Root cause of the issue: None.
- How the issue was resolved: None.
- Important design decisions: Delegated profile lookups to path-based emails and authentication context, ensuring customers can read partner details but only partners can modify them.
- What I learned from this step: CopyOnWriteArrayList and ConcurrentHashMap are excellent in-memory replacements for quick API prototyping before database design.
- Next planned step: Stop and present verification report.

## Lessons Learned
- Keep the first working slice small and verifiable before adding persistence or security.
- Thin controllers are easier to test and explain than mixed controller/service logic.
- In-memory catalog services are useful for early API design when the database layer is intentionally deferred.
- Stable startup matters more than feature breadth during the initial project foundation.
- It is safer to verify endpoints with live HTTP calls after startup than to assume the build is correct.
- A development diary is easiest to maintain when it is treated as part of the workflow, not an afterthought.
- Fixed role-based lookups are easier to maintain when they are modeled with enums rather than raw strings.
- Read-only profile and address endpoints are a safe way to shape user-management APIs before persistence exists.
- A clear API inventory is useful before introducing repositories because it shows exactly what needs to be replaced later.
- BCrypt is the right default for password hashing in Spring Security when the app manages credentials itself.
- Stateless JWT security works well for REST APIs because the server can authenticate each request without sessions.
- In Spring Security 6, always permit the `/error` path to allow custom `ResponseStatusException` errors (like 403 Forbidden) to propagate to the client instead of being masked by authentication entry points.

## Mistakes and Fixes
- Mistake: The first terminal-based Maven validation was skipped by the environment.
  - Fix: Re-ran startup verification through the terminal and confirmed the app booted successfully.
- Mistake: The project could have drifted into premature persistence work.
  - Fix: Kept the implementation limited to in-memory services and read-only API responses.
- Mistake: Authentication requirements arrived before a database-backed identity model existed.
  - Fix: Used in-memory seeded accounts with JWT and BCrypt so Phase 3 could be completed without introducing repositories yet.
- Mistake: Accessing a forbidden endpoint using a valid CUSTOMER token returned HTTP 401 with a basic auth prompt instead of HTTP 403 Forbidden.
  - Fix: Added `"/error"` to the permitted requestMatchers in `SecurityConfig.java` so that 403 responses are not intercepted and masked on error dispatch.