# 超短复盘

手机上的离线复盘 App。网址：https://xiongdada424.github.io/fupan/

- `reports/` 里的复盘都是加密的（RSA-OAEP 3072 + AES-GCM），没有密码打不开。
- `key.json` 里是公钥，以及用密码加密过的私钥（PBKDF2-SHA256，60 万次）。
- App 第一次打开时输入密码，解出私钥并保存在本机（不可导出），之后自动拉取、解密、离线保存。

## 每天新增一份复盘（给 Claude 的步骤）

1. 下载本仓库的 `key.json`、`reports/index.json`、`tools/encrypt.mjs`、`tools/makepatch.py`。
2. 默认推送差异包，不推整页（整页里约三分之二是每天重复的页面代码）：
   `python3 tools/makepatch.py <底本.html> <新复盘.html> <底本日期> <底本版本号v> patch.json`
   底本为当前底本日期那份完整复盘的原文；版本号 v 取 `reports/index.json` 里该日期的 v。
3. `node tools/encrypt.mjs patch.json <YYYY-MM-DD> <仓库根目录>`（整页时把 patch.json 换成复盘 .html），加密只用公钥，不需要密码。
4. 把生成的 `reports/<日期>.enc.json`、`reports/<日期>/` 下的分段文件推到 `main` 分支；分段和头文件都用 blob sha 核对无误后，最后再推 `reports/index.json`。

### 底本规则

- 当前底本：`2026-10-29`（完整复盘，v = rFwv5Cpe9wotHXkE）。
- 底本推送后不能再改。若必须改底本，依赖它的差异包要全部重推。
- 页面模板（样式、程序）大改时，推一份新的完整复盘作为新底本，并更新上面这行。
- 数据精简：个股卡片的普通公告每只最多 2 条；“逐日”里的首板只写数量，不重复列名单。

不要把明文复盘或密码提交到本仓库。
