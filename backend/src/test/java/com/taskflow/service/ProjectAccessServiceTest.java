package com.taskflow.service;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.taskflow.entity.Project;
import com.taskflow.entity.User;
import com.taskflow.entity.enums.Role;
import com.taskflow.exception.UnauthorizedOperationException;
import com.taskflow.repository.ProjectRepository;
import com.taskflow.security.UserPrincipal;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ProjectAccessServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @InjectMocks
    private ProjectAccessService projectAccess;

    private User user(long id) {
        User user = new User();
        user.setId(id);
        user.setEmail("u" + id + "@taskflow.local");
        return user;
    }

    private Project projectOwnedBy(long ownerId, long... memberIds) {
        Project project = new Project();
        User owner = user(ownerId);
        project.setCreatedBy(owner);
        project.getMembers().add(owner);
        for (long id : memberIds) {
            project.getMembers().add(user(id));
        }
        return project;
    }

    private UserPrincipal principal(long id, Role role) {
        return new UserPrincipal(id, "u" + id + "@taskflow.local", "hash", role, true);
    }

    @Test
    void requireCanCreateProjectAllowsAdminAndManagerOnly() {
        assertDoesNotThrow(() -> projectAccess.requireCanCreateProject(principal(1L, Role.ADMIN)));
        assertDoesNotThrow(() -> projectAccess.requireCanCreateProject(principal(1L, Role.MANAGER)));
        assertThrows(UnauthorizedOperationException.class,
                () -> projectAccess.requireCanCreateProject(principal(1L, Role.MEMBER)));
    }

    @Test
    void requireCanViewAllowsAdminOwnerAndMembers() {
        Project project = projectOwnedBy(1L, 2L);

        assertDoesNotThrow(() -> projectAccess.requireCanView(project, principal(9L, Role.ADMIN)));
        assertDoesNotThrow(() -> projectAccess.requireCanView(project, principal(1L, Role.MEMBER)));
        assertDoesNotThrow(() -> projectAccess.requireCanView(project, principal(2L, Role.MEMBER)));
        assertThrows(UnauthorizedOperationException.class,
                () -> projectAccess.requireCanView(project, principal(3L, Role.MEMBER)));
    }

    @Test
    void canManageFollowsOwnerAdminAndManagerMemberRules() {
        Project project = projectOwnedBy(1L, 2L);

        assertTrue(projectAccess.canManage(project, principal(9L, Role.ADMIN)));
        assertTrue(projectAccess.canManage(project, principal(1L, Role.MEMBER)));
        assertTrue(projectAccess.canManage(project, principal(2L, Role.MANAGER)));
        assertFalse(projectAccess.canManage(project, principal(2L, Role.MEMBER)));
        assertFalse(projectAccess.canManage(project, principal(3L, Role.MANAGER)));
    }

    @Test
    void requireCanDeleteAllowsOnlyOwnerOrAdmin() {
        Project project = projectOwnedBy(1L, 2L);

        assertDoesNotThrow(() -> projectAccess.requireCanDelete(project, principal(9L, Role.ADMIN)));
        assertDoesNotThrow(() -> projectAccess.requireCanDelete(project, principal(1L, Role.MEMBER)));
        assertThrows(UnauthorizedOperationException.class,
                () -> projectAccess.requireCanDelete(project, principal(2L, Role.MANAGER)));
    }
}
