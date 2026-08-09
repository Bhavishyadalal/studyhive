import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { Navbar } from "@/components/layout/Navbar";
import { Search, FileText, FileImage, File, Download, Eye, Copy, X, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { searchFiles } from "@/lib/google-drive/drive.functions";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>) =>
    z.object({ q: z.string().optional() }).parse(search),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState(q || "");
  const [debouncedQuery, setDebouncedQuery] = useState(q || "");
  const [previewFile, setPreviewFile] = useState<any>(null);
  const debounceTimer = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(inputValue);
      if (inputValue) {
        navigate({ to: "/search", search: { q: inputValue }, replace: true });
      }
    }, 400);
    return () => clearTimeout(debounceTimer.current);
  }, [inputValue]);

  const { data: results, isLoading } = useQuery({
    queryKey: ["search", debouncedQuery],
    queryFn: () => searchFiles({ data: { query: debouncedQuery } }),
    enabled: debouncedQuery.trim().length > 1,
  });

  const getFileIcon = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return <FileText className="text-red-500 w-6 h-6" />;
    if (["doc", "docx"].includes(ext!)) return <FileText className="text-blue-500 w-6 h-6" />;
    if (["jpg", "jpeg", "png", "gif"].includes(ext!)) return <FileImage className="text-emerald-500 w-6 h-6" />;
    return <File className="text-slate-400 w-6 h-6" />;
  };

  const copyLink = (id: string) => {
    navigator.clipboard.writeText(`https://drive.google.com/file/d/${id}/view?usp=sharing`);
    toast.success("Link copied!");
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary mb-8">Search Notes</h1>

          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-yellow-500/70 w-6 h-6" />
            <input 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Search by file name..."
              className="w-full h-16 pl-16 pr-12 bg-card border-2 border-border hover:border-[#fed01b]/30 focus:border-[#fed01b]/60 text-foreground placeholder:text-muted-foreground rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-[#fed01b]/20 transition-all duration-300"
            />
            {inputValue && (
              <button 
                onClick={() => { setInputValue(""); setDebouncedQuery(""); }}
                className="absolute right-6 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {!debouncedQuery || debouncedQuery.trim().length < 2 ? (
            <div className="text-center py-24 text-muted-foreground animate-fade-up">
              <Search className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p>Type at least 2 characters to search</p>
            </div>
          ) : isLoading ? (
            <div className="text-center py-24 text-muted-foreground">
              <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" />
              Searching...
            </div>
          ) : results && results.length > 0 ? (
            <>
              <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">
                {results.length} result{results.length !== 1 ? "s" : ""} for "{debouncedQuery}"
              </div>
              {results.map((file: any, index: number) => (
                <div key={file.id} className="bg-card rounded-2xl shadow-sm border-2 border-border p-5 flex flex-col md:flex-row items-center justify-between gap-6 transition-all hover:-translate-y-1 hover:shadow-lg hover:border-secondary/50 duration-200 animate-fade-up" style={{ animationDelay: `${index * 0.07}s` }}>
                  <div className="flex items-center gap-5 w-full md:w-auto">
                    <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                      {getFileIcon(file.name)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-lg truncate text-primary">{file.name}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {file.subjectName}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-0.5">{file.uploader} · {file.date}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    <button 
                      onClick={() => copyLink(file.id)}
                      className="p-3 text-muted-foreground hover:text-primary hover:bg-muted rounded-xl transition-all hover:scale-110 active:scale-90 duration-150"
                      title="Copy link"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setPreviewFile(file)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-secondary text-primary font-bold hover:bg-secondary transition-all hover:scale-110 active:scale-90 duration-150"
                    >
                      <Eye className="w-5 h-5" /> Preview
                    </button>
                    <a href={`https://drive.google.com/uc?export=download&id=${file.id}`} className="px-4 py-2.5 rounded-xl bg-[#070235] text-foreground font-bold hover:opacity-90 transition-all shadow-md hover:scale-110 active:scale-90 duration-150">
                      <Download className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="text-center py-24 text-muted-foreground">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-20 animate-fade-up" />
              <p>No results found</p>
              <p className="text-sm">No files match "{debouncedQuery}". Try a different search term.</p>
            </div>
          )}
        </div>
      </div>

      {previewFile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-foreground/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setPreviewFile(null)} />
          <div className="relative z-10 w-full max-w-6xl h-full flex flex-col bg-card rounded-3xl overflow-hidden shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-4 min-w-0">
                <FileText className="w-6 h-6 text-primary shrink-0" />
                <h3 className="font-bold truncate text-primary">{previewFile.name}</h3>
              </div>
              <div className="flex items-center gap-2">
                <a href={`https://drive.google.com/file/d/${previewFile.id}/view?usp=sharing`} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
                  <ExternalLink className="w-4 h-4" /> Open in Drive
                </a>
                <button onClick={() => setPreviewFile(null)} className="p-2 hover:bg-muted rounded-full transition-colors">
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
