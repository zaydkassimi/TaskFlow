package com.taskflow.service;

import com.taskflow.dto.response.DashboardSummaryResponse;
import com.taskflow.entity.enums.ProjectStatus;
import com.taskflow.entity.enums.Role;
import com.taskflow.entity.enums.TaskStatus;
import com.taskflow.repository.ProjectRepository;
import com.taskflow.repository.TaskRepository;
import com.taskflow.security.UserPrincipal;
import java.time.LocalDate;
import java.util.EnumMap;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Aggregates the numbers shown on the dashboard for the authenticated user.
 */
@Service
public class DashboardService {

    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;

    public DashboardService(ProjectRepository projectRepository, TaskRepository taskRepository) {
        this.projectRepository = projectRepository;
        this.taskRepository = taskRepository;
    }

    @Transactional(readOnly = true)
    public DashboardSummaryResponse summary(UserPrincipal principal) {
        boolean admin = principal.role() == Role.ADMIN;
        Long userId = principal.id();

        long projectCount = admin
                ? projectRepository.count()
                : projectRepository.countByMembersId(userId);
        long activeProjectCount = admin
                ? projectRepository.countByStatus(ProjectStatus.ACTIVE)
                : projectRepository.countByMembersIdAndStatus(userId, ProjectStatus.ACTIVE);

        Map<TaskStatus, Long> tasksByStatus = new EnumMap<>(TaskStatus.class);
        for (TaskStatus status : TaskStatus.values()) {
            tasksByStatus.put(status, taskRepository.countByAssignedToIdAndStatus(userId, status));
        }

        return new DashboardSummaryResponse(
                projectCount,
                activeProjectCount,
                taskRepository.countByAssignedToId(userId),
                taskRepository.countByAssignedToIdAndStatus(userId, TaskStatus.DONE),
                taskRepository.countOverdueByAssignedToId(userId, LocalDate.now()),
                tasksByStatus);
    }
}
