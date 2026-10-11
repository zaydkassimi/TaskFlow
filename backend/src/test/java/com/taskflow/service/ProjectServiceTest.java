package com.taskflow.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.taskflow.dto.request.CreateProjectRequest;
import com.taskflow.entity.Project;
import com.taskflow.entity.User;
import com.taskflow.entity.enums.Role;
import com.taskflow.exception.DuplicateResourceException;
import com.taskflow.exception.UnauthorizedOperationException;
import com.taskflow.mapper.ProjectMapper;
import com.taskflow.mapper.UserMapper;
import com.taskflow.repository.ProjectRepository;
import com.taskflow.repository.UserRepository;
import com.taskflow.security.UserPrincipal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ProjectMapper projectMapper;
    @Mock
    private UserMapper userMapper;
    @Mock
    private ProjectAccessService projectAccess;
    @Mock
    private ActivityService activityService;

    @InjectMocks
    private ProjectService projectService;

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
        User owner = user(ownerId);
        project.setCreatedBy(owner);
        project.getMembers().add(owner);
        return project;
    }

    @Test
    void createAddsCreatorAndRequestedMembers() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user(1L)));
        when(userRepository.findById(2L)).thenReturn(Optional.of(user(2L)));
        when(projectRepository.save(any(Project.class))).thenAnswer(inv -> inv.getArgument(0));
        when(projectMapper.toResponse(any(Project.class))).thenReturn(null);

        projectService.create(
                new CreateProjectRequest("Apollo", "desc", null, null, null, List.of(1L, 2L)),
                principal(1L, Role.MANAGER));

        ArgumentCaptor<Project> captor = ArgumentCaptor.forClass(Project.class);
        verify(projectRepository).save(captor.capture());
        Project saved = captor.getValue();
        assertEquals(2, saved.getMembers().size());
        assertEquals("Apollo", saved.getName());
    }

    @Test
    void addMemberRejectsExistingMember() {
        Project project = projectOwnedBy(1L);
        when(projectAccess.loadWithMembers(5L)).thenReturn(project);
        when(projectAccess.isMember(project, 2L)).thenReturn(true);

        assertThrows(DuplicateResourceException.class,
                () -> projectService.addMember(5L, 2L, principal(1L, Role.ADMIN)));
    }

    @Test
    void removeMemberProtectsOwner() {
        Project project = projectOwnedBy(1L);
        project.setId(5L);
        when(projectAccess.loadWithMembers(5L)).thenReturn(project);

        assertThrows(UnauthorizedOperationException.class,
                () -> projectService.removeMember(5L, 1L, principal(9L, Role.ADMIN)));
    }
}
