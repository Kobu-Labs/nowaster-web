import type { ProjectWithId } from "@/api/definitions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { CheckCircle2 } from "lucide-react";
import type { FC } from "react";

export type ProjectPickerUiProviderProps = {
  availableProjects: ProjectWithId[];
  onSelectProject: (project: null | ProjectWithId) => void;
  placeholder?: string;
  selectedProject: null | ProjectWithId;
};

export const ProjectPickerUiProvider: FC<ProjectPickerUiProviderProps> = (props) => {
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
      value={props.selectedProject?.id ?? "none"}
    >
      <SelectTrigger>
        <SelectValue placeholder={props.placeholder ?? "Select a project"} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">
          <span className="text-muted-foreground">No project</span>
        </SelectItem>
        {props.availableProjects.map((project) => (
          <SelectItem key={project.id} value={project.id}>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: project.color }}
              />
              <span className="flex-1">{project.name}</span>
              {project.completed && (
                <CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0" />
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
