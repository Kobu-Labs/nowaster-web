import { useTasksWithSessionCountByProject } from "@/components/hooks/task/useTasksWithSessionCountByProject";
import { KpiCardUiProvider } from "@/components/ui-providers/KpiCardUiProvider";
import { CheckCircle2 } from "lucide-react";
import { FC, useMemo } from "react";

export const ProjectTasksKpiCard: FC<{ projectId: string; }> = (props) => {
  const tasksQuery = useTasksWithSessionCountByProject(props.projectId);
  const tasks = tasksQuery.data ?? [];

  const taskStats = useMemo(() => {
    const completedTasks = tasks.filter((task) => task.completed).length;
    const totalTasks = tasks.length;
    const completionPercentage
      = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      completedTasks,
      completionPercentage,
      totalTasks,
    };
  }, [tasks]);

  return (
    <KpiCardUiProvider
      description={`${taskStats.completionPercentage}% complete (${taskStats.completedTasks}/${taskStats.totalTasks})`}
      error={tasksQuery.isError}
      loading={tasksQuery.isPending}
      title="Total Tasks"
      value={taskStats.totalTasks}
      variant="big_value"
    >
      <CheckCircle2 />
    </KpiCardUiProvider>
  );
};
