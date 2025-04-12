import { cn } from "@/lib/utils";

interface ProgressBarProps {
  progress: number;
  label?: string;
  showPercentage?: boolean;
  size?: "sm" | "md" | "lg";
  color?: string;
}

export default function ProgressBar({ 
  progress, 
  label, 
  showPercentage = false,
  size = "md",
  color = "bg-primary"
}: ProgressBarProps) {
  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4"
  };
  
  return (
    <div>
      {(label || showPercentage) && (
        <div className="flex justify-between mb-1">
          {label && (
            <span className="text-base font-medium text-gray-700">{label}</span>
          )}
          {showPercentage && (
            <span className="text-sm font-medium text-gray-700">{progress}%</span>
          )}
        </div>
      )}
      <div className={cn("w-full bg-gray-200 rounded-full", sizeClasses[size])}>
        <div 
          className={cn("rounded-full", color, sizeClasses[size])} 
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
