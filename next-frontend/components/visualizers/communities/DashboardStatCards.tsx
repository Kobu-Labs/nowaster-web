import type { CommunityDashboard } from "@/api/definitions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shadcn/card";
import { formatMinutesAsDuration } from "@/components/visualizers/communities/formatMinutes";
import { Clock, ListChecks, Users } from "lucide-react";
import type { FC } from "react";

type DashboardStatCardsProps = {
  dashboard: CommunityDashboard;
};

export const DashboardStatCards: FC<DashboardStatCardsProps> = ({ dashboard }) => {
  const activeMembers = dashboard.members.filter(
    (member) => member.total_minutes > 0,
  ).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Time</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatMinutesAsDuration(dashboard.total_minutes)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sessions Logged</CardTitle>
          <ListChecks className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{dashboard.total_sessions}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Members</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {activeMembers}
            {" "}
            /
            {" "}
            {dashboard.member_count}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
