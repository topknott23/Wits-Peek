import axios from 'axios';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const { studentId, password } = req.body;

    try {
        // Route the request to the working proxy
        const response = await axios.post('https://altwits.vercel.app/api/login', {
            studentId: studentId, // Altwits expects this key
            password: password
        });

        // Send their decrypted, working response back to your frontend
        return res.status(200).json(response.data);
    } catch (error) {
        console.error("Altwits login error:", error.response?.data || error.message);
        return res.status(401).json({ message: "Invalid ID or Password" });
    }
}