import React, { useState } from "react";
import { Link } from "wouter";
import { useListProjects, getListProjectsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, Filter, LayoutGrid, FileText } from "lucide-react";
import { format } from "date-fns";

export function StatusBadge({ status }: { status: string }) {
  const getBadgeVariant = (s: string) => {
    switch (s.toLowerCase()) {
      case "submitted": return "default";
      case "under_review": return "secondary";
      case "evaluated": return "outline";
      case "approved": return "default"; // we might want custom colors
      case "rejected": return "destructive";
      default: return "secondary";
    }
  };
  
  const getBadgeStyle = (s: string) => {
    switch (s.toLowerCase()) {
      case "submitted": return "bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200";
      case "under_review": return "bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200";
      case "evaluated": return "bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200";
      case "approved": return "bg-green-100 text-green-800 hover:bg-green-100 border-green-200";
      case "rejected": return "bg-red-100 text-red-800 hover:bg-red-100 border-red-200";
      default: return "";
    }
  };

  return (
    <Badge className={`capitalize font-medium ${getBadgeStyle(status)}`} variant="outline">
      {status.replace("_", " ")}
    </Badge>
  );
}

export default function Projects() {
  const { user } = useAuth();
  const isStudent = user?.role === "student";
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: projects, isLoading } = useListProjects(
    { 
      search: search || undefined, 
      status: statusFilter !== "all" ? statusFilter : undefined 
    },
    {
      query: {
        queryKey: getListProjectsQueryKey({ 
          search: search || undefined, 
          status: statusFilter !== "all" ? statusFilter : undefined 
        }),
      }
    }
  );

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Projects</h1>
          <p className="text-gray-500 mt-1">Manage and track academic project submissions.</p>
        </div>
        {isStudent && (
          <Link href="/projects/new">
            <Button className="gap-2" data-testid="button-new-project">
              <Plus className="h-4 w-4" />
              Submit Project
            </Button>
          </Link>
        )}
      </div>

      <Card className="border-gray-200 shadow-sm bg-white">
        <div className="p-4 border-b flex flex-col sm:flex-row gap-4 items-center justify-between bg-gray-50/50 rounded-t-lg">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search projects..." 
              className="pl-9 bg-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-search"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px] bg-white" data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="evaluated">Evaluated</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-6 flex gap-4">
                  <Skeleton className="h-12 w-12 rounded-md" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : projects && projects.length > 0 ? (
            <div className="divide-y border-gray-100">
              {projects.map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <div className="p-6 hover:bg-gray-50/80 transition-colors cursor-pointer flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between group" data-testid={`project-row-${project.id}`}>
                    <div className="flex gap-4 items-start flex-1 min-w-0">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors text-primary">
                        <LayoutGrid className="h-6 w-6" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-primary transition-colors">
                          {project.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-gray-500">
                          <span className="font-medium text-gray-700">{project.domain}</span>
                          <span>•</span>
                          <span>{project.studentName || 'Unknown Student'}</span>
                          <span>•</span>
                          <span>{format(new Date(project.createdAt), "MMM d, yyyy")}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 w-full sm:w-auto mt-4 sm:mt-0 justify-between sm:justify-end">
                      {project.averageScore !== null && project.averageScore !== undefined && (
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Score</p>
                          <p className="text-lg font-bold text-gray-900">{project.averageScore.toFixed(1)}</p>
                        </div>
                      )}
                      <StatusBadge status={project.status} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No projects found</h3>
              <p className="text-gray-500 mt-1 max-w-sm mx-auto">
                {search || statusFilter !== 'all' 
                  ? "Try adjusting your filters to find what you're looking for."
                  : "You haven't submitted any projects yet."}
              </p>
              {isStudent && !search && statusFilter === 'all' && (
                <Link href="/projects/new">
                  <Button className="mt-6" variant="outline">
                    Submit your first project
                  </Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
