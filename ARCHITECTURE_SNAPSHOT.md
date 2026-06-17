# ARCHITECTURE SNAPSHOT

This file is append-only. Add a new section after each completed phase and do not remove earlier snapshots.

## Phase 1 Snapshot - Foundation API Scaffold

### Current Controllers
- HealthController
- BlueprintController
- StakeholderController

### Current Services
- BlueprintCatalogService
- StakeholderCatalogService

### Current Endpoints
- `GET /api/v1/health`
- `GET /api/v1/blueprint`
- `GET /api/v1/stakeholders`

### Current Data Flow
- HTTP request enters a controller.
- The controller either returns a direct response or delegates to a service.
- The service returns in-memory catalog data.
- The controller serializes the response as JSON.

### Current Package Structure
- `com.laundrylink.laundrylink.api`
- `com.laundrylink.laundrylink.service`

### Current Limitations
- No persistence layer.
- No repository layer.
- No authentication or authorization.
- No user identity or session model.
- No real business mutations yet.

### Future Database Replacement Plan
- Replace in-memory catalog data with repository-backed data.
- Introduce entity classes for persisted reference data where needed.
- Move catalog data out of services and into the database layer.

### Future Authentication Integration Plan
- Add Spring Security after the domain model stabilizes.
- Introduce JWT-based authentication.
- Protect business endpoints once login and user identity are defined.
- Add role-based access control for customers, partners, and admins.

### High-Level Architecture
- Spring Boot application exposes REST endpoints.
- Controllers map HTTP requests to service calls.
- Services currently provide in-memory data.
- Database and security layers are deferred.

### Request Flow Diagram (text format)
- Client -> Controller -> Service -> In-memory data -> JSON response

### API Inventory Table
| Endpoint | Method | Purpose | Future Replacement |
| --- | --- | --- | --- |
| `/api/v1/health` | GET | Returns application health status | Optional Actuator health endpoint |
| `/api/v1/blueprint` | GET | Returns project blueprint metadata | Database-backed catalog or configuration store |
| `/api/v1/stakeholders` | GET | Returns stakeholder roles and capabilities | Persisted role and permission data |

### Service Responsibility Table
| Service | Responsibility | Future Replacement |
| --- | --- | --- |
| `BlueprintCatalogService` | Supplies order lifecycle and service catalog data | Repository-backed catalog service |
| `StakeholderCatalogService` | Supplies stakeholder role definitions and capability lists | Repository-backed role/permission service |

### Future Repository Layer Plan
- Add repository interfaces for catalog and domain data once persistence begins.
- Keep controllers unchanged where possible and move data access into repositories.
- Introduce transactional service methods only when write operations appear.

### Future Entity Design Notes
- `service_category` and `service` entities will likely model the blueprint catalog.
- `roles` and `permissions` entities will likely model stakeholder access.
- `users` may later become the shared root entity for customer, partner, and admin profiles.

## Phase 2 Snapshot - User Management Foundation

### Current Controllers
- HealthController
- BlueprintController
- StakeholderController
- UserManagementController

### Current Services
- BlueprintCatalogService
- StakeholderCatalogService
- UserManagementService

### Current Endpoints
- `GET /api/v1/health`
- `GET /api/v1/blueprint`
- `GET /api/v1/stakeholders`
- `GET /api/v1/users/roles`
- `GET /api/v1/users/profiles`
- `GET /api/v1/users/{role}/profile`
- `GET /api/v1/users/{role}/addresses`

### Current Data Flow
- HTTP request enters a controller.
- The controller delegates to a service for catalog or profile data.
- The service selects data from in-memory maps or lists.
- The controller returns a JSON response.

### Current Package Structure
- `com.laundrylink.laundrylink.api`
- `com.laundrylink.laundrylink.service`

### Current Limitations
- Still no database persistence.
- Still no repository layer.
- Still no authentication or authorization.
- User profiles are sample data, not live accounts.
- Addresses are limited to the read-only customer sample set.

### Future Database Replacement Plan
- Replace `UserManagementService` maps and lists with repository-backed user data.
- Persist addresses in a dedicated address table.
- Replace role summaries with persisted role and permission entities.
- Link user profile data to database identity records.

### Future Authentication Integration Plan
- Add Spring Security for login and request protection.
- Move from sample profile data to authenticated user identity.
- Map JWT claims or security principals to roles such as customer, partner, delivery partner, and admin.
- Enforce access rules for profile and address endpoints.

### High-Level Architecture
- Spring Boot REST API is still the main entry point.
- Controllers remain thin request handlers.
- Services hold the user-management and blueprint catalogs in memory.
- Persistence and authentication are still planned, not implemented.

### Request Flow Diagram (text format)
- Client -> Controller -> Service -> In-memory role/profile/address data -> JSON response

### API Inventory Table
| Endpoint | Method | Purpose | Future Replacement |
| --- | --- | --- | --- |
| `/api/v1/health` | GET | Returns application health status | Optional Actuator health endpoint |
| `/api/v1/blueprint` | GET | Returns project blueprint metadata | Database-backed catalog or configuration store |
| `/api/v1/stakeholders` | GET | Returns stakeholder roles and capabilities | Persisted role and permission data |
| `/api/v1/users/roles` | GET | Returns user role summaries | Persisted roles and permissions |
| `/api/v1/users/profiles` | GET | Returns sample profiles for all roles | Database-backed profile listing |
| `/api/v1/users/{role}/profile` | GET | Returns one role-specific profile | User profile lookup from persisted user data |
| `/api/v1/users/{role}/addresses` | GET | Returns addresses for a selected role | Customer address repository lookup |

### Service Responsibility Table
| Service | Responsibility | Future Replacement |
| --- | --- | --- |
| `BlueprintCatalogService` | Supplies order lifecycle and service catalog data | Repository-backed catalog service |
| `StakeholderCatalogService` | Supplies stakeholder role definitions and capability lists | Repository-backed role/permission service |
| `UserManagementService` | Supplies sample user profiles and addresses | User, role, and address repository service |

### Future Repository Layer Plan
- Introduce `UserRepository` for core identity/profile data.
- Introduce `AddressRepository` for customer addresses.
- Introduce role and permission repositories or a join model for access control.
- Keep service methods as the orchestration layer above the repositories.

### Future Entity Design Notes
- `users` should likely become the central entity for identity.
- `customer`, `laundry_partner`, `delivery_partner`, and `admin` may become subtype or profile tables depending on the chosen inheritance strategy.
- `address` should belong to customer identity records.
- `roles` and `permissions` should support future security integration.
- The current `UserRoleType` enum is a useful temporary contract, but it may be replaced or mapped to persisted role records later.

## Phase 3 Snapshot - Authentication and Security

### Current Controllers
- HealthController
- BlueprintController
- StakeholderController
- UserManagementController
- AuthController

### Current Services
- BlueprintCatalogService
- StakeholderCatalogService
- UserManagementService
- AuthService
- JwtService

### Current Endpoints
- `GET /api/v1/health`
- `GET /api/v1/blueprint`
- `GET /api/v1/stakeholders`
- `GET /api/v1/users/roles`
- `GET /api/v1/users/profiles`
- `GET /api/v1/users/{role}/profile`
- `GET /api/v1/users/{role}/addresses`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`

### Current Data Flow
- Public requests hit public controllers and return catalog data directly from services.
- Registration requests create an in-memory account with BCrypt-hashed password.
- Login requests validate the stored password hash and generate a JWT.
- Protected requests carry a bearer token.
- The JWT filter validates the token and populates the Spring Security context.
- Method-level security checks role access before controller methods execute.

### Current Package Structure
- `com.laundrylink.laundrylink.api`
- `com.laundrylink.laundrylink.service`
- `com.laundrylink.laundrylink.security`

### Current Limitations
- Still no persistence layer.
- Still no repository layer.
- Accounts live only in memory.
- JWT secret is a development-only constant.
- Passwords and tokens reset on application restart.

### Future Database Replacement Plan
- Replace in-memory auth accounts with a `users` table.
- Replace seeded role-based accounts with persisted identity records.
- Replace address and profile lookups with repositories.
- Persist role assignments and access rules in dedicated tables.
- Move JWT subject data to database-backed identity lookups when needed.

### Future Authentication Integration Plan
- Keep JWT as the stateless auth mechanism.
- Move the JWT signing secret to configuration or a secret store.
- Replace in-memory registration with repository-backed account creation.
- Enforce permissions with persistent roles and authorities.
- Map authenticated principals to database users instead of sample records.

### High-Level Architecture
- Spring Boot REST API handles requests.
- Spring Security filters authenticate bearer tokens.
- Controllers remain thin and delegate to services.
- Services manage catalog data and in-memory auth accounts.
- JWT acts as the stateless identity carrier.

### Request Flow Diagram (text format)
- Client -> Auth Controller -> Auth Service -> Password Encoder -> JWT Service -> JSON response
- Client -> Protected Controller -> JWT Filter -> Security Context -> Service -> JSON response

### API Inventory Table
| Endpoint | Method | Purpose | Future Replacement |
| --- | --- | --- | --- |
| `/api/v1/health` | GET | Returns application health status | Optional Actuator health endpoint |
| `/api/v1/blueprint` | GET | Returns project blueprint metadata | Database-backed catalog or configuration store |
| `/api/v1/stakeholders` | GET | Returns stakeholder roles and capabilities | Persisted role and permission data |
| `/api/v1/users/roles` | GET | Returns user role summaries | Persisted roles and permissions |
| `/api/v1/users/profiles` | GET | Returns sample profiles for all roles | Database-backed profile listing |
| `/api/v1/users/{role}/profile` | GET | Returns one role-specific profile | User profile lookup from persisted user data |
| `/api/v1/users/{role}/addresses` | GET | Returns addresses for a selected role | Customer address repository lookup |
| `/api/v1/auth/register` | POST | Registers a new account and returns a JWT | Persisted account creation flow |
| `/api/v1/auth/login` | POST | Authenticates credentials and returns a JWT | Repository-backed authentication flow |

### Service Responsibility Table
| Service | Responsibility | Future Replacement |
| --- | --- | --- |
| `BlueprintCatalogService` | Supplies order lifecycle and service catalog data | Repository-backed catalog service |
| `StakeholderCatalogService` | Supplies stakeholder role definitions and capability lists | Repository-backed role/permission service |
| `UserManagementService` | Supplies sample user profiles and addresses | User, role, and address repository service |
| `AuthService` | Registers accounts, authenticates logins, and issues JWTs | Repository-backed authentication service |
| `JwtService` | Generates and validates signed bearer tokens | Secret-management-backed JWT service |

### Future Repository Layer Plan
- Introduce `UserRepository` for core identity/profile data.
- Introduce `AddressRepository` for customer addresses.
- Introduce role and permission repositories or a join model for access control.
- Add an account repository for authentication credentials.
- Keep service methods as the orchestration layer above the repositories.

### Future Entity Design Notes
- `users` should likely become the central entity for identity.
- `customer`, `laundry_partner`, `delivery_partner`, and `admin` may become subtype or profile tables depending on the chosen inheritance strategy.
- `address` should belong to customer identity records.
- `roles` and `permissions` should support future security integration.
- `auth_accounts` or a similar credential table may be needed if login remains separate from profile data.
- The current `UserRoleType` enum is a useful temporary contract, but it may be replaced or mapped to persisted role records later.
