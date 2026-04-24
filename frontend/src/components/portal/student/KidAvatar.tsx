import { motion, AnimatePresence } from "framer-motion";

export type AvatarExpression = 'happy' | 'sad' | 'thinking' | 'celebrating' | 'normal';

interface KidAvatarProps {
  expression: AvatarExpression;
}

export function KidAvatar({ expression }: KidAvatarProps) {
  const getAvatar = () => {
    switch (expression) {
      case 'happy':
        return { emoji: "😊", color: "bg-green-500", text: "Nice! You got it! 🎉" };
      case 'sad':
        return { emoji: "😅", color: "bg-orange-400", text: "Almost there! Try again 💪" };
      case 'celebrating':
        return { emoji: "🥳", color: "bg-yellow-400", text: "WOW! You're a Superstar! 🏆" };
      case 'thinking':
        return { emoji: "🤔", color: "bg-blue-400", text: "Let's think about this..." };
      default:
        return { emoji: "🐱", color: "bg-accent", text: "Ready for the next one?" };
    }
  };

  const { emoji, color, text } = getAvatar();

  return (
    <div className="flex flex-col items-center gap-4">
      <motion.div
        key={expression}
        initial={{ scale: 0.5, rotate: -20 }}
        animate={{ 
          scale: 1, 
          rotate: 0,
          y: [0, -5, 0]
        }}
        transition={{
          y: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }
        }}
        className={`w-28 h-28 ${color} rounded-[2rem] flex items-center justify-center text-6xl shadow-xl border-4 border-white relative overflow-hidden`}
      >
        <div className="absolute inset-0 bg-white/20 animate-pulse pointer-events-none" />
        <span className="relative z-10">{emoji}</span>
      </motion.div>
      <AnimatePresence mode="wait">
        <motion.div
          key={text}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="relative"
        >
          <div className="bg-white dark:bg-zinc-900 px-6 py-3 rounded-2xl border-2 border-border shadow-xl text-center">
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-zinc-900 rotate-45 border-l-2 border-t-2 border-border" />
            <p className="text-sm font-black text-foreground uppercase tracking-tight">
              {text}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
