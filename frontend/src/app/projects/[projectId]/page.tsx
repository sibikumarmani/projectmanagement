"use client";

import { useParams } from "next/navigation";
import { ProjectWorkspaceEditor } from "@/components/projects/project-workspace-editor";

export default function ProjectDetailPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId === "new" ? null : params.projectId;

  return <ProjectWorkspaceEditor projectId={projectId ?? null} />;
}
