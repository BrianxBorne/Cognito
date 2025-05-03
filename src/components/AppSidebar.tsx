
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { MessageCircle, Users, User, Settings, Bell, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Group {
  id: string;
  name: string;
  description?: string;
  unread?: number;
}

interface Profile {
  id: string;
  username: string;
  full_name?: string;
  bio?: string;
  avatar_url?: string;
  email?: string;
}

const AppSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  
  // Fetch user profile
  useEffect(() => {
    if (!user) return;
    
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }
      
      setProfile({
        ...data,
        email: user.email
      });
    };
    
    fetchProfile();
  }, [user]);
  
  // Fetch groups the user is part of
  useEffect(() => {
    if (!user) return;
    
    const fetchGroups = async () => {
      // Get groups the user is a member of
      const { data: memberData, error: memberError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);
        
      if (memberError) {
        console.error('Error fetching group memberships:', memberError);
        return;
      }
      
      if (!memberData || memberData.length === 0) {
        setGroups([]);
        return;
      }
      
      const groupIds = memberData.map(item => item.group_id);
      
      // Get the group details
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds);
        
      if (groupsError) {
        console.error('Error fetching groups:', groupsError);
        return;
      }
      
      setGroups(groupsData || []);
      
      // Set up unread counts
      const initialUnreadCounts: Record<string, number> = {};
      groupsData?.forEach(group => {
        initialUnreadCounts[group.id] = 0;
      });
      setUnreadCounts(initialUnreadCounts);
    };
    
    fetchGroups();
    
    // Subscribe to group changes
    const groupsChannel = supabase.channel('public:group_members')
      .on('postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table: 'group_members',
          filter: `user_id=eq.${user.id}`
        }, 
        () => {
          fetchGroups();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(groupsChannel);
    };
  }, [user]);
  
  // Set active group based on URL and subscribe to new messages
  useEffect(() => {
    const pathParts = location.pathname.split("/");
    if (pathParts.includes("chat") && pathParts.length > 2) {
      setActiveGroup(pathParts[2]);
    } else if (groups.length > 0) {
      setActiveGroup(groups[0].id); // Default to first group
    }
    
    if (!user) return;
    
    // Subscribe to new messages for unread counts
    const messagesChannel = supabase.channel('public:messages')
      .on('postgres_changes', 
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        }, 
        (payload) => {
          const newMessage = payload.new as {
            id: string;
            group_id: string;
            user_id: string;
            content: string;
          };
          
          // Only count as unread if not from the current user and not in active group
          if (newMessage.user_id !== user.id && 
              newMessage.group_id !== activeGroup) {
            setUnreadCounts(prev => ({
              ...prev,
              [newMessage.group_id]: (prev[newMessage.group_id] || 0) + 1
            }));
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [location.pathname, groups, user, activeGroup]);
  
  // Reset unread count when switching to a group
  useEffect(() => {
    if (activeGroup) {
      setUnreadCounts(prev => ({
        ...prev,
        [activeGroup]: 0
      }));
    }
  }, [activeGroup]);

  return (
    <Sidebar className="bg-terminal border-r border-terminal-border">
      <SidebarHeader className="text-terminal-foreground">
        <div className="flex items-center p-4">
          <span className="text-xl font-bold">
            Cognito<span className="text-terminal-foreground animate-cursor-blink">_</span>
          </span>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="terminal-scrollbar">
        <SidebarGroup>
          <SidebarGroupLabel className="text-terminal-foreground/70">Terminal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => navigate("/chat")}
                  className={location.pathname.includes("/chat") ? "bg-terminal-muted" : ""}
                >
                  <MessageCircle size={18} />
                  <span>Chat</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => navigate("/groups")}
                  className={location.pathname === "/groups" ? "bg-terminal-muted" : ""}
                >
                  <Users size={18} />
                  <span>Groups</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => navigate("/profile")}
                  className={location.pathname === "/profile" ? "bg-terminal-muted" : ""}
                >
                  <User size={18} />
                  <span>Profile</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel className="text-terminal-foreground/70">Groups</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {groups.map((group) => (
                <SidebarMenuItem key={group.id}>
                  <SidebarMenuButton 
                    onClick={() => navigate(`/chat/${group.id}`)}
                    className={group.id === activeGroup ? "bg-terminal-muted" : ""}
                  >
                    <span># {group.name}</span>
                    {unreadCounts[group.id] > 0 && (
                      <span className="ml-auto bg-terminal-foreground text-terminal rounded-full text-xs px-2 py-0.5">
                        {unreadCounts[group.id]}
                      </span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {groups.length === 0 && (
                <div className="px-3 py-2 text-sm text-terminal-foreground/50">
                  No groups joined yet
                </div>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        {profile && (
          <div className="p-4 border-t border-terminal-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-terminal-muted border border-terminal-foreground/30 flex items-center justify-center">
                  {profile.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt={profile.username} 
                      className="w-8 h-8 rounded-full object-cover" 
                    />
                  ) : (
                    <span className="text-terminal-foreground text-sm">
                      {profile.username.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="text-sm">
                  <p className="font-medium text-terminal-foreground">{profile.username}</p>
                  <p className="text-terminal-foreground/50 text-xs truncate">{profile.email}</p>
                </div>
              </div>
              <button onClick={() => signOut()} className="text-terminal-foreground/70 hover:text-terminal-foreground">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
