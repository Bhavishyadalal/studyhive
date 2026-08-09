import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { Navbar } from "@/components/layout/Navbar";
import { SubjectCard } from "@/components/home/SubjectCard";
import { Search, Loader2, Plus, X, Clock, BookOpen, ChevronRight, CloudUpload } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getFolders, getRecentFiles, createFolder, getTotalFileCount } from "@/lib/google-drive/drive.functions";
import { toast } from "sonner";
import { useState, useMemo, useEffect } from "react";

function AnnouncementBanner() {
  const [dismissed, setDismissed] = useState(false);
  const announcement = import.meta.env['VITE_ANNOUNCEMENT'];

  useEffect(() => {
    const wasDismissed = !!sessionStorage.getItem("banner-dismissed");
    if (wasDismissed) setDismissed(true);
  }, []);

  if (!announcement || dismissed) return null;

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

  const { data: notesShared, isLoading: isNotesCountLoading } = useQuery({
    queryKey: ['totalFileCount'],
    queryFn: () => getTotalFileCount({ data: {} }),
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
          <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-purple-600/10 blur-[120px] animate-blob" />
          <div className="absolute right-[-10%] top-[-10%] h-[600px] w-[600px] rounded-full bg-[#fed01b]/10 blur-[140px] animate-blob stagger-2" />
          <div className="absolute bottom-[-20%] left-[20%] h-[400px] w-[400px] rounded-full bg-blue-600/10 blur-[100px] animate-blob stagger-4" />
        </div>
        
        <main className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/10 mb-8 animate-fade-up">
            <div className="w-2 h-2 rounded-full bg-[#fed01b] animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">
              Free forever · No sign up required
            </span>
          </div>

          {/* Headline */}
          <div className="animate-fade-up stagger-1">
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-black mb-6 tracking-tighter leading-[0.9]">
              Share notes.<br />
              <span className="gradient-text">Learn together.</span>
            </h1>
          </div>

          {/* Subheadline */}
          <div className="animate-fade-up stagger-2">
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-white/50 mb-12 font-medium leading-relaxed">
              The student notes platform where knowledge flows freely — upload, discover, and ace your exams.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative max-w-2xl mx-auto mb-20 animate-fade-up stagger-3 group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 w-6 h-6 group-focus-within:text-[#fed01b] transition-colors" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleHeroSearch}
              placeholder="Search subjects, topics, notes..."
              className="w-full h-16 pl-14 pr-6 bg-white/[0.06] border border-white/10 hover:border-white/20 focus:border-[#fed01b]/50 rounded-2xl shadow-2xl focus:outline-none focus:ring-2 focus:ring-[#fed01b]/20 transition-all duration-300 text-base text-white placeholder-white/25 backdrop-blur-sm"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black text-white/40">
              ↵ Enter
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-12 animate-fade-up stagger-4">
            {[
              { value: isNotesCountLoading ? null : (notesShared || 0), label: 'Notes Shared' },
              { value: isLoading ? null : totalSubjects, label: 'Subjects' },
              { value: 'Free', label: 'Always' },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center gap-1 group cursor-default">
                <span className="text-4xl md:text-5xl font-black tracking-tighter group-hover:scale-110 transition-transform duration-300">
                  {stat.value === null ? <Loader2 className="w-8 h-8 animate-spin text-white/20" /> : stat.value}
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 group-hover:text-[#fed01b] transition-colors">{stat.label}</span>
              </div>
            ))}
          </div>
        </main>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Recently Uploaded */}
        <section className="mb-20">
          <div className="flex flex-col mb-8 animate-fade-up">
            <h2 className="section-heading text-primary">Recently Uploaded</h2>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em] mt-2 ml-4">Latest notes</p>
          </div>
          
          <div className="flex gap-6 overflow-x-auto pb-8 pt-2 scrollbar-hide">
            {!recentFiles && (
              <div className="flex gap-6">
                {[1,2,3].map(i => (
                  <div key={i} className="min-w-[260px] h-[160px] rounded-2xl bg-muted/30 shimmer-loading" />
                ))}
              </div>
            )}
            
            {recentFiles && recentFiles.length > 0 ? recentFiles.map((file: any, index: number) => (
              <div 
                key={file.id} 
                className="min-w-[260px] max-w-[260px] bg-white/[0.04] border border-white/[0.07] hover:border-[#fed01b]/30 rounded-2xl p-5 flex flex-col gap-3 card-hover glow-border cursor-default"
                style={{ animationDelay: `${(index + 3) * 0.1}s` }}
              >
                <div>
                  <p className="font-bold text-lg truncate text-primary">{file.name}</p>
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-secondary/10 text-secondary text-[10px] font-bold mt-2 tracking-widest uppercase">
                    {file.subjectName}
                  </div>
                </div>
                <div className="text-[10px] text-muted-foreground mt-auto flex justify-between items-center font-black uppercase tracking-widest">
                  <span className="bg-muted/20 px-2 py-1 rounded">{file.uploader}</span>
                  <span>{file.date}</span>
                </div>
              </div>
            )) : recentFiles?.length === 0 && (
              <div className="w-full py-16 text-center bg-card rounded-[2rem] border-2 border-dashed border-border animate-fade-up stagger-3">
                <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CloudUpload className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-bold text-sm tracking-widest uppercase">
                  No notes uploaded yet — be the first! 🐝
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Subjects Grid */}
        <section id="browse-subjects">
          <div className="flex flex-col mb-10 animate-fade-up">
            <h2 className="section-heading text-primary">Browse Subjects</h2>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em] mt-2 ml-4">{totalSubjects} subjects</p>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-48 rounded-[2rem] shimmer-loading" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredSubjects.map((subject: any, index: number) => (
                <div key={subject.id} className="animate-fade-up" style={{ animationDelay: `${(index + 1) * 0.1}s` }}>
                  <SubjectCard 
                    name={subject.name}
                    icon="📚"
                    fileCount={subject.fileCount}
                    isLocked={subject.isLocked}
                    href={`/subject/${subject.id}`}
                  />
                </div>
              ))}

              {/* Add Subject Card */}
              <div className="animate-fade-up" style={{ animationDelay: `${(filteredSubjects.length + 1) * 0.1}s` }}>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="w-full h-40 bg-card/50 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 hover:border-secondary hover:bg-card transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center group-hover:bg-secondary/20 group-hover:rotate-90 transition-all duration-300">
                    <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary" />
                  </div>
                  <span className="font-bold text-muted-foreground group-hover:text-primary">Add Subject</span>
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Create Subject Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-md border border-border shadow-2xl p-8 md:p-10 animate-scale-in rounded-[28px]">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-foreground">New Subject</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
                <X className="w-8 h-8" />
              </button>
            </div>
            
            <form onSubmit={handleCreateSubject} className="space-y-8">
              <div>
                <label className="block text-xs font-bold text-foreground/40 uppercase tracking-[0.2em] mb-3 ml-1">Subject Name</label>
                <input 
                  autoFocus
                  type="text"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="e.g. Computer Science"
                  className="w-full h-16 px-6 bg-muted/50 border border-border focus:border-secondary focus:ring-1 focus:ring-secondary rounded-2xl outline-none transition-all text-lg text-foreground placeholder:text-muted-foreground"
                />
              </div>
              
              <button 
                disabled={createSubjectMutation.isPending}
                className="w-full h-16 bg-[#fed01b] text-[#040118] text-lg font-bold rounded-2xl hover:scale-[1.02] hover:brightness-110 active:scale-95 transition-all duration-150 flex items-center justify-center gap-3 disabled:opacity-50 yellow-glow animate-glow-pulse"
              >
                {createSubjectMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : "Create Subject"}
              </button>
            </form>
          </div>
        </div>
      )}
      
      <ScrollToTop />
    </div>
  );
}

function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-8 left-8 w-10 h-10 bg-secondary text-primary rounded-full shadow-lg hover:scale-110 transition-all animate-fade-up z-50 flex items-center justify-center font-bold"
      aria-label="Scroll to top"
    >
      ↑
    </button>
  );
}
