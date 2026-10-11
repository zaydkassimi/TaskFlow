package com.taskflow.dto.response;

import com.taskflow.entity.enums.Role;

/**
 * Lightweight user representation embedded inside project/task payloads.
 */
public record UserSummaryResponse(
        Long id,
        String firstName,
        String lastName,
        String email,
        Role role) {
}
