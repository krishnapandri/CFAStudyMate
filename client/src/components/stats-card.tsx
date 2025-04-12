import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconBgColor?: string;
  progress?: number;
}

export default function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  iconBgColor = "bg-primary", 
  progress 
}: StatsCardProps) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          <div className={cn("flex-shrink-0 rounded-md p-3", iconBgColor)}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd>
                <div className="text-lg font-medium text-gray-900">{value}</div>
                {typeof progress === 'number' && (
                  <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={cn("h-2 rounded-full", iconBgColor)} 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
