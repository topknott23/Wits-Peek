import axios from 'axios';
import crypto from 'crypto';

const ENCRYPTION_KEY = 'anotherUniqueSuperSecretKeyEnrollmentAdmin123';

function encrypt(data) {
    const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
    const iv = Buffer.from(ENCRYPTION_KEY.substring(0, 16));
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
}

function decrypt(encryptedData) {
    const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
    const iv = Buffer.from(ENCRYPTION_KEY.substring(0, 16));
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const { username, password } = req.body;

    try {
        const loginData = { userId: username, password: password, clientId: '001' };
        const encryptedPayload = encrypt(loginData);

        const response = await axios.post('https://rg-cit-u-staging-004-wa-017.azurewebsites.net/api/User/student/login', 
        { encrypted: encryptedPayload },
        {
            headers: {
                'X-Hmac-Signature': '7b69606c2aacaec8a0cd4bb6bea80fa43cf53504616f2791223a5e9850bfba4f',
                'X-Hmac-Nonce': '1767013065197-6220',
                'X-Hmac-Salt': 'Jf8M9rHMTLXRgrM7X6hdew==',
                'Content-Type': 'application/json;charset=UTF-8',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
                'X-Origin': 'studentportal'
            }
        });

        const loginResult = decrypt(response.data);
        
        return res.status(200).json({
            token: loginResult.token,
            studentId: loginResult.userInfo.studentId
        });
    } catch (error) {
        return res.status(401).json({ message: "Invalid ID or Password" });
    }
}