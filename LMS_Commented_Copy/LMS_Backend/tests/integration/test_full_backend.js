async function testFullSystem() {
    const baseUrl = 'http://localhost:3000/api';
    
    async function login(email, password) {
        const res = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(`Login failed for ${email}: ${JSON.stringify(data)}`);
        return data;
    }

    try {
        console.log("=== Phase 4: Backend Testing ===");

        // 1. Instructor Test
        console.log("\n--- Instructor Flow ---");
        const instrAuth = await login('dr@mini.edu.eg', '123456');
        console.log("Logged in as Instructor:", instrAuth.user.FullName);
        const instrToken = instrAuth.token;

        const instrCoursesRes = await fetch(`${baseUrl}/instructor/my-courses`, {
            headers: { Authorization: `Bearer ${instrToken}` }
        });
        const instrCourses = await instrCoursesRes.json();
        console.log(`Instructor has ${instrCourses.length} courses`);

        // 2. Student Test
        console.log("\n--- Student Flow ---");
        const studentAuth = await login('ahmed@std.mini.edu.eg', '123456');
        console.log("Logged in as Student:", studentAuth.user.FullName);
        const studentToken = studentAuth.token;

        const studentCoursesRes = await fetch(`${baseUrl}/student/courses`, {
            headers: { Authorization: `Bearer ${studentToken}` }
        });
        const studentCourses = await studentCoursesRes.json();
        console.log(`Student has ${studentCourses.length} enrolled courses`);

        // 3. Assistant Test
        console.log("\n--- Assistant Flow ---");
        const asstAuth = await login('bilal@mini.edu.eg', '123456');
        console.log("Logged in as Assistant:", asstAuth.user.FullName);
        const asstToken = asstAuth.token;

        // Fixed endpoint: /api/assistant/courses
        const asstCoursesRes = await fetch(`${baseUrl}/assistant/courses`, {
            headers: { Authorization: `Bearer ${asstToken}` }
        });
        const asstCourses = await asstCoursesRes.json();
        console.log(`Assistant is assigned to ${asstCourses.length} courses`);

        console.log("\n✅ Backend Basic Flow OK");
        process.exit(0);
    } catch (err) {
        console.error("\n❌ Test Failed:", err.message);
        process.exit(1);
    }
}
testFullSystem();
