package com.taskflow;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.taskflow.dto.response.AuthResponse;
import com.taskflow.dto.response.CommentResponse;
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
 * Smoke tests for the comments module: visibility, authorship and moderation rules.
 */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
class CommentControllerIntegrationTest {

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

    private record Fixture(Session manager, Session member, long projectId, long taskId) {
    }

    private Fixture setUpProjectWithMemberAndTask() throws Exception {
        Session manager = login(MANAGER_EMAIL, MANAGER_PASSWORD);
        Session member = login(MEMBER_EMAIL, MEMBER_PASSWORD);

        MvcResult projectResult = mockMvc.perform(post("/api/projects")
                        .header("Authorization", bearer(manager))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"proj-" + UUID.randomUUID() + "\",\"status\":\"ACTIVE\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        ProjectResponse project = jsonMapper.readValue(
                projectResult.getResponse().getContentAsString(StandardCharsets.UTF_8), ProjectResponse.class);

        mockMvc.perform(post("/api/projects/" + project.id() + "/members")
                        .header("Authorization", bearer(manager))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userId\":" + member.userId() + "}"))
                .andExpect(status().isOk());

        MvcResult taskResult = mockMvc.perform(post("/api/projects/" + project.id() + "/tasks")
                        .header("Authorization", bearer(manager))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"task-" + UUID.randomUUID() + "\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        TaskResponse task = jsonMapper.readValue(
                taskResult.getResponse().getContentAsString(StandardCharsets.UTF_8), TaskResponse.class);

        return new Fixture(manager, member, project.id(), task.id());
    }

    private CommentResponse postComment(Session author, long taskId, String content) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/tasks/" + taskId + "/comments")
                        .header("Authorization", bearer(author))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"%s\"}".formatted(content)))
                .andExpect(status().isCreated())
                .andReturn();
        return jsonMapper.readValue(
                result.getResponse().getContentAsString(StandardCharsets.UTF_8), CommentResponse.class);
    }

    @Test
    void memberCommentAppearsInList() throws Exception {
        Fixture fixture = setUpProjectWithMemberAndTask();
        CommentResponse comment = postComment(fixture.member(), fixture.taskId(), "hello team");
        assertEquals(fixture.member().userId(), comment.author().id());

        MvcResult result = mockMvc.perform(get("/api/tasks/" + fixture.taskId() + "/comments")
                        .header("Authorization", bearer(fixture.manager())))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode comments = jsonMapper.readTree(result.getResponse().getContentAsString(StandardCharsets.UTF_8));
        assertEquals(1, comments.size());
        assertEquals(comment.id(), comments.get(0).get("id").asLong());
    }

    @Test
    void nonMemberCannotCommentOrList() throws Exception {
        Fixture fixture = setUpProjectWithMemberAndTask();
        Session other = login("admin@taskflow.local", "Admin123!");

        MvcResult freshProject = mockMvc.perform(post("/api/projects")
                        .header("Authorization", bearer(other))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"proj-" + UUID.randomUUID() + "\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        long privateProjectId = jsonMapper.readValue(
                freshProject.getResponse().getContentAsString(StandardCharsets.UTF_8), ProjectResponse.class).id();
        long privateTaskId = jsonMapper.readValue(
                mockMvc.perform(post("/api/projects/" + privateProjectId + "/tasks")
                                .header("Authorization", bearer(other))
                                .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"private\"}"))
                        .andExpect(status().isCreated()).andReturn()
                        .getResponse().getContentAsString(StandardCharsets.UTF_8), TaskResponse.class).id();

        mockMvc.perform(get("/api/tasks/" + privateTaskId + "/comments")
                        .header("Authorization", bearer(fixture.member())))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/tasks/" + privateTaskId + "/comments")
                        .header("Authorization", bearer(fixture.member()))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"content\":\"sneaky\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void managerCannotEditMembersComment() throws Exception {
        Fixture fixture = setUpProjectWithMemberAndTask();
        CommentResponse comment = postComment(fixture.member(), fixture.taskId(), "mine");

        mockMvc.perform(put("/api/comments/" + comment.id())
                        .header("Authorization", bearer(fixture.manager()))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"content\":\"edited\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void authorEditsOwnComment() throws Exception {
        Fixture fixture = setUpProjectWithMemberAndTask();
        CommentResponse comment = postComment(fixture.member(), fixture.taskId(), "original");

        MvcResult result = mockMvc.perform(put("/api/comments/" + comment.id())
                        .header("Authorization", bearer(fixture.member()))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"content\":\"updated\"}"))
                .andExpect(status().isOk())
                .andReturn();
        CommentResponse updated = jsonMapper.readValue(
                result.getResponse().getContentAsString(StandardCharsets.UTF_8), CommentResponse.class);
        assertEquals("updated", updated.content());
    }

    @Test
    void authorDeletesOwnComment() throws Exception {
        Fixture fixture = setUpProjectWithMemberAndTask();
        CommentResponse comment = postComment(fixture.member(), fixture.taskId(), "remove-me");

        mockMvc.perform(delete("/api/comments/" + comment.id())
                        .header("Authorization", bearer(fixture.member())))
                .andExpect(status().isNoContent());
    }

    @Test
    void managerCanDeleteMembersComment() throws Exception {
        Fixture fixture = setUpProjectWithMemberAndTask();
        CommentResponse comment = postComment(fixture.member(), fixture.taskId(), "moderate-me");

        mockMvc.perform(delete("/api/comments/" + comment.id())
                        .header("Authorization", bearer(fixture.manager())))
                .andExpect(status().isNoContent());
    }
}
