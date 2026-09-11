# 🚀 Taaskr Enterprise Architecture & Java Tech Stack - Interview Preparation Guide

This comprehensive guide covers **every core Java concept, Spring Boot architectural pattern, Data Structure, Design Pattern, Database strategy, and Security mechanism** implemented in the **Taaskr** platform. Use this document for deep technical interview revision.

---

## 📚 Table of Contents
1. [Core Java & OOP Fundamentals](#1-core-java--oop-fundamentals)
2. [Java 8+ Features & Functional Programming](#2-java-8-features--functional-programming)
3. [Java Collection Framework & Data Structures](#3-java-collection-framework--data-structures)
4. [Concurrency, Multithreading & Asynchronous Processing](#4-concurrency-multithreading--asynchronous-processing)
5. [Spring Boot & Enterprise Framework Architecture](#5-spring-boot--enterprise-framework-architecture)
6. [Spring Security & JWT Authentication](#6-spring-security--jwt-authentication)
7. [Spring Data JPA, Hibernate & Database Engineering](#7-spring-data-jpa-hibernate--database-engineering)
8. [Design Patterns Implemented in Taaskr](#8-design-patterns-implemented-in-taaskr)
9. [Event-Driven Architecture & Caching](#9-event-driven-architecture--caching)
10. [RESTful API Design & Global Exception Handling](#10-restful-api-design--global-exception-handling)
11. [Interview Q&A Cheatsheet for Taaskr](#11-interview-qa-cheatsheet-for-taaskr)

---

## 1. Core Java & OOP Fundamentals

Taaskr strictly adheres to object-oriented domain modeling principles to maintain clean boundaries between API contracts, business logic, and database persistence.

### A. Encapsulation
- **Implementation**: Domain Entities (`User`, `Booking`, `ProviderProfile`, `Service`) and Data Transfer Objects (DTOs like `RegisterRequest`, `ChangePasswordRequest`) encapsulate private fields with getters and setters.
- **Data Integrity**: Input validation annotations (`@NotBlank`, `@Email`, `@Size`, `@Min`) guard field state before entering service methods.
- **Example in Taaskr**:
```java
public class UserFavoriteService {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "service_id")
    private Service service;

    // Encapsulated accessors
    public Long getId() { return id; }
    public User getUser() { return user; }
    public Service getService() { return service; }
}
```

### B. Inheritance
- **Implementation**: Exception hierarchy extending `RuntimeException`.
- **Class Hierarchy**: `TaaskrException` $\rightarrow$ `BadRequestException`, `ResourceNotFoundException`, `UnauthorizedException`.
- **Example in Taaskr**:
```java
public class TaaskrException extends RuntimeException {
    public TaaskrException(String message) { super(message); }
}

public class ResourceNotFoundException extends TaaskrException {
    public ResourceNotFoundException(String message) { super(message); }
}
```

### C. Polymorphism (Compile-time & Run-time)
- **Run-time Polymorphism (Method Overriding)**: `@Service` interface implementations overriding interface definitions (`AuthServiceImpl` implementing `AuthService`, `ProviderWorkflowServiceImpl` implementing `ProviderWorkflowService`).
- **Dynamic Interface Dispatch**: Notification interfaces (`EmailService`, `SmsService`) dispatch messages via multiple underlying vendor drivers depending on runtime environment parameters.
- **Compile-time Polymorphism (Method Overloading)**: Overloaded constructors in DTOs and entities for flexible instantiation during unit tests and JPA materialization.

### D. Abstraction
- **Implementation**: Service layer contracts defined as interfaces (`AuthService`, `BookingService`, `FavoriteService`, `PaymentService`). Controllers depend on interface abstractions, enabling easy mocking with `@MockBean` during testing and compliance with SOLID Dependency Inversion Principle.

---

## 2. Java 8+ Features & Functional Programming

### A. Streams API (`java.util.stream`)
Used extensively throughout services for mapping entities to DTOs, filtering active categories, and calculating analytics.

1. **Filtering & Mapping (`map`, `filter`, `collect`)**:
```java
// ProviderWorkflowServiceImpl.java
@Override
@Transactional(readOnly = true)
public List<CategoryResponse> getMyCategories(String providerEmail) {
    ProviderProfile provider = getProviderByEmail(providerEmail);
    return providerCategoryRepository.findByProviderId(provider.getId())
            .stream()
            .map(pc -> pc.getCategory())
            .filter(c -> Boolean.TRUE.equals(c.getActive()))
            .map(c -> new CategoryResponse(c.getId(), c.getName(), c.getDescription(), c.getIconUrl()))
            .collect(Collectors.toList());
}
```

2. **Sorting & Transformation**:
```java
// FavoriteServiceImpl.java
@Override
@Transactional(readOnly = true)
public List<ServiceResponse> getUserFavorites(String userEmail) {
    User user = getUserByEmail(userEmail);
    return favoriteRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
            .stream()
            .map(fav -> mapToServiceResponse(fav.getService()))
            .collect(Collectors.toList());
}
```

### B. `Optional<T>` to Avoid `NullPointerException`
Preventing null reference errors when querying JPA repositories.
```java
User user = userRepository.findByEmail(email.trim().toLowerCase())
        .orElseThrow(() -> new ResourceNotFoundException("User with email " + email + " not found"));
```

### C. Lambda Expressions & Method References
- **Method Reference (`User::getEmail`)**: Compact syntax for extracting entity attributes.
- **Lambda (`s -> mapToDTO(s)`)**: Clean inline implementations for transformation pipelines.

### D. Modern Java Date & Time API (`java.time`)
Replaced legacy `java.util.Date` with thread-safe, immutable classes:
- `LocalDateTime`: Booking start/end timestamps, entity auditing (`createdAt`).
- `LocalDate`: Date-specific schedule lookups (`AvailabilitySlot`).
- `Duration`: Calculating service slot durations and JWT token time-to-live.

---

## 3. Java Collection Framework & Data Structures

| Collection Type | Class Used in Taaskr | Purpose & Use Case | Why Selected |
| :--- | :--- | :--- | :--- |
| **`List<T>`** | `ArrayList<T>` | Pagination results, API list responses (`List<BookingResponse>`) | $O(1)$ fast indexed access for JSON serialization |
| **`Set<T>`** | `HashSet<T>` | Role authorities (`Set<Role>`), distinct category IDs | Ensures unique elements and $O(1)$ membership lookup |
| **`Map<K,V>`** | `ConcurrentHashMap<K,V>` | In-memory OTP rate-limiting counters, temporary token stores | Thread-safe concurrent read/write operations without global locking |
| **`Queue<T>`** | `ConcurrentLinkedQueue<T>` | Event listener task queues | Lock-free thread-safe queuing for asynchronous notification jobs |

---

## 4. Concurrency, Multithreading & Asynchronous Processing

### A. Non-Blocking `@Async` Thread Pools
To prevent slow network calls (e.g., email via Resend API or SMS dispatches) from delaying HTTP response times:

```java
// EmailServiceImpl.java
@Override
@Async("taskExecutor")
public void sendVerificationOtp(String toEmail, String otpCode) {
    try {
        // External REST API call to email gateway
        dispatchViaResendApi(toEmail, "Taaskr OTP", "Your code is " + otpCode);
    } catch (Exception ex) {
        log.warn("External email dispatch failed, falling back to console logger", ex);
    }
}
```

### B. Spring TaskExecutor Configuration
Custom thread pool configuration configured for production concurrency:
- **Core Pool Size**: 5 worker threads.
- **Max Pool Size**: 20 worker threads.
- **Queue Capacity**: 500 tasks.

### C. Thread Safety & Atomic Operations
- **`BCryptPasswordEncoder`**: Thread-safe password hashing algorithm.
- **`JwtService`**: Thread-safe HMAC-SHA signature generation using `Keys.hmacShaKeyFor`.

---

## 5. Spring Boot & Enterprise Framework Architecture

### A. Dependency Injection (DI) & Inversion of Control (IoC)
Taaskr utilizes **Constructor-based Injection** (recommended Spring best practice) to enforce immutability and ease unit testing:

```java
@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    // Spring automatically injects required beans via constructor
    public AuthServiceImpl(UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }
}
```

### B. Spring Bean Lifecycles & Annotations
- `@RestController`: Marks HTTP controller returning JSON bodies (`@ResponseBody` implicit).
- `@Service`: Component stereotype for business logic layer.
- `@Repository`: Component stereotype for persistence layer; translates SQL exceptions into Spring's DataAccessException hierarchy.
- `@Configuration`: Defines Spring bean factory methods (e.g., Security Config, Web MVC Config).

---

## 6. Spring Security & JWT Authentication

### A. Stateless Authentication Architecture
Taaskr implements stateless JWT (JSON Web Token) security to allow seamless horizontal scalability across multiple microservice replicas.

```
[ Client App ] ───( POST /api/auth/login )───► [ Security Filter Chain ]
                                                        │
                                          (Validate Credentials & BCrypt)
                                                        │
[ Client App ] ◄───( Bearer JWT Token )────────────────┘
      │
      └─► [ HTTP Request + Header "Authorization: Bearer <jwt>" ] 
                │
                ▼
      [ JwtAuthenticationFilter ] ──( Verify Signature )──► [ SecurityContextHolder ]
```

### B. `JwtAuthenticationFilter` Implementation
Intercepts every incoming request extending `OncePerRequestFilter`:
1. Extracts `Authorization: Bearer <token>` header.
2. Validates token signature and expiration with `JwtService`.
3. Extracts user subject and claims (Roles: `CUSTOMER`, `PROVIDER`, `ADMIN`).
4. Populates `SecurityContextHolder.getContext().setAuthentication(...)`.

### C. Password Security
- **Algorithm**: `BCryptPasswordEncoder` with strength factor 10.
- **Salt Management**: BCrypt auto-generates a unique random 128-bit salt for every password, storing it directly inside the hashed output string to protect against Rainbow Table attacks.

---

## 7. Spring Data JPA, Hibernate & Database Engineering

### A. Entity Mapping & Relationships
Taaskr utilizes standard JPA ORM mappings:
- **`@Entity` & `@Table`**: Maps Java objects to relational tables.
- **`@ManyToOne(fetch = FetchType.LAZY)`**: Performance-optimized lazy loading for foreign keys (`Booking` $\rightarrow$ `User`).
- **`@PrePersist` & `@PreUpdate`**: Entity lifecycle callbacks to auto-populate `createdAt` and `updatedAt` timestamps.

### B. Database Indexing Strategy
To support high-throughput database queries under production load, explicit compound and single-column indexes are defined on entity tables:

```java
@Entity
@Table(
    name = "services",
    indexes = {
        @Index(name = "idx_service_category_active", columnList = "category_id, active"),
        @Index(name = "idx_service_name", columnList = "name")
    }
)
public class Service { ... }
```

### C. Transaction Management (`@Transactional`)
- **`@Transactional(readOnly = true)`**: Optimizes Hibernate dirty-checking and database lock overhead for read operations.
- **`@Transactional` (Write)**: Ensures ACID atomicity when creating bookings, updating bank details, or changing credentials. If an exception occurs, database updates automatically roll back.

---

## 8. Design Patterns Implemented in Taaskr

| Design Pattern | Category | How It Is Implemented in Taaskr |
| :--- | :--- | :--- |
| **Singleton** | Creational | All Spring Beans (`@Service`, `@Repository`, `@RestController`) are managed as singletons by the Spring IoC container. |
| **Repository Pattern** | Architectural | `UserRepository`, `BookingRepository`, `ServiceRepository` decouple data storage details from service logic. |
| **DTO Pattern** | Structural | Keeps internal database entities isolated from external JSON request/response formats. |
| **Strategy Pattern** | Behavioral | Notification service fallbacks (Switching dynamically between Resend, Brevo, and Console Logging). |
| **Observer Pattern** | Behavioral | Event-driven decoupled handling using Spring `ApplicationEventPublisher` and `@EventListener`. |
| **Builder Pattern** | Creational | Constructing complex JWT claims and building test fixtures. |

---

## 9. Event-Driven Architecture & Caching

### A. Decoupled Booking Events
When a booking is confirmed, instead of blocking the booking transaction with notification logic, Taaskr emits an event:

```java
// BookingServiceImpl.java
eventPublisher.publishEvent(new BookingCreatedEvent(savedBooking));
```

```java
// BookingEventListener.java
@Component
public class BookingEventListener {

    @EventListener
    @Async
    public void handleBookingCreated(BookingCreatedEvent event) {
        // Async background notification to matching providers
        notifyEligibleProviders(event.getBooking());
    }
}
```

### B. Spring Cache Integration (`@Cacheable`)
- **Use Case**: Frequently read, rarely changed data (Service Categories list, Active Services catalog).
- **Annotations**: `@Cacheable(value = "categories")` caches output; `@CacheEvict(value = "categories", allEntries = true)` invalidates cache when admin updates categories.

---

## 10. RESTful API Design & Global Exception Handling

### A. Centralized Error Handling (`@RestControllerAdvice`)
Ensures uniform error JSON responses across all endpoints without leaking raw stack traces to users.

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
        ErrorResponse err = new ErrorResponse(HttpStatus.NOT_FOUND.value(), ex.getMessage(), LocalDateTime.now());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationError(MethodArgumentNotValidException ex) {
        String details = ex.getBindingResult().getFieldErrors().stream()
                .map(err -> err.getField() + ": " + err.getDefaultMessage())
                .collect(Collectors.joining(", "));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(400, "Validation Failed: " + details, LocalDateTime.now()));
    }
}
```

---

## 11. Interview Q&A Cheatsheet for Taaskr

### Q1: How does authentication and authorization work in Taaskr?
> **Answer**: Taaskr uses stateless JWT authentication. When users submit credentials to `/api/auth/login`, Spring Security verifies their email and password (hashed via BCrypt). Upon success, a signed JWT containing their user identity and role (CUSTOMER, PROVIDER, ADMIN) is returned. Subsequent requests supply `Authorization: Bearer <token>`. The custom `JwtAuthenticationFilter` validates the token on every request and populates the `SecurityContextHolder`.

### Q2: Why did you use DTOs instead of exposing JPA Entities in Controllers?
> **Answer**: Exposing entities directly causes security risks (over-posting / mass assignment vulnerabilities), recursive JSON serialization cycles (due to `@ManyToOne` / `@OneToMany` bidirectionality), and tight coupling between DB schema and API contracts. DTOs allow strict input validation (`@Valid`) and clean API versioning.

### Q3: How do you handle slow third-party API calls like Email or SMS in Taaskr?
> **Answer**: Email and SMS dispatches are annotated with `@Async("taskExecutor")`. They run asynchronously on a dedicated Spring TaskExecutor thread pool, returning immediate HTTP responses to the user while background threads handle network I/O and retries.

### Q4: How do you prevent dirty reads or transactional failures when updating user profiles?
> **Answer**: We enforce `@Transactional` boundary annotations on service methods. Read operations use `@Transactional(readOnly = true)` to avoid Hibernate dirty-checking overhead, while state modification operations run in atomic transactions that automatically rollback if runtime exceptions occur.

### Q5: How did you optimize database performance in Taaskr?
> **Answer**: We implemented composite indexes on high-cardinality foreign keys and search columns (`idx_service_category_active` on `(category_id, active)`), configured `FetchType.LAZY` on relationships to eliminate $N+1$ select queries, and added Spring Caching for static metadata like service categories.

---
*Created for Taaskr Engineering & Interview Preparation.*
