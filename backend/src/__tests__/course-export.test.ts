/**
 * Unit tests for the course-export service.
 * Tests PDF generation (mocked) and CSV output formatting (with mocked DB models).
 */

// ─── Mock pdfkit (must be at top level before imports) ────────────────────────
// Use vi.hoisted to ensure mock variables are available before vi.mock runs
const { mockPipe, mockFont, mockFontSize, mockFillColor, mockText, mockRect, mockMoveTo, mockLineTo, mockLineWidth, mockStroke, mockRoundedRect, mockAddPage, mockEnd, mockWriteStream, mockPDFDocument } = vi.hoisted(() => {
  const mockWriteStream = {
    on: vi.fn((event: string, cb: Function) => {
      if (event === 'finish') cb();
      return mockWriteStream;
    }),
  };

  const mockPipe = vi.fn(() => mockWriteStream);
  const mockFont = vi.fn().mockReturnThis();
  const mockFontSize = vi.fn().mockReturnThis();
  const mockFillColor = vi.fn().mockReturnThis();
  const mockText = vi.fn().mockReturnThis();
  const mockRect = vi.fn().mockReturnThis();
  const mockMoveTo = vi.fn().mockReturnThis();
  const mockLineTo = vi.fn().mockReturnThis();
  const mockLineWidth = vi.fn().mockReturnThis();
  const mockStroke = vi.fn().mockReturnThis();
  const mockRoundedRect = vi.fn().mockReturnThis();
  const mockFill = vi.fn().mockReturnThis();
  const mockAddPage = vi.fn();
  const mockEnd = vi.fn();

  const mockPDFDocument = vi.fn().mockImplementation(function () {
    return {
      pipe: mockPipe,
      font: mockFont,
      fontSize: mockFontSize,
      fillColor: mockFillColor,
      text: mockText,
      rect: mockRect,
      fill: mockFill,
      moveTo: mockMoveTo,
      lineTo: mockLineTo,
      lineWidth: mockLineWidth,
      stroke: mockStroke,
      roundedRect: mockRoundedRect,
      addPage: mockAddPage,
      end: mockEnd,
      page: { width: 595, height: 842 },
      y: 100,
    };
  });

  return { mockPipe, mockFont, mockFontSize, mockFillColor, mockText, mockRect, mockMoveTo, mockLineTo, mockLineWidth, mockStroke, mockRoundedRect, mockFill, mockAddPage, mockEnd, mockWriteStream, mockPDFDocument };
});

vi.mock('pdfkit', () => ({
  default: mockPDFDocument,
}));

vi.mock('fs', () => {
  const mockFs = {
    existsSync: vi.fn().mockReturnValue(true),
    mkdirSync: vi.fn(),
    createWriteStream: vi.fn().mockReturnValue(mockWriteStream),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    unlinkSync: vi.fn(),
    promises: { mkdir: vi.fn(), unlink: vi.fn() },
  };
  return { ...mockFs, default: mockFs };
});

// ─── Mock Mongoose models ─────────────────────────────────────────────────────
// These must be in vi.hoisted since vi.mock references them and is hoisted above module code
const { mockFind, mockLean, mockPopulate, mockFindById, mockQuery } = vi.hoisted(() => {
  const mockFind = vi.fn();
  const mockLean = vi.fn();
  const mockPopulate = vi.fn();
  const mockFindById = vi.fn();

  const mockQuery = {
    populate: mockPopulate,
    lean: mockLean,
    filter: vi.fn().mockReturnThis(),
  };

  mockLean.mockReturnThis();
  mockPopulate.mockReturnValue(mockQuery);
  mockFind.mockReturnValue(mockQuery);
  mockFindById.mockReturnValue(mockQuery);

  return { mockFind, mockLean, mockPopulate, mockFindById, mockQuery };
});

vi.mock('../models/Course', () => ({
  Course: {
    find: (...args: any[]) => mockFind(...args),
    findById: (...args: any[]) => mockFindById(...args),
  },
}));

vi.mock('../models/User', () => ({
  User: {
    find: (...args: any[]) => mockFind(...args),
  },
}));

vi.mock('../models/Internship', () => ({
  Internship: {
    find: (...args: any[]) => mockFind(...args),
  },
}));

vi.mock('../models/internship/InternshipProgram', () => ({
  InternshipProgram: {
    find: (...args: any[]) => mockFind(...args),
  },
}));

// ─── Imports ──────────────────────────────────────────────────────────────────
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateCoursePDF,
  generateUsersCSV,
  generateCoursesCSV,
  generateProgramsCSV,
  generateInternsCSV,
  generateEnrollmentsCSV,
} from '../services/course-export.service';

// ─── Test Data ────────────────────────────────────────────────────────────────
const mockCourse = {
  _id: 'course123',
  title: 'Advanced React Patterns',
  description: 'Master advanced React patterns including render props and hooks.',
  category: 'Development',
  level: 'Advanced',
  status: 'published',
  price: 49000,
  discountPrice: 39000,
  enrollmentMode: 'direct',
  school: 'Bootskills',
  instructor: { username: 'prof_smith' },
  studentsEnrolled: [
    { username: 'student1' },
    { username: 'student2' },
  ],
  modules: [
    {
      title: 'Advanced Hooks',
      description: 'Deep dive into custom hooks',
      lessons: [
        { title: 'Custom Hooks', duration: 20, type: 'video', content: 'Learn to extract custom hooks from components.' },
        { title: 'Hook Patterns Quiz', duration: 10, type: 'quiz', content: '' },
      ],
    },
  ],
  isFeatured: true,
  createdAt: new Date('2025-01-15'),
};

const mockUsers = [
  {
    username: 'alice',
    email: 'alice@example.com',
    role: 'student',
    fullName: 'Alice Johnson',
    phone: '+250700000001',
    school: 'Kingdavid',
    enrolledCourses: [{ title: 'Advanced React Patterns' }, { title: 'Python for Data Science' }],
    xp: 1200,
    level: 5,
    academicStatus: 'active',
    lastActive: new Date('2026-06-01'),
    createdAt: new Date('2025-03-01'),
  },
  {
    username: 'bob',
    email: 'bob@example.com',
    role: 'trainer',
    fullName: 'Bob Smith',
    phone: '+250700000002',
    school: '',
    enrolledCourses: [],
    xp: 3400,
    level: 12,
    academicStatus: 'active',
    lastActive: new Date('2026-06-10'),
    createdAt: new Date('2024-11-15'),
  },
];

const mockInternship = {
  userId: { fullName: 'Alice Johnson', username: 'alice', email: 'alice@example.com', phone: '+250700000001' },
  mentorId: { username: 'prof_smith' },
  title: 'Software Engineering Internship',
  stage: 'Development',
  status: 'active',
  progress: 65,
  startDate: new Date('2026-01-10'),
  endDate: new Date('2026-07-10'),
  duration: '6 months',
  createdAt: new Date('2026-01-05'),
};

const mockProgram = {
  title: 'Summer Internship 2026',
  status: 'open',
  duration: '3 months',
  price: 150000,
  currency: 'RWF',
  maxSpots: 30,
  startDate: new Date('2026-06-01'),
  endDate: new Date('2026-08-31'),
  applicationDeadline: new Date('2026-04-30'),
  createdAt: new Date('2026-02-01'),
};

// ─── Helper ───────────────────────────────────────────────────────────────────
function parseCSV(csv: string): { headers: string[]; rows: string[][] } {
  const lines = csv.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, ''));
  const rows = lines.slice(1).map(line => {
    const vals: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === ',' && !inQuotes) { vals.push(current); current = ''; continue; }
      current += ch;
    }
    vals.push(current);
    return vals.map(v => v.replace(/""/g, '"'));
  });
  return { headers, rows };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('course-export service', () => {

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ─── PDF Generation ───────────────────────────────────────────────────────
  describe('generateCoursePDF', () => {
    it('should generate a PDF file path and filename for an existing course', async () => {
      mockLean.mockResolvedValue(mockCourse);

      const result = await generateCoursePDF('course123');

      expect(result).toHaveProperty('filepath');
      expect(result).toHaveProperty('filename');
      expect(result.filename).toMatch(/\.pdf$/);
      expect(result.filename).toContain('Advanced_React_Patterns');
      expect(mockPDFDocument).toHaveBeenCalled();
    });

    it('should throw an error if course is not found', async () => {
      mockLean.mockResolvedValue(null);

      await expect(generateCoursePDF('nonexistent')).rejects.toThrow('Course not found');
    });
  });

  // ─── Users CSV ──────────────────────────────────────────────────────────
  describe('generateUsersCSV', () => {
    it('should produce correct CSV headers for users', async () => {
      mockLean.mockResolvedValue(mockUsers);

      const csv = await generateUsersCSV({});
      const { headers } = parseCSV(csv);

      expect(headers).toContain('Username');
      expect(headers).toContain('Email');
      expect(headers).toContain('Role');
      expect(headers).toContain('Enrolled Courses');
      expect(headers).toContain('XP');
    });

    it('should include all users in the CSV', async () => {
      mockLean.mockResolvedValue(mockUsers);

      const csv = await generateUsersCSV({});
      const { rows } = parseCSV(csv);

      expect(rows.length).toBe(2);
      expect(rows[0][0]).toBe('alice');
      expect(rows[1][0]).toBe('bob');
    });

    it('should list enrolled courses semi-colon separated', async () => {
      mockLean.mockResolvedValue([mockUsers[0]]);

      const csv = await generateUsersCSV({});
      const { rows } = parseCSV(csv);

      expect(rows[0][6]).toContain('Advanced React Patterns; Python for Data Science');
    });

    it('should filter by role when provided', async () => {
      mockLean.mockResolvedValue([mockUsers[1]]);

      const csv = await generateUsersCSV({ role: 'trainer' });
      const { rows } = parseCSV(csv);

      expect(rows.length).toBe(1);
      expect(rows[0][2]).toBe('trainer');
    });

    it('should handle empty user list gracefully', async () => {
      mockLean.mockResolvedValue([]);

      const csv = await generateUsersCSV({});
      const { headers, rows } = parseCSV(csv);

      expect(headers.length).toBeGreaterThan(0);
      expect(rows.length).toBe(0);
    });

    it('should properly escape commas and quotes in user data', async () => {
      mockLean.mockResolvedValue([{
        username: 'test_user',
        email: 'test@example.com',
        role: 'student',
        fullName: 'Test, User Jr.',
        phone: '',
        school: '',
        enrolledCourses: [],
        xp: 0,
        level: 1,
        academicStatus: 'active',
        lastActive: null,
        createdAt: null,
      }]);

      const csv = await generateUsersCSV({});
      const { rows } = parseCSV(csv);

      expect(rows[0][3]).toBe('Test, User Jr.'); // Name with comma should be properly handled
    });
  });

  // ─── Courses CSV ─────────────────────────────────────────────────────────
  describe('generateCoursesCSV', () => {
    it('should produce correct CSV headers for courses', async () => {
      mockLean.mockResolvedValue([mockCourse]);

      const csv = await generateCoursesCSV();
      const { headers } = parseCSV(csv);

      expect(headers).toContain('Title');
      expect(headers).toContain('Category');
      expect(headers).toContain('Price');
      expect(headers).toContain('Students Enrolled');
      expect(headers).toContain('Total Lessons');
    });

    it('should include course details in the CSV', async () => {
      mockLean.mockResolvedValue([mockCourse]);

      const csv = await generateCoursesCSV();
      const { rows } = parseCSV(csv);

      expect(rows.length).toBe(1);
      expect(rows[0][0]).toBe('Advanced React Patterns');
      expect(rows[0][1]).toBe('Development');
      expect(rows[0][9]).toBe('2'); // students enrolled count
      expect(rows[0][8]).toBe('2'); // total lessons (1 module × 2 lessons)
    });

    it('should filter by instructor when createdBy is provided', async () => {
      mockLean.mockResolvedValue([mockCourse]);

      const csv = await generateCoursesCSV('prof_smith');
      const { rows } = parseCSV(csv);

      expect(rows.length).toBe(1);
    });
  });

  // ─── Programs CSV ────────────────────────────────────────────────────────
  describe('generateProgramsCSV', () => {
    it('should produce internship program CSV with correct data', async () => {
      mockLean.mockResolvedValue([mockProgram]);

      const csv = await generateProgramsCSV();
      const { headers, rows } = parseCSV(csv);

      expect(headers).toContain('Title');
      expect(headers).toContain('Price');
      expect(headers).toContain('Max Spots');
      expect(rows.length).toBe(1);
      expect(rows[0][0]).toBe('Summer Internship 2026');
      expect(rows[0][5]).toBe('30');
    });
  });

  // ─── Interns CSV ─────────────────────────────────────────────────────────
  describe('generateInternsCSV', () => {
    it('should produce intern participants CSV with user and mentor info', async () => {
      mockLean.mockResolvedValue([mockInternship]);

      const csv = await generateInternsCSV();
      const { headers, rows } = parseCSV(csv);

      expect(headers).toContain('Intern Name');
      expect(headers).toContain('Mentor');
      expect(rows.length).toBe(1);
      expect(rows[0][0]).toBe('Alice Johnson');
      expect(rows[0][7]).toBe('prof_smith');
      expect(rows[0][4]).toBe('Development');
      expect(rows[0][5]).toBe('active');
      expect(rows[0][6]).toBe('65');
    });
  });

  // ─── Enrollments CSV ─────────────────────────────────────────────────────
  describe('generateEnrollmentsCSV', () => {
    it('should produce enrollment CSV with student details per course', async () => {
      mockLean.mockResolvedValue([mockCourse]);

      const csv = await generateEnrollmentsCSV();
      const { headers, rows } = parseCSV(csv);

      expect(headers).toContain('Course Title');
      expect(headers).toContain('Student Name');
      expect(headers).toContain('Student Email');
      expect(rows.length).toBe(2); // 2 students enrolled
      expect(rows[0][0]).toBe('Advanced React Patterns');
      expect(rows[0][1]).toBe('student1');
    });

    it('should filter by courseId when provided', async () => {
      const course1 = { ...mockCourse };
      const course2 = {
        ...mockCourse,
        _id: 'course456',
        title: 'Python for Data Science',
        studentsEnrolled: [],
      };
      mockLean.mockResolvedValue([course1, course2]);

      const csv = await generateEnrollmentsCSV('course123');
      const { rows } = parseCSV(csv);

      rows.forEach(r => {
        expect(r[0]).toBe('Advanced React Patterns');
      });
    });

    it('should return headers only when no enrollments exist', async () => {
      mockLean.mockResolvedValue([]);

      const csv = await generateEnrollmentsCSV();
      const { headers, rows } = parseCSV(csv);

      expect(headers.length).toBeGreaterThan(0);
      expect(rows.length).toBe(0);
    });
  });

  // ─── CSV Formatting ──────────────────────────────────────────────────────
  describe('CSV formatting', () => {
    it('should quote fields containing commas', async () => {
      mockLean.mockResolvedValue([{
        ...mockUsers[0],
        fullName: 'Alice, Johnson PhD',
      }]);

      const csv = await generateUsersCSV({});
      expect(csv).toContain('"Alice, Johnson PhD"');
    });

    it('should escape double quotes within values', async () => {
      mockLean.mockResolvedValue([{
        ...mockUsers[0],
        fullName: 'Alice "Ace" Johnson',
      }]);

      const csv = await generateUsersCSV({});
      expect(csv).toContain('"Alice ""Ace"" Johnson"');
    });

    it('should handle empty optional fields gracefully', async () => {
      mockLean.mockResolvedValue([{
        username: 'minimal',
        email: '',
        role: '',
        fullName: '',
        phone: '',
        school: '',
        enrolledCourses: [],
        xp: 0,
        level: 0,
        academicStatus: '',
        lastActive: null,
        createdAt: null,
      }]);

      const csv = await generateUsersCSV({});
      const { rows } = parseCSV(csv);
      expect(rows.length).toBe(1);
      expect(rows[0].length).toBe(12);
    });
  });
});
