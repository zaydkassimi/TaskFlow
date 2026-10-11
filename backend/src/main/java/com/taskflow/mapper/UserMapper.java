package com.taskflow.mapper;

import com.taskflow.dto.response.UserResponse;
import com.taskflow.dto.response.UserSummaryResponse;
import com.taskflow.entity.User;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserMapper {

    UserResponse toResponse(User user);

    UserSummaryResponse toSummary(User user);
}
