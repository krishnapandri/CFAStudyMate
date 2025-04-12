import { useQuery } from "@tanstack/react-query";
import PageContainer from "@/components/layout/page-container";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import ProgressBar from "@/components/progress-bar";

export default function ChaptersPage() {
  const { data: chapters, isLoading: isChaptersLoading } = useQuery({
    queryKey: ["/api/chapters"],
  });
  
  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ["/api/stats"],
  });
  
  const isLoading = isChaptersLoading || isStatsLoading;
  
  return (
    <PageContainer title="Chapters">
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-12 w-12 rounded-md" />
                  <Skeleton className="h-5 w-40 mt-4" />
                  <Skeleton className="h-4 w-full mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-2 w-full" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))}
          </>
        ) : (
          <>
            {chapters && chapters.map(chapter => {
              const chapterStats = stats?.chapterProgress?.find(
                cp => cp.chapterId === chapter.id
              ) || { progress: 0 };
              
              return (
                <Card key={chapter.id}>
                  <CardHeader>
                    <div className="flex items-center justify-center w-12 h-12 rounded-md bg-primary text-white">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <CardTitle className="mt-4">{chapter.title}</CardTitle>
                    <CardDescription>{chapter.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ProgressBar 
                      progress={chapterStats.progress} 
                      showPercentage 
                    />
                  </CardContent>
                  <CardFooter>
                    <Link href={`/chapters/${chapter.id}`}>
                      <Button className="w-full">
                        Study Chapter <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              );
            })}
          </>
        )}
      </div>
    </PageContainer>
  );
}
