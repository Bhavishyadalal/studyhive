import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Navbar } from "@/components/layout/Navbar";
import { Shield, Trash2, Clock, FileText, BarChart3, Users, BookOpen, Lock, AlertCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getFolders, getRecentFiles, deleteFile, deleteFolder, verifyAdminPassword } from "@/lib/google-drive/drive.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

function AdminPage() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"files" | "subjects" | "topics">("files");
  const [selectedSubjectForTopics, setSelectedSubjectForTopics] = useState("");
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: (pass: string) => verifyAdminPassword({ data: { password: pass } }),
    onSuccess: () => {
      setIsAuthenticated(true);
    },
    onError: () => {
      toast.error("Invalid password");
    }
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(password);
  };

  const { data: subjects, isLoading: isLoadingSubjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => getFolders({ data: {} }),
    enabled: isAuthenticated
  });

  const { data: recentFiles, isLoading: isLoadingFiles, refetch } = useQuery({
    queryKey: ['recentFilesAdmin'],
    queryFn: () => getRecentFiles({ data: {} }),
    enabled: isAuthenticated
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFile({ data: { fileId: id, password } }),
    onSuccess: () => {
      toast.success("File trashed successfully");
      refetch();
    }
  });

  const { data: topics, isLoading: isLoadingTopics } = useQuery({
    queryKey: ['adminTopics', selectedSubjectForTopics],
    queryFn: () => getFolders({ data: { parentId: selectedSubjectForTopics } }),
    enabled: isAuthenticated && !!selectedSubjectForTopics,
  });

  const deleteFolderMutation = useMutation({
    mutationFn: (id: string) => deleteFolder({ data: { folderId: id, password } }),
    onSuccess: () => {
      toast.success("Folder deleted successfully");
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      queryClient.invalidateQueries({ queryKey: ['adminTopics'] });
    },
    onError: () => toast.error("Failed to delete folder"),
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#040118] flex items-center justify-center p-6 text-white overflow-hidden relative">
        {/* Background Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-secondary/10 rounded-full blur-[120px] animate-blob" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] animate-blob animation-delay-2000" />
        
        <div className="w-full max-w-md space-y-10 text-center relative z-10 animate-fade-up">
          <div className="relative inline-block">
            <div className="w-24 h-24 bg-white/[0.03] border border-white/10 backdrop-blur-xl rounded-[2.5rem] flex items-center justify-center mx-auto mb-4 group hover:border-secondary/50 transition-all duration-500">
              <Shield className="w-12 h-12 text-secondary animate-glow-pulse" />
            </div>
          </div>
          <div className="space-y-3">
            <h1 className="text-5xl font-black tracking-tighter uppercase italic">Secure Access</h1>
            <p className="text-white/40 font-bold uppercase tracking-[0.3em] text-[10px]">Administrative Authentication Required</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="relative group">
              <div className="absolute inset-0 bg-secondary/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter Access Key"
                className="relative w-full h-16 px-8 bg-white/[0.03] border border-white/10 backdrop-blur-md rounded-2xl focus:ring-2 focus:ring-secondary focus:border-secondary outline-none text-center font-black tracking-widest uppercase transition-all placeholder:text-white/20"
              />
            </div>
            <button 
              disabled={loginMutation.isPending}
              className="w-full h-16 bg-secondary text-primary font-black rounded-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(254,208,27,0.3)] group"
            >
              {loginMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                <>
                  <Lock className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  UNFOLD DASHBOARD
                </>
              )}
            </button>
          </form>
          <button onClick={() => navigate({ to: '/' })} className="text-white/30 hover:text-white font-bold uppercase tracking-widest text-[10px] transition-all hover:tracking-[0.4em]">← Return to Nexus</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <Navbar />
      <div className="bg-[#040118] text-white py-16 relative overflow-hidden border-b border-white/5">
        <div className="absolute top-0 right-0 w-[40%] h-full bg-secondary/5 blur-[100px] rounded-full translate-x-1/2" />
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex items-center gap-8">
              <div className="w-20 h-20 bg-white/[0.03] border border-white/10 backdrop-blur-xl rounded-[2.5rem] flex items-center justify-center shadow-2xl">
                <Shield className="w-10 h-10 text-secondary" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-5xl font-black tracking-tighter uppercase italic">Control Nexus</h1>
                <p className="text-white/40 mt-1 uppercase tracking-[0.3em] text-[10px] font-bold">System Command & Management</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white/[0.03] border border-white/10 p-2 rounded-2xl backdrop-blur-md">
              <div className="w-3 h-3 bg-secondary rounded-full animate-pulse shadow-[0_0_10px_rgba(254,208,27,0.5)]" />
              <span className="text-[10px] font-black uppercase tracking-widest pr-2">Link Established</span>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="group bg-gradient-to-br from-card to-card/50 p-8 rounded-3xl border border-border flex items-center gap-6 shadow-xl transition-all hover:-translate-y-1 hover:border-secondary/50 hover:shadow-[0_8px_30px_rgba(254,208,27,0.06)]">
            <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpen className="w-8 h-8" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Total Subjects</p>
              <h3 className="text-4xl font-black">{subjects?.length || 0}</h3>
            </div>
          </div>
          <div className="group bg-gradient-to-br from-card to-card/50 p-8 rounded-3xl border border-border flex items-center gap-6 shadow-xl transition-all hover:-translate-y-1 hover:border-secondary/50 hover:shadow-[0_8px_30px_rgba(254,208,27,0.06)]">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Recent Uploads</p>
              <h3 className="text-4xl font-black">{recentFiles?.length || 0}</h3>
            </div>
          </div>
          <div className="group bg-gradient-to-br from-card to-card/50 p-8 rounded-3xl border border-border flex items-center gap-6 shadow-xl transition-all hover:-translate-y-1 hover:border-secondary/50 hover:shadow-[0_8px_30px_rgba(254,208,27,0.06)]">
            <div className="w-16 h-16 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">System Status</p>
              <h3 className="text-4xl font-black text-secondary">Online</h3>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-border mb-8 overflow-x-auto">
          {(["files", "subjects", "topics"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 font-black capitalize text-sm tracking-widest transition-all border-b-[3px] -mb-px shrink-0 ${
                activeTab === tab
                  ? "border-secondary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "files" ? "Recent Files" : tab === "subjects" ? "Subjects" : "Topics"}
            </button>
          ))}
        </div>

        {/* Files Tab */}
        {activeTab === "files" && (
          <div key="files" className="bg-card rounded-[2rem] border border-border shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-border/50 bg-gradient-to-r from-muted/50 to-transparent">
              <h2 className="text-xl font-black text-primary flex items-center gap-3 tracking-widest uppercase">
                <Clock className="w-5 h-5" />
                Activity Feed
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 text-left border-b">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">File Name</th>
                    <th className="px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Uploader</th>
                    <th className="px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Timestamp</th>
                    <th className="px-8 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {isLoadingFiles ? (
                    <tr><td colSpan={4} className="px-8 py-12 text-center text-muted-foreground">Loading activity...</td></tr>
                  ) : recentFiles?.map((file: any) => (
                    <tr key={file.id} className="hover:bg-muted/30 transition-colors group border-b border-border/50 last:border-0">
                      <td className="px-8 py-6 font-bold text-foreground group-hover:text-primary transition-colors">{file.name}</td>
                      <td className="px-8 py-6 text-muted-foreground font-medium">{file.uploader}</td>
                      <td className="px-8 py-6 text-muted-foreground/60 text-xs font-bold">{file.date}</td>
                      <td className="px-8 py-6 text-right">
                        <button 
                          onClick={() => {
                            if (confirm("Are you sure you want to trash this file?")) {
                              deleteMutation.mutate(file.id);
                            }
                          }}
                          className="p-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all hover:scale-110 active:scale-90 duration-150"
                          title="Delete File"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {recentFiles?.length === 0 && (
                    <tr><td colSpan={4} className="px-8 py-12 text-center text-muted-foreground">No recent activity found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Subjects Tab */}
        {activeTab === "subjects" && (
          <div key="subjects" className="space-y-6 animate-fade-up transition-all duration-200">
            <div className="bg-card p-10 rounded-[2rem] border border-border shadow-xl bg-gradient-to-br from-card to-card/50">
              <h2 className="text-xl font-black text-primary mb-2 uppercase tracking-widest">Directory Control</h2>
              <p className="text-muted-foreground text-sm font-medium">Manage top-level subjects and their visibility settings.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoadingSubjects ? (
                <div className="col-span-full py-12 text-center text-muted-foreground">Loading subjects...</div>
              ) : subjects?.map((subject: any) => (
                <div key={subject.id} className="bg-card p-7 rounded-[1.5rem] border border-border flex items-center justify-between group hover:shadow-2xl hover:border-secondary/30 transition-all hover:-translate-y-1">
                  <div>
                    <h3 className="font-black text-foreground text-lg group-hover:text-primary transition-colors">{subject.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="bg-secondary/10 text-secondary text-[10px] font-black px-2 py-0.5 rounded-full uppercase">{subject.fileCount} Assets</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      if (confirm(`Delete subject "${subject.name}"? This will trash the folder and all its contents.`)) {
                        deleteFolderMutation.mutate(subject.id);
                      }
                    }}
                    className="p-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all hover:scale-110 active:scale-90 duration-150"
                    title="Delete Subject"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              {subjects?.length === 0 && (
                <div className="col-span-full py-12 text-center text-muted-foreground">No subjects found.</div>
              )}
            </div>
          </div>
        )}

        {/* Topics Tab */}
        {activeTab === "topics" && (
          <div key="topics" className="space-y-6 animate-fade-up transition-all duration-200">
            <div className="bg-card p-10 rounded-[2rem] border border-border shadow-xl space-y-6">
              <div>
                <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-3 ml-1">Context Selector</label>
                <select 
                  value={selectedSubjectForTopics}
                  onChange={(e) => setSelectedSubjectForTopics(e.target.value)}
                  className="w-full md:w-96 h-14 px-6 bg-background border border-border rounded-2xl text-foreground font-black focus:ring-2 focus:ring-secondary focus:border-secondary outline-none transition-all appearance-none cursor-pointer shadow-inner"
                >
                  <option value="">— Select Subject Workspace —</option>
                  {subjects?.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {selectedSubjectForTopics && (
              <div className="space-y-6">
                <div className="bg-card p-10 rounded-[2rem] border border-border shadow-xl bg-gradient-to-br from-card to-card/50">
                  <h2 className="text-xl font-black text-primary mb-2 uppercase tracking-widest">Topic Registry</h2>
                  <p className="text-muted-foreground text-sm font-medium">Manage individual topics and nested file clusters.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {isLoadingTopics ? (
                    <div className="col-span-full py-12 text-center text-muted-foreground">Loading topics...</div>
                  ) : topics?.map((topic: any) => (
                    <div key={topic.id} className="bg-card p-7 rounded-[1.5rem] border border-border flex items-center justify-between group hover:shadow-2xl hover:border-secondary/30 transition-all hover:-translate-y-1">
                      <div>
                        <h3 className="font-black text-foreground text-lg group-hover:text-primary transition-colors">{topic.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="bg-secondary/10 text-secondary text-[10px] font-black px-2 py-0.5 rounded-full uppercase">{topic.fileCount} Assets</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          if (confirm(`Delete topic "${topic.name}"? This will trash the folder and all its files.`)) {
                            deleteFolderMutation.mutate(topic.id);
                          }
                        }}
                        className="p-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all hover:scale-110 active:scale-90 duration-150"
                        title="Delete Topic"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                  {topics?.length === 0 && (
                    <div className="col-span-full py-12 text-center text-muted-foreground">No topics in this subject.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
