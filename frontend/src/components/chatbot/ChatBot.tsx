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
import { useMutation } from "@apollo/client/react";
import { CHAT_WITH_AI } from '@/lib/graphql/mutations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! 🌟 Welcome to **Bootskills** — it\'s great to have you here! How can I assist you today? 😊\n\nAre you looking to:\n- Explore a new **course** or upgrade your skills\n- Book a **mentorship session**\n- Check your **dashboard**, schedule, or progress\n- Get help with a **technical blocker** in your code\n\nJust let me know — I\'m here to help you succeed! 🚀' }
  ]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [chatWithAI, { loading }] = useMutation<{ chatWithAI: { content: string, role: string, action?: string, actionData?: string } }, { message: string }>(CHAT_WITH_AI);

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
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.chatWithAI.content
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
                          {msg.content}
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
