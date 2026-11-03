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

本仓库的源码和配置采用 MIT 许可证。Three.js 与 three.quarks 分别遵循各自的许可证。

在线试验场位于 `docs/`，适用 [PolyForm Noncommercial 1.0.0](docs/LICENSE)，署名见 [NOTICE](docs/NOTICE)。上面的两个模块继续适用根目录的 [MIT 许可证](LICENSE)。

## 完整资源库

- [可搜索特效目录](特效目录.html)和[机器可读索引](特效索引.json)。克隆后打开目录页可搜索和预览。
- [效果源码与源工程](01_开源特效/)包括 244 项 PixelFX 效果、Effekseer 样例、Godot 着色器和 OpenGameArt 法术序列。
- [导出样例](02_导出样例/)含六组 PixelFX 透明图集和元数据。[贴图素材](03_贴图素材/)含 Kenney 粒子、烟雾、光照遮罩与 OpenGameArt 光束。
- [星隙法术试验场](spell-lab/)引用本仓库的素材，可切换 14 种命中特效。启动方式见其 README，原创源码采用 [PolyForm Noncommercial 1.0.0](spell-lab/LICENSE)。
- [查找与更新指南](特效查找与更新指南.md)说明如何登记、验证和同步新增效果。

## 素材许可与引用

第三方素材与源码适用各自目录的许可及署名声明。推荐在项目文档或制作人员名单中写上「特效库参考——Game VFX Library · 光之十一」，并链接到[仓库](https://github.com/shixi-11/game-vfx-library)。再分发 MIT 代码时须保留对应版权和许可声明。使用具体素材时，请同时查阅该素材的授权和署名要求。
