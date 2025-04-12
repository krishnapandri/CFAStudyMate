import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { format, formatDistanceToNow } from "date-fns";
import { 
  HelpCircle, 
  BookOpen, 
  CheckSquare, 
  Activity,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Activity {
  id: number;
  userId: number;
  activity: string;
  entityType: string | null;
  entityId: number | null;
  createdAt: string;
  metadata: Record<string, any> | null;
}

export default function RecentActivity() {
  const { data: activities, isLoading } = useQuery({
    queryKey: ["/api/activities"],
  });
  
  if (isLoading) {
    return (
      <div className="flow-root">
        <ul className="-mb-8">
          {[1, 2, 3].map(i => (
            <li key={i}>
              <div className="relative pb-8">
                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                <div className="relative flex space-x-3">
                  <div>
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                  <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                    <div>
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="mt-1 h-3 w-20" />
                    </div>
                    <div className="text-right">
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  
  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No recent activity found.</p>
        <p className="text-sm mt-1">Start studying to track your activities!</p>
      </div>
    );
  }
  
  const getIcon = (activity: Activity) => {
    if (activity.activity.includes("quiz")) {
      return HelpCircle;
    } else if (activity.activity.includes("chapter")) {
      return BookOpen;
    } else if (activity.activity.includes("exam")) {
      return CheckSquare;
    } else if (activity.activity.includes("Studied")) {
      return Clock;
    } else {
      return Activity;
    }
  };
  
  const getIconColor = (activity: Activity) => {
    if (activity.activity.includes("quiz")) {
      return "bg-blue-500";
    } else if (activity.activity.includes("chapter")) {
      return "bg-green-500";
    } else if (activity.activity.includes("exam")) {
      return "bg-primary";
    } else if (activity.activity.includes("Studied")) {
      return "bg-purple-500";
    } else {
      return "bg-gray-500";
    }
  };
  
  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {activities.map((activity: Activity, index: number) => {
          const Icon = getIcon(activity);
          const isLast = index === activities.length - 1;
          const date = new Date(activity.createdAt);
          const formattedTime = formatDistanceToNow(date, { addSuffix: true });
          
          return (
            <li key={activity.id}>
              <div className="relative pb-8">
                {!isLast && (
                  <span 
                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" 
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex space-x-3">
                  <div>
                    <span className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white",
                      getIconColor(activity)
                    )}>
                      <Icon className="h-4 w-4 text-white" />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                    <div>
                      <p className="text-sm text-gray-700" dangerouslySetInnerHTML={{
                        __html: activity.activity.replace(/(\b[A-Z][a-z]*\b)/g, '<span class="font-medium">$1</span>')
                      }} />
                      {activity.metadata?.score !== undefined && (
                        <p className="mt-1 text-xs text-gray-500">
                          Score: {activity.metadata.score}/{activity.metadata.totalQuestions}
                        </p>
                      )}
                      {activity.metadata?.duration !== undefined && (
                        <p className="mt-1 text-xs text-gray-500">
                          Duration: {activity.metadata.duration} minutes
                        </p>
                      )}
                    </div>
                    <div className="text-right text-xs text-gray-500 whitespace-nowrap">
                      <time dateTime={date.toISOString()} title={format(date, 'PPpp')}>
                        {formattedTime}
                      </time>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
