package com.taskflow.service;

import com.taskflow.dto.request.CreateCommentRequest;
import com.taskflow.dto.request.UpdateCommentRequest;
import com.taskflow.dto.response.CommentResponse;
import com.taskflow.entity.Comment;
import com.taskflow.entity.Task;
import com.taskflow.entity.User;
import com.taskflow.entity.enums.ActivityType;
import com.taskflow.entity.enums.Role;
import com.taskflow.exception.ResourceNotFoundException;
import com.taskflow.exception.UnauthorizedOperationException;
import com.taskflow.mapper.CommentMapper;
import com.taskflow.repository.CommentRepository;
import com.taskflow.repository.TaskRepository;
import com.taskflow.repository.UserRepository;
import com.taskflow.security.UserPrincipal;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Task comments. Reading and posting require project visibility; editing is limited to
 * the author (or an admin) and deletion is allowed for the author, an admin, or a project manager.
 */
@Service
public class CommentService {

    private final CommentRepository commentRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final CommentMapper commentMapper;
    private final ProjectAccessService projectAccess;
    private final ActivityService activityService;

    public CommentService(CommentRepository commentRepository, TaskRepository taskRepository,
            UserRepository userRepository, CommentMapper commentMapper, ProjectAccessService projectAccess,
            ActivityService activityService) {
        this.commentRepository = commentRepository;
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.commentMapper = commentMapper;
        this.projectAccess = projectAccess;
        this.activityService = activityService;
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> list(Long taskId, UserPrincipal principal) {
        Task task = loadTask(taskId);
        projectAccess.requireCanView(task.getProject(), principal);
        return commentRepository.findWithAuthorByTaskIdOrderByCreatedAtAsc(taskId).stream()
                .map(commentMapper::toResponse)
                .toList();
    }

    @Transactional
    public CommentResponse create(Long taskId, CreateCommentRequest request, UserPrincipal principal) {
        Task task = loadTask(taskId);
        projectAccess.requireCanView(task.getProject(), principal);
        User author = loadUser(principal.id());

        Comment comment = new Comment();
        comment.setContent(request.content().trim());
        comment.setAuthor(author);
        comment.setTask(task);
        Comment saved = commentRepository.save(comment);
        activityService.record(ActivityType.COMMENT_ADDED,
                "Commented on \"" + task.getTitle() + "\"", author, task.getProject(), task);
        return commentMapper.toResponse(saved);
    }

    @Transactional
    public CommentResponse update(Long id, UpdateCommentRequest request, UserPrincipal principal) {
        Comment comment = loadComment(id);
        requireAuthorOrAdmin(comment, principal);
        comment.setContent(request.content().trim());
        return commentMapper.toResponse(commentRepository.save(comment));
    }

    @Transactional
    public void delete(Long id, UserPrincipal principal) {
        Comment comment = loadComment(id);
        boolean allowed = isAuthor(comment, principal)
                || principal.role() == Role.ADMIN
                || projectAccess.canManage(comment.getTask().getProject(), principal);
        if (!allowed) {
            throw new UnauthorizedOperationException("You are not allowed to delete this comment");
        }
        commentRepository.delete(comment);
    }

    private Task loadTask(Long id) {
        return taskRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task", "id", id));
    }

    private Comment loadComment(Long id) {
        return commentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Comment", "id", id));
    }

    private User loadUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
    }

    private boolean isAuthor(Comment comment, UserPrincipal principal) {
        return comment.getAuthor().getId().equals(principal.id());
    }

    private void requireAuthorOrAdmin(Comment comment, UserPrincipal principal) {
        if (!isAuthor(comment, principal) && principal.role() != Role.ADMIN) {
            throw new UnauthorizedOperationException("You can only edit your own comments");
        }
    }
}
