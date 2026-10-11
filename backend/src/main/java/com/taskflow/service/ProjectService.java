package com.taskflow.service;

import com.taskflow.dto.request.CreateProjectRequest;
import com.taskflow.dto.request.UpdateProjectRequest;
import com.taskflow.dto.response.PageResponse;
import com.taskflow.dto.response.ProjectResponse;
import com.taskflow.dto.response.ProjectSummaryResponse;
import com.taskflow.dto.response.UserSummaryResponse;
import com.taskflow.entity.Project;
import com.taskflow.entity.User;
import com.taskflow.entity.enums.ActivityType;
import com.taskflow.entity.enums.ProjectStatus;
import com.taskflow.entity.enums.Role;
import com.taskflow.exception.DuplicateResourceException;
import com.taskflow.exception.ResourceNotFoundException;
import com.taskflow.exception.UnauthorizedOperationException;
import com.taskflow.mapper.ProjectMapper;
import com.taskflow.mapper.UserMapper;
import com.taskflow.repository.ProjectRepository;
import com.taskflow.repository.UserRepository;
import com.taskflow.repository.specification.ProjectSpecifications;
import com.taskflow.security.UserPrincipal;
import java.util.LinkedHashSet;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Project lifecycle including membership management. Authorisation rules live in
 * {@link ProjectAccessService}.
 */
@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ProjectMapper projectMapper;
    private final UserMapper userMapper;
    private final ProjectAccessService projectAccess;
    private final ActivityService activityService;

    public ProjectService(ProjectRepository projectRepository, UserRepository userRepository,
            ProjectMapper projectMapper, UserMapper userMapper, ProjectAccessService projectAccess,
            ActivityService activityService) {
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.projectMapper = projectMapper;
        this.userMapper = userMapper;
        this.projectAccess = projectAccess;
        this.activityService = activityService;
    }

    @Transactional(readOnly = true)
    public PageResponse<ProjectSummaryResponse> list(UserPrincipal principal, Pageable pageable,
            ProjectStatus status, String search, boolean mine) {
        Long scope = (principal.role() == Role.ADMIN && !mine) ? null : principal.id();
        Page<Project> page = projectRepository.findAll(
                ProjectSpecifications.withFilters(scope, status, search), pageable);
        return PageResponse.from(page, projectMapper::toSummary);
    }

    @Transactional(readOnly = true)
    public ProjectResponse get(Long id, UserPrincipal principal) {
        Project project = projectAccess.loadWithMembers(id);
        projectAccess.requireCanView(project, principal);
        return projectMapper.toResponse(project);
    }

    @Transactional
    public ProjectResponse create(CreateProjectRequest request, UserPrincipal principal) {
        projectAccess.requireCanCreateProject(principal);
        User creator = loadUser(principal.id());

        Project project = new Project();
        project.setName(request.name().trim());
        project.setDescription(trimToNull(request.description()));
        project.setStatus(request.status() == null ? ProjectStatus.PLANNING : request.status());
        project.setStartDate(request.startDate());
        project.setDueDate(request.dueDate());
        project.setCreatedBy(creator);
        project.getMembers().add(creator);

        if (request.memberIds() != null) {
            for (Long memberId : new LinkedHashSet<>(request.memberIds())) {
                if (memberId == null || memberId.equals(creator.getId())) {
                    continue;
                }
                project.getMembers().add(loadUser(memberId));
            }
        }
        Project saved = projectRepository.save(project);
        activityService.record(ActivityType.PROJECT_CREATED,
                "Created project \"" + saved.getName() + "\"", creator, saved, null);
        return projectMapper.toResponse(saved);
    }

    @Transactional
    public ProjectResponse update(Long id, UpdateProjectRequest request, UserPrincipal principal) {
        Project project = projectAccess.loadWithMembers(id);
        projectAccess.requireCanManage(project, principal);
        project.setName(request.name().trim());
        project.setDescription(trimToNull(request.description()));
        project.setStatus(request.status());
        project.setStartDate(request.startDate());
        project.setDueDate(request.dueDate());
        Project saved = projectRepository.save(project);
        activityService.record(ActivityType.PROJECT_UPDATED,
                "Updated project \"" + saved.getName() + "\"", loadUser(principal.id()), saved, null);
        return projectMapper.toResponse(saved);
    }

    @Transactional
    public void delete(Long id, UserPrincipal principal) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", id));
        projectAccess.requireCanDelete(project, principal);
        projectRepository.delete(project);
    }

    @Transactional(readOnly = true)
    public List<UserSummaryResponse> listMembers(Long projectId, UserPrincipal principal) {
        Project project = projectAccess.loadWithMembers(projectId);
        projectAccess.requireCanView(project, principal);
        return project.getMembers().stream().map(userMapper::toSummary).toList();
    }

    @Transactional
    public ProjectResponse addMember(Long projectId, Long userId, UserPrincipal principal) {
        Project project = projectAccess.loadWithMembers(projectId);
        projectAccess.requireCanManage(project, principal);
        if (projectAccess.isMember(project, userId)) {
            throw new DuplicateResourceException("User is already a member of this project");
        }
        User member = loadUser(userId);
        project.getMembers().add(member);
        Project saved = projectRepository.save(project);
        activityService.record(ActivityType.MEMBER_ADDED,
                "Added " + displayName(member) + " to the project", loadUser(principal.id()), saved, null);
        return projectMapper.toResponse(saved);
    }

    @Transactional
    public void removeMember(Long projectId, Long userId, UserPrincipal principal) {
        Project project = projectAccess.loadWithMembers(projectId);
        projectAccess.requireCanManage(project, principal);
        if (project.getCreatedBy().getId().equals(userId)) {
            throw new UnauthorizedOperationException("The project owner cannot be removed from the project");
        }
        boolean removed = project.getMembers().removeIf(member -> member.getId().equals(userId));
        if (!removed) {
            throw new ResourceNotFoundException("Project member", "userId", userId);
        }
        Project saved = projectRepository.save(project);
        activityService.record(ActivityType.MEMBER_REMOVED,
                "Removed " + displayName(loadUser(userId)) + " from the project", loadUser(principal.id()), saved, null);
    }

    private User loadUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
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
