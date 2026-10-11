package com.taskflow.service;

import com.taskflow.dto.request.ChangePasswordRequest;
import com.taskflow.dto.request.CreateUserRequest;
import com.taskflow.dto.request.UpdateProfileRequest;
import com.taskflow.dto.request.UpdateUserRequest;
import com.taskflow.dto.response.PageResponse;
import com.taskflow.dto.response.UserResponse;
import com.taskflow.dto.response.UserSummaryResponse;
import com.taskflow.entity.User;
import com.taskflow.entity.enums.Role;
import com.taskflow.exception.DuplicateResourceException;
import com.taskflow.exception.ResourceNotFoundException;
import com.taskflow.exception.UnauthorizedOperationException;
import com.taskflow.mapper.UserMapper;
import com.taskflow.repository.UserRepository;
import com.taskflow.repository.specification.UserSpecifications;
import java.util.List;
import java.util.Locale;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * User administration and self-service profile management.
 */
@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, UserMapper userMapper) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.userMapper = userMapper;
    }

    @Transactional(readOnly = true)
    public PageResponse<UserResponse> list(Pageable pageable, Role role, String search) {
        return PageResponse.from(
                userRepository.findAll(UserSpecifications.withFilters(role, search), pageable),
                userMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public List<UserSummaryResponse> directory() {
        return userRepository.findByEnabledTrueOrderByLastNameAscFirstNameAsc().stream()
                .map(userMapper::toSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public UserResponse get(Long id) {
        return userMapper.toResponse(getEntity(id));
    }

    @Transactional
    public UserResponse create(CreateUserRequest request) {
        String email = normalize(request.email());
        if (userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("An account with email " + email + " already exists");
        }
        User user = new User();
        user.setFirstName(request.firstName().trim());
        user.setLastName(request.lastName().trim());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRole(request.role());
        user.setEnabled(request.enabled() == null || request.enabled());
        return userMapper.toResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse update(Long id, UpdateUserRequest request) {
        User user = getEntity(id);
        String email = normalize(request.email());
        ensureEmailAvailable(user, email);
        user.setFirstName(request.firstName().trim());
        user.setLastName(request.lastName().trim());
        user.setEmail(email);
        user.setRole(request.role());
        user.setEnabled(request.enabled());
        return userMapper.toResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = getEntity(userId);
        String email = normalize(request.email());
        ensureEmailAvailable(user, email);
        user.setFirstName(request.firstName().trim());
        user.setLastName(request.lastName().trim());
        user.setEmail(email);
        return userMapper.toResponse(userRepository.save(user));
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = getEntity(userId);
        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new UnauthorizedOperationException("Current password is incorrect");
        }
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    @Transactional
    public UserResponse setEnabled(Long id, boolean enabled, Long actingUserId) {
        if (id.equals(actingUserId) && !enabled) {
            throw new UnauthorizedOperationException("You cannot disable your own account");
        }
        User user = getEntity(id);
        user.setEnabled(enabled);
        return userMapper.toResponse(userRepository.save(user));
    }

    @Transactional
    public void delete(Long id, Long actingUserId) {
        if (id.equals(actingUserId)) {
            throw new UnauthorizedOperationException("You cannot delete your own account");
        }
        User user = getEntity(id);
        userRepository.delete(user);
    }

    private User getEntity(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
    }

    private void ensureEmailAvailable(User current, String email) {
        if (!current.getEmail().equals(email) && userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("An account with email " + email + " already exists");
        }
    }

    private String normalize(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }
}
