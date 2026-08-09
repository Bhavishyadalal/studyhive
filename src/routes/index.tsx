import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { Navbar } from "@/components/layout/Navbar";
import { SubjectCard } from "@/components/home/SubjectCard";
import { Search, Loader2, Plus, X, Clock, BookOpen, ChevronRight } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getFolders, getRecentFiles, createFolder } from "@/lib/google-drive/drive.functions";
import { toast } from "sonner";
import { useState, useMemo, useEffect } from "react";

function AnnouncementBanner() {
  const [dismissed, setDismissed] = useState(false);
  const announcement = import.meta.env['VITE_ANNOUNCEMENT'];

  const [wasDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !!sessionStorage.getItem("banner-dismissed");
  });

  if (!announcement || dismissed || wasDismissed) return null;

  return (
    <div className="bg-[#fed01b] text-[#040118] py-3 px-4 flex items-center justify-between gap-4 font-bold text-sm relative z-[60]">
      <div className="flex-1 text-center">
        <p>{announcement}</p>
      </div>
      <button 
        onClick={() => {
          sessionStorage.setItem("banner-dismissed", "1");
          setDismissed(true);
        }}
        className="shrink-0 p-1 hover:opacity-60 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => {
    return z.object({
      scrollTo: z.string().optional(),
    }).parse(search);
  },
  component: Index,
});

function Index() {
  const { scrollTo } = Route.useSearch();
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    if (scrollTo === 'subjects') {
      document.getElementById('browse-subjects')?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [scrollTo]);
  
  const { data: subjects, isLoading, error } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => getFolders({ data: {} }),
  });

  const { data: recentFiles } = useQuery({
    queryKey: ['recentFiles'],
    queryFn: () => getRecentFiles({ data: {} }),
  });

  const createSubjectMutation = useMutation({
    mutationFn: (name: string) => createFolder({ data: { name } }),
    onSuccess: () => {
      toast.success("Subject created successfully!");
      setIsModalOpen(false);
      setNewSubjectName("");
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
    onError: (err: any) => {
      toast.error(`Error: ${err.message}`);
    }
  });

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    createSubjectMutation.mutate(newSubjectName.trim());
  };


  const handleHeroSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && search.trim().length > 1) {
      navigate({ to: "/search", search: { q: search } });
    }
  };

  const totalSubjects = subjects?.length ?? 0;
  const totalFiles = subjects?.reduce((acc: number, s: any) => acc + (s.fileCount || 0), 0) ?? 0;

  const filteredSubjects = useMemo(() => {
    if (!subjects) return [];
    return subjects.filter((s: any) => 
      s.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [subjects, search]);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <Navbar />
      
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0f0a2e] to-[#040118] py-24 text-white">
        <div className="absolute inset-0 z-0">
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-purple-600/20 blur-[120px]" />
          <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-yellow-500/15 blur-[120px]" />
          <div className="absolute bottom-0 right-20 h-80 w-80 rounded-full bg-blue-600/15 blur-[120px]" />
        </div>
        
        <main className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight">
            Share notes. <span className="text-[#fed01b] yellow-shadow">Learn together</span>.
          </h1>
          <div className="relative max-w-2xl mx-auto mb-16">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-yellow-500/70 w-6 h-6" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleHeroSearch}
              placeholder="Search for subjects..." 
              className="w-full h-[68px] pl-16 pr-6 bg-white/[0.06] border border-white/10 rounded-full shadow-xl focus:outline-none focus:ring-4 focus:ring-yellow-400/30 transition-all text-lg text-white placeholder-white/30"
            />
          </div>
          
          <div className="flex justify-center items-center gap-12 text-sm">
            <div className="glass px-8 py-4 rounded-full flex flex-col items-center gap-1">
              <span className="text-3xl font-bold">
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  totalFiles
                )}
              </span>
              <span className="text-white/60 uppercase text-[10px] tracking-widest font-bold">Notes Shared</span>
            </div>
            <div className="glass px-8 py-4 rounded-full flex flex-col items-center gap-1">
              <span className="text-3xl font-bold">
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  totalSubjects
                )}
              </span>
              <span className="text-white/60 uppercase text-[10px] tracking-widest font-bold">Subjects</span>
            </div>
            <div className="glass px-8 py-4 rounded-full flex flex-col items-center gap-1">
              <span className="text-3xl font-bold">Free</span>
              <span className="text-white/60 uppercase text-[10px] tracking-widest font-bold">Always</span>
            </div>
          </div>
        </main>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Recently Uploaded */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-primary mb-6 border-l-4 border-yellow-400 pl-4">Recently Uploaded</h2>
          <div className="flex gap-6 overflow-x-auto pb-4">
            {recentFiles?.map((file: any) => (
              <div key={file.id} className="min-w-[280px] glass-card p-6 border border-white/5 shadow-xl hover:shadow-2xl hover:scale-105 transition-all group shimmer">
                <div>
                  <p className="font-bold text-lg truncate text-primary">{file.name}</p>
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-secondary/10 text-secondary text-[10px] font-bold mt-2 tracking-widest uppercase">
                    {file.subjectName}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-6 flex justify-between items-center font-bold">
                  <span className="bg-white/5 px-2 py-1 rounded">{file.uploader}</span>
                  <span>{file.date}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Subjects Grid */}
        <section id="browse-subjects">
          <h2 className="text-2xl font-bold text-primary mb-8">Browse Subjects</h2>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-40 bg-card rounded-lg border animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredSubjects.map((subject: any) => (
                <SubjectCard 
                  key={subject.id} 
                  name={subject.name}
                  icon="📚"
                  fileCount={subject.fileCount}
                  isLocked={subject.isLocked}
                  href={`/subject/${subject.id}`}
                />
              ))}

              {/* Add Subject Card */}
              <button 
                onClick={() => setIsModalOpen(true)}
                className="h-40 bg-card/50 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 hover:border-secondary hover:bg-card transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                  <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary" />
                </div>
                <span className="font-bold text-muted-foreground group-hover:text-primary">Add Subject</span>
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Create Subject Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#040118]/85 backdrop-blur-xl">
          <div className="glass-card w-full max-w-md border-white/10 shadow-2xl p-8 md:p-10 animate-in fade-in zoom-in duration-300 rounded-[28px]">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-primary">New Subject</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X className="w-8 h-8 text-white/50" />
              </button>
            </div>
            
            <form onSubmit={handleCreateSubject} className="space-y-8">
              <div>
                <label className="block text-xs font-bold text-white/40 uppercase tracking-[0.2em] mb-3 ml-1">Subject Name</label>
                <input 
                  autoFocus
                  type="text"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="e.g. Computer Science"
                  className="w-full h-16 px-6 bg-white/[0.04] border border-white/10 focus:border-secondary focus:ring-1 focus:ring-secondary rounded-2xl outline-none transition-all text-lg text-white placeholder-white/20"
                />
              </div>
              
              <button 
                disabled={createSubjectMutation.isPending}
                className="w-full h-16 bg-[#fed01b] text-[#040118] text-lg font-bold rounded-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 yellow-glow"
              >
                {createSubjectMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : "Create Subject"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
