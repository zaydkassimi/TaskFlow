package com.taskflow.service;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.taskflow.dto.request.CreateCommentRequest;
import com.taskflow.dto.request.UpdateCommentRequest;
import com.taskflow.entity.Comment;
import com.taskflow.entity.Project;
import com.taskflow.entity.Task;
import com.taskflow.entity.User;
import com.taskflow.entity.enums.ActivityType;
import com.taskflow.entity.enums.Role;
import com.taskflow.exception.UnauthorizedOperationException;
import com.taskflow.mapper.CommentMapper;
import com.taskflow.repository.CommentRepository;
import com.taskflow.repository.TaskRepository;
import com.taskflow.repository.UserRepository;
import com.taskflow.security.UserPrincipal;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CommentServiceTest {

    @Mock
    private CommentRepository commentRepository;
    @Mock
    private TaskRepository taskRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private CommentMapper commentMapper;
    @Mock
    private ProjectAccessService projectAccess;
    @Mock
    private ActivityService activityService;

    @InjectMocks
    private CommentService commentService;

    private User user(long id) {
        User user = new User();
        user.setId(id);
        user.setEmail("u" + id + "@taskflow.local");
        return user;
    }

    private UserPrincipal principal(long id, Role role) {
        return new UserPrincipal(id, "u" + id + "@taskflow.local", "hash", role, true);
    }

    private Comment commentAuthoredBy(long authorId) {
        Comment comment = new Comment();
        comment.setId(1L);
        comment.setContent("original");
        comment.setAuthor(user(authorId));
        Task task = new Task();
        task.setId(5L);
        Project project = new Project();
        project.setId(1L);
        project.setCreatedBy(user(1L));
        task.setProject(project);
        comment.setTask(task);
        return comment;
    }

    @Test
    void updateRejectsNonAuthorNonAdmin() {
        Comment comment = commentAuthoredBy(2L);
        when(commentRepository.findById(1L)).thenReturn(Optional.of(comment));

        assertThrows(UnauthorizedOperationException.class,
                () -> commentService.update(1L, new UpdateCommentRequest("changed"), principal(3L, Role.MEMBER)));
    }

    @Test
    void deleteAllowedForProjectManager() {
        Comment comment = commentAuthoredBy(2L);
        when(commentRepository.findById(1L)).thenReturn(Optional.of(comment));
        UserPrincipal actor = principal(3L, Role.MANAGER);
        when(projectAccess.canManage(comment.getTask().getProject(), actor)).thenReturn(true);

        commentService.delete(1L, actor);

        verify(commentRepository).delete(comment);
    }

    @Test
    void createRecordsActivity() {
        Task task = new Task();
        task.setId(5L);
        task.setTitle("Task");
        Project project = new Project();
        project.setId(1L);
        project.setCreatedBy(user(1L));
        task.setProject(project);
        when(taskRepository.findWithDetailsById(5L)).thenReturn(Optional.of(task));
        when(userRepository.findById(3L)).thenReturn(Optional.of(user(3L)));
        when(commentRepository.save(any(Comment.class))).thenAnswer(inv -> inv.getArgument(0));
        when(commentMapper.toResponse(any(Comment.class))).thenReturn(null);

        commentService.create(5L, new CreateCommentRequest("nice"), principal(3L, Role.MEMBER));

        verify(activityService).record(eq(ActivityType.COMMENT_ADDED), any(), any(), any(), any());
    }
}
