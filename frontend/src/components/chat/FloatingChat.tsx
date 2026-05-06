import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from "@apollo/client/react";
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  ChevronUp,
  ChevronDown,
  Search,
  Send,
  X,
  Minimize2,
  Maximize2,
  User,
  MoreHorizontal
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePusher } from '@/hooks/use-pusher';
import { GET_USERS, GET_CONVERSATIONS, GET_MESSAGES } from '@/lib/graphql/queries';
import { SEND_MESSAGE } from '@/lib/graphql/mutations';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function FloatingChat() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const pusher = usePusher();
  const [viewState, setViewState] = useState<'collapsed' | 'list' | 'chat'>('collapsed');
  const [activeConversation, setActiveConversation] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: conversationsData, refetch: refetchConversations } = useQuery(GET_CONVERSATIONS, {
    skip: !user
  });

  const { data: usersData } = useQuery(GET_USERS, {
    skip: viewState !== 'list' || searchQuery.length < 2
  });

  const { data: messagesData, refetch: refetchMessages } = useQuery(GET_MESSAGES, {
    variables: { conversationId: activeConversation?.id },
    skip: !activeConversation || activeConversation.id === 'new'
  });

  const [sendMessage] = useMutation(SEND_MESSAGE);

  useEffect(() => {
    if (!pusher || !user) return;

    const channel = pusher.subscribe(`user-${user.id}`);

    const handleReceiveMessage = (msg: any) => {
      refetchConversations();
      if (activeConversation && (msg.conversationId === activeConversation.id || (activeConversation.id === 'new' && msg.sender.id === activeConversation.otherUser.id))) {
        refetchMessages();
      }
    };

    channel.bind('receive_message', handleReceiveMessage);

    return () => {
      channel.unbind('receive_message', handleReceiveMessage);
    };
  }, [pusher, user, activeConversation, refetchConversations, refetchMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messagesData, viewState]);

  const handleToggleHeader = () => {
    if (viewState === 'collapsed') {
      setViewState('list');
    } else {
      setViewState('collapsed');
    }
  };

  const handleSelectUser = (otherUser: any) => {
    const existing = (conversationsData as any)?.conversations?.find((c: any) =>
      c.participants.some((p: any) => p.id === otherUser.id)
    );

    if (existing) {
      setActiveConversation(existing);
    } else {
      setActiveConversation({ id: 'new', otherUser, participants: [user, otherUser] });
    }
    setViewState('chat');
    setSearchQuery('');
  };

  const handleSend = async () => {
    if (!messageText.trim() || !activeConversation) return;

    const receiverId = activeConversation.id === 'new'
      ? activeConversation.otherUser.id
      : activeConversation.participants.find((p: any) => p.id !== user?.id)?.id;

    try {
      const { data } = await sendMessage({
        variables: {
          receiverId,
          content: messageText
        }
      });

      if (activeConversation.id === 'new') {
        setActiveConversation({
          ...activeConversation,
          id: (data as any).sendMessage.conversationId
        });
        refetchConversations();
      }

      setMessageText('');
      refetchMessages();
    } catch (err) {
      console.error(err);
    }
  };

  const openFullChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/chat');
    setViewState('collapsed');
  };

  if (!user) return null;

  const currentOtherUser = activeConversation?.otherUser || activeConversation?.participants?.find((p: any) => p.id !== user?.id);

  return (
    <div className={cn(
      "fixed z-[100] transition-all duration-300 pointer-events-auto",
      viewState === 'collapsed' 
        ? "bottom-6 right-6 w-auto" 
        : "bottom-0 right-0 md:right-8 md:bottom-0 w-full md:w-80"
    )}>
      <Card className={cn(
        "border-border/50 shadow-2xl overflow-hidden flex flex-col bg-card transition-all duration-300",
        viewState === 'collapsed' ? "rounded-full" : "rounded-t-xl mx-auto"
      )}>
        {/* Header Bar - Always visible */}
        <div
          onClick={handleToggleHeader}
          className={cn(
            "bg-card hover:bg-accent/5 flex items-center transition-colors cursor-pointer",
            viewState === 'collapsed' 
              ? "p-3 rounded-full border border-border/50" 
              : "px-4 py-3 justify-between border-b border-border/50"
          )}
        >
          <div className="flex items-center gap-2.5">
            {viewState === 'chat' && activeConversation ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 p-0 text-accent hover:bg-accent/10"
                  onClick={(e) => { e.stopPropagation(); setViewState('list'); }}
                >
                  <ChevronDown className="w-4 h-4 rotate-90" />
                </Button>
                <div className="relative">
                  <Avatar className="w-6 h-6 border border-accent/20">
                    <AvatarFallback className="bg-accent/10 text-accent text-[10px]">
                      {currentOtherUser?.username?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {currentOtherUser?.isOnline && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border-2 border-card"></span>
                  )}
                </div>
                <span className="font-heading font-medium text-sm text-card-foreground truncate max-w-[120px]">
                  {currentOtherUser?.username}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <MessageSquare className="w-5 h-5 text-accent" />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-accent rounded-full border-2 border-card"></span>
                </div>
                {viewState !== 'collapsed' && (
                  <span className="font-heading font-medium text-sm text-card-foreground tracking-wide">Messaging</span>
                )}
              </div>
            )}
          </div>

          {viewState !== 'collapsed' && (
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-card-foreground/50 hover:text-accent hidden md:flex" onClick={openFullChat}>
                <Maximize2 className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-card-foreground/50 hover:text-accent" onClick={handleToggleHeader}>
                <ChevronDown className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-card-foreground/50 hover:text-accent md:hidden" onClick={() => setViewState('collapsed')}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Content Area */}
        <AnimatePresence>
          {viewState !== 'collapsed' && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 440 }}
              exit={{ height: 0 }}
              className="flex flex-col overflow-hidden bg-background"
            >
              {viewState === 'chat' && activeConversation ? (
                /* CHAT VIEW */
                <div className="flex flex-col h-full">
                  <ScrollArea className="flex-1 p-3">
                    <div className="space-y-4">
                      {(messagesData as any)?.messages?.map((msg: any) => {
                        const isMe = msg.sender.id === user?.id;
                        return (
                          <div key={msg.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                            <div className={cn(
                              "max-w-[85%] p-2.5 rounded-xl text-xs shadow-sm",
                              isMe
                                ? "bg-accent text-accent-foreground rounded-tr-none"
                                : "bg-card text-card-foreground border border-border/50 rounded-tl-none"
                            )}>
                              {msg.content}
                            </div>
                            <span className="text-[9px] text-muted-foreground mt-1 px-1">
                              {new Date(parseInt(msg.createdAt)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        );
                      })}
                      <div ref={scrollRef} />
                    </div>
                  </ScrollArea>

                  <div className="p-3 border-t border-border/50 bg-card">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Type a message..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        className="h-9 text-xs bg-background border-border/50 focus-visible:ring-accent"
                      />
                      <Button size="icon" className="h-9 w-9 bg-accent hover:bg-accent/80 shrink-0" onClick={handleSend}>
                        <Send className="w-4 h-4 text-accent-foreground" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                /* LIST VIEW */
                <div className="flex flex-col h-full bg-background">
                  <div className="p-3 border-b border-border/50 bg-card/50">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search for people..."
                        className="pl-9 h-9 text-xs bg-background border-border/50 focus-visible:ring-accent"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  <ScrollArea className="flex-1">
                    <div className="p-1.5 space-y-1">
                      {searchQuery.length > 1 ? (
                        <div className="py-2">
                          <p className="px-3 text-[10px] font-bold text-accent uppercase tracking-wider mb-2">Results</p>
                          {(usersData as any)?.users?.items?.filter((u: any) => u.id !== user?.id).map((u: any) => (
                            <button
                              key={u.id}
                              onClick={() => handleSelectUser(u)}
                              className="w-full flex items-center gap-3 p-2.5 hover:bg-accent/10 cursor-pointer rounded-lg transition-all border border-transparent hover:border-accent/10"
                            >
                              <Avatar className="w-9 h-9 border border-border/50 shadow-sm">
                                <AvatarFallback className="bg-accent/10 text-accent text-xs font-bold">{u.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 text-left overflow-hidden">
                                <h5 className="text-xs font-bold text-foreground truncate">{u.username}</h5>
                                <p className="text-[10px] text-muted-foreground truncate capitalize">{u.role}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <>
                          {(conversationsData as any)?.conversations?.map((conv: any) => {
                            const other = conv.participants.find((p: any) => p.id !== user?.id);
                            return (
                              <button
                                key={conv.id}
                                onClick={() => { setActiveConversation(conv); setViewState('chat'); }}
                                className="w-full flex items-center gap-3 p-2.5 hover:bg-accent/5 cursor-pointer rounded-lg transition-all group border border-transparent hover:border-border/50"
                              >
                                <div className="relative">
                                  <Avatar className="w-11 h-11 border border-border/50 shadow-sm group-hover:border-accent/30 transition-colors">
                                    <AvatarFallback className="bg-accent/10 text-accent font-bold">
                                      {other?.username.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  {other?.isOnline && (
                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></span>
                                  )}
                                </div>
                                <div className="flex-1 text-left overflow-hidden">
                                  <div className="flex justify-between items-center mb-1">
                                    <h5 className="text-xs font-bold text-foreground group-hover:text-accent transition-colors truncate">{other?.username}</h5>
                                    <span className="text-[9px] text-muted-foreground">
                                      {conv.lastMessage ? new Date(parseInt(conv.lastMessage.createdAt)).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-muted-foreground truncate leading-relaxed">
                                    {conv.lastMessage?.content || 'No messages yet'}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                          {(!(conversationsData as any)?.conversations || (conversationsData as any).conversations.length === 0) && (
                            <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-accent/5 flex items-center justify-center">
                                <MessageSquare className="w-6 h-6 opacity-20" />
                              </div>
                              <p className="text-xs italic px-6">No active conversations. Start chatting with your team!</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
}
