import { BookOpen, Lock, ArrowRight } from "lucide-react";
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
    { 
      glow: 'group-hover:shadow-blue-500/20', 
      border: 'hover:border-blue-400/50', 
      text: 'text-blue-400', 
      accent: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-500/10'
    },
    { 
      glow: 'group-hover:shadow-emerald-500/20', 
      border: 'hover:border-emerald-400/50', 
      text: 'text-emerald-400', 
      accent: 'from-emerald-500 to-emerald-600',
      iconBg: 'bg-emerald-500/10'
    },
    { 
      glow: 'group-hover:shadow-purple-500/20', 
      border: 'hover:border-purple-400/50', 
      text: 'text-purple-400', 
      accent: 'from-purple-500 to-purple-600',
      iconBg: 'bg-purple-500/10'
    },
    { 
      glow: 'group-hover:shadow-orange-500/20', 
      border: 'hover:border-orange-400/50', 
      text: 'text-orange-400', 
      accent: 'from-orange-500 to-orange-600',
      iconBg: 'bg-orange-500/10'
    },
  ];
  
  const colorIndex = Math.abs(name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % colors.length;
  const color = colors[colorIndex]!;

  return (
    <Link
      to={href}
      className={`group relative flex flex-col justify-between h-48 p-7 glass-card transition-all duration-300 hover:-translate-y-2 border-white/10 ${color.border} ${color.glow} hover:shadow-2xl hover:shadow-yellow-500/10 overflow-hidden`}
    >
      <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${color.accent} opacity-70 group-hover:opacity-100 transition-opacity`} />
      
      <div className="flex justify-between items-start">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${color.iconBg} ${color.text} transition-colors group-hover:bg-white/10`}>
          <BookOpen className="w-7 h-7" />
        </div>
        {isLocked && (
          <div className="bg-white/5 px-2 py-1 rounded-lg" aria-label="Private folder">
            <Lock className="w-4 h-4 text-white/40" />
          </div>
        )}
      </div>
      
      <div className="flex justify-between items-end mt-4">
        <div className="max-w-[70%]">
          <span className="block font-bold text-xl text-white leading-tight group-hover:text-[#fed01b] transition-colors">{name}</span>
          <p className="text-[10px] font-bold text-white/30 mt-2 uppercase tracking-[0.2em]">Subject Folder</p>
        </div>
        <div className="flex flex-col items-end gap-3">
            <span className="bg-[#040118] border border-white/10 px-4 py-1.5 rounded-full text-[11px] font-bold text-[#fed01b] shadow-xl group-hover:scale-110 transition-transform">
                {fileCount} files
            </span>
            <ArrowRight className="w-5 h-5 text-white/20 group-hover:text-[#fed01b] group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </Link>
  );
}