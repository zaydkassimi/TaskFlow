package com.taskflow;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.taskflow.dto.response.AuthResponse;
import com.taskflow.dto.response.ProjectResponse;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import tools.jackson.databind.json.JsonMapper;

/**
 * Smoke tests for the projects module: creation rules, membership-scoped visibility and
 * owner/admin management rules.
 */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
class ProjectControllerIntegrationTest {

    private static final String ADMIN_EMAIL = "admin@taskflow.local";
    private static final String ADMIN_PASSWORD = "Admin123!";
    private static final String MANAGER_EMAIL = "manager@taskflow.local";
    private static final String MANAGER_PASSWORD = "Manager123!";
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
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andReturn();
        AuthResponse auth = jsonMapper.readValue(
                result.getResponse().getContentAsString(StandardCharsets.UTF_8), AuthResponse.class);
        return new Session(auth.accessToken(), auth.user().id());
    }

    private String bearer(Session session) {
        return "Bearer " + session.token();
    }

    private ProjectResponse createProject(Session session, String name) throws Exception {
        String body = """
                {"name":"%s","description":"integration test","status":"ACTIVE"}
                """.formatted(name);
        MvcResult result = mockMvc.perform(post("/api/projects")
                        .header("Authorization", bearer(session))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andReturn();
        return jsonMapper.readValue(
                result.getResponse().getContentAsString(StandardCharsets.UTF_8), ProjectResponse.class);
    }

    private void addMember(Session actor, long projectId, long userId) throws Exception {
        mockMvc.perform(post("/api/projects/" + projectId + "/members")
                        .header("Authorization", bearer(actor))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userId\":" + userId + "}"))
                .andExpect(status().isOk());
    }

    @Test
    void memberCannotCreateProject() throws Exception {
        Session member = login(MEMBER_EMAIL, MEMBER_PASSWORD);
        mockMvc.perform(post("/api/projects")
                        .header("Authorization", bearer(member))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Nope\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void managerCreatesProjectAndBecomesOwnerMember() throws Exception {
        Session manager = login(MANAGER_EMAIL, MANAGER_PASSWORD);
        ProjectResponse project = createProject(manager, "proj-" + UUID.randomUUID());
        assertEquals(manager.userId(), project.createdBy().id());
        assertEquals(1, project.memberCount());
    }

    @Test
    void nonMemberCannotViewProject() throws Exception {
        Session manager = login(MANAGER_EMAIL, MANAGER_PASSWORD);
        Session member = login(MEMBER_EMAIL, MEMBER_PASSWORD);
        ProjectResponse project = createProject(manager, "proj-" + UUID.randomUUID());
        mockMvc.perform(get("/api/projects/" + project.id()).header("Authorization", bearer(member)))
                .andExpect(status().isForbidden());
    }

    @Test
    void managerAddsMemberThenMemberCanViewAndBeRemoved() throws Exception {
        Session manager = login(MANAGER_EMAIL, MANAGER_PASSWORD);
        Session member = login(MEMBER_EMAIL, MEMBER_PASSWORD);
        ProjectResponse project = createProject(manager, "proj-" + UUID.randomUUID());

        addMember(manager, project.id(), member.userId());
        mockMvc.perform(get("/api/projects/" + project.id()).header("Authorization", bearer(member)))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/projects/" + project.id() + "/members/" + member.userId())
                        .header("Authorization", bearer(manager)))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/projects/" + project.id()).header("Authorization", bearer(member)))
                .andExpect(status().isForbidden());
    }

    @Test
    void plainMemberCannotUpdateProject() throws Exception {
        Session manager = login(MANAGER_EMAIL, MANAGER_PASSWORD);
        Session member = login(MEMBER_EMAIL, MEMBER_PASSWORD);
        ProjectResponse project = createProject(manager, "proj-" + UUID.randomUUID());
        addMember(manager, project.id(), member.userId());

        mockMvc.perform(put("/api/projects/" + project.id())
                        .header("Authorization", bearer(member))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Updated\",\"status\":\"COMPLETED\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void ownerCanUpdateAndDeleteProject() throws Exception {
        Session manager = login(MANAGER_EMAIL, MANAGER_PASSWORD);
        ProjectResponse project = createProject(manager, "proj-" + UUID.randomUUID());

        mockMvc.perform(put("/api/projects/" + project.id())
                        .header("Authorization", bearer(manager))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Updated\",\"description\":\"d\",\"status\":\"COMPLETED\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/projects/" + project.id()).header("Authorization", bearer(manager)))
                .andExpect(status().isNoContent());
    }

    @Test
    void adminCanViewAnyProject() throws Exception {
        Session manager = login(MANAGER_EMAIL, MANAGER_PASSWORD);
        Session admin = login(ADMIN_EMAIL, ADMIN_PASSWORD);
        ProjectResponse project = createProject(manager, "proj-" + UUID.randomUUID());
        mockMvc.perform(get("/api/projects/" + project.id()).header("Authorization", bearer(admin)))
                .andExpect(status().isOk());
    }

    @Test
    void ownerCannotBeRemovedFromProject() throws Exception {
        Session manager = login(MANAGER_EMAIL, MANAGER_PASSWORD);
        ProjectResponse project = createProject(manager, "proj-" + UUID.randomUUID());
        mockMvc.perform(delete("/api/projects/" + project.id() + "/members/" + manager.userId())
                        .header("Authorization", bearer(manager)))
                .andExpect(status().isForbidden());
    }
}
