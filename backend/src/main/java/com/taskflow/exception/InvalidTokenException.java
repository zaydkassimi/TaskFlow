package com.taskflow.exception;

/**
 * Thrown when an access or refresh token is missing, malformed, expired or revoked.
 * Mapped to HTTP 401.
 */
public class InvalidTokenException extends RuntimeException {

    public InvalidTokenException(String message) {
        super(message);
    }
}
