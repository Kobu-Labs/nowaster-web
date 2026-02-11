import { parseResponseToResult } from "@/api/baseApi";
import { ProjectResponseSchema, TaskResponseSchema } from "@/api/definitions";
import { env } from "@/env";
import axios from "axios";
import type { Metadata } from "next";
import { cookies } from "next/headers";

type LayoutProps = {
  children: React.ReactNode;
};

type Props = {
  params: Promise<{ id: string; taskId: string; }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, taskId } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    return {
      description: "View task details and sessions",
      title: "Task",
    };
  }

  try {
    const [taskResponse, projectResponse] = await Promise.all([
      axios.get(`${env.NEXT_PUBLIC_API_URL}/task/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      axios.get(`${env.NEXT_PUBLIC_API_URL}/project/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    const taskRequest = await parseResponseToResult(
      taskResponse.data,
      TaskResponseSchema.readById,
    );

    const projectRequest = await parseResponseToResult(
      projectResponse.data,
      ProjectResponseSchema.readById,
    );

    if (taskRequest.isErr) {
      return {
        title: "Task not found",
      };
    }

    const task = taskRequest.value;
    const projectName = projectRequest.isOk ? projectRequest.value.name : "Project";

    return {
      description: "View task details and sessions",
      title: `${projectName} - ${task.name}`,
    };
  } catch {
    return {
      description: "View task details and sessions",
      title: "Task",
    };
  }
}

export default function TaskLayout({ children }: LayoutProps) {
  return children;
}
