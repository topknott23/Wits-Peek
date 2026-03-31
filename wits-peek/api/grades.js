import axios from 'axios';
import crypto from 'crypto';

// THE SECRET KEY FROM GIAN
const ENCRYPTION_KEY = 'anotherUniqueSuperSecretKeyEnrollmentAdmin123';

/**
 * Decrypts the AES-256-CBC encrypted payload from CIT-U
 * hashing the ENCRYPTION_KEY with SHA-256 to get the correct key length for AES-256
 */
function decrypt(encryptedData) {
    try {
        const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
        const iv = Buffer.from(ENCRYPTION_KEY.substring(0, 16));
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        
        let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        
        return JSON.parse(decrypted);
    } catch (e) {
        console.error("Decryption Error:", e.message);
        throw new Error("Failed to unscramble grade data.");
    }
}

export default async function handler(req, res) {
    const { studentId, token } = req.query;

    if (!studentId || !token) {
        return res.status(400).json({ error: "Missing Student ID or Auth Token" });
    }
    
    // Batch '24 Computer Science students use Department ID 10000 hhahsdhahdahhda
    const departmentId = "10000";

    try {
        const response = await axios.get(
            `https://rg-cit-u-staging-004-wa-014.azurewebsites.net/api/studentgradefile/student/${studentId}/department/${departmentId}`, 
            {
                headers: {
                    'Host': 'rg-cit-u-staging-004-wa-014.azurewebsites.net',
                    // THESE ARE THE "DEPT_HMAC" VALUES FROM CLIENT.POF - THE "SECRET HANDSHAKE"
                    'X-Hmac-Signature': 'f1115b87040eadf2be6e1147b4bc39d1a00aeaabe4219e7e1e58a919d04347a0',
                    'X-Hmac-Nonce': '1767017574579-5022',
                    'X-Hmac-Salt': '/1XUM3R3RqnqmFlZB+XyXA==',
                    'Authorization': `Bearer ${token}`,
                    'X-Origin': 'studentportal',
                    // User-Agent must match the environment where the HMAC was originally captured
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
                    'Origin': 'https://student.cituwits.com',
                    'Referer': 'https://student.cituwits.com/',
                    'Accept': 'application/json, text/plain, */*'
                }
            }
        );

        let data = response.data;

        
        if (typeof data === 'string' && data.length > 50) {
            data = decrypt(data);
        }

        return res.status(200).json(data);

    } catch (error) {
        console.error("API_SYNC_ERROR:", error.response?.status, error.response?.data || error.message);
        
        return res.status(error.response?.status || 500).json({ 
            error: "Sync failed.",
            details: "The school server rejected the fingerprint or the token has expired."
        });
    }
}