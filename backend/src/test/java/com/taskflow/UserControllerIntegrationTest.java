package com.taskflow;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.taskflow.dto.response.AuthResponse;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import tools.jackson.databind.json.JsonMapper;

/**
 * End-to-end smoke tests for the users module: admin authorization rules, self-service
 * profile endpoints and validation/duplicate handling.
 */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
class UserControllerIntegrationTest {

    private static final String ADMIN_EMAIL = "admin@taskflow.local";
    private static final String ADMIN_PASSWORD = "Admin123!";
    private static final String MEMBER_EMAIL = "member@taskflow.local";
    private static final String MEMBER_PASSWORD = "Member123!";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JsonMapper jsonMapper;

    private record Session(String token, long userId) {
    }

    private Session login(String email, String password) throws Exception {
        String body = "{\"email\":\"%s\",\"password\":\"%s\"}".formatted(email, password);
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andReturn();
        AuthResponse auth = jsonMapper.readValue(
                result.getResponse().getContentAsString(StandardCharsets.UTF_8), AuthResponse.class);
        return new Session(auth.accessToken(), auth.user().id());
    }

    private String bearer(Session session) {
        return "Bearer " + session.token();
    }

    @Test
    void unauthenticatedListIsRejected() throws Exception {
        mockMvc.perform(get("/api/users")).andExpect(status().isUnauthorized());
    }

    @Test
    void memberCannotListUsers() throws Exception {
        Session member = login(MEMBER_EMAIL, MEMBER_PASSWORD);
        mockMvc.perform(get("/api/users").header("Authorization", bearer(member)))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminCanListUsers() throws Exception {
        Session admin = login(ADMIN_EMAIL, ADMIN_PASSWORD);
        mockMvc.perform(get("/api/users").header("Authorization", bearer(admin)))
                .andExpect(status().isOk());
    }

    @Test
    void adminCanCreateUserAndDuplicateIsRejected() throws Exception {
        Session admin = login(ADMIN_EMAIL, ADMIN_PASSWORD);
        String email = "user-" + UUID.randomUUID() + "@taskflow.local";
        String create = """
                {"firstName":"New","lastName":"Person","email":"%s","password":"Secret123!","role":"MANAGER"}
                """.formatted(email);

        MvcResult created = mockMvc.perform(post("/api/users")
                        .header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(create))
                .andExpect(status().isCreated())
                .andReturn();
        assertTrue(created.getResponse().getContentAsString(StandardCharsets.UTF_8).contains(email));

        mockMvc.perform(post("/api/users")
                        .header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(create))
                .andExpect(status().isConflict());
    }

    @Test
    void memberCanReadSelfButNotOthers() throws Exception {
        Session member = login(MEMBER_EMAIL, MEMBER_PASSWORD);
        Session admin = login(ADMIN_EMAIL, ADMIN_PASSWORD);

        mockMvc.perform(get("/api/users/" + member.userId()).header("Authorization", bearer(member)))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/users/" + admin.userId()).header("Authorization", bearer(member)))
                .andExpect(status().isForbidden());
    }

    @Test
    void memberCanUpdateOwnProfile() throws Exception {
        Session member = login(MEMBER_EMAIL, MEMBER_PASSWORD);
        String body = """
                {"firstName":"Member","lastName":"User","email":"%s"}
                """.formatted(MEMBER_EMAIL);
        mockMvc.perform(put("/api/users/me")
                        .header("Authorization", bearer(member))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());
    }

    @Test
    void changePasswordWithWrongCurrentIsRejected() throws Exception {
        Session member = login(MEMBER_EMAIL, MEMBER_PASSWORD);
        String body = """
                {"currentPassword":"totally-wrong","newPassword":"BrandNew123!"}
                """;
        mockMvc.perform(put("/api/users/me/password")
                        .header("Authorization", bearer(member))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminCannotDisableHimself() throws Exception {
        Session admin = login(ADMIN_EMAIL, ADMIN_PASSWORD);
        mockMvc.perform(patch("/api/users/" + admin.userId() + "/status")
                        .header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"enabled\":false}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void createWithInvalidPayloadIsRejected() throws Exception {
        Session admin = login(ADMIN_EMAIL, ADMIN_PASSWORD);
        String body = """
                {"firstName":"","lastName":"","email":"nope","password":"x","role":"MEMBER"}
                """;
        mockMvc.perform(post("/api/users")
                        .header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void unauthenticatedDirectoryIsRejected() throws Exception {
        mockMvc.perform(get("/api/users/directory")).andExpect(status().isUnauthorized());
    }

    @Test
    void anyAuthenticatedUserCanReadDirectory() throws Exception {
        Session member = login(MEMBER_EMAIL, MEMBER_PASSWORD);
        MvcResult result = mockMvc.perform(get("/api/users/directory")
                        .header("Authorization", bearer(member)))
                .andExpect(status().isOk())
                .andReturn();
        assertTrue(result.getResponse().getContentAsString(StandardCharsets.UTF_8)
                .contains("admin@taskflow.local"));
        assertTrue(result.getResponse().getContentAsString(StandardCharsets.UTF_8)
                .contains(MEMBER_EMAIL));
    }

    @Test
    void memberCannotDeleteUsers() throws Exception {
        Session member = login(MEMBER_EMAIL, MEMBER_PASSWORD);
        assertEquals(403, mockMvc.perform(delete("/api/users/" + (member.userId() + 1))
                        .header("Authorization", bearer(member)))
                .andReturn().getResponse().getStatus());
    }
}
