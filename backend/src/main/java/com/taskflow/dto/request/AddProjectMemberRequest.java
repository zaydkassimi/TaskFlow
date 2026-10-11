package com.taskflow.dto.request;

import jakarta.validation.constraints.NotNull;

public record AddProjectMemberRequest(

        @NotNull(message = "userId is required")
        Long userId) {
}
