CREATE TABLE users (
    id          BIGSERIAL PRIMARY KEY,
    first_name  VARCHAR(80)  NOT NULL,
    last_name   VARCHAR(80)  NOT NULL,
    email       VARCHAR(180) NOT NULL,
    password    VARCHAR(255) NOT NULL,
    role        VARCHAR(20)  NOT NULL,
    enabled     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL,
    updated_at  TIMESTAMPTZ  NOT NULL,
    CONSTRAINT uk_users_email UNIQUE (email)
);

CREATE TABLE projects (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(150) NOT NULL,
    description VARCHAR(2000),
    status      VARCHAR(20) NOT NULL DEFAULT 'PLANNING',
    start_date  DATE,
    due_date    DATE,
    created_by  BIGINT NOT NULL REFERENCES users (id),
    created_at  TIMESTAMPTZ NOT NULL,
    updated_at  TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_projects_created_by ON projects (created_by);
CREATE INDEX idx_projects_status ON projects (status);

CREATE TABLE project_members (
    project_id BIGINT NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    user_id    BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    PRIMARY KEY (project_id, user_id)
);

CREATE TABLE tasks (
    id          BIGSERIAL PRIMARY KEY,
    title       VARCHAR(200) NOT NULL,
    description VARCHAR(4000),
    status      VARCHAR(20) NOT NULL DEFAULT 'TODO',
    priority    VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    project_id  BIGINT NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    assigned_to BIGINT REFERENCES users (id) ON DELETE SET NULL,
    created_by  BIGINT NOT NULL REFERENCES users (id),
    due_date    DATE,
    created_at  TIMESTAMPTZ NOT NULL,
    updated_at  TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_tasks_project_id ON tasks (project_id);
CREATE INDEX idx_tasks_assigned_to ON tasks (assigned_to);
CREATE INDEX idx_tasks_status ON tasks (status);
CREATE INDEX idx_tasks_priority ON tasks (priority);
CREATE INDEX idx_tasks_due_date ON tasks (due_date);

CREATE TABLE comments (
    id         BIGSERIAL PRIMARY KEY,
    content    VARCHAR(4000) NOT NULL,
    author_id  BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    task_id    BIGINT NOT NULL REFERENCES tasks (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_comments_task_id ON comments (task_id);
CREATE INDEX idx_comments_author_id ON comments (author_id);

CREATE TABLE activity_logs (
    id          BIGSERIAL PRIMARY KEY,
    type        VARCHAR(40)  NOT NULL,
    description VARCHAR(500) NOT NULL,
    user_id     BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    project_id  BIGINT NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    task_id     BIGINT REFERENCES tasks (id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_activity_logs_project_created ON activity_logs (project_id, created_at);

CREATE TABLE refresh_tokens (
    id         BIGSERIAL PRIMARY KEY,
    token_hash VARCHAR(64) NOT NULL,
    user_id    BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uk_refresh_tokens_token_hash UNIQUE (token_hash)
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);