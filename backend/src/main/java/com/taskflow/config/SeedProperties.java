package com.taskflow.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Development seed accounts. Passwords here are placeholders for local use only.
 */
@ConfigurationProperties(prefix = "app.seed")
public record SeedProperties(
        boolean enabled,
        String adminEmail,
        String adminPassword,
        String managerEmail,
        String managerPassword,
        String memberEmail,
        String memberPassword) {
}
