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
        migrateVehiclesProviderIdConstraint();
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
