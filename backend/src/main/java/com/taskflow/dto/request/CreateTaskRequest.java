package com.taskflow.dto.request;

import com.taskflow.entity.enums.TaskPriority;
import com.taskflow.entity.enums.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record CreateTaskRequest(

        @NotBlank(message = "Task title is required")
        @Size(max = 200, message = "Task title must be at most 200 characters")
        String title,

        @Size(max = 4000, message = "Description must be at most 4000 characters")
        String description,

        TaskStatus status,

        TaskPriority priority,

        Long assignedToId,

        LocalDate dueDate) {
}
