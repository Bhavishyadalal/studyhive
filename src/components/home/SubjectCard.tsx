import { BookOpen, Lock, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

interface SubjectCardProps {
  name: string;
  icon?: string;
  fileCount: number;
  isLocked?: boolean;
  href: string;
}

export function SubjectCard({ name, icon, fileCount, isLocked, href }: SubjectCardProps) {
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
      title={name}
      className="group relative flex flex-col justify-between h-52 p-7 glass-card transition-all duration-300 ease-out hover:-translate-y-2 hover:scale-[1.01] border-white/5 glow-border card-hover overflow-hidden"
    >
      {/* Top accent line */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${color.accent} opacity-40 group-hover:opacity-100 transition-opacity`} />
      
      {/* Glow blob behind icon */}
      <div className={`absolute top-10 left-10 w-20 h-20 rounded-full blur-[40px] opacity-0 group-hover:opacity-20 transition-opacity bg-gradient-to-r ${color.accent}`} />

      <div className="flex justify-between items-start relative z-10">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 ${color.text} transition-all group-hover:scale-110 duration-500`}>
            {icon ? (
              <span className="text-3xl">{icon}</span>
            ) : (
              <BookOpen className="w-7 h-7" />
            )}
          </div>
        </div>
        {isLocked && (
          <div className="bg-white/5 border border-white/10 p-2 rounded-xl" aria-label="Private folder">
            <Lock className="w-4 h-4 text-white/40 animate-pulse" />
          </div>
        )}
      </div>
      
      <div className="relative z-10">
        <span className="block font-black text-2xl text-foreground tracking-tight leading-tight group-hover:text-primary transition-colors">{name}</span>
        <div className="flex items-center justify-between mt-4">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Subject</p>
          <div className="flex items-center gap-2">
            <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-[10px] font-black text-secondary tracking-widest uppercase">
              {fileCount} files
            </span>
            <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-secondary group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </div>
    </Link>
  );
}

export function getStudyEmoji(name: string) {
  const firstLetter = (name[0] || 'A').toUpperCase();
  if ('ABCD'.includes(firstLetter)) return '📖';
  if ('EFGH'.includes(firstLetter)) return '📝';
  if ('IJKL'.includes(firstLetter)) return '🔬';
  if ('MNOP'.includes(firstLetter)) return '📐';
  if ('QRST'.includes(firstLetter)) return '🌍';
  return '💡';
}