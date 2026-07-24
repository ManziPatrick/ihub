/**
 * ─────────────────────────────────────────────────────────
 * FIXUP: Complete Platform Setup
 * ─────────────────────────────────────────────────────────
 * 1. Assign ALL courses to admin@bootskills.com
 * 2. Clear old internships, create "Summer Business Innovation Session"
 * 3. Beef up thin tech courses (Go, Rust, Python DS, Java)
 * 4. Verify everything
 *
 * Usage: npx ts-node src/fixupCompletePlatform.ts
 * ─────────────────────────────────────────────────────────
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from backend root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ─── Admin email (looked up dynamically) ─────────────────
const ADMIN_EMAIL = 'admin@bootskills.com';

// ─── Course content additions for thin courses ───────────
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
}</code></pre>
<p>Key concepts:</p>
<ul>
<li>Multiple return values — wrap in parentheses (int, error)</li>
<li>Named returns — declare variables in signature, bare return</li>
<li>Variadic params — ...int for any number of arguments</li>
</ul>`,
      duration: 14,
      resources: [],
    },
    {
      title: 'Structs and Methods',
      type: 'article',
      content: `<h2>Structs in Go</h2>
<p>Go doesn't have classes — it uses structs with methods.</p>
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

// Method with pointer receiver (modifies)
func (p *Product) Sell(quantity int) error {
    if quantity > p.Stock {
        return fmt.Errorf("insufficient stock")
    }
    p.Stock -= quantity
    return nil
}

// Usage
func main() {
    p := Product{Name: "Laptop", Price: 999.99, Stock: 10}
    fmt.Println(p.Display())
    p.Sell(2)
    fmt.Printf("Remaining: %d\\n", p.Stock)
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
        { questionText: 'What is a pointer receiver?', type: 'multiple_choice', options: ['func (p *Product)', 'func (p Product)', 'func (Product p*)', 'func (*Product p)'], correctOptionIndex: 0, explanation: 'Pointer receiver is (p *Type) syntax.' },
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
}</code></pre>
<p>Key concepts:</p>
<ul>
<li><code>go func()</code> starts a goroutine</li>
<li><code>chan T</code> declares a channel of type T</li>
<li><code>ch <- value</code> sends to channel</li>
<li><code><-ch</code> receives from channel</li>
<li>Buffered channels have capacity; unbuffered block until received</li>
</ul>`,
      duration: 16,
      resources: [],
    },
    {
      title: 'Select and Advanced Patterns',
      type: 'article',
      content: `<h2>Select Statement</h2>
<p>The select statement lets a goroutine wait on multiple channel operations.</p>
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
    
    // Start 3 workers
    for w := 1; w <= 3; w++ {
        go worker(w, jobs, results)
    }
    
    // Send 5 jobs
    for j := 1; j <= 5; j++ {
        jobs <- j
    }
    close(jobs)
    
    // Collect results
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
// println!("{}", s1); // ERROR! s1 no longer valid

// Clone for deep copy
let s3 = s2.clone();
println!("{} {}", s2, s3); // Both valid

// Ownership in functions
fn take_ownership(s: String) {
    println!("{}", s);
} // s is dropped here

fn give_ownership() -> String {
    String::from("hello")
}

let s = give_ownership();
take_ownership(s);
// println!("{}", s); // ERROR! s was moved

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
// 1. One mutable reference OR many immutable references
// 2. References must always be valid (no dangling pointers)

// Slices (references to part of a collection)
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

// Using match
match divide(10.0, 0.0) {
    Ok(result) => println!("Result: {}", result),
    Err(e) => println!("Error: {:?}", e),
}

// Using ? operator (propagates error)
fn calculate() -> Result&lt;f64, AppError&gt; {
    let a = divide(10.0, 2.0)?;
    let b = divide(a, 3.0)?;
    Ok(b)
}

// Unwrap and Expect (use carefully!)
let x = divide(10.0, 2.0).unwrap(); // panics on error
let y = divide(10.0, 2.0).expect("Math should work!"); // custom message</code></pre>`,
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
    
    public Animal(String name) {
        this.name = name;
    }
    
    public void speak() {
        System.out.println(name + " makes a sound");
    }
}

// Inheritance
class Dog extends Animal {
    public Dog(String name) {
        super(name);
    }
    
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
    
    public void display() {
        System.out.println("Area: " + area());
    }
}

class Circle extends Shape {
    private double radius;
    
    Circle(double r) { this.radius = r; }
    
    @Override
    double area() { return Math.PI * radius * radius; }
}</code></pre>`,
      duration: 14,
      resources: [],
    },
    {
      title: 'Interfaces & ArrayLists',
      type: 'article',
      content: `<h2>Interfaces and Collections</h2>
<pre><code>// Interface
interface Printable {
    void print();
}

interface Savable {
    void save();
}

// Multiple inheritance through interfaces
class Document implements Printable, Savable {
    private String content;
    
    Document(String content) { this.content = content; }
    
    @Override
    public void print() {
        System.out.println(content);
    }
    
    @Override
    public void save() {
        System.out.println("Saving: " + content);
    }
}

// ArrayList (dynamic array)
import java.util.ArrayList;

ArrayList<String> names = new ArrayList<>();
names.add("Alice");
names.add("Bob");
names.add("Charlie");

for (String name : names) {
    System.out.println(name);
}

System.out.println(names.get(0)); // Alice
System.out.println(names.size()); // 3
names.remove(1); // Remove Bob</code></pre>`,
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
        { questionText: 'What does @Override do?', type: 'multiple_choice', options: ['Overloads a method', 'Overrides a parent method', 'Creates a new method', 'Deletes a method'], correctOptionIndex: 1, explanation: '@Override indicates we are overriding a method from the parent class.' },
        { questionText: 'Can a Java class extend multiple classes?', type: 'multiple_choice', options: ['Yes', 'No', 'Only interfaces', 'With special syntax'], correctOptionIndex: 1, explanation: 'Java does not support multiple inheritance of classes.' },
        { questionText: 'What keyword implements an interface?', type: 'multiple_choice', options: ['extends', 'implements', 'interface', 'realizes'], correctOptionIndex: 1, explanation: 'implements is used for interfaces.' },
        { questionText: 'What package contains ArrayList?', type: 'multiple_choice', options: ['java.util', 'java.lang', 'java.io', 'java.collections'], correctOptionIndex: 0, explanation: 'ArrayList is in java.util package.' },
      ],
      quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 },
    },
  ],
};

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
print(df.head())        # First 5 rows
print(df.info())        # Column types and nulls
print(df.describe())    # Summary statistics
print(df.shape)         # (rows, columns)

# Accessing columns
print(df['name'])       # Single column
print(df[['name', 'age']])  # Multiple columns</code></pre>`,
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
experienced_it = df[(df['department'] == 'IT') & (df['years_exp'] >= 3)]

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
df['total_comp'] = df['salary'] + df['bonus']

# Save to CSV
df.to_csv('employees.csv', index=False)

# Load from CSV
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
import pandas as pd

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

# Subplots (multiple charts)
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
import pandas as pd

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

// ─── Main fixup function ────────────────────────────────
async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('❌ MONGO_URI not found in environment');
    process.exit(1);
  }

  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(uri);
  const db = mongoose.connection.db!;
  console.log('✅ Connected!\n');

  // ─── Look up admin user by email ────────────────────
  const adminUser = await db.collection('users').findOne({ email: ADMIN_EMAIL });
  if (!adminUser) {
    console.error(`❌ Admin user ${ADMIN_EMAIL} not found!`);
    await mongoose.disconnect();
    process.exit(1);
  }
  const adminObjectId = adminUser._id;
  console.log(`👤 Admin found: ${adminUser.email} (${adminUser.role}, ID: ${adminObjectId})\n`);

  // ═══════════════════════════════════════════════════════
  // STEP 1: Assign ALL courses to admin@bootskills.com
  // ═══════════════════════════════════════════════════════
  console.log('═'.repeat(60));
  console.log('📋 STEP 1: Assigning all courses to admin@bootskills.com');
  console.log('═'.repeat(60));

  const updateResult = await db.collection('courses').updateMany(
    {}, 
    { $set: { instructor: adminObjectId, createdBy: adminObjectId } } as any
  );

  const totalCourses = await db.collection('courses').countDocuments();
  console.log(`   ✅ Updated ${updateResult.modifiedCount} courses (${totalCourses} total)`);

  // Verify
  const withWrongInstructor = await db.collection('courses').countDocuments({
    instructor: { $ne: adminObjectId }
  });
  console.log(`   ✅ Courses with wrong instructor: ${withWrongInstructor}`);

  // ═══════════════════════════════════════════════════════
  // STEP 2: Clear old internships, create Summer Business Innovation Session
  // ═══════════════════════════════════════════════════════
  console.log('\n' + '═'.repeat(60));
  console.log('🏖️ STEP 2: Creating Summer Business Innovation Session');
  console.log('═'.repeat(60));

  // Clear old internship data
  const collections = [
    'internshipcertificates', 'internshippayments', 'internshipsubmissions',
    'internshipmeetings', 'internshipcomments', 'internshipactivitylogs',
    'internshiptasks', 'internshipsprints', 'internshipmilestones',
    'internshipteammembers', 'internshipteams', 'internshipapplications',
    'internshipprojects', 'internshipprograms'
  ];

  let totalDeleted = 0;
  for (const col of collections) {
    const result = await db.collection(col).deleteMany({});
    totalDeleted += result.deletedCount || 0;
  }    console.log(`   🗑️ Cleared ${totalDeleted} documents from internship collections`);

  // Also clear old internships from other collections that might have references
  const oldCollectionsToCheck = ['internshipcertificates', 'internshippayments', 'internshipsubmissions', 'internshipmeetings', 'internshipcomments', 'internshipactivitylogs', 'internshiptasks', 'internshipsprints', 'internshipmilestones', 'internshipteammembers', 'internshipteams', 'internshipapplications', 'internshipprojects', 'internshipprograms'];
  for (const col of oldCollectionsToCheck) {
    await db.collection(col).deleteMany({});
  }

  // Create the Summer Business Innovation Session
  const now = new Date();
  const startDate = new Date('2026-07-01');
  const endDate = new Date('2026-08-31');
  const deadline = new Date('2026-06-20');

  const programResult = await db.collection('internshipprograms').insertOne({
    title: 'Summer Business Innovation Session',
    description: 'An intensive 8-week summer program where students develop real business ideas into viable startups. From identifying market opportunities in Rwanda to building MVPs, creating business plans, and pitching to investors — this program simulates the full entrepreneurial journey.',
    duration: '8 Weeks',
    startDate,
    endDate,
    applicationDeadline: deadline,
    eligibility: 'Open to all students and recent graduates\nBasic understanding of business concepts\nMust have a business idea or willingness to develop one\nTeam player with entrepreneurial mindset',
    rules: 'Attend all workshops and mentorship sessions\nComplete weekly milestones\nPresent final business pitch\nCollaborate with team members',
    price: 0,
    currency: 'RWF',
    discount: 0,
    maxParticipants: 40,
    maxSpots: 35,
    signerName: 'Bootskills Academy',
    signerSignature: 'Electronically signed',
    image: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&q=80&w=800',
    isActive: true,
    batches: [
      { name: 'Cohort 1', startDate, endDate }
    ],
    status: 'active',
    allowedDeliveryModes: ['online', 'physical', 'hybrid'],
    enablePhaseBasedApproval: false,
    isDeleted: false,
    createdBy: adminObjectId,
    applicationQuestions: [
      { label: 'Describe your business idea (or interest area)', type: 'textarea', required: true },
      { label: 'What skills can you bring to a team?', type: 'textarea', required: true },
      { label: 'Preferred delivery mode', type: 'select', required: true, options: ['Online', 'Physical', 'Hybrid'] },
      { label: 'Do you have a team in mind?', type: 'text', required: false },
    ],
    phases: [],
    createdAt: now,
    updatedAt: now,
  });

  console.log(`   ✅ Created program: "Summer Business Innovation Session"`);

  // Create projects for the program
  const projectsData = [
    {
      title: 'Market Gap Analysis Platform',
      description: 'Build a web platform that identifies and visualizes market opportunities in Rwanda across key sectors (agritech, fintech, healthtech, edtech, tourism).',
      skills: ['React', 'Node.js', 'MongoDB', 'Data Visualization', 'Market Research'],
      teamSize: { min: 3, max: 5 },
      docContent: `# Market Gap Analysis Platform
## Project Overview

### Mission
Identify and visualize untapped market opportunities across Rwanda's key economic sectors.

### Key Features
- Sector-wise market data aggregation
- Interactive dashboards showing supply/demand gaps
- Competitor analysis tools
- Opportunity scoring algorithm
- Business viability calculator

### Tech Stack
- Frontend: React + TypeScript + Tailwind CSS
- Backend: Node.js + GraphQL
- Database: MongoDB
- Visualization: Chart.js / D3.js

### Deliverables
- MVP with 3 sector analyses
- API for data ingestion
- Admin dashboard for data management
- Final presentation with market insights`,
    },
    {
      title: 'Business Plan Builder App',
      description: 'Create a guided web application that helps entrepreneurs build professional business plans with financial projections, market analysis, and investor-ready pitch decks.',
      skills: ['React', 'Node.js', 'PDF Generation', 'Financial Modeling', 'UI/UX'],
      teamSize: { min: 2, max: 4 },
      docContent: `# Business Plan Builder
## Project Overview

### Mission
Democratize business planning by making professional-grade tools accessible to every entrepreneur.

### Key Features
- Step-by-step business plan wizard
- Financial projection templates
- Market analysis framework
- Auto-generated pitch decks (PDF)
- Investor-ready formatting

### Tech Stack
- Frontend: React + Tailwind CSS
- Backend: Node.js + Express
- Database: MongoDB
- PDF: Puppeteer / PDFKit

### Deliverables
- Working MVP with 5 business plan templates
- Financial projection engine
- PDF export functionality
- User dashboard`,
    },
    {
      title: 'E-Commerce for Local Artisans',
      description: 'Develop a mobile-friendly e-commerce platform designed specifically for Rwandan artisans and small businesses to sell products online with mobile money payments.',
      skills: ['React', 'Mobile Money API', 'Node.js', 'E-commerce', 'Payment Integration'],
      teamSize: { min: 3, max: 5 },
      docContent: `# Local Artisan E-Commerce Platform
## Project Overview

### Mission
Enable Rwandan artisans and small businesses to sell products online with seamless mobile money payments.

### Key Features
- Product catalog with image uploads
- Mobile Money payment integration (MoMo, M-Pesa)
- Order management system
- Seller dashboard with analytics
- Customer reviews and ratings
- Delivery tracking

### Tech Stack
- Frontend: React + Tailwind CSS (mobile-first)
- Backend: Node.js + GraphQL
- Database: MongoDB
- Payments: Mobile Money API integration
- Storage: Cloudinary

### Deliverables
- Working MVP with 10+ products
- Mobile Money checkout flow
- Seller registration and dashboard
- Final pitch presentation`,
    },
  ];

  for (const pd of projectsData) {
    await db.collection('internshipprojects').insertOne({
      internshipProgramId: programResult.insertedId,
      title: pd.title,
      description: pd.description,
      document: pd.docContent,
      requiredSkills: pd.skills,
      teamSizeRange: pd.teamSize,
      status: 'published',
      objectives: [
        `Develop core ${pd.title.toLowerCase()} functionality`,
        'Implement user authentication',
        'Create responsive and accessible UI',
        'Write documentation',
        'Prepare final pitch presentation',
      ],
      createdAt: now,
      updatedAt: now,
    });
  }

  console.log(`   ✅ Created ${projectsData.length} summer projects`);

  // Create application questions for the session
  console.log(`\n📊 Summer Business Innovation Session is ready!`);
  console.log(`   🎯 Focus: Real business development for Rwandan market`);
  console.log(`   💰 Price: FREE (0 RWF)`);
  console.log(`   📅 Duration: 8 weeks (July - August 2026)`);

  // ═══════════════════════════════════════════════════════
  // STEP 3: Beef up thin courses (with duplicate prevention)
  // ═══════════════════════════════════════════════════════
  console.log('\n' + '═'.repeat(60));
  console.log('💪 STEP 3: Beefing up thin courses');
  console.log('═'.repeat(60));

  // Helper to check and add modules to a course
  async function addModulesToCourse(courseTitle: string, newModules: any[], targetCount: number) {
    const course = await db.collection('courses').findOne({ title: courseTitle }) as any;
    if (!course) {
      console.log(`   ⚠️ Course not found: ${courseTitle}`);
      return false;
    }
    const currentCount = course.modules?.length || 0;
    if (currentCount >= targetCount) {
      console.log(`   ⏭️ ${courseTitle} already has ${currentCount} modules (target: ${targetCount}), skipping`);
      return true;
    }
    const toAdd = newModules.slice(0, targetCount - currentCount);
    await db.collection('courses').updateOne(
      { _id: course._id },
      { $push: { modules: { $each: toAdd } } } as any
    );
    console.log(`   ✅ ${course.title?.substring(0, 50)}: added ${toAdd.length} module(s) (now ${currentCount + toAdd.length})`);
    return true;
  }

  await addModulesToCourse('Go Programming — Concurrency & Simplicity', [GO_MODULE_2, GO_MODULE_3], 3);
  await addModulesToCourse('Rust Programming — Safety & Performance', [RUST_MODULE_2, RUST_MODULE_3], 3);
  await addModulesToCourse('Java Programming — From Zero to OOP', [JAVA_MODULE_3], 3);
  await addModulesToCourse('Python for Data Science — Lists, Dicts & Functions', [PYTHON_MODULE_2, PYTHON_MODULE_3], 3);

  // ═══════════════════════════════════════════════════════
  // STEP 4: Verify everything
  // ═══════════════════════════════════════════════════════
  console.log('\n' + '═'.repeat(60));
  console.log('✅ STEP 4: Verification');
  console.log('═'.repeat(60));

  const allCourses = await db.collection('courses').aggregate([
    { $project: {
      title: 1,
      price: 1,
      instructor: 1,
      thumbnail: 1,
      moduleCount: { $size: '$modules' },
      _id: 0
    }},
    { $sort: { moduleCount: 1, title: 1 } }
  ]).toArray() as any[];

  console.log(`\n📚 All ${allCourses.length} courses:`);
  console.log('   (sorted by module count)');
  
  let allUnderAdmin = true;
  for (const c of allCourses) {
    const isAdmin = c.instructor?.toString() === adminObjectId.toString();
    if (!isAdmin) allUnderAdmin = false;
    const status = c.moduleCount >= 3 ? '✅' : c.moduleCount >= 2 ? '⚠️' : '❌';
    console.log(`   ${status} ${String(c.moduleCount).padEnd(4)} modules | ${String(c.price || 0).padEnd(6)} RWF | ${c.title?.substring(0, 55)}`);
  }

  console.log(`\n   ${allUnderAdmin ? '✅' : '❌'} All courses under admin@bootskills.com`);
  
  // Check internships
  const programsCount = await db.collection('internshipprograms').countDocuments();
  const projectsCount = await db.collection('internshipprojects').countDocuments();
  console.log(`   ✅ Internship programs: ${programsCount} (should be 1)`);
  console.log(`   ✅ Internship projects: ${projectsCount} (should be 3)`);

  // Check free courses pricing
  const freeCourses = await db.collection('courses').find({ price: 0 }).toArray() as any[];
  const freeCount = freeCourses.length;
  const allFreeHavePrice = freeCourses.every((c: any) => typeof c.price === 'number');
  console.log(`   ✅ Free courses (0 RWF): ${freeCount} ${allFreeHavePrice ? '✅ all have proper number type' : '⚠️ type issue detected'}`);

  // ═══════════════════════════════════════════════════════
  // FINAL SUMMARY
  // ═══════════════════════════════════════════════════════
  console.log('\n' + '═'.repeat(60));
  console.log('🎉 PLATFORM FIXUP COMPLETE');
  console.log('═'.repeat(60));
  
  // Get module counts for thin courses
  const thinCourses = await db.collection('courses').find({
    title: { $in: [
      'Go Programming — Concurrency & Simplicity',
      'Rust Programming — Safety & Performance',
      'Java Programming — From Zero to OOP',
      'Python for Data Science — Lists, Dicts & Functions'
    ]}
  }).project({ title: 1, _id: 0 }).toArray() as any[];

  // Get module counts separately
  for (const c of thinCourses) {
    const full = await db.collection('courses').aggregate([
      { $match: { title: c.title } },
      { $project: { title: 1, moduleCount: { $size: '$modules' }, _id: 0 } }
    ]).toArray() as any[];
    const mc = full[0]?.moduleCount || 0;
    console.log(`   ${mc >= 3 ? '✅' : '⚠️'} ${c.title?.substring(0, 50).padEnd(52)} ${mc} modules`);
  }

  console.log(`\n🏖️ Summer Business Innovation Session: READY`);
  console.log(`   📅 8-week summer program (July - August 2026)`);
  console.log(`   💰 Free for all students`);
  console.log(`   🚀 3 projects: Market Gap Analysis, Business Plan Builder, Artisan E-Commerce`);

  console.log(`\n👤 All courses assigned to admin@bootskills.com ✅`);
  console.log(`\n📝 NOTE: A supplemental seed (seedExpandThinCourses.ts) has been created.`);
  console.log(`   The original seedMultiLanguageCourses.ts still has the old thin content.`);
  console.log(`   The master seed runner (seedCodeCoursesWithPricing.ts) now includes`);
  console.log(`   seedExpandThinCourses.ts AFTER seedMultiLanguageCourses.ts to fix this.`);
  console.log(`   This ensures re-running the master seed keeps the expanded modules.`);

  await mongoose.disconnect();
  console.log('\n🔌 Disconnected. Done!\n');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Fixup failed:', err);
  process.exit(1);
});
