import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import PageContainer from "@/components/layout/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit, Plus, Tag } from "lucide-react";

// Form schema for topic create/edit
const topicFormSchema = z.object({
  title: z.string().min(3, {
    message: "Title must be at least 3 characters",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters",
  }),
  chapterId: z.number().int().positive({
    message: "Please select a chapter",
  }),
  order: z.number().int().positive({
    message: "Order must be a positive number",
  }),
});

type TopicFormValues = z.infer<typeof topicFormSchema>;

export default function ManageTopics() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<any>(null);
  
  // Fetch topics
  const { 
    data: topics, 
    isLoading: isTopicsLoading,
    isError: isTopicsError,
  } = useQuery({
    queryKey: ["/api/topics"],
  });
  
  // Fetch chapters for dropdown
  const { 
    data: chapters,
    isLoading: isChaptersLoading,
  } = useQuery({
    queryKey: ["/api/chapters"],
  });
  
  const isLoading = isTopicsLoading || isChaptersLoading;
  
  // Form for creating topics
  const createForm = useForm<TopicFormValues>({
    resolver: zodResolver(topicFormSchema),
    defaultValues: {
      title: "",
      description: "",
      chapterId: undefined as unknown as number,
      order: 1,
    },
  });
  
  // Form for editing topics
  const editForm = useForm<TopicFormValues>({
    resolver: zodResolver(topicFormSchema),
    defaultValues: {
      title: "",
      description: "",
      chapterId: undefined as unknown as number,
      order: 1,
    },
  });
  
  // Create topic mutation
  const createTopicMutation = useMutation({
    mutationFn: async (data: TopicFormValues) => {
      const res = await apiRequest("POST", "/api/topics", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/topics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Topic created",
        description: "The topic has been created successfully",
      });
      setIsCreateDialogOpen(false);
      createForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create topic",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update topic mutation
  const updateTopicMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: TopicFormValues }) => {
      const res = await apiRequest("PUT", `/api/topics/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/topics"] });
      toast({
        title: "Topic updated",
        description: "The topic has been updated successfully",
      });
      setIsEditDialogOpen(false);
      setSelectedTopic(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update topic",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete topic mutation
  const deleteTopicMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/topics/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/topics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Topic deleted",
        description: "The topic has been deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setSelectedTopic(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete topic",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle create form submission
  function onCreateSubmit(values: TopicFormValues) {
    createTopicMutation.mutate(values);
  }
  
  // Handle edit form submission
  function onEditSubmit(values: TopicFormValues) {
    if (selectedTopic) {
      updateTopicMutation.mutate({ id: selectedTopic.id, data: values });
    }
  }
  
  // Open edit dialog with topic data
  function handleEdit(topic: any) {
    setSelectedTopic(topic);
    editForm.reset({
      title: topic.title,
      description: topic.description,
      chapterId: topic.chapterId,
      order: topic.order,
    });
    setIsEditDialogOpen(true);
  }
  
  // Open delete dialog
  function handleDelete(topic: any) {
    setSelectedTopic(topic);
    setIsDeleteDialogOpen(true);
  }
  
  // Confirm topic deletion
  function confirmDelete() {
    if (selectedTopic) {
      deleteTopicMutation.mutate(selectedTopic.id);
    }
  }
  
  // Get chapter title by id
  const getChapterTitle = (chapterId: number) => {
    const chapter = chapters?.find(c => c.id === chapterId);
    return chapter ? chapter.title : 'Unknown';
  };
  
  return (
    <PageContainer title="Manage Topics">
      <div className="mt-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Topics List</h2>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Topic
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Topic</DialogTitle>
                <DialogDescription>
                  Add a new topic for CFA Level I curriculum
                </DialogDescription>
              </DialogHeader>
              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                  <FormField
                    control={createForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter topic title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter topic description" 
                            rows={4}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createForm.control}
                    name="chapterId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chapter</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))} 
                          defaultValue={field.value ? field.value.toString() : undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select chapter" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {chapters?.map((chapter) => (
                              <SelectItem 
                                key={chapter.id} 
                                value={chapter.id.toString()}
                              >
                                {chapter.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createForm.control}
                    name="order"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Order</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1"
                            placeholder="Enter display order" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          This determines the display order of topics within a chapter
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button 
                      type="submit" 
                      disabled={createTopicMutation.isPending}
                    >
                      {createTopicMutation.isPending ? "Creating..." : "Create Topic"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex justify-between items-center py-2">
                    <div>
                      <Skeleton className="h-5 w-40 mb-2" />
                      <Skeleton className="h-4 w-64" />
                    </div>
                    <div className="flex space-x-2">
                      <Skeleton className="h-9 w-9 rounded-md" />
                      <Skeleton className="h-9 w-9 rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            ) : isTopicsError ? (
              <div className="p-6 text-center text-red-500">
                Error loading topics
              </div>
            ) : topics?.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Tag className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium">No topics available</p>
                <p className="mt-1">Create your first topic to get started</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Chapter</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topics.map((topic: any) => (
                      <TableRow key={topic.id}>
                        <TableCell className="font-medium">{topic.order}</TableCell>
                        <TableCell>{topic.title}</TableCell>
                        <TableCell>{getChapterTitle(topic.chapterId)}</TableCell>
                        <TableCell className="max-w-md truncate">{topic.description}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEdit(topic)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDelete(topic)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Edit Topic Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Topic</DialogTitle>
            <DialogDescription>
              Update topic details
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter topic title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter topic description" 
                        rows={4}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="chapterId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chapter</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      defaultValue={field.value ? field.value.toString() : undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select chapter" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {chapters?.map((chapter) => (
                          <SelectItem 
                            key={chapter.id} 
                            value={chapter.id.toString()}
                          >
                            {chapter.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1"
                        placeholder="Enter display order" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      This determines the display order of topics within a chapter
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={updateTopicMutation.isPending}
                >
                  {updateTopicMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the topic "{selectedTopic?.title}". 
              This action cannot be undone and will also delete all associated questions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteTopicMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
