package com.taskflow;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.taskflow.dto.response.AuthResponse;
import com.taskflow.dto.response.ProjectResponse;
import com.taskflow.dto.response.TaskResponse;
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
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * Smoke tests for the dashboard summary endpoint.
 */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
class DashboardControllerIntegrationTest {

    private static final String MANAGER_EMAIL = "manager@taskflow.local";
    private static final String MANAGER_PASSWORD = "Manager123!";

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

    @Test
    void summaryRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/dashboard/summary"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void summaryReflectsAssignedWork() throws Exception {
        Session manager = login(MANAGER_EMAIL, MANAGER_PASSWORD);

        MvcResult projectResult = mockMvc.perform(post("/api/projects")
                        .header("Authorization", bearer(manager))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"proj-" + UUID.randomUUID() + "\",\"status\":\"ACTIVE\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        long projectId = jsonMapper.readValue(
                projectResult.getResponse().getContentAsString(StandardCharsets.UTF_8), ProjectResponse.class).id();

        MvcResult taskResult = mockMvc.perform(post("/api/projects/" + projectId + "/tasks")
                        .header("Authorization", bearer(manager))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"dash-task-" + UUID.randomUUID() + "\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        long taskId = jsonMapper.readValue(
                taskResult.getResponse().getContentAsString(StandardCharsets.UTF_8), TaskResponse.class).id();
        mockMvc.perform(patch("/api/tasks/" + taskId + "/assign")
                        .header("Authorization", bearer(manager))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userId\":" + manager.userId() + "}"))
                .andExpect(status().isOk());

        MvcResult result = mockMvc.perform(get("/api/dashboard/summary")
                        .header("Authorization", bearer(manager)))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode summary = jsonMapper.readTree(result.getResponse().getContentAsString(StandardCharsets.UTF_8));
        assertTrue(summary.get("projectCount").asLong() >= 1, "projectCount should include the new project");
        assertTrue(summary.get("activeProjectCount").asLong() >= 1, "activeProjectCount should include the project");
        assertTrue(summary.get("assignedTaskCount").asLong() >= 1, "assignedTaskCount should include the task");
        assertTrue(summary.get("tasksByStatus").get("TODO").asLong() >= 1, "TODO bucket should count the task");
    }
}
