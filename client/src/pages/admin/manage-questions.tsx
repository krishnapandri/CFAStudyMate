import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import PageContainer from "@/components/layout/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
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
import { Trash2, Edit, Plus, HelpCircle, FilePlus, X } from "lucide-react";

// Form schema for question create/edit
const questionFormSchema = z.object({
  text: z.string().min(10, {
    message: "Question text must be at least 10 characters",
  }),
  options: z.array(
    z.object({
      text: z.string().min(1, { message: "Option text is required" }),
    })
  ).min(2, {
    message: "At least 2 options are required",
  }),
  correctOption: z.number().int().min(0, {
    message: "Please select the correct option",
  }),
  explanation: z.string().min(10, {
    message: "Explanation must be at least 10 characters",
  }),
  topicId: z.number().int().positive({
    message: "Please select a topic",
  }),
});

type QuestionFormValues = z.infer<typeof questionFormSchema>;

export default function ManageQuestions() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  
  // Fetch questions
  const { 
    data: questions, 
    isLoading: isQuestionsLoading,
    isError: isQuestionsError,
  } = useQuery({
    queryKey: ["/api/questions"],
  });
  
  // Fetch topics for dropdown
  const { 
    data: topics,
    isLoading: isTopicsLoading,
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
  
  const isLoading = isQuestionsLoading || isTopicsLoading || isChaptersLoading;
  
  // Form for creating questions
  const createForm = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      text: "",
      options: [{ text: "" }, { text: "" }, { text: "" }, { text: "" }],
      correctOption: 0,
      explanation: "",
      topicId: undefined as unknown as number,
    },
  });
  
  // Field array for options
  const { fields: createOptionsFields, append: appendCreateOption, remove: removeCreateOption } = useFieldArray({
    control: createForm.control,
    name: "options",
  });
  
  // Form for editing questions
  const editForm = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      text: "",
      options: [{ text: "" }, { text: "" }, { text: "" }, { text: "" }],
      correctOption: 0,
      explanation: "",
      topicId: undefined as unknown as number,
    },
  });
  
  // Field array for options in edit form
  const { fields: editOptionsFields, append: appendEditOption, remove: removeEditOption } = useFieldArray({
    control: editForm.control,
    name: "options",
  });
  
  // Create question mutation
  const createQuestionMutation = useMutation({
    mutationFn: async (data: QuestionFormValues) => {
      // Transform form data to match API structure
      const apiData = {
        ...data,
        options: data.options.map(opt => opt.text),
      };
      
      const res = await apiRequest("POST", "/api/questions", apiData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Question created",
        description: "The question has been created successfully",
      });
      setIsCreateDialogOpen(false);
      createForm.reset({
        text: "",
        options: [{ text: "" }, { text: "" }, { text: "" }, { text: "" }],
        correctOption: 0,
        explanation: "",
        topicId: undefined as unknown as number,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create question",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update question mutation
  const updateQuestionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: QuestionFormValues }) => {
      // Transform form data to match API structure
      const apiData = {
        ...data,
        options: data.options.map(opt => opt.text),
      };
      
      const res = await apiRequest("PUT", `/api/questions/${id}`, apiData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      toast({
        title: "Question updated",
        description: "The question has been updated successfully",
      });
      setIsEditDialogOpen(false);
      setSelectedQuestion(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update question",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete question mutation
  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/questions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Question deleted",
        description: "The question has been deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setSelectedQuestion(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete question",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle create form submission
  function onCreateSubmit(values: QuestionFormValues) {
    createQuestionMutation.mutate(values);
  }
  
  // Handle edit form submission
  function onEditSubmit(values: QuestionFormValues) {
    if (selectedQuestion) {
      updateQuestionMutation.mutate({ id: selectedQuestion.id, data: values });
    }
  }
  
  // Open edit dialog with question data
  function handleEdit(question: any) {
    setSelectedQuestion(question);
    
    // Transform the question to match form structure
    editForm.reset({
      text: question.text,
      options: question.options.map((text: string) => ({ text })),
      correctOption: question.correctOption,
      explanation: question.explanation,
      topicId: question.topicId,
    });
    
    setIsEditDialogOpen(true);
  }
  
  // Open delete dialog
  function handleDelete(question: any) {
    setSelectedQuestion(question);
    setIsDeleteDialogOpen(true);
  }
  
  // Confirm question deletion
  function confirmDelete() {
    if (selectedQuestion) {
      deleteQuestionMutation.mutate(selectedQuestion.id);
    }
  }
  
  // Get topic title by id
  const getTopicTitle = (topicId: number) => {
    const topic = topics?.find(t => t.id === topicId);
    return topic ? topic.title : 'Unknown Topic';
  };
  
  // Get chapter title for a topic
  const getChapterForTopic = (topicId: number) => {
    const topic = topics?.find(t => t.id === topicId);
    if (!topic) return 'Unknown Chapter';
    
    const chapter = chapters?.find(c => c.id === topic.chapterId);
    return chapter ? chapter.title : 'Unknown Chapter';
  };
  
  // Filter topics by chapter
  const getTopicsByChapter = (chapterId: number) => {
    return topics?.filter(topic => topic.chapterId === chapterId) || [];
  };
  
  return (
    <PageContainer title="Manage Questions">
      <div className="mt-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Questions List</h2>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Question
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Question</DialogTitle>
                <DialogDescription>
                  Add a new multiple-choice question
                </DialogDescription>
              </DialogHeader>
              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                  <FormField
                    control={createForm.control}
                    name="text"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Question Text</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter the question text" 
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <FormLabel>Options</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => appendCreateOption({ text: "" })}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add Option
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      {createOptionsFields.map((field, index) => (
                        <div key={field.id} className="flex gap-2 items-start">
                          <FormField
                            control={createForm.control}
                            name={`correctOption`}
                            render={({ field: radioField }) => (
                              <FormItem className="flex items-center space-x-2 space-y-0 pt-2">
                                <FormControl>
                                  <RadioGroupItem
                                    value={index.toString()}
                                    checked={radioField.value === index}
                                    onCheckedChange={() => radioField.onChange(index)}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={createForm.control}
                            name={`options.${index}.text`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormControl>
                                  <Input 
                                    placeholder={`Option ${index + 1}`} 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          {createOptionsFields.length > 2 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeCreateOption(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <FormField
                      control={createForm.control}
                      name="correctOption"
                      render={() => (
                        <FormItem>
                          <FormDescription>
                            Select the radio button next to the correct option
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={createForm.control}
                    name="explanation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Explanation</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Explain why the correct answer is right" 
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={createForm.control}
                      name="topicId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Topic</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(parseInt(value))} 
                            defaultValue={field.value ? field.value.toString() : undefined}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select topic" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {topics?.map((topic) => (
                                <SelectItem 
                                  key={topic.id} 
                                  value={topic.id.toString()}
                                >
                                  {topic.title} ({getChapterForTopic(topic.id)})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      type="submit" 
                      disabled={createQuestionMutation.isPending}
                    >
                      {createQuestionMutation.isPending ? "Creating..." : "Create Question"}
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
                      <Skeleton className="h-5 w-80 mb-2" />
                      <Skeleton className="h-4 w-40" />
                    </div>
                    <div className="flex space-x-2">
                      <Skeleton className="h-9 w-9 rounded-md" />
                      <Skeleton className="h-9 w-9 rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            ) : isQuestionsError ? (
              <div className="p-6 text-center text-red-500">
                Error loading questions
              </div>
            ) : questions?.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <HelpCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium">No questions available</p>
                <p className="mt-1">Create your first question to get started</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Question</TableHead>
                      <TableHead>Topic</TableHead>
                      <TableHead>Chapter</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {questions.map((question: any) => (
                      <TableRow key={question.id}>
                        <TableCell className="max-w-md truncate font-medium">{question.text}</TableCell>
                        <TableCell>{getTopicTitle(question.topicId)}</TableCell>
                        <TableCell>{getChapterForTopic(question.topicId)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEdit(question)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDelete(question)}
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
      
      {/* Edit Question Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Question</DialogTitle>
            <DialogDescription>
              Update question details
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question Text</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter the question text" 
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <FormLabel>Options</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendEditOption({ text: "" })}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Option
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {editOptionsFields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 items-start">
                      <FormField
                        control={editForm.control}
                        name={`correctOption`}
                        render={({ field: radioField }) => (
                          <FormItem className="flex items-center space-x-2 space-y-0 pt-2">
                            <FormControl>
                              <RadioGroupItem
                                value={index.toString()}
                                checked={radioField.value === index}
                                onCheckedChange={() => radioField.onChange(index)}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editForm.control}
                        name={`options.${index}.text`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input 
                                placeholder={`Option ${index + 1}`} 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {editOptionsFields.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeEditOption(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                
                <FormField
                  control={editForm.control}
                  name="correctOption"
                  render={() => (
                    <FormItem>
                      <FormDescription>
                        Select the radio button next to the correct option
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={editForm.control}
                name="explanation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Explanation</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Explain why the correct answer is right" 
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="topicId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Topic</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        defaultValue={field.value ? field.value.toString() : undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select topic" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {topics?.map((topic) => (
                            <SelectItem 
                              key={topic.id} 
                              value={topic.id.toString()}
                            >
                              {topic.title} ({getChapterForTopic(topic.id)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={updateQuestionMutation.isPending}
                >
                  {updateQuestionMutation.isPending ? "Saving..." : "Save Changes"}
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
              This will permanently delete this question. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteQuestionMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
