package com.taskflow.dto.response;

import com.taskflow.entity.enums.ActivityType;
import java.time.Instant;

public record ActivityResponse(
        Long id,
        ActivityType type,
        String description,
        UserSummaryResponse user,
        Long projectId,
        Long taskId,
        Instant createdAt) {
}
