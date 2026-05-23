import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation, Link } from "wouter";
import { useCreateProject, getListProjectsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ArrowLeft, Send } from "lucide-react";

const domains = [
  "AI/ML",
  "Web Development",
  "App Development",
  "IoT",
  "Data Science",
  "Cybersecurity",
  "Cloud Computing",
  "Other"
];

const newProjectSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title is too long"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  domain: z.string().min(1, "Please select a domain"),
  githubUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  reportUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  teamMembers: z.string().optional(),
  semester: z.string().optional(),
  academicYear: z.string().optional(),
});

export default function NewProject() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createProject = useCreateProject();

  const form = useForm<z.infer<typeof newProjectSchema>>({
    resolver: zodResolver(newProjectSchema),
    defaultValues: {
      title: "",
      description: "",
      domain: "",
      githubUrl: "",
      reportUrl: "",
      teamMembers: "",
      semester: "6",
      academicYear: "2023-2024",
    },
  });

  const onSubmit = (data: z.infer<typeof newProjectSchema>) => {
    // clean up empty strings to undefined to match API schema
    const payload = {
      ...data,
      githubUrl: data.githubUrl || undefined,
      reportUrl: data.reportUrl || undefined,
      teamMembers: data.teamMembers || undefined,
    };

    createProject.mutate(
      { data: payload },
      {
        onSuccess: (res) => {
          queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
          toast({
            title: "Project Submitted",
            description: "Your project has been successfully submitted for review.",
          });
          setLocation(`/projects/${res.id}`);
        },
        onError: (err: any) => {
          toast({
            title: "Submission Failed",
            description: err.message || "An error occurred while submitting the project.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="p-6 md:p-10 space-y-6 max-w-4xl mx-auto">
      <div>
        <Link href="/projects" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Submit New Project</h1>
        <p className="text-gray-500 mt-1">Provide the details of your academic project for faculty evaluation.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="bg-gray-50/50 border-b">
              <CardTitle>Project Details</CardTitle>
              <CardDescription>Core information about your submission.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Intelligent Attendance System using Facial Recognition" {...field} data-testid="input-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Abstract / Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Provide a comprehensive summary of your project's problem statement, methodology, and outcomes." 
                        className="min-h-[150px] resize-y" 
                        {...field} 
                        data-testid="input-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="domain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Domain</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-domain">
                            <SelectValue placeholder="Select a domain" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {domains.map(d => (
                            <SelectItem key={d} value={d}>{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="teamMembers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team Members (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Comma separated names" {...field} data-testid="input-team" />
                      </FormControl>
                      <FormDescription>If group project, list other members</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="semester"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Semester</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 6" {...field} data-testid="input-semester" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="academicYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Academic Year</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 2023-2024" {...field} data-testid="input-year" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                <FormField
                  control={form.control}
                  name="githubUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GitHub Repository URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://github.com/..." type="url" {...field} data-testid="input-github" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reportUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Report URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Link to Google Drive / PDF" type="url" {...field} data-testid="input-report" />
                      </FormControl>
                      <FormDescription>Link to your project documentation</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

            </CardContent>
            <CardFooter className="bg-gray-50/50 border-t p-6 flex justify-end gap-4">
              <Link href="/projects">
                <Button variant="outline" type="button">Cancel</Button>
              </Link>
              <Button type="submit" disabled={createProject.isPending} data-testid="button-submit">
                {createProject.isPending ? "Submitting..." : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Project
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
