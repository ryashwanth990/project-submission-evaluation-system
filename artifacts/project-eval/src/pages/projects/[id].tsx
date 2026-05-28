import React, { useState } from "react";
import { useParams, Link } from "wouter";
import { 
  useGetProject, getGetProjectQueryKey,
  useUpdateProject,
  useAssignEvaluator,
  useCreateEvaluation,
  EvaluationInput
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { StatusBadge } from "@/pages/projects";
import { ArrowLeft, ExternalLink, Github, FileText, Calendar, Users, Target, UserIcon, ShieldAlert } from "lucide-react";
import { format } from "date-fns";

const evaluationSchema = z.object({
  score: z.coerce.number().min(0).max(100),
  feedback: z.string().min(10, "Feedback must be at least 10 characters"),
  innovationScore: z.coerce.number().min(0).max(100).optional(),
  technicalScore: z.coerce.number().min(0).max(100).optional(),
  presentationScore: z.coerce.number().min(0).max(100).optional(),
  documentationScore: z.coerce.number().min(0).max(100).optional(),
});

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const projectId = parseInt(id, 10);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isFaculty = user?.role === "faculty";
  const isAdmin = user?.role === "admin";

  const { data: project, isLoading } = useGetProject(projectId, {
    query: {
      enabled: !isNaN(projectId),
      queryKey: getGetProjectQueryKey(projectId)
    }
  });

  const assignEvaluatorMutation = useAssignEvaluator();
  const updateProjectMutation = useUpdateProject();

  const handleStatusUpdate = (newStatus: string) => {
    updateProjectMutation.mutate(
      { id: projectId, data: { status: newStatus } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
          toast({ title: "Status Updated", description: `Project status changed to ${newStatus.replace("_", " ")}` });
        }
      }
    );
  };

  const handleAssignFaculty = (facultyIdStr: string) => {
    assignEvaluatorMutation.mutate(
      { id: projectId, data: { facultyId: parseInt(facultyIdStr, 10) } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
          toast({ title: "Evaluator Assigned", description: "Faculty has been assigned successfully." });
        }
      }
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-10 space-y-6 max-w-6xl mx-auto">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-12 w-2/3" />
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-[400px] w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-[200px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-2xl font-bold">Project not found</h2>
        <Link href="/projects">
          <Button className="mt-4" variant="outline">Return to Projects</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-6 max-w-6xl mx-auto">
      <div>
        <Link href="/projects" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-6 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight leading-tight">{project.title}</h1>
            <p className="text-gray-500 mt-2 flex items-center gap-2">
              <UserIcon className="h-4 w-4" /> Submitted by <span className="font-medium text-gray-900">{project.studentName}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={project.status} />
            {isFaculty && (
              <Select value={project.status} onValueChange={handleStatusUpdate}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Update Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="evaluated">Evaluated</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 items-start">
        <div className="md:col-span-2 space-y-8">
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="bg-gray-50/50 border-b">
              <CardTitle className="text-lg">Project Description</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                {project.description}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-gray-200">
            <CardHeader className="bg-gray-50/50 border-b">
              <CardTitle className="text-lg">Evaluations</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {project.evaluations && project.evaluations.length > 0 ? (
                <div className="divide-y">
                  {project.evaluations.map((evalRecord) => (
                    <div key={evalRecord.id} className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="font-semibold text-gray-900">{evalRecord.facultyName}</p>
                          <p className="text-xs text-gray-500">{format(new Date(evalRecord.createdAt), "MMM d, yyyy")}</p>
                        </div>
                        <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-xl font-bold">
                          {evalRecord.score}
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-md p-4 mb-4 text-sm text-gray-700 whitespace-pre-wrap">
                        {evalRecord.feedback}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t text-sm">
                        <div>
                          <p className="text-gray-500 text-xs uppercase tracking-wider">Innovation</p>
                          <p className="font-medium mt-1">{evalRecord.innovationScore ?? '-'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs uppercase tracking-wider">Technical</p>
                          <p className="font-medium mt-1">{evalRecord.technicalScore ?? '-'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs uppercase tracking-wider">Presentation</p>
                          <p className="font-medium mt-1">{evalRecord.presentationScore ?? '-'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs uppercase tracking-wider">Docs</p>
                          <p className="font-medium mt-1">{evalRecord.documentationScore ?? '-'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center text-gray-500 flex flex-col items-center justify-center">
                  <ShieldAlert className="h-10 w-10 text-gray-300 mb-3" />
                  <p>No evaluations have been submitted yet.</p>
                </div>
              )}
            </CardContent>
            {isFaculty && (
              <CardFooter className="bg-gray-50/50 border-t p-4 flex justify-end">
                <AddEvaluationDialog projectId={projectId} />
              </CardFooter>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="bg-gray-50/50 border-b">
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4 text-sm">
              <div>
                <p className="text-gray-500 mb-1 flex items-center gap-2"><Target className="h-4 w-4" /> Domain</p>
                <p className="font-medium text-gray-900">{project.domain}</p>
              </div>
              
              {project.teamMembers && (
                <div>
                  <p className="text-gray-500 mb-1 flex items-center gap-2"><Users className="h-4 w-4" /> Team Members</p>
                  <p className="font-medium text-gray-900">{project.teamMembers}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 mb-1 flex items-center gap-2"><Calendar className="h-4 w-4" /> Semester</p>
                  <p className="font-medium text-gray-900">{project.semester || "N/A"}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Academic Year</p>
                  <p className="font-medium text-gray-900">{project.academicYear || "N/A"}</p>
                </div>
              </div>

              <div>
                <p className="text-gray-500 mb-1 flex items-center gap-2"><ShieldAlert className="h-4 w-4" /> Evaluator</p>
                {project.evaluatorId ? (
                  <p className="font-medium text-gray-900">{project.evaluatorName}</p>
                ) : (
                  <p className="text-amber-600 font-medium">Unassigned</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-gray-200">
            <CardHeader className="bg-gray-50/50 border-b">
              <CardTitle className="text-base">Links & Resources</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {project.githubUrl ? (
                <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-md border hover:bg-gray-50 transition-colors group">
                  <Github className="h-5 w-5 text-gray-600 group-hover:text-gray-900" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">GitHub Repository</p>
                    <p className="text-xs text-gray-500 truncate">{project.githubUrl}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-gray-900" />
                </a>
              ) : (
                <p className="text-sm text-gray-500 italic">No GitHub link provided.</p>
              )}

              {project.reportUrl ? (
                <a href={project.reportUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-md border hover:bg-gray-50 transition-colors group">
                  <FileText className="h-5 w-5 text-blue-600 group-hover:text-blue-700" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">Project Report</p>
                    <p className="text-xs text-gray-500 truncate">{project.reportUrl}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-gray-900" />
                </a>
              ) : (
                <p className="text-sm text-gray-500 italic">No report link provided.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


function AddEvaluationDialog({ projectId }: { projectId: number }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createEvalMutation = useCreateEvaluation();

  const form = useForm<z.infer<typeof evaluationSchema>>({
    resolver: zodResolver(evaluationSchema),
    defaultValues: {
      score: 0,
      feedback: "",
      innovationScore: 0,
      technicalScore: 0,
      presentationScore: 0,
      documentationScore: 0,
    },
  });

  const onSubmit = (data: z.infer<typeof evaluationSchema>) => {
    const payload: EvaluationInput = {
      projectId,
      ...data,
      innovationScore: data.innovationScore || undefined,
      technicalScore: data.technicalScore || undefined,
      presentationScore: data.presentationScore || undefined,
      documentationScore: data.documentationScore || undefined,
    };

    createEvalMutation.mutate(
      { data: payload },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
          toast({ title: "Evaluation Submitted", description: "Your evaluation has been recorded." });
          setOpen(false);
          form.reset();
        },
        onError: (err: any) => {
          toast({ title: "Failed to submit", description: err.message, variant: "destructive" });
        }
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Submit Evaluation</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Evaluate Project</DialogTitle>
          <DialogDescription>
            Provide your assessment, scoring, and feedback for this project.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="score"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-bold text-gray-900">Overall Score (0-100)</FormLabel>
                  <FormControl>
                    <Input type="number" className="text-lg font-bold" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border">
              <FormField
                control={form.control}
                name="innovationScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Innovation (0-100)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="technicalScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Technical Execution (0-100)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="presentationScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Presentation (0-100)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="documentationScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Documentation (0-100)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="feedback"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detailed Feedback</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Provide constructive feedback, noting strengths and areas for improvement." 
                      className="min-h-[150px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createEvalMutation.isPending}>
                {createEvalMutation.isPending ? "Submitting..." : "Save Evaluation"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
