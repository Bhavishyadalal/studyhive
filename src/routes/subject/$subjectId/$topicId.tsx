import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/layout/Navbar";
import { ChevronRight, FileText, Download, Eye, AlertCircle, Share2, Copy, X, ExternalLink, CloudUpload, FileImage, File } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getFiles, getFolder } from "@/lib/google-drive/drive.functions";
import { useState, useMemo } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/subject/$subjectId/$topicId")({
  component: NotesViewPage,
});

function NotesViewPage() {
  const { subjectId, topicId } = Route.useParams();
  const [previewFile, setPreviewFile] = useState<any>(null);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "nameAZ" | "nameZA" | "largest" | "smallest">("newest");
  
  const { data: files, isLoading, error } = useQuery({
    queryKey: ['files', topicId],
    queryFn: () => getFiles({ data: { folderId: topicId } }),
  });

  const sortedFiles = useMemo(() => {
    if (!files) return [];
    return [...files].sort((a: any, b: any) => {
      switch (sortBy) {
        case "newest": return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "oldest": return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "nameAZ": return a.name.localeCompare(b.name);
        case "nameZA": return b.name.localeCompare(a.name);
        case "largest": return parseFloat(b.size) - parseFloat(a.size);
        case "smallest": return parseFloat(a.size) - parseFloat(b.size);
        default: return 0;
      }
    });
  }, [files, sortBy]);

  const { data: topicDetails } = useQuery({
    queryKey: ['topicDetails', topicId],
    queryFn: () => getFolder({ data: { folderId: topicId } }),
  });

  const { data: subjectDetails } = useQuery({
    queryKey: ['subjectDetails', subjectId],
    queryFn: () => getFolder({ data: { folderId: subjectId } }),
  });

  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="text-red-500 w-6 h-6" />;
    if (['doc', 'docx'].includes(ext!)) return <FileText className="text-blue-500 w-6 h-6" />;
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext!)) return <FileImage className="text-emerald-500 w-6 h-6" />;
    return <File className="text-slate-400 w-6 h-6" />;
  };

  const copyToClipboard = (id: string) => {
    const url = `https://drive.google.com/file/d/${id}/view?usp=sharing`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  const totalSize = files?.reduce((acc: number, f: any) => {
    const size = parseFloat(f.size);
    return isNaN(size) ? acc : acc + size;
  }, 0) || 0;

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <Navbar />
      
      {/* Subject Banner */}
      <div className="bg-[#070235] text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/subject/$subjectId" params={{ subjectId }} className="hover:text-white transition-colors capitalize">{subjectDetails?.name || subjectId.split('-').join(' ')}</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white font-medium">{topicDetails?.name || "Notes"}</span>
          </nav>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
                <FileText className="w-8 h-8 text-secondary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">{topicDetails?.name || "Notes List"}</h1>
                <p className="text-slate-400 mt-1 uppercase tracking-widest text-xs font-bold">Topic Materials</p>
              </div>
            </div>
            
            <Link 
              to="/upload"
              search={{ subject: subjectId }}
              className="bg-secondary text-primary font-bold px-8 py-3 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-2"
            >
              <CloudUpload className="w-5 h-5" />
              Upload to this topic
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Summary Bar */}
        {!isLoading && !error && files && files.length > 0 && (
          <div className="flex items-center gap-6 mb-8 text-sm font-bold text-muted-foreground uppercase tracking-widest bg-card p-4 rounded-xl border-2">
            <span>{sortedFiles.length} Files</span>
            <div className="w-1.5 h-1.5 rounded-full bg-muted" />
            <span>{totalSize.toFixed(2)} MB Total</span>
          </div>
        )}

        {!isLoading && !error && files && files.length > 1 && (
          <div className="flex items-center justify-end mb-6 gap-3">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Sort:</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-10 px-4 bg-card border-2 border-border rounded-xl text-sm font-bold text-primary focus:ring-2 focus:ring-secondary outline-none transition-all cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="nameAZ">Name A → Z</option>
              <option value="nameZA">Name Z → A</option>
              <option value="largest">Largest First</option>
              <option value="smallest">Smallest First</option>
            </select>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-card rounded-2xl border-2 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="p-12 bg-destructive/10 border-2 border-destructive/20 rounded-3xl flex flex-col items-center text-center text-destructive">
            <AlertCircle className="w-12 h-12 mb-4" />
            <h2 className="text-2xl font-bold">Error loading files</h2>
            <p className="mt-2">{(error as Error).message}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedFiles.map((file: any, index: number) => (
              <div 
                key={file.id} 
                className="group bg-card rounded-2xl shadow-sm border-2 border-border p-5 flex flex-col md:flex-row items-center justify-between gap-6 transition-all hover:shadow-xl hover:-translate-y-1 hover:border-secondary/50 animate-fade-up"
                style={{ animationDelay: `${(index + 1) * 0.1}s` }}
              >
                <div className="flex items-center gap-5 w-full md:w-auto">
                  <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                    {getFileIcon(file.name)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-lg truncate text-primary">{file.name}</h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                      <span>{file.uploader}</span>
                      <div className="w-1 h-1 rounded-full bg-muted" />
                      <span>{file.date}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                  <span className="text-xs font-bold bg-muted px-3 py-1.5 rounded-full uppercase tracking-widest text-muted-foreground mr-2">
                    {file.size}
                  </span>
                  
                  <button 
                    onClick={() => copyToClipboard(file.id)}
                    className="p-3 text-muted-foreground hover:text-primary hover:bg-muted rounded-xl transition-all hover:scale-110 active:scale-90"
                    title="Copy Share Link"
                  >
                    <Copy className="w-5 h-5" />
                  </button>

                  <button 
                    onClick={() => setPreviewFile(file)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-secondary text-primary font-bold hover:bg-secondary transition-all hover:scale-105 active:scale-95 duration-200"
                  >
                    <Eye className="w-5 h-5" />
                    Preview
                  </button>

                  <a 
                    href={`https://drive.google.com/uc?export=download&id=${file.id}`}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#070235] text-white font-bold hover:opacity-90 transition-all shadow-md hover:scale-105 active:scale-95 hover:shadow-yellow-400/20 duration-200"
                  >
                    <Download className="w-5 h-5" />
                    Download
                  </a>
                </div>
              </div>
            ))}
            
            {sortedFiles.length === 0 && (
              <div className="py-24 text-center bg-card border-2 border-dashed rounded-3xl">
                <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CloudUpload className="w-10 h-10 text-muted-foreground" />
                </div>
                <h2 className="text-2xl font-bold text-primary">No files yet</h2>
                <p className="text-muted-foreground mt-2">Be the first to share notes for this topic!</p>
                <Link 
                  to="/upload"
                  search={{ subject: subjectId }}
                  className="inline-block mt-8 bg-secondary text-primary font-bold px-8 py-3 rounded-xl hover:scale-105 transition-transform"
                >
                  Upload Now
                </Link>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setPreviewFile(null)} />
          <div className="relative z-10 w-full max-w-6xl h-full flex flex-col bg-card rounded-3xl overflow-hidden shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-4 min-w-0">
                <FileText className="w-6 h-6 text-primary shrink-0" />
                <h3 className="font-bold truncate text-primary">{previewFile.name}</h3>
              </div>
              <div className="flex items-center gap-2">
                <a 
                  href={previewFile.previewLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in Drive
                </a>
                <button 
                  onClick={() => setPreviewFile(null)}
                  className="p-2 hover:bg-muted rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-muted/30">
              <iframe 
                src={`https://drive.google.com/file/d/${previewFile.id}/preview`}
                className="w-full h-full border-none"
                title="File Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
