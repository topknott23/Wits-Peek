import CryptoJS from 'crypto-js';


const Yt = "anotherUniqueSuperSecretKeyEnrollmentAdmin123"; 

// 1. Decrypt Grades (Used in App.jsx)
export const decryptGrades = (encryptedData) => {
    try {
        const keyHash = CryptoJS.SHA256(Yt);
        const iv = CryptoJS.enc.Utf8.parse("1234567890123456");

        const decrypted = CryptoJS.AES.decrypt(encryptedData, keyHash, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });

        const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
        return JSON.parse(jsonString);
    } catch (error) {
        console.error("Decryption failed:", error);
        return null;
    }
};

// 2. Generate HMAC Signature (Used in App.jsx)
export const generateHMAC = (nonce, method, salt) => {
    const HMAC_KEY = "ourSuperSecretKeyEnrollmentAdmin123";
    const h = "aP9!vB7@kL3#xY5$zQ2^mN8&dR1*oW6%uJ4(eT0)";
    const message = `${nonce}:studentportal:${method}:${salt}:${h}`;
    return CryptoJS.HmacSHA256(message, HMAC_KEY).toString(CryptoJS.enc.Hex);
};

// 3. Encrypting Data for Login (Used in App.jsx)
export const encryptData = (data) => {
    try {
        const keyHash = CryptoJS.SHA256(Yt);
        const iv = CryptoJS.enc.Utf8.parse(Yt.substring(0, 16));

        const encrypted = CryptoJS.AES.encrypt(data, keyHash, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });

        return encrypted.toString();
    } catch (error) {
        console.error("Encryption failed:", error);
        return null;
    }
};