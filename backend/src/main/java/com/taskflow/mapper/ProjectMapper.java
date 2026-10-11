package com.taskflow.mapper;

import com.taskflow.dto.response.ProjectResponse;
import com.taskflow.dto.response.ProjectSummaryResponse;
import com.taskflow.entity.Project;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = UserMapper.class)
public interface ProjectMapper {

    ProjectSummaryResponse toSummary(Project project);

    @Mapping(target = "memberCount", expression = "java(project.getMembers().size())")
    ProjectResponse toResponse(Project project);
}
