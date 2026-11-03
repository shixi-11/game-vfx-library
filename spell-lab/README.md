# 星隙 · 法术试验场

原版命中和 14 种新效果可在底部「命中特效」切换。选择效果后点击晶石、按空格或开启自动演示。四种贴图效果和十组透明法术序列均直接引用上一级的素材目录。序列按每秒 24 帧预览。

检出整个 `shared-assets/game-effects` 目录，保留 `spell-lab` 与素材目录的相对位置。有现成依赖时直接复用，首次准备环境可在本目录运行 `pnpm install --frozen-lockfile`。随后运行 `pnpm build` 和 `pnpm preview`，打开 http://127.0.0.1:5187/。Windows 也可运行本目录的 `启动工具箱.ps1`。按 Ctrl+C 停止本地预览。

素材来源与许可保存在各资源目录。使用 Kenney 贴图、Mikodrak 的法术序列及 Rawdanitsu 的光束。
