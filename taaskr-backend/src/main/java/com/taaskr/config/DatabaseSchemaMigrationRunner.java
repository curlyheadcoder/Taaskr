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
        dropUniqueConstraintOnVehiclesProviderId();
    }

    private void dropUniqueConstraintOnVehiclesProviderId() {
        try {
            // 1. MySQL: Search and drop any unique index on vehicles.provider_id
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
                    log.info("Dropping legacy unique index '{}' from vehicles table to support multi-vehicle fleets...", indexName);
                    jdbcTemplate.execute("ALTER TABLE vehicles DROP INDEX `" + indexName + "`");
                    log.info("Successfully dropped unique index '{}' from vehicles table.", indexName);
                } catch (Exception e) {
                    log.warn("Could not drop index {}: {}", indexName, e.getMessage());
                }
            }

            // 2. Explicit fallback for known constraint name UKhm3a8569alewmamv6xw78o19q
            try {
                jdbcTemplate.execute("ALTER TABLE vehicles DROP INDEX `UKhm3a8569alewmamv6xw78o19q`");
                log.info("Explicitly dropped constraint UKhm3a8569alewmamv6xw78o19q on vehicles.");
            } catch (Exception ignored) {
                // Already dropped or does not exist
            }

        } catch (Exception e) {
            log.debug("Schema migration notice (expected on H2 or non-MySQL databases): {}", e.getMessage());
        }
    }
}
