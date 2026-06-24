import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_QUESTIONS } from "@/lib/graphql/queries";
import { REWARD_STUDENT, GENERATE_AI_QUIZ, HINT_FOR_QUESTION, CHAT_WITH_AI } from "@/lib/graphql/mutations";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { CheckCircle2, ChevronRight, RefreshCcw, Loader2, HelpCircle, Star, Flame, Trophy, Lightbulb, Send, MessageSquare, Volume2, VolumeX, Pause, Play, RotateCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { KidAvatar, AvatarExpression } from "./student/KidAvatar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { tts } from "@/lib/tts";
import successSound from '@/assets/Voice/success.mp3';
import failedSound from '@/assets/Voice/failed.mp3';
import cheersSound from '@/assets/Voice/cheers.mp3';
import keyboardSound from '@/assets/Voice/keyboard.mp3';
interface LessonQuizProps {
  courseId: string;
  lessonId: string;
  onComplete: () => void;
  fallbackQuestions?: any[];
  quizQuestions?: any[];
  config?: any;
}

export function LessonQuiz({ courseId, lessonId, onComplete, fallbackQuestions, quizQuestions, config }: LessonQuizProps) {
  console.log("LessonQuiz Props:", { courseId, lessonId, hasFallback: !!fallbackQuestions, hasQuiz: !!quizQuestions });
  
  // Consolidate questions source
  const questions = quizQuestions && quizQuestions.length > 0 
    ? quizQuestions 
    : (fallbackQuestions && fallbackQuestions.length > 0 ? fallbackQuestions : []);

  // Use a useEffect to handle the "No questions" scenario to avoid render-phase state updates
  useEffect(() => {
    if (questions.length === 0) {
      console.log("[LessonQuiz] No questions found, auto-completing lesson.");
      onComplete();
    }
  }, [questions.length, onComplete]);

  const storageKey = `lessonQuiz_${courseId}_${lessonId}`;

  const loadState = () => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  };
  const savedState = loadState();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(savedState?.currentQuestionIndex || 0);
  const [selectedOption, setSelectedOption] = useState<number | null>(savedState?.selectedOption ?? null);
  const [isAnswered, setIsAnswered] = useState(savedState?.isAnswered || false);
  const [score, setScore] = useState(savedState?.score || 0);
  const [isFinished, setIsFinished] = useState(savedState?.isFinished || false);
  const [xp, setXp] = useState(savedState?.xp || 0);
  const [streak, setStreak] = useState(savedState?.streak || 0);

  useEffect(() => {
    if (!isFinished) {
      localStorage.setItem(storageKey, JSON.stringify({
        currentQuestionIndex,
        selectedOption,
        isAnswered,
        score,
        isFinished,
        xp,
        streak
      }));
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [currentQuestionIndex, selectedOption, isAnswered, score, isFinished, xp, streak, storageKey]);
  const [expression, setExpression] = useState<AvatarExpression>('normal');
  const [showExplanation, setShowExplanation] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  
  const [hintChatMessages, setHintChatMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [speechStatus, setSpeechStatus] = useState<"idle" | "playing" | "paused">("idle");
  
  const [chatWithAI, { loading: sendingChat }] = useMutation<any, any>(CHAT_WITH_AI);

  const correctAudio = useRef<HTMLAudioElement | null>(null);
  const incorrectAudio = useRef<HTMLAudioElement | null>(null);
  const completeAudio = useRef<HTMLAudioElement | null>(null);
  const typingAudio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    correctAudio.current = new Audio(successSound);
    incorrectAudio.current = new Audio(failedSound);
    completeAudio.current = new Audio(cheersSound);
    typingAudio.current = new Audio(keyboardSound);
    
    if (correctAudio.current) correctAudio.current.volume = 0.3;
    if (incorrectAudio.current) incorrectAudio.current.volume = 0.3;
    if (completeAudio.current) completeAudio.current.volume = 0.3;
    if (typingAudio.current) {
      typingAudio.current.volume = 0.3;
      typingAudio.current.loop = true;
    }
  }, []);

  const { loading: queryLoading, error: queryError } = useQuery(GET_QUESTIONS, {
    variables: { courseId, lessonId },
    skip: !!quizQuestions || !courseId || !lessonId
  });

  const [rewardStudent] = useMutation(REWARD_STUDENT);
  const { isOffline, enqueueAction } = useOfflineSync();
  const [generateAIQuiz, { loading: generatingQuiz }] = useMutation(GENERATE_AI_QUIZ, {
    refetchQueries: [{ query: GET_QUESTIONS, variables: { courseId, lessonId } }]
  });
  const [hintForQuestion, { loading: loadingHint }] = useMutation(HINT_FOR_QUESTION);

  // Effect for typing sound and vibration
  useEffect(() => {
    const isTyping = loadingHint || sendingChat || generatingQuiz;
    let vibrateInterval: NodeJS.Timeout;
    
    if (isTyping) {
      if (typingAudio.current) {
        typingAudio.current.currentTime = 0;
        typingAudio.current.play().catch(e => console.error("Typing audio err:", e));
      }
      if (navigator.vibrate) {
        vibrateInterval = setInterval(() => navigator.vibrate(50), 200);
      }
    } else {
      if (typingAudio.current) {
        typingAudio.current.pause();
        typingAudio.current.currentTime = 0;
      }
      if (navigator.vibrate) navigator.vibrate(0);
    }
    
    return () => {
      if (vibrateInterval) clearInterval(vibrateInterval);
    };
  }, [loadingHint, sendingChat, generatingQuiz]);

  if (queryLoading && !quizQuestions) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;
  if (queryError && !quizQuestions) return <div className="text-destructive p-4">Error loading quiz questions.</div>;
  
  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <p className="text-muted-foreground">Finalizing unit progress...</p>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  const handleOptionSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setExpression('thinking');
  };

  const handleGetHint = async () => {
    if (isAnswered) return;
    setShowHint(true);
    setHint(null);
    setHintChatMessages([]);
    try {
      const { data } = await hintForQuestion({
        variables: {
          questionText: currentQuestion.questionText,
          options: currentQuestion.options
        }
      });
      const generatedHint = (data as any)?.hintForQuestion || "Think carefully about the key concepts in this question.";
      setHint(generatedHint);
    } catch {
      setHint("Think about the core concept this question is testing. Review the key terms carefully.");
    }
  };

  const handleSendHintChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || sendingChat) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    
    // Add user message to UI immediately
    const updatedMessages: {role: 'user' | 'assistant', content: string}[] = [
      ...hintChatMessages, 
      { role: 'user', content: userMessage }
    ];
    setHintChatMessages(updatedMessages);

    try {
      // Provide context to the AI about the current question and hint
      const contextMessage = `Context: The student is asking about this quiz question: "${currentQuestion.questionText}". The hint I was given is: "${hint}". Student asks: ${userMessage}`;
      
      const { data } = await chatWithAI({
        variables: { message: contextMessage }
      });
      
      if (data?.chatWithAI?.content) {
        const response = data.chatWithAI.content;
        setHintChatMessages(prev => [...prev, { role: 'assistant', content: response }]);
        
        // Read the AI response
        setSpeechStatus("playing");
        tts.speak(response, () => setSpeechStatus("idle"));
      }
    } catch (err) {
      console.error("Chat error", err);
    }
  };

  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [loadingAiExplanation, setLoadingAiExplanation] = useState(false);
  const [showGetExplanationBtn, setShowGetExplanationBtn] = useState(false);

  const handleSubmitAnswer = async () => {
    // For matching type, skip option selection check
    if (currentQuestion.type !== 'matching' && selectedOption === null) return;
    setIsAnswered(true);
    setShowHint(false);
    
    const isMatching = currentQuestion.type === 'matching';
    const isCorrect = !isMatching && selectedOption === currentQuestion.correctOptionIndex;
    
    if (isCorrect) {
      setScore(score + 1);
      setStreak(streak + 1);
      setXp(prev => prev + 10 + (streak > 2 ? 5 : 0));
      setExpression('happy');
      if (correctAudio.current) {
        correctAudio.current.currentTime = 0;
        correctAudio.current.play().catch(e => console.error("Audio error:", e));
      }
      confetti({
        particleCount: 40,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#EAB308', '#FACC15', '#FFFFFF']
      });
    } else if (!isMatching) {
      setStreak(0);
      setExpression('sad');
      if (incorrectAudio.current) {
        incorrectAudio.current.currentTime = 0;
        incorrectAudio.current.play().catch(e => console.error("Audio error:", e));
      }
    } else {
      // Matching questions: always award points for reviewing
      setScore(score + 1);
      setStreak(streak + 1);
      setExpression('happy');
    }

    // If question already has a stored explanation, use it directly — no AI call needed
    if (currentQuestion.explanation) {
      setAiExplanation(null); // will fallback to currentQuestion.explanation in render
      setShowGetExplanationBtn(false);
    } else if (!isMatching) {
      // No stored explanation — show a button so student can request AI explanation on demand
      setShowGetExplanationBtn(true);
      setAiExplanation(null);
    } else {
      setShowGetExplanationBtn(false);
    }

    setShowExplanation(true);
  };

  const handleGetAiExplanation = async () => {
    setShowGetExplanationBtn(false);
    setLoadingAiExplanation(true);
    try {
      const correctAnswer = currentQuestion.options?.[currentQuestion.correctOptionIndex] || '';
      const prompt = `Explain why "${correctAnswer}" is correct for: "${currentQuestion.questionText}".
    
    Keep it ultra-concise:
    ### 🎯 Key Insight
    [One definitive sentence explaining the core fact.]

    ### ⚡ Quick Dive
    [Max 2 sentences explaining the logic. No fluff. Keep under 50 words.]`;
    
      const { data } = await chatWithAI({
        variables: { message: prompt }
      });
    
      if (data?.chatWithAI?.content) {
        setAiExplanation(data.chatWithAI.content);
      }
    } catch (err) {
      console.error("AI Explanation Error:", err);
      setAiExplanation("Great job! Keep going to the next challenge.");
    } finally {
      setLoadingAiExplanation(false);
    }
  };

  const handleNext = () => {
    tts.stop();
    setSpeechStatus("idle");
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setShowExplanation(false);
      setAiExplanation(null);
      setShowGetExplanationBtn(false); // Reset for next question
      setShowHint(false);
      setHint(null);
      setHintChatMessages([]);
      setExpression('normal');
    } else {
      setIsFinished(true);
      setExpression('celebrating');
      if (completeAudio.current) {
        completeAudio.current.currentTime = 0;
        completeAudio.current.play().catch(e => console.error("Audio error:", e));
      }
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 }
      });
      if (isOffline) {
        enqueueAction({
          type: 'REWARD_QUIZ',
          variables: {
            xp: xp,
            streak: streak,
            courseId: courseId,
            lessonId: lessonId,
            score: Math.round((score / questions.length) * 100)
          },
          description: `Quiz reward: ${score}/${questions.length} correct`,
        });
      } else {
        rewardStudent({
          variables: {
            xp: xp,
            streak: streak,
            courseId: courseId,
            lessonId: lessonId,
            score: Math.round((score / questions.length) * 100)
          }
        }).catch(err => console.error("Reward Error:", err));
      }
    }
  };

  const handleRestart = () => {
    tts.stop();
    setSpeechStatus("idle");
    localStorage.removeItem(storageKey);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setXp(0);
    setStreak(0);
    setIsFinished(false);
    setExpression('normal');
    setShowExplanation(false);
    setAiExplanation(null);
    setShowGetExplanationBtn(false);
    setShowHint(false);
    setHint(null);
    setHintChatMessages([]);
  };

  if (isFinished) {
    const passed = score / questions.length >= 0.7;
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center p-8 space-y-8"
      >
        <KidAvatar expression="celebrating" />
        
        <div className="space-y-2">
          <h3 className="text-4xl font-black text-foreground tracking-tighter">
            {passed ? "UNIT MASTERED! 🏆" : "GREAT TRY! 💪"}
          </h3>
          <p className="text-muted-foreground font-medium">
            You scored {score} out of {questions.length} questions
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
          <div className="p-4 bg-gold/10 rounded-2xl border border-gold/20">
            <div className="text-2xl font-black text-gold">+{xp}</div>
            <div className="text-[10px] font-bold uppercase text-gold/60 tracking-widest">Total XP</div>
          </div>
          <div className="p-4 bg-accent/10 rounded-2xl border border-accent/20">
            <div className="text-2xl font-black text-accent">{Math.round(score/questions.length * 100)}%</div>
            <div className="text-[10px] font-bold uppercase text-accent/60 tracking-widest">Accuracy</div>
          </div>
        </div>

        <div className="flex flex-col gap-3 justify-center max-w-xs mx-auto">
          {passed ? (
            <>
              <Button variant="gold" onClick={onComplete} className="w-full h-14 sm:h-16 rounded-2xl text-lg font-black shadow-gold hover:scale-[1.02] transition-all">
                COLLECT REWARDS <Star className="w-5 h-5 ml-2 fill-current" />
              </Button>
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-accent">
                <Trophy className="w-4 h-4" /> New Badge: Smart Starter!
              </div>
            </>
          ) : (
            <Button variant="outline" onClick={handleRestart} className="h-14 rounded-2xl font-black border-dashed">
              <RefreshCcw className="w-4 h-4 mr-2" /> TRY CHALLENGE AGAIN
            </Button>
          )}
        </div>
      </motion.div>
    );
  }

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="space-y-8 relative">
      {/* Gamified Header */}
      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Challenge Progress</div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-foreground">{currentQuestionIndex + 1}</span>
              <span className="text-sm font-bold text-muted-foreground">/ {questions.length}</span>
            </div>
          </div>
          <div className="flex gap-4">
            {streak >= 2 && (
              <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }} 
                className="flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 text-orange-500 rounded-full border border-orange-500/20"
              >
                <Flame className="w-4 h-4 fill-current" />
                <span className="text-xs font-black">{streak} STREAK!</span>
              </motion.div>
            )}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-gold/10 text-gold rounded-full border border-gold/20">
              <Star className="w-4 h-4 fill-current" />
              <span className="text-xs font-black">{xp} XP</span>
            </div>
          </div>
        </div>
        
        {/* Animated Progress Bar */}
        <div className="h-3 bg-muted/30 rounded-full overflow-hidden border border-border/50">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-gold shadow-gold relative"
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
          </motion.div>
        </div>
      </div>

      {/* Avatar — shown at top on mobile only */}
      <div className="flex justify-center md:hidden pb-4">
        <KidAvatar expression={expression} />
      </div>

      <div className="grid md:grid-cols-12 gap-6 md:gap-8 items-start">
        <div className="md:col-span-8 space-y-6">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Question Text */}
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <div className="text-xl font-bold leading-tight text-foreground flex-1 prose dark:prose-invert max-w-none" 
                     dangerouslySetInnerHTML={{ __html: currentQuestion.questionText }} 
                />
                <div className="flex items-center gap-1 bg-secondary/50 p-1.5 rounded-full border border-border/50 transition-all duration-300">
                  {speechStatus === "idle" ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSpeechStatus("playing");
                        const optionsText = currentQuestion?.options ? `. The options are: ${currentQuestion.options.join(', ')}` : '';
                        const textToRead = `${currentQuestion?.questionText}${optionsText}`;
                        tts.speak(textToRead, () => setSpeechStatus("idle"));
                      }}
                      className="h-9 w-9 rounded-full text-foreground/40 hover:text-foreground hover:bg-foreground/10"
                    >
                      <Volume2 className="w-5 h-5" />
                    </Button>
                  ) : speechStatus === "playing" ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        tts.pause();
                        setSpeechStatus("paused");
                      }}
                      className="h-9 w-9 rounded-full text-indigo-400 bg-indigo-400/20 hover:bg-indigo-400/30 animate-pulse"
                    >
                      <Pause className="w-5 h-5" />
                    </Button>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          tts.resume();
                          setSpeechStatus("playing");
                        }}
                        className="h-9 w-9 rounded-full text-indigo-400 bg-indigo-400/20 hover:bg-indigo-400/30"
                      >
                        <Play className="w-5 h-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          tts.stop();
                          setSpeechStatus("playing");
                          const optionsText = currentQuestion?.options ? `. The options are: ${currentQuestion.options.join(', ')}` : '';
                          const textToRead = `${currentQuestion?.questionText}${optionsText}`;
                          tts.speak(textToRead, () => setSpeechStatus("idle"));
                        }}
                        className="h-9 w-9 rounded-full text-amber-400 hover:bg-amber-400/10"
                      >
                        <RotateCcw className="w-5 h-5" />
                      </Button>
                    </div>
                  )}
                  {speechStatus !== "idle" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        tts.stop();
                        setSpeechStatus("idle");
                      }}
                      className="h-9 w-9 rounded-full text-red-400 hover:text-red-500 hover:bg-red-500/10 border-l border-border/50 ml-1 pl-2"
                    >
                      <VolumeX className="w-5 h-5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {currentQuestion.type === 'matching' ? (
              <div className="space-y-4">
                <p className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 mb-3">Match the items below:</p>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    {currentQuestion.matchingPairs?.map((pair: any) => (
                      <div key={pair.id} className="p-3 rounded-xl bg-card border border-border/50 font-bold text-sm text-foreground">
                        {pair.left}
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {/* Shuffle right items for display */}
                    {[...(currentQuestion.matchingPairs || [])].sort(() => Math.random() - 0.5).map((pair: any) => (
                      <div key={pair.id} className="p-3 rounded-xl bg-card border border-border/50 font-bold text-sm text-foreground">
                        {pair.right}
                      </div>
                    ))}
                  </div>
                </div>
                {isAnswered && (
                  <div className="p-4 rounded-2xl bg-green-500/5 border border-green-500/20">
                    <p className="text-[10px] font-black uppercase tracking-widest text-green-500 mb-2">Correct Matches:</p>
                    <div className="space-y-1.5">
                      {currentQuestion.matchingPairs?.map((pair: any) => (
                        <div key={pair.id} className="flex items-center gap-2 text-sm font-bold text-foreground">
                          <span>{pair.left}</span>
                          <span className="text-muted-foreground">⟷</span>
                          <span className="text-green-400">{pair.right}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid gap-3">
                {currentQuestion.options?.map((option: string, i: number) => {
                  const isCorrectOption = i === currentQuestion.correctOptionIndex;
                  const isSelectedOption = i === selectedOption;
                  
                  let stateClass = "bg-card border-border hover:border-gold/50";
                  if (isAnswered) {
                    if (isCorrectOption) stateClass = "bg-green-500/10 border-green-500 text-green-400 scale-[1.02] shadow-lg shadow-green-500/10";
                    else if (isSelectedOption) stateClass = "bg-red-500/10 border-red-500 text-red-500 opacity-80";
                    else stateClass = "bg-muted/5 border-border/20 text-muted-foreground opacity-40";
                  } else if (isSelectedOption) {
                    stateClass = "bg-gold/10 border-gold text-gold shadow-lg shadow-gold/10";
                  }

                  return (
                    <motion.button
                      key={i}
                      whileHover={!isAnswered ? { scale: 1.01 } : {}}
                      whileTap={!isAnswered ? { scale: 0.98 } : {}}
                      onClick={() => handleOptionSelect(i)}
                      disabled={isAnswered}
                      className={`w-full text-left p-4 sm:p-6 rounded-xl sm:rounded-3xl border-2 transition-all flex items-center justify-between font-bold text-base sm:text-xl ${stateClass}`}
                    >
                      <span dangerouslySetInnerHTML={{ __html: option }} />
                      {isAnswered && isCorrectOption && <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 fill-current shrink-0" />}
                    </motion.button>
                  );
                })}
              </div>
            )}

            {/* Hint Button and Panel below options */}
            <div className="pt-2">
              {!isAnswered && !showHint && (
                <div className="flex justify-start">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGetHint}
                    disabled={loadingHint}
                    className="shrink-0 border-amber-500/30 text-amber-500 hover:bg-amber-500/10 hover:border-amber-500 rounded-xl gap-1.5 font-bold"
                  >
                    {loadingHint ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Lightbulb className="w-3.5 h-3.5" />
                    )}
                    Get a Hint
                  </Button>
                </div>
              )}

              <AnimatePresence>
                {showHint && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-4 p-4 bg-amber-500/5 border-2 border-amber-500/20 rounded-2xl relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                      <Lightbulb className="w-10 h-10 text-amber-500" />
                    </div>
                    <p className="text-[10px] font-black uppercase text-amber-500 tracking-[0.2em] mb-2">
                      💡 AI Hint
                    </p>
                    {loadingHint || !hint ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                        Thinking of a hint for you...
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="text-sm font-medium text-foreground leading-relaxed">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                              strong: ({ node, ...props }) => <strong className="font-bold text-amber-600 dark:text-amber-400" {...props} />,
                              em: ({ node, ...props }) => <em className="italic" {...props} />,
                            }}
                          >
                            {hint}
                          </ReactMarkdown>
                        </div>
                        
                        {/* Hint Chat Interface */}
                        <div className="mt-4 pt-4 border-t border-amber-500/10 space-y-3">
                          {hintChatMessages.length > 0 && (
                            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                              {hintChatMessages.map((msg, idx) => (
                                <div key={idx} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                  <div className={`px-3 py-2 rounded-2xl max-w-[85%] text-xs font-medium ${
                                    msg.role === 'user' 
                                      ? 'bg-amber-500 text-white rounded-tr-sm' 
                                      : 'bg-background/50 border border-border/50 rounded-tl-sm text-foreground'
                                  }`}>
                                    <ReactMarkdown
                                      remarkPlugins={[remarkGfm]}
                                      components={{
                                        p: ({ node, ...props }) => <p className="mb-1 last:mb-0" {...props} />,
                                        strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
                                        em: ({ node, ...props }) => <em className="italic" {...props} />,
                                      }}
                                    >
                                      {msg.content}
                                    </ReactMarkdown>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          <form onSubmit={handleSendHintChat} className="flex gap-2">
                            <input
                              type="text"
                              value={chatInput}
                              onChange={(e) => setChatInput(e.target.value)}
                              placeholder="Ask a follow-up question..."
                              className="flex-1 bg-background/50 border border-amber-500/20 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500/50"
                              disabled={sendingChat || isAnswered}
                            />
                            <Button 
                              type="submit" 
                              size="icon" 
                              disabled={!chatInput.trim() || sendingChat || isAnswered}
                              className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white rounded-xl h-9 w-9"
                            >
                              {sendingChat ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </Button>
                          </form>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* Avatar — desktop only (mobile avatar is above) */}
        <div className="hidden md:flex md:col-span-4 sticky top-4 justify-end">
          <KidAvatar expression={expression} />
        </div>
      </div>

      <AnimatePresence>
        {isAnswered && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 pt-6 border-t border-border/50"
          >
            {(showExplanation || loadingAiExplanation) && (
              <div className={`p-6 rounded-3xl border-2 relative overflow-hidden ${
                selectedOption === currentQuestion.correctOptionIndex
                  ? 'bg-green-500/5 border-green-500/20'
                  : 'bg-accent/5 border-accent/20'
              }`}>
                <div className="absolute top-0 right-0 p-3 opacity-10">
                  <HelpCircle className="w-12 h-12" />
                </div>
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 ${
                  selectedOption === currentQuestion.correctOptionIndex ? 'text-green-500' : 'text-accent'
                }`}>
                  {selectedOption === currentQuestion.correctOptionIndex
                    ? '✅ Correct Logic'
                    : '💡 Answer Logic'}
                </p>
                {currentQuestion.type !== 'matching' && selectedOption !== currentQuestion.correctOptionIndex && (
                  <p className="text-sm font-black text-green-400 mb-2"
                     dangerouslySetInnerHTML={{ __html: `✓ ${currentQuestion.options?.[currentQuestion.correctOptionIndex] || ''}` }} 
                  />
                )}

                {showGetExplanationBtn ? (
                  <div className="flex flex-col items-center gap-3 py-4">
                    <p className="text-xs text-muted-foreground text-center max-w-sm">
                      No explanation is stored for this question. Click below to get an AI-generated explanation on demand.
                    </p>
                    <Button
                      onClick={handleGetAiExplanation}
                      variant="outline"
                      className="h-10 px-5 rounded-xl font-bold text-xs gap-2 border-accent/30 text-accent hover:bg-accent/10"
                    >
                      <Sparkles className="w-4 h-4" />
                      Get AI Explanation
                    </Button>
                  </div>
                ) : loadingAiExplanation ? (
                  <div className="flex items-center gap-3 text-sm text-muted-foreground py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-accent" />
                    <span>AI is crafting a detailed breakdown for you...</span>
                  </div>
                ) : (
                  <div className="text-sm font-bold text-foreground leading-relaxed">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ node, ...props }) => <p className="mb-4 last:mb-0" {...props} />,
                        strong: ({ node, ...props }) => <strong className="font-black text-gold" {...props} />,
                        ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-4 space-y-1" {...props} />,
                        li: ({ node, ...props }) => <li className="font-medium" {...props} />,
                        h3: ({ node, ...props }) => <h3 className="text-lg font-black text-accent mt-6 mb-2" {...props} />,
                      }}
                    >
                      {aiExplanation || currentQuestion.explanation || "No explanation provided."}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <Button 
                variant="gold" 
                onClick={handleNext} 
                disabled={loadingAiExplanation}
                className="w-full sm:w-auto h-14 sm:h-16 px-8 sm:px-10 rounded-2xl text-base sm:text-lg font-black shadow-gold group hover:scale-[1.05] transition-all"
              >
                {currentQuestionIndex < questions.length - 1 ? "NEXT CHALLENGE" : "FINISH QUIZ"}
                <ChevronRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isAnswered && (
        <div className="flex justify-end pt-4 border-t border-border/50">
          <Button 
            variant="gold" 
            onClick={handleSubmitAnswer} 
            disabled={currentQuestion.type !== 'matching' && selectedOption === null}
            className="w-full sm:w-auto h-14 px-8 rounded-2xl font-black shadow-gold"
          >
            {currentQuestion.type === 'matching' ? 'VIEW MATCHES' : 'CHECK ANSWER'}
          </Button>
        </div>
      )}
    </div>
  );
}
