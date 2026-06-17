import CryptoJS from "crypto-js";

const SECRET_KEY = "chatup-e2e-secret-key";

export const encryptText = (text) => {
    if (!text) return text;
    return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
};

export const decryptText = (encryptedData) => {
    if (!encryptedData) return encryptedData;
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        return decrypted || encryptedData;
    } catch (e) {
        return encryptedData;
    }
};

export const decryptMessageObj = (msg) => {
    if (!msg) return msg;
    const decrypted = { ...msg };
    if (decrypted.type === "text") {
        decrypted.content = decryptText(decrypted.content);
    }
    if (decrypted.replyTo && decrypted.replyTo.content) {
        decrypted.replyTo = {
            ...decrypted.replyTo,
            content: decryptText(decrypted.replyTo.content)
        };
    }
    return decrypted;
};
