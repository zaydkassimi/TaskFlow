package com.taskflow.exception;

/**
 * Thrown when an authenticated user attempts an action they are not permitted to perform.
 * Mapped to HTTP 403.
 */
public class UnauthorizedOperationException extends RuntimeException {

    public UnauthorizedOperationException(String message) {
        super(message);
    }
}
