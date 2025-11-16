import type { ProjectWithId } from "@/api/definitions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { ProjectBadge } from "@/components/visualizers/projects/ProjectBadge";
import type { FC } from "react";

export type ProjectPickerUiProviderProps = {
  availableProjects: ProjectWithId[];
  onSelectProject: (project: null | ProjectWithId) => void;
  placeholder?: string;
  selectedProjectId: string | null;
};

export const ProjectPickerUiProvider: FC<ProjectPickerUiProviderProps> = (
  props,
) => {
  const onValueChange = (val: string) => {
    if (val === "none") {
      props.onSelectProject(null);
    } else {
      const project = props.availableProjects.find((p) => p.id === val) ?? null;
      props.onSelectProject(project);
    }
  };

  return (
    <Select
      onValueChange={onValueChange}
      value={props.selectedProjectId ?? "none"}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={props.placeholder ?? "Select a project"} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">
          <span className="text-muted-foreground">No project</span>
        </SelectItem>
        {props.availableProjects.map((project) => (
          <SelectItem key={project.id} value={project.id}>
            <ProjectBadge
              color={project.color}
              name={project.name}
              completed={project.completed}
            />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
