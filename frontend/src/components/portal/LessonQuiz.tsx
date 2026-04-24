import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_QUESTIONS } from "@/lib/graphql/queries";
import { REWARD_STUDENT, GENERATE_AI_QUIZ } from "@/lib/graphql/mutations";
import { CheckCircle2, ChevronRight, RefreshCcw, Loader2, HelpCircle, Star, Flame, Trophy } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { KidAvatar, AvatarExpression } from "./student/KidAvatar";

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

  const correctAudio = useRef<HTMLAudioElement | null>(null);
  const incorrectAudio = useRef<HTMLAudioElement | null>(null);
  const completeAudio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    correctAudio.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3");
    incorrectAudio.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3");
    completeAudio.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3");
    
    // Low volume for sounds
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

  const handleSubmitAnswer = () => {
    if (selectedOption === null) return;
    setIsAnswered(true);
    
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
      setShowExplanation(true);
      incorrectAudio.current?.play().catch(() => {});
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setShowExplanation(false);
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
      // Persist Rewards
      rewardStudent({
        variables: {
          xp: xp,
          streak: streak
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
            <h4 className="text-2xl font-bold leading-tight text-foreground">
              {currentQuestion.questionText}
            </h4>

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
              <div className="p-6 bg-accent/5 rounded-3xl border-2 border-accent/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                  <HelpCircle className="w-12 h-12" />
                </div>
                <p className="text-[10px] font-black uppercase text-accent tracking-[0.2em] mb-2">Did you know? 🧠</p>
                <p className="text-sm font-bold text-foreground leading-relaxed">
                  {currentQuestion.explanation.replace(/^[Pp]hotosynthesis/, "🌱 Photosynthesis")}
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
