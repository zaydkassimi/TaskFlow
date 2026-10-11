"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useApi } from "@/lib/hooks/use-api";
import { projectsApi } from "@/lib/api/projects";
import { errorMessage } from "@/lib/api/errors";
import { PROJECT_STATUSES } from "@/lib/api/types";
import type { CreateProjectRequest, ProjectStatus } from "@/lib/api/types";
import { titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";
import { canCreateProject } from "@/lib/permissions";
import { MemberPicker } from "@/components/projects/member-picker";
import { ProjectCard } from "@/components/projects/project-card";
import { Button } from "@/components/ui/button";
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
import { SearchInput } from "@/components/ui/search-input";
import { SegmentedControl } from "@/components/ui/segmented";
import {
  CheckSquareIcon,
  GridIcon,
  ListIcon,
  PlusIcon,
} from "@/components/icons";
import { PROJECT_STATUS_DOT } from "@/lib/status";

const PAGE_SIZE = 12;

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
          <Select<ProjectStatus>
            id="project-status"
            value={status}
            onChange={(v) => setStatus(v)}
            options={PROJECT_STATUSES.map((s) => ({
              value: s,
              label: titleCase(s),
              dot: PROJECT_STATUS_DOT[s],
            }))}
          />
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
  const [view, setView] = useState<"grid" | "list">("grid");
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
        eyebrow="Workspace"
        title="Projects"
        description="Everything your team is working on, in one place."
        action={
          canCreateProject(user?.role) ? (
            <Button onClick={() => setCreateOpen(true)}>
              <PlusIcon className="h-4 w-4" />
              New project
            </Button>
          ) : null
        }
      />

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card/60 p-3 sm:flex-row sm:items-center">
        <form
          className="flex flex-1 gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            applyFilters();
          }}
        >
          <SearchInput
            placeholder="Search projects…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </form>
        <div className="flex flex-wrap items-center gap-2">
          <label
            className={cn(
              "flex h-9 cursor-pointer select-none items-center gap-2 rounded-md border px-3 text-[13px] font-medium transition-colors",
              mine
                ? "border-primary/30 bg-primary/10 text-primary-strong"
                : "border-border bg-surface/50 text-muted-foreground hover:text-foreground",
            )}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={mine}
              onChange={(e) => {
                setMine(e.target.checked);
                setPage(0);
              }}
            />
            <CheckSquareIcon className="h-4 w-4" />
            Mine
          </label>
          <Select<ProjectStatus | "">
            className="w-40"
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPage(0);
            }}
            options={[
              { value: "", label: "All statuses" },
              ...PROJECT_STATUSES.map((s) => ({
                value: s,
                label: titleCase(s),
                dot: PROJECT_STATUS_DOT[s],
              })),
            ]}
          />
          <SegmentedControl
            ariaLabel="Project layout"
            value={view}
            onChange={setView}
            options={[
              { value: "grid", ariaLabel: "Grid view", icon: GridIcon },
              { value: "list", ariaLabel: "List view", icon: ListIcon },
            ]}
          />
        </div>
      </div>

      {error ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : data && data.content.length === 0 ? (
        <EmptyState
          title="No projects found"
          description={
          canCreateProject(user?.role)
            ? "Create a project to get started."
            : "You are not part of any projects yet."
        }
        action={
          canCreateProject(user?.role) ? (
            <Button onClick={() => setCreateOpen(true)}>
              <PlusIcon className="h-4 w-4" />
              New project
            </Button>
          ) : null
          }
        />
      ) : view === "list" ? (
        <div className="flex flex-col gap-2">
          {data?.content.map((project) => (
            <ProjectCard key={project.id} project={project} layout="list" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data?.content.map((project) => (
            <ProjectCard key={project.id} project={project} />
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
