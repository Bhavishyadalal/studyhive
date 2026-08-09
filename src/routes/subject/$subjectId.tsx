import { createFileRoute, Outlet, useLocation, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/layout/Navbar";
import { ChevronRight, Loader2, AlertCircle, Lock, Folder, CloudUpload, Search, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getFolders, getFolder } from "@/lib/google-drive/drive.functions";
import { useState } from "react";

export const Route = createFileRoute("/subject/$subjectId")({
  component: SubjectPage,
});

function SubjectPage() {
  const { subjectId } = Route.useParams();
  const location = useLocation();
  const [search, setSearch] = useState("");
  
  const { data: topics, isLoading, error } = useQuery({
    queryKey: ['topics', subjectId],
    queryFn: () => getFolders({ data: { parentId: subjectId } }),
  });
  
  const { data: subjectDetails } = useQuery({
    queryKey: ['subjectDetails', subjectId],
    queryFn: () => getFolder({ data: { folderId: subjectId } }),
  });

  const filteredTopics = topics?.filter((t: any) => 
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  if (location.pathname !== `/subject/${subjectId}`) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <Navbar />
      
      {/* Subject Header Banner */}
      <div className="bg-[#070235] text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex items-center gap-2 text-sm text-slate-400 mb-8 animate-fade-up">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white font-medium capitalize">{subjectDetails?.name || subjectId.split('-').join(' ')}</span>
          </nav>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 animate-fade-up stagger-1">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center">
                <Folder className="w-10 h-10 text-secondary" />
              </div>
              <div>
                <h1 className="text-5xl font-bold tracking-tight capitalize">{subjectDetails?.name || subjectId.split('-').join(' ')}</h1>
                <p className="text-slate-400 mt-2 uppercase tracking-widest text-sm font-bold">Subject Topics</p>
              </div>
            </div>
            
            <Link 
              to="/upload"
              search={{ subject: subjectId }}
              className="bg-secondary text-primary font-bold px-8 py-4 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-xl hover:shadow-yellow-400/30 flex items-center gap-2"
            >
              <CloudUpload className="w-6 h-6" />
              Upload Here
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
          <h2 className="text-3xl font-bold text-primary">Browse Topics</h2>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <input 
              type="text"
              placeholder="Filter topics..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-card border-2 border-border rounded-xl focus:ring-2 focus:ring-secondary focus:scale-[1.01] outline-none transition-all duration-200"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-32 bg-card rounded-2xl border-2 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="p-12 bg-destructive/10 border-2 border-destructive/20 rounded-3xl flex flex-col items-center text-center text-destructive">
            <AlertCircle className="w-12 h-12 mb-4" />
            <h2 className="text-2xl font-bold">Error loading topics</h2>
            <p className="mt-2">{(error as Error).message}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {filteredTopics?.map((topic: any, index: number) => (
              <div key={topic.id} className="relative h-32 animate-fade-up" style={{ animationDelay: `${(index + 1) * 0.1}s` }}>
                {topic.isLocked ? (
                  <div className="h-full bg-card rounded-2xl shadow-sm border-2 border-border p-6 flex items-center justify-between opacity-70 cursor-not-allowed">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center">
                        <Folder className="w-6 h-6 text-primary/40" />
                      </div>
                      <div>
                        <span className="block font-bold text-xl text-primary/60 leading-tight">{topic.name}</span>
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Lock className="w-3 h-3 animate-pulse" />
                          <span>Private / Locked</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">Contact admin to access</p>
                      </div>
                    </div>
                    <div className="bg-muted p-2 rounded-lg text-muted-foreground">
                      <Lock className="w-5 h-5 animate-pulse" />
                    </div>
                  </div>
                ) : (
                  <Link
                    to="/subject/$subjectId/$topicId"
                    params={{ subjectId, topicId: topic.id }}
                    className="group h-full bg-card rounded-2xl shadow-sm border-2 border-border p-6 flex items-center justify-between transition-all hover:shadow-2xl hover:-translate-y-2 hover:border-secondary hover:shadow-yellow-500/10"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                        <Folder className="w-6 h-6 text-primary/60 group-hover:text-primary" />
                      </div>
                      <div>
                        <span className="block font-bold text-xl text-primary leading-tight">{topic.name}</span>
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary text-primary text-[10px] font-bold">
                            {topic.fileCount} {topic.fileCount === 1 ? 'file' : 'files'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-muted p-2 rounded-lg group-hover:bg-secondary group-hover:text-primary transition-all">
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                    </div>
                  </Link>
                )}
              </div>
            ))}
            
            {filteredTopics?.length === 0 && (
              <div className="col-span-full py-24 text-center bg-card border-2 border-dashed rounded-3xl">
                <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Folder className="w-10 h-10 text-muted-foreground" />
                </div>
                <h2 className="text-2xl font-bold text-primary">No topics found</h2>
                <p className="text-muted-foreground mt-2">
                  {search ? `No topics match "${search}"` : "This subject doesn't have any topics yet."}
                </p>
                {!search && (
                  <Link 
                    to="/upload"
                    search={{ subject: subjectId }}
                    className="inline-block mt-8 bg-secondary text-primary font-bold px-8 py-3 rounded-xl hover:scale-105 transition-transform"
                  >
                    Create First Topic
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Mobile Floating Action Button */}
      <Link 
        to="/upload"
        search={{ subject: subjectId }}
        className="fixed bottom-8 right-8 md:hidden w-16 h-16 bg-secondary text-primary rounded-full shadow-2xl flex items-center justify-center z-50 animate-float active:scale-95 transition-all"
      >
        <CloudUpload className="w-8 h-8" />
      </Link>
    </div>
  );
}
