package com.taskflow.service;

import com.taskflow.dto.response.ActivityResponse;
import com.taskflow.dto.response.PageResponse;
import com.taskflow.entity.ActivityLog;
import com.taskflow.entity.Project;
import com.taskflow.entity.Task;
import com.taskflow.entity.User;
import com.taskflow.entity.enums.ActivityType;
import com.taskflow.mapper.ActivityMapper;
import com.taskflow.repository.ActivityLogRepository;
import com.taskflow.security.UserPrincipal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Reads and writes the project activity trail consumed by the activity feed.
 */
@Service
public class ActivityService {

    private final ActivityLogRepository activityLogRepository;
    private final ActivityMapper activityMapper;
    private final ProjectAccessService projectAccess;

    public ActivityService(ActivityLogRepository activityLogRepository, ActivityMapper activityMapper,
            ProjectAccessService projectAccess) {
        this.activityLogRepository = activityLogRepository;
        this.activityMapper = activityMapper;
        this.projectAccess = projectAccess;
    }

    public void record(ActivityType type, String description, User actor, Project project, Task task) {
        ActivityLog log = new ActivityLog();
        log.setType(type);
        log.setDescription(description);
        log.setUser(actor);
        log.setProject(project);
        log.setTask(task);
        activityLogRepository.save(log);
    }

    @Transactional(readOnly = true)
    public PageResponse<ActivityResponse> feed(Long projectId, UserPrincipal principal, Pageable pageable) {
        Project project = projectAccess.loadWithMembers(projectId);
        projectAccess.requireCanView(project, principal);
        Page<ActivityLog> page = activityLogRepository.findByProjectIdOrderByCreatedAtDesc(projectId, pageable);
        return PageResponse.from(page, activityMapper::toResponse);
    }
}
