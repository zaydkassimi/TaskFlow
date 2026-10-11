package com.taskflow.controller;

import com.taskflow.dto.request.AddProjectMemberRequest;
import com.taskflow.dto.request.CreateProjectRequest;
import com.taskflow.dto.request.UpdateProjectRequest;
import com.taskflow.dto.response.PageResponse;
import com.taskflow.dto.response.ProjectResponse;
import com.taskflow.dto.response.ProjectSummaryResponse;
import com.taskflow.dto.response.UserSummaryResponse;
import com.taskflow.entity.enums.ProjectStatus;
import com.taskflow.security.SecurityUtils;
import com.taskflow.service.ProjectService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Project CRUD and membership endpoints. Authorization is enforced in the service.
 */
@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private static final int MAX_PAGE_SIZE = 100;

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping
    public PageResponse<ProjectSummaryResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) ProjectStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "false") boolean mine) {
        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.max(1, Math.min(size, MAX_PAGE_SIZE)),
                Sort.by(Sort.Direction.DESC, "createdAt"));
        return projectService.list(SecurityUtils.currentPrincipal(), pageable, status, search, mine);
    }

    @GetMapping("/{id}")
    public ProjectResponse get(@PathVariable Long id) {
        return projectService.get(id, SecurityUtils.currentPrincipal());
    }

    @PostMapping
    public ResponseEntity<ProjectResponse> create(@Valid @RequestBody CreateProjectRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(projectService.create(request, SecurityUtils.currentPrincipal()));
    }

    @PutMapping("/{id}")
    public ProjectResponse update(@PathVariable Long id, @Valid @RequestBody UpdateProjectRequest request) {
        return projectService.update(id, request, SecurityUtils.currentPrincipal());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        projectService.delete(id, SecurityUtils.currentPrincipal());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/members")
    public List<UserSummaryResponse> members(@PathVariable Long id) {
        return projectService.listMembers(id, SecurityUtils.currentPrincipal());
    }

    @PostMapping("/{id}/members")
    public ProjectResponse addMember(@PathVariable Long id, @Valid @RequestBody AddProjectMemberRequest request) {
        return projectService.addMember(id, request.userId(), SecurityUtils.currentPrincipal());
    }

    @DeleteMapping("/{id}/members/{userId}")
    public ResponseEntity<Void> removeMember(@PathVariable Long id, @PathVariable Long userId) {
        projectService.removeMember(id, userId, SecurityUtils.currentPrincipal());
        return ResponseEntity.noContent().build();
    }
}
