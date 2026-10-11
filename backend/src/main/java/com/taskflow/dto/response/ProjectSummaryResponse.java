package com.taskflow.dto.response;

import com.taskflow.entity.enums.ProjectStatus;
import java.time.Instant;
import java.time.LocalDate;

/**
 * Lean project representation for list endpoints.
 */
public record ProjectSummaryResponse(
        Long id,
        String name,
        ProjectStatus status,
        LocalDate startDate,
        LocalDate dueDate,
        Instant createdAt,
        Instant updatedAt) {
}
