package com.taskflow.service;

import com.taskflow.dto.response.AuthResponse;
import com.taskflow.dto.response.UserResponse;

/**
 * Internal result of an authentication flow: the public {@link AuthResponse} plus the raw
 * refresh token that the controller writes to an httpOnly cookie.
 */
public record AuthResult(AuthResponse response, String refreshToken) {

    public static AuthResult of(AuthResponse response, String refreshToken) {
        return new AuthResult(response, refreshToken);
    }

    public UserResponse user() {
        return response.user();
    }
}
