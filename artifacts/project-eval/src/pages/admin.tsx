import React, { useState } from "react";
import {
  useListProjects,
  getListProjectsQueryKey,
  useListFaculty,
  getListFacultyQueryKey,
  useAssignEvaluator,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Search, UserCheck, Users, AlertCircle, LayoutGrid } from "lucide-react";
import { format } from "date-fns";
import { StatusBadge } from "@/pages/projects";

export default function AdminPortal() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: projects, isLoading: projectsLoading } = useListProjects(
    { search: search || undefined },
    { query: { queryKey: getListProjectsQueryKey({ search: search || undefined }) } }
  );

  const { data: facultyList } = useListFaculty({
    query: { queryKey: getListFacultyQueryKey() },
  });

  const assignMutation = useAssignEvaluator();

  const handleAssign = (projectId: number, facultyIdStr: string) => {
    assignMutation.mutate(
      { id: projectId, data: { facultyId: parseInt(facultyIdStr, 10) } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey({}) });
          toast({ title: "Evaluator Assigned", description: "Faculty has been assigned to this project." });
        },
        onError: (err: any) => {
          toast({ title: "Assignment failed", description: err.message, variant: "destructive" });
        },
      }
    );
  };

  const unassigned = projects?.filter((p) => !p.evaluatorId) ?? [];
  const assigned = projects?.filter((p) => !!p.evaluatorId) ?? [];

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <ShieldCheck className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Admin Portal</h1>
        </div>
        <p className="text-gray-500 mt-1 ml-10">Assign faculty evaluators to submitted projects.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <LayoutGrid className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Total Projects</p>
              <p className="text-2xl font-bold text-gray-900">{projects?.length ?? "—"}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Unassigned</p>
              <p className="text-2xl font-bold text-gray-900">{unassigned.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <UserCheck className="h-5 w-5 text-green-700" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Assigned</p>
              <p className="text-2xl font-bold text-gray-900">{assigned.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search projects..."
          className="pl-9 bg-white"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card className="border-gray-200 shadow-sm bg-white overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b py-4 px-6">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-500" />
            All Projects — Evaluator Assignment
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {projectsLoading ? (
            <div className="divide-y">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="p-6 flex gap-4 items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                  <Skeleton className="h-9 w-48" />
                </div>
              ))}
            </div>
          ) : projects && projects.length > 0 ? (
            <div className="divide-y border-gray-100">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-semibold text-gray-900 truncate">{project.title}</h3>
                      <StatusBadge status={project.status} />
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 flex-wrap">
                      <span>{project.domain}</span>
                      <span>•</span>
                      <span>By {project.studentName || "Unknown"}</span>
                      <span>•</span>
                      <span>{format(new Date(project.createdAt), "MMM d, yyyy")}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:min-w-[260px]">
                    {project.evaluatorId ? (
                      <div className="flex items-center gap-2 flex-1">
                        <UserCheck className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span className="text-sm font-medium text-green-700 truncate">
                          {project.evaluatorName}
                        </span>
                        <Badge className="bg-green-100 text-green-800 border-green-200 text-xs ml-auto">
                          Assigned
                        </Badge>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-1">
                        <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                        <Select
                          onValueChange={(val) => handleAssign(project.id, val)}
                          disabled={assignMutation.isPending}
                        >
                          <SelectTrigger className="flex-1 bg-white border-amber-200 text-amber-800 focus:border-primary">
                            <SelectValue placeholder="Assign faculty..." />
                          </SelectTrigger>
                          <SelectContent>
                            {facultyList?.map((f) => (
                              <SelectItem key={f.id} value={f.id.toString()}>
                                {f.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {project.evaluatorId && facultyList && (
                      <Select
                        onValueChange={(val) => handleAssign(project.id, val)}
                        disabled={assignMutation.isPending}
                      >
                        <SelectTrigger className="w-[130px] bg-white text-xs">
                          <SelectValue placeholder="Reassign..." />
                        </SelectTrigger>
                        <SelectContent>
                          {facultyList.map((f) => (
                            <SelectItem key={f.id} value={f.id.toString()}>
                              {f.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-16 text-center">
              <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LayoutGrid className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No projects found</h3>
              <p className="text-gray-500 mt-1">No projects have been submitted yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
