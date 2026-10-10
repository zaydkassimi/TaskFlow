package com.taskflow.dto.response;

/**
 * Result of a successful authentication. The refresh token is delivered separately as an
 * httpOnly cookie and is intentionally never part of this payload.
 */
public record AuthResponse(
        String accessToken,
        String tokenType,
        long expiresInSeconds,
        UserResponse user) {

    public static AuthResponse of(String accessToken, long expiresInSeconds, UserResponse user) {
        return new AuthResponse(accessToken, "Bearer", expiresInSeconds, user);
    }
}
