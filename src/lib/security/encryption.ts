import crypto from 'crypto';

/**
 * Utilidad de encriptación para datos sensibles (API Keys)
 * Usa AES-256-CBC con una clave de 32+ bytes definida en ENCRYPTION_KEY.
 * Si la variable no está definida, el proceso falla al arrancar — intencional.
 */

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error(
      '[SIPO] ENCRYPTION_KEY no está definida en las variables de entorno. ' +
      'Genera una clave segura con: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  const buf = Buffer.from(key, 'hex');
  if (buf.length < 32) {
    throw new Error(
      '[SIPO] ENCRYPTION_KEY debe tener al menos 32 bytes (64 caracteres hexadecimales).'
    );
  }
  return buf.subarray(0, 32);
}

const ENCRYPTION_KEY_BUF = getEncryptionKey();

/**
 * Encripta un texto plano
 */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY_BUF, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

/**
 * Desencripta un texto cifrado
 */
export function decrypt(text: string): string {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY_BUF, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}
