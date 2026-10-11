package com.taskflow.service;

import com.taskflow.dto.request.CreateTaskRequest;
import com.taskflow.dto.request.UpdateTaskRequest;
import com.taskflow.dto.response.PageResponse;
import com.taskflow.dto.response.TaskResponse;
import com.taskflow.dto.response.TaskSummaryResponse;
import com.taskflow.entity.Project;
import com.taskflow.entity.Task;
import com.taskflow.entity.User;
import com.taskflow.entity.enums.ActivityType;
import com.taskflow.entity.enums.TaskPriority;
import com.taskflow.entity.enums.TaskStatus;
import com.taskflow.exception.ResourceNotFoundException;
import com.taskflow.exception.UnauthorizedOperationException;
import com.taskflow.mapper.TaskMapper;
import com.taskflow.repository.TaskRepository;
import com.taskflow.repository.UserRepository;
import com.taskflow.repository.specification.TaskSpecifications;
import com.taskflow.security.UserPrincipal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Task lifecycle and assignment. Authorisation builds on {@link ProjectAccessService}:
 * any project member may create tasks, while editing is limited to project managers,
 * the task creator, or (for status changes) the assignee.
 */
@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final TaskMapper taskMapper;
    private final ProjectAccessService projectAccess;
    private final ActivityService activityService;

    public TaskService(TaskRepository taskRepository, UserRepository userRepository, TaskMapper taskMapper,
            ProjectAccessService projectAccess, ActivityService activityService) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.taskMapper = taskMapper;
        this.projectAccess = projectAccess;
        this.activityService = activityService;
    }

    @Transactional(readOnly = true)
    public PageResponse<TaskSummaryResponse> listByProject(Long projectId, UserPrincipal principal, Pageable pageable,
            TaskStatus status, TaskPriority priority, Long assignedToId, String search) {
        Project project = projectAccess.loadWithMembers(projectId);
        projectAccess.requireCanView(project, principal);
        Page<Task> page = taskRepository.findAll(
                TaskSpecifications.withFilters(projectId, status, priority, assignedToId, search), pageable);
        return PageResponse.from(page, taskMapper::toSummary);
    }

    @Transactional(readOnly = true)
    public PageResponse<TaskSummaryResponse> listAssignedToMe(UserPrincipal principal, Pageable pageable,
            TaskStatus status) {
        Page<Task> page = taskRepository.findAll(
                TaskSpecifications.withFilters(null, status, null, principal.id(), null), pageable);
        return PageResponse.from(page, taskMapper::toSummary);
    }

    @Transactional(readOnly = true)
    public TaskResponse get(Long id, UserPrincipal principal) {
        Task task = loadTask(id);
        projectAccess.requireCanView(task.getProject(), principal);
        return taskMapper.toResponse(task);
    }

    @Transactional
    public TaskResponse create(Long projectId, CreateTaskRequest request, UserPrincipal principal) {
        Project project = projectAccess.loadWithMembers(projectId);
        projectAccess.requireCanView(project, principal);
        User creator = loadUser(principal.id());

        Task task = new Task();
        task.setProject(project);
        task.setCreatedBy(creator);
        task.setTitle(request.title().trim());
        task.setDescription(trimToNull(request.description()));
        task.setStatus(request.status() == null ? TaskStatus.TODO : request.status());
        task.setPriority(request.priority() == null ? TaskPriority.MEDIUM : request.priority());
        task.setDueDate(request.dueDate());
        if (request.assignedToId() != null) {
            task.setAssignedTo(requireMember(project, request.assignedToId()));
        }

        Task saved = taskRepository.save(task);
        activityService.record(ActivityType.TASK_CREATED,
                "Created task \"" + saved.getTitle() + "\"", creator, project, saved);
        if (saved.getAssignedTo() != null) {
            activityService.record(ActivityType.TASK_ASSIGNED,
                    "Assigned \"" + saved.getTitle() + "\" to " + displayName(saved.getAssignedTo()),
                    creator, project, saved);
        }
        return taskMapper.toResponse(saved);
    }

    @Transactional
    public TaskResponse update(Long id, UpdateTaskRequest request, UserPrincipal principal) {
        Task task = loadTask(id);
        requireCanModify(task, principal);
        task.setTitle(request.title().trim());
        task.setDescription(trimToNull(request.description()));
        task.setPriority(request.priority());
        task.setDueDate(request.dueDate());
        return taskMapper.toResponse(taskRepository.save(task));
    }

    @Transactional
    public TaskResponse changeStatus(Long id, TaskStatus newStatus, UserPrincipal principal) {
        Task task = loadTask(id);
        requireCanChangeStatus(task, principal);
        TaskStatus previous = task.getStatus();
        task.setStatus(newStatus);
        Task saved = taskRepository.save(task);
        if (previous != newStatus) {
            activityService.record(ActivityType.TASK_STATUS_CHANGED,
                    "Moved \"" + saved.getTitle() + "\" from " + previous + " to " + newStatus,
                    loadUser(principal.id()), saved.getProject(), saved);
        }
        return taskMapper.toResponse(saved);
    }

    @Transactional
    public TaskResponse assign(Long id, Long userId, UserPrincipal principal) {
        Task task = loadTask(id);
        Project project = projectAccess.loadWithMembers(task.getProject().getId());
        projectAccess.requireCanManage(project, principal);
        User actor = loadUser(principal.id());

        if (userId == null) {
            task.setAssignedTo(null);
            Task saved = taskRepository.save(task);
            activityService.record(ActivityType.TASK_ASSIGNED,
                    "Unassigned \"" + saved.getTitle() + "\"", actor, project, saved);
            return taskMapper.toResponse(saved);
        }

        task.setAssignedTo(requireMember(project, userId));
        Task saved = taskRepository.save(task);
        activityService.record(ActivityType.TASK_ASSIGNED,
                "Assigned \"" + saved.getTitle() + "\" to " + displayName(saved.getAssignedTo()),
                actor, project, saved);
        return taskMapper.toResponse(saved);
    }

    @Transactional
    public void delete(Long id, UserPrincipal principal) {
        Task task = loadTask(id);
        if (!canModify(task, principal)) {
            throw new UnauthorizedOperationException("You are not allowed to delete this task");
        }
        taskRepository.delete(task);
    }

    private Task loadTask(Long id) {
        return taskRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task", "id", id));
    }

    private User loadUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
    }

    private User requireMember(Project project, Long userId) {
        if (!projectAccess.isMember(project, userId)) {
            throw new UnauthorizedOperationException("The assignee must be a member of the project");
        }
        return loadUser(userId);
    }

    private boolean canModify(Task task, UserPrincipal principal) {
        return projectAccess.canManage(task.getProject(), principal)
                || task.getCreatedBy().getId().equals(principal.id());
    }

    private void requireCanModify(Task task, UserPrincipal principal) {
        if (!canModify(task, principal)) {
            throw new UnauthorizedOperationException("You are not allowed to modify this task");
        }
    }

    private void requireCanChangeStatus(Task task, UserPrincipal principal) {
        if (canModify(task, principal)) {
            return;
        }
        if (task.getAssignedTo() != null && task.getAssignedTo().getId().equals(principal.id())) {
            return;
        }
        throw new UnauthorizedOperationException(
                "Only the assignee, task creator, project owner, a project manager or an admin can change the status");
    }

    private String displayName(User user) {
        return user.getFirstName() + " " + user.getLastName();
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
