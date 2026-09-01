# Taaskr

Taaskr is a home-services booking platform built with Spring Boot, React, MySQL, and JWT-based authentication, featuring role-based dashboards for users, providers, and admins.

## Run locally

Requirements: Java 17+, Node.js, npm, and MySQL running on `localhost:3306`.

Before the first backend run, edit `taaskr-backend/src/main/resources/application-local.properties` using `application-local.example.properties` as the safe template. Fill in your local MySQL password, JWT secret, and Razorpay test keys. The local file is ignored by Git and must never be committed.

Open two PowerShell windows:

```powershell
cd taaskr-backend
.\mvnw.cmd spring-boot:run
```

```powershell
cd taaskr-frontend
npm install
npm run dev
```

Then open `http://localhost:5173`. During development, Vite proxies `/api` requests to the backend at `http://localhost:8081`.

See [the deployment guide](docs/DEPLOYMENT.md) before publishing the application.
