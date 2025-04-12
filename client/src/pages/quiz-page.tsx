import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useState, useEffect } from "react";
import PageContainer from "@/components/layout/page-container";
import QuestionCard from "@/components/quiz/question-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Timer, CheckCircle, XCircle } from "lucide-react";

export default function QuizPage() {
  const params = useParams<{ topicId: string }>();
  const topicId = parseInt(params.topicId);
  const [, navigate] = useLocation();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, { selected: number, correct: boolean }>>({});
  const [quizComplete, setQuizComplete] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [quizStartTime, setQuizStartTime] = useState<Date | null>(null);
  
  // Fetch topic info
  const { 
    data: topic, 
    isLoading: isTopicLoading,
    isError: isTopicError
  } = useQuery({
    queryKey: [`/api/topics/${topicId}`],
    enabled: !isNaN(topicId)
  });
  
  // Fetch chapter info if topic is loaded
  const {
    data: chapter,
    isLoading: isChapterLoading
  } = useQuery({
    queryKey: [`/api/chapters/${topic?.chapterId}`],
    enabled: !!topic?.chapterId
  });
  
  // Fetch questions for this topic
  const { 
    data: questions, 
    isLoading: isQuestionsLoading,
    isError: isQuestionsError
  } = useQuery({
    queryKey: [`/api/topics/${topicId}/questions`],
    enabled: !isNaN(topicId)
  });
  
  // Submit quiz attempt mutation
  const submitQuizMutation = useMutation({
    mutationFn: async (data: { topicId: number, score: number, totalQuestions: number }) => {
      const res = await apiRequest("POST", "/api/quiz-attempts", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
    }
  });
  
  // Start the timer when questions are loaded
  useEffect(() => {
    if (questions && questions.length > 0 && !quizStartTime) {
      setQuizStartTime(new Date());
      setTimeLeft(questions.length * 60); // 1 minute per question
    }
  }, [questions, quizStartTime]);
  
  // Countdown timer
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || quizComplete) return;
    
    const timerId = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);
    
    return () => clearTimeout(timerId);
  }, [timeLeft, quizComplete]);
  
  // Format time left for display
  const formatTimeLeft = () => {
    if (timeLeft === null) return "--:--";
    
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Handle answer selection
  const handleAnswer = (questionId: number, selectedOption: number, correct: boolean) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { selected: selectedOption, correct }
    }));
  };
  
  // Navigate to next question
  const handleNext = () => {
    if (currentQuestionIndex < (questions?.length || 0) - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
    } else {
      finishQuiz();
    }
  };
  
  // Navigate to previous question
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prevIndex => prevIndex - 1);
    }
  };
  
  // Finish quiz and submit results
  const finishQuiz = () => {
    setQuizComplete(true);
    
    if (!questions) return;
    
    const totalQuestions = questions.length;
    const correctAnswers = Object.values(answers).filter(a => a.correct).length;
    
    submitQuizMutation.mutate({
      topicId,
      score: correctAnswers,
      totalQuestions
    });
  };
  
  // Return to dashboard after completing quiz
  const handleReturnToDashboard = () => {
    navigate('/');
  };
  
  // Show loading state
  if (isTopicLoading || isQuestionsLoading) {
    return (
      <PageContainer title="Quiz">
        <div className="mt-6">
          <Skeleton className="h-8 w-64 mb-4" />
          <div className="flex justify-between items-center mb-6">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-10 w-24" />
          </div>
          
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-full mb-4" />
              <div className="space-y-4 mt-6">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
              <div className="flex justify-between mt-8 pt-4 border-t">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    );
  }
  
  // Show error state
  if (isTopicError || isQuestionsError || !topic || !questions) {
    return (
      <PageContainer title="Quiz Error">
        <Card className="mt-6">
          <CardContent className="p-6 text-center">
            <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Failed to Load Quiz</h2>
            <p className="text-gray-600 mb-4">
              {!topic ? "Topic not found" : "Failed to load questions for this topic."}
            </p>
            <Button onClick={() => navigate('/')}>Return to Dashboard</Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }
  
  // Show empty state if no questions
  if (questions.length === 0) {
    return (
      <PageContainer title={`Quiz: ${topic.title}`}>
        <Card className="mt-6">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">No Questions Available</h2>
            <p className="text-gray-600 mb-4">
              There are no questions available for this topic yet.
            </p>
            <Button onClick={() => navigate('/')}>Return to Dashboard</Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }
  
  const currentQuestion = questions[currentQuestionIndex];
  const questionsAnswered = Object.keys(answers).length;
  const correctAnswers = Object.values(answers).filter(a => a.correct).length;
  
  return (
    <PageContainer 
      title={`Quiz: ${topic.title}`}
      subtitle={chapter ? `Chapter: ${chapter.title}` : undefined}
    >
      <div className="flex justify-between items-center mt-4 mb-6">
        <div>
          <span className="text-sm text-gray-500">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <div className="text-sm text-gray-500">
            {questionsAnswered} answered • {correctAnswers} correct
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm px-4 py-2 flex items-center">
          <Timer className="text-gray-500 mr-2 h-5 w-5" />
          <span className="text-gray-700 font-medium">{formatTimeLeft()}</span>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <QuestionCard
            question={currentQuestion}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={questions.length}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onAnswer={handleAnswer}
            showResults={quizComplete}
          />
        </CardContent>
      </Card>
      
      {/* Quiz Complete Dialog */}
      <AlertDialog open={quizComplete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Quiz Complete!</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="py-4">
                <div className="flex items-center justify-center mb-4">
                  <div className="rounded-full bg-green-100 p-3">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <h3 className="text-center text-lg font-medium mb-4">
                  Your Score: {correctAnswers} out of {questions.length}
                </h3>
                <div className="text-center">
                  <p className="mb-2">Accuracy: {Math.round((correctAnswers / questions.length) * 100)}%</p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleReturnToDashboard}>
              Return to Dashboard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
