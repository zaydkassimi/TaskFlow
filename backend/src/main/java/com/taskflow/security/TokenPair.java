package com.taskflow.security;

/**
 * A freshly minted access token plus the raw refresh token that must be delivered to the
 * client as an httpOnly cookie.
 */
public record TokenPair(String accessToken, long accessTtlSeconds, String refreshToken) {
}
