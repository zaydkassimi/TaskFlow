package com.taskflow.mapper;

import com.taskflow.dto.response.CommentResponse;
import com.taskflow.entity.Comment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = UserMapper.class)
public interface CommentMapper {

    @Mapping(target = "taskId", source = "task.id")
    CommentResponse toResponse(Comment comment);
}
