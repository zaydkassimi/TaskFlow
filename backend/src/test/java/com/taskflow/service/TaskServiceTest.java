package com.taskflow.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.taskflow.dto.request.CreateTaskRequest;
import com.taskflow.dto.request.UpdateTaskRequest;
import com.taskflow.entity.Project;
import com.taskflow.entity.Task;
import com.taskflow.entity.User;
import com.taskflow.entity.enums.ActivityType;
import com.taskflow.entity.enums.Role;
import com.taskflow.entity.enums.TaskPriority;
import com.taskflow.entity.enums.TaskStatus;
import com.taskflow.exception.UnauthorizedOperationException;
import com.taskflow.mapper.TaskMapper;
import com.taskflow.repository.TaskRepository;
import com.taskflow.repository.UserRepository;
import com.taskflow.security.UserPrincipal;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private TaskMapper taskMapper;
    @Mock
    private ProjectAccessService projectAccess;
    @Mock
    private ActivityService activityService;

    @InjectMocks
    private TaskService taskService;

    private User user(long id) {
        User user = new User();
        user.setId(id);
        user.setFirstName("Jane");
        user.setLastName("Doe");
        user.setEmail("u" + id + "@taskflow.local");
        return user;
    }

    private UserPrincipal principal(long id, Role role) {
        return new UserPrincipal(id, "u" + id + "@taskflow.local", "hash", role, true);
    }

    private Project projectOwnedBy(long ownerId) {
        Project project = new Project();
        project.setId(1L);
        project.setCreatedBy(user(ownerId));
        project.getMembers().add(user(ownerId));
        return project;
    }

    private Task task(long id) {
        Task task = new Task();
        task.setId(id);
        task.setTitle("Task");
        return task;
    }

    @Test
    void createAppliesDefaultStatusAndPriority() {
        Project project = projectOwnedBy(2L);
        when(projectAccess.loadWithMembers(1L)).thenReturn(project);
        when(userRepository.findById(3L)).thenReturn(Optional.of(user(3L)));
        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));
        when(taskMapper.toResponse(any(Task.class))).thenReturn(null);

        taskService.create(1L, new CreateTaskRequest("Title", null, null, null, null, null),
                principal(3L, Role.MEMBER));

        ArgumentCaptor<Task> captor = ArgumentCaptor.forClass(Task.class);
        verify(taskRepository).save(captor.capture());
        assertEquals(TaskStatus.TODO, captor.getValue().getStatus());
        assertEquals(TaskPriority.MEDIUM, captor.getValue().getPriority());
    }

    @Test
    void createRejectsAssigneeWhoIsNotAProjectMember() {
        Project project = projectOwnedBy(2L);
        when(projectAccess.loadWithMembers(1L)).thenReturn(project);
        when(userRepository.findById(3L)).thenReturn(Optional.of(user(3L)));
        when(projectAccess.isMember(project, 9L)).thenReturn(false);

        assertThrows(UnauthorizedOperationException.class, () -> taskService.create(1L,
                new CreateTaskRequest("Title", null, null, null, 9L, null), principal(3L, Role.MEMBER)));
    }

    @Test
    void updateRejectsMemberWhoIsNotCreatorOrManager() {
        Project project = projectOwnedBy(2L);
        Task task = task(10L);
        task.setProject(project);
        task.setCreatedBy(user(1L));
        when(taskRepository.findWithDetailsById(10L)).thenReturn(Optional.of(task));
        UserPrincipal actor = principal(3L, Role.MEMBER);
        when(projectAccess.canManage(project, actor)).thenReturn(false);

        assertThrows(UnauthorizedOperationException.class, () -> taskService.update(10L,
                new UpdateTaskRequest("changed", null, TaskPriority.HIGH, null), actor));
    }

    @Test
    void assigneeCanAdvanceStatus() {
        Project project = projectOwnedBy(2L);
        Task task = task(10L);
        task.setProject(project);
        task.setCreatedBy(user(1L));
        task.setAssignedTo(user(3L));
        when(taskRepository.findWithDetailsById(10L)).thenReturn(Optional.of(task));
        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));
        when(taskMapper.toResponse(any(Task.class))).thenReturn(null);
        UserPrincipal actor = principal(3L, Role.MEMBER);
        when(projectAccess.canManage(project, actor)).thenReturn(false);
        when(userRepository.findById(3L)).thenReturn(Optional.of(user(3L)));

        taskService.changeStatus(10L, TaskStatus.DONE, actor);

        assertEquals(TaskStatus.DONE, task.getStatus());
        verify(activityService).record(eq(ActivityType.TASK_STATUS_CHANGED), any(), any(), any(), any());
    }

    @Test
    void assignRejectsNonMember() {
        Project project = projectOwnedBy(2L);
        Task task = task(10L);
        task.setProject(project);
        when(taskRepository.findWithDetailsById(10L)).thenReturn(Optional.of(task));
        when(projectAccess.loadWithMembers(1L)).thenReturn(project);
        when(userRepository.findById(3L)).thenReturn(Optional.of(user(3L)));
        when(projectAccess.isMember(project, 9L)).thenReturn(false);

        assertThrows(UnauthorizedOperationException.class,
                () -> taskService.assign(10L, 9L, principal(3L, Role.MANAGER)));
    }
}
