// 一次性：生成密钥对，私钥用密码加密后写进 key.json。
// 用法：node tools/keygen.mjs <密码> [仓库根目录]
import { writeFileSync } from "node:fs";
import { join } from "node:path";
const { subtle } = globalThis.crypto;
const getRandomValues = (a) => globalThis.crypto.getRandomValues(a);
const [, , password, rootArg] = process.argv;
if (!password) { console.error("需要密码"); process.exit(1); }
const b64 = (u8) => Buffer.from(u8).toString("base64");
const ITER = 600000;

const kp = await subtle.generateKey(
  { name: "RSA-OAEP", modulusLength: 3072, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
  true, ["encrypt", "decrypt"]);
const publicKey = await subtle.exportKey("jwk", kp.publicKey);
const pkcs8 = new Uint8Array(await subtle.exportKey("pkcs8", kp.privateKey));

const salt = getRandomValues(new Uint8Array(16));
const iv = getRandomValues(new Uint8Array(12));
const base = await subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
const kek = await subtle.deriveKey({ name: "PBKDF2", salt, iterations: ITER, hash: "SHA-256" }, base,
  { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
const ct = new Uint8Array(await subtle.encrypt({ name: "AES-GCM", iv }, kek, pkcs8));

const out = { v: 1, publicKey, wrapped: { kdf: "PBKDF2-SHA256", iter: ITER, salt: b64(salt), iv: b64(iv), ct: b64(ct) } };
writeFileSync(join(rootArg || ".", "key.json"), JSON.stringify(out, null, 1) + "\n");
console.log("key.json 已生成");
