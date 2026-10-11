"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { useApi } from "@/lib/hooks/use-api";
import { projectsApi } from "@/lib/api/projects";
import { errorMessage } from "@/lib/api/errors";
import { PROJECT_STATUSES } from "@/lib/api/types";
import type { CreateProjectRequest, ProjectStatus } from "@/lib/api/types";
import { formatDate, titleCase } from "@/lib/format";
import { PROJECT_STATUS_TONE } from "@/lib/status";
import { MemberPicker } from "@/components/projects/member-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { PageSpinner } from "@/components/ui/spinner";
import { Pagination } from "@/components/ui/pagination";
import {
  CalendarIcon,
  ClockIcon,
  FolderIcon,
  PlusIcon,
  SearchIcon,
} from "@/components/icons";

const PAGE_SIZE = 12;

function canCreate(role?: string): boolean {
  return role === "ADMIN" || role === "MANAGER";
}

function CreateProjectModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("PLANNING");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [memberIds, setMemberIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const body: CreateProjectRequest = {
        name,
        description: description.trim() || undefined,
        status,
        startDate: startDate || null,
        dueDate: dueDate || null,
        memberIds,
      };
      await projectsApi.create(body);
      onCreated();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Create project"
      description="Set up a new workspace for your team."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" form="project-form" disabled={busy}>
            {busy ? "Creating…" : "Create project"}
          </Button>
        </>
      }
    >
      <form
        id="project-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <Field label="Name" htmlFor="project-name" required>
          <Input
            id="project-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Website redesign"
            required
          />
        </Field>
        <Field label="Description" htmlFor="project-description">
          <Textarea
            id="project-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this project about?"
          />
        </Field>
        <Field label="Status" htmlFor="project-status" required>
          <Select
            id="project-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as ProjectStatus)}
          >
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {titleCase(s)}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start date" htmlFor="project-start">
            <Input
              id="project-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </Field>
          <Field label="Due date" htmlFor="project-due">
            <Input
              id="project-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </Field>
        </div>
        <Field label="Add members">
          <MemberPicker selectedIds={memberIds} onChange={setMemberIds} />
        </Field>
      </form>
    </Modal>
  );
}

function ProjectsManager() {
  const { user } = useAuth();
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ProjectStatus | "">("");
  const [mine, setMine] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const fetcher = useCallback(
    () =>
      projectsApi.list({
        page,
        size: PAGE_SIZE,
        status,
        search,
        mine,
      }),
    [page, status, search, mine],
  );
  const { data, error, loading, reload } = useApi(fetcher);

  function applyFilters() {
    setPage(0);
    setSearch(searchInput);
  }

  if (loading && !data) {
    return <PageSpinner label="Loading projects…" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Projects"
        description="Everything your team is working on."
        action={
          canCreate(user?.role) ? (
            <Button onClick={() => setCreateOpen(true)}>
              <PlusIcon className="h-4 w-4" />
              New project
            </Button>
          ) : null
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <form
          className="flex flex-1 gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            applyFilters();
          }}
        >
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search projects…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <input
              type="checkbox"
              checked={mine}
              onChange={(e) => {
                setMine(e.target.checked);
                setPage(0);
              }}
              className="h-4 w-4 rounded border-input accent-primary"
            />
            My projects
          </label>
          <Select
            className="sm:w-44"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as ProjectStatus | "");
              setPage(0);
            }}
          >
            <option value="">All statuses</option>
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {titleCase(s)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {error ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : data && data.content.length === 0 ? (
        <EmptyState
          title="No projects found"
          description={
            canCreate(user?.role)
              ? "Create a project to get started."
              : "You are not part of any projects yet."
          }
          action={
            canCreate(user?.role) ? (
              <Button onClick={() => setCreateOpen(true)}>
                <PlusIcon className="h-4 w-4" />
                New project
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.content.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="group"
            >
              <Card className="h-full transition-colors hover:border-ring hover:shadow-md">
                <CardHeader className="flex-row items-start justify-between gap-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FolderIcon className="h-5 w-5" />
                  </span>
                  <Badge tone={PROJECT_STATUS_TONE[project.status]}>
                    {titleCase(project.status)}
                  </Badge>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <CardTitle className="group-hover:text-primary">
                    {project.name}
                  </CardTitle>
                  <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <CalendarIcon className="h-4 w-4" />
                      Created {formatDate(project.createdAt)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <ClockIcon className="h-4 w-4" />
                      Due {formatDate(project.dueDate)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {data ? (
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          onPageChange={setPage}
          disabled={loading}
        />
      ) : null}

      {createOpen ? (
        <CreateProjectModal
          onClose={() => setCreateOpen(false)}
          onCreated={reload}
        />
      ) : null}
    </div>
  );
}

export default function ProjectsPage() {
  return <ProjectsManager />;
}