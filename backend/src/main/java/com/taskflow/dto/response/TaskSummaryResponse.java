package com.taskflow.dto.response;

import com.taskflow.entity.enums.TaskPriority;
import com.taskflow.entity.enums.TaskStatus;
import java.time.Instant;
import java.time.LocalDate;

/**
 * Lean task representation used in list/board views.
 */
public record TaskSummaryResponse(
        Long id,
        String title,
        TaskStatus status,
        TaskPriority priority,
        Long projectId,
        String projectName,
        UserSummaryResponse assignedTo,
        LocalDate dueDate,
        boolean overdue,
        Instant createdAt,
        Instant updatedAt) {
}
