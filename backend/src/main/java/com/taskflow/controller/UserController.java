package com.taskflow.controller;

import com.taskflow.dto.request.ChangePasswordRequest;
import com.taskflow.dto.request.CreateUserRequest;
import com.taskflow.dto.request.UpdateProfileRequest;
import com.taskflow.dto.request.UpdateStatusRequest;
import com.taskflow.dto.request.UpdateUserRequest;
import com.taskflow.dto.response.PageResponse;
import com.taskflow.dto.response.UserResponse;
import com.taskflow.dto.response.UserSummaryResponse;
import com.taskflow.entity.enums.Role;
import com.taskflow.security.SecurityUtils;
import com.taskflow.service.UserService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * User administration (ADMIN) and self-service profile endpoints.
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    private static final int MAX_PAGE_SIZE = 100;

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public PageResponse<UserResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) String search) {
        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.max(1, Math.min(size, MAX_PAGE_SIZE)),
                Sort.by(Sort.Direction.DESC, "createdAt"));
        return userService.list(pageable, role, search);
    }

    @GetMapping("/directory")
    public List<UserSummaryResponse> directory() {
        return userService.directory();
    }

    @GetMapping("/me")
    public UserResponse me() {
        return userService.get(SecurityUtils.currentUserId());
    }

    @PutMapping("/me")
    public UserResponse updateMe(@Valid @RequestBody UpdateProfileRequest request) {
        return userService.updateProfile(SecurityUtils.currentUserId(), request);
    }

    @PutMapping("/me/password")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(SecurityUtils.currentUserId(), request);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or #id == authentication.principal.id")
    public UserResponse get(@PathVariable Long id) {
        return userService.get(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> create(@Valid @RequestBody CreateUserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse update(@PathVariable Long id, @Valid @RequestBody UpdateUserRequest request) {
        return userService.update(id, request);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse setStatus(@PathVariable Long id, @Valid @RequestBody UpdateStatusRequest request) {
        return userService.setEnabled(id, request.enabled(), SecurityUtils.currentUserId());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        userService.delete(id, SecurityUtils.currentUserId());
        return ResponseEntity.noContent().build();
    }
}
