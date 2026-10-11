package com.taskflow.controller;

import com.taskflow.dto.response.ActivityResponse;
import com.taskflow.dto.response.PageResponse;
import com.taskflow.security.SecurityUtils;
import com.taskflow.service.ActivityService;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Project activity feed.
 */
@RestController
@RequestMapping("/api/projects/{projectId}/activities")
public class ActivityController {

    private static final int MAX_PAGE_SIZE = 100;

    private final ActivityService activityService;

    public ActivityController(ActivityService activityService) {
        this.activityService = activityService;
    }

    @GetMapping
    public PageResponse<ActivityResponse> feed(
            @PathVariable Long projectId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.max(1, Math.min(size, MAX_PAGE_SIZE)),
                Sort.by(Sort.Direction.DESC, "createdAt"));
        return activityService.feed(projectId, SecurityUtils.currentPrincipal(), pageable);
    }
}
