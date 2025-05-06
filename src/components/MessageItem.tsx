
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useGroupNavigation } from "@/hooks/useGroupNavigation";
import { Message } from "@/services/messageService";

interface MessageItemProps {
  message: Message;
  isSending?: boolean;
  isCurrentUser: boolean;
  showAvatar?: boolean;
  currentGroup?: { id: string; name: string } | null;
}

const MessageItem = ({ message, isSending, isCurrentUser, showAvatar = true, currentGroup }: MessageItemProps) => {
  const { user } = useAuth();
  const { navigateToGroup } = useGroupNavigation();
  
  // Format message timestamp
  const formattedTime = message.timestamp
    ? formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })
    : "Just now";
    
  // Get the sender's display name
  const senderName = message.username || "Anonymous";
  
  // Generate avatar initials from the sender's name
  const initials = senderName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
    
  // Determine avatar background color based on sender ID for consistent colors
  // This is a simple hash function to generate a hue value between 0 and 360
  const getHue = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash % 360;
  };
  
  const bgColor = message.userId 
    ? `hsl(${getHue(message.userId)}, 70%, 30%)`
    : "#333";
    
  // Handle group name click
  const handleGroupNameClick = () => {
    if (message.group_id) {
      navigateToGroup(message.group_id, user?.id);
    }
  };

  return (
    <div
      className={cn(
        "flex gap-3 p-3 relative",
        isCurrentUser ? "justify-end" : "justify-start",
        isSending && "opacity-70"
      )}
    >
      {/* Show avatar for messages not from the current user */}
      {!isCurrentUser && showAvatar && (
        <div className="shrink-0">
          <Avatar className="h-8 w-8">
            {message.avatar_url ? (
              <AvatarImage src={message.avatar_url} alt={senderName} />
            ) : (
              <AvatarFallback
                className="text-xs"
                style={{ backgroundColor: bgColor }}
              >
                {initials}
              </AvatarFallback>
            )}
          </Avatar>
        </div>
      )}
      
      {/* Message bubble */}
      <div
        className={cn(
          "flex flex-col max-w-[75%] rounded px-3 py-2 break-words overflow-hidden",
          isCurrentUser
            ? "bg-terminal-foreground/20 text-terminal-foreground"
            : "bg-terminal-muted text-terminal-foreground"
        )}
      >
        {/* Message header with sender name and timestamp */}
        <div className="flex items-center gap-2 mb-1 text-xs text-terminal-foreground/60">
          {!isCurrentUser && (
            <span className="font-semibold">{senderName}</span>
          )}
          
          {/* Show group name as clickable if we're viewing from a different group */}
          {message.group_id && currentGroup && message.group_id !== currentGroup.id && (
            <button 
              onClick={handleGroupNameClick}
              className="underline hover:text-terminal-foreground transition-colors cursor-pointer"
            >
              #{currentGroup.name}
            </button>
          )}
          
          <span>{formattedTime}</span>
        </div>
      
        {/* Show media based on type */}
        {message.media_url && (
          <div className="mb-2">
            {message.media_type === 'audio' ? (
              <audio 
                controls 
                className="max-w-full w-full"
                preload="metadata"
              >
                <source src={message.media_url} type="audio/mpeg" />
                <source src={message.media_url} type="audio/wav" />
                <source src={message.media_url} type="audio/ogg" />
                Your browser does not support the audio element.
              </audio>
            ) : (
              <img
                src={message.media_url}
                alt="Media attachment"
                className="max-w-full rounded"
                style={{ maxHeight: "300px" }}
              />
            )}
          </div>
        )}
      
        {/* Render message content if present */}
        {message.content && (
          <div className="text-terminal-foreground/80 markdown-content break-words overflow-hidden">
            <ReactMarkdown
              components={{
                code({ node, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  return (
                    <pre
                      className={cn(
                        "my-2 p-2 rounded bg-terminal-input overflow-auto",
                        match && match[1] ? `language-${match[1]}` : ""
                      )}
                    >
                      <code
                        className={cn(
                          "text-terminal-foreground text-xs",
                          className
                        )}
                        {...props}
                      >
                        {children}
                      </code>
                    </pre>
                  );
                },
                a: ({ node, ...props }) => (
                  <a 
                    {...props}
                    className="text-terminal-foreground underline break-all"
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageItem;
