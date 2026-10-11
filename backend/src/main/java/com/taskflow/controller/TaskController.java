package com.taskflow.controller;

import com.taskflow.dto.request.AssignTaskRequest;
import com.taskflow.dto.request.UpdateTaskRequest;
import com.taskflow.dto.request.UpdateTaskStatusRequest;
import com.taskflow.dto.response.PageResponse;
import com.taskflow.dto.response.TaskResponse;
import com.taskflow.dto.response.TaskSummaryResponse;
import com.taskflow.entity.enums.TaskStatus;
import com.taskflow.security.SecurityUtils;
import com.taskflow.service.TaskService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Operations on individual tasks plus the current user's assigned tasks.
 */
@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private static final int MAX_PAGE_SIZE = 100;

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping("/me")
    public PageResponse<TaskSummaryResponse> myTasks(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) TaskStatus status) {
        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.max(1, Math.min(size, MAX_PAGE_SIZE)),
                Sort.by(Sort.Direction.ASC, "dueDate"));
        return taskService.listAssignedToMe(SecurityUtils.currentPrincipal(), pageable, status);
    }

    @GetMapping("/{id}")
    public TaskResponse get(@PathVariable Long id) {
        return taskService.get(id, SecurityUtils.currentPrincipal());
    }

    @PutMapping("/{id}")
    public TaskResponse update(@PathVariable Long id, @Valid @RequestBody UpdateTaskRequest request) {
        return taskService.update(id, request, SecurityUtils.currentPrincipal());
    }

    @PatchMapping("/{id}/status")
    public TaskResponse changeStatus(@PathVariable Long id,
            @Valid @RequestBody UpdateTaskStatusRequest request) {
        return taskService.changeStatus(id, request.status(), SecurityUtils.currentPrincipal());
    }

    @PatchMapping("/{id}/assign")
    public TaskResponse assign(@PathVariable Long id, @RequestBody AssignTaskRequest request) {
        return taskService.assign(id, request.userId(), SecurityUtils.currentPrincipal());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        taskService.delete(id, SecurityUtils.currentPrincipal());
        return ResponseEntity.noContent().build();
    }
}
