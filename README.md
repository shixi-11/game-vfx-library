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
