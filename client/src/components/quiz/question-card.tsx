import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Check, X, ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Question {
  id: number;
  text: string;
  options: string[];
  correctOption: number;
  explanation: string;
}

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  onNext: () => void;
  onPrevious: () => void;
  onAnswer: (questionId: number, selectedOption: number, correct: boolean) => void;
  showResults?: boolean;
}

export default function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  onNext,
  onPrevious,
  onAnswer,
  showResults = false
}: QuestionCardProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  
  const handleOptionSelect = (value: string) => {
    if (isAnswered) return;
    
    const option = parseInt(value, 10);
    setSelectedOption(option);
  };
  
  const handleSubmit = () => {
    if (selectedOption === null || isAnswered) return;
    
    const isCorrect = selectedOption === question.correctOption;
    onAnswer(question.id, selectedOption, isCorrect);
    setIsAnswered(true);
  };
  
  const getOptionClass = (index: number) => {
    if (!isAnswered && !showResults) return "";
    
    if (index === question.correctOption) {
      return "bg-green-50 border-green-200 text-green-800";
    }
    
    if (index === selectedOption && index !== question.correctOption) {
      return "bg-red-50 border-red-200 text-red-800";
    }
    
    return "";
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          <span className="bg-primary text-white rounded-full w-7 h-7 inline-flex items-center justify-center mr-2">
            {questionNumber}
          </span>
          {question.text}
        </h3>
        
        <RadioGroup 
          value={selectedOption?.toString()} 
          onValueChange={handleOptionSelect}
          className="mt-4 space-y-3"
        >
          {question.options.map((option, index) => (
            <div key={index} className={cn(
              "relative flex items-start border rounded-md p-3 transition-colors",
              getOptionClass(index)
            )}>
              <div className="flex items-center h-5">
                <RadioGroupItem value={index.toString()} id={`option-${index}`} disabled={isAnswered || showResults} />
              </div>
              <div className="ml-3 text-sm flex-1">
                <Label htmlFor={`option-${index}`} className="font-medium text-gray-700">
                  {option}
                </Label>
              </div>
              {(isAnswered || showResults) && (
                <div className="ml-auto">
                  {index === question.correctOption ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : (index === selectedOption ? (
                    <X className="h-5 w-5 text-red-500" />
                  ) : null)}
                </div>
              )}
            </div>
          ))}
        </RadioGroup>
        
        {(isAnswered || showResults) && question.explanation && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Explanation:</span> {question.explanation}
            </p>
          </div>
        )}
      </div>
      
      <div className="flex justify-between pt-4 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={onPrevious}
          disabled={questionNumber === 1}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        
        <div className="flex space-x-2">
          {!isAnswered && !showResults && (
            <Button 
              type="button"
              onClick={handleSubmit}
              disabled={selectedOption === null}
            >
              Submit Answer
            </Button>
          )}
          
          <Button
            type="button"
            onClick={onNext}
            disabled={!isAnswered && !showResults}
          >
            {questionNumber === totalQuestions ? "Finish Quiz" : "Next"}
            {questionNumber !== totalQuestions && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
