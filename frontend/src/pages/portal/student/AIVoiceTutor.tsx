import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { Mic, Square, Loader2, Volume2, Globe } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AIVoiceTutor() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string, audio?: string }[]>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleAudioUpload(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Could not access microphone.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleAudioUpload = async (audioBlob: Blob) => {
    setIsProcessing(true);
    const formData = new FormData();
    // Some browsers use webm, some use ogg or mp4 for media recorder.
    formData.append('audio', audioBlob, 'voice.webm');

    const token = localStorage.getItem('ihub_token');

    try {
      const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace('/graphql', '');
      const response = await fetch(`${baseUrl}/api/voice-tutor/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process voice');
      }

      const data = await response.json();
      
      setMessages(prev => [
        ...prev, 
        { role: 'user', text: data.userText },
        { role: 'ai', text: data.aiText, audio: data.audio }
      ]);

      if (data.audio) {
        const audio = new Audio(data.audio);
        audio.play().catch(e => console.error('Audio play error:', e));
      } else if ('speechSynthesis' in window) {
        // Fallback to browser TTS if API couldn't generate audio
        const utterance = new SpeechSynthesisUtterance(data.aiText);
        window.speechSynthesis.speak(utterance);
      }

    } catch (error) {
      console.error(error);
      toast.error('Failed to get response from AI Tutor.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <PortalLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold font-heading text-foreground flex items-center gap-3">
            <div className="p-3 rounded-xl bg-accent/20">
                <Globe className="text-accent w-8 h-8" /> 
            </div>
            AI Voice Tutor
          </h1>
          <p className="text-muted-foreground mt-3">
            Practice speaking and listening in English, French, and Kinyarwanda with your African-friendly AI assistant.
          </p>
        </motion.div>

        <Card className="border-accent/30 bg-card/50 backdrop-blur-xl h-[600px] flex flex-col justify-between shadow-2xl overflow-hidden rounded-3xl">
          <CardContent className="flex-1 p-6 flex flex-col space-y-4 overflow-y-auto custom-scrollbar relative bg-gradient-to-b from-transparent to-accent/5">
            {messages.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center opacity-40 space-y-4">
                <Volume2 className="w-24 h-24 text-accent animate-pulse" />
                <p className="text-2xl font-bold font-heading text-center">Tap the microphone<br/>to start speaking</p>
              </div>
            )}
            
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`p-4 rounded-3xl max-w-[80%] shadow-md ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-br from-accent to-accent/80 text-accent-foreground self-end rounded-br-sm' 
                    : 'bg-muted text-foreground self-start rounded-bl-sm border border-border/50'
                }`}
              >
                <div className="text-sm font-bold mb-1 opacity-60 uppercase tracking-wider">{msg.role === 'user' ? 'You' : 'AI Tutor'}</div>
                <div className="text-lg leading-relaxed">{msg.text}</div>
                
                {msg.role === 'ai' && msg.audio && (
                  <Button variant="secondary" size="sm" className="mt-3 rounded-full hover:bg-accent hover:text-white transition-colors" onClick={() => new Audio(msg.audio!).play()}>
                    <Volume2 className="w-4 h-4 mr-2"/> Replay Audio
                  </Button>
                )}
              </motion.div>
            ))}
            
            {isProcessing && (
               <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-3xl max-w-[80%] self-start bg-muted text-foreground rounded-bl-sm border border-border/50 flex items-center gap-3"
              >
                <Loader2 className="w-5 h-5 animate-spin text-accent" />
                <span className="animate-pulse">Thinking and generating voice...</span>
              </motion.div>
            )}
          </CardContent>

          <div className="p-8 bg-background border-t border-border/50 flex justify-center items-center shadow-inner relative z-10">
            <Button
              size="lg"
              className={`rounded-full w-24 h-24 shadow-2xl transition-all duration-300 ${
                isRecording 
                  ? "bg-red-500 hover:bg-red-600 shadow-red-500/50 animate-pulse scale-110" 
                  : "bg-accent hover:bg-accent/90 shadow-accent/50 hover:scale-105"
              } ${isProcessing ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
            >
              {isRecording ? <Square className="w-10 h-10 fill-current text-white" /> : <Mic className="w-10 h-10 text-white" />}
            </Button>
          </div>
        </Card>
      </div>
    </PortalLayout>
  );
}
