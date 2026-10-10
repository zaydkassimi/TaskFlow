package com.taskflow.dto.response;

import com.taskflow.entity.enums.Role;
import java.time.Instant;

public record UserResponse(
        Long id,
        String firstName,
        String lastName,
        String email,
        Role role,
        boolean enabled,
        Instant createdAt,
        Instant updatedAt) {
}
