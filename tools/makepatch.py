# 用法：python3 tools/makepatch.py <底本.html> <新复盘.html> <底本日期 YYYY-MM-DD> <底本版本号 v> <输出.json>
# 生成差异包：只记录新复盘与底本不同的行。App 收到后用本机（或从 GitHub 取回的）底本拼出完整页面，并校验长度和哈希。
# 底本 = 已推送的某份完整复盘解密后的原文（即推送时加密的那份 HTML，去掉联网字体后的版本）。
# 生成后再用 tools/encrypt.mjs 加密这个 .json，按原流程推送。
import difflib, json, sys

def fnv(s):
    h = 0x811c9dc5
    b = s.encode('utf-16-le')
    for i in range(0, len(b), 2):
        h ^= b[i] | (b[i + 1] << 8)
        h = (h * 0x01000193) & 0xffffffff
    return h

def u16len(s):
    return len(s.encode('utf-16-le')) // 2

def make(base, new, base_id, bv):
    a, b = base.split('\n'), new.split('\n')
    sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
    ops = [[i1, i2, b[j1:j2]] for tag, i1, i2, j1, j2 in sm.get_opcodes() if tag != 'equal']
    return {"base": base_id, "bv": bv, "ops": ops, "len": u16len(new), "h": fnv(new)}

def apply(base, p):
    lines = base.split('\n')
    for i1, i2, nl in sorted(p['ops'], key=lambda o: -o[0]):
        lines[i1:i2] = nl
    out = '\n'.join(lines)
    assert u16len(out) == p['len'] and fnv(out) == p['h'], '校验失败'
    return out

if __name__ == '__main__':
    bf, nf, bid, bv, of = sys.argv[1:6]
    base = open(bf, encoding='utf-8').read()
    new = open(nf, encoding='utf-8').read()
    p = make(base, new, bid, bv)
    assert apply(base, p) == new  # 生成后立即还原自检
    open(of, 'w', encoding='utf-8').write(json.dumps(p, ensure_ascii=False, separators=(',', ':')))
    print(f'差异包 {len(p["ops"])} 处改动，已通过还原自检')
