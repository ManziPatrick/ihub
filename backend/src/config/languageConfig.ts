// ─── Language Configurations ───────────────────────────────────────────────
// ⚠️  IMPORTANT: When adding, removing, or renaming a language you MUST
//     update BOTH this file AND frontend/src/shared/languageConfig.ts
//     with the exact same keys in LANGUAGE_NAMES, LANGUAGE_COLORS, and
//     DEFAULT_INITIAL_CODE.
//
//     Run `node scripts/check-language-config-sync.js` to verify.
//
//     When adding a new language, update ALL maps below.

// Judge0 Language IDs for remote execution (non-JS/TS languages)
export const JUDGE0_LANGUAGE_IDS: Record<string, number> = {
  python: 100,        // Python (3.12.5)
  c: 103,             // C (GCC 14.1.0)
  cpp: 105,           // C++ (GCC 14.1.0)
  java: 91,           // Java (JDK 17.0.6)
  go: 106,            // Go (1.22.0)
  rust: 108,          // Rust (1.85.0)
  ruby: 72,           // Ruby (2.7.0)
  php: 98,            // PHP (8.3.11)
  swift: 83,          // Swift (5.2.3)
  kotlin: 111,        // Kotlin (2.1.10)
  dart: 90,           // Dart (2.19.2)
  csharp: 51,         // C# (Mono 6.6.0.161)
  bash: 46,           // Bash (5.0.0)
  r: 99,              // R (4.4.1)
  scala: 112,         // Scala (3.4.2)
  perl: 85,           // Perl (5.28.1)
  haskell: 61,        // Haskell (GHC 8.8.1)
  lua: 64,            // Lua (5.3.5)
  sql: 82,            // SQL (SQLite 3.27.2)
  assembly: 45,       // Assembly (NASM 2.14.02)
  pascal: 67,         // Pascal (FPC 3.0.4)
  fortran: 59,        // Fortran (GFortran 9.2.0)
  cobol: 77,          // COBOL (GnuCOBOL 2.2)
};

// Human-readable language names
export const LANGUAGE_NAMES: Record<string, string> = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python: 'Python',
  html: 'HTML/CSS',
  css: 'CSS',
  c: 'C',
  cpp: 'C++',
  java: 'Java',
  go: 'Go',
  rust: 'Rust',
  ruby: 'Ruby',
  php: 'PHP',
  swift: 'Swift',
  kotlin: 'Kotlin',
  dart: 'Dart',
  csharp: 'C#',
  bash: 'Bash',
  r: 'R',
  scala: 'Scala',
  perl: 'Perl',
  haskell: 'Haskell',
  lua: 'Lua',
  sql: 'SQL',
  assembly: 'Assembly',
  pascal: 'Pascal',
  fortran: 'Fortran',
  cobol: 'COBOL',
};

// Tailwind color classes for language badges
export const LANGUAGE_COLORS: Record<string, string> = {
  javascript: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  typescript: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  python: 'text-green-400 bg-green-400/10 border-green-400/30',
  html: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
  css: 'text-sky-400 bg-sky-400/10 border-sky-400/30',
  c: 'text-blue-500 bg-blue-500/10 border-blue-500/30',
  cpp: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30',
  java: 'text-red-500 bg-red-500/10 border-red-500/30',
  go: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30',
  rust: 'text-orange-500 bg-orange-500/10 border-orange-500/30',
  ruby: 'text-red-400 bg-red-400/10 border-red-400/30',
  php: 'text-purple-500 bg-purple-500/10 border-purple-500/30',
  swift: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
  kotlin: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
  dart: 'text-sky-400 bg-sky-400/10 border-sky-400/30',
  csharp: 'text-green-500 bg-green-500/10 border-green-500/30',
  bash: 'text-lime-400 bg-lime-400/10 border-lime-400/30',
  r: 'text-blue-300 bg-blue-300/10 border-blue-300/30',
  scala: 'text-red-600 bg-red-600/10 border-red-600/30',
  perl: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/30',
  haskell: 'text-purple-600 bg-purple-600/10 border-purple-600/30',
  lua: 'text-blue-600 bg-blue-600/10 border-blue-600/30',
  sql: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30',
  assembly: 'text-gray-400 bg-gray-400/10 border-gray-400/30',
  pascal: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  fortran: 'text-teal-400 bg-teal-400/10 border-teal-400/30',
  cobol: 'text-rose-400 bg-rose-400/10 border-rose-400/30',
};

// Default starter code templates for each language
export const DEFAULT_INITIAL_CODE: Record<string, string> = {
  javascript: '// Write your code here\n',
  typescript: '// Write your TypeScript code here\n',
  python: '# Write your code here\n',
  html: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Page</title>\n</head>\n<body>\n  <h1>Hello, World!</h1>\n</body>\n</html>\n',
  css: '/* Write your CSS here */\n',
  c: '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}\n',
  cpp: '#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}\n',
  java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}\n',
  go: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}\n',
  rust: 'fn main() {\n    println!("Hello, World!");\n}\n',
  ruby: '# Write your Ruby code here\nputs "Hello, World!"\n',
  php: '<?php\necho "Hello, World!\\n";\n',
  swift: 'print("Hello, World!")\n',
  kotlin: 'fun main() {\n    println("Hello, World!")\n}\n',
  dart: 'void main() {\n    print("Hello, World!");\n}\n',
  csharp: 'using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, World!");\n    }\n}\n',
  bash: '#!/bin/bash\necho "Hello, World!"\n',
  r: '# Write your R code here\ncat("Hello, World!\\n")\n',
  scala: 'object Main extends App {\n    println("Hello, World!")\n}\n',
  perl: '#!/usr/bin/perl\nprint "Hello, World!\\n";\n',
  haskell: 'main = putStrLn "Hello, World!"\n',
  lua: '-- Write your Lua code here\nprint("Hello, World!")\n',
  sql: '-- Write your SQL query here\nSELECT "Hello, World!" AS greeting;\n',
  assembly: 'section .data\n    msg db \'Hello, World!\',0xa\n    len equ $ - msg\n\nsection .text\n    global _start\n\n_start:\n    mov eax, 4\n    mov ebx, 1\n    mov ecx, msg\n    mov edx, len\n    int 0x80\n\n    mov eax, 1\n    xor ebx, ebx\n    int 0x80\n',
  pascal: 'program Hello;\nbegin\n    writeln(\'Hello, World!\');\nend.\n',
  fortran: 'program hello\n    print *, "Hello, World!"\nend program hello\n',
  cobol: '       IDENTIFICATION DIVISION.\n       PROGRAM-ID. HELLO.\n       PROCEDURE DIVISION.\n           DISPLAY "Hello, World!"\n           STOP RUN.\n',
};

// All supported language keys (used for Mongoose enum validation)
export const ALL_LANGUAGES = Object.keys(LANGUAGE_NAMES);
