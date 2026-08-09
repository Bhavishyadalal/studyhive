import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import { Navbar } from "@/components/layout/Navbar";
import { Upload as UploadIcon, Check, AlertCircle, BookOpen, FolderPlus, FileText, ChevronRight, CloudUpload, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useState, useMemo } from "react";
import { uploadFile, getFolders, createFolder } from "@/lib/google-drive/drive.functions";
import { useMutation, useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/upload")({
  validateSearch: (search: Record<string, unknown>) => {
    return z.object({
      subject: z.string().optional(),
    }).parse(search);
  },
  component: UploadPage,
});

function UploadPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: '/upload' });
  const [step, setStep] = useState(1);
  const [subjectId, setSubjectId] = useState(search.subject || "");
  const [topicId, setTopicId] = useState("");
  const [newTopicName, setNewTopicName] = useState("");
  const [isCreatingNewTopic, setIsCreatingNewTopic] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploaderName, setUploaderName] = useState("");
  const [success, setSuccess] = useState(false);
  const [fileSizeError, setFileSizeError] = useState("");

  // Queries
  const { data: subjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => getFolders({ data: {} }),
  });

  const { data: topics, isLoading: isLoadingTopics } = useQuery({
    queryKey: ['topics', subjectId],
    queryFn: () => getFolders({ data: { parentId: subjectId } }),
    enabled: !!subjectId,
  });

  // Mutations
  const createFolderMutation = useMutation({
    mutationFn: createFolder,
    onError: (err: any) => {
      toast.error(`Failed to create topic: ${err.message || "Please try again."}`);
    }
  });

  const uploadMutation = useMutation({
    mutationFn: uploadFile,
    onSuccess: () => setSuccess(true),
  });

  const handleUpload = async () => {
    if (!selectedFile || (!topicId && !newTopicName)) return;
    
    let finalTopicId = topicId;
    
    if (isCreatingNewTopic && newTopicName) {
      const newFolder = await createFolderMutation.mutateAsync({ 
        data: { name: newTopicName, parentId: subjectId } 
      });
      finalTopicId = newFolder.id!;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1];
      if (finalTopicId && base64String) {
        uploadMutation.mutate({ 
          data: { 
            fileBase64: base64String,
            fileName: selectedFile.name,
            mimeType: selectedFile.type,
            folderId: finalTopicId,
            uploaderName: uploaderName
          } 
        });
      }
    };
    reader.readAsDataURL(selectedFile);
  };

  const currentSubjectName = useMemo(() => 
    subjects?.find((s: any) => s.id === subjectId)?.name || "Select Subject", 
  [subjects, subjectId]);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-12">
        {success ? (
          <div className="text-center py-20 bg-card rounded-3xl border-2 border-emerald-100 dark:border-emerald-900/30 shadow-xl animate-scale-in">
            <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-8 animate-glow-pulse">
              <Check className="w-12 h-12" />
            </div>
            <h2 className="text-4xl font-bold text-primary mb-4">Your notes are live! 🎉</h2>
            <p className="text-muted-foreground mb-8">Thank you for contributing to StudyHive.</p>
            <div className="flex justify-center gap-4">
              <button 
                onClick={() => { setSuccess(false); setStep(1); setSelectedFile(null); }}
                className="bg-secondary text-primary px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform"
              >
                Upload More
              </button>
              <button 
                onClick={() => navigate({ to: '/' })}
                className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform"
              >
                Back to Home
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Visual Stepper */}
            <div className="relative flex justify-between max-w-2xl mx-auto px-4">
              <div className="absolute top-6 left-0 right-0 h-1 bg-muted -z-0 mx-12">
                <div className="h-full bg-secondary transition-all duration-500 ease-in-out" style={{ width: `${(step - 1) * 50}%` }} />
              </div>
              {[1, 2, 3].map((s) => (
                <div key={s} className="relative z-10 flex flex-col items-center gap-2">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg border-4 transition-all duration-300 ${step >= s ? "bg-secondary border-secondary text-primary scale-110 shadow-[0_0_20px_rgba(254,208,27,0.4)]" : "bg-card border-muted text-muted-foreground"}`}>
                    {s}
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wider transition-colors duration-300 hidden sm:block ${step >= s ? "text-primary" : "text-muted-foreground"}`}>
                    {s === 1 ? "Subject" : s === 2 ? "Topic" : "File"}
                  </span>
                </div>
              ))}
            </div>

            <div className="bg-card rounded-3xl shadow-[0_0_80px_-20px_rgba(254,208,27,0.08)] border-2 border-border p-5 sm:p-8 md:p-6 sm:p-12 min-h-[400px]">
              {step === 1 && (
                <div className="space-y-8 animate-slide-right">
                  <div className="text-center">
                    <h2 className="text-3xl font-bold text-primary mb-2">Select a Subject</h2>
                    <p className="text-muted-foreground">Which area of study do these notes belong to?</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {subjects?.map((s: any) => (
                      <button
                        key={s.id}
                        onClick={() => { setSubjectId(s.id); setStep(2); }}
                        className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-4 transition-all hover:scale-[1.04] hover:shadow-lg hover:shadow-yellow-400/10 hover:border-secondary hover:bg-secondary/5 ${subjectId === s.id ? 'border-secondary bg-secondary/10 shadow-md animate-glow-pulse' : 'border-border bg-muted/30'}`}
                      >
                        <BookOpen className={`w-8 h-8 ${subjectId === s.id ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className="font-bold text-sm text-center">{s.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-8 animate-slide-right">
                  <div className="text-center">
                    <h2 className="text-3xl font-bold text-primary mb-2">Choose a Topic</h2>
                    <p className="text-muted-foreground">In {currentSubjectName}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {isLoadingTopics ? (
                      <Loader2 className="w-8 h-8 animate-spin mx-auto col-span-full" />
                    ) : (
                      <>
                        {topics?.map((t: any) => (
                          <button
                            key={t.id}
                            onClick={() => { setTopicId(t.id); setIsCreatingNewTopic(false); setStep(3); }}
                            className={`p-4 rounded-xl border-2 flex items-center justify-between transition-all hover:scale-[1.04] hover:shadow-lg hover:shadow-yellow-400/10 hover:border-secondary active:scale-95 ${topicId === t.id && !isCreatingNewTopic ? 'border-secondary bg-secondary/10 animate-glow-pulse' : 'border-border'}`}
                          >
                            <span className="font-bold">{t.name}</span>
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          </button>
                        ))}
                        <div 
                          className={`p-4 rounded-xl border-2 border-dashed transition-all ${isCreatingNewTopic ? 'border-secondary bg-secondary/5' : 'border-border hover:border-secondary/50'}`}
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <FolderPlus className="w-5 h-5 text-primary" />
                            <span className="font-bold">Create New Topic</span>
                          </div>
                          <input 
                            type="text" 
                            placeholder="Enter topic name..." 
                            value={newTopicName}
                            onChange={(e) => { 
                              setNewTopicName(e.target.value); 
                              setIsCreatingNewTopic(true);
                              setTopicId("");
                            }}
                            className="w-full h-10 px-3 bg-background border rounded-lg focus:ring-2 focus:ring-secondary outline-none"
                          />
                        </div>
                      </>
                    )}
                  </div>
                  
                  <div className="flex justify-between pt-4">
                    <button onClick={() => setStep(1)} className="text-muted-foreground font-bold hover:text-primary transition-colors">← Back</button>
                    {(topicId || (isCreatingNewTopic && newTopicName)) && (
                      <button onClick={() => setStep(3)} className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-bold shadow-lg">Continue</button>
                    )}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-8 animate-slide-right">
                  <div className="text-center">
                    <h2 className="text-3xl font-bold text-primary mb-2">Upload Files</h2>
                    <p className="text-muted-foreground">Drag and drop your notes here</p>
                  </div>

                  <div 
                    className={`relative group border-4 border-dashed rounded-3xl p-6 sm:p-12 text-center transition-all duration-200 ${selectedFile ? 'border-emerald-500 bg-emerald-50/10' : 'border-primary/20 hover:border-secondary hover:scale-[1.01] hover:shadow-inner bg-muted/20'}`}
                  >
                    <input 
                      type="file" 
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        if (file && file.size > 45 * 1024 * 1024) {
                          setFileSizeError("File too large. Maximum size is 45MB.");
                          setSelectedFile(null);
                          e.target.value = "";
                          return;
                        }
                        setFileSizeError("");
                        setSelectedFile(file);
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="space-y-4">
                      {selectedFile ? (
                        <div className="flex flex-col items-center animate-scale-in">
                          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                            <FileText className="w-8 h-8 text-emerald-600" />
                          </div>
                          <p className="font-bold text-xl">{selectedFile.name}</p>
                          <p className="text-sm text-muted-foreground">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                      ) : (
                        <>
                          <CloudUpload className="w-16 h-16 mx-auto text-primary/40 group-hover:text-secondary transition-colors" />
                          <div>
                            <p className="text-xl font-bold">Select a file to upload</p>
                            <p className="text-muted-foreground">PDF, DOCX, and Images supported</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  {fileSizeError && (
                    <div className="flex items-center gap-2 text-destructive font-bold text-sm bg-destructive/10 p-4 rounded-xl border border-destructive/20 animate-in fade-in slide-in-from-top-2">
                      <AlertCircle className="w-5 h-5" />
                      {fileSizeError}
                    </div>
                  )}

                  <div className="space-y-4">
                    <label className="block">
                      <span className="text-sm font-bold text-primary/60 uppercase tracking-widest ml-1">Your Name (Optional)</span>
                      <input 
                        type="text" 
                        value={uploaderName} 
                        onChange={(e) => setUploaderName(e.target.value)} 
                        placeholder="e.g. John Doe"
                        className="w-full h-14 px-4 bg-background border-2 border-border rounded-xl focus:ring-2 focus:ring-secondary outline-none transition-all mt-2" 
                      />
                    </label>
                  </div>
                  
                  <div className="flex justify-between pt-4">
                    <button onClick={() => setStep(2)} className="text-muted-foreground font-bold hover:text-primary transition-colors">← Back</button>
                    <button 
                      onClick={handleUpload}
                      disabled={!selectedFile || uploadMutation.isPending || !!fileSizeError}
                      className="bg-primary text-primary-foreground font-bold px-6 sm:px-12 py-4 rounded-xl shadow-xl hover:scale-105 active:scale-95 transition-all duration-150 hover:brightness-110 hover:shadow-yellow-400/20 disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
                    >
                      {uploadMutation.isPending ? <><Loader2 className="animate-spin" /> Uploading...</> : "Upload to Drive"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
