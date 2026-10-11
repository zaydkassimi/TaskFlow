package com.taskflow.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.taskflow.dto.response.DashboardSummaryResponse;
import com.taskflow.entity.enums.ProjectStatus;
import com.taskflow.entity.enums.Role;
import com.taskflow.entity.enums.TaskStatus;
import com.taskflow.repository.ProjectRepository;
import com.taskflow.repository.TaskRepository;
import com.taskflow.security.UserPrincipal;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private TaskRepository taskRepository;

    @InjectMocks
    private DashboardService dashboardService;

    private UserPrincipal principal(long id, Role role) {
        return new UserPrincipal(id, "u" + id + "@taskflow.local", "hash", role, true);
    }

    @Test
    void nonAdminSeesOnlyTheirProjects() {
        UserPrincipal actor = principal(7L, Role.MEMBER);
        when(projectRepository.countByMembersId(7L)).thenReturn(3L);
        when(projectRepository.countByMembersIdAndStatus(7L, ProjectStatus.ACTIVE)).thenReturn(2L);
        when(taskRepository.countByAssignedToId(7L)).thenReturn(5L);
        when(taskRepository.countByAssignedToIdAndStatus(eq(7L), any(TaskStatus.class))).thenReturn(0L);
        when(taskRepository.countByAssignedToIdAndStatus(7L, TaskStatus.DONE)).thenReturn(1L);
        when(taskRepository.countOverdueByAssignedToId(eq(7L), any(LocalDate.class))).thenReturn(2L);

        DashboardSummaryResponse summary = dashboardService.summary(actor);

        assertEquals(3L, summary.projectCount());
        assertEquals(2L, summary.activeProjectCount());
        assertEquals(5L, summary.assignedTaskCount());
        assertEquals(1L, summary.completedTaskCount());
        assertEquals(2L, summary.overdueTaskCount());
        verify(projectRepository, never()).count();
    }

    @Test
    void adminSeesAllProjects() {
        UserPrincipal actor = principal(1L, Role.ADMIN);
        when(projectRepository.count()).thenReturn(10L);
        when(projectRepository.countByStatus(ProjectStatus.ACTIVE)).thenReturn(4L);
        when(taskRepository.countByAssignedToId(1L)).thenReturn(0L);
        when(taskRepository.countByAssignedToIdAndStatus(eq(1L), any(TaskStatus.class))).thenReturn(0L);
        when(taskRepository.countOverdueByAssignedToId(eq(1L), any(LocalDate.class))).thenReturn(0L);


        DashboardSummaryResponse summary = dashboardService.summary(actor);

        assertEquals(10L, summary.projectCount());
        assertEquals(4L, summary.activeProjectCount());
        verify(projectRepository, never()).countByMembersId(anyLong());
    }
}
