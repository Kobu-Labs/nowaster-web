import type { FC } from "react";
import { useState } from "react";

import type { ProjectWithId } from "@/api/definitions";
import { useProjects } from "@/components/hooks/project/useProjects";
import { Skeleton } from "@/components/shadcn/skeleton";
import { ProjectPickerUiProvider } from "@/components/ui-providers/projects/ProjectPickerUiProvider";
import { Frown } from "lucide-react";

type ProjectPickerProps = {
  onSelectProject?: (project: null | ProjectWithId) => void;
  placeholder?: string;
  selectedProjectId?: string | null
};

export const ProjectPicker: FC<ProjectPickerProps> = (props) => {
  const projects = useProjects();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const isControlled = props.selectedProjectId !== undefined;
  const value = isControlled
    ? (props.selectedProjectId ?? null)
    : selectedProject;

  const onSelectProject = (project: null | ProjectWithId) => {
    if (!isControlled) {
      setSelectedProject(project?.id ?? null);
    }
    props.onSelectProject?.(project);
  };

  if (projects.isError) {
    return (
      <Frown className="flex w-full items-center justify-center h-10 grow text-red-500" />
    );
  }

  if (projects.isPending) {
    return (
      <Skeleton className="flex items-center justify-center w-full grow h-10" />
    );
  }

  return (
    <ProjectPickerUiProvider
      availableProjects={projects.data}
      onSelectProject={onSelectProject}
      placeholder={props.placeholder}
      selectedProjectId={value}
    />
  );
};
