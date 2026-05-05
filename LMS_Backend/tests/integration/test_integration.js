async function testIntegrationFlow() {
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
        console.log("=== Phase 6: Full Integration Testing (Standardized) ===");

        // 1. Student Login
        const studentAuth = await login('ahmed@std.mini.edu.eg', '123456');
        const studentToken = studentAuth.token;
        console.log("Logged in as Student Ahmed");

        // 2. Get Student Assignments
        const assignmentsRes = await fetch(`${baseUrl}/student/assignments`, {
            headers: { Authorization: `Bearer ${studentToken}` }
        });
        const assignments = await assignmentsRes.json();
        const assignment = assignments.find(a => a.Status === 'Pending');
        
        let targetAssignmentId;

        if (!assignment) {
            console.log("No pending assignments found for student. Checking for already submitted one to re-grade if needed...");
            const submitted = assignments.find(a => a.Status === 'Submitted');
            if (!submitted) throw new Error("No assignments found at all.");
            targetAssignmentId = submitted.AssignmentID;
        } else {
            targetAssignmentId = assignment.AssignmentID;
            console.log(`Found pending assignment: ${assignment.Title} (ID: ${targetAssignmentId})`);

            // 3. Submit Assignment
            const submitRes = await fetch(`${baseUrl}/student/assignments/submit`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${studentToken}`
                },
                body: JSON.stringify({
                    assignmentId: targetAssignmentId,
                    submissionContent: "This is my test submission content from the integration test."
                })
            });
            const submitData = await submitRes.json();
            if (!submitRes.ok && !submitData.message.includes('already submitted')) {
                throw new Error(`Submission failed: ${JSON.stringify(submitData)}`);
            }
            console.log("Assignment submitted successfully (or was already submitted)!");
        }

        // 4. Assistant Login
        const asstAuth = await login('bilal@mini.edu.eg', '123456');
        const asstToken = asstAuth.token;
        console.log("Logged in as Assistant Bilal");

        // 5. Get Submissions to Grade
        const subsRes = await fetch(`${baseUrl}/assistant/submissions`, {
            headers: { Authorization: `Bearer ${asstToken}` }
        });
        const submissions = await subsRes.json();
        const mySub = submissions.find(s => s.StudentName === 'Ahmed Ali' && s.AssignmentID === targetAssignmentId);
        
        if (!mySub) {
            throw new Error(`Student submission for assignment ${targetAssignmentId} not found in Assistant list.`);
        }
        console.log(`Found submission to grade: ID ${mySub.SubmissionID} for Assignment ${targetAssignmentId}`);

        // 6. Grade Submission (using standardized submissionId)
        const gradeRes = await fetch(`${baseUrl}/assistant/submissions/grade`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${asstToken}`
            },
            body: JSON.stringify({
                submissionId: mySub.SubmissionID,
                score: 19.5
            })
        });
        const gradeData = await gradeRes.json();
        if (!gradeRes.ok) throw new Error(`Grading failed: ${JSON.stringify(gradeData)}`);
        console.log("Submission graded successfully with score 19.5!");

        // 7. Student checks grade
        const finalAssignmentsRes = await fetch(`${baseUrl}/student/assignments`, {
            headers: { Authorization: `Bearer ${studentToken}` }
        });
        const finalAssignments = await finalAssignmentsRes.json();
        const gradedAssign = finalAssignments.find(a => a.AssignmentID === targetAssignmentId);
        console.log(`Student Assignment Status: ${gradedAssign.Status}, Score: ${gradedAssign.Score}`);

        if (gradedAssign.Score == 19.5) {
            console.log("\n✅ Integration Flow OK: Standardized Submission and Grading works!");
        } else {
            console.log("\n❌ Integration Flow Failed: Score mismatch.");
        }

        process.exit(0);
    } catch (err) {
        console.error("\n❌ Integration Test Failed:", err.message);
        process.exit(1);
    }
}
testIntegrationFlow();
