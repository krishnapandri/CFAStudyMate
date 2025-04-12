import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StudyCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  linkHref: string;
  progress?: number;
  count?: number;
  total?: number;
  iconBgColor?: string;
  buttonColor?: string;
  buttonText?: string;
}

export default function StudyCard({
  title,
  description,
  icon: Icon,
  linkHref,
  progress,
  count,
  total,
  iconBgColor = "bg-primary",
  buttonColor = "bg-primary-light hover:bg-primary",
  buttonText = "Continue"
}: StudyCardProps) {
  return (
    <div className="relative rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className={cn("mb-4 flex items-center justify-center h-12 w-12 rounded-md text-white", iconBgColor)}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-500">{description}</p>
      
      {(progress !== undefined || (count !== undefined && total !== undefined)) && (
        <div className="mt-4 flex justify-between items-center">
          <div className="w-24 bg-gray-200 rounded-full h-2">
            <div 
              className={cn("h-2 rounded-full", iconBgColor)} 
              style={{ width: `${progress !== undefined ? progress : (count! / total! * 100)}%` }}
            />
          </div>
          {count !== undefined && total !== undefined && (
            <span className="text-xs text-gray-500">{count}/{total}</span>
          )}
        </div>
      )}
      
      <Link href={linkHref}>
        <a className={cn(
          "mt-4 block w-full rounded-md py-2 text-center text-sm font-semibold text-white shadow-sm",
          buttonColor
        )}>
          {buttonText}
        </a>
      </Link>
    </div>
  );
}
