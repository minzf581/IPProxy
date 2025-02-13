import CryptoJS from 'crypto-js';

// 调试开关
const DEBUG = import.meta.env.DEV;

// 调试日志函数
const debug = {
  log: (...args: any[]) => {
    if (DEBUG) {
      console.log(...args);
    }
  }
};

/**
 * 对密码进行哈希处理
 * @param password 原始密码
 * @returns 哈希后的密码
 */
export async function hashPassword(password: string): Promise<string> {
  return CryptoJS.SHA256(password).toString();
}

/**
 * 验证密码是否匹配
 * @param password 原始密码
 * @param hashedPassword 哈希后的密码
 * @returns 是否匹配
 */
export function verifyPassword(password: string, hashedPassword: string): boolean {
  const hash = CryptoJS.SHA256(password).toString();
  return hash === hashedPassword;
}

/**
 * 加密
 * @param text 要加密的文本
 * @param key 密钥
 * @returns 加密后的 Base64 字符串
 */
export function encrypt(text: string, key: string): string {
  try {
    if (import.meta.env.DEV) {
      console.log('\n=== Encryption Details ===');
      console.log('Input text:', text);
      console.log('Key:', key);
    }
    
    // 1. 验证输入
    if (!text || !key) {
      throw new Error('Missing required parameters');
    }

    // 2. 使用密钥的前16字节作为 IV
    const iv = CryptoJS.enc.Utf8.parse(key.slice(0, 16));
    if (import.meta.env.DEV) {
      console.log('IV (hex):', iv.toString());
      console.log('IV (base64):', CryptoJS.enc.Base64.stringify(iv));
    }
    
    // 3. 转换密钥为 WordArray（使用完整密钥）
    const keyBytes = CryptoJS.enc.Utf8.parse(key);
    if (import.meta.env.DEV) {
      console.log('Key bytes (hex):', keyBytes.toString());
      console.log('Key bytes (base64):', CryptoJS.enc.Base64.stringify(keyBytes));
    }
    
    // 4. 转换明文为 WordArray
    const textBytes = CryptoJS.enc.Utf8.parse(text);
    if (import.meta.env.DEV) {
      console.log('Text bytes (hex):', textBytes.toString());
      console.log('Text bytes (base64):', CryptoJS.enc.Base64.stringify(textBytes));
    }

    // 5. 加密（使用 CBC 模式）
    const encrypted = CryptoJS.AES.encrypt(text, keyBytes, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    // 6. 获取密文的不同格式
    const ciphertext = encrypted.ciphertext;
    if (import.meta.env.DEV) {
      console.log('Ciphertext (hex):', ciphertext.toString());
      console.log('Ciphertext (base64):', CryptoJS.enc.Base64.stringify(ciphertext));
    }

    // 7. 获取最终的 Base64 结果
    const result = encrypted.toString();
    if (import.meta.env.DEV) {
      console.log('Final result (base64):', result);
      console.log('Validation:', {
        input: text,
        inputLength: text.length,
        result: result,
        resultLength: result.length,
        isBase64: /^[A-Za-z0-9+/=]+$/.test(result)
      });
      console.log('=== End Encryption ===\n');
    }

    return result;
  } catch (error) {
    console.error('[Encryption Error]:', error);
    throw error;
  }
}

/**
 * 解密
 * @param ciphertext 加密后的 Base64 字符串
 * @param key 密钥
 * @returns 解密后的文本
 */
export function decrypt(ciphertext: string, key: string): string {
  try {
    // 1. 验证输入
    if (!ciphertext || !key) {
      throw new Error('Missing required parameters');
    }

    // 2. 验证 Base64 格式
    if (!(/^[A-Za-z0-9+/=]+$/.test(ciphertext))) {
      throw new Error('Invalid Base64 format');
    }

    // 3. 使用密钥的前16字节作为 IV
    const iv = CryptoJS.enc.Utf8.parse(key.slice(0, 16));
    
    // 4. 转换密钥为 WordArray（使用完整密钥）
    const keyBytes = CryptoJS.enc.Utf8.parse(key);
    
    // 5. 解密
    const decrypted = CryptoJS.AES.decrypt(ciphertext, keyBytes, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    // 6. 转换为字符串
    const result = decrypted.toString(CryptoJS.enc.Utf8);

    // 7. 验证结果
    if (!result) {
      throw new Error('Decryption failed');
    }

    // 8. 记录日志
    if (import.meta.env.DEV) {
      console.log('[Decryption]', {
        input: ciphertext,
        inputLength: ciphertext.length,
        result: result,
        resultLength: result.length
      });
    }

    return result;
  } catch (error) {
    console.error('[Decryption Error]:', error);
    throw error;
  }
}

// 运行测试
if (import.meta.env.DEV) {
  const testMessage = '{"type":"info","timestamp":"1704794999"}';
  const testKey = 'AK20241120145620';
  
  console.log('\n=== Running encryption test ===');
  const encrypted = encrypt(testMessage, testKey);
  console.log('Encrypted:', encrypted);
  
  console.log('\n=== Running decryption test ===');
  const decrypted = decrypt(encrypted, testKey);
  console.log('Decrypted:', decrypted);
  
  if (decrypted === testMessage) {
    console.log('\n✅ Test passed: encryption/decryption cycle works');
  } else {
    console.error('\n❌ Test failed: decrypted text does not match original');
    console.log('Original:', testMessage);
    console.log('Decrypted:', decrypted);
  }
}
