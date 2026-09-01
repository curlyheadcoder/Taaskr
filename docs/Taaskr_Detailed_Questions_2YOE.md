# Taaskr - Comprehensive 2+ YOE Java Backend Interview Preparation

This document focuses on deep, multi-paragraph explanations of Core Java, Spring Boot, Architecture, and DevOps, specifically anchored to the Taaskr project. It includes follow-up questions and real-world scenarios.

---

## Technical Q&A Section

### Q1: How does HashMap work internally in Java 8+? How might it be utilized in a project like Taaskr?
**Detailed Answer:**
In Java 8, a HashMap is backed by an array of Nodes. When a key is inserted, its hashCode() is computed and modulated by the array size to find the bucket index. If multiple keys hash to the same bucket (collision), they form a LinkedList. To prevent degradation to O(n) lookup time, once a bucket's list reaches a threshold of 8 elements, the LinkedList is converted into a Red-Black Tree, restoring O(log n) performance for that bucket. In Taaskr, HashMaps are inherently used by Spring Security internally to hold SecurityContext properties, and we might use them explicitly to cache parsed JWT claims in memory (e.g., mapping a User ID to their roles) avoiding repeated decoding on every request.

**Interviewer Follow-up:** How would concurrent modifications affect this HashMap, and what is the alternative? (Ans: ConcurrentModificationException; use ConcurrentHashMap).

---

### Q2: What are Java Streams, and how would you use them to filter provider availability in Taaskr?
**Detailed Answer:**
Streams provide a functional, declarative approach to processing collections. Instead of writing external loops, we can process data through a pipeline of operations (map, filter, reduce). For example, to filter available slots for a provider in Taaskr, we can write: `availabilityList.stream().filter(slot -> slot.isAvailable() && slot.getDate().isAfter(LocalDate.now())).collect(Collectors.toList())`. This is much cleaner than a traditional for-loop and allows for easy parallelization using `.parallelStream()` if the list is massive.

**Interviewer Follow-up:** What is the difference between an intermediate operation (like map/filter) and a terminal operation (like collect)?

---

### Q3: Explain the concept of Immutability and why it matters for DTOs in Taaskr.
**Detailed Answer:**
An immutable object cannot have its state changed after it is constructed. This means no setter methods, and all fields are marked `final`. Immutability guarantees thread safety because multiple threads can read the object simultaneously without worrying about race conditions or state corruption. In Taaskr, DTOs (Data Transfer Objects) like `LoginRequest` or `BookingResponse` should be immutable. When passing data between the Controller and Service layers, ensuring the DTO cannot be modified prevents accidental side effects and makes the code highly predictable.

**Interviewer Follow-up:** How do you create a truly immutable class in Java if one of its fields is a mutable object like a Date or a List? (Ans: Defensive copying).

---

### Q4: Explain the Spring Bean Lifecycle and where we might intervene in Taaskr.
**Detailed Answer:**
The Spring Bean Lifecycle consists of: Instantiation (calling the constructor) -> Populating Properties (Dependency Injection) -> Aware interfaces (like ApplicationContextAware) -> Pre-Initialization (BeanPostProcessors) -> Initialization (methods annotated with @PostConstruct or implementing InitializingBean) -> Post-Initialization -> Ready for Use -> Destruction (@PreDestroy). In Taaskr, we could use `@PostConstruct` in our `DataSeeder` or `RazorpayConfig` to execute logic exactly once after the bean is fully constructed and injected, such as validating that the Razorpay API keys are not null before the app accepts traffic.

**Interviewer Follow-up:** What is the role of a BeanPostProcessor? (Ans: It allows custom modification of new bean instances before and after initialization, often used for creating AOP proxies).

---

### Q5: What is Dependency Injection (DI) and how is Constructor Injection advantageous in Taaskr?
**Detailed Answer:**
Dependency Injection is a design pattern where an object receives its dependencies from an external source (the Spring IoC Container) rather than creating them itself. In Taaskr, we inject `BookingRepository` into `BookingService`. Constructor Injection (using `private final BookingRepository repo;` and a constructor) is preferred over `@Autowired` field injection because it allows the field to be `final`, guaranteeing it cannot be null at runtime. It also allows the `BookingService` to be easily instantiated in a pure unit test without needing the Spring Context.

**Interviewer Follow-up:** Can you have circular dependencies when using constructor injection? (Ans: No, Spring will throw an exception at startup, forcing you to redesign your architecture).

---

### Q6: How does `@Transactional` work behind the scenes in Taaskr?
**Detailed Answer:**
When you annotate a method in `BookingService` with `@Transactional`, Spring does not invoke the method directly. Instead, it uses AOP (Aspect-Oriented Programming) to create a dynamic proxy around the service bean. When a controller calls the service method, it actually calls the proxy. The proxy intercepts the call, opens a database transaction, invokes the real service method, and then either commits the transaction if it succeeds, or rolls it back if a RuntimeException is thrown. This guarantees ACID properties for operations like booking creation and payment initialization.

**Interviewer Follow-up:** What happens if a `@Transactional` method catches an exception internally and doesn't rethrow it? (Ans: The proxy doesn't know it failed, so the transaction will commit instead of rollback).

---

### Q7: What is the N+1 problem in JPA? How would you identify and solve it in Taaskr?
**Detailed Answer:**
The N+1 problem occurs when JPA executes 1 query to fetch a list of N parent entities (e.g., Bookings), and then N additional queries to fetch their lazy-loaded children (e.g., Users or Providers associated with each booking). You identify it by looking at the Spring Boot SQL logs and noticing a flood of SELECT statements. In Taaskr, this would severely degrade performance on the Admin Dashboard. To solve it, we can write a custom JPQL query using `JOIN FETCH` (e.g., `SELECT b FROM Booking b JOIN FETCH b.user JOIN FETCH b.provider`) which fetches everything in a single SQL JOIN query.

**Interviewer Follow-up:** What is the difference between `@EntityGraph` and `JOIN FETCH`?

---

### Q8: Explain dirty checking in Hibernate.
**Detailed Answer:**
When you fetch an entity (like a `Booking`) within an active `@Transactional` block, Hibernate places it in the Persistence Context (First-Level Cache) and keeps a snapshot of its initial state. If you modify the entity (e.g., `booking.setStatus(BookingStatus.CONFIRMED)`), you do not need to explicitly call `repository.save(booking)`. When the transaction commits, Hibernate compares the current state of the entity against the snapshot. Since it detects a change (it is 'dirty'), it automatically generates and executes an SQL UPDATE statement.

**Interviewer Follow-up:** How can you bypass dirty checking for massive read-only queries to save memory? (Ans: Use `@Transactional(readOnly = true)`).

---

### Q9: How does JWT Authentication flow work in Taaskr, and why is it stateless?
**Detailed Answer:**
When a user logs in, the `AuthController` validates their credentials against the DB. If successful, it generates a JWT containing the user's ID, roles, and an expiration timestamp, signed securely using `app.jwt.secret`. The React frontend stores this and sends it in the `Authorization: Bearer` header. On subsequent requests, the `JwtAuthenticationFilter` intercepts the request, verifies the signature mathematically, and populates the `SecurityContext`. It is considered stateless because the server does not store any session ID in memory or the database; all the information needed to verify the user is encoded within the token itself.

**Interviewer Follow-up:** What happens if the JWT is stolen by a malicious script (XSS)? (Ans: The attacker can impersonate the user until it expires. Mitigation involves short expirations and storing in HttpOnly cookies).

---

### Q10: How did you configure CORS in Taaskr and why is it necessary?
**Detailed Answer:**
CORS (Cross-Origin Resource Sharing) is a security feature enforced by web browsers. Since the Vite React app runs on `localhost:5173` and the Spring Boot API runs on `localhost:8081`, they are different origins. If the API doesn't explicitly allow the frontend's origin, the browser blocks the response. In Taaskr, we configure CORS globally in the `SecurityConfig` by defining a `CorsConfigurationSource` bean that specifies allowed origins, headers (like Authorization), and HTTP methods (GET, POST, etc.).

**Interviewer Follow-up:** What is a CORS preflight request? (Ans: An HTTP OPTIONS request sent by the browser before a complex request to verify the server permits it).

---

### Q11: Why did you use Nginx in front of Spring Boot for Taaskr's deployment?
**Detailed Answer:**
Nginx acts as an incredibly fast and efficient Reverse Proxy and static file server. For Taaskr, Nginx is bound to port 80 (HTTP). It serves the static React frontend files directly from `/usr/share/nginx/html` without involving Java at all. For any request starting with `/api/`, Nginx uses `proxy_pass http://localhost:8081` to forward the request to the underlying Spring Boot process. This provides a unified domain, hides the Java port from the public internet, and allows Nginx to handle SSL termination and load balancing in the future.

**Interviewer Follow-up:** How does Nginx handle React's client-side routing? (Ans: By using `try_files $uri /index.html` so 404s fallback to React Router).

---

### Q12: What happens when DNS fails (NXDOMAIN) for the Aiven MySQL database, and how did you debug it?
**Detailed Answer:**
During deployment, if the EC2 instance cannot resolve the Aiven database hostname (e.g., `db.aivencloud.com`), Spring Boot throws an `UnknownHostException` or a JDBC connection timeout during startup, causing the application to crash immediately. To debug this, we use Linux networking commands like `nslookup` or `dig` against the Aiven host from within the EC2 instance. The root cause usually involves VPC DNS settings, missing internet gateways, or a typo in the `DB_HOST` environment variable.

**Interviewer Follow-up:** If the database goes down during runtime, how can we prevent the entire API from hanging? (Ans: Configure JDBC connection timeouts and HikariCP connection limits).

---

### Q13: Explain the process of tracing a 502 Bad Gateway error in production.
**Detailed Answer:**
A 502 Bad Gateway means Nginx (the proxy) received an invalid response or no response from the upstream server (Spring Boot on port 8081). First, I check Nginx logs (`/var/log/nginx/error.log`) which usually state 'Connection refused'. This indicates Spring Boot is down. I then check the Java process using `ps -ef | grep java` or `systemctl status taaskr`. Finally, I look at the Spring Boot application logs using `journalctl -u taaskr` to find the root cause of the crash, which could be an OutOfMemoryError, database connection failure, or a missing environment variable.

**Interviewer Follow-up:** How would you distinguish a 502 from a 500 Internal Server Error? (Ans: 502 means the proxy couldn't reach the backend; 500 means the backend threw a Java exception).

---

### Q14: How would you scale Taaskr's database architecture if reads became a bottleneck?
**Detailed Answer:**
Currently, Taaskr uses a single Aiven MySQL instance. If read queries (like users browsing the Provider Catalog) overwhelm the database, I would first introduce a caching layer like Redis for data that doesn't change frequently (catalog services, categories). If the database is still a bottleneck, I would configure Read Replicas for the MySQL database. We would then configure Spring Boot to route all `@Transactional(readOnly = true)` methods to the replica, leaving the master node exclusively for write operations (bookings, payments).

**Interviewer Follow-up:** What is replication lag, and how does it impact user experience?

---

### Q15: How did you manage environment variables, and why is ${DB_HOST}:${DB_PORT} sometimes unresolved?
**Detailed Answer:**
Environment variables are crucial for keeping secrets (like JWT and Razorpay keys) out of Git. They are injected into Spring Boot via `application-prod.properties` (e.g., `${DB_HOST}`). If they are unresolved, Spring Boot throws a placeholder resolution error. This happens when the variables are set in a user's `~/.bashrc` but the app is run as a systemd service (which doesn't read bash profiles), or if the variables were simply not exported. The fix is to define them directly in the `systemd` `.service` file under `Environment=`.

**Interviewer Follow-up:** What command can you use to inspect the exact environment variables a running Linux process has? (Ans: `cat /proc/<PID>/environ`).

---

### Q16: Walk me through the exact payment lifecycle in Taaskr with Razorpay.
**Detailed Answer:**
1. The user initiates a payment for a booking on the React frontend. 
2. The frontend calls the backend `/api/payments/createOrder`. 
3. The backend uses the Razorpay Java SDK and `RAZORPAY_KEY_SECRET` to create an Order on Razorpay's servers, saving the `provider_order_id` in our DB. 
4. The backend returns the Order ID to React. 
5. React opens the Razorpay checkout widget. 
6. The user completes the payment, and Razorpay returns a `payment_id` and a `signature` to the frontend. 
7. The frontend sends these to `/api/payments/verify`. 
8. The backend cryptographically hashes the order ID and payment ID using the secret key. If it matches the signature, the payment is marked CONFIRMED.

**Interviewer Follow-up:** Why must the signature be verified on the backend? (Ans: Because the frontend can be manipulated by the user to send fake 'success' responses).

---


*(End of Detailed Q&A Guide)*
