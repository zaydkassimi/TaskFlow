package com.taskflow.dto.request;

import jakarta.validation.constraints.NotNull;

public record UpdateStatusRequest(

        @NotNull(message = "Enabled flag is required")
        Boolean enabled) {
}
