import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Mic, Send, FileText, Sparkles } from "lucide-react";

interface PromptInputProps {
  onGenerate?: (prompt: string, template: string) => void;
  disabled?: boolean;
}

export default function PromptInput({ onGenerate, disabled }: PromptInputProps) {
  const [prompt, setPrompt] = useState("");
  const [template, setTemplate] = useState("clinical-note");

  const handleGenerate = () => {
    if (prompt.trim() && onGenerate) {
      onGenerate(prompt, template);
    }
  };

  const templates = [
    { value: "clinical-note", label: "Clinical Note" },
    { value: "referral-letter", label: "Referral Letter" },
    { value: "treatment-plan", label: "Treatment Plan" },
    { value: "progress-note", label: "Progress Note" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="template" className="text-sm font-medium mb-2 block">Document Template</Label>
        <Select value={template} onValueChange={setTemplate}>
          <SelectTrigger id="template" className="h-12" data-testid="select-template">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {templates.map(t => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="prompt" className="text-sm font-medium">Enter Instructions</Label>
          <Button 
            size="icon" 
            variant="ghost" 
            className="w-8 h-8"
            data-testid="button-voice"
            onClick={() => console.log('Voice input triggered')}
          >
            <Mic className="w-4 h-4" />
          </Button>
        </div>
        <Textarea
          id="prompt"
          placeholder="Describe the patient visit, observations, and any specific instructions for the AI..."
          className="min-h-[200px] resize-none text-base"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={disabled}
          data-testid="input-prompt"
        />
      </div>

      <div className="flex gap-3">
        <Button 
          onClick={handleGenerate} 
          disabled={!prompt.trim() || disabled}
          className="flex-1 h-12"
          data-testid="button-generate"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Generate Document
        </Button>
        <Button 
          variant="outline" 
          onClick={() => setPrompt("")}
          disabled={disabled}
          className="h-12"
          data-testid="button-clear"
        >
          Clear
        </Button>
      </div>
    </div>
  );
}
