package com.taskflow.mapper;

import com.taskflow.dto.response.ActivityResponse;
import com.taskflow.entity.ActivityLog;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = UserMapper.class)
public interface ActivityMapper {

    @Mapping(target = "projectId", source = "project.id")
    @Mapping(target = "taskId", source = "task.id")
    ActivityResponse toResponse(ActivityLog activityLog);
}
