package com.taskflow.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateCommentRequest(

        @NotBlank(message = "Comment content is required")
        @Size(max = 4000, message = "Comment must be at most 4000 characters")
        String content) {
}
