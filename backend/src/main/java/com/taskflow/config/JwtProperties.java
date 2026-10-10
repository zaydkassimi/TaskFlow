package com.taskflow.config;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * JWT signing and lifetime settings, bound from the {@code app.jwt.*} configuration group.
 */
@ConfigurationProperties(prefix = "app.jwt")
public record JwtProperties(
        String secret,
        long accessTtlSeconds,
        long refreshTtlSeconds) {

    public Duration accessTtl() {
        return Duration.ofSeconds(accessTtlSeconds);
    }

    public Duration refreshTtl() {
        return Duration.ofSeconds(refreshTtlSeconds);
    }
}
