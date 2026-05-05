require('dotenv').config();
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:3000/api';
let tokens = {};
let mockIds = {};

const logResult = (name, res, expected, actual, data) => {
    if (expected.includes(res.status)) {
        console.log(`✅ [PASS] ${name} (Status: ${res.status})`);
    } else {
        console.error(`❌ [FAIL] ${name} (Expected: ${expected}, Got: ${res.status})`);
        if (data) console.error(data);
    }
};

const uniqueId = Date.now();

async function runTests() {
    console.log("=== STARTING FULL QA API TESTS ===");

    console.log("\n--- Auth & Setup ---");
    // Get JWT Secret
    const secret = process.env.JWT_SECRET || 'mini-lms-super-secret-jwt-key-cse301-spring2026';
    
    // We already have instructor ID 1. Let's create a Student via API so we test the flow.
    const std = { fullName: "QA Student", email: `std${uniqueId}@test.com`, password: "Password123!", userType: "Student", academicYear: 3, major: "CS", gpa: 3.5, studentCode: `ST${uniqueId}` };
    
    // Register Student
    let res = await fetch(`${BASE_URL}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(std) });
    let data = await res.json();
    logResult("Register Student", res, [200, 201], res.status, data);

    // Login Student
    let r2 = await (await fetch(`${BASE_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: std.email, password: std.password }) })).json();
    tokens.std = r2.token;
    mockIds.std = r2.user.UserID;

    // Manually create Instructor token
    tokens.inst = jwt.sign({ id: 1, email: 'dr@mini.edu.eg', type: 'Instructor' }, secret, { expiresIn: '1h' });
    mockIds.inst = 1;
    
    console.log("✅ Users ready.");

    console.log("\n--- Core Flow ---");
    // Create Course
    res = await fetch(`${BASE_URL}/instructor/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokens.inst}` },
        body: JSON.stringify({ name: `QA Course ${uniqueId}`, maxMarks: 100 })
    });
    data = await res.json();
    logResult("Create Course", res, [200, 201], res.status, data);
    
    // Fetch courses
    res = await fetch(`${BASE_URL}/instructor/courses`, { headers: { 'Authorization': `Bearer ${tokens.inst}` } });
    data = await res.json();
    console.log("Courses:", data);
    mockIds.course = data[data.length - 1].CourseID || data[data.length - 1].courseId || data[data.length - 1].id;
    console.log("Using Course ID:", mockIds.course);

    // Enroll Student
    res = await fetch(`${BASE_URL}/instructor/students/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokens.inst}` },
        body: JSON.stringify({ studentId: mockIds.std, courseId: mockIds.course })
    });
    logResult("Enroll Student", res, [200], res.status, await res.json());

    // Create Assignment
    res = await fetch(`${BASE_URL}/instructor/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokens.inst}` },
        body: JSON.stringify({ courseId: mockIds.course, title: "QA Assignment", maxScore: 50, deadline: "2028-01-01" })
    });
    logResult("Create Assignment", res, [200, 201], res.status, await res.json());

    // Student Fetch Course Content
    res = await fetch(`${BASE_URL}/student/courses/${mockIds.course}/content`, { headers: { 'Authorization': `Bearer ${tokens.std}` } });
    logResult("Student View Course Content", res, [200], res.status, await res.json());

    console.log("\n--- Discussions Flow ---");
    res = await fetch(`${BASE_URL}/student/discussions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokens.std}` },
        body: JSON.stringify({ courseId: mockIds.course, title: "QA Post", content: "Does this work?" })
    });
    logResult("Student Create Post", res, [200, 201], res.status, await res.json());

    res = await fetch(`${BASE_URL}/instructor/discussions/${mockIds.course}`, { headers: { 'Authorization': `Bearer ${tokens.inst}` } });
    data = await res.json();
    logResult("Instructor View Posts", res, [200], res.status, data);

    console.log("\n=== QA API TESTS COMPLETE ===");
}

runTests().catch(console.error);
