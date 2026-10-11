package com.taskflow;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.taskflow.dto.response.AuthResponse;
import com.taskflow.dto.response.ProjectResponse;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * Smoke tests for the project activity feed.
 */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
class ActivityControllerIntegrationTest {

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

    private ProjectResponse createProject(Session session) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/projects")
                        .header("Authorization", bearer(session))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"proj-" + UUID.randomUUID() + "\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        return jsonMapper.readValue(
                result.getResponse().getContentAsString(StandardCharsets.UTF_8), ProjectResponse.class);
    }

    @Test
    void feedRecordsProjectAndTaskActivity() throws Exception {
        Session manager = login(MANAGER_EMAIL, MANAGER_PASSWORD);
        ProjectResponse project = createProject(manager);
        mockMvc.perform(post("/api/projects/" + project.id() + "/tasks")
                        .header("Authorization", bearer(manager))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"feed-task\"}"))
                .andExpect(status().isCreated());

        MvcResult result = mockMvc.perform(get("/api/projects/" + project.id() + "/activities")
                        .header("Authorization", bearer(manager)))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode page = jsonMapper.readTree(result.getResponse().getContentAsString(StandardCharsets.UTF_8));
        Set<String> types = new HashSet<>();
        for (JsonNode node : page.get("content")) {
            types.add(node.get("type").asString());
        }
        assertTrue(types.contains("PROJECT_CREATED"), "expected PROJECT_CREATED in feed: " + types);
        assertTrue(types.contains("TASK_CREATED"), "expected TASK_CREATED in feed: " + types);
    }

    @Test
    void nonMemberCannotViewFeed() throws Exception {
        Session manager = login(MANAGER_EMAIL, MANAGER_PASSWORD);
        Session member = login(MEMBER_EMAIL, MEMBER_PASSWORD);
        ProjectResponse project = createProject(manager);

        mockMvc.perform(get("/api/projects/" + project.id() + "/activities")
                        .header("Authorization", bearer(member)))
                .andExpect(status().isForbidden());
    }
}
