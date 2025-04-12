import { useQuery } from "@tanstack/react-query";
import PageContainer from "@/components/layout/page-container";
import StatsCard from "@/components/stats-card";
import ChapterProgress from "@/components/chapter-progress";
import RecentActivity from "@/components/recent-activity";
import StudyCard from "@/components/study-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, CheckCircle, HelpCircle, Clock, Calculator, FileText, BarChart2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

export default function StudentDashboard() {
  const { user } = useAuth();
  
  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ["/api/stats"],
  });
  
  const { data: topics, isLoading: isTopicsLoading } = useQuery({
    queryKey: ["/api/topics"],
  });
  
  const { data: chapters, isLoading: isChaptersLoading } = useQuery({
    queryKey: ["/api/chapters"],
  });
  
  const formattedLastLogin = user?.lastLogin 
    ? format(new Date(user.lastLogin), "MMMM d, yyyy 'at' h:mm a") 
    : "First login";
  
  return (
    <PageContainer 
      title="Student Dashboard" 
      subtitle={`Last login: ${formattedLastLogin}`}
    >
      {/* Summary Cards */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {isStatsLoading ? (
          <>
            {[1, 2, 3, 4].map(i => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Skeleton className="h-12 w-12 rounded-md" />
                    <div className="ml-5 w-0 flex-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-8 w-16 mt-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <StatsCard 
              title="Overall Progress" 
              value={`${stats?.overallProgress || 0}%`}
              icon={TrendingUp}
              iconBgColor="bg-primary-light"
              progress={stats?.overallProgress || 0}
            />
            
            <StatsCard 
              title="Accuracy" 
              value={`${stats?.accuracy || 0}%`}
              icon={CheckCircle}
              iconBgColor="bg-green-500"
              progress={stats?.accuracy || 0}
            />
            
            <StatsCard 
              title="Questions Attempted" 
              value={stats?.questionsAttempted || 0}
              icon={HelpCircle}
              iconBgColor="bg-blue-500"
            />
            
            <StatsCard 
              title="Study Time" 
              value={`${stats?.studyTime || 0} hrs`}
              icon={Clock}
              iconBgColor="bg-gray-700"
            />
          </>
        )}
      </div>
      
      {/* Recent Activity & Chapter Progress */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Chapter Progress */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Chapter Progress</CardTitle>
          </CardHeader>
          <CardContent className="max-h-96 overflow-y-auto">
            <ChapterProgress />
          </CardContent>
        </Card>
        
        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="max-h-96 overflow-y-auto">
            <RecentActivity />
          </CardContent>
        </Card>
      </div>
      
      {/* Continue Studying Section */}
      <Card className="mt-8">
        <CardHeader className="pb-2">
          <CardTitle>Continue Studying</CardTitle>
        </CardHeader>
        <CardContent>
          {isTopicsLoading || isChaptersLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-12 w-12 rounded-md" />
                    <Skeleton className="h-5 w-40 mt-4" />
                    <Skeleton className="h-4 w-full mt-2" />
                    <Skeleton className="h-2 w-full mt-4" />
                    <Skeleton className="h-10 w-full mt-4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Example study cards - replace with real data from your API */}
              <StudyCard 
                title="Time Value of Money"
                description="Practice advanced concepts in time value calculations."
                icon={Calculator}
                linkHref="/quiz/1"
                progress={80}
                count={8}
                total={10}
                iconBgColor="bg-primary"
              />
              
              <StudyCard 
                title="Financial Analysis"
                description="Master financial statement analysis and ratios."
                icon={FileText}
                linkHref="/quiz/2"
                progress={35}
                count={7}
                total={20}
                iconBgColor="bg-blue-500"
                buttonColor="bg-blue-500 hover:bg-blue-600"
              />
              
              <StudyCard 
                title="Market Indices"
                description="Learn about different market indices and their construction."
                icon={BarChart2}
                linkHref="/quiz/3"
                progress={20}
                count={3}
                total={15}
                iconBgColor="bg-green-500"
                buttonColor="bg-green-500 hover:bg-green-600"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
