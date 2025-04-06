"use client";

import { useState } from "react";
import { SessionTimeline } from "@/components/visualizers/SessionTimeline";
import { Button } from "@/components/shadcn/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shadcn/card";

interface Activity {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  color: string;
}

export default function InteractiveTimelinePage() {
  // Sample activities data
  const initialActivities: Activity[] = [
    {
      id: "1",
      title: "Morning Routine",
      description: "Breakfast and preparation for the day",
      startTime: "06:00",
      endTime: "08:00",
      color: "bg-blue-500",
    },
    {
      id: "2",
      title: "Work Session 1",
      description: "Focus on priority tasks",
      startTime: "08:30",
      endTime: "12:00",
      color: "bg-green-500",
    },
    {
      id: "3",
      title: "Lunch Break",
      description: "Meal and short rest",
      startTime: "12:00",
      endTime: "13:00",
      color: "bg-yellow-500",
    },
  ];

  const [activities, setActivities] = useState<Activity[]>(initialActivities);

  const handleActivitiesChange = (updatedActivities: Activity[]) => {
    setActivities(updatedActivities);
  };

  const handleReset = () => {
    setActivities(initialActivities);
  };

  return (
    <main className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6">Interactive Timeline</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Create a new activity:</strong> Click and drag on the
              empty timeline area
            </li>
            <li>
              <strong>Select an activity:</strong> Click on any activity to view
              details
            </li>
            <li>
              <strong>Edit an activity:</strong> Double-click on an activity or
              click the Edit button
            </li>
            <li>
              <strong>Delete an activity:</strong> Open the edit dialog and
              click Delete
            </li>
          </ul>
        </CardContent>
      </Card>

      <div className="mb-4 flex justify-end">
        <Button variant="outline" onClick={handleReset}>
          Reset Timeline
        </Button>
      </div>

      <SessionTimeline
        activities={activities}
        onActivitiesChange={handleActivitiesChange}
      />

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Current Activities</h2>
        <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-auto max-h-96">
          {JSON.stringify(activities, null, 2)}
        </pre>
      </div>
    </main>
  );
}
