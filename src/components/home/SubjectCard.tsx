import { BookOpen, Lock } from "lucide-react";
import { Link } from "@tanstack/react-router";

interface SubjectCardProps {
  name: string;
  icon?: string;
  fileCount: number;
  isLocked?: boolean;
  href: string;
}

export function SubjectCard({ name, fileCount, isLocked, href }: SubjectCardProps) {
  const colors = [
    { bg: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20', border: 'border-blue-200 dark:border-blue-700', text: 'text-blue-600 dark:text-blue-400', accent: 'bg-blue-500' },
    { bg: 'from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20', border: 'border-emerald-200 dark:border-emerald-700', text: 'text-emerald-600 dark:text-emerald-400', accent: 'bg-emerald-500' },
    { bg: 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20', border: 'border-purple-200 dark:border-purple-700', text: 'text-purple-600 dark:text-purple-400', accent: 'bg-purple-500' },
    { bg: 'from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20', border: 'border-orange-200 dark:border-orange-700', text: 'text-orange-600 dark:text-orange-400', accent: 'bg-orange-500' },
  ];
  
  const colorIndex = Math.abs(name.length) % colors.length;
  const color = colors[colorIndex]!;

  return (
    <Link
      to={href}
      className={`group relative flex flex-col justify-between h-44 p-6 rounded-2xl border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 bg-gradient-to-br ${color.bg} ${color.border} hover:border-transparent overflow-hidden`}
    >
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-secondary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${color.accent} rounded-t-2xl`} />

      <div className="relative z-10 flex justify-between items-start">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-white dark:bg-slate-800 shadow-sm ${color.text}`}>
          <BookOpen className="w-6 h-6" />
        </div>
        {isLocked && (
          <div className="bg-white/50 dark:bg-black/20 p-1.5 rounded-full" aria-label="Private folder">
            <Lock className="w-4 h-4 text-primary/60" />
          </div>
        )}
      </div>
      
      <div className="relative z-10 flex justify-between items-end mt-4">
        <div>
          <span className="block font-bold text-xl text-primary leading-tight">{name}</span>
          <p className="text-xs font-medium text-muted-foreground mt-1 uppercase tracking-wider">Subject Folder</p>
        </div>
        <span className="bg-secondary px-4 py-1.5 rounded-full text-xs font-bold text-primary shadow-sm group-hover:scale-110 transition-transform">
          {fileCount} files
        </span>
      </div>
    </Link>
  );
}
