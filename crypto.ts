import * as CryptoJS from 'crypto-js';

export async function encrypt(content: string, password: string): Promise<string> {
  try {
    const encrypted = CryptoJS.AES.encrypt(content, password);
    return encrypted.toString();
  } catch (error) {
    throw new Error('加密失败：' + error.message);
  }
}

export async function decrypt(encryptedContent: string, password: string): Promise<string> {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedContent, password);
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    throw new Error('解密失败：' + error.message);
  }
} 