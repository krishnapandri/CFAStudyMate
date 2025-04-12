import { useQuery } from "@tanstack/react-query";
import PageContainer from "@/components/layout/page-container";
import StatsCard from "@/components/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, BookOpen, Tag, HelpCircle, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function AdminDashboard() {
  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
  });
  
  const { data: users, isLoading: isUsersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
  });
  
  return (
    <PageContainer title="Admin Dashboard">
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
              title="Total Students" 
              value={stats?.totalStudents || 0}
              icon={Users}
              iconBgColor="bg-primary"
            />
            
            <StatsCard 
              title="Total Chapters" 
              value={stats?.chapters || 0}
              icon={BookOpen}
              iconBgColor="bg-blue-500"
            />
            
            <StatsCard 
              title="Total Topics" 
              value={stats?.topics || 0}
              icon={Tag}
              iconBgColor="bg-green-500"
            />
            
            <StatsCard 
              title="Total Questions" 
              value={stats?.questions || 0}
              icon={HelpCircle}
              iconBgColor="bg-gray-700"
            />
          </>
        )}
      </div>
      
      {/* Content Management and User Stats */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Recent Students</CardTitle>
            <Link href="/admin/users" className="text-sm font-medium text-primary hover:text-primary-dark">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {isUsersLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center py-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="ml-3">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32 mt-1" />
                    </div>
                    <Skeleton className="h-6 w-16 ml-auto" />
                  </div>
                ))}
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {users && users
                  .filter(user => user.role === 'student')
                  .slice(0, 5)
                  .map(user => (
                    <li key={user.id} className="py-3 flex justify-between items-center">
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8 bg-gray-200">
                          <AvatarFallback className="text-sm font-medium text-gray-700">
                            {user.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">
                            {user.lastLogin 
                              ? `Last login: ${new Date(user.lastLogin).toLocaleDateString()}`
                              : "Never logged in"}
                          </p>
                        </div>
                      </div>
                      <div>
                        <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                          Active
                        </Badge>
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </CardContent>
        </Card>
        
        {/* Content Management */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Content Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link href="/admin/chapters">
                <Card className="hover:bg-gray-50 cursor-pointer">
                  <CardContent className="p-4 flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded bg-primary flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-white" />
                    </div>
                    <div className="ml-4">
                      <h4 className="text-base font-medium text-gray-900">Manage Chapters</h4>
                      <p className="mt-1 text-sm text-gray-500">Add, edit or remove chapters</p>
                    </div>
                    <div className="ml-auto">
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
              
              <Link href="/admin/topics">
                <Card className="hover:bg-gray-50 cursor-pointer">
                  <CardContent className="p-4 flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded bg-blue-500 flex items-center justify-center">
                      <Tag className="h-5 w-5 text-white" />
                    </div>
                    <div className="ml-4">
                      <h4 className="text-base font-medium text-gray-900">Manage Topics</h4>
                      <p className="mt-1 text-sm text-gray-500">Add, edit or remove topics</p>
                    </div>
                    <div className="ml-auto">
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
              
              <Link href="/admin/questions">
                <Card className="hover:bg-gray-50 cursor-pointer">
                  <CardContent className="p-4 flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded bg-green-500 flex items-center justify-center">
                      <HelpCircle className="h-5 w-5 text-white" />
                    </div>
                    <div className="ml-4">
                      <h4 className="text-base font-medium text-gray-900">Manage Questions</h4>
                      <p className="mt-1 text-sm text-gray-500">Add, edit or remove questions</p>
                    </div>
                    <div className="ml-auto">
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
