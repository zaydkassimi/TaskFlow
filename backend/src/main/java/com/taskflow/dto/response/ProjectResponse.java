package com.taskflow.dto.response;

import com.taskflow.entity.enums.ProjectStatus;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/**
 * Full project representation including the owner and current members.
 */
public record ProjectResponse(
        Long id,
        String name,
        String description,
        ProjectStatus status,
        LocalDate startDate,
        LocalDate dueDate,
        UserSummaryResponse createdBy,
        List<UserSummaryResponse> members,
        int memberCount,
        Instant createdAt,
        Instant updatedAt) {
}
