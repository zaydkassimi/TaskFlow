package com.taskflow.controller;

import com.taskflow.dto.request.CreateCommentRequest;
import com.taskflow.dto.response.CommentResponse;
import com.taskflow.security.SecurityUtils;
import com.taskflow.service.CommentService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Comment listing and creation scoped to a task.
 */
@RestController
@RequestMapping("/api/tasks/{taskId}/comments")
public class TaskCommentController {

    private final CommentService commentService;

    public TaskCommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @GetMapping
    public List<CommentResponse> list(@PathVariable Long taskId) {
        return commentService.list(taskId, SecurityUtils.currentPrincipal());
    }

    @PostMapping
    public ResponseEntity<CommentResponse> create(@PathVariable Long taskId,
            @Valid @RequestBody CreateCommentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(commentService.create(taskId, request, SecurityUtils.currentPrincipal()));
    }
}
