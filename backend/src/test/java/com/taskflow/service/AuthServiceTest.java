package com.taskflow.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.taskflow.config.JwtProperties;
import com.taskflow.dto.request.LoginRequest;
import com.taskflow.dto.request.RegisterRequest;
import com.taskflow.entity.User;
import com.taskflow.entity.enums.Role;
import com.taskflow.exception.DuplicateResourceException;
import com.taskflow.exception.ResourceNotFoundException;
import com.taskflow.mapper.UserMapper;
import com.taskflow.repository.UserRepository;
import com.taskflow.security.JwtService;
import com.taskflow.security.UserPrincipal;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private JwtService jwtService;
    @Mock
    private RefreshTokenService refreshTokenService;
    @Mock
    private UserMapper userMapper;
    @Mock
    private JwtProperties jwtProperties;

    @InjectMocks
    private AuthService authService;

    private User user(long id, String email, Role role) {
        User user = new User();
        user.setId(id);
        user.setFirstName("Jane");
        user.setLastName("Doe");
        user.setEmail(email);
        user.setPassword("hash");
        user.setRole(role);
        user.setEnabled(true);
        return user;
    }

    @Test
    void registerNormalizesEmailEncodesPasswordAndAssignsMemberRole() {
        when(userRepository.existsByEmail("jane@taskflow.local")).thenReturn(false);
        when(passwordEncoder.encode("Password1")).thenReturn("ENC");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(jwtService.createAccessToken(any(User.class))).thenReturn("access");
        when(refreshTokenService.issueToken(any(User.class))).thenReturn("refresh");
        when(userMapper.toResponse(any(User.class))).thenReturn(null);
        when(jwtProperties.accessTtlSeconds()).thenReturn(900L);

        AuthResult result = authService.register(
                new RegisterRequest("Jane", "Doe", "  Jane@Taskflow.Local ", "Password1"));

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User saved = captor.getValue();
        assertEquals("jane@taskflow.local", saved.getEmail());
        assertEquals("ENC", saved.getPassword());
        assertEquals(Role.MEMBER, saved.getRole());
        assertEquals("access", result.response().accessToken());
        assertEquals("refresh", result.refreshToken());
    }

    @Test
    void registerRejectsDuplicateEmail() {
        when(userRepository.existsByEmail("dup@taskflow.local")).thenReturn(true);

        assertThrows(DuplicateResourceException.class,
                () -> authService.register(new RegisterRequest("A", "B", "dup@taskflow.local", "Password1")));
    }

    @Test
    void loginIssuesTokensForAuthenticatedPrincipal() {
        User user = user(1L, "jane@taskflow.local", Role.MEMBER);
        UserPrincipal principal = UserPrincipal.from(user);
        when(authenticationManager.authenticate(any()))
                .thenReturn(new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(jwtService.createAccessToken(user)).thenReturn("access");
        when(refreshTokenService.issueToken(user)).thenReturn("refresh");
        when(userMapper.toResponse(user)).thenReturn(null);
        when(jwtProperties.accessTtlSeconds()).thenReturn(900L);

        AuthResult result = authService.login(new LoginRequest("Jane@Taskflow.Local", "Password1"));

        assertEquals("access", result.response().accessToken());
        assertEquals("refresh", result.refreshToken());
    }

    @Test
    void currentUserThrowsWhenMissing() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> authService.currentUser(99L));
    }
}
