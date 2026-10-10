package com.taskflow.security;

import com.taskflow.exception.InvalidTokenException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Convenience accessors for the authenticated {@link UserPrincipal}.
 */
public final class SecurityUtils {

    private SecurityUtils() {
    }

    public static UserPrincipal currentPrincipal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            throw new InvalidTokenException("No authenticated user in security context");
        }
        return principal;
    }

    public static Long currentUserId() {
        return currentPrincipal().id();
    }
}
