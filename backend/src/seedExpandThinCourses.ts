/**
 * ─────────────────────────────────────────────────────────
 * SEED EXPAND: Thin Course Module Additions
 * ─────────────────────────────────────────────────────────
 * Adds missing modules to courses that are too thin
 * for market readiness. Run after seedMultiLanguageCourses.ts
 * to ensure Go, Rust, Java, and Python DS courses have ≥3 modules.
 *
 * Usage: npx ts-node src/seedExpandThinCourses.ts
 * ─────────────────────────────────────────────────────────
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ─── Module 2: Go — Functions, Structs & Interfaces ─────
const GO_MODULE_2 = {
  title: 'Module 2: Functions, Structs & Interfaces',
  description: 'Learn how to write functions, define structs, and use interfaces in Go.',
  order: 2,
  lessons: [
    {
      title: 'Functions & Multiple Return Values',
      type: 'article',
      content: `<h2>Functions in Go</h2>
<p>Go functions are first-class citizens. They can return multiple values — a unique feature!</p>
<pre><code>// Multiple return values
func divide(a, b float64) (float64, error) {
    if b == 0 {
        return 0, fmt.Errorf("division by zero")
    }
    return a / b, nil
}

// Named return values
func getStats(nums []int) (min, max, avg int) {
    min, max = nums[0], nums[0]
    sum := 0
    for _, n := range nums {
        if n < min { min = n }
        if n > max { max = n }
        sum += n
    }
    avg = sum / len(nums)
    return
}

// Variadic functions
func sum(nums ...int) int {
    total := 0
    for _, n := range nums {
        total += n
    }
    return total
}</code></pre>`,
      duration: 14,
      resources: [],
    },
    {
      title: 'Structs and Methods',
      type: 'article',
      content: `<h2>Structs in Go</h2>
<p>Go doesn't have classes — it uses structs with attached methods.</p>
<pre><code>// Define a struct
type Product struct {
    Name  string
    Price float64
    Stock int
}

// Method with value receiver
func (p Product) Display() string {
    return fmt.Sprintf("%s: $%.2f (%d in stock)", p.Name, p.Price, p.Stock)
}

// Method with pointer receiver (can modify)
func (p *Product) Sell(quantity int) error {
    if quantity > p.Stock {
        return fmt.Errorf("insufficient stock")
    }
    p.Stock -= quantity
    return nil
}

// Interfaces
type Stringer interface {
    String() string
}

func printAny(s Stringer) {
    fmt.Println(s.String())
}</code></pre>`,
      duration: 14,
      resources: [],
    },
    {
      title: 'Module 2 Quiz — Functions & Structs',
      type: 'quiz',
      content: '<p>Test your Go functions and structs knowledge.</p>',
      duration: 15,
      quizQuestions: [
        { questionText: 'How do you declare a function returning multiple values?', type: 'multiple_choice', options: ['func f() (int, error)', 'func f() int, error', 'func f() -> (int, error)', 'func f() [int, error]'], correctOptionIndex: 0, explanation: 'Multiple return types are in parentheses.' },
        { questionText: 'What is a pointer receiver?', type: 'multiple_choice', options: ['func (p *Product)', 'func (p Product)', 'func (Product p*)', 'func (*Product p)'], correctOptionIndex: 0, explanation: 'Pointer receiver uses (p *Type) syntax.' },
        { questionText: 'What does Go use instead of classes?', type: 'multiple_choice', options: ['Objects', 'Structs with methods', 'Traits', 'Protocols'], correctOptionIndex: 1, explanation: 'Go uses structs with methods instead of classes.' },
        { questionText: 'What is a variadic function?', type: 'multiple_choice', options: ['Takes no args', 'Takes variable number of args', 'Returns multiple values', 'Is recursive'], correctOptionIndex: 1, explanation: 'Variadic functions use ... syntax for any number of args.' },
        { questionText: 'What is the zero value of an int in Go?', type: 'multiple_choice', options: ['nil', '0', 'null', 'undefined'], correctOptionIndex: 1, explanation: 'Go initializes variables to zero values: int = 0.' },
      ],
      quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 },
    },
  ],
};

const GO_MODULE_3 = {
  title: 'Module 3: Concurrency with Goroutines',
  description: 'Master Go\'s built-in concurrency with goroutines and channels.',
  order: 3,
  lessons: [
    {
      title: 'Goroutines and Channels',
      type: 'article',
      content: `<h2>Go Concurrency</h2>
<p>Goroutines are lightweight threads. Channels connect them.</p>
<pre><code>// Start a goroutine
go func() {
    fmt.Println("Running concurrently!")
}()

// Channel
ch := make(chan int)

// Send in goroutine
go func() {
    ch <- 42
}()

// Receive
value := <-ch
fmt.Println(value) // 42

// Buffered channel
buffered := make(chan string, 3)
buffered <- "a"
buffered <- "b"
buffered <- "c"

// Range over channel
for msg := range buffered {
    fmt.Println(msg)
}</code></pre>`,
      duration: 16,
      resources: [],
    },
    {
      title: 'Select and Worker Pools',
      type: 'article',
      content: `<h2>Select Statement</h2>
<pre><code>select {
case msg1 := <-ch1:
    fmt.Println("Received from ch1:", msg1)
case msg2 := <-ch2:
    fmt.Println("Received from ch2:", msg2)
case <-time.After(1 * time.Second):
    fmt.Println("Timeout!")
default:
    fmt.Println("No channels ready")
}</code></pre>
<h2>Worker Pool Pattern</h2>
<pre><code>func worker(id int, jobs <-chan int, results chan<- int) {
    for job := range jobs {
        results <- job * 2
    }
}

func main() {
    jobs := make(chan int, 10)
    results := make(chan int, 10)
    for w := 1; w <= 3; w++ {
        go worker(w, jobs, results)
    }
    for j := 1; j <= 5; j++ {
        jobs <- j
    }
    close(jobs)
    for r := 1; r <= 5; r++ {
        <-results
    }
}</code></pre>`,
      duration: 16,
      resources: [],
    },
    {
      title: 'Module 3 Quiz — Concurrency',
      type: 'quiz',
      content: '<p>Test your Go concurrency knowledge.</p>',
      duration: 15,
      quizQuestions: [
        { questionText: 'What keyword starts a goroutine?', type: 'multiple_choice', options: ['thread', 'go', 'async', 'spawn'], correctOptionIndex: 1, explanation: 'The "go" keyword starts a goroutine.' },
        { questionText: 'What does <-ch do?', type: 'multiple_choice', options: ['Send to ch', 'Receive from ch', 'Close ch', 'Delete ch'], correctOptionIndex: 1, explanation: '<-ch receives from channel ch.' },
        { questionText: 'How do you create a buffered channel?', type: 'multiple_choice', options: ['make(chan int)', 'make(chan int, 5)', 'chan int{5}', 'buffered(chan int, 5)'], correctOptionIndex: 1, explanation: 'make(chan T, capacity) creates a buffered channel.' },
        { questionText: 'What is select used for?', type: 'multiple_choice', options: ['Filtering data', 'Waiting on multiple channels', 'Selecting random values', 'Sorting data'], correctOptionIndex: 1, explanation: 'select waits on multiple channel operations.' },
        { questionText: 'What happens sending to a full buffered channel?', type: 'multiple_choice', options: ['Panics', 'Blocks until space', 'Drops the value', 'Creates a new channel'], correctOptionIndex: 1, explanation: 'Sending to a full buffered channel blocks until space is available.' },
      ],
      quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 },
    },
  ],
};

// ─── Rust Module 2 & 3 ──────────────────────────────────
const RUST_MODULE_2 = {
  title: 'Module 2: Ownership & References',
  description: 'Understand Rust\'s ownership system, borrowing, and lifetimes.',
  order: 2,
  lessons: [
    {
      title: 'Ownership Rules',
      type: 'article',
      content: `<h2>Rust Ownership</h2>
<p>Rust's ownership system guarantees memory safety without a garbage collector.</p>
<pre><code>// Each value has one owner
let s1 = String::from("hello");
let s2 = s1; // s1 is MOVED to s2

// Clone for deep copy
let s3 = s2.clone();
println!("{} {}", s2, s3); // Both valid

// Ownership in functions
fn take_ownership(s: String) {
    println!("{}", s);
}

fn give_ownership() -> String {
    String::from("hello")
}

// Copy types (stack-only)
let x = 5;
let y = x; // Copy, not move
println!("{} {}", x, y); // Both valid</code></pre>`,
      duration: 14,
      resources: [],
    },
    {
      title: 'Borrowing & References',
      type: 'article',
      content: `<h2>References and Borrowing</h2>
<pre><code>// Immutable reference
fn calculate_length(s: &String) -> usize {
    s.len()
}

// Mutable reference
fn append_world(s: &mut String) {
    s.push_str(" world");
}

let mut s = String::from("hello");
append_world(&mut s);
let len = calculate_length(&s);
println!("'{}' has length {}", s, len);

// Rules:
// 1. One mutable reference XOR many immutable references
// 2. References must always be valid

// Slices
let words = String::from("hello world");
let hello = &words[0..5];  // "hello"
let world = &words[6..11]; // "world"</code></pre>`,
      duration: 14,
      resources: [],
    },
    {
      title: 'Module 2 Quiz — Ownership',
      type: 'quiz',
      content: '<p>Test your Rust ownership knowledge.</p>',
      duration: 15,
      quizQuestions: [
        { questionText: 'What happens when you assign one String to another?', type: 'multiple_choice', options: ['Deep copy', 'Move', 'Shallow copy', 'Clone'], correctOptionIndex: 1, explanation: 'String is moved, not copied.' },
        { questionText: 'What symbol creates a reference?', type: 'multiple_choice', options: ['*', '&', '@', 'ref'], correctOptionIndex: 1, explanation: '& creates a reference.' },
        { questionText: 'How many mutable references can exist at once?', type: 'multiple_choice', options: ['Unlimited', 'One', 'Two', 'Zero'], correctOptionIndex: 1, explanation: 'Only one mutable reference at a time.' },
        { questionText: 'What does Clone do?', type: 'multiple_choice', options: ['Moves data', 'Creates deep copy', 'Creates reference', 'Deletes data'], correctOptionIndex: 1, explanation: 'Clone creates a deep copy of the data.' },
        { questionText: 'What is a slice?', type: 'multiple_choice', options: ['Full collection', 'Reference to a portion', 'A type of struct', 'A smart pointer'], correctOptionIndex: 1, explanation: 'A slice is a reference to a contiguous portion of a collection.' },
      ],
      quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 },
    },
  ],
};

const RUST_MODULE_3 = {
  title: 'Module 3: Structs, Enums & Error Handling',
  description: 'Learn to define structs, enums, and handle errors idiomatically in Rust.',
  order: 3,
  lessons: [
    {
      title: 'Structs and Enums',
      type: 'article',
      content: `<h2>Structs and Enums in Rust</h2>
<pre><code>// Struct
struct User {
    username: String,
    email: String,
    active: bool,
}

// Tuple struct
struct Color(u8, u8, u8);

// Method
impl User {
    fn new(username: String, email: String) -> Self {
        User { username, email, active: true }
    }
    fn display(&self) -> String {
        format!("{} <{}>", self.username, self.email)
    }
}

// Enum
enum PaymentMethod {
    CreditCard(String),
    MobileMoney(String),
    Cash,
}

fn process_payment(method: PaymentMethod) {
    match method {
        PaymentMethod::CreditCard(num) => println!("Card: {}", num),
        PaymentMethod::MobileMoney(provider) => println!("Mobile: {}", provider),
        PaymentMethod::Cash => println!("Pay with cash"),
    }
}

// Option enum (built-in)
fn find_user(id: u32) -> Option<User> {
    if id == 1 {
        Some(User::new("alice".into(), "alice@example.com".into()))
    } else {
        None
    }
}</code></pre>`,
      duration: 14,
      resources: [],
    },
    {
      title: 'Error Handling with Result',
      type: 'article',
      content: `<h2>Error Handling in Rust</h2>
<pre><code>// Result enum
enum Result&lt;T, E&gt; {
    Ok(T),
    Err(E),
}

// Custom error type
#[derive(Debug)]
enum AppError {
    NotFound,
    InvalidInput(String),
    DatabaseError(String),
}

fn divide(a: f64, b: f64) -> Result&lt;f64, AppError&gt; {
    if b == 0.0 {
        return Err(AppError::InvalidInput("division by zero".into()));
    }
    Ok(a / b)
}

// Using ? operator (propagates error)
fn calculate() -> Result&lt;f64, AppError&gt; {
    let a = divide(10.0, 2.0)?;
    let b = divide(a, 3.0)?;
    Ok(b)
}

// Unwrap and Expect
let x = divide(10.0, 2.0).unwrap();
let y = divide(10.0, 2.0).expect("Math should work!");</code></pre>`,
      duration: 14,
      resources: [],
    },
    {
      title: 'Module 3 Quiz — Structs & Errors',
      type: 'quiz',
      content: '<p>Test your Rust data structures and error handling knowledge.</p>',
      duration: 15,
      quizQuestions: [
        { questionText: 'What keyword defines methods on a struct?', type: 'multiple_choice', options: ['method', 'impl', 'fn', 'trait'], correctOptionIndex: 1, explanation: 'Methods are defined inside an impl block.' },
        { questionText: 'What is the ? operator used for?', type: 'multiple_choice', options: ['Ternary', 'Error propagation', 'Null check', 'Pattern matching'], correctOptionIndex: 1, explanation: '? propagates errors up the call stack.' },
        { questionText: 'What does Option represent?', type: 'multiple_choice', options: ['A value or null', 'A value or nothing', 'Success or failure', 'True or false'], correctOptionIndex: 1, explanation: 'Option represents a value (Some) or absence (None).' },
        { questionText: 'What does unwrap() do on a Result?', type: 'multiple_choice', options: ['Returns value or panics', 'Returns default value', 'Ignores error', 'Converts to string'], correctOptionIndex: 0, explanation: 'unwrap() returns the value if Ok, or panics if Err.' },
        { questionText: 'What does #[derive(Debug)] do?', type: 'multiple_choice', options: ['Enables debugging', 'Auto-implements Debug trait', 'Removes debug code', 'Prints debug info'], correctOptionIndex: 1, explanation: '#[derive(Debug)] auto-implements the Debug trait for {:?} formatting.' },
      ],
      quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 },
    },
  ],
};

// ─── Java Module 3: OOP ─────────────────────────────────
const JAVA_MODULE_3 = {
  title: 'Module 3: Object-Oriented Programming',
  description: 'Master OOP in Java — classes, inheritance, polymorphism, and interfaces.',
  order: 3,
  lessons: [
    {
      title: 'Classes, Inheritance & Polymorphism',
      type: 'article',
      content: `<h2>Object-Oriented Java</h2>
<pre><code>// Base class
class Animal {
    protected String name;
    public Animal(String name) { this.name = name; }
    public void speak() {
        System.out.println(name + " makes a sound");
    }
}

// Inheritance
class Dog extends Animal {
    public Dog(String name) { super(name); }
    @Override
    public void speak() {
        System.out.println(name + " barks!");
    }
}

// Polymorphism
Animal myDog = new Dog("Rex");
myDog.speak(); // "Rex barks!"

// Abstract class
abstract class Shape {
    abstract double area();
    public void display() { System.out.println("Area: " + area()); }
}

class Circle extends Shape {
    private double radius;
    Circle(double r) { this.radius = r; }
    @Override double area() { return Math.PI * radius * radius; }
}</code></pre>`,
      duration: 14,
      resources: [],
    },
    {
      title: 'Interfaces & ArrayLists',
      type: 'article',
      content: `<h2>Interfaces and Collections</h2>
<pre><code>// Interface
interface Printable { void print(); }
interface Savable { void save(); }

// Multiple inheritance through interfaces
class Document implements Printable, Savable {
    private String content;
    Document(String content) { this.content = content; }
    public void print() { System.out.println(content); }
    public void save() { System.out.println("Saving: " + content); }
}

// ArrayList
import java.util.ArrayList;
ArrayList<String> names = new ArrayList<>();
names.add("Alice");
names.add("Bob");
names.add("Charlie");
for (String name : names) { System.out.println(name); }
System.out.println(names.size()); // 3
names.remove(1);</code></pre>`,
      duration: 14,
      resources: [],
    },
    {
      title: 'Module 3 Quiz — OOP in Java',
      type: 'quiz',
      content: '<p>Test your Java OOP knowledge.</p>',
      duration: 15,
      quizQuestions: [
        { questionText: 'What keyword is used for inheritance?', type: 'multiple_choice', options: ['implements', 'extends', 'inherits', 'super'], correctOptionIndex: 1, explanation: 'extends is used for class inheritance in Java.' },
        { questionText: 'What does @Override do?', type: 'multiple_choice', options: ['Overloads a method', 'Overrides a parent method', 'Creates a new method', 'Deletes a method'], correctOptionIndex: 1, explanation: '@Override indicates overriding a parent method.' },
        { questionText: 'Can a Java class extend multiple classes?', type: 'multiple_choice', options: ['Yes', 'No', 'Only interfaces', 'With special syntax'], correctOptionIndex: 1, explanation: 'Java does not support multiple class inheritance.' },
        { questionText: 'What keyword implements an interface?', type: 'multiple_choice', options: ['extends', 'implements', 'interface', 'realizes'], correctOptionIndex: 1, explanation: 'implements is used for interfaces.' },
        { questionText: 'What package contains ArrayList?', type: 'multiple_choice', options: ['java.util', 'java.lang', 'java.io', 'java.collections'], correctOptionIndex: 0, explanation: 'ArrayList is in java.util package.' },
      ],
      quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 },
    },
  ],
};

// ─── Python Module 2: Pandas ────────────────────────────
const PYTHON_MODULE_2 = {
  title: 'Module 2: Data Analysis with Pandas',
  description: 'Learn pandas for real data analysis — loading, cleaning, and exploring datasets.',
  order: 2,
  lessons: [
    {
      title: 'Introduction to Pandas',
      type: 'article',
      content: `<h2>Pandas — The Data Analysis Library</h2>
<p>Pandas is Python's premier data analysis library. It provides DataFrame and Series structures.</p>
<pre><code>import pandas as pd

# Create a Series
s = pd.Series([10, 20, 30, 40], name="scores")
print(s)

# Create a DataFrame
data = {
    'name': ['Alice', 'Bob', 'Charlie', 'Diana'],
    'age': [25, 30, 35, 28],
    'city': ['Kigali', 'Butare', 'Kigali', 'Gisenyi'],
    'salary': [500000, 600000, 450000, 700000]
}
df = pd.DataFrame(data)
print(df)

# Basic exploration
print(df.head())
print(df.info())
print(df.describe())
print(df.shape)</code></pre>`,
      duration: 16,
      resources: [],
    },
    {
      title: 'Filtering & Grouping Data',
      type: 'article',
      content: `<h2>Data Filtering and Aggregation</h2>
<pre><code>import pandas as pd

df = pd.DataFrame({
    'name': ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'],
    'department': ['IT', 'HR', 'IT', 'HR', 'IT'],
    'salary': [500000, 600000, 450000, 700000, 550000],
    'years_exp': [3, 5, 2, 8, 4]
})

# Filtering
it_employees = df[df['department'] == 'IT']
high_salary = df[df['salary'] > 500000]

# Grouping
dept_stats = df.groupby('department').agg({
    'salary': ['mean', 'max', 'min'],
    'years_exp': 'mean'
})
print(dept_stats)

# Sorting
sorted_df = df.sort_values('salary', ascending=False)

# Adding columns
df['bonus'] = df['salary'] * 0.1

# Save/Load CSV
df.to_csv('employees.csv', index=False)
loaded = pd.read_csv('employees.csv')</code></pre>`,
      duration: 16,
      resources: [],
    },
    {
      title: 'Module 2 Quiz — Pandas Basics',
      type: 'quiz',
      content: '<p>Test your pandas knowledge.</p>',
      duration: 15,
      quizQuestions: [
        { questionText: 'What is the main data structure in pandas for tabular data?', type: 'multiple_choice', options: ['Series', 'DataFrame', 'Array', 'Matrix'], correctOptionIndex: 1, explanation: 'DataFrame is the primary tabular data structure.' },
        { questionText: 'How do you filter rows in pandas?', type: 'multiple_choice', options: ['df.filter()', 'df[df.column > value]', 'df.select()', 'df.where()'], correctOptionIndex: 1, explanation: 'Boolean indexing with df[condition] filters rows.' },
        { questionText: 'What method gives summary statistics?', type: 'multiple_choice', options: ['df.info()', 'df.summary()', 'df.describe()', 'df.stats()'], correctOptionIndex: 2, explanation: 'df.describe() provides summary statistics.' },
        { questionText: 'What is used for data aggregation?', type: 'multiple_choice', options: ['df.aggregate()', 'df.groupby()', 'df.pivot()', 'df.merge()'], correctOptionIndex: 1, explanation: 'df.groupby() is used for split-apply-combine operations.' },
        { questionText: 'How do you read a CSV file?', type: 'multiple_choice', options: ['pd.open_csv()', 'pd.read_csv()', 'pd.load_csv()', 'pd.import_csv()'], correctOptionIndex: 1, explanation: 'pd.read_csv() reads CSV files into DataFrames.' },
      ],
      quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 },
    },
  ],
};

const PYTHON_MODULE_3 = {
  title: 'Module 3: Data Visualization',
  description: 'Create compelling visualizations with matplotlib and seaborn.',
  order: 3,
  lessons: [
    {
      title: 'Plotting with Matplotlib',
      type: 'article',
      content: `<h2>Data Visualization with Matplotlib</h2>
<pre><code>import matplotlib.pyplot as plt

# Line plot
x = [1, 2, 3, 4, 5]
y = [10, 15, 13, 18, 20]
plt.plot(x, y, marker='o')
plt.title('Monthly Sales')
plt.xlabel('Month')
plt.ylabel('Sales (RWF)')
plt.grid(True)
plt.show()

# Bar chart
categories = ['IT', 'HR', 'Finance', 'Marketing']
values = [45, 30, 25, 35]
plt.bar(categories, values, color='skyblue')
plt.title('Employees by Department')
plt.show()

# Histogram
import numpy as np
data = np.random.normal(50000, 10000, 1000)
plt.hist(data, bins=20, edgecolor='black')
plt.title('Salary Distribution')
plt.show()

# Subplots
fig, axes = plt.subplots(2, 2, figsize=(10, 8))
axes[0, 0].plot(x, y)
axes[0, 1].bar(categories, values)
axes[1, 0].hist(data, bins=20)
plt.show()</code></pre>`,
      duration: 16,
      resources: [],
    },
    {
      title: 'Advanced Visualizations with Seaborn',
      type: 'article',
      content: `<h2>Statistical Plots with Seaborn</h2>
<pre><code>import seaborn as sns
import matplotlib.pyplot as plt

# Load built-in dataset
tips = sns.load_dataset('tips')
print(tips.head())

# Scatter plot with regression line
sns.lmplot(x='total_bill', y='tip', data=tips)
plt.title('Tip vs Total Bill')
plt.show()

# Box plot
sns.boxplot(x='day', y='total_bill', data=tips)
plt.title('Bill Distribution by Day')
plt.show()

# Heatmap (correlation)
import numpy as np
corr = tips.select_dtypes(include=[np.number]).corr()
sns.heatmap(corr, annot=True, cmap='coolwarm')
plt.title('Feature Correlations')
plt.show()

# Pair plot
sns.pairplot(tips, hue='sex')
plt.show()

# Count plot
sns.countplot(x='day', data=tips)
plt.title('Number of Bills by Day')
plt.show()

# Save figure
plt.savefig('analysis.png', dpi=300, bbox_inches='tight')</code></pre>`,
      duration: 16,
      resources: [],
    },
    {
      title: 'Module 3 Quiz — Data Visualization',
      type: 'quiz',
      content: '<p>Test your data visualization knowledge.</p>',
      duration: 15,
      quizQuestions: [
        { questionText: 'What library is the foundation for plotting in Python?', type: 'multiple_choice', options: ['seaborn', 'matplotlib', 'plotly', 'bokeh'], correctOptionIndex: 1, explanation: 'matplotlib is the foundational plotting library.' },
        { questionText: 'What does plt.show() do?', type: 'multiple_choice', options: ['Saves the plot', 'Displays the plot', 'Creates a new figure', 'Closes all figures'], correctOptionIndex: 1, explanation: 'plt.show() renders and displays the plot.' },
        { questionText: 'What is seaborn built on top of?', type: 'multiple_choice', options: ['numpy', 'pandas', 'matplotlib', 'scipy'], correctOptionIndex: 2, explanation: 'Seaborn is built on top of matplotlib.' },
        { questionText: 'What plot type shows data distribution?', type: 'multiple_choice', options: ['Bar chart', 'Histogram', 'Scatter plot', 'Line chart'], correctOptionIndex: 1, explanation: 'Histograms show the distribution of numerical data.' },
        { questionText: 'How do you save a matplotlib figure?', type: 'multiple_choice', options: ['plt.savefig()', 'plt.export()', 'plt.write()', 'plt.store()'], correctOptionIndex: 0, explanation: 'plt.savefig() saves the current figure to a file.' },
      ],
      quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 },
    },
  ],
};

// ─── Course titles to expand ────────────────────────────
interface CourseModule {
  title: string;
  description?: string;
  order: number;
  lessons: any[];
}

const EXPANSIONS: { title: string; modules: CourseModule[]; targetCount: number }[] = [
  { title: 'Go Programming — Concurrency & Simplicity', modules: [GO_MODULE_2, GO_MODULE_3], targetCount: 3 },
  { title: 'Rust Programming — Safety & Performance', modules: [RUST_MODULE_2, RUST_MODULE_3], targetCount: 3 },
  { title: 'Java Programming — From Zero to OOP', modules: [JAVA_MODULE_3], targetCount: 3 },
  { title: 'Python for Data Science — Lists, Dicts & Functions', modules: [PYTHON_MODULE_2, PYTHON_MODULE_3], targetCount: 3 },
];

// ─── Main seeder ────────────────────────────────────────
async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) { console.error('❌ MONGO_URI not found'); process.exit(1); }

  await mongoose.connect(uri);
  const db = mongoose.connection.db!;
  console.log('🌱 Expanding thin courses with additional modules...\n');

  for (const exp of EXPANSIONS) {
    const course = await db.collection('courses').findOne({ title: exp.title }) as any;
    if (!course) {
      console.log(`   ⚠️ Not found: ${exp.title}`);
      continue;
    }

    const currentModules: any[] = course.modules || [];
    if (currentModules.length >= exp.targetCount) {
      console.log(`   ⏭️ ${exp.title} — already ${currentModules.length} modules (target ${exp.targetCount})`);
      continue;
    }

    const toAdd = exp.modules.slice(0, exp.targetCount - currentModules.length);
    await db.collection('courses').updateOne(
      { _id: course._id },
      { $push: { modules: { $each: toAdd } } } as any
    );

    console.log(`   ✅ ${exp.title} — added ${toAdd.length} module(s) → now ${currentModules.length + toAdd.length}`);
  }

  // Verify
  console.log('\n📊 Verification:');
  for (const exp of EXPANSIONS) {
    const course = await db.collection('courses').aggregate([
      { $match: { title: exp.title } },
      { $project: { title: 1, moduleCount: { $size: '$modules' }, _id: 0 } }
    ]).toArray() as any[];
    const mc = course[0]?.moduleCount || 0;
    const ok = mc >= exp.targetCount;
    console.log(`   ${ok ? '✅' : '❌'} ${exp.title?.substring(0, 50).padEnd(52)} ${mc} modules`);
  }

  console.log('\n🏁 Thin courses expanded successfully!');
  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
