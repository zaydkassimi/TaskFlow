package com.taskflow.config;

import com.taskflow.entity.User;
import com.taskflow.entity.enums.Role;
import com.taskflow.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Creates one account per role on startup when {@code app.seed.enabled} is true. Existing
 * emails are left untouched, so repeated restarts are safe.
 */
@Component
public class DataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final SeedProperties seedProperties;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(SeedProperties seedProperties, UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.seedProperties = seedProperties;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!seedProperties.enabled()) {
            return;
        }
        seed("Admin", "User", seedProperties.adminEmail(), seedProperties.adminPassword(), Role.ADMIN);
        seed("Manager", "User", seedProperties.managerEmail(), seedProperties.managerPassword(), Role.MANAGER);
        seed("Member", "User", seedProperties.memberEmail(), seedProperties.memberPassword(), Role.MEMBER);
    }

    private void seed(String firstName, String lastName, String email, String rawPassword, Role role) {
        if (email == null || email.isBlank() || userRepository.existsByEmail(email)) {
            return;
        }
        User user = new User();
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setRole(role);
        user.setEnabled(true);
        userRepository.save(user);
        log.info("Seeded {} account for {}", role, email);
    }
}
