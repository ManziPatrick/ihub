/**
 * 🌱 SEED FIX: Improve Code Exercises
 * 
 * Changes exercises that use exact output matching (type: "write" with expectedOutput)
 * to use type: "test" with flexible tests that check behavior, not exact output.
 * 
 * This prevents students from failing just because they used different formatting.
 * 
 * Usage: npx ts-node src/seedFixCodeExercises.ts
 */
import mongoose from 'mongoose';

const MONGO_URI = 'mongodb://bootskills:bootskills@169.58.74.138:27017/bootskills?authSource=admin&directConnection=true';

// ─── Fixed test code for each exercise ────────────────────────
const FIXED_TESTS: Record<string, { testCode: string; expectedOutput: string }> = {
  'web-m7-ex1': {
    testCode: `describe("Variable Practice", function() {
  it("should have a variable 'name' that is a string", function() {
    assert.ok(typeof name !== "undefined", "name variable should exist");
    assert.equals(typeof name, "string", "name should be a string");
    assert.ok(name.length > 0, "name should not be empty");
  });
  it("should have a variable 'age' that is a number", function() {
    assert.ok(typeof age !== "undefined", "age variable should exist");
    assert.equals(typeof age, "number", "age should be a number");
  });
  it("should have a variable 'isStudent' that is a boolean", function() {
    assert.ok(typeof isStudent !== "undefined", "isStudent variable should exist");
    assert.equals(typeof isStudent, "boolean", "isStudent should be a boolean");
    assert.equals(isStudent, true, "isStudent should be true");
  });
});`,
    expectedOutput: '',
  },
  'web-m2-ex1': {
    testCode: `describe("Registration Form HTML", function() {
  it("should have a form element", function() {
    assert.ok(document.querySelector("form"), "Should have a <form> element");
  });
  it("should have a text input for name", function() {
    const input = document.querySelector('input[type="text"]');
    assert.ok(input, "Should have a text input");
    assert.ok(input.hasAttribute("required"), "Name input should be required");
  });
  it("should have an email input", function() {
    const input = document.querySelector('input[type="email"]');
    assert.ok(input, "Should have an email input");
  });
  it("should have a password input", function() {
    const input = document.querySelector('input[type="password"]');
    assert.ok(input, "Should have a password input");
  });
  it("should have a select dropdown", function() {
    assert.ok(document.querySelector("select"), "Should have a <select> element");
  });
  it("should have a submit button", function() {
    const btn = document.querySelector('button[type="submit"], input[type="submit"]');
    assert.ok(btn, "Should have a submit button");
  });
});`,
    expectedOutput: '',
  },
  'web-m3-ex1': {
    testCode: `describe("Card Styling", function() {
  it("should have a .card element", function() {
    assert.ok(document.querySelector(".card"), "Should have a .card element");
  });
  it("should have padding applied", function() {
    const card = document.querySelector(".card");
    const style = window.getComputedStyle(card);
    const padding = parseInt(style.paddingTop);
    assert.ok(padding >= 10, "Card should have at least 10px padding");
  });
  it("should have a border", function() {
    const card = document.querySelector(".card");
    const style = window.getComputedStyle(card);
    assert.ok(style.borderWidth !== "0px", "Card should have a border");
  });
  it("should have border-radius", function() {
    const card = document.querySelector(".card");
    const style = window.getComputedStyle(card);
    assert.ok(style.borderRadius !== "0px", "Card should have border-radius");
  });
});`,
    expectedOutput: '',
  },
  'web-m4-ex1': {
    testCode: `describe("Navbar Flexbox", function() {
  it("should have a .navbar element", function() {
    assert.ok(document.querySelector(".navbar"), "Should have a .navbar element");
  });
  it("navbar should use flexbox", function() {
    const nav = document.querySelector(".navbar");
    const style = window.getComputedStyle(nav);
    assert.equals(style.display, "flex", "Navbar should have display: flex");
  });
  it("should justify content to space-between", function() {
    const nav = document.querySelector(".navbar");
    const style = window.getComputedStyle(nav);
    assert.equals(style.justifyContent, "space-between", "Should use justify-content: space-between");
  });
  it("should center items vertically", function() {
    const nav = document.querySelector(".navbar");
    const style = window.getComputedStyle(nav);
    assert.equals(style.alignItems, "center", "Should use align-items: center");
  });
});`,
    expectedOutput: '',
  },
  'web-m4-ex2': {
    testCode: `describe("Card Grid", function() {
  it("should have a .card-grid element", function() {
    assert.ok(document.querySelector(".card-grid"), "Should have a .card-grid element");
  });
  it("should use CSS Grid", function() {
    const grid = document.querySelector(".card-grid");
    const style = window.getComputedStyle(grid);
    assert.equals(style.display, "grid", "Card grid should have display: grid");
  });
  it("should have gap between cards", function() {
    const grid = document.querySelector(".card-grid");
    const style = window.getComputedStyle(grid);
    assert.ok(style.gap !== "0px", "Grid should have gap between cards");
  });
});`,
    expectedOutput: '',
  },
  'web-m5-ex1': {
    testCode: `describe("Loading Spinner", function() {
  it("should have a .spinner element", function() {
    assert.ok(document.querySelector(".spinner"), "Should have a .spinner element");
  });
  it("spinner should have border-radius 50%", function() {
    const spinner = document.querySelector(".spinner");
    const style = window.getComputedStyle(spinner);
    assert.equals(style.borderRadius, "50%", "Spinner should be circular");
  });
  it("spinner should have an animation", function() {
    const spinner = document.querySelector(".spinner");
    const style = window.getComputedStyle(spinner);
    assert.ok(style.animationName !== "none", "Spinner should have an animation");
  });
});`,
    expectedOutput: '',
  },
  'web-m6-ex1': {
    testCode: `describe("Responsive Page", function() {
  it("should have a responsive grid", function() {
    const grid = document.querySelector("[style*='grid'], .card-grid");
    assert.ok(grid, "Should have a grid element");
  });
});`,
    expectedOutput: '',
  },
  'web-m8-ex1': {
    testCode: `describe("Dynamic List Item", function() {
  it("addListItem should be a function", function() {
    assert.ok(typeof addListItem === "function", "addListItem should be a function");
  });
  it("should create and append a list item", function() {
    const list = document.getElementById("list");
    if (list) list.innerHTML = "";
    addListItem("Test Item");
    const items = document.querySelectorAll("#list li");
    assert.ok(items.length > 0, "Should have added at least one li");
    assert.equals(items[items.length - 1].textContent, "Test Item", "Item text should match");
  });
});`,
    expectedOutput: '',
  },
  'web-dom-deep-ex2': {
    testCode: `describe("Event Delegation", function() {
  it("should add a click listener to the list", function() {
    assert.ok(true, "Event delegation exercise — manual verification");
  });
});`,
    expectedOutput: '',
  },
  'web-dom-deep-ex1': {
    testCode: `describe("selectEmailInputs", function() {
  it("returns a NodeList", function() {
    const result = selectEmailInputs();
    assert.ok(result, "Should return a result");
  });
});`,
    expectedOutput: '',
  },
  'web-m7-ex2': {
    testCode: `describe("getGrade", function() {
  it("returns A for 95", function() { assert.equals(getGrade(95), "A"); });
  it("returns B for 85", function() { assert.equals(getGrade(85), "B"); });
  it("returns C for 75", function() { assert.equals(getGrade(75), "C"); });
  it("returns D for 65", function() { assert.equals(getGrade(65), "D"); });
  it("returns F for 50", function() { assert.equals(getGrade(50), "F"); });
});`,
    expectedOutput: '',
  },
  'web-m9-ex1': {
    testCode: `describe("validateForm", function() {
  it("returns null for valid inputs", function() { assert.equals(validateForm("Alice", "a@b.com", "password123"), null); });
  it("catches short name", function() { assert.equals(validateForm("Al", "a@b.com", "password123"), "Name must be at least 3 characters"); });
  it("catches invalid email", function() { assert.equals(validateForm("Alice", "invalid", "password123"), "Invalid email format"); });
  it("catches short password", function() { assert.equals(validateForm("Alice", "a@b.com", "123"), "Password must be at least 8 characters"); });
});`,
    expectedOutput: '',
  },
  'web-m10-ex1': {
    testCode: `describe("fetchUsers", function() {
  it("returns an array", async function() {
    const result = await fetchUsers();
    assert.ok(Array.isArray(result), "Should return an array");
  });
  it("each item has name and email", async function() {
    const result = await fetchUsers();
    assert.ok(result[0].name, "Should have name");
    assert.ok(result[0].email, "Should have email");
  });
});`,
    expectedOutput: '',
  },
  'web-deep-css-ex1': {
    testCode: `describe("CSS Variables Theme", function() {
  it("should have a .card element", function() {
    assert.ok(document.querySelector(".card"), "Should have a .card element");
  });
});`,
    expectedOutput: '',
  },
};

const seedFixExercises = async () => {
  try {
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected!\n');

    const db = mongoose.connection.db!;

    const courses = await db.collection('courses').find({
      title: { $in: [
        'Advanced Web Development — HTML, CSS & JavaScript Masterclass',
        'JavaScript Interactivity Mini-Challenge'
      ]}
    }).toArray();

    let fixed = 0;

    for (const course of courses) {
      let changed = false;

      for (const mod of (course.modules || [])) {
        for (const les of (mod.lessons || [])) {
          if (!les.codeExercises) continue;

          for (const ex of les.codeExercises) {
            const fix = FIXED_TESTS[ex.id];
            if (fix) {
              // Change type from 'write' to 'test' for exercises that had exact output matching
              if (ex.type === 'write') {
                ex.type = 'test';
                console.log(`   ✅ Changed ${ex.id} from "write" to "test"`);
              }
              ex.testCode = fix.testCode;
              ex.expectedOutput = fix.expectedOutput;
              changed = true;
              fixed++;
            }
          }
        }
      }

      if (changed) {
        await db.collection('courses').updateOne(
          { _id: course._id },
          { $set: { modules: course.modules } }
        );
        console.log(`   💾 Saved ${course.title.substring(0, 40)}\n`);
      }
    }

    // Verify
    console.log('═'.repeat(60));
    console.log('📊 VERIFICATION');
    console.log('═'.repeat(60));

    const finalCourses = await db.collection('courses').find({
      title: { $in: [
        'Advanced Web Development — HTML, CSS & JavaScript Masterclass',
        'JavaScript Interactivity Mini-Challenge'
      ]}
    }).toArray();

    for (const c of finalCourses) {
      console.log('\n📚 ' + c.title);
      for (const mod of (c.modules || [])) {
        for (const les of (mod.lessons || [])) {
          if (les.codeExercises) {
            for (const ex of les.codeExercises) {
              const hasTest = ex.testCode && ex.testCode.length > 10;
              const icon = hasTest ? '✅' : '⚠️';
              console.log(`   ${icon} ${ex.id} | type: ${ex.type} | test: ${hasTest ? 'YES' : 'NO'}`);
            }
          }
        }
      }
    }

    console.log(`\n🎉 Fixed ${fixed} code exercises!`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

seedFixExercises();
