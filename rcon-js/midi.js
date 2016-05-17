#! /usr/bin/env node

var Midifile = require("./jasmid/midifile.js");
var fs = require("fs");
var readline = require('readline');

// Initialize connection

var rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

rl.question("Midifile: ", function(answer) {
	rl.close();
	try {
		var raw = fs.readFileSync(answer);
	} catch(e) {
		console.error(e.toString());
		return;
	}
	var ff = [];
	for (var z = 0; z < raw.length; z++) {
		ff[z] = String.fromCharCode(raw[z] & 255);
	}
	raw = ff.join("");
	var midi = Midifile(raw);
	fs.writeFileSync(answer+".json", JSON.stringify(midi, null, '\t'));
});
