# 超短复盘

手机上的离线复盘 App。网址：https://xiongdada424.github.io/fupan/

- `reports/` 里的复盘都是加密的（RSA-OAEP 3072 + AES-GCM），没有密码打不开。
- `key.json` 里是公钥，以及用密码加密过的私钥（PBKDF2-SHA256，60 万次）。
- App 第一次打开时输入密码，解出私钥并保存在本机（不可导出），之后自动拉取、解密、离线保存。

## 每天新增一份复盘（给 Claude 的步骤）

1. 下载本仓库的 `key.json`、`reports/index.json`、`tools/encrypt.mjs`。
2. `node tools/encrypt.mjs <复盘.html> <YYYY-MM-DD> <仓库根目录>`，加密只用公钥，不需要密码。
3. 把生成的 `reports/<日期>.enc.json`、`reports/<日期>/` 下的分段文件、更新后的 `reports/index.json` 推到 `main` 分支（分段可分几次推，推完用 blob sha 核对）。

不要把明文复盘或密码提交到本仓库。
