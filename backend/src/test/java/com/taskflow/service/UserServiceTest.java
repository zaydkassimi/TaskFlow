package com.taskflow.service;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import com.taskflow.dto.request.ChangePasswordRequest;
import com.taskflow.dto.request.CreateUserRequest;
import com.taskflow.dto.request.UpdateUserRequest;
import com.taskflow.entity.User;
import com.taskflow.entity.enums.Role;
import com.taskflow.exception.DuplicateResourceException;
import com.taskflow.exception.UnauthorizedOperationException;
import com.taskflow.mapper.UserMapper;
import com.taskflow.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private UserMapper userMapper;

    @InjectMocks
    private UserService userService;

    private User user(long id, String email) {
        User user = new User();
        user.setId(id);
        user.setFirstName("Jane");
        user.setLastName("Doe");
        user.setEmail(email);
        user.setPassword("hash");
        user.setRole(Role.MEMBER);
        user.setEnabled(true);
        return user;
    }

    @Test
    void createRejectsDuplicateEmail() {
        when(userRepository.existsByEmail("dup@taskflow.local")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> userService.create(
                new CreateUserRequest("A", "B", "dup@taskflow.local", "Password1", Role.MEMBER, true)));
    }

    @Test
    void updateRejectsEmailOwnedByAnotherUser() {
        when(userRepository.findById(5L)).thenReturn(Optional.of(user(5L, "old@taskflow.local")));
        when(userRepository.existsByEmail("taken@taskflow.local")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> userService.update(5L,
                new UpdateUserRequest("A", "B", "taken@taskflow.local", Role.MEMBER, true)));
    }

    @Test
    void changePasswordRejectsWrongCurrentPassword() {
        when(userRepository.findById(5L)).thenReturn(Optional.of(user(5L, "jane@taskflow.local")));
        when(passwordEncoder.matches("wrong", "hash")).thenReturn(false);

        assertThrows(UnauthorizedOperationException.class,
                () -> userService.changePassword(5L, new ChangePasswordRequest("wrong", "NewPassword1")));
    }

    @Test
    void setEnabledRejectsSelfDisable() {
        assertThrows(UnauthorizedOperationException.class, () -> userService.setEnabled(5L, false, 5L));
    }

    @Test
    void deleteRejectsSelfDeletion() {
        assertThrows(UnauthorizedOperationException.class, () -> userService.delete(5L, 5L));
    }
}
