/**
 * Live verification of the improved course-outline PDF export.
 * Connects to the in-container MongoDB, generates a PDF for the
 * "Build Wealth: Personal Finance & Investing in Rwanda" course (or the
 * first published course), then extracts the text and checks that no
 * markdown/HTML leaks remain.
 *
 * Run inside the backend container:
 *   npx ts-node verify_pdf.ts
 */
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { generateCoursePDF } from './src/services/course-export.service';
import { Course } from './src/models/Course';

async function main() {
  const uri = process.env.MONGO_URI || 'mongodb://mongo:27017/bootskills';
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB');

  let course: any = await Course.findOne({ title: /Build Wealth.*Personal Finance/i })
    .select('title')
    .lean();

  if (!course) {
    course = await Course.findOne({ isDeleted: { $ne: true } }).select('title').lean();
  }

  if (!course) {
    console.log('❌ No course found');
    process.exit(1);
  }

  console.log(`📚 Generating PDF for: ${course.title} (${course._id})`);
  const { filepath, filename } = await generateCoursePDF(course._id.toString());
  const abs = path.join(__dirname, filepath);
  console.log(`📄 PDF written: ${abs}`);

  // Extract text from the PDF
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pdfParseMod: any = require('pdf-parse');
  const buf = fs.readFileSync(abs);
  const PDFParseCtor = pdfParseMod.PDFParse || pdfParseMod.default?.PDFParse;
  const data = await (new PDFParseCtor({ data: buf }).getText());
  const text = data.text;

  console.log(`\n───────── EXTRACTED TEXT (first 2500 chars) ─────────`);
  console.log(text.slice(0, 2500));
  console.log(`────────────────────────────────────────────────────`);

  const leaks: string[] = [];
  const patterns: [RegExp, string][] = [
    [/<[a-z][^>]*>/i, 'HTML tags'],
    [/\[[^\]]+\]\([^)]*\)/, 'markdown links'],
    [/^#{1,6}\s/m, 'markdown headings'],
    [/\*\*[^*]+\*\*/, 'bold markers'],
    [/\*[^*\n]+\*/m, 'italic markers'],
    [/`[^`]+`/, 'inline code'],
    [/Module\s+\d+:\s*Module\s+\d+:/i, 'duplicated module prefix'],
  ];
  for (const [re, label] of patterns) {
    if (re.test(text)) leaks.push(label);
  }
  // Also check no "ASSIGNMEN\nT" style broken words in type badges
  if (/ASSIGNMEN\s*\n\s*T|ASSIGNMENT\s*\n\s*T/i.test(text)) leaks.push('broken badge word');

  console.log(leaks.length === 0 ? '\n✅ NO LEAKS — PDF text is clean' : `\n❌ LEAKS FOUND: ${leaks.join(', ')}`);

  await mongoose.disconnect();
  process.exit(leaks.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
