import { useQuery } from "@tanstack/react-query";
import PageContainer from "@/components/layout/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import ChapterProgress from "@/components/chapter-progress";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import { format, subDays } from "date-fns";
import { 
  TrendingUp, 
  CheckCircle, 
  HelpCircle, 
  Clock, 
  AlertTriangle 
} from "lucide-react";
import { cn } from "@/lib/utils";

// Custom tooltip for chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded shadow-sm">
        <p className="text-sm font-medium">{`${label}`}</p>
        <p className="text-sm text-gray-700">{`Score: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

export default function PerformancePage() {
  // Fetch user stats
  const { 
    data: stats, 
    isLoading: isStatsLoading 
  } = useQuery({
    queryKey: ["/api/stats"],
  });
  
  // Fetch quiz attempts
  const { 
    data: quizAttempts, 
    isLoading: isQuizAttemptsLoading 
  } = useQuery({
    queryKey: ["/api/quiz-attempts"],
  });
  
  // Fetch study sessions
  const { 
    data: studySessions, 
    isLoading: isStudySessionsLoading 
  } = useQuery({
    queryKey: ["/api/study-sessions"],
  });
  
  const isLoading = isStatsLoading || isQuizAttemptsLoading || isStudySessionsLoading;
  
  // Prepare data for accuracy pie chart
  const getPieChartData = () => {
    if (!stats) return [];
    
    const { accuracy } = stats;
    return [
      { name: "Correct", value: accuracy, color: "#10B981" },
      { name: "Incorrect", value: 100 - accuracy, color: "#EF4444" }
    ];
  };
  
  // Prepare data for quiz attempts chart (last 7 attempts)
  const getQuizAttemptsData = () => {
    if (!quizAttempts || quizAttempts.length === 0) return [];
    
    return quizAttempts
      .slice(0, 7)
      .map(attempt => ({
        name: format(new Date(attempt.completedAt), "MMM d"),
        score: Math.round((attempt.score / attempt.totalQuestions) * 100)
      }))
      .reverse();
  };
  
  // Prepare data for study time by day (last 7 days)
  const getStudyTimeByDay = () => {
    if (!studySessions || studySessions.length === 0) return [];
    
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), i);
      return {
        date,
        day: format(date, "EEE"),
        minutes: 0
      };
    }).reverse();
    
    // Group sessions by day and sum up duration
    studySessions.forEach(session => {
      const sessionDate = new Date(session.startedAt);
      const dayIndex = last7Days.findIndex(day => 
        day.date.getDate() === sessionDate.getDate() &&
        day.date.getMonth() === sessionDate.getMonth() &&
        day.date.getFullYear() === sessionDate.getFullYear()
      );
      
      if (dayIndex !== -1) {
        last7Days[dayIndex].minutes += session.duration;
      }
    });
    
    return last7Days.map(day => ({
      name: day.day,
      minutes: day.minutes
    }));
  };
  
  return (
    <PageContainer title="Performance Dashboard">
      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => (
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
          ))
        ) : (
          <>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 rounded-md p-3 bg-primary">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <div className="text-sm font-medium text-gray-500">Overall Progress</div>
                    <div className="text-lg font-medium text-gray-900">{stats?.overallProgress || 0}%</div>
                    <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${stats?.overallProgress || 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 rounded-md p-3 bg-green-500">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <div className="text-sm font-medium text-gray-500">Accuracy</div>
                    <div className="text-lg font-medium text-gray-900">{stats?.accuracy || 0}%</div>
                    <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${stats?.accuracy || 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 rounded-md p-3 bg-blue-500">
                    <HelpCircle className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <div className="text-sm font-medium text-gray-500">Questions Attempted</div>
                    <div className="text-lg font-medium text-gray-900">{stats?.questionsAttempted || 0}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 rounded-md p-3 bg-gray-700">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <div className="text-sm font-medium text-gray-500">Study Time</div>
                    <div className="text-lg font-medium text-gray-900">
                      {stats?.studyTime ? `${stats.studyTime} hrs` : '0 hrs'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
      
      {/* Chart Sections */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Accuracy Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Accuracy Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Skeleton className="h-64 w-64 rounded-full" />
              </div>
            ) : stats?.questionsAttempted ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getPieChartData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {getPieChartData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <AlertTriangle className="h-12 w-12 mb-4 text-amber-500" />
                <p className="text-center">No quiz data available yet.</p>
                <p className="text-sm mt-2 text-center">Take some quizzes to see your accuracy breakdown.</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Recent Quiz Performance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Recent Quiz Performance (%)</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {isLoading ? (
              <div className="flex flex-col justify-center space-y-4 h-full">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : quizAttempts?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={getQuizAttemptsData()}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="score" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <AlertTriangle className="h-12 w-12 mb-4 text-amber-500" />
                <p className="text-center">No quiz attempts available yet.</p>
                <p className="text-sm mt-2 text-center">Complete some quizzes to track your performance.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Study Time and Chapter Progress */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Study Time by Day */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Study Time by Day (minutes)</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {isLoading ? (
              <div className="flex flex-col justify-center space-y-4 h-full">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : studySessions?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={getStudyTimeByDay()}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="minutes" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <AlertTriangle className="h-12 w-12 mb-4 text-amber-500" />
                <p className="text-center">No study sessions recorded yet.</p>
                <p className="text-sm mt-2 text-center">Log your study time to track your progress.</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Chapter Progress */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Chapter Progress</CardTitle>
          </CardHeader>
          <CardContent className="h-80 overflow-y-auto">
            <ChapterProgress />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
