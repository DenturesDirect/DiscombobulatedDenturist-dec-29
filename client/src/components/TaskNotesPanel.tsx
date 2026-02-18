import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, MessageSquarePlus, Send, ImagePlus, X, Loader2, StickyNote, Clock } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { TaskNote } from "@shared/schema";

interface TaskNotesPanelProps {
  taskId: string;
  taskTitle: string;
}

export default function TaskNotesPanel({ taskId, taskTitle }: TaskNotesPanelProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: notes = [], isLoading } = useQuery<TaskNote[]>({
    queryKey: ["/api/tasks", taskId, "notes"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/tasks/${taskId}/notes`);
      return res.json();
    },
    enabled: isOpen,
  });

  const submitNote = useMutation({
    mutationFn: async ({ content, imageUrls }: { content: string; imageUrls?: string[] }) => {
      const res = await apiRequest("POST", `/api/tasks/${taskId}/notes`, {
        content,
        imageUrls: imageUrls?.length ? imageUrls : undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", taskId, "notes"] });
      setNoteContent("");
      setImageFiles([]);
      setImagePreviews([]);
      setIsAddingNote(false);
      toast({ title: "Note added" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to add note", description: error.message, variant: "destructive" });
    },
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newFiles = [...imageFiles, ...files].slice(0, 5);
    setImageFiles(newFiles);

    for (const file of files) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string].slice(0, 5));
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of imageFiles) {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/objects/upload-direct", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}));
        throw new Error(err.error || uploadRes.statusText);
      }
      const { objectPath } = await uploadRes.json();
      urls.push(`/api${objectPath}`);
    }
    return urls;
  };

  const handleSubmit = async () => {
    if (!noteContent.trim() && imageFiles.length === 0) return;

    setIsUploading(true);
    try {
      let imageUrls: string[] | undefined;
      if (imageFiles.length > 0) {
        imageUrls = await uploadImages();
      }
      await submitNote.mutateAsync({ content: noteContent.trim(), imageUrls });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const isBusy = submitNote.isPending || isUploading;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-2">
          {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          <StickyNote className="w-3 h-3" />
          <span>Notes{notes.length > 0 && ` (${notes.length})`}</span>
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-2 space-y-2">
        {isLoading ? (
          <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" />
            Loading notes...
          </div>
        ) : notes.length === 0 && !isAddingNote ? (
          <p className="text-xs text-muted-foreground py-1">
            No notes yet. Track your progress as you work through this task.
          </p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {notes.map((note) => (
              <Card key={note.id} className="p-3 bg-muted/40 border-muted">
                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                {note.imageUrls && note.imageUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {note.imageUrls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block">
                        <img
                          src={url}
                          alt={`Note attachment ${i + 1}`}
                          className="h-16 w-16 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                        />
                      </a>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(note.createdAt).toLocaleString()}</span>
                  <span className="opacity-60">by {note.createdBy}</span>
                </div>
              </Card>
            ))}
          </div>
        )}

        {isAddingNote ? (
          <Card className="p-3 border-primary/30 bg-primary/5">
            <Textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="What progress have you made? What's left to do?"
              className="min-h-[80px] text-sm resize-none mb-2"
              disabled={isBusy}
              autoFocus
            />

            {imagePreviews.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {imagePreviews.map((preview, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${i + 1}`}
                      className="h-14 w-14 object-cover rounded border"
                    />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={isBusy}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageSelect}
                disabled={isBusy}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isBusy || imageFiles.length >= 5}
                className="h-8 text-xs"
              >
                <ImagePlus className="w-3 h-3 mr-1" />
                Image {imageFiles.length > 0 && `(${imageFiles.length}/5)`}
              </Button>
              <div className="flex-1" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsAddingNote(false);
                  setNoteContent("");
                  setImageFiles([]);
                  setImagePreviews([]);
                }}
                disabled={isBusy}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={isBusy || (!noteContent.trim() && imageFiles.length === 0)}
                className="h-8 text-xs"
              >
                {isBusy ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <Send className="w-3 h-3 mr-1" />
                )}
                Save Note
              </Button>
            </div>
          </Card>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddingNote(true)}
            className="h-7 text-xs w-full"
          >
            <MessageSquarePlus className="w-3 h-3 mr-1" />
            Add Note
          </Button>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
