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
		}
	}
}
