
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { Play, Pause } from "lucide-react";
import { useState, useRef } from "react";

interface MessageProps {
  message: {
    id: string;
    userId: string;
    username: string;
    content: string;
    timestamp: string;
    media_url?: string;
    media_type?: string;
  };
  isCurrentUser: boolean;
}

const MessageItem = ({ message, isCurrentUser }: MessageProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const formattedTime = formatDistanceToNow(new Date(message.timestamp), { addSuffix: true });

  const toggleAudioPlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const renderMedia = () => {
    if (!message.media_url || !message.media_type) return null;
    
    switch (message.media_type) {
      case 'image':
        return (
          <div className="mt-2 rounded-md overflow-hidden">
            <img 
              src={message.media_url} 
              alt="Shared image" 
              className="max-w-full max-h-80 object-contain" 
            />
          </div>
        );
      case 'gif':
        return (
          <div className="mt-2 rounded-md overflow-hidden">
            <img 
              src={message.media_url} 
              alt="Shared GIF" 
              className="max-w-full max-h-80 object-contain" 
            />
          </div>
        );
      case 'audio':
        return (
          <div className="mt-2 flex items-center space-x-2">
            <button 
              onClick={toggleAudioPlayback}
              className="p-2 rounded-full bg-terminal hover:bg-terminal-muted"
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <div className="text-xs text-terminal-foreground/60">
              {isPlaying ? "Playing audio..." : "Audio message"}
            </div>
            <audio 
              ref={audioRef} 
              src={message.media_url} 
              onEnded={() => setIsPlaying(false)} 
              className="hidden" 
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div 
      className={cn(
        "mb-4 p-3 rounded-md border",
        isCurrentUser 
          ? "ml-auto mr-0 border-terminal-foreground/40 bg-terminal-muted max-w-[80%]" 
          : "ml-0 mr-auto border-terminal-border bg-terminal-muted/30 max-w-[80%]"
      )}
    >
      <div className="flex justify-between items-center mb-1">
        <span className={cn(
          "font-semibold text-sm",
          isCurrentUser ? "text-terminal-foreground" : "text-terminal-foreground/90"
        )}>
          {message.username}
        </span>
        <span className="text-xs text-terminal-foreground/50">{formattedTime}</span>
      </div>
      
      {/* Render media if present */}
      {renderMedia()}
      
      {/* Render message content if present */}
      {message.content && (
        <div className="text-terminal-foreground/80 markdown-content">
          <ReactMarkdown
            components={{
              code({ node, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                const isInline = (className || '').includes('inline');
                
                return isInline ? (
                  <code
                    className="bg-terminal px-1 rounded text-terminal-foreground"
                    {...props}
                  >
                    {children}
                  </code>
                ) : (
                  <pre className="bg-terminal p-2 rounded-md overflow-x-auto my-2">
                    <code className="text-terminal-foreground text-sm" {...props}>
                      {children}
                    </code>
                  </pre>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export default MessageItem;
