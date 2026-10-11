package com.taskflow.service;

import com.taskflow.entity.ActivityLog;
import com.taskflow.entity.Project;
import com.taskflow.entity.Task;
import com.taskflow.entity.User;
import com.taskflow.entity.enums.ActivityType;
import com.taskflow.repository.ActivityLogRepository;
import org.springframework.stereotype.Service;

/**
 * Writes the project activity trail consumed by the activity feed.
 */
@Service
public class ActivityService {

    private final ActivityLogRepository activityLogRepository;

    public ActivityService(ActivityLogRepository activityLogRepository) {
        this.activityLogRepository = activityLogRepository;
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
}
