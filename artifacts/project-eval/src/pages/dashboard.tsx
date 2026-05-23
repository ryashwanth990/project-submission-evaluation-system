import React from "react";
import { useAuth } from "@/lib/auth";
import { useGetDashboardStats, getGetDashboardStatsQueryKey, useGetRecentActivity, getGetRecentActivityQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, Clock, CheckCircle2, FileText, Activity } from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const { user } = useAuth();
  const isFaculty = user?.role === "faculty";

  const { data: stats, isLoading: statsLoading } = useGetDashboardStats({
    query: {
      queryKey: getGetDashboardStatsQueryKey(),
    }
  });

  const { data: activities, isLoading: activityLoading } = useGetRecentActivity({
    query: {
      queryKey: getGetRecentActivityQueryKey(),
    }
  });

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          Welcome back, {user?.name}
        </h1>
        <p className="text-gray-500 mt-1">
          {isFaculty ? "Here's an overview of your assigned projects and evaluations." : "Here's an overview of your academic projects."}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Projects" 
          value={stats?.totalProjects} 
          icon={<FileText className="h-4 w-4 text-blue-600" />} 
          loading={statsLoading} 
        />
        <StatCard 
          title="Pending Review" 
          value={stats?.pendingReview} 
          icon={<Clock className="h-4 w-4 text-amber-600" />} 
          loading={statsLoading} 
        />
        <StatCard 
          title="Evaluated" 
          value={stats?.evaluated} 
          icon={<CheckCircle2 className="h-4 w-4 text-green-600" />} 
          loading={statsLoading} 
        />
        <StatCard 
          title="Average Score" 
          value={stats?.averageScore ? `${stats.averageScore.toFixed(1)}/100` : "N/A"} 
          icon={<BarChart3 className="h-4 w-4 text-purple-600" />} 
          loading={statsLoading} 
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 shadow-sm border-gray-200">
          <CardHeader className="bg-gray-50/50 border-b pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-gray-500" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {activityLoading ? (
              <div className="p-6 space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : activities && activities.length > 0 ? (
              <div className="divide-y">
                {activities.map((activity) => (
                  <div key={activity.id} className="p-4 sm:px-6 hover:bg-gray-50 transition-colors flex items-start gap-4">
                    <div className="mt-0.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">{format(new Date(activity.createdAt), "MMM d, yyyy 'at' h:mm a")}</span>
                        {activity.projectTitle && (
                          <>
                            <span className="text-xs text-gray-300">•</span>
                            <span className="text-xs font-medium text-primary">{activity.projectTitle}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-gray-500">
                <p>No recent activity found.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-200">
          <CardHeader className="bg-gray-50/50 border-b pb-4">
            <CardTitle className="text-lg">Projects by Status</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {statsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : stats?.byStatus && stats.byStatus.length > 0 ? (
              <div className="space-y-4">
                {stats.byStatus.map((status) => (
                  <div key={status.status} className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize text-gray-700">
                      {status.status.replace("_", " ")}
                    </span>
                    <span className="text-sm font-bold bg-gray-100 px-2.5 py-0.5 rounded-full text-gray-700">
                      {status.count}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p>No data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, loading }: { title: string, value: string | number | undefined | null, icon: React.ReactNode, loading: boolean }) {
  return (
    <Card className="shadow-sm border-gray-200 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <div className="h-8 w-8 rounded-md bg-gray-50 flex items-center justify-center border">
            {icon}
          </div>
        </div>
        <div className="mt-2">
          {loading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="text-3xl font-bold text-gray-900">{value ?? 0}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
