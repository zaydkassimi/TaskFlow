package com.taskflow.dto.response;

import com.taskflow.entity.enums.TaskStatus;
import java.util.Map;

/**
 * Personal workload summary for the dashboard. Values reflect the projects the caller
 * belongs to and the tasks assigned to them (admins see all projects).
 */
public record DashboardSummaryResponse(
        long projectCount,
        long activeProjectCount,
        long assignedTaskCount,
        long completedTaskCount,
        long overdueTaskCount,
        Map<TaskStatus, Long> tasksByStatus) {
}
