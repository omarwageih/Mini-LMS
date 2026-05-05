async function testAuth() {
    try {
        console.log("--- Testing Login ---");
        const loginRes = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'ahmed@std.mini.edu.eg',
                password: '123456'
            })
        });
        const loginData = await loginRes.json();
        
        if (!loginRes.ok) {
            console.error("Login Failed:", loginData);
            process.exit(1);
        }

        console.log("Login Success!");
        console.log("Token:", loginData.token.substring(0, 20) + "...");
        console.log("User Type:", loginData.user.UserType);

        const token = loginData.token;

        console.log("\n--- Testing Course List (Student) ---");
        // Endpoint was /api/student/courses, not /api/student/my-courses
        const coursesRes = await fetch('http://localhost:3000/api/student/courses', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const coursesData = await coursesRes.json();
        
        if (!coursesRes.ok) {
            console.error("Get Courses Failed:", coursesData);
            process.exit(1);
        }
        
        console.log(`Found ${coursesData.length} courses`);
        if (coursesData.length > 0) {
            console.log("First Course:", coursesData[0].Name);
        }

        process.exit(0);
    } catch (err) {
        console.error("Test Error:", err.message);
        process.exit(1);
    }
}
testAuth();
