"use client";

import { Badge } from "@/components/shadcn/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { ProjectAvatar } from "@/components/visualizers/projects/ProjectAvatar";
import { TaskBadge } from "@/components/visualizers/tasks/TaskBadge";
import {
  Folders,
  ListTodo,
  Sparkles,
  Key,
  FileText,
  Timer,
  CheckCircle2,
} from "lucide-react";
import type { FC } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

export const Release_v1_2_0: FC = () => {
  // Example data for visualizations
  const exampleTasks = [
    { name: "Design Homepage", sessions: 12, completed: true },
    { name: "Build API", sessions: 8, completed: true },
    { name: "Write Tests", sessions: 5, completed: false },
    { name: "Deploy to Production", sessions: 0, completed: false },
  ];

  const taskPieData = [
    { name: "Design Homepage", value: 450, color: "#3b82f6" },
    { name: "Build API", value: 320, color: "#8b5cf6" },
    { name: "Write Tests", value: 180, color: "#ec4899" },
  ];

  return (
    <div className="space-y-8 text-foreground">
      <section>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Track your work better than ever! We've added{" "}
          <strong>Projects & Tasks</strong> to help you organize your time
          tracking. Whether you're managing client work, personal projects, or
          team initiatives, you can now group your sessions and see exactly
          where your time goes.
        </p>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <Folders className="h-8 w-8 text-primary" />
          <h2 className="text-3xl font-bold">Projects & Tasks</h2>
          <Badge className="text-sm text-white">New</Badge>
        </div>

        <p className="text-muted-foreground leading-relaxed">
          Create projects, add tasks, and see your progress at a glance. Each
          project can have its own color, description, and as many tasks as you
          need. When you log a session, simply select which project and task
          you're working on!
        </p>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Example: Project Card</h3>
          <p className="text-sm text-muted-foreground">
            Here's what a project looks like in your dashboard:
          </p>
          <Card
            className="border-l-4 hover:shadow-lg transition-shadow"
            style={{ borderLeftColor: "#3b82f6" }}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <ProjectAvatar
                    color="#3b82f6"
                    name="Website Redesign"
                    size={48}
                  />
                  <div className="flex flex-col">
                    <h3 className="font-semibold text-lg">Website Redesign</h3>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                Complete overhaul of the company website with modern design and
                improved UX
              </p>

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ListTodo className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Tasks</span>
                </div>
                <Badge variant="outline">2 / 4</Badge>
              </div>

              <div className="mb-4">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{ backgroundColor: "#3b82f6", width: "50%" }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  50% complete
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Example: Tasks in a Project</h3>
          <p className="text-sm text-muted-foreground">
            Break down your project into manageable tasks and track progress:
          </p>
          <Card>
            <CardContent className="p-4 space-y-2">
              {exampleTasks.map((task, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <TaskBadge
                      name={task.name}
                      completed={task.completed}
                      size="sm"
                      skipStrikethrough
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Timer className="h-3 w-3" />
                      <span>{task.sessions} sessions</span>
                    </div>
                    {task.completed && (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Example: Time Distribution</h3>
          <p className="text-sm text-muted-foreground">
            See how much time you've spent on each task with beautiful
            visualizations:
          </p>
          <Card>
            <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
              <div className="w-[200px] h-[200px] flex-shrink-0">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie
                      data={taskPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {taskPieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          fillOpacity={0.8}
                          stroke={entry.color}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {taskPieData.map((task, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: task.color }}
                      />
                      <span className="text-sm">{task.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground font-medium">
                      {Math.floor(task.value / 60)}h {task.value % 60}m
                    </span>
                  </div>
                ))}
                <div className="pt-2 border-t mt-2">
                  <div className="flex justify-between font-semibold text-sm">
                    <span>Total Time:</span>
                    <span>15h 50m</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              What You Can Do
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <div className="p-1 rounded-md bg-primary/10 mt-0.5">
                  <Folders className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <strong>Create Unlimited Projects:</strong> Organize work by
                  client, department, or any category you need
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="p-1 rounded-md bg-primary/10 mt-0.5">
                  <ListTodo className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <strong>Break Down Into Tasks:</strong> Add as many tasks as
                  needed to each project and track them individually
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="p-1 rounded-md bg-primary/10 mt-0.5">
                  <Timer className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <strong>Link Sessions:</strong> When logging time, select
                  which project and task you're working on
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="p-1 rounded-md bg-primary/10 mt-0.5">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <strong>Track Progress:</strong> Mark tasks and projects as
                  complete and see your accomplishments in the feed
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Other Improvements</h2>

        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                Release Portal
                <Badge variant="secondary" className="text-xs">
                  New
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                You're seeing it right now! Get notified about new features and
                updates with detailed release notes (like this one).
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Key className="h-5 w-5" />
                API Token Usage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                See how many times each API token has been used. Better
                oversight helps you manage and audit your API access.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Technical Improvements</h2>

        <Card>
          <CardContent className="pt-6">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>
                  Database migrations for projects, tasks, and feed events
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Backend services for project and task management</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>
                  React Query integration for efficient data fetching and
                  caching
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>
                  CVA (Class Variance Authority) for consistent component
                  variants
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>
                  Improved navigation with automatic redirects on deletion
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Enhanced feed events with project/task context</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4 pb-8">
        <h2 className="text-2xl font-bold">What's Next?</h2>

        <p className="text-muted-foreground leading-relaxed">
          We're continuously working to improve Nowaster. Have feedback or
          feature requests? We'd love to hear from you! Stay tuned for more
          updates as we continue to enhance your time tracking experience.
        </p>
      </section>
    </div>
  );
};
