package com.taskflow.dto.response;

import java.time.Instant;

public record CommentResponse(
        Long id,
        String content,
        UserSummaryResponse author,
        Long taskId,
        Instant createdAt) {
}
