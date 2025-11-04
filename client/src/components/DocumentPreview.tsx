import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Edit, RefreshCw, Copy, Check } from "lucide-react";

interface DocumentPreviewProps {
  content: string;
  onRewrite?: (selectedText: string) => void;
  editable?: boolean;
}

export default function DocumentPreview({ content, onRewrite, editable = true }: DocumentPreviewProps) {
  const [selectedText, setSelectedText] = useState("");
  const [showToolbar, setShowToolbar] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection?.toString() || "";
    setSelectedText(text);
    setShowToolbar(text.length > 0);
  };

  const handleRewrite = () => {
    if (onRewrite && selectedText) {
      onRewrite(selectedText);
      console.log('Rewrite request for:', selectedText);
    }
    setShowToolbar(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      {showToolbar && editable && (
        <Card className="absolute top-0 left-0 z-10 p-2 flex gap-2 shadow-lg">
          <Button 
            size="sm" 
            variant="secondary"
            onClick={handleRewrite}
            data-testid="button-rewrite"
          >
            <RefreshCw className="w-3 h-3 mr-2" />
            Rewrite
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setShowToolbar(false)}
            data-testid="button-close-toolbar"
          >
            Close
          </Button>
        </Card>
      )}

      <div className="flex justify-end mb-3">
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCopy}
          data-testid="button-copy"
        >
          {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>

      <div
        className="prose max-w-none p-6 bg-card rounded-lg border min-h-[400px] leading-relaxed"
        onMouseUp={handleTextSelection}
        data-testid="text-document-preview"
      >
        {content ? (
          <div className="whitespace-pre-wrap">{content}</div>
        ) : (
          <div className="text-muted-foreground text-center py-12">
            <Edit className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Generated document will appear here</p>
            <p className="text-sm mt-1">Select any text to refine it with AI</p>
          </div>
        )}
      </div>
    </div>
  );
}
