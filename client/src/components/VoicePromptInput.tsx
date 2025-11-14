import { useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoicePromptInputProps {
  onSubmit?: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function VoicePromptInput({ onSubmit, disabled, placeholder = "Speak or type your clinical note..." }: VoicePromptInputProps) {
  const [text, setText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Auto-scroll to bottom when text changes
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [text, interimText]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setIsSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }

          if (finalTranscript) {
            setText(prev => prev + finalTranscript);
            setInterimText('');
          }
          if (interimTranscript) {
            setInterimText(interimTranscript);
          }
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          toast({
            title: "Voice input error",
            description: "Please check your microphone permissions and try again.",
            variant: "destructive"
          });
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [toast]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Not supported",
        description: "Voice input is not supported in your browser. Please use Chrome or Edge.",
        variant: "destructive"
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setInterimText('');
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSubmit = () => {
    if (text.trim() && onSubmit) {
      onSubmit(text.trim());
      setText("");
      setInterimText("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Textarea
          ref={textareaRef}
          placeholder={placeholder}
          className="min-h-[160px] resize-none text-base pr-14"
          value={text + interimText}
          onChange={(e) => {
            const newValue = e.target.value;
            if (newValue.length < text.length) {
              setText(newValue);
              setInterimText("");
            } else {
              setText(newValue);
            }
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          data-testid="input-clinical-note"
        />
        <Button
          size="icon"
          variant={isListening ? "default" : "ghost"}
          className={`absolute top-3 right-3 w-10 h-10 ${isListening ? 'animate-pulse bg-destructive hover:bg-destructive' : ''}`}
          onClick={toggleListening}
          disabled={disabled || !isSupported}
          data-testid="button-voice-input"
          title={isListening ? "Stop recording" : "Start voice input"}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </Button>
      </div>

      {isListening && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
          <span>Recording - Click the red mic button again to stop</span>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          onClick={handleSubmit}
          disabled={!text.trim() || disabled}
          className="flex-1 h-11"
          data-testid="button-submit-note"
        >
          <Send className="w-4 h-4 mr-2" />
          Add Clinical Note
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setText("");
            setInterimText("");
          }}
          disabled={disabled || !text}
          className="h-11"
          data-testid="button-clear"
        >
          Clear
        </Button>
      </div>

      {!isSupported && (
        <p className="text-xs text-muted-foreground">
          Voice input requires Chrome or Edge browser
        </p>
      )}
    </div>
  );
}
