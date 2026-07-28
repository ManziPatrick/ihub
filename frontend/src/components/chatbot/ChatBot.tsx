import React, { useState, useRef, useEffect } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  Loader2,
  BrainCircuit,
  Minus,
  Maximize2
} from 'lucide-react';
import { useMutation, useQuery } from "@apollo/client/react";
import { useLocation } from "react-router-dom";
import { CHAT_WITH_AI } from '@/lib/graphql/mutations';
import { GET_CHAT_GREETING } from '@/lib/graphql/queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { getGraphqlUrl } from '@/lib/env';
import remarkGfm from 'remark-gfm';
import { useNavigate } from 'react-router-dom';


interface Message {
  role: 'user' | 'assistant';
  content: string;
  action?: string;
  actionData?: string;
}

type AIActionLink = { path: string; label?: string };

const parseLinksActionData = (actionData: string | undefined): AIActionLink[] => {
  if (!actionData) return [];
  try {
    const parsed = JSON.parse(actionData);
    const links = parsed?.links;
    if (Array.isArray(links)) {
      return links
        .map((l: any) => ({
          path: String(l?.path || ''),
          label: l?.label ? String(l.label) : undefined,
        }))
        .filter((l: AIActionLink) => l.path);
    }
    return [];
  } catch {
    return [];
  }
};

export const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! 👋 Welcome to **Bootskills Academy Hub** — loading your personalized experience...' }
  ]);

  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const greetingSet = useRef(false);
  const [chatWithAI, { loading }] = useMutation<{ chatWithAI: { content: string, role: string, action?: string, actionData?: string } }, { message: string }>(CHAT_WITH_AI);

  // Fetch dynamic greeting on mount
type GreetingQueryData = {
    chatBotGreeting?: {
      content?: string;
      role?: string;
      action?: string;
      actionData?: string;
    };
  };

  // Avoid hammering the GraphQL endpoint on routes that don't need it (e.g., homepage).
  // If the API is not configured, skip the query entirely to prevent CORS/access-control loops.
  const { pathname } = useLocation();
  // Avoid multiple rapid re-renders/requests on the homepage.
  const shouldAttemptGreeting =
    Boolean(getGraphqlUrl()) &&
    (
      pathname.startsWith('/portal') ||
      pathname.startsWith('/courses') ||
      pathname.startsWith('/chat') ||
      pathname.startsWith('/auth')
    );

  const {
    data: greetingData,
    error: greetingError,
    loading: greetingLoading,
  } = useQuery<GreetingQueryData>(GET_CHAT_GREETING, {
    fetchPolicy: 'network-only',
    skip: !shouldAttemptGreeting,
  });

  // Set greeting when query completes (only once per mount)
  useEffect(() => {
    if (greetingSet.current || greetingLoading) return;

    if (greetingData?.chatBotGreeting?.content) {
      greetingSet.current = true;
      setMessages([{
        role: 'assistant',
        content: greetingData.chatBotGreeting.content,
        action: greetingData.chatBotGreeting.action,
        actionData: greetingData.chatBotGreeting.actionData,
      }]);
    } else if (greetingError) {
      greetingSet.current = true;
      setMessages([{ role: 'assistant', content: 'Hello! 👋 Welcome to **Bootskills Academy Hub**! How can I assist you today?\n\nFeel free to ask about:\n- **Courses** we offer\n- **Programs**\n- **Mentorship bookings**\n- Help with a **technical blocker**\n\nJust let me know what you\'d like to do!' }]);
    }
  }, [greetingData, greetingError]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);

    try {
      const { data } = await chatWithAI({
        variables: { message: userMsg }
      });

      if (data?.chatWithAI) {
        const { content, action, actionData } = data.chatWithAI as any;

        // Auto-navigate if AI asks to navigate.
        if (action === 'NAVIGATE' && actionData) {
          try {
            const parsed = JSON.parse(actionData);
            const path = parsed?.path;

            if (typeof path === 'string' && path) {
              if (path.startsWith('/')) {
                // Route existence guard: only navigate to paths handled by our router.
                // This prevents trying to navigate to non-existing routes.
                const isLikelyAppRoute =
                  path === '/' ||
                 
                  path === '/explore' ||
                  
                  path.startsWith('/blog/') ||
                 
                  path === '/auth' ||
                  
                  path.startsWith('/portal/student') ||
                  path.startsWith('/portal/client') ||
                  path.startsWith('/portal/trainer') ||
                  path.startsWith('/portal/admin') ||
                  path.startsWith('/portal/super-admin') ||
                  path.startsWith('/portal/settings') ||
                  path.startsWith('/portal/help') ||
                  path.startsWith('/portal/notifications') ||
                  path.startsWith('/courses/') ||
                  path === '/courses' ||
                  path === '/chat' ||
                 
                  path.startsWith('/portal/internship/meetings');

                if (isLikelyAppRoute) {
                  navigate(path);
                } else {
                  // Fallback: keep user in the app; show a friendly message.
                  setMessages(prev => [
                    ...prev,
                    {
                      role: 'assistant',
                      content: `I couldn't find a page for: ${path}`,
                    },
                  ]);
                }
              } else {
                window.open(path, '_blank', 'noreferrer');
              }
            }
          } catch {
            // ignore parse errors
          }
        }

        const links = action === 'LINKS' ? parseLinksActionData(actionData) : [];

        setMessages(prev => [...prev, {
          role: 'assistant',
          content,
          action,
          actionData
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having a bit of trouble connecting to my servers. Please try again in a moment."
      }]);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              height: isMinimized ? '60px' : 'min(500px, 80vh)',
              width: window.innerWidth < 400 ? 'calc(100vw - 32px)' : '380px'
            }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={cn(
              "bg-background/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col mb-4 transition-all duration-300",
              isMinimized && "rounded-full"
            )}
          >
            {/* Header */}
            <div className="p-4 bg-primary/10 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Bootskills Brain</h3>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/20 rounded-full" onClick={() => setIsMinimized(!isMinimized)}>
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/20 rounded-full text-destructive" onClick={() => setIsOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Chat Messages */}
            {!isMinimized && (
              <>
                <div
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth min-h-[300px] scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent h-[400px]"
                >
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex gap-3 max-w-[85%]",
                        msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center",
                        msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted"
                      )}>
                        {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>
                      <div className={cn(
                        "p-3 rounded-2xl text-sm leading-relaxed",
                        msg.role === 'user'
                          ? "bg-primary text-primary-foreground rounded-tr-none"
                          : "bg-muted rounded-tl-none"
                      )}>
                        {msg.role === 'assistant' && msg.action === 'LINKS' && msg.actionData && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {parseLinksActionData(msg.actionData).map((l, idx) => (
                              <Button
                                key={idx}
                                variant="secondary"
                                className="h-8 text-xs"
                                onClick={() => {
                                  if (l.path.startsWith('/')) navigate(l.path);
                                  else window.open(l.path, '_blank', 'noreferrer');
                                }}
                              >
                                {l.label || 'Open'}
                              </Button>
                            ))}
                          </div>
                        )}
                        
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                            ul: ({ node, ...props }) => <ul className="list-disc ml-4 mb-2" {...props} />,
                            ol: ({ node, ...props }) => <ol className="list-decimal ml-4 mb-2" {...props} />,
                            li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                            strong: ({ node, ...props }) => <strong className="font-bold text-primary" {...props} />,
                            em: ({ node, ...props }) => <em className="italic" {...props} />,
                            a: ({ node, ...props }) => <a className="text-primary underline hover:opacity-80 transition-opacity" {...props} />
                          }}
                        >
                        {String(msg.content)
                          // Reduce overly long AI responses to keep the chat readable.
                          .replace(/\n{3,}/g, '\n\n')
                          .replace(/(\s*\*[^\*]+\*\s*)\s*\n\s*/g, '$1\n')
                          // Trim extremely long content blocks while keeping markdown structure.
                          .slice(0, 1200)}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex gap-3 mr-auto items-center">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="bg-muted p-3 rounded-2xl rounded-tl-none min-w-[60px] flex justify-center">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-background border-t border-border">
                  <form
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="flex items-center gap-2"
                  >
                    <Input
                      placeholder="Ask me anything..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      className="bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary h-10 rounded-xl"
                      disabled={loading}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      className="rounded-xl h-10 w-10 flex-shrink-0"
                      disabled={!input.trim() || loading}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                  <p className="text-[10px] text-center text-muted-foreground mt-2">
                    Powered by Bootskills Intelligence
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setIsOpen(!isOpen);
          setIsMinimized(false);
        }}
        className={cn(
          "h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-2xl flex items-center justify-center text-white transition-all duration-500",
          isOpen ? "bg-destructive rotate-90" : "bg-primary"
        )}
      >
        {isOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />}
        {!isOpen && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-background animate-bounce" />
        )}
      </motion.button>
    </div>
  );
};
