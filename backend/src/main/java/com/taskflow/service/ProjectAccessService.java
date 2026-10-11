package com.taskflow.service;

import com.taskflow.entity.Project;
import com.taskflow.entity.enums.Role;
import com.taskflow.exception.ResourceNotFoundException;
import com.taskflow.exception.UnauthorizedOperationException;
import com.taskflow.repository.ProjectRepository;
import com.taskflow.security.UserPrincipal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Centralised project authorisation rules shared by the project and task modules.
 * <ul>
 *   <li>view: ADMIN, the owner, or a member;</li>
 *   <li>manage: ADMIN, the owner, or a MANAGER member;</li>
 *   <li>delete: ADMIN or the owner.</li>
 * </ul>
 */
@Service
public class ProjectAccessService {

    private final ProjectRepository projectRepository;

    public ProjectAccessService(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    @Transactional(readOnly = true)
    public Project loadWithMembers(Long projectId) {
        return projectRepository.findWithMembersById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));
    }

    public boolean isMember(Project project, Long userId) {
        return userId != null && project.getMembers().stream()
                .anyMatch(member -> member.getId().equals(userId));
    }

    public boolean canManage(Project project, UserPrincipal principal) {
        if (principal.role() == Role.ADMIN || project.getCreatedBy().getId().equals(principal.id())) {
            return true;
        }
        return principal.role() == Role.MANAGER && isMember(project, principal.id());
    }

    public void requireCanCreateProject(UserPrincipal principal) {
        if (principal.role() != Role.ADMIN && principal.role() != Role.MANAGER) {
            throw new UnauthorizedOperationException("Only admins and managers can create projects");
        }
    }

    public void requireCanView(Project project, UserPrincipal principal) {
        if (principal.role() == Role.ADMIN
                || project.getCreatedBy().getId().equals(principal.id())
                || isMember(project, principal.id())) {
            return;
        }
        throw new UnauthorizedOperationException("You do not have access to this project");
    }

    public void requireCanManage(Project project, UserPrincipal principal) {
        if (!canManage(project, principal)) {
            throw new UnauthorizedOperationException("You are not allowed to manage this project");
        }
    }

    public void requireCanDelete(Project project, UserPrincipal principal) {
        if (principal.role() == Role.ADMIN || project.getCreatedBy().getId().equals(principal.id())) {
            return;
        }
        throw new UnauthorizedOperationException("Only the project owner or an admin can delete this project");
    }
}
