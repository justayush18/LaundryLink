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

## Mistakes and Fixes
- Mistake: The first terminal-based Maven validation was skipped by the environment.
  - Fix: Re-ran startup verification through the terminal and confirmed the app booted successfully.
- Mistake: The project could have drifted into premature persistence work.
  - Fix: Kept the implementation limited to in-memory services and read-only API responses.