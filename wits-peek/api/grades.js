    import axios from 'axios';

    export default async function handler(req, res) {
        const { studentId, token } = req.query;

        if (!studentId || !token) {
            return res.status(400).json({ error: "Missing Student ID or Auth Token" });
        }

        try {
            
            const response = await axios.get(`https://altwits.vercel.app/api/grade`, {
                params: {
                    studentId: studentId 
                },
                headers: {
                    'Authorization': `Bearer ${token}` 
                }
            });

            return res.status(200).json(response.data);
        } catch (error) {
            console.error("Altwits grades error:", error.response?.data || error.message);
            return res.status(500).json({ 
                error: "Sync failed.",
                details: "Could not fetch grades from proxy."
            });
        }
    }