// config.js
// put your customized configuration here

module.exports = {
	// minecraft: Options about interacting with Minecraft
	minecraft: {
		// host: the IP or host of the server to connect to. Use "localhost" for local server
		// port: the port number Minecraft RCON is listening. Defined by rcon.port in server.properties.
		host: "localhost",
		port: 25575
	},

	// MIDI: Options about pre-processing MIDI sequence
	MIDI: {
		// ignorePan: whether the pan setting (L/R balance) should be ignored (output to L and R equally).
		// Only set to true if the MIDI itself is flawed and you have difficulty editing that
		ignorePan: true,

		// ignorePan: whether the volume setting (L/R balance) should be ignored (output to L and R equally).
		// Only set to true if the MIDI itself is flawed and you have difficulty editing that
		ignoreVol: true
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
		}

	}
}
