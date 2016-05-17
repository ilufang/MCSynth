// config.js 中文注释
// 如果您修改了本文件，您必须用其替换config.js使设置生效

module.exports = {
	// minecraft: 与Minecraft本身相关的设置
	minecraft: {
		// host: 要连接的服务器的IP或者地址，本机的服务器请使用"localhost"
		// port: Minecraft RCON的端口，在服务器server.properties下的rcon.port中定义
		host: "localhost",
		port: 25575
	},

	// MIDI: 对MIDI序列的可选处理
	MIDI: {
		// ignorePan: 忽略声道偏移，一律左右声道平衡
		// 请只在Midi文件不正确且不方便修改时开启
		ignorePan: false,

		// ignorePan: 忽略音量/包络线，一律最大音量输出
		// 请只在Midi文件不正确且不方便修改时开启
		ignoreVol: false
	},

	// MCSynth: MCSynth相关设置
	MCSynth: {
		// instrumentMapping: 每个MIDI乐器对应的MCSynth音色资源包。音色资源包必须在Minecraft中开启
		instrumentMapping: {
			// 格式: <Midi乐器ID>: "<音色包名>",
			// 示例: Acoustic Grand Piano (MIDI program ID 0) -> "piano"
			0: "piano",

			// 在此处添加您的映射规则(ID为0-127)

			// 缺省设置: 如果请求的Midi乐器ID未映射，使用以下定义的音色资源包
			"*": "piano"
		},

		// style: 自定义外观方块
		style: {
			// border: 保护用外壳材质
			border: "barrier",

			// floor: 地面材质
			floor: "stained_glass 0",

			// base: 主要方块，不透明的实心方块
			base: "plank 2",

			// fence: 装饰用侧面护栏
			fence: "birch_fence",

			// beatMark: 在每拍的地方使用不同的栏杆进行标记
			// 设置为false禁用此标记
			beatMark: "dark_oak_fence",

			// barMark: 在每小节的地方使用不同的栏杆进行标记
			// 设置为false禁用此标记
			barMark: "glowstone",

			// barSplitter: 在每小结的地方使用不同的地面材质进行标记
			// 设置为false禁用此标记
			barSplitter: "stained_glass 4",

			// startLine: 起始点的材质
			startLine: "quartz_block 1"
		},

		// scheme: 音符命令方块的铺设方法。可选的值如下：
		// "path": 较美观的单层小路。适用于简单的MIDI (最多同时16音符)。便于后期编辑，建议使用标准世界
		// "layered": "path"的多层版本。适用于比path最大复杂度略高的MIDI (最多同时158音符)。后期编辑较困难，建议使用标准世界
		// "chunk": 最大化空间使用而放弃外观。适用于复杂的MIDI (交响多轨/小型黑乐谱, 最多同时192音符). 建议使用超平坦世界
		// 注意：MCSynth可以放置该数量的音符不代表您的Minecraft可以完美播放他们。请根据计算机配置调整视距、MIDI复杂度等
		scheme: "path",

		// timing: MIDI音符的计时方式。可选的值如下
		// "beat": 将乐谱同步到Minecraft的游戏tick。BPM会被近似到最近的可能的值
		// "time": 将MIDI音符按实际时间对齐到最近的游戏tick。还原度较高但可能出现微小的可感知误差
		timing: "beat"
	}
}
