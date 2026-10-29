// 用法：node tools/encrypt.mjs <复盘.html> <日期 YYYY-MM-DD> [仓库根目录]
// 只需要仓库里公开的 key.json（公钥），不需要密码。
// 输出 reports/<日期>.enc.json（头信息）和 reports/<日期>/0.txt… （密文分段），并更新 reports/index.json。
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
const { subtle } = globalThis.crypto;
const getRandomValues = (a) => globalThis.crypto.getRandomValues(a);

const [, , htmlPath, id, rootArg] = process.argv;
if (!htmlPath || !/^\d{4}-\d{2}-\d{2}$/.test(id || "")) {
  console.error("用法: node tools/encrypt.mjs <file.html> <YYYY-MM-DD> [repoRoot]");
  process.exit(1);
}
const root = rootArg || ".";
const b64 = (u8) => Buffer.from(u8).toString("base64");

const key = JSON.parse(readFileSync(join(root, "key.json"), "utf8"));
const pub = await subtle.importKey("jwk", key.publicKey, { name: "RSA-OAEP", hash: "SHA-256" }, false, ["encrypt"]);

const html = readFileSync(htmlPath);
const body = gzipSync(html, { level: 9 });
const aes = await subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt"]);
const iv = getRandomValues(new Uint8Array(12));
const ct = new Uint8Array(await subtle.encrypt({ name: "AES-GCM", iv }, aes, body));
const raw = new Uint8Array(await subtle.exportKey("raw", aes));
const ek = new Uint8Array(await subtle.encrypt({ name: "RSA-OAEP" }, pub, raw));

// 密文切成小段（每段 PART 个字符），方便逐个上传、逐个核对
const PART = 6000, ctb = b64(ct), parts = [];
for (let i = 0; i < ctb.length; i += PART) parts.push(ctb.slice(i, i + PART));
const dir = join(root, "reports", id);
rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
parts.forEach((p, i) => writeFileSync(join(dir, `${i}.txt`), p));
const out = { v: 1, z: 1, id, ek: b64(ek), iv: b64(iv), n: parts.length };
writeFileSync(join(root, "reports", `${id}.enc.json`), JSON.stringify(out));

const idxPath = join(root, "reports", "index.json");
// index.json 每项带版本号 v（=本次加密的 iv），App 据此判断同一天的复盘是否更新过
const old = existsSync(idxPath) ? JSON.parse(readFileSync(idxPath, "utf8")) : [];
const idx = old.map(x => typeof x === "string" ? { id: x, v: null } : x).filter(x => x.id !== id);
idx.push({ id, v: out.iv });
idx.sort((a, b) => (a.id < b.id ? 1 : -1));
writeFileSync(idxPath, JSON.stringify(idx, null, 0) + "\n");
console.log(`已加密 ${id}（${html.length} 字节 → ${ct.length} 字节）`);
