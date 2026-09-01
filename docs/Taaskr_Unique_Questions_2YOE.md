# Taaskr - Comprehensive 2+ YOE Java Backend Interview Preparation

This document contains 80+ unique, well-researched interview questions tailored specifically to the Taaskr architecture (Spring Boot, React, MySQL, Nginx, Razorpay), covering Core Java, System Design, DevOps, Observability, Design Patterns, and Real-World Challenges.

---

## Technical Q&A Section

### Q1: How does HashMap work internally in Java 8+? How is it used in Taaskr?
**Answer:** Java 8 uses an array of Nodes. When collisions happen, it forms a LinkedList. Once a bucket reaches 8 elements, it converts to a Red-Black Tree. In Taaskr, HashMaps could be used for caching parsed JWT claims or quickly looking up provider availabilities in memory.

**Follow-up:** How would concurrent modifications affect a HashMap?

---

### Q2: Explain the difference between interface and abstract class. Why use interfaces for Taaskr Services?
**Answer:** Abstract classes can have state and constructors; interfaces cannot (until Java 8 default methods). In Taaskr, `BookingService` is an interface and `BookingServiceImpl` is the implementation. This decouples the contract from the implementation, making it easier to mock in unit tests and swap implementations.

**Follow-up:** Have you used default methods in interfaces?

---

### Q3: What are Java Streams? How would you use them to filter provider availability in Taaskr?
**Answer:** Streams provide a functional approach to processing collections. In Taaskr, you can do `availabilityList.stream().filter(slot -> slot.isAvailable()).collect(Collectors.toList())` to quickly filter available slots without writing explicit loops.

**Follow-up:** What is the difference between map() and flatMap()?

---

### Q4: How do you handle Exceptions in Java? What is the difference between Checked and Unchecked exceptions?
**Answer:** Checked exceptions (compile-time) must be declared or caught. Unchecked (Runtime) don't. Taaskr uses custom unchecked exceptions like `ResourceNotFoundException` so they bubble up to the `@ControllerAdvice` handler without needing throws declarations everywhere.

**Follow-up:** Why does Spring prefer unchecked exceptions?

---

### Q5: What is multithreading? Have you used CompletableFuture in Taaskr?
**Answer:** CompletableFuture allows asynchronous non-blocking code. While Taaskr currently processes bookings synchronously, CompletableFuture could be used to send email notifications asynchronously after a booking is confirmed, so the user doesn't wait for the SMTP server.

**Follow-up:** What thread pool does CompletableFuture use by default?

---

### Q6: What is the Volatile keyword?
**Answer:** It ensures that updates to a variable are propagated predictably to other threads, preventing them from caching a stale value.

**Follow-up:** How is this different from synchronized?

---

### Q7: Explain the concept of Immutability.
**Answer:** Immutable objects cannot be changed after creation. DTOs in Taaskr (or Java 14+ records) should ideally be immutable to guarantee thread safety when being serialized or passed between layers.

**Follow-up:** How do you create a truly immutable class in Java?

---

### Q8: What is Garbage Collection and how does it work?
**Answer:** GC automatically frees memory by destroying unreachable objects. Modern JVMs use algorithms like G1GC, which divides the heap into regions and collects the one with the most garbage first.

**Follow-up:** How do you monitor GC logs in production?

---

### Q9: Difference between String, StringBuilder, and StringBuffer?
**Answer:** String is immutable. StringBuilder is mutable and not thread-safe (faster). StringBuffer is mutable and thread-safe. Use StringBuilder for building dynamic log messages or long SQL queries in Taaskr.

**Follow-up:** What happens in the string pool when a String is concatenated?

---

### Q10: What are lambda expressions?
**Answer:** Anonymous methods that provide a clear and concise way to implement a functional interface. Used heavily in Taaskr's Stream API filtering.

**Follow-up:** What is a functional interface?

---

### Q11: What is Dependency Injection (DI) and Inversion of Control (IoC)?
**Answer:** IoC delegates control of object creation to a container (Spring). DI is how IoC is implemented (injecting dependencies). In Taaskr, `BookingController` doesn't instantiate `BookingService`; Spring injects it, reducing tight coupling.

**Follow-up:** What are the different types of DI in Spring?

---

### Q12: Why does Taaskr use Constructor Injection over Field Injection (@Autowired)?
**Answer:** Constructor injection allows fields to be `final`, ensuring dependencies are not null at runtime and making classes easier to unit test without Spring's container.

**Follow-up:** Can you have circular dependencies with constructor injection?

---

### Q13: Explain the Spring Bean Lifecycle.
**Answer:** Instantiation -> Populate Properties -> setBeanName -> setBeanFactory -> PreInitialization (BeanPostProcessor) -> afterPropertiesSet -> Custom init -> PostInitialization -> Ready -> Destroy.

**Follow-up:** How can you execute custom logic upon application startup in Taaskr?

---

### Q14: What is `@SpringBootApplication`?
**Answer:** It's a combination of `@Configuration`, `@EnableAutoConfiguration`, and `@ComponentScan`. It bootstraps the Taaskr application.

**Follow-up:** How can you exclude an auto-configuration class?

---

### Q15: What is `@ControllerAdvice` and how is it used in Taaskr?
**Answer:** It handles global exceptions. `GlobalExceptionHandler` uses it to catch `ResourceNotFoundException` and return a standardized JSON error response with appropriate HTTP status codes (e.g., 404).

**Follow-up:** How does `@ExceptionHandler` work?

---

### Q16: Explain `@ConfigurationProperties` vs `@Value`.
**Answer:** Both inject properties. `@Value` is used for single fields (like `${jwt.secret}`). `@ConfigurationProperties` binds a prefix of properties to a POJO, making it strongly typed and easier to validate (e.g., Razorpay properties).

**Follow-up:** How do you validate `@ConfigurationProperties`?

---

### Q17: What is Spring Boot Actuator?
**Answer:** It provides production-ready features like health checks, metrics, and environment info. We can monitor Taaskr's health via `/actuator/health`.

**Follow-up:** How do you secure Actuator endpoints?

---

### Q18: How does Spring Boot Embedded Tomcat work?
**Answer:** Instead of deploying a WAR file to a standalone Tomcat, Spring Boot packages Tomcat as a dependency inside the JAR, starting the server programmatically.

**Follow-up:** How would you change the embedded server to Undertow?

---

### Q19: What are Spring Profiles?
**Answer:** They allow conditional bean creation and property loading based on the environment. Taaskr uses `application-prod.properties` for production and `application.properties` for local dev.

**Follow-up:** How do you activate a specific profile via command line?

---

### Q20: How does `@Transactional` work in Taaskr?
**Answer:** It ensures that a series of DB operations either all commit or all rollback. It uses AOP proxies around the Service method.

**Follow-up:** What happens if a `@Transactional` method catches an exception internally?

---

### Q21: What is the difference between `@Controller` and `@RestController`?
**Answer:** `@RestController` is `@Controller` + `@ResponseBody`. It automatically serializes return objects to JSON. Taaskr uses it for all API endpoints to serve the React frontend.

**Follow-up:** How is the JSON serialization handled under the hood? (Jackson)

---

### Q22: Explain the HTTP status codes used in Taaskr.
**Answer:** 200 OK (Success), 201 Created (New booking), 400 Bad Request (Validation failure), 401 Unauthorized (Invalid JWT), 403 Forbidden (Customer accessing admin route), 404 Not Found (Provider not found), 500 Internal Error (DB down).

**Follow-up:** What is the difference between 401 and 403?

---

### Q23: What is idempotency in REST?
**Answer:** Making the same request multiple times has the same effect as making it once. GET, PUT, DELETE are idempotent. POST is not. Taaskr's POST to `/api/bookings` creates a new booking every time.

**Follow-up:** How would you design a POST to be idempotent? (Idempotency key)

---

### Q24: How does `@Valid` work for DTO validation?
**Answer:** It triggers Bean Validation (Hibernate Validator) on the incoming DTO. If constraints like `@NotNull` or `@Email` on `RegisterRequest` fail, it throws `MethodArgumentNotValidException`.

**Follow-up:** How do you customize the error message returned to the user?

---

### Q25: How does CORS work and how is it configured in Taaskr?
**Answer:** Cross-Origin Resource Sharing allows the React frontend on port 5173 to call Spring Boot on 8081. In Taaskr, it's configured globally in `SecurityConfig`.

**Follow-up:** What is a CORS preflight request?

---

### Q26: What is the N+1 problem in JPA? How would you solve it in Taaskr?
**Answer:** It occurs when JPA executes 1 query to fetch N parent entities (e.g., Providers), and then N additional queries to fetch their lazy-loaded children (e.g., Services). Solve it using `JOIN FETCH` in JPQL or `@EntityGraph`.

**Follow-up:** When should you use LAZY vs EAGER fetching?

---

### Q27: Explain `@OneToMany` and `@ManyToOne` relationships.
**Answer:** `@OneToMany` implies a parent has many children (e.g., one User has many Bookings). `@ManyToOne` is the inverse. In Taaskr, a Booking has a `@ManyToOne` relationship to the ProviderProfile.

**Follow-up:** What is `mappedBy`?

---

### Q28: What is the first-level cache in Hibernate?
**Answer:** It's tied to the JPA `EntityManager` (transaction). If you fetch the same Booking twice in one transaction, the DB is hit once. Taaskr uses this implicitly during complex updates.

**Follow-up:** What is the second-level cache?

---

### Q29: What is Dirty Checking in Hibernate?
**Answer:** Hibernate tracks changes to managed entities. At the end of a transaction, it automatically generates SQL UPDATEs for modified entities without explicit `save()` calls.

**Follow-up:** How can you bypass dirty checking for read-only transactions?

---

### Q30: What is the difference between `save()` and `saveAndFlush()` in Spring Data JPA?
**Answer:** `save()` queues the operation until transaction commit. `saveAndFlush()` immediately sends the SQL to the DB, useful if subsequent logic depends on DB triggers or constraints.

**Follow-up:** Why would you ever need `saveAndFlush`?

---

### Q31: How would you handle DB migrations in Taaskr?
**Answer:** Currently using `ddl-auto=update`. In production, this is dangerous. We should use Flyway or Liquibase to manage versioned SQL scripts.

**Follow-up:** What happens if `ddl-auto=create-drop` is used in production?

---

### Q32: What are DB Indexes? Where would you add them in Taaskr?
**Answer:** Indexes speed up data retrieval. I would index the `email` column in `User` since it's frequently queried during login, and the `status` column in `Booking` for filtering.

**Follow-up:** What are the downsides of too many indexes?

---

### Q33: What is Connection Pooling?
**Answer:** Reusing DB connections instead of opening a new one per request. Taaskr uses HikariCP (Spring Boot default) to maintain a pool, reducing latency and DB load.

**Follow-up:** How do you configure the pool size?

---

### Q34: How does JWT Authentication work in Taaskr?
**Answer:** Upon login, server validates credentials and generates a signed JWT. The React app sends it in the `Authorization: Bearer <token>` header. `JwtAuthenticationFilter` validates the signature and populates `SecurityContext`.

**Follow-up:** What happens if the JWT is stolen?

---

### Q35: Why is JWT stateless?
**Answer:** The token contains all necessary user claims and the signature. The server doesn't need to store a session ID in memory or DB to verify the user.

**Follow-up:** How do you invalidate a JWT before it expires?

---

### Q36: What is the `SecurityFilterChain` in Spring Security?
**Answer:** It configures which endpoints are public (e.g., `/api/auth/**`) and which require authentication. It also registers custom filters like the JWT filter.

**Follow-up:** How does `OncePerRequestFilter` differ from a regular Filter?

---

### Q37: What is PasswordEncoder and why use BCrypt?
**Answer:** Passwords must be hashed, not stored in plaintext. BCrypt includes a salt to protect against rainbow table attacks and is intentionally slow to deter brute-forcing.

**Follow-up:** How does BCrypt verify a password if the salt is random?

---

### Q38: What is the difference between Authentication and Authorization?
**Answer:** Authentication proves WHO you are (JWT signature). Authorization determines WHAT you can do (Role = ADMIN or PROVIDER).

**Follow-up:** How do you secure a specific method with roles in Spring?

---

### Q39: How would you scale Taaskr from 1,000 to 1,000,000 users?
**Answer:** Move away from single EC2. Add an Application Load Balancer. Run Spring Boot in stateless ECS/EKS containers. Scale the Aiven MySQL via read replicas. Add Redis for caching the provider catalog.

**Follow-up:** How would you handle user sessions in a scaled environment? (JWT handles this naturally)

---

### Q40: If the DB is overwhelmed with reads, what caching strategy would you use?
**Answer:** Introduce Redis. Cache the Provider Catalog and Service lists using `@Cacheable`, since this data doesn't change every second. Invalidate cache on updates.

**Follow-up:** What is Cache Stampede?

---

### Q41: How would you introduce asynchronous processing in Taaskr?
**Answer:** Use Kafka or RabbitMQ. When a booking is created, instead of waiting for payment/email confirmation inline, publish an event to a Kafka topic. A separate consumer microservice handles the email/payment sync.

**Follow-up:** Why not just use `@Async`?

---

### Q42: What is Rate Limiting and how would you implement it?
**Answer:** Preventing abuse by limiting requests per IP. Can be implemented via an API Gateway (Kong/AWS API Gateway) or a Bucket4j filter using Redis to track limits across distributed nodes.

**Follow-up:** What HTTP status code is returned when limit is exceeded? (429)

---

### Q43: Explain Monolith vs Microservices for Taaskr.
**Answer:** Taaskr is a monolith. It's easy to deploy and test. As the team and traffic grow, we could split it into `User-Service`, `Booking-Service`, and `Payment-Service`.

**Follow-up:** What is a major challenge when splitting into microservices? (Distributed transactions)

---

### Q44: Why did you use Nginx in front of Spring Boot?
**Answer:** Nginx acts as a reverse proxy, handling SSL termination, serving the static React files extremely efficiently, and proxying only API requests to Spring Boot, hiding port 8081 from the outside.

**Follow-up:** What does `try_files $uri /index.html` do?

---

### Q45: How do you deploy the Taaskr application?
**Answer:** Run `npm run build` for React. Run `mvn clean package` for Spring Boot. Transfer JAR and `dist` to EC2. Configure Nginx to serve `dist` and proxy `/api` to the Java JAR running via systemd.

**Follow-up:** Why use systemd to run the JAR instead of `nohup java -jar`?

---

### Q46: What is the significance of Environment Variables in Taaskr?
**Answer:** We inject `DB_HOST`, `JWT_SECRET`, and `RAZORPAY_SECRET` via env vars so sensitive data isn't hardcoded in `application.properties` or committed to Git.

**Follow-up:** How did you verify variables were loaded on the Linux server? (printenv, /proc/<pid>/environ)

---

### Q47: What happens when DNS fails (NXDOMAIN) for the Aiven database?
**Answer:** Spring Boot will fail to start and throw `UnknownHostException`. Fixed by ensuring the EC2 instance can reach the public internet and resolve DNS.

**Follow-up:** How do you debug DNS on Linux? (nslookup, dig)

---

### Q48: How does Docker simplify deployment?
**Answer:** It packages the app and its dependencies (JRE 17) into a standard image. It eliminates the 'works on my machine' problem.

**Follow-up:** What is a multi-stage Docker build?

---

### Q49: How did you troubleshoot a 502 Bad Gateway in Nginx?
**Answer:** Checked Nginx `error.log`. It usually means Nginx can't connect to port 8081. Checked if Spring Boot was running via `systemctl status` or `ps -ef | grep java`. Found out Java process died due to OOM.

**Follow-up:** How do you allocate more memory to the JVM?

---

### Q50: How do you identify slow database queries in Taaskr?
**Answer:** Enable Spring Boot slow query logging, or use DB monitoring tools in Aiven. We can also use APM tools like New Relic or Datadog.

**Follow-up:** What is `EXPLAIN` in MySQL?

---

### Q51: What is central logging and why is it important?
**Answer:** In a scaled environment with multiple EC2 instances, viewing logs locally is impossible. We send logs to an ELK stack (Elasticsearch, Logstash, Kibana) to search across all instances.

**Follow-up:** How do you add correlation IDs to logs? (MDC in Spring)

---

### Q52: How is Razorpay integrated into Taaskr?
**Answer:** Server calls Razorpay API to create an Order and sends the OrderID to React. React opens the checkout widget. Upon success, React sends Payment ID and Signature to the server. Server verifies the HMAC SHA256 signature.

**Follow-up:** Why must the signature be verified on the backend?

---

### Q53: What happens if the Razorpay webhook fails?
**Answer:** If we rely on webhooks, the payment status might remain 'PENDING'. A cron job should periodically check pending payments against the Razorpay API.

**Follow-up:** What is a webhook?

---

### Q54: What design patterns are used in Taaskr?
**Answer:** 1. **Dependency Injection**: Used everywhere via Spring.
2. **Factory/Builder Pattern**: Used in creating DTOs or JWT generation.
3. **Singleton**: Spring beans are singletons by default.
4. **Repository Pattern**: Spring Data JPA abstracts DB operations.

**Follow-up:** Is a Spring Singleton thread-safe?

---

### Q55: What is the difference between git merge and git rebase?
**Answer:** Merge creates a new commit combining the histories. Rebase rewrites history by appending your branch commits on top of the target branch, keeping history linear.

**Follow-up:** When should you NOT use rebase? (On shared public branches)

---

### Q56: How do you remove a secret accidentally committed to Git?
**Answer:** Using `git filter-repo` or `BFG Repo-Cleaner` to rewrite history and remove the file completely, then forcefully pushing. Also, rotate the secret immediately.

**Follow-up:** What does `git stash` do?

---

### Q57: How would you implement a distributed lock in Taaskr to prevent double bookings?
**Answer:** Use Redis with Redisson or a dedicated lock table in MySQL to ensure only one node can execute the booking transaction.

**Follow-up:** What is the redlock algorithm?

---

### Q58: Explain the proxy pattern used in Spring AOP.
**Answer:** Spring creates dynamic proxies around beans to inject cross-cutting concerns like `@Transactional` or `@PreAuthorize`.

**Follow-up:** What happens if a method calls another `@Transactional` method in the same class?

---

### Q59: How do you handle migrations and backwards compatibility for REST APIs?
**Answer:** Use API versioning (e.g., `/api/v1/bookings`). Ensure DB migrations (flyway) don't drop columns immediately.

**Follow-up:** Header vs URL versioning?

---

### Q60: How would you implement pagination for the Provider Catalog?
**Answer:** Use Spring Data's `Pageable` interface in the repository and pass page/size parameters in the controller.

**Follow-up:** Why is pagination better than returning the whole list?

---

### Q61: Describe the exact process of debugging a 'Connection Refused' error on production.
**Answer:** 1. Verify DB is running. 2. Ping DB host. 3. Check security groups/firewalls blocking port 3306. 4. Verify DB credentials in env vars.

**Follow-up:** What command checks open ports locally? (`netstat` or `ss`)

---

### Q62: What is the purpose of the `@Enumerated(EnumType.STRING)` annotation?
**Answer:** It maps the Java Enum to a VARCHAR column in MySQL. Default is ORDINAL (integer), which breaks if the enum order changes.

**Follow-up:** What happens to old records if an enum value is removed?

---

### Q63: How does React Router handle client-side routing and how does Nginx support it?
**Answer:** React Router manipulates the browser history API. Nginx uses `try_files $uri /index.html` to serve the React index page for deep links, letting React handle the route.

**Follow-up:** What happens if `try_files` is missing?

---

### Q64: How do you manage application memory limits in a Docker container?
**Answer:** Pass JVM flags like `-XX:MaxRAMPercentage=75.0` so Java respects container limits instead of physical host memory.

**Follow-up:** What happens if a container exceeds memory? (OOMKilled)

---

### Q65: What is the N+1 problem and how did you encounter it in Taaskr?
**Answer:** Fetching Bookings and their associated Users triggers a separate query for each user. Fixed by using `@Query("SELECT b FROM Booking b JOIN FETCH b.user")`.

**Follow-up:** Can you use JOIN FETCH with pagination easily?

---

### Q66: How do you test the repository layer in Spring Boot?
**Answer:** Use `@DataJpaTest`, which configures an in-memory database (H2) and only loads JPA beans for fast testing.

**Follow-up:** How do you rollback transactions in tests? (Automatic in @DataJpaTest)

---

### Q67: Explain CI/CD in the context of Taaskr.
**Answer:** Continuous Integration (GitHub Actions) runs `mvn test` on PRs. Continuous Deployment automatically builds the JAR/Docker image and deploys to EC2.

**Follow-up:** What is a blue/green deployment?

---

### Q68: Why should API responses wrap data in a standard object (e.g., ApiResponse)?
**Answer:** It provides a consistent contract for the frontend, always including status, message, and payload, making generic error handling easier in Axios.

**Follow-up:** How do you implement this globally in Spring?

---

### Q69: How do you handle timezones in Taaskr?
**Answer:** Store all dates in UTC in MySQL. The frontend (React) converts UTC to the user's local timezone for display.

**Follow-up:** What Java 8 classes handle timezones? (ZonedDateTime)

---

### Q70: What is the CAP theorem?
**Answer:** Consistency, Availability, Partition Tolerance. A distributed system can only guarantee two. Taaskr's relational DB prioritizes Consistency over Availability in the event of a partition.

**Follow-up:** Does NoSQL prioritize differently?

---

### Q71: How would you optimize the React bundle size?
**Answer:** Use code splitting with `React.lazy()` for distinct routes (e.g., Admin Dashboard vs Customer Dashboard) to avoid loading everything on initial hit.

**Follow-up:** What tool analyzes bundle size?

---

### Q72: What is the significance of `Vite` over `Create React App`?
**Answer:** Vite uses native ES modules during development, resulting in near-instant hot module replacement (HMR) and significantly faster build times.

**Follow-up:** What bundler does Vite use for production? (Rollup)

---

### Q73: How do you prevent XSS attacks in Taaskr?
**Answer:** React automatically escapes HTML to prevent XSS. On the backend, we validate input and can use a library to sanitize dangerous HTML tags if users input rich text.

**Follow-up:** What is a stored XSS attack?

---

### Q74: What is CSRF and why does JWT prevent it?
**Answer:** Cross-Site Request Forgery. JWTs stored in localStorage and sent via Bearer headers aren't automatically sent by the browser like cookies, mitigating CSRF.

**Follow-up:** What if the JWT is stored in an HttpOnly cookie?

---

### Q75: How do you ensure secure DB connections?
**Answer:** The Aiven URL specifies `sslMode=REQUIRED`. This encrypts data in transit between the EC2 instance and the Aiven servers.

**Follow-up:** How do you manage SSL certs for Nginx? (Certbot/Let's Encrypt)

---

### Q76: Explain the Saga pattern.
**Answer:** In microservices, transactions span multiple services. Saga executes a sequence of local transactions. If one fails, it executes compensating transactions to rollback the previous ones.

**Follow-up:** How is this different from 2PC?

---

### Q77: What is API Gateway?
**Answer:** A single entry point for all clients. It handles routing, rate limiting, authentication, and SSL termination. Kong or Spring Cloud Gateway.

**Follow-up:** How does it differ from a Reverse Proxy?

---

### Q78: How do you implement Health Checks?
**Answer:** Spring Boot Actuator exposes `/actuator/health`. An external monitoring service or Load Balancer hits this endpoint to verify the node is alive.

**Follow-up:** What makes a health check fail? (DB down, Disk full)

---

### Q79: Explain the concept of Circuit Breaker.
**Answer:** If a downstream service (like Razorpay) is failing, the circuit breaker trips and immediately returns an error or fallback, preventing cascading failures and thread exhaustion.

**Follow-up:** What library implements this? (Resilience4j)

---

### Q80: What is a Thread Dump?
**Answer:** A snapshot of the state of all threads. Used to diagnose deadlocks or high CPU usage. Captured via `jstack`.

**Follow-up:** What is a Heap Dump?

---

### Q81: How do you prevent duplicate user registrations?
**Answer:** Add a `UNIQUE` constraint on the `email` column in MySQL and handle the `DataIntegrityViolationException` in Spring Boot to return a 400 Bad Request.

**Follow-up:** Should this logic also exist in the Service layer?

---

### Q82: What is the difference between `@Component`, `@Service`, and `@Repository`?
**Answer:** They all register beans. `@Service` is a semantic marker for business logic. `@Repository` automatically translates SQL exceptions into Spring's DataAccessException hierarchy.

**Follow-up:** What does `@Component` do?

---

### Q83: How do you handle configuration secrets in AWS?
**Answer:** Instead of env vars on EC2, use AWS Secrets Manager or Parameter Store. Fetch them at startup via Spring Cloud AWS.

**Follow-up:** Why is this better than env vars?

---

### Q84: What is the Builder Pattern?
**Answer:** It separates the construction of a complex object from its representation. Helpful for DTOs with many optional fields.

**Follow-up:** How do you use it in Java? (@Builder via Lombok)

---

### Q85: How does `npm ci` differ from `npm install`?
**Answer:** `npm ci` strictly installs exactly what is in `package-lock.json` and deletes `node_modules` first, ensuring reproducible builds. `npm install` might update the lock file.

**Follow-up:** When should you use `npm install`?

---

### Q86: What happens if the JVM runs out of memory?
**Answer:** It throws `OutOfMemoryError`. The process might hang. We should configure `-XX:+HeapDumpOnOutOfMemoryError` to analyze the heap dump.

**Follow-up:** What tool reads a heap dump? (Eclipse MAT)

---

### Q87: Explain the difference between `Long` and `long` in Java Entities.
**Answer:** `Long` is an object wrapper and can be null. `long` is a primitive and defaults to 0. IDs should be `Long` so JPA knows when an entity is unsaved (null ID).

**Follow-up:** What is autoboxing?

---

### Q88: How do you trace a request across multiple microservices?
**Answer:** Use Distributed Tracing (e.g., Sleuth/Zipkin or OpenTelemetry). A unique Trace ID is generated at the Gateway and passed via HTTP headers.

**Follow-up:** What is the difference between Trace ID and Span ID?

---

### Q89: What is a materialized view in databases?
**Answer:** A database object that contains the results of a query. Unlike a normal view, it stores the data on disk, speeding up complex aggregations at the cost of stale data.

**Follow-up:** How do you refresh it?

---

### Q90: How does Spring Data JPA generate queries from method names?
**Answer:** It parses method names like `findByEmailAndStatus()` into JPQL criteria queries at runtime.

**Follow-up:** What happens if the method name has a typo? (Fails on startup)

---

### Q91: Explain the purpose of `flyway_schema_history` table.
**Answer:** It tracks which migration scripts (e.g., `V1__init.sql`) have been executed so Flyway doesn't run them again on startup.

**Follow-up:** What happens if a checksum changes?

---

### Q92: What is the difference between `@Mock` and `@InjectMocks` in Mockito?
**Answer:** `@Mock` creates a mock object. `@InjectMocks` creates an instance of the class being tested and injects the created `@Mock`s into it.

**Follow-up:** When do you use `@MockBean`? (Spring Boot integration tests)

---


*(Generated dynamically covering 80+ distinct, unique architectural and Spring Boot questions for 2+ YOE)*
