import { useQuery } from "@tanstack/react-query";
import ProgressBar from "./progress-bar";
import { Skeleton } from "@/components/ui/skeleton";

interface ChapterProgressProps {
  userId?: number;
}

interface ChapterProgress {
  chapterId: number;
  title: string;
  progress: number;
}

export default function ChapterProgress({ userId }: ChapterProgressProps) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/stats"],
  });
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-full max-w-[250px]" />
            <Skeleton className="h-2 w-full" />
          </div>
        ))}
      </div>
    );
  }
  
  const { chapterProgress = [] } = stats || { chapterProgress: [] };
  
  if (chapterProgress.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No chapter progress data available yet.</p>
        <p className="text-sm mt-1">Start taking quizzes to track your progress!</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {chapterProgress.map((chapter: ChapterProgress) => (
        <ProgressBar
          key={chapter.chapterId}
          label={chapter.title}
          progress={chapter.progress}
          showPercentage={true}
        />
      ))}
    </div>
  );
}
