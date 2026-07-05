import { describe, it, expect } from 'vitest';
import { parseCourseText } from '../services/course-parser.service';

const sampleText = `
# Course Title: Master React & Node.js
# Description: Learn full-stack development with React and Node.js from scratch. Build real-world applications.
# Category: Development
# Level: Intermediate

## Module 1: React Fundamentals
Description: Learn the core concepts of React

### Lesson 1: Introduction to React
Duration: 15
Type: video
Content: React is a JavaScript library for building user interfaces.

### Lesson 2: Components & Props
Duration: 20
Type: video
Content: Understanding components and props in React.

### Lesson 3: State Management Quiz
Duration: 10
Type: quiz

## Module 2: Node.js Backend
Description: Build REST APIs with Node.js

### Lesson 1: Setting Up Express
Duration: 25
Type: video

### Lesson 2: Database Integration
Duration: 30
Type: assignment
Content: Connect your app to MongoDB and perform CRUD operations.
`;

describe('Course Parser', () => {
  const result = parseCourseText(sampleText);

  describe('Basic Fields', () => {
    it('should parse the title correctly', () => {
      expect(result.title).toBe('Master React & Node.js');
    });

    it('should parse the description correctly', () => {
      expect(result.description).toContain('Learn full-stack');
    });

    it('should parse the category correctly', () => {
      expect(result.category).toBe('Development');
    });

    it('should parse the level correctly', () => {
      expect(result.level).toBe('Intermediate');
    });

    it('should have no errors', () => {
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Module Parsing', () => {
    it('should parse 2 modules', () => {
      expect(result.modules).toHaveLength(2);
    });

    it('should parse Module 1 title correctly', () => {
      expect(result.modules[0].title).toBe('React Fundamentals');
    });

    it('should parse Module 1 description correctly', () => {
      expect(result.modules[0].description).toBe('Learn the core concepts of React');
    });

    it('should parse Module 2 title correctly', () => {
      expect(result.modules[1].title).toBe('Node.js Backend');
    });
  });

  describe('Lesson Parsing - Module 1', () => {
    it('should parse 3 lessons in Module 1', () => {
      expect(result.modules[0].lessons).toHaveLength(3);
    });

    it('should parse Lesson 1.1 correctly', () => {
      const lesson = result.modules[0].lessons[0];
      expect(lesson.title).toBe('Introduction to React');
      expect(lesson.duration).toBe(15);
      expect(lesson.type).toBe('video');
      expect(lesson.content).toContain('JavaScript library');
    });

    it('should parse Lesson 1.2 title correctly', () => {
      expect(result.modules[0].lessons[1].title).toBe('Components & Props');
    });

    it('should parse Lesson 1.3 as quiz', () => {
      const lesson = result.modules[0].lessons[2];
      expect(lesson.title).toBe('State Management Quiz');
      expect(lesson.type).toBe('quiz');
    });
  });

  describe('Lesson Parsing - Module 2', () => {
    it('should parse 2 lessons in Module 2', () => {
      expect(result.modules[1].lessons).toHaveLength(2);
    });

    it('should parse Lesson 2.1 correctly', () => {
      const lesson = result.modules[1].lessons[0];
      expect(lesson.title).toBe('Setting Up Express');
      expect(lesson.type).toBe('video');
    });

    it('should parse Lesson 2.2 as assignment with content', () => {
      const lesson = result.modules[1].lessons[1];
      expect(lesson.title).toBe('Database Integration');
      expect(lesson.type).toBe('assignment');
      expect(lesson.content).toContain('MongoDB');
    });
  });
});
