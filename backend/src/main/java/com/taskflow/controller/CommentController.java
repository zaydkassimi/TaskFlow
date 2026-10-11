package com.taskflow.controller;

import com.taskflow.dto.request.UpdateCommentRequest;
import com.taskflow.dto.response.CommentResponse;
import com.taskflow.security.SecurityUtils;
import com.taskflow.service.CommentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Operations on individual comments.
 */
@RestController
@RequestMapping("/api/comments")
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @PutMapping("/{id}")
    public CommentResponse update(@PathVariable Long id, @Valid @RequestBody UpdateCommentRequest request) {
        return commentService.update(id, request, SecurityUtils.currentPrincipal());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        commentService.delete(id, SecurityUtils.currentPrincipal());
        return ResponseEntity.noContent().build();
    }
}
