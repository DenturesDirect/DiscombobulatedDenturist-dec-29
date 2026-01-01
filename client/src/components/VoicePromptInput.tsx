import { useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Send, Loader2, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";

interface VoicePromptInputProps {
  onSubmit?: (text: string, noteDate: Date) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function VoicePromptInput({ onSubmit, disabled, placeholder = "Speak or type your clinical note..." }: VoicePromptInputProps) {
  const [text, setText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  // Always default to today's date
  const [noteDate, setNoteDate] = useState<Date>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  // Reset to today's date when component mounts or when text is cleared
  useEffect(() => {
    if (!text && !interimText) {
      setNoteDate(new Date());
    }
  }, [text, interimText]);
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
      onSubmit(text.trim(), noteDate);
      setText("");
      setInterimText("");
      setNoteDate(new Date()); // Reset to today after submission
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

      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Label className="text-sm text-muted-foreground whitespace-nowrap">Note Date:</Label>
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 font-normal"
                disabled={disabled}
                data-testid="button-select-date"
              >
                <Calendar className="w-4 h-4" />
                {format(noteDate, 'MMM d, yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={noteDate}
                onSelect={(date) => {
                  if (date) {
                    setNoteDate(date);
                    setIsCalendarOpen(false);
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        {noteDate.toDateString() !== new Date().toDateString() && (
          <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-2 py-1 rounded">
            ⚠️ Backdating is temporary - for catch-up only. New entries should use today's date.
          </div>
        )}
      </div>

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
