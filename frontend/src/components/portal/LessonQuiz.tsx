import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_QUESTIONS } from "@/lib/graphql/queries";
import { REWARD_STUDENT, GENERATE_AI_QUIZ, HINT_FOR_QUESTION, CHAT_WITH_AI } from "@/lib/graphql/mutations";
import { CheckCircle2, ChevronRight, RefreshCcw, Loader2, HelpCircle, Star, Flame, Trophy, Lightbulb, Send, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { KidAvatar, AvatarExpression } from "./student/KidAvatar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface LessonQuizProps {
  courseId: string;
  lessonId: string;
  onComplete: () => void;
}

export function LessonQuiz({ courseId, lessonId, onComplete }: LessonQuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [expression, setExpression] = useState<AvatarExpression>('normal');
  const [showExplanation, setShowExplanation] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  
  const [hintChatMessages, setHintChatMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [chatInput, setChatInput] = useState("");
  
  const [chatWithAI, { loading: sendingChat }] = useMutation<any, any>(CHAT_WITH_AI);

  const correctAudio = useRef<HTMLAudioElement | null>(null);
  const incorrectAudio = useRef<HTMLAudioElement | null>(null);
  const completeAudio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    correctAudio.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3");
    incorrectAudio.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3");
    completeAudio.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3");
    
    if (correctAudio.current) correctAudio.current.volume = 0.3;
    if (incorrectAudio.current) incorrectAudio.current.volume = 0.3;
    if (completeAudio.current) completeAudio.current.volume = 0.3;
  }, []);

  const { data, loading, error } = useQuery(GET_QUESTIONS, {
    variables: { courseId, lessonId },
    skip: !courseId || !lessonId
  });

  const [rewardStudent] = useMutation(REWARD_STUDENT);
  const [generateAIQuiz, { loading: generatingQuiz }] = useMutation(GENERATE_AI_QUIZ, {
    refetchQueries: [{ query: GET_QUESTIONS, variables: { courseId, lessonId } }]
  });
  const [hintForQuestion, { loading: loadingHint }] = useMutation(HINT_FOR_QUESTION);

  const questions = (data as any)?.questions || [];

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;
  if (error) return <div className="text-destructive p-4">Error loading quiz questions.</div>;
  if (questions.length === 0) {
    return (
      <div className="text-center p-12 space-y-6">
        <KidAvatar expression="normal" />
        <div>
          <h3 className="text-xl font-bold">Concept Check</h3>
          <p className="text-muted-foreground max-w-xs mx-auto">This unit doesn't have a formal assessment. You can proceed to the next module.</p>
        </div>
        <Button 
          variant="gold" 
          onClick={() => generateAIQuiz({ variables: { courseId, lessonId } })} 
          disabled={generatingQuiz}
          className="rounded-2xl h-14 px-8 text-lg shadow-gold"
        >
          {generatingQuiz ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Star className="w-5 h-5 mr-2" />}
          GENERATE AI CHALLENGE
        </Button>
        <div className="pt-4">
          <Button variant="ghost" onClick={onComplete} className="text-muted-foreground">
            Skip to Next Module <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
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
        setHintChatMessages(prev => [...prev, { role: 'assistant', content: data.chatWithAI.content }]);
      }
    } catch (err) {
      console.error("Chat error", err);
    }
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null) return;
    setIsAnswered(true);
    setShowHint(false);
    
    const isCorrect = selectedOption === currentQuestion.correctOptionIndex;
    
    if (isCorrect) {
      setScore(score + 1);
      setStreak(streak + 1);
      setXp(prev => prev + 10 + (streak > 2 ? 5 : 0));
      setExpression('happy');
      correctAudio.current?.play().catch(() => {});
      confetti({
        particleCount: 40,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#EAB308', '#FACC15', '#FFFFFF']
      });
    } else {
      setStreak(0);
      setExpression('sad');
      incorrectAudio.current?.play().catch(() => {});
    }
    // Always show explanation so students learn regardless of outcome
    setShowExplanation(true);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setShowExplanation(false);
      setShowHint(false);
      setHint(null);
      setHintChatMessages([]);
      setExpression('normal');
    } else {
      setIsFinished(true);
      setExpression('celebrating');
      completeAudio.current?.play().catch(() => {});
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 }
      });
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
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setXp(0);
    setStreak(0);
    setIsFinished(false);
    setExpression('normal');
    setShowExplanation(false);
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
              <Button variant="gold" onClick={onComplete} className="h-16 rounded-2xl text-lg font-black shadow-gold hover:scale-[1.02] transition-all">
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

      <div className="grid md:grid-cols-12 gap-8 items-start">
        <div className="md:col-span-8 space-y-6">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Question Text */}
            <div className="flex flex-col gap-4">
              <h4 className="text-lg font-bold leading-tight text-foreground">
                {currentQuestion.questionText}
              </h4>
            </div>

            <div className="grid gap-3">
              {currentQuestion.options.map((option: string, i: number) => {
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
                    className={`w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center justify-between font-bold text-lg ${stateClass}`}
                  >
                    <span>{option}</span>
                    {isAnswered && isCorrectOption && <CheckCircle2 className="w-6 h-6 fill-current" />}
                  </motion.button>
                );
              })}
            </div>

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

        <div className="md:col-span-4 sticky top-4">
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
            {showExplanation && currentQuestion.explanation && (
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
                    ? '✅ Why this is correct'
                    : '💡 Here is why the correct answer is'}
                </p>
                {selectedOption !== currentQuestion.correctOptionIndex && (
                  <p className="text-sm font-black text-green-400 mb-2">
                    ✓ {currentQuestion.options[currentQuestion.correctOptionIndex]}
                  </p>
                )}
                <p className="text-sm font-bold text-foreground leading-relaxed">
                  {currentQuestion.explanation}
                </p>
              </div>
            )}

            <div className="flex justify-end">
              <Button 
                variant="gold" 
                onClick={handleNext} 
                className="h-16 px-10 rounded-2xl text-lg font-black shadow-gold group hover:scale-[1.05] transition-all"
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
            disabled={selectedOption === null}
            className="h-14 px-8 rounded-2xl font-black shadow-gold"
          >
            CHECK ANSWER
          </Button>
        </div>
      )}
    </div>
  );
}
