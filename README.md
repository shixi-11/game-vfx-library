# Game VFX Library

[打开在线特效试验场](https://shixi-11.github.io/game-vfx-library/) · 五种原创 Canvas 特效，可点击施放或开启自动演示。

游戏特效库 · 可复用的实时游戏特效代码与示例配置。

- `spells.js` 提供三种法术的颜色、速度、尺寸和冲击强度配置。
- `spark-system.js` 提供一次性的命中火花粒子系统，使用 Three.js 和 three.quarks。

```js
import { SPELLS } from './spells.js';
import { createSparkSystem } from './spark-system.js';

const sparks = createSparkSystem(SPELLS[0], material);
```

由宿主场景提供材质，将发射器加入场景和粒子渲染器，并在粒子播放结束后清理实例。使用示例配置时可直接导入 `spells.js`。

## 完整资源库

- [可搜索特效目录](特效目录.html)和[机器可读索引](特效索引.json)。克隆后打开目录页可搜索和预览。
- [效果源码与源工程](01_开源特效/)包括 244 项 PixelFX 效果、Effekseer 样例、Godot 着色器和 OpenGameArt 法术序列。
- [导出样例](02_导出样例/)含六组 PixelFX 透明图集和元数据。[贴图素材](03_贴图素材/)含 Kenney 粒子、烟雾、光照遮罩与 OpenGameArt 光束。
- [星隙法术试验场](spell-lab/)引用本仓库的素材，可切换 14 种命中特效。启动方式见其 README，原创源码采用 [MIT](spell-lab/LICENSE)。
- [查找与更新指南](特效查找与更新指南.md)说明如何登记、验证和同步新增效果。

## 许可与引用

仓库自有源码和示例配置采用 [MIT](LICENSE)。[在线试验场](docs/LICENSE)与[星隙法术试验场](spell-lab/LICENSE)的原创源码同样采用 MIT。第三方源码、素材及其导出样例分别适用各自目录的许可及署名声明。使用具体素材前，请查看其目录中的许可证与来源说明。

分发 MIT 代码的副本或实质性部分时，须保留原版权声明与 MIT 许可声明。也欢迎在项目 README、致谢或制作人员名单中注明来源，可直接复制下面这行 Markdown。

```markdown
特效来源：[Game VFX Library](https://github.com/shixi-11/game-vfx-library) · 光之十一
```
