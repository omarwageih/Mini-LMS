const { sql, poolPromise } = require('../config/dbConfig');

/**
 * Mock AI implementation for demonstration
 * In production, replace with real API calls to Gemini/OpenAI
 */
const getAIResponse = async (userMessage, userRole, fullName) => {
    // Role-specific personas
    const instructorPersona = `You are the MUST-Instructor-AI assistant. You help instructors like ${fullName} manage their courses, generate quiz questions, and analyze student performance. Be professional, concise, and academic.`;
    const studentPersona = `You are the MUST-Student-AI tutor. You help students like ${fullName} understand course materials, track deadlines, and provide study guides. Be encouraging, helpful, and clear.`;

    const persona = userRole === 'Student' ? studentPersona : instructorPersona;

    // Simulate AI delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simple keyword-based logic for mock
    const msg = userMessage.toLowerCase();
    if (msg.includes('hello') || msg.includes('hi')) return `Hello ${fullName}! I am your AI ${userRole === 'Student' ? 'Tutor' : 'Assistant'}. How can I help you today?`;
    if (msg.includes('deadline')) return "You have a project deadline for CSE301 coming up this Sunday. Would you like me to create a study plan?";
    if (msg.includes('grade') || msg.includes('score')) return userRole === 'Student' ? "Your average grade is currently 3.4. Keep up the good work!" : "I can help you review recent submissions. Should I summarize the class average for Project Phase 2?";
    if (msg.includes('quiz')) return userRole === 'Student' ? "There is a new quiz available on Databases. Good luck!" : "I can help you generate 5 MCQ questions on Normalization. Should I proceed?";

    return `I understand you're asking about "${userMessage}". As your MUST ${userRole} AI, I'm here to help. Currently, I'm in demonstration mode, but I can already help with general course information!`;
};

exports.chat = async (req, res) => {
    try {
        const { message } = req.body;
        const { id, UserType, FullName } = req.user;

        // 1. Get response from AI
        const response = await getAIResponse(message, UserType, FullName);

        // 2. Save history to DB
        const pool = await poolPromise;
        
        // Save user message
        await pool.request()
            .input('UserID', sql.Int, id)
            .input('Role', sql.NVarChar, 'user')
            .input('Message', sql.NVarChar, message)
            .query('INSERT INTO ChatHistory (UserID, Role, Message) VALUES (@UserID, @Role, @Message)');

        // Save AI response
        await pool.request()
            .input('UserID', sql.Int, id)
            .input('Role', sql.NVarChar, 'model')
            .input('Message', sql.NVarChar, response)
            .query('INSERT INTO ChatHistory (UserID, Role, Message) VALUES (@UserID, @Role, @Message)');

        res.status(200).json({ response });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'AI Service Error' });
    }
};

exports.getHistory = async (req, res) => {
    try {
        const { id } = req.user;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('UserID', sql.Int, id)
            .query('SELECT TOP 50 Role as role, Message as content, Timestamp FROM ChatHistory WHERE UserID = @UserID ORDER BY Timestamp ASC');
        
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
