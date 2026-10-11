package com.taskflow.dto.request;

/**
 * Assign or unassign a task. A {@code null} {@code userId} clears the assignee.
 */
public record AssignTaskRequest(Long userId) {
}
