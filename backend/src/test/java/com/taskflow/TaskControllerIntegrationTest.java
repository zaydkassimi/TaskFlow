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
 * Smoke tests for the tasks module: creation, assignment and status rules across roles.
 */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
class TaskControllerIntegrationTest {

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
        String body = "{\"name\":\"proj-" + UUID.randomUUID() + "\",\"status\":\"ACTIVE\"}";
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

    private TaskResponse createTask(Session actor, long projectId, String title, String priority) throws Exception {
        String body = "{\"title\":\"%s\",\"priority\":\"%s\"}".formatted(title, priority);
        MvcResult result = mockMvc.perform(post("/api/projects/" + projectId + "/tasks")
                        .header("Authorization", bearer(actor))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andReturn();
        return jsonMapper.readValue(
                result.getResponse().getContentAsString(StandardCharsets.UTF_8), TaskResponse.class);
    }

    @Test
    void memberCreatesTaskInProjectTheyBelongTo() throws Exception {
        Session manager = login(MANAGER_EMAIL, MANAGER_PASSWORD);
        Session member = login(MEMBER_EMAIL, MEMBER_PASSWORD);
        ProjectResponse project = createProject(manager);
        addMember(manager, project.id(), member.userId());

        TaskResponse task = createTask(member, project.id(), "member-task", "MEDIUM");
        assertEquals("TODO", task.status().name());
        assertEquals(member.userId(), task.createdBy().id());
    }

    @Test
    void nonMemberCannotListOrCreateTasks() throws Exception {
        Session manager = login(MANAGER_EMAIL, MANAGER_PASSWORD);
        Session member = login(MEMBER_EMAIL, MEMBER_PASSWORD);
        ProjectResponse project = createProject(manager);

        mockMvc.perform(get("/api/projects/" + project.id() + "/tasks")
                        .header("Authorization", bearer(member)))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/projects/" + project.id() + "/tasks")
                        .header("Authorization", bearer(member))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"nope\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void ownerAssignsTaskAndAssigneeAdvancesStatus() throws Exception {
        Session manager = login(MANAGER_EMAIL, MANAGER_PASSWORD);
        Session member = login(MEMBER_EMAIL, MEMBER_PASSWORD);
        ProjectResponse project = createProject(manager);
        addMember(manager, project.id(), member.userId());
        TaskResponse task = createTask(manager, project.id(), "assign-me", "HIGH");

        MvcResult assigned = mockMvc.perform(patch("/api/tasks/" + task.id() + "/assign")
                        .header("Authorization", bearer(manager))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userId\":" + member.userId() + "}"))
                .andExpect(status().isOk())
                .andReturn();
        TaskResponse afterAssign = jsonMapper.readValue(
                assigned.getResponse().getContentAsString(StandardCharsets.UTF_8), TaskResponse.class);
        assertEquals(member.userId(), afterAssign.assignedTo().id());

        MvcResult advanced = mockMvc.perform(patch("/api/tasks/" + task.id() + "/status")
                        .header("Authorization", bearer(member))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"IN_PROGRESS\"}"))
                .andExpect(status().isOk())
                .andReturn();
        TaskResponse afterStatus = jsonMapper.readValue(
                advanced.getResponse().getContentAsString(StandardCharsets.UTF_8), TaskResponse.class);
        assertEquals("IN_PROGRESS", afterStatus.status().name());
    }

    @Test
    void assignToNonMemberIsRejected() throws Exception {
        Session manager = login(MANAGER_EMAIL, MANAGER_PASSWORD);
        Session member = login(MEMBER_EMAIL, MEMBER_PASSWORD);
        ProjectResponse project = createProject(manager);
        TaskResponse task = createTask(manager, project.id(), "assign-fail", "LOW");

        mockMvc.perform(patch("/api/tasks/" + task.id() + "/assign")
                        .header("Authorization", bearer(manager))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userId\":" + member.userId() + "}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void plainMemberCannotUpdateOthersTask() throws Exception {
        Session manager = login(MANAGER_EMAIL, MANAGER_PASSWORD);
        Session member = login(MEMBER_EMAIL, MEMBER_PASSWORD);
        ProjectResponse project = createProject(manager);
        addMember(manager, project.id(), member.userId());
        TaskResponse task = createTask(manager, project.id(), "no-edit", "MEDIUM");

        mockMvc.perform(put("/api/tasks/" + task.id())
                        .header("Authorization", bearer(member))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"hacked\",\"priority\":\"URGENT\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void ownerUpdatesAndDeletesTask() throws Exception {
        Session manager = login(MANAGER_EMAIL, MANAGER_PASSWORD);
        ProjectResponse project = createProject(manager);
        TaskResponse task = createTask(manager, project.id(), "editable", "LOW");

        mockMvc.perform(put("/api/tasks/" + task.id())
                        .header("Authorization", bearer(manager))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"updated\",\"description\":\"d\",\"priority\":\"URGENT\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/tasks/" + task.id()).header("Authorization", bearer(manager)))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/tasks/" + task.id()).header("Authorization", bearer(manager)))
                .andExpect(status().isNotFound());
    }

    @Test
    void listByProjectFiltersByPriority() throws Exception {
        Session manager = login(MANAGER_EMAIL, MANAGER_PASSWORD);
        ProjectResponse project = createProject(manager);
        TaskResponse high = createTask(manager, project.id(), "high-" + UUID.randomUUID(), "HIGH");
        createTask(manager, project.id(), "low-" + UUID.randomUUID(), "LOW");

        MvcResult result = mockMvc.perform(get("/api/projects/" + project.id() + "/tasks")
                        .param("priority", "HIGH")
                        .header("Authorization", bearer(manager)))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode page = jsonMapper.readTree(result.getResponse().getContentAsString(StandardCharsets.UTF_8));
        assertEquals(1, page.get("totalElements").asLong());
        assertEquals(high.id(), page.get("content").get(0).get("id").asLong());
    }

    @Test
    void myTasksReturnsAssignedTasks() throws Exception {
        Session manager = login(MANAGER_EMAIL, MANAGER_PASSWORD);
        ProjectResponse project = createProject(manager);
        TaskResponse task = createTask(manager, project.id(), "mine-" + UUID.randomUUID(), "MEDIUM");
        mockMvc.perform(patch("/api/tasks/" + task.id() + "/assign")
                        .header("Authorization", bearer(manager))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userId\":" + manager.userId() + "}"))
                .andExpect(status().isOk());

        MvcResult result = mockMvc.perform(get("/api/tasks/me").header("Authorization", bearer(manager)))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode page = jsonMapper.readTree(result.getResponse().getContentAsString(StandardCharsets.UTF_8));
        boolean found = false;
        for (JsonNode node : page.get("content")) {
            if (node.get("id").asLong() == task.id()) {
                found = true;
                break;
            }
        }
        assertTrue(found, "the assigned task should appear in /api/tasks/me");
    }

    @Test
    void plainMemberCannotChangeStatusOfUnassignedTask() throws Exception {
        Session manager = login(MANAGER_EMAIL, MANAGER_PASSWORD);
        Session member = login(MEMBER_EMAIL, MEMBER_PASSWORD);
        ProjectResponse project = createProject(manager);
        addMember(manager, project.id(), member.userId());
        TaskResponse task = createTask(manager, project.id(), "not-yours", "MEDIUM");

        mockMvc.perform(patch("/api/tasks/" + task.id() + "/status")
                        .header("Authorization", bearer(member))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"DONE\"}"))
                .andExpect(status().isForbidden());
    }
}
