# Taaskr Microservices Migration: Complete Step-by-Step Execution Guide
**Author:** Antigravity Architecture Team  
**Date:** September 11, 2026  
**Target:** Monolith to Microservices Step-by-Step Developer Playbook  

---

## Overview

This guide provides an **exact, step-by-step developer execution playbook** to transform the Taaskr Spring Boot monolith into 8 decoupled microservices. Every terminal command, configuration file, database script, and code migration step is explicitly documented below.

---

## Phase 0: Infrastructure Prerequisites Setup

Before extracting code, set up the local multi-service container environment.

### Step 0.1: Create Root Docker Infrastructure File
Create `docker-compose.infrastructure.yml` in the root directory:

```yaml
version: '3.8'

services:
  zookeeper:
    image: confluentinc/cp-zookeeper:7.4.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181

  kafka:
    image: confluentinc/cp-kafka:7.4.0
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:29092,PLAINTEXT_HOST://localhost:9092
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  mongo:
    image: mongo:7.0
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_DATABASE: taaskr_catalog_db

  postgres-auth:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: taaskr_auth_db
      POSTGRES_USER: taaskr_admin
      POSTGRES_PASSWORD: SecretPassword123
    ports:
      - "5432:5432"

  postgres-booking:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: taaskr_booking_db
      POSTGRES_USER: taaskr_admin
      POSTGRES_PASSWORD: SecretPassword123
    ports:
      - "5433:5432"

  postgres-wallet:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: taaskr_wallet_db
      POSTGRES_USER: taaskr_admin
      POSTGRES_PASSWORD: SecretPassword123
    ports:
      - "5434:5432"
```

### Step 0.2: Start Local Infrastructure
Run the command:
```bash
docker-compose -f docker-compose.infrastructure.yml up -d
```

---

## Step 1: Deploy Spring Cloud API Gateway (`api-gateway`)

The Gateway acts as the unified perimeter entry point (Port 8080).

### 1.1 Create Gateway Project
```bash
mkdir -p services/api-gateway
cd services/api-gateway
```

### 1.2 `pom.xml` Dependencies
```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-gateway</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-redis-reactive</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-circuitbreaker-reactor-resilience4j</artifactId>
    </dependency>
</dependencies>
```

### 1.3 `application.yml` Route Setup
```yaml
server:
  port: 8080

spring:
  cloud:
    gateway:
      routes:
        - id: auth-service
          uri: http://localhost:8081
          predicates:
            - Path=/api/v1/auth/**, /api/v1/kyc/**, /api/v1/addresses/**
        - id: catalog-service
          uri: http://localhost:8082
          predicates:
            - Path=/api/v1/categories/**, /api/v1/services/**, /api/v1/reviews/**
        - id: booking-service
          uri: http://localhost:8083
          predicates:
            - Path=/api/v1/bookings/**
        - id: payout-service
          uri: http://localhost:8084
          predicates:
            - Path=/api/v1/payouts/**, /api/v1/payments/**
        - id: logistics-service
          uri: http://localhost:8085
          predicates:
            - Path=/api/v1/vehicles/**, /api/v1/tracking/**
        - id: dispute-service
          uri: http://localhost:8086
          predicates:
            - Path=/api/v1/disputes/**, /api/v1/discussions/**
        - id: notification-service
          uri: http://localhost:8087
          predicates:
            - Path=/api/v1/notifications/**, /api/v1/admin/analytics/**
        - id: ai-service
          uri: http://localhost:8000
          predicates:
            - Path=/api/v1/ai/**
```

---

## Step 2: Extract `auth-identity-service` (Port 8081)

### 2.1 Code Migration Checklist
1. Move the following Java files into `services/auth-identity-service`:
   - `entity/User.java`, `entity/Role.java`, `entity/ProviderProfile.java`, `entity/KycDocument.java`, `entity/Address.java`
   - `repository/UserRepository.java`, `repository/ProviderProfileRepository.java`, `repository/KycDocumentRepository.java`, `repository/AddressRepository.java`
   - `controller/AuthController.java`, `controller/KycController.java`, `controller/AdminKycController.java`, `controller/AddressController.java`
   - `service/impl/AuthServiceImpl.java`, `service/impl/KycServiceImpl.java`, `service/impl/AdminKycServiceImpl.java`, `service/impl/AddressServiceImpl.java`
2. Update `application.properties` to connect to `jdbc:postgresql://localhost:5432/taaskr_auth_db`.

### 2.2 Execution Command
```bash
cd services/auth-identity-service
mvn spring-boot:run
```

---

## Step 3: Extract `catalog-trade-service` (Port 8082)

### 3.1 Code Migration Checklist
1. Move the following Java files into `services/catalog-trade-service`:
   - `entity/ServiceCategory.java`, `entity/Service.java`, `entity/Review.java`
   - `controller/PublicCatalogController.java`, `controller/AdminCatalogController.java`, `controller/ProviderCategoryController.java`, `controller/ReviewController.java`
   - `service/impl/PublicCatalogServiceImpl.java`, `service/impl/AdminCatalogServiceImpl.java`, `service/impl/ProviderCategoryServiceImpl.java`, `service/impl/ReviewServiceImpl.java`
2. Refactor Spring Data JPA annotations to Spring Data MongoDB annotations (`@Document(collection = "service_categories")`).
3. Connect to MongoDB `mongodb://localhost:27017/taaskr_catalog_db`.

---

## Step 4: Stand Up Python FastAPI AI Engine (`ai-intelligence-service` :8000)

### 4.1 Create Project Directory & Virtualenv
```bash
mkdir -p services/ai-intelligence-service
cd services/ai-intelligence-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 4.2 Install Dependencies (`requirements.txt`)
```ini
fastapi==0.110.0
uvicorn==0.28.0
google-generativeai==0.4.1
lightgbm==4.3.0
scikit-image==0.22.0
opencv-python-headless==4.9.0.80
pydantic==2.6.4
numpy==1.26.4
```

### 4.3 `main.py` Entry Point
```python
from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn

app = FastAPI(title="Taaskr AI Intelligence Service")

@app.get("/health")
def health():
    return {"status": "UP", "service": "ai-intelligence-service"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
```

---

## Step 5: Extract `payout-wallet-service` (Port 8084)

### 5.1 Code Migration Checklist
1. Move financial ledger classes into `services/payout-wallet-service`:
   - `entity/WalletTransaction.java`, `entity/Payout.java`
   - `repository/WalletTransactionRepository.java`, `repository/PayoutRepository.java`
   - `controller/PayoutController.java`, `controller/AdminPayoutController.java`
   - `service/impl/PayoutServiceImpl.java`
2. Add Apache Kafka Consumer for booking completion events:
   ```java
   @KafkaListener(topics = "taaskr.booking.completed", groupId = "wallet-group")
   public void handleBookingCompleted(BookingCompletedEvent event) {
       payoutService.creditBookingEarnings(event.getBookingId(), event.getFinalAmount(), event.getProviderId());
   }
   ```

---

## Step 6: Extract `booking-dispatch-service` (Port 8083)

### 6.1 Code Migration Checklist
1. Move core booking lifecycle classes:
   - `entity/Booking.java`, `entity/AvailabilitySlot.java`
   - `repository/BookingRepository.java`, `repository/AvailabilitySlotRepository.java`
   - `controller/BookingController.java`, `controller/AdminBookingController.java`
   - `service/impl/BookingServiceImpl.java`, `service/impl/AdminBookingServiceImpl.java`
2. Implement Kafka Event Producer:
   ```java
   kafkaTemplate.send("taaskr.booking.created", new BookingCreatedEvent(savedBooking.getId(), customerEmail));
   ```

---

## Step 7: Extract `logistics-vehicle-service` (Port 8085)

### 7.1 Code Migration Checklist
1. Move vehicle and telemetry classes:
   - `entity/Vehicle.java`
   - `repository/VehicleRepository.java`
   - `controller/VehicleController.java`, `controller/TrackingController.java`
   - `service/impl/VehicleServiceImpl.java`
2. Add Redis GEO Template for location pings:
   ```java
   redisTemplate.opsForGeo().add(
       "geo:providers:" + categoryCode,
       new Point(longitude, latitude),
       "provider:" + providerId
   );
   ```

---

## Step 8: Extract `notification-telemetry-service` (Port 8087)

### 8.1 Code Migration Checklist
1. Move notification and analytics classes:
   - `controller/NotificationController.java`, `controller/AdminAnalyticsController.java`
   - `service/impl/NotificationServiceImpl.java`, `service/impl/AdminAnalyticsServiceImpl.java`, `service/impl/EmailServiceImpl.java`, `service/impl/SmsServiceImpl.java`
2. Wire Kafka Event Consumer for all system events (`booking.created`, `payout.processed`, `dispute.created`).

---

## Step 9: Final Cutover & Verification Commands

### 9.1 Build All Microservices
```bash
# Build Java Microservices
mvn clean package -DskipTests

# Run Docker Compose Production Environment
docker-compose -f docker-compose.prod.yml up --build -d
```

### 9.2 Verification Commands
1. **API Gateway Health**: `curl http://localhost:8080/actuator/health`
2. **Auth Service Registration**: `curl -X POST http://localhost:8080/api/v1/auth/register -H "Content-Type: application/json" -d '{"firstName":"John","lastName":"Doe","email":"test@taaskr.com","password":"Password123!","phoneNumber":"9988776655"}'`
3. **AI Service Health**: `curl http://localhost:8080/api/v1/ai/health`
