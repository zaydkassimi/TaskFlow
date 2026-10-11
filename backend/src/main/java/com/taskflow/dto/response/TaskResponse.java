package com.taskflow.dto.response;

import com.taskflow.entity.enums.TaskPriority;
import com.taskflow.entity.enums.TaskStatus;
import java.time.Instant;
import java.time.LocalDate;

/**
 * Full task representation returned by detail/creation/update endpoints.
 */
public record TaskResponse(
        Long id,
        String title,
        String description,
        TaskStatus status,
        TaskPriority priority,
        Long projectId,
        String projectName,
        UserSummaryResponse assignedTo,
        UserSummaryResponse createdBy,
        LocalDate dueDate,
        boolean overdue,
        Instant createdAt,
        Instant updatedAt) {
}
