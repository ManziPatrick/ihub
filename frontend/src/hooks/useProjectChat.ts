
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_MESSAGES } from "@/lib/graphql/queries";
import { SEND_MESSAGE_TO_PROJECT } from "@/lib/graphql/mutations";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  sender: string;
  senderId: string;
  message: string;
  time: string;
  timestamp: number;
}

interface UseProjectChatOptions {
  projectId: string;
  conversationId?: string;
  enabled?: boolean;
}

export function useProjectChat({ projectId, conversationId: initialConversationId, enabled = true }: UseProjectChatOptions) {
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>(initialConversationId || undefined);

  // Update local state if prop changes
  useEffect(() => {
    if (initialConversationId) {
      setActiveConversationId(initialConversationId);
    } else if (!initialConversationId) {
      setActiveConversationId(undefined);
    }
  }, [initialConversationId]);

  // Poll every 3 seconds for new messages
  const { data, loading, error } = useQuery(GET_MESSAGES, {
    variables: activeConversationId ? { conversationId: activeConversationId } : ({} as any),
    skip: !enabled || !activeConversationId,
    fetchPolicy: "network-only"
  });


  const [sendMessageMutation, { loading: sending }] = useMutation(SEND_MESSAGE_TO_PROJECT);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;
    try {
      const response = await sendMessageMutation({
        variables: {
          projectId,
          content
        }
      });
      const newConvId = (response.data as { sendMessageToProject?: { conversationId?: string } })?.sendMessageToProject?.conversationId;
      if (newConvId && !activeConversationId) {
        setActiveConversationId(newConvId);
      }
    } catch (err: any) {
      toast.error("Failed to send message: " + err.message);
    }
  };

  const messages: ChatMessage[] = (data as any)?.messages?.map((msg: any) => ({
    id: msg.id,
    sender: msg.sender?.username || "Unknown",
    senderId: msg.sender?.id,
    message: msg.content,
    time: new Date(Number(msg.createdAt)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timestamp: Number(msg.createdAt)
  })) || [];

  return {
    messages,
    sendMessage,
    isConnected: true, // Always allow typing; backend will auto-create the conversation on first message
    loading
  };
}
