import type { QuestionnairePayload } from "./questionnaire.ts";

export const ENCRYPTION_KEY_VERSION = 1;
export const PAYLOAD_SCHEMA_VERSION = 1;
export const VALIDATION_SCHEMA_VERSION = 1;

const ENCRYPTION_KEY_SECRET = "COWORKER_DATA_ENCRYPTION_KEY_V1";
const PESEL_HMAC_KEY_SECRET = "COWORKER_PESEL_HMAC_KEY_V1";
const KEY_LENGTH_BYTES = 32;
const IV_LENGTH_BYTES = 12;
const TAG_LENGTH_BITS = 128;

export interface QuestionnaireCryptoKeys {
  encryptionKey: CryptoKey;
  peselHmacKey: CryptoKey;
}

export interface EncryptedQuestionnaire {
  ciphertextBase64: string;
  ivBase64: string;
}

export class CryptoConfigurationError extends Error {
  constructor() {
    super("Invalid cryptographic configuration.");
    this.name = "CryptoConfigurationError";
  }
}

export class CryptoOperationError extends Error {
  constructor() {
    super("Questionnaire cryptographic operation failed.");
    this.name = "CryptoOperationError";
  }
}

export async function loadQuestionnaireCryptoKeys(): Promise<
  QuestionnaireCryptoKeys
> {
  const encryptionKeyBytes = readSecretKey(ENCRYPTION_KEY_SECRET);
  const peselHmacKeyBytes = readSecretKey(PESEL_HMAC_KEY_SECRET);

  if (bytesEqual(encryptionKeyBytes, peselHmacKeyBytes)) {
    throw new CryptoConfigurationError();
  }

  try {
    const [encryptionKey, peselHmacKey] = await Promise.all([
      crypto.subtle.importKey(
        "raw",
        encryptionKeyBytes,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"],
      ),
      crypto.subtle.importKey(
        "raw",
        peselHmacKeyBytes,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
      ),
    ]);

    return { encryptionKey, peselHmacKey };
  } catch {
    throw new CryptoConfigurationError();
  }
}

export async function encryptQuestionnaire(
  payload: QuestionnairePayload,
  userId: string,
  keys: QuestionnaireCryptoKeys,
): Promise<EncryptedQuestionnaire> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES));
  const plaintext = new TextEncoder().encode(JSON.stringify(payload));
  const additionalData = createAdditionalData(userId);

  try {
    const encrypted = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
        additionalData,
        tagLength: TAG_LENGTH_BITS,
      },
      keys.encryptionKey,
      plaintext,
    );

    return {
      ciphertextBase64: encodeBase64(new Uint8Array(encrypted)),
      ivBase64: encodeBase64(iv),
    };
  } catch {
    throw new CryptoOperationError();
  }
}

export async function decryptQuestionnaire(
  ciphertextBase64: string,
  ivBase64: string,
  userId: string,
  keys: QuestionnaireCryptoKeys,
): Promise<unknown> {
  try {
    const ciphertext = decodeBase64(ciphertextBase64);
    const iv = decodeBase64(ivBase64);
    if (ciphertext.length < 17 || iv.length !== IV_LENGTH_BYTES) {
      throw new CryptoOperationError();
    }

    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv,
        additionalData: createAdditionalData(userId),
        tagLength: TAG_LENGTH_BITS,
      },
      keys.encryptionKey,
      ciphertext,
    );

    const json = new TextDecoder("utf-8", { fatal: true }).decode(decrypted);
    return JSON.parse(json) as unknown;
  } catch (error) {
    if (error instanceof CryptoOperationError) {
      throw error;
    }
    throw new CryptoOperationError();
  }
}

export async function createPeselHmacBase64(
  pesel: string,
  keys: QuestionnaireCryptoKeys,
): Promise<string> {
  try {
    const signature = await crypto.subtle.sign(
      "HMAC",
      keys.peselHmacKey,
      new TextEncoder().encode(pesel),
    );
    return encodeBase64(new Uint8Array(signature));
  } catch {
    throw new CryptoOperationError();
  }
}

function readSecretKey(name: string): Uint8Array<ArrayBuffer> {
  const encoded = Deno.env.get(name);
  if (encoded === undefined || encoded === "") {
    throw new CryptoConfigurationError();
  }

  try {
    const decoded = decodeBase64(encoded);
    if (decoded.length !== KEY_LENGTH_BYTES) {
      throw new CryptoConfigurationError();
    }
    return decoded;
  } catch (error) {
    if (error instanceof CryptoConfigurationError) {
      throw error;
    }
    throw new CryptoConfigurationError();
  }
}

function createAdditionalData(userId: string): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode(
    `coworker-questionnaire|${userId}|payloadSchema=${PAYLOAD_SCHEMA_VERSION}|keyVersion=${ENCRYPTION_KEY_VERSION}`,
  );
}

function decodeBase64(value: string): Uint8Array<ArrayBuffer> {
  const compact = value.replace(/[\t\n\r ]/g, "");
  if (
    compact === "" ||
    compact.length % 4 !== 0 ||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
      compact,
    )
  ) {
    throw new Error("Invalid Base64.");
  }

  const binary = atob(compact);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function encodeBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function bytesEqual(
  left: Uint8Array<ArrayBuffer>,
  right: Uint8Array<ArrayBuffer>,
): boolean {
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ right[index];
  }
  return difference === 0;
}
