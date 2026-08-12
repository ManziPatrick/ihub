import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  MessageSquare,
  HelpCircle,
  Calendar,
  Clock,
  Send,
  Search,
  ChevronRight,
  BookOpen,
  Video,
  FileText,
  User,
} from "lucide-react";
import { useQuery, useMutation, useSubscription } from "@apollo/client/react";
import { GET_CONVERSATIONS, GET_MESSAGES, GET_USERS } from "@/lib/graphql/queries";
import { SEND_MESSAGE } from "@/lib/graphql/mutations";
import { usePusher } from "@/hooks/use-pusher";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { toast } from "sonner";

const safeFormatDate = (dateString: any, formatStr: string = 'HH:mm') => {
  if (!dateString) return '';
  const timestamp = parseInt(dateString);
  const date = !isNaN(timestamp) ? new Date(timestamp) : new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return format(date, formatStr);
};

const faqs = [
  { q: "How do I reset my password?", a: "Go to Settings > Profile." },
  { q: "Can I download course videos?", a: "Streaming only, but slides are downloadable." },
  { q: "How do I contact my instructor?", a: "Use the 'Messages' tab above." },
  { q: "When will I receive my certificate?", a: "Within 24 hours of course completion." },
];

const supportTickets = [
  { id: "T-2024-001", subject: "Video playback issue", status: "resolved", date: "Jan 20, 2026" },
  { id: "T-2024-002", subject: "Project submission error", status: "in_progress", date: "Jan 28, 2026" },
];

export default function StudentSupport() {
  const { user: currentUser } = useAuth();
  const pusher = usePusher();
  const [activeTab, setActiveTab] = useState<"contact" | "chat">("contact");
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Queries
  const { data: convData, refetch: refetchConvs } = useQuery(GET_CONVERSATIONS);
  const { data: msgData, refetch: refetchMsgs } = useQuery(GET_MESSAGES, {
    variables: { conversationId: activeConversationId },
    skip: !activeConversationId
  });
  const { data: usersData } = useQuery(GET_USERS, { variables: { limit: 100 } });

  const [sendMessageMutation] = useMutation(SEND_MESSAGE);

  // Real-time updates via Pusher
  useEffect(() => {
    if (!pusher || !currentUser) return;

    const channel = pusher.subscribe(`user-${currentUser.id}`);

    const handleReceiveMessage = () => {
      refetchMsgs();
      refetchConvs();
    };

    channel.bind('receive_message', handleReceiveMessage);

    return () => {
      channel.unbind('receive_message', handleReceiveMessage);
    };
  }, [pusher, currentUser, refetchMsgs, refetchConvs]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [msgData]);

  const conversations = (convData as any)?.conversations || [];
  const messages = (msgData as any)?.messages || [];
  const trainers = ((usersData as any)?.users?.items || []).filter((u: any) => u.role === 'trainer');

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeConversationId) return;

    try {
      const conv = conversations.find((c: any) => c.id === activeConversationId);
      const otherParticipant = conv.participants.find((p: any) => p.id !== currentUser?.id);

      await sendMessageMutation({
        variables: {
          receiverId: otherParticipant.id,
          content: newMessage
        }
      });

      setNewMessage("");
      refetchMsgs();
      refetchConvs();
    } catch (err: any) {
      toast.error(err.message || "Failed to send message");
    }
  };

  const startNewChat = async (trainerId: string) => {
    try {
      // Send a dummy message to start conversation or just use existing one
      await sendMessageMutation({
        variables: {
          receiverId: trainerId,
          content: "Hello! I have a question about the course."
        }
      });
      await refetchConvs();
      setActiveTab("chat");
      toast.success("Chat started!");
    } catch (err: any) {
      toast.error(err.message || "Failed to start chat");
    }
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between"
        >
          <div>
            <h1 className="font-heading text-2xl lg:text-3xl font-medium text-foreground">
              Help & Support
            </h1>
            <p className="text-muted-foreground mt-1">
              Get help with courses, technical issues, or connect with mentors
            </p>
          </div>
          <div className="flex bg-background/50 p-1 rounded-lg border border-border/50 mt-4 md:mt-0">
            <button
              onClick={() => setActiveTab("contact")}
              className={`px-4 py-2 rounded-md text-sm transition-all ${activeTab === "contact" ? "bg-accent text-accent-foreground shadow-sm" : "hover:text-accent"
                }`}
            >
              Support Center
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={`px-4 py-2 rounded-md text-sm transition-all ${activeTab === "chat" ? "bg-accent text-accent-foreground shadow-sm" : "hover:text-accent"
                }`}
            >
              Messages
            </button>
          </div>
        </motion.div>

        {activeTab === "contact" ? (
          <>
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid sm:grid-cols-3 gap-4"
            >
              <Card
                className="border-border/50 hover:border-accent/30 transition-all cursor-pointer overflow-hidden group"
                onClick={() => setActiveTab("chat")}
              >
                <CardContent className="p-6 text-center relative">
                  <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <MessageSquare className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="font-heading font-semibold text-card-foreground mb-1">Live Chat</h3>
                  <p className="text-xs text-card-foreground/60">Chat with support team</p>
                </CardContent>
              </Card>
              <Card className="border-border/50 hover:border-accent/30 transition-all cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="font-heading font-semibold text-card-foreground mb-1">Book Office Hours</h3>
                  <p className="text-xs text-card-foreground/60">Schedule time with instructor</p>
                </CardContent>
              </Card>
              <Card className="border-border/50 hover:border-accent/30 transition-all cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-3">
                    <Video className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="font-heading font-semibold text-card-foreground mb-1">Video Call</h3>
                  <p className="text-xs text-card-foreground/60">Request a Google Meet</p>
                </CardContent>
              </Card>
            </motion.div>

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-border/50 bg-card/30">
                  <CardContent className="p-6">
                    <h2 className="font-heading text-lg font-semibold text-card-foreground mb-4">
                      Start a Conversation with a Trainer
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {trainers.map((trainer: any) => (
                        <div
                          key={trainer.id}
                          className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/50 hover:border-accent/30 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-accent/10 text-accent">
                                {trainer.username[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm text-card-foreground">{trainer.username}</p>
                              <Badge variant="outline" className="text-[10px] py-0 h-4">Trainer</Badge>
                            </div>
                          </div>
                          <Button
                            variant="gold"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => startNewChat(trainer.id)}
                          >
                            Chat
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardContent className="p-6">
                    <h2 className="font-heading text-lg font-semibold text-card-foreground mb-4">
                      Submit a Help Ticket
                    </h2>
                    <div className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-card-foreground mb-2 block">
                            Subject
                          </label>
                          <Input
                            placeholder="What's your question about?"
                            value={ticketSubject}
                            onChange={(e) => setTicketSubject(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-card-foreground mb-2 block">
                            Category
                          </label>
                          <select className="w-full h-10 px-3 rounded-md border border-input bg-background/50 text-sm">
                            <option>Technical Issue</option>
                            <option>Course Content</option>
                            <option>Payment</option>
                            <option>Opportunity</option>
                            <option>Other</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-card-foreground mb-2 block">
                          Message
                        </label>
                        <Textarea
                          placeholder="Describe your issue or question in detail..."
                          rows={4}
                          className="bg-background/50"
                          value={ticketMessage}
                          onChange={(e) => setTicketMessage(e.target.value)}
                        />
                      </div>
                      <Button
                        variant="gold"
                        className="w-full sm:w-auto"
                        onClick={() => {
                          toast.success("Ticket submitted successfully!");
                          setTicketSubject("");
                          setTicketMessage("");
                        }}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Send Ticket
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="border-border/50">
                  <CardContent className="p-6">
                    <h2 className="font-heading text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2">
                      <HelpCircle className="w-5 h-5 text-accent" />
                      Quick Answers
                    </h2>
                    <div className="space-y-3">
                      {[
                        { q: "Reset password?", a: "Go to Profile Settings." },
                        { q: "Certificate timing?", a: "24h after completion." },
                        { q: "Course access?", a: "Lifetime for enrolled." }
                      ].map((faq, i) => (
                        <details key={i} className="group border-b border-border/50 pb-2">
                          <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-card-foreground hover:text-accent transition-colors">
                            {faq.q}
                            <ChevronRight className="w-4 h-4 text-card-foreground/50 transition-transform group-open:rotate-90" />
                          </summary>
                          <p className="text-xs text-card-foreground/60 pt-2 pl-2 border-l-2 border-accent/20 ml-1">
                            {faq.a}
                          </p>
                        </details>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid lg:grid-cols-4 gap-6 h-[calc(100vh-250px)]"
          >
            {/* Conversations Sidebar */}
            <Card className="lg:col-span-1 border-border/50 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-border/50 bg-muted/20">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search messages..." className="pl-9 h-9" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {conversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-20" />
                    <p className="text-xs text-muted-foreground">No messages yet</p>
                  </div>
                ) : (
                  conversations.map((conv: any) => {
                    const otherUser = conv.participants.find((p: any) => p.id !== currentUser?.id);
                    const isActive = activeConversationId === conv.id;
                    return (
                      <div
                        key={conv.id}
                        onClick={() => setActiveConversationId(conv.id)}
                        className={`p-4 border-b border-border/50 cursor-pointer transition-colors flex items-center gap-3 ${isActive ? "bg-accent/10 border-r-2 border-r-accent" : "hover:bg-muted/30"
                          }`}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-accent/20 text-accent text-xs">
                            {otherUser?.username?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <p className="text-sm font-semibold text-card-foreground truncate">{otherUser?.username}</p>
                            <span className="text-[10px] text-muted-foreground">
                              {conv.lastMessage ? safeFormatDate(conv.updatedAt) : ''}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {conv.lastMessage?.content || "Started a chat"}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>

            {/* Chat Area */}
            <Card className="lg:col-span-3 border-border/50 overflow-hidden flex flex-col bg-card/30 relative">
              {activeConversationId ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-border/50 flex items-center justify-between bg-muted/20">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-accent/20 text-accent text-xs">
                          {conversations.find((c: any) => c.id === activeConversationId)?.participants.find((p: any) => p.id !== currentUser?.id)?.username?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold">
                          {conversations.find((c: any) => c.id === activeConversationId)?.participants.find((p: any) => p.id !== currentUser?.id)?.username}
                        </p>
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-[10px] text-muted-foreground">Online</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
                  >
                    {messages.map((msg: any) => {
                      const isMe = msg.sender.id === currentUser?.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[80%] flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                            {!isMe && (
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-[8px] bg-accent/20">{msg.sender.username[0]}</AvatarFallback>
                              </Avatar>
                            )}
                            <div className={`p-3 rounded-2xl text-sm ${isMe
                              ? 'bg-accent text-accent-foreground rounded-br-none'
                              : 'bg-muted text-foreground rounded-bl-none border border-border/50'
                              }`}>
                              {msg.content}
                              <p className={`text-[9px] mt-1 opacity-50 ${isMe ? 'text-right' : 'text-left'}`}>
                                {safeFormatDate(msg.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Input Area */}
                  <div className="p-4 border-t border-border/50 bg-muted/20">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="flex-1 bg-background"
                      />
                      <Button size="icon" variant="gold" onClick={handleSendMessage}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-40">
                  <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                    <MessageSquare className="w-10 h-10 text-accent" />
                  </div>
                  <h3 className="font-heading text-xl font-semibold mb-2">Select a Conversation</h3>
                  <p className="max-w-xs text-sm">
                    Connect with our support team or your course instructors to get help with your learning journey.
                  </p>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </div>
    </PortalLayout>
  );
}
