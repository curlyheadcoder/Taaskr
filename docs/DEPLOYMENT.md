# Deploying Taaskr

Taaskr has three isolated environments:

| Environment | Spring profile | Database | Demo accounts |
| --- | --- | --- | --- |
| Local development | `local` (default) | local MySQL `taaskr_db_local` | enabled |
| Tests | `test` | in-memory H2 | disabled |
| Production | `prod` | Aiven MySQL | disabled |

## Before pushing to GitHub

1. Create a private GitHub repository and push the project.
2. Confirm that `application-local.properties` is not included in the commit.
3. Rotate any database password and Razorpay secret that was previously stored in the old local configuration.
4. Do not put passwords, JWT secrets, or Razorpay secret keys in frontend environment variables.

## Deploy the backend on Render

1. Create a new **Web Service** from the GitHub repository.
2. Set the root directory to `taaskr-backend`.
3. Choose the Docker runtime. The repository's multi-stage `Dockerfile` builds the JAR during deployment.
4. Add these environment variables:

```text
SPRING_PROFILES_ACTIVE=prod
DB_HOST=<Aiven host>
DB_PORT=<Aiven port>
DB_NAME=<Aiven database name>
DB_USERNAME=<Aiven username>
DB_PASSWORD=<Aiven password>
JWT_SECRET=<long random secret>
RAZORPAY_KEY_ID=<production Razorpay key id>
RAZORPAY_KEY_SECRET=<production Razorpay secret>
CORS_ALLOWED_ORIGINS=<set after the Vercel deployment>
ADMIN_EMAIL=<first administrator email>
ADMIN_PASSWORD=<long unique administrator password>
ADMIN_PHONE=<10-digit administrator phone>
ADMIN_NAME=<optional administrator name>
ADMIN_CITY=<optional city>
ADMIN_PINCODE=<optional pincode>
```

5. Deploy. The first deployment creates the administrator from the `ADMIN_*` values only if that email does not already exist. Check `https://<render-service-domain>/api/health`; it must return `status: UP`.

## Deploy the frontend on Vercel

1. Import the same GitHub repository into Vercel.
2. Set the root directory to `taaskr-frontend`.
3. Set the build command to `npm run build` and the output directory to `dist`.
4. Add the production environment variable:

```text
VITE_API_BASE_URL=https://<render-service-domain>
```

5. Deploy and copy the final Vercel domain.

## Complete CORS configuration

In Render, change `CORS_ALLOWED_ORIGINS` to the final Vercel domain, for example:

```text
CORS_ALLOWED_ORIGINS=https://taaskr.vercel.app
```

Redeploy Render after saving the value. The backend accepts requests only from the configured origins.

## Final checks

1. Open the Vercel URL.
2. Register a new account.
3. Sign in and fetch the service list.
4. Confirm the browser console has no CORS or network errors.
