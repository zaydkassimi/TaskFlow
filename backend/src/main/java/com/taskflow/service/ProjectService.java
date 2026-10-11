package com.taskflow.service;

import com.taskflow.dto.request.CreateProjectRequest;
import com.taskflow.dto.request.UpdateProjectRequest;
import com.taskflow.dto.response.PageResponse;
import com.taskflow.dto.response.ProjectResponse;
import com.taskflow.dto.response.ProjectSummaryResponse;
import com.taskflow.dto.response.UserSummaryResponse;
import com.taskflow.entity.Project;
import com.taskflow.entity.User;
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
 * Project lifecycle including membership management. Authorization rules:
 * <ul>
 *   <li>create: ADMIN or MANAGER;</li>
 *   <li>view: ADMIN, the owner, or a member;</li>
 *   <li>update/membership: ADMIN, the owner, or a MANAGER member;</li>
 *   <li>delete: ADMIN or the owner.</li>
 * </ul>
 */
@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ProjectMapper projectMapper;
    private final UserMapper userMapper;

    public ProjectService(ProjectRepository projectRepository, UserRepository userRepository,
            ProjectMapper projectMapper, UserMapper userMapper) {
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.projectMapper = projectMapper;
        this.userMapper = userMapper;
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
        Project project = loadWithMembers(id);
        requireCanView(project, principal);
        return projectMapper.toResponse(project);
    }

    @Transactional
    public ProjectResponse create(CreateProjectRequest request, UserPrincipal principal) {
        requireCanCreate(principal);
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
        return projectMapper.toResponse(projectRepository.save(project));
    }

    @Transactional
    public ProjectResponse update(Long id, UpdateProjectRequest request, UserPrincipal principal) {
        Project project = loadWithMembers(id);
        requireCanManage(project, principal);
        project.setName(request.name().trim());
        project.setDescription(trimToNull(request.description()));
        project.setStatus(request.status());
        project.setStartDate(request.startDate());
        project.setDueDate(request.dueDate());
        return projectMapper.toResponse(projectRepository.save(project));
    }

    @Transactional
    public void delete(Long id, UserPrincipal principal) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", id));
        requireCanDelete(project, principal);
        projectRepository.delete(project);
    }

    @Transactional(readOnly = true)
    public List<UserSummaryResponse> listMembers(Long projectId, UserPrincipal principal) {
        Project project = loadWithMembers(projectId);
        requireCanView(project, principal);
        return project.getMembers().stream().map(userMapper::toSummary).toList();
    }

    @Transactional
    public ProjectResponse addMember(Long projectId, Long userId, UserPrincipal principal) {
        Project project = loadWithMembers(projectId);
        requireCanManage(project, principal);
        if (isMember(project, userId)) {
            throw new DuplicateResourceException("User is already a member of this project");
        }
        project.getMembers().add(loadUser(userId));
        return projectMapper.toResponse(projectRepository.save(project));
    }

    @Transactional
    public void removeMember(Long projectId, Long userId, UserPrincipal principal) {
        Project project = loadWithMembers(projectId);
        requireCanManage(project, principal);
        if (project.getCreatedBy().getId().equals(userId)) {
            throw new UnauthorizedOperationException("The project owner cannot be removed from the project");
        }
        boolean removed = project.getMembers().removeIf(member -> member.getId().equals(userId));
        if (!removed) {
            throw new ResourceNotFoundException("Project member", "userId", userId);
        }
        projectRepository.save(project);
    }

    private Project loadWithMembers(Long id) {
        return projectRepository.findWithMembersById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", id));
    }

    private User loadUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
    }

    private void requireCanCreate(UserPrincipal principal) {
        if (principal.role() != Role.ADMIN && principal.role() != Role.MANAGER) {
            throw new UnauthorizedOperationException("Only admins and managers can create projects");
        }
    }

    private void requireCanView(Project project, UserPrincipal principal) {
        if (principal.role() == Role.ADMIN
                || project.getCreatedBy().getId().equals(principal.id())
                || isMember(project, principal.id())) {
            return;
        }
        throw new UnauthorizedOperationException("You do not have access to this project");
    }

    private void requireCanManage(Project project, UserPrincipal principal) {
        if (principal.role() == Role.ADMIN || project.getCreatedBy().getId().equals(principal.id())) {
            return;
        }
        if (principal.role() == Role.MANAGER && isMember(project, principal.id())) {
            return;
        }
        throw new UnauthorizedOperationException("You are not allowed to manage this project");
    }

    private void requireCanDelete(Project project, UserPrincipal principal) {
        if (principal.role() == Role.ADMIN || project.getCreatedBy().getId().equals(principal.id())) {
            return;
        }
        throw new UnauthorizedOperationException("Only the project owner or an admin can delete this project");
    }

    private boolean isMember(Project project, Long userId) {
        return project.getMembers().stream().anyMatch(member -> member.getId().equals(userId));
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
