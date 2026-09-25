package com.taaskr.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Order(1)
public class DatabaseSchemaMigrationRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseSchemaMigrationRunner.class);
    private final JdbcTemplate jdbcTemplate;

    public DatabaseSchemaMigrationRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        remediateNullVersionColumns();
        migrateVehiclesProviderIdConstraint();
        harmonizeStandardCategories();
        ensureObservabilityTablesAndSeed();
    }

    private void ensureObservabilityTablesAndSeed() {
        try {
            log.info("[DB Migration] Verifying Observability Platform database schema and configuration seed...");
            
            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS monitored_endpoints (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(120) NOT NULL,
                    http_method VARCHAR(10) NOT NULL DEFAULT 'GET',
                    url_path VARCHAR(255) NOT NULL,
                    enabled BOOLEAN NOT NULL DEFAULT TRUE,
                    timeout_ms INT NOT NULL DEFAULT 5000,
                    failure_threshold INT NOT NULL DEFAULT 3,
                    recovery_threshold INT NOT NULL DEFAULT 2,
                    latency_threshold_ms INT NOT NULL DEFAULT 1000,
                    current_state VARCHAR(20) NOT NULL DEFAULT 'UNKNOWN',
                    consecutive_failures INT DEFAULT 0,
                    consecutive_successes INT DEFAULT 0,
                    last_check_time DATETIME NULL,
                    last_success_time DATETIME NULL,
                    last_failure_time DATETIME NULL,
                    last_status_code INT NULL,
                    last_response_time_ms BIGINT NULL,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                );
            """);

            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS health_check_results (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    endpoint_id BIGINT NOT NULL,
                    status_code INT NULL,
                    response_time_ms BIGINT NOT NULL,
                    success BOOLEAN NOT NULL,
                    error_message VARCHAR(500) NULL,
                    checked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                );
            """);

            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS monitoring_incidents (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    endpoint_id BIGINT NOT NULL,
                    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
                    severity VARCHAR(20) NOT NULL DEFAULT 'HIGH',
                    started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    last_observed_failure DATETIME NULL,
                    resolved_at DATETIME NULL,
                    current_status_code INT NULL,
                    failure_reason VARCHAR(500) NULL,
                    failed_check_count INT DEFAULT 1,
                    escalation_level INT DEFAULT 1,
                    acknowledged_by VARCHAR(100) NULL,
                    acknowledged_at DATETIME NULL
                );
            """);

            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS monitoring_alerts (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    incident_id BIGINT NULL,
                    endpoint_id BIGINT NOT NULL,
                    alert_type VARCHAR(50) NOT NULL,
                    severity VARCHAR(20) NOT NULL DEFAULT 'HIGH',
                    message VARCHAR(500) NOT NULL,
                    state VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
                    escalation_level INT DEFAULT 1,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    resolved_at DATETIME NULL
                );
            """);

            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS alert_escalations (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    incident_id BIGINT NOT NULL,
                    escalation_level INT NOT NULL DEFAULT 1,
                    delay_minutes INT NOT NULL DEFAULT 5,
                    channel_type VARCHAR(20) NOT NULL DEFAULT 'EMAIL',
                    recipient VARCHAR(255) NULL,
                    status VARCHAR(20) NOT NULL DEFAULT 'SENT',
                    triggered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                );
            """);

            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS monitoring_configurations (
                    id BIGINT PRIMARY KEY,
                    monitoring_enabled BOOLEAN NOT NULL DEFAULT TRUE,
                    check_interval_seconds INT NOT NULL DEFAULT 30,
                    default_timeout_ms INT NOT NULL DEFAULT 5000,
                    default_failure_threshold INT NOT NULL DEFAULT 3,
                    default_recovery_threshold INT NOT NULL DEFAULT 2,
                    default_latency_threshold_ms INT NOT NULL DEFAULT 1000,
                    health_check_retention_days INT NOT NULL DEFAULT 30,
                    incident_retention_days INT NOT NULL DEFAULT 90,
                    alert_retention_days INT NOT NULL DEFAULT 90,
                    email_notifications_enabled BOOLEAN NOT NULL DEFAULT FALSE,
                    admin_notification_email VARCHAR(255) NULL DEFAULT 'admin@taaskr.com',
                    slack_webhook_url VARCHAR(500) NULL,
                    teams_webhook_url VARCHAR(500) NULL
                );
            """);

            // Seed default config
            jdbcTemplate.execute("""
                INSERT INTO monitoring_configurations (
                    id, monitoring_enabled, check_interval_seconds, default_timeout_ms,
                    default_failure_threshold, default_recovery_threshold, default_latency_threshold_ms,
                    health_check_retention_days, incident_retention_days, alert_retention_days,
                    email_notifications_enabled, admin_notification_email
                )
                SELECT 1, true, 30, 5000, 3, 2, 1000, 30, 90, 90, false, 'admin@taaskr.com' FROM DUAL
                WHERE NOT EXISTS (SELECT 1 FROM monitoring_configurations WHERE id = 1);
            """);

            log.info("[DB Migration] Observability schema tables verified successfully.");
        } catch (Exception e) {
            log.warn("[DB Migration] Notice while ensuring observability tables: {}", e.getMessage());
        }
    }

    private void remediateNullVersionColumns() {
        try {
            log.info("[DB Migration] Remediating NULL version columns across entities to preserve optimistic locking integrity...");
            String[] tables = {"provider_profiles", "service_partners", "bookings", "availability_slots"};
            for (String table : tables) {
                try {
                    int updated = jdbcTemplate.update("UPDATE " + table + " SET version = 0 WHERE version IS NULL");
                    if (updated > 0) {
                        log.info("[DB Migration] Fixed {} rows with NULL version in table '{}'", updated, table);
                    }
                } catch (Exception e) {
                    log.warn("[DB Migration] Notice while remediating null version on table {}: {}", table, e.getMessage());
                }
            }
        } catch (Exception e) {
            log.warn("[DB Migration] Error during version column remediation: {}", e.getMessage());
        }
    }

    private void harmonizeStandardCategories() {
        try {
            log.info("[DB Migration] Starting category harmonization to align database with standard catalog categories...");

            record StandardCategory(String name, String description) {}
            List<StandardCategory> standardCategories = List.of(
                    new StandardCategory("Appliances & Electrical", "Home appliance repair, AC maintenance, geyser servicing, and electrical wiring"),
                    new StandardCategory("Plumbing & Cleaning", "Home plumbing repairs, pipe leakage fixes, drain cleaning, and deep sanitization services"),
                    new StandardCategory("Pest Control", "Eco-friendly, odorless pest, cockroach, termite, and bed bug eradication treatments"),
                    new StandardCategory("Salon & Massage / Wellness", "Professional doorstep grooming, beauty, hair styling, and relaxing massage therapies for men and women"),
                    new StandardCategory("Civil & Property Maintenance", "Carpentry, drilling, wall painting, masonry, waterproofing, and renovation services"),
                    new StandardCategory("Tech & Home Automation", "Laptop diagnostics, Wi-Fi router setup, smart TV mounting, and printer repair"),
                    new StandardCategory("Vehicle & Auto Care", "Doorstep car/bike foam wash, detailing, and emergency battery jump start assistance"),
                    new StandardCategory("Home Help & Errand Services", "On-demand cooks, domestic helpers, laundry, urgent medicine, and grocery pickups"),
                    new StandardCategory("Security Services", "Home security CCTV installation, smart locks, and verified security guard protection"),
                    new StandardCategory("Diagnostic & Healthcare Services", "Doorstep blood tests, full body checkups, compounder nursing, and elderly care assistance"),
                    new StandardCategory("Logistics", "Intra-city on-demand goods transport and vehicle with driver service.")
            );

            for (StandardCategory sc : standardCategories) {
                try {
                    Integer count = jdbcTemplate.queryForObject(
                            "SELECT COUNT(*) FROM service_categories WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))",
                            Integer.class,
                            sc.name()
                    );
                    if (count == null || count == 0) {
                        jdbcTemplate.update(
                                "INSERT INTO service_categories (name, description, active, created_at) VALUES (?, ?, true, NOW())",
                                sc.name(), sc.description()
                        );
                        log.info("[DB Migration] Created standard category: {}", sc.name());
                    } else {
                        jdbcTemplate.update(
                                "UPDATE service_categories SET active = true WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))",
                                sc.name()
                        );
                    }
                } catch (Exception e) {
                    log.warn("[DB Migration] Notice while ensuring standard category {}: {}", sc.name(), e.getMessage());
                }
            }

            record LegacyMapping(String legacyName, String targetStandardName) {}
            List<LegacyMapping> legacyMappings = List.of(
                    new LegacyMapping("Appliances", "Appliances & Electrical"),
                    new LegacyMapping("Electrical", "Appliances & Electrical"),
                    new LegacyMapping("Plumbing", "Plumbing & Cleaning"),
                    new LegacyMapping("Cleaning", "Plumbing & Cleaning"),
                    new LegacyMapping("Diagnostic Services", "Diagnostic & Healthcare Services"),
                    new LegacyMapping("Healthcare Services", "Diagnostic & Healthcare Services"),
                    new LegacyMapping("Men's Salon & Massage", "Salon & Massage / Wellness"),
                    new LegacyMapping("Salon & Massage", "Salon & Massage / Wellness"),
                    new LegacyMapping("Salon", "Salon & Massage / Wellness"),
                    new LegacyMapping("On-Demand Vehicle", "Logistics")
            );

            for (LegacyMapping mapping : legacyMappings) {
                try {
                    List<Long> legacyIds = jdbcTemplate.query(
                            "SELECT id FROM service_categories WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))",
                            (rs, rowNum) -> rs.getLong("id"),
                            mapping.legacyName()
                    );

                    List<Long> targetIds = jdbcTemplate.query(
                            "SELECT id FROM service_categories WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))",
                            (rs, rowNum) -> rs.getLong("id"),
                            mapping.targetStandardName()
                    );

                    if (!targetIds.isEmpty()) {
                        Long targetId = targetIds.get(0);
                        for (Long legacyId : legacyIds) {
                            if (legacyId.equals(targetId)) continue;

                            // 1. Move services
                            int updatedServices = jdbcTemplate.update(
                                    "UPDATE services SET category_id = ? WHERE category_id = ?",
                                    targetId, legacyId
                            );
                            if (updatedServices > 0) {
                                log.info("[DB Migration] Re-assigned {} services from legacy '{}' to '{}'", updatedServices, mapping.legacyName(), mapping.targetStandardName());
                            }

                            // 2. Move provider_category
                            try {
                                jdbcTemplate.update(
                                        "DELETE FROM provider_category WHERE category_id = ? AND provider_id IN (SELECT provider_id FROM (SELECT provider_id FROM provider_category WHERE category_id = ?) AS tmp)",
                                        legacyId, targetId
                                );
                                int updatedProviderCats = jdbcTemplate.update(
                                        "UPDATE provider_category SET category_id = ? WHERE category_id = ?",
                                        targetId, legacyId
                                );
                                if (updatedProviderCats > 0) {
                                    log.info("[DB Migration] Re-assigned {} provider categories from legacy '{}' to '{}'", updatedProviderCats, mapping.legacyName(), mapping.targetStandardName());
                                }
                            } catch (Exception pEx) {
                                log.warn("[DB Migration] Notice remapping provider categories for {}: {}", mapping.legacyName(), pEx.getMessage());
                            }

                            // 3. Deactivate or delete legacy category
                            try {
                                jdbcTemplate.update("DELETE FROM service_categories WHERE id = ?", legacyId);
                                log.info("[DB Migration] Deleted legacy category '{}' (ID: {})", mapping.legacyName(), legacyId);
                            } catch (Exception delEx) {
                                jdbcTemplate.update("UPDATE service_categories SET active = false WHERE id = ?", legacyId);
                                log.info("[DB Migration] Deactivated legacy category '{}' (ID: {})", mapping.legacyName(), legacyId);
                            }
                        }
                    }
                } catch (Exception mapEx) {
                    log.warn("[DB Migration] Notice while migrating legacy category {}: {}", mapping.legacyName(), mapEx.getMessage());
                }
            }

            log.info("[DB Migration] Standard category harmonization completed successfully.");
        } catch (Exception e) {
            log.warn("[DB Migration] Error during category harmonization: {}", e.getMessage());
        }
    }

    private void migrateVehiclesProviderIdConstraint() {
        try {
            log.info("[DB Migration] Starting migration for vehicles table to remove unique constraint on provider_id...");

            // Step 1: Add a non-unique regular index on provider_id (if not already present)
            try {
                jdbcTemplate.execute("ALTER TABLE vehicles ADD INDEX idx_vehicles_provider_id (provider_id)");
                log.info("[DB Migration] Added non-unique index 'idx_vehicles_provider_id' on vehicles(provider_id).");
            } catch (Exception e) {
                log.debug("[DB Migration] Non-unique index may already exist: {}", e.getMessage());
            }

            // Step 2: Drop any foreign keys on provider_id temporarily if MySQL prevents dropping the unique index
            try {
                List<String> foreignKeys = jdbcTemplate.query(
                        "SELECT DISTINCT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE " +
                        "WHERE TABLE_SCHEMA = DATABASE() " +
                        "  AND LOWER(TABLE_NAME) = 'vehicles' " +
                        "  AND LOWER(COLUMN_NAME) = 'provider_id' " +
                        "  AND REFERENCED_TABLE_NAME IS NOT NULL",
                        (rs, rowNum) -> rs.getString("CONSTRAINT_NAME")
                );

                for (String fk : foreignKeys) {
                    try {
                        log.info("[DB Migration] Temporarily dropping foreign key '{}'...", fk);
                        jdbcTemplate.execute("ALTER TABLE vehicles DROP FOREIGN KEY `" + fk + "`");
                    } catch (Exception ex) {
                        log.warn("[DB Migration] Could not drop foreign key {}: {}", fk, ex.getMessage());
                    }
                }
            } catch (Exception e) {
                log.debug("[DB Migration] Error querying foreign keys: {}", e.getMessage());
            }

            // Step 3: Find and drop all UNIQUE indexes on provider_id
            try {
                List<String> uniqueIndexes = jdbcTemplate.query(
                        "SELECT DISTINCT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS " +
                        "WHERE TABLE_SCHEMA = DATABASE() " +
                        "  AND LOWER(TABLE_NAME) = 'vehicles' " +
                        "  AND LOWER(COLUMN_NAME) = 'provider_id' " +
                        "  AND NON_UNIQUE = 0 " +
                        "  AND INDEX_NAME != 'PRIMARY'",
                        (rs, rowNum) -> rs.getString("INDEX_NAME")
                );

                for (String indexName : uniqueIndexes) {
                    try {
                        log.info("[DB Migration] Dropping unique index '{}' from vehicles table...", indexName);
                        jdbcTemplate.execute("ALTER TABLE vehicles DROP INDEX `" + indexName + "`");
                        log.info("[DB Migration] Successfully dropped unique index '{}'.", indexName);
                    } catch (Exception ex) {
                        log.warn("[DB Migration] Could not drop unique index {}: {}", indexName, ex.getMessage());
                    }
                }
            } catch (Exception e) {
                log.debug("[DB Migration] Error querying unique indexes: {}", e.getMessage());
            }

            // Step 4: Explicit fallback for known constraint names
            String[] knownConstraints = {"UKhm3a8569alewmamv6xw78o19q", "UK_vehicles_provider", "vehicles_provider_id_unique"};
            for (String constraint : knownConstraints) {
                try {
                    jdbcTemplate.execute("ALTER TABLE vehicles DROP INDEX `" + constraint + "`");
                    log.info("[DB Migration] Explicitly dropped constraint '{}'.", constraint);
                } catch (Exception ignored) {}
                try {
                    jdbcTemplate.execute("ALTER TABLE vehicles DROP CONSTRAINT `" + constraint + "`");
                    log.info("[DB Migration] Explicitly dropped constraint definition '{}'.", constraint);
                } catch (Exception ignored) {}
            }

            // Step 5: Re-add the Foreign Key constraint pointing to provider_profiles(id)
            try {
                jdbcTemplate.execute("ALTER TABLE vehicles ADD CONSTRAINT fk_vehicles_provider_profile " +
                        "FOREIGN KEY (provider_id) REFERENCES provider_profiles(id)");
                log.info("[DB Migration] Re-added foreign key constraint 'fk_vehicles_provider_profile'.");
            } catch (Exception e) {
                log.debug("[DB Migration] Foreign key already exists or added by JPA: {}", e.getMessage());
            }

            log.info("[DB Migration] Completed vehicles table migration. Providers can now have multiple vehicles.");

        } catch (Exception e) {
            log.warn("[DB Migration] Schema migration notice: {}", e.getMessage());
        }
    }
}
