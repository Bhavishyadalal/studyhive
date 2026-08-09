import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Navbar } from "@/components/layout/Navbar";
import { Shield, Trash2, Clock, FileText, BarChart3, Users, BookOpen, Lock, AlertCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getFolders, getRecentFiles, deleteFile, verifyAdminPassword } from "@/lib/google-drive/drive.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

function AdminPage() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

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
    mutationFn: (id: string) => deleteFile({ data: { fileId: id } }),
    onSuccess: () => {
      toast.success("File trashed successfully");
      refetch();
    }
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#070235] flex items-center justify-center p-4 text-white">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <Shield className="w-10 h-10 text-secondary" />
          </div>
          <h1 className="text-4xl font-bold">Admin Portal</h1>
          <p className="text-slate-400">Restricted area. Please enter your password.</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin Password"
              className="w-full h-14 px-6 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-secondary outline-none text-center"
            />
            <button 
              disabled={loginMutation.isPending}
              className="w-full h-14 bg-secondary text-primary font-bold rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loginMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Unlock Access"}
            </button>

          </form>
          <button onClick={() => navigate({ to: '/' })} className="text-slate-500 hover:text-white transition-colors">Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <Navbar />
      <div className="bg-[#070235] text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
              <Shield className="w-8 h-8 text-secondary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Management Dashboard</h1>
              <p className="text-slate-400 mt-1 uppercase tracking-widest text-xs font-bold">System Overview</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-card p-8 rounded-3xl border-2 border-border flex items-center gap-6 shadow-sm">
            <div className="w-14 h-14 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center">
              <BookOpen className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Subjects</p>
              <h3 className="text-3xl font-bold">{subjects?.length || 0}</h3>
            </div>
          </div>
          <div className="bg-card p-8 rounded-3xl border-2 border-border flex items-center gap-6 shadow-sm">
            <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center">
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Recent Uploads</p>
              <h3 className="text-3xl font-bold">{recentFiles?.length || 0}</h3>
            </div>
          </div>
          <div className="bg-card p-8 rounded-3xl border-2 border-border flex items-center gap-6 shadow-sm">
            <div className="w-14 h-14 bg-secondary/10 text-primary rounded-2xl flex items-center justify-center">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Active Status</p>
              <h3 className="text-3xl font-bold">Live</h3>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card rounded-3xl border-2 border-border shadow-xl overflow-hidden">
          <div className="p-8 border-b bg-muted/30">
            <h2 className="text-2xl font-bold text-primary flex items-center gap-3">
              <Clock className="w-6 h-6" />
              Recent Activity
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 text-left border-b">
                <tr>
                  <th className="px-8 py-4 text-xs font-bold text-primary uppercase tracking-widest">File Name</th>
                  <th className="px-8 py-4 text-xs font-bold text-primary uppercase tracking-widest">Uploader</th>
                  <th className="px-8 py-4 text-xs font-bold text-primary uppercase tracking-widest">Date</th>
                  <th className="px-8 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoadingFiles ? (
                  <tr><td colSpan={4} className="px-8 py-12 text-center text-muted-foreground">Loading activity...</td></tr>
                ) : recentFiles?.map((file: any) => (
                  <tr key={file.id} className="hover:bg-muted/20 transition-colors group">
                    <td className="px-8 py-6 font-bold text-primary">{file.name}</td>
                    <td className="px-8 py-6 text-muted-foreground">{file.uploader}</td>
                    <td className="px-8 py-6 text-muted-foreground">{file.date}</td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => {
                          if (confirm("Are you sure you want to trash this file?")) {
                            deleteMutation.mutate(file.id);
                          }
                        }}
                        className="p-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
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
      </main>
    </div>
  );
}
