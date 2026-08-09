/* I want a complete visual redesign of StudyHive to make it look premium and modern. Keep all the existing logic and Google Drive integration exactly as is — only improve the UI/UX. Here are the changes for each page:

🎨 Global Design Upgrades

Add smooth page transitions and micro-animations using CSS transitions

Add a gradient hero background on home page: deep indigo #070235 to purple #1e1b4b with subtle animated floating blobs/shapes in the background

All cards should have a smooth lift animation on hover (translateY(-4px) + stronger shadow)

Use consistent 16px border radius on all cards

Add a subtle gradient border effect on cards on hover (use border-image or a wrapper div trick)

Icons: use Lucide icons everywhere — replace all emoji icons with proper Lucide icons (BookOpen, FlaskConical, Calculator, Dna, Monitor, ScrollText, BookMarked, TrendingUp)

🏠 Home Page (index.tsx)

Hero section: make it a full dark gradient section (#070235 to #1e1b4b) with white text, a glowing yellow #fed01b underline on "Learn together", and two floating decorative blurred circles in the background

Search bar: make it white with a strong shadow, larger (64px height), pill-shaped (radius-full), with a yellow focus ring

Add a stats bar below the hero showing: "📚 500+ Notes Shared", "👥 200+ Students", "📁 50+ Subjects" — with animated count-up on load

Subject cards: give each subject a unique soft gradient background color (e.g. Physics = blue tint, Chemistry = green tint, Maths = purple tint) instead of all white — use bg-gradient-to-br

Add a subject icon in a colored circle at the top of each card

Show file count as a yellow pill badge

Add a thin colored top border accent on each card matching the subject color

📁 Subject Page ($subjectId.tsx)

Add a colored banner/header at the top with the subject name, a large Lucide icon, and breadcrumb navigation — dark indigo background, white text

Topic cards: make them taller (min-height 120px), show a folder icon on the left, topic name in bold, file count as a badge on the right, and a ChevronRight icon that animates on hover

Empty state: show a nice illustration-style empty state with a "No topics yet" message and a CTA button to upload

"Upload Here" button: make it a floating sticky button at the bottom right corner on mobile

📄 Notes View Page ($topicId.tsx)

Replace the plain table with a modern file card list — each file gets its own card row with:

A colored file type icon on the left (PDF = red, DOCX = blue, image = green, other = gray) using Lucide FileText, FileImage, File icons

File name in bold, uploader name + date in small muted text below

File size badge on the right

Preview button (eye icon, outlined yellow button) and Download button (filled indigo button) side by side

Add a top summary bar showing total files and total size

Add an "Upload to this topic" yellow CTA button at the top right

⬆️ Upload Page (upload.tsx)

Make the 3-step stepper more visual: use large numbered circles connected by a progress line, with labels below (Subject → Topic → File)

Step 1 (Subject): show subject buttons as large icon cards in a grid (with Lucide icons + name), not just text buttons — pre-select if ?subject= is in the URL

Step 2 (Topic): clean input with a helper text "Enter a new topic name or select an existing one"

Step 3 (File): make the drag-and-drop zone much bigger and more attractive — dashed indigo border, cloud upload icon, "Drag & drop your notes here" text, file type hints (PDF, DOCX, Images supported). Show a file preview card once a file is selected (name + size + type icon)

Success screen: full-page celebration with a large checkmark animation, "Your notes are live! 🎉" heading, and two buttons: "Upload More" and "Back to Home"

🧭 Navbar

Add a honeycomb or bee emoji favicon/logo icon next to "StudyHive" in the navbar

Make the Upload button in the navbar bright yellow (bg-secondary) with indigo text and a slight pulse animation to draw attention

Add a mobile hamburger menu that slides in from the right as a drawer

On scroll, add a subtle box shadow to the navbar */


import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/layout/Navbar";
import { SubjectCard } from "@/components/home/SubjectCard";
import { Search, Loader2, AlertCircle, BookOpen, Clock, Plus, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getFolders, getRecentFiles, createFolder } from "@/lib/google-drive/drive.functions";
import { toast } from "sonner";

import { useState, useMemo } from "react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const queryClient = useQueryClient();
  
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


  const filteredSubjects = useMemo(() => {
    if (!subjects) return [];
    return subjects.filter((s: any) => 
      s.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [subjects, search]);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#070235] to-[#1e1b4b] py-20 text-white">
        <div className="absolute inset-0 z-0">
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-blue-500/20 blur-[100px]" />
          <div className="absolute right-0 top-1/2 h-64 w-64 rounded-full bg-yellow-500/10 blur-[100px]" />
        </div>
        
        <main className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-8 tracking-tight">
            Share notes. <span className="underline decoration-secondary decoration-4 underline-offset-8">Learn together</span>.
          </h1>
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-6 h-6" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for subjects..." 
              className="w-full h-16 pl-14 pr-4 bg-white/10 border border-white/20 rounded-full shadow-xl focus:outline-none focus:ring-4 focus:ring-secondary/50 transition-all text-lg text-white placeholder-slate-300"
            />
          </div>
          
          <div className="mt-12 flex justify-center gap-12 text-sm font-medium text-slate-300">
            <div className="flex flex-col"><span className="text-2xl font-bold text-white">500+</span><span>Notes Shared</span></div>
            <div className="flex flex-col"><span className="text-2xl font-bold text-white">200+</span><span>Students</span></div>
            <div className="flex flex-col"><span className="text-2xl font-bold text-white">50+</span><span>Subjects</span></div>
          </div>
        </main>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Recently Uploaded */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-2"><Clock /> Recently Uploaded</h2>
          <div className="flex gap-6 overflow-x-auto pb-4">
            {recentFiles?.map((file: any) => (
              <div key={file.id} className="min-w-[240px] bg-card p-4 rounded-xl border-2 border-border shadow-sm flex flex-col justify-between">
                <div>
                  <p className="font-bold truncate text-primary">{file.name}</p>
                  <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary/10 text-secondary text-[10px] font-bold mt-1">
                    {file.subjectName}
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-3 flex justify-between items-center">
                  <span>{file.uploader}</span>
                  <span>{file.date}</span>
                </p>
              </div>

            ))}
          </div>
        </section>

        {/* Subjects Grid */}
        <section>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-3xl border-2 border-border shadow-2xl p-8 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-primary">New Subject</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-muted rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateSubject} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">Subject Name</label>
                <input 
                  autoFocus
                  type="text"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="e.g. Computer Science"
                  className="w-full h-14 px-4 bg-muted border-2 border-transparent focus:border-secondary rounded-xl outline-none transition-all"
                />
              </div>
              
              <button 
                disabled={createSubjectMutation.isPending}
                className="w-full h-14 bg-secondary text-primary font-bold rounded-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {createSubjectMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Subject"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
