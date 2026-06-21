/**
 * Parses structured text into a course object with modules and lessons.
 *
 * Expected document format (markdown-style):
 *
 * # Course Title: Master React
 * # Description: Learn React from scratch
 * # Category: Development
 * # Level: Beginner
 *
 * ## Module 1: Getting Started
 * Description: Setup and basics
 *
 * ### Lesson 1: Introduction
 * Duration: 10
 * Type: video
 * Content: Welcome to the course!
 *
 * ### Lesson 2: Setup
 * Duration: 15
 * Type: video
 *
 * ## Module 2: Advanced Components
 * Description: Deep dive into components
 *
 * ### Lesson 1: Props & State
 * Duration: 20
 * Type: video
 */

export interface ParsedCourse {
  title: string;
  description: string;
  category: string;
  level: string;
  modules: ParsedModule[];
  errors: string[];
}

export interface ParsedModule {
  title: string;
  description: string;
  lessons: ParsedLesson[];
}

export interface ParsedLesson {
  title: string;
  duration: number;
  type: string;
  content: string;
  videoUrl: string;
  fileUrl: string;
}

/**
 * Extract text content from a file buffer based on mimetype.
 * Now supports: PDF, DOCX, TXT, RTF, and images (via OCR with tesseract.js)
 */
export async function extractTextFromFile(
  buffer: Buffer,
  mimetype: string
): Promise<string> {
  const ext = mimetype.toLowerCase();

  if (ext.includes('pdf')) {
    return extractTextFromPDF(buffer);
  } else if (
    ext.includes('docx') ||
    ext.includes('officedocument.wordprocessingml')
  ) {
    return extractTextFromDOCX(buffer);
  } else if (
    ext.includes('text') ||
    ext.includes('plain') ||
    ext.endsWith('.txt')
  ) {
    return buffer.toString('utf-8');
  } else if (ext.includes('rtf')) {
    // RTF - extract text content roughly
    const text = buffer.toString('utf-8');
    // Strip RTF control sequences
    return text.replace(/\\[a-z]+[-0-9]*|\\'[0-9a-f]{2}|\\\{|\\}|\\\n|[{}]/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  } else if (
    ext.includes('image') ||
    ext.includes('jpg') ||
    ext.includes('jpeg') ||
    ext.includes('png') ||
    ext.includes('webp')
  ) {
    return extractTextFromImage(buffer);
  } else {
    // Fallback: try plain text extraction
    return buffer.toString('utf-8');
  }
}

/**
 * Extract text from an image using tesseract.js OCR
 */
async function extractTextFromImage(buffer: Buffer): Promise<string> {
  try {
    const Tesseract = require('tesseract.js');
    const { data } = await Tesseract.recognize(buffer, 'eng', {
      logger: (m: any) => {
        if (m.status === 'recognizing text') {
          // progress logging available if needed
        }
      },
    });
    if (!data || !data.text) {
      throw new Error('No text could be extracted from the image');
    }
    return data.text;
  } catch (err) {
    console.error('Image OCR text extraction error:', err);
    throw new Error('OCR failed: ' + (err as Error).message);
  }
}

/**
 * Fetch and extract text from a Google Doc by document ID.
 * Uses googleapis to access the document via its public sharing or a service account.
 */
export async function extractTextFromGoogleDoc(documentId: string): Promise<string> {
  try {
    const { google } = require('googleapis');
    
    // Try with API key first (for publicly shared docs)
    const apiKey = process.env.GOOGLE_API_KEY;
    
    let docs: any;
    
    if (apiKey) {
      docs = google.docs({ version: 'v1', auth: apiKey });
    } else {
      // Fallback: try without auth (for fully public docs)
      docs = google.docs({ version: 'v1' });
    }

    const response = await docs.documents.get({ documentId });
    const doc = response.data;

    if (!doc || !doc.body || !doc.body.content) {
      throw new Error('Google Doc has no content or is not accessible');
    }

    // Extract plain text from the document's structured content
    let plainText = '';
    const content = doc.body.content;

    const extractFromElements = function(elements: any[]) {
      if (!elements) return;
      for (const element of elements) {
        if (element.paragraph) {
          const paraElements = element.paragraph.elements;
          if (paraElements) {
            for (const el of paraElements) {
              if (el.textRun && el.textRun.content) {
                plainText += el.textRun.content;
              }
            }
          }
          // Add newline after paragraph
          const paraStyle = element.paragraph.paragraphStyle;
          if (paraStyle && paraStyle.namedStyleType === 'TITLE') {
            plainText += '\n';
          } else if (paraStyle && paraStyle.namedStyleType === 'HEADING_1') {
            plainText += '\n';
          } else {
            plainText += '\n';
          }
        } else if (element.table) {
          // Extract text from table cells
          if (element.table.tableRows) {
            for (const row of element.table.tableRows) {
              if (row.tableCells) {
                for (const cell of row.tableCells) {
                  if (cell.content) {
                    extractFromElements(cell.content);
                  }
                }
              }
            }
          }
        }
      }
    }

    extractFromElements(content);

    if (!plainText.trim()) {
      throw new Error('No text content could be extracted from the Google Doc');
    }

    return plainText.trim();
  } catch (err: any) {
    console.error('Google Docs extraction error:', err);
    // Provide user-friendly error
    if (err.message?.includes('PERMISSION_DENIED') || err.code === 403) {
      throw new Error('Google Doc is not publicly accessible. Make sure the doc is shared with "Anyone with the link" as Viewer, or configure a GOOGLE_API_KEY in your .env');
    }
    if (err.code === 404) {
      throw new Error('Google Doc not found. Check the document ID or URL.');
    }
    throw new Error('Failed to fetch Google Doc: ' + (err as Error).message);
  }
}

/**
 * Parse a Google Doc URL to extract the document ID
 */
export function parseGoogleDocUrl(url: string): string | null {
  // Pattern: https://docs.google.com/document/d/DOCUMENT_ID/edit
  const patterns = [
    /\/document\/d\/([a-zA-Z0-9_-]+)/,
    /^(?:https?:\/\/)?docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/,
    /^([a-zA-Z0-9_-]{25,})$/, // raw document ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Extract text from PDF using pdf-parse
 */
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const pdfParse = require('pdf-parse');
    // pdf-parse v3+ exports PDFParse as a named export
    const parseFn = pdfParse.PDFParse || pdfParse.default || pdfParse;
    const data = typeof parseFn === 'function' 
      ? await parseFn(buffer)
      : await pdfParse(buffer);
    return data.text || '';
  } catch (err) {
    console.error('PDF text extraction error:', err);
    throw new Error('Failed to extract text from PDF: ' + (err as Error).message);
  }
}

/**
 * Extract text from DOCX using mammoth
 */
async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  try {
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  } catch (err) {
    console.error('DOCX text extraction error:', err);
    throw new Error('Failed to extract text from DOCX: ' + (err as Error).message);
  }
}

/**
 * Parse structured text into a course object
 */
export function parseCourseText(text: string): ParsedCourse {
  const errors: string[] = [];
  const lines = text.split('\n');

  let title = '';
  let description = '';
  let category = 'Development';
  let level = 'Beginner';
  const modules: ParsedModule[] = [];

  let currentModule: ParsedModule | null = null;
  let currentLesson: ParsedLesson | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Course-level fields: # Course Title: X or Course Title: X (without #)
    const titleMatch = line.match(/^#?\s*Course\s*Title\s*:\s*(.+)$/i);
    if (titleMatch) {
      title = titleMatch[1].trim();
      continue;
    }

    const descMatch = line.match(/^#?\s*Description\s*:\s*(.+)$/i);
    if (descMatch) {
      description = descMatch[1].trim();
      continue;
    }

    const catMatch = line.match(/^#?\s*Category\s*:\s*(.+)$/i);
    if (catMatch) {
      category = catMatch[1].trim();
      continue;
    }

    const levelMatch = line.match(/^#?\s*Level\s*:\s*(.+)$/i);
    if (levelMatch) {
      level = levelMatch[1].trim();
      continue;
    }

    // Module: ## Module [N]: Title OR plain "Module N: Title" (for DOCX extraction)
    const moduleMatch: RegExpMatchArray | null = line.match(/^##(?!#)\s*(?:Module\s*\d*\s*[:.]?\s*)?(.+)$/i) ||
                        (!currentLesson && line.match(/^Module\s+\d+\s*[:.]\s*(.+)$/i)) as RegExpMatchArray | null;
    if (moduleMatch) {
      // Save current module
      if (currentModule && currentLesson) {
        currentModule.lessons.push(currentLesson);
        currentLesson = null;
      }
      if (currentModule) {
        modules.push(currentModule);
      }

      const moduleTitle: string = moduleMatch[1].trim();
      currentModule = {
        title: moduleTitle,
        description: '',
        lessons: [],
      };

      // Check if next line contains description
      let j = i + 1;
      while (j < lines.length && !lines[j].trim()) j++;
      if (j < lines.length) {
        const nextLine = lines[j].trim();
        const modDescMatch = nextLine.match(/^Description\s*:\s*(.+)$/i);
        if (modDescMatch) {
          currentModule.description = modDescMatch[1].trim();
          i = j; // skip the description line
        }
      }
      continue;
    }

    // Module description standalone line
    const modDescLine = line.match(/^Description\s*:\s*(.+)$/i);
    if (modDescLine && currentModule && !currentLesson) {
      currentModule.description = modDescLine[1].trim();
      continue;
    }

    // Lesson: ### Lesson [N]: Title OR plain "Lesson N: Title" (for DOCX extraction)
    const lessonMatch: RegExpMatchArray | null = line.match(/^###\s*(?:Lesson\s*\d*\s*[:.]?\s*)?(.+)$/i) ||
                         (currentModule && line.match(/^Lesson\s+\d+\s*[:.]\s*(.+)$/i)) as RegExpMatchArray | null;
    if (lessonMatch) {
      // Save previous lesson
      if (currentModule && currentLesson) {
        currentModule.lessons.push(currentLesson);
      }

      const lessonTitle: string = lessonMatch[1].trim();
      currentLesson = {
        title: lessonTitle,
        duration: 10,
        type: 'video',
        content: '',
        videoUrl: '',
        fileUrl: '',
      };
      continue;
    }

    // Lesson-level fields
    if (currentLesson) {
      const durMatch = line.match(/^Duration\s*:\s*(\d+)/i);
      if (durMatch) {
        currentLesson.duration = parseInt(durMatch[1], 10) || 10;
        continue;
      }

      const typeMatch = line.match(/^Type\s*:\s*(.+)$/i);
      if (typeMatch) {
        const t = typeMatch[1].trim().toLowerCase();
        const validTypes = ['video', 'pdf', 'ppt', 'book', 'article', 'quiz', 'assignment'];
        currentLesson.type = validTypes.includes(t) ? t : 'video';
        continue;
      }

      const contentMatch = line.match(/^Content\s*:\s*(.+)$/i);
      if (contentMatch) {
        currentLesson.content = contentMatch[1].trim();
        continue;
      }

      const videoMatch = line.match(/^Video\s*(?:URL|Url|url)\s*:\s*(.+)$/i);
      if (videoMatch) {
        currentLesson.videoUrl = videoMatch[1].trim();
        continue;
      }

      const fileMatch = line.match(/^File\s*(?:URL|Url|url)\s*:\s*(.+)$/i);
      if (fileMatch) {
        currentLesson.fileUrl = fileMatch[1].trim();
        continue;
      }
    }
  }

  // Flush last lesson and module
  if (currentModule && currentLesson) {
    currentModule.lessons.push(currentLesson);
  }
  if (currentModule) {
    modules.push(currentModule);
  }

  // Validation
  if (!title) {
    errors.push('Course title is missing. Add "# Course Title: Your Title" at the top of your document.');
  }
  if (!description) {
    errors.push('Course description is missing. Add "# Description: Your description" to your document.');
  }
  if (modules.length === 0) {
    errors.push('No modules found. Use "## Module 1: Title" to define modules and "### Lesson 1: Title" for lessons.');
  }

  return {
    title,
    description,
    category,
    level,
    modules,
    errors,
  };
}

/**
 * Generate a sample template text that users can download and fill in
 */
export function generateCourseTemplate(): string {
  return `# Course Title: Your Course Name Here
# Description: A compelling description of what students will learn in this course. Keep it clear and engaging.
# Category: Development
# Level: Beginner

## Module 1: Getting Started
Description: An overview of what this module covers

### Lesson 1: Welcome & Introduction
Duration: 5
Type: video
Content: A brief welcome message and overview of what students will learn.

### Lesson 2: Setting Up Your Environment
Duration: 15
Type: video
Content: Step-by-step guide to setting up the tools needed for this course.

## Module 2: Core Concepts
Description: The fundamental concepts that form the foundation of this course

### Lesson 1: Understanding the Basics
Duration: 20
Type: video
Content: Deep dive into the core concepts with practical examples and explanations.

### Lesson 2: First Practical Exercise
Duration: 30
Type: assignment
Content: Apply what you've learned in this hands-on exercise.

## Module 3: Advanced Topics
Description: Take your skills to the next level with these advanced concepts

### Lesson 1: Advanced Techniques
Duration: 25
Type: video
Content: Learn advanced techniques used by professionals in the field.

### Lesson 2: Knowledge Check
Duration: 10
Type: quiz
Content: Test your understanding with this quiz.

---

📋 FORMAT GUIDE:
- Each course needs: Title, Description, Category, Level
- Each module starts with "## Module [N]: Title"
- Each lesson starts with "### Lesson [N]: Title"
- Lesson fields: Duration (minutes), Type (video/pdf/ppt/book/article/quiz/assignment), Content, Video URL, File URL
- Optional fields can be omitted

💡 TIP: You can paste this template into a .txt file, edit it, then upload it here!
`;
}


