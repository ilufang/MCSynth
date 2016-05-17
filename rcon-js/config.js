// config.js
// put your customized configuration here

module.exports = {
	// minecraft: Options about interacting with Minecraft
	minecraft: {
		// host: the IP or host of the server to connect to. Use "localhost" for local server
		// port: the port number Minecraft RCON is listening. Defined by rcon.port in server.properties.
		host: "localhost",
		port: 25576
	},

	// MIDI: Options about pre-processing MIDI sequence
	MIDI: {
		// ignorePan: whether the pan setting (L/R balance) should be ignored (output to L and R equally).
		// Only set to true if the MIDI itself is flawed and you have difficulty editing that
		ignorePan: true,

		// ignorePan: whether the volume setting (L/R balance) should be ignored (output to L and R equally).
		// Only set to true if the MIDI itself is flawed and you have difficulty editing that
		ignoreVol: false
	},

	// MCSynth: Options about playing/building MIDI in Minecraft
	MCSynth: {
		// instrumentMapping: which soundfont should be used for each MIDI instrument
		instrumentMapping: {
			// Format: <Midi Program ID>: "<MCSynth soundfont>",
			// Example: Acoustic Grand Piano (MIDI program ID 0) -> "piano"
			0: "piano",

			// Add your rules HERE (ID is from 0-127)

			// Default: if the ID is not mapped, use the following soundfont
			"*": "piano"
		},

		// style: control the blocks used in building
		style: {
			// border: the case and track
			border: "barrier",

			// floor: the surface
			floor: "stained_glass 0",

			// base: the default block. Must be solid, opaque
			base: "plank 2",

			// fence: the decorative side border
			fence: "birch_fence",

			// beatMark: override the fence at every beat
			// Set to false to disable
			beatMark: "dark_oak_fence",

			// barMark: place a signal (default looks like a lamp post) every bar
			// Set to false to disable
			barMark: "glowstone",

			// barSplitter: override the floor at every bar
			// Set to false to disable
			barSplitter: "stained_glass 4",

			// startLine: blocks for the starting line structure
			startLine: "quartz_block 1"
		},

		// scheme: which structure should be used. Possible values
		// "path": Nice looking, single-layered path. For simple MIDIs (max 16 simultanoes notes). Recommend Mormal world.
		// "layered": Layered version of "path". For MIDIs slightly more complex that "path" can handle (max 158 simultanoes notes). Recommend Normal world
		// "chunk": Maximize space usage and sacrifice appearance. For complex MIDIs (symphony/black, max 192 simultanoes notes). Recommend Superflat world
		// Note: MCSynth can put down this number of notes DOES NOT mean your Minecraft can play all of them perfectly. Please consider your configuration.
		scheme: "path",

		// timing: whether commandblock positioning should be beat-based or time-based
		// "beat": synchronize the beats to the Minecraft gametick. BPM will be overriden to the nearest possible values.
		// "time": approximate the original event to the nearest gametick. Best restoration but may cause slight noticeable inaccuracy
		timing: "beat"
	}
}
