var girigiri = true;

// Dependencies
var Midifile = require("./jasmid/midifile.js");
var Rcon = require("./node-rcon.js").newHandle;
var fs = require("fs");
var readline = require('readline');

// Preferences
var config = require("./config.js");

// Initialize connection

var rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

// Global instances
var mc = new Rcon();
var midi = null;
var seq = [];

// Execution aliases
var requestQ = [];
var e = function(cmd, callback) {
	// Shorthand execution
	mc.sendCommand(cmd, callback);
}

var q = function(cmd, callback) {
	// Shorthand queued execution
	requestQ.push({cmd: cmd, callback: callback});
	if (requestQ.length==1) {
		callFromQ();
	}
}

var callFromQ = function() {
	// Queueing
	if (requestQ.length>0) {
		e(requestQ[0].cmd, function(err, response) {
			if (requestQ[0].callback) {
				requestQ[0].callback(err, response);
			}
			requestQ.shift();
			callFromQ();
		});
	}
}

// Get MIDI file it (Entry)
function getMidiFile() {
	rl.question("Standard MIDI File (.mid) to play: ", function(answer) {
		try {
			var data = fs.readFileSync(answer);
		} catch(e) {
			console.error("Could not load file.");
			console.error(e.toString());
			console.log("Try again or Ctrl-C to quit.");
			return getMidiFile();
		}
		// file loaded, parse that
		console.log("Processing midi...");
		var t = "";
		for (var i=0; i<data.length; i++) {
			t += String.fromCharCode(data[i] & 255);
		}
		try {
			midi = Midifile(t);
		} catch(e) {
			console.error("Could not parse midi.");
			console.error(e.toString());
			console.log("Try again or Ctrl-C to quit.");
			return getMidiFile();
		}

		if (midi.header.formatType != 1) {
			console.error("MIDI Type not supported. Expect 1, got "+midi.header.formatType);
			console.log("Try again or Ctrl-C to quit.");
			return getMidiFile();
		};
		// All success, now process the midi
		return processMidi();
	});
}

// Merge, align midi events. etc
function processMidi() {
	var ptr = []; // iteration pointer per track
	seq = []; // merged result

	// convert delta time to accumulative time
	for (var t in midi.tracks) {
		ptr.push(0); // Irrelevant to the calculation, just initialize ptr

		current_width.push(0);

		var tick = 0;
		var width = 0, maxwidth = 0;
		for (var i in midi.tracks[t]) {
			if (midi.tracks[t][i].type=="channel" && midi.tracks[t][i].subtype =="noteOn" && midi.tracks[t][i].deltaTime == 0) {
				width++;
				if (width>maxwidth) {
					maxwidth = width;
				}
			} else {
				width = 1;
			}

			tick += midi.tracks[t][i].deltaTime;
			midi.tracks[t][i].time = tick;
			//delete midi.tracks[t][i].deltaTime;
			midi.tracks[t][i].track = parseInt(t); // Still need to keep track of the track
		}
		channel_width[t] = maxwidth;
		console.log("Width for track "+t+" is "+maxwidth);
	}

	// Merge the tracks
	var time = 0;
	while(true) {
		// 'Pop' front
		var minTrack = 0;
		for (var t in midi.tracks) {
			if (!midi.tracks[t][ptr[t]]) {
				if (minTrack == t) {
					// In case a prior tracks are shorter, assign the default minTrack to a latter one
					minTrack++;
				}
				continue;
			}
			if (midi.tracks[t][ptr[t]].time < midi.tracks[minTrack][ptr[minTrack]].time) { minTrack = t; }
		}
		if (minTrack==midi.tracks.length) {
			// No tracks have events left
			break;
		}
		seq.push(midi.tracks[minTrack][ptr[minTrack]]);
		ptr[minTrack]++;
	}

	// Regenerate deltatime
	var prevTime = 0;
	for (var i=0; i<seq.length; i++) {
		seq[i].deltaTime = seq[i].time-prevTime;
		prevTime = seq[i].time;

		if (!tempo && seq[i].type=="meta" && seq[i].subtype =="setTempo") {
			tempo = seq[i].microsecondsPerBeat/1000;
		}
	}

	fs.writeFileSync("dump.json", JSON.stringify(seq, null, '\t'));

	// Done, connect to minecraft
	return login();
}

// MC initialize
function login() {
	// Get
	console.log("[!IMPORTANT!] Make sure you are connecting to a NEW, EMPTY map. MCSynth can mess up your world, players and preferences FROM THE MOMENT OF CONNECTION. NEVER connect to an existing map, like a survival savefile or creative project!");
	rl.question("RCON password for "+config.minecraft.host+":"+config.minecraft.port+" : ", function(answer) {
		// Try connect!
		mc.connect(config.minecraft.host, config.minecraft.port, answer, onConnect);
	});
}

// MC entry point
function onConnect(err, response) {
	if (err) {
		console.error("Cannot establish RCON connection.");
		console.error(err.toString());
		console.log("Try again or Ctrl-C to quit.");
		return login();
	};
	// Entry
	console.log("RCON Connected.");
	console.log("Please return to your minecraft world!");
	q("say Hello! This is MCSynth.");
	//q("say In order to prevent chat being spammed, all OPs will be revoked while giving everyone creative");

	mcInit();
}

// MCInit: initialize all players
function mcInit() {
	var users = [];
	q("list", function(err, response) {
		// Get a list of players
		var list = response.data.split("players online:")[1];
		list.split(",").forEach(function(val) {
			var username = val.trim();
			users.push(username);
		//	q("deop "+username);
		});

		if (users.length == 0) {
			rl.question("say Nobody is on the server right now, please log on to your server and press Enter to retry...", function() {
				mcInit();
			});
			return;
		};

		// q("gamemode c @a");
		// Make sure we can fetch the data
		q("gamerule sendCommandFeedback true");

		// Done. Now determine the primary user
		if (users.length==1) {
			q('tell '+users[0]+' Only you are on the server. Ready to go!', function() {
				selectPrimaryUser(users[0]);
			});
		} else {
			q("say Multiple players found on the server.");
			q('tellraw @a ["",{"text":"[Rcon] If you are the player who invoked MCSynth, "},{"text":"please CLICK HERE.","bold":true,"clickEvent":{"action":"run_command","value":"/setblock ~ ~ ~ glowstone"},"hoverEvent":{"action":"show_text","value":{"text":"","extra":[{"text":"Click to launch MCSynth"}]}}}]', function() {
				promptPrimaryUser();
			});

		}
	});
}

// In-game prompt to determine the primary user
function promptPrimaryUser() {
	q("execute @a ~ ~ ~ testforblock ~ ~ ~ glowstone", function(err, response) {
		if (err) {
			console.error(err);
			setTimeout(promptPrimaryUser, 1000);
			return;
		}
		var glowstones = [];
		var pattern = new RegExp("Successfully found the block at (.*),(.*),(.*)");
		response.data.split(".").forEach(function(val) {
			var matches = pattern.exec(val);
			if (matches) {
				var c = [
					parseInt(matches[1]),
					parseInt(matches[2]),
					parseInt(matches[3])
				];
				q("setblock "+c.join(" ")+" air");
				glowstones.push(c);
			}
		});
		if (glowstones.length == 1) {
			// Unique glowstone pinpointed.
			q("tp @p["+glowstones[0].join(",")+"] ~ ~ ~", function(err, response) {
				if (err) {
					console.error(err);
					return setTimeout(promptPrimaryUser, 1000);
				}
				var pattern = new RegExp("(.*) to (.*), (.*), (.*)");
				var mstusers = [];
				response.data.split("Teleported ").forEach(function(val) {
					var matches = pattern.exec(val);
					if (matches) {
						mstusers.push(matches[1]);
					}
				});
				if (mstusers.length == 1) {
					// Everything matched!
					q('tellraw '+mstusers[0]+' "You are now master user. MCSynth will now begin."', function() {
						selectPrimaryUser(mstusers[0]);
					});
				}
				// Multiple players in the same glowstone?
			});
		} else {
			// Multiple glowstones found
			q("", function(){setTimeout(promptPrimaryUser, 1000);});
		}
	});
}

// Begin the creation program with certain user
var mcuser = false;
function selectPrimaryUser(user) {
	mcuser = user;
//	q("say "+user+" is now interacting with MCSynth");
	rl.question("MCSynth > ", function(answer) {
		switch(answer.toLowerCase()) {
			case "preview":
				preview();
				break;
			case "render":
				render();
				return;
			case "help":
				console.log("preview: play only");
				console.log("render: Write to commandblocks");
				console.log("help: this message");
				console.log("exit: quit program");
				break;
			case "exit":
				process.exit();
		}
		selectPrimaryUser(user);
	});
}

// Iterating thru midi events
var ptr = 0;
var starttime = 0;
var vol = [];
var pan = [];
var channel_width = [];
var tempo = 0; // millisec per beat
var rate = 0; // ticks per beat
var timesig = {};
var keysig = {};
var instrument = [];
var overrideParams = true;
var direction = "x+";
var realtime = 0;

// Play unit
function playMidiEvent(ptr) {
	var evt = seq[ptr];
	// Execute current
	switch(evt.type) {
		case "meta":
			processMeta(evt);
			break;
		case "channel":
			if (evt.subtype=="noteOn") {
				playsound(evt);
			} else {
				processChannel(evt);
			}
			break;
	}
	if (seq[ptr+1]) {
		// If there exists a subsequent event, call it
		if (seq[ptr+1].deltaTime == 0) {
			// Simultaneos, do not wait
			playMidiEvent(ptr+1);
		} else {
			// SetTimeout
			realtime += seq[ptr+1].deltaTime/rate*tempo;
			setTimeout(function(){
				playMidiEvent(ptr+1);
			}, starttime + realtime - new Date().getTime());
		}
	} else {
		console.log("[Debug] Preview ended.");
		q("tellraw "+mcuser+' "[Debug] Preview Ended."');
		// mc.end();
		process.exit();
	}
}

var current_width = [];

// Place unit
function placeMidiEvent(ptr) {
	var scheduleNext = false;

	var evt = seq[ptr];

	if (!evt) {
		q("say Done!");
		return;
	}

	// Check for block position change
	if (evt.deltaTime != 0) {
		var deltaBlock = Math.floor((realtime+evt.deltaTime)/rate*tempo/50) - Math.floor(realtime/rate*tempo/50);
		if (deltaBlock > 0) {
			// Move forward blocks
			if (Math.floor(x/16) < Math.floor((x+deltaBlock)/16) ) {
				// Move forward chunks
				var	x_beg = Math.floor(x/16) * 16 + 16,
					x_end = Math.floor((x+deltaBlock)/16) * 16 + 16 - 1;

				// Clear out the area
				fill("barrier", x_beg, y, z, x_end+1, y+15, z+15);
				fill("air", x_beg, y+1, z+1, x_end, y+14, z+14);

				// Floor the area
				fill("planks 2", x_beg, y+4, z, x_end, y+5, z+15);
				fill("stained_glass", x_beg, y+5, z+1, x_end, y+5, z+14);
				fill("birch_fence", x_beg, y+6, z, x_end, y+6, z);
				fill("birch_fence", x_beg, y+6, z+15, x_end, y+6, z+15);

				// Clock command blocks
				fill("command_block 0 replace {Command:\"fill ~1 ~ ~1 ~1 ~ ~14 redstone_block\"}", x_beg, y+4, z, x_end, y+4, z);
				fill("command_block 0 replace {Command:\"fill ~ ~ ~-1 ~ ~ ~-14 planks 2\"}", x_beg, y+4, z+15, x_end, y+4, z+15);

				// Running track
				fill("barrier", x_beg, y+8, z+6, x_end, y+9, z+9);
				fill("air", x_beg, y+9, z+7, x_end, y+9, z+8);

				// Decorations
				for (var x_mark = x_beg; x_mark <= x_end; x_mark+=16) {
					console.log('Init chunk at '+x_mark);
					setblock("acacia_fence", x_mark, y+7, z);
					setblock("acacia_fence", x_mark, y+7, z+15);
					setblock("glowstone", x_mark, y+8, z);
					setblock("glowstone", x_mark, y+8, z+15);

					setblock("acacia_fence", x_mark, y+6, z);
					setblock("acacia_fence", x_mark, y+6, z+15);
					setblock("acacia_fence", x_mark+4, y+6, z);
					setblock("acacia_fence", x_mark+4, y+6, z+15);
					setblock("acacia_fence", x_mark+8, y+6, z);
					setblock("acacia_fence", x_mark+8, y+6, z+15);
					setblock("acacia_fence", x_mark+12, y+6, z);
					setblock("acacia_fence", x_mark+12, y+6, z+15);
				}
				scheduleNext = true;
				q("tp "+mcuser+" "+x_beg+" ~ ~", function() {
					placeMidiEvent(ptr+1);
				});
			}
			if (ptr == 0) {
				// Starting point

				// Clear out the area
				fill("barrier", x, y, z, x+15, y+15, z+15);
				fill("air", x, y+1, z+1, x+15, y+14, z+14);

				// Floor the area
				fill("planks 2", x, y+4, z, x+15, y+5, z+15);
				fill("stained_glass", x, y+5, z+1, x+15, y+5, z+14);
				fill("birch_fence", x, y+6, z, x+15, y+6, z);
				fill("birch_fence", x, y+6, z+15, x+15, y+6, z+15);

				// Setup tripwire to start
				setblock("planks 2", x+16, y+6, z);
				setblock("planks 2", x+16, y+6, z+15);
				setblock("command_block 0 replace {Command:\"fill ~ ~-1 ~1 ~ ~-1 ~14 redstone_block\"}", x+16, y+5, z);
				setblock("tripwire_hook 0", x+16, y+6, z+1);
				setblock("tripwire_hook 2", x+16, y+6, z+14);
				fill("quartz_block", x+16, y+5, z+1, x+16, y+5, z+14);
				fill("tripwire", x+16, y+6, z+2, x+16, y+6, z+13);
			}
			x += deltaBlock;
			for (var i = 0; i < current_width.length; i++) {
				current_width[i]=0;
			}
		}
		realtime += evt.deltaTime;
	}

	// Execute current
	//console.log(evt);
	switch(evt.type) {
		case "meta":
			processMeta(evt);
			break;
		case "channel":
			if (evt.subtype=="noteOn") {
				var z_pos = z+1;
				for (var i=0; i<evt.track; i++) {
					z_pos += channel_width[i];
				}
				z_pos += current_width[evt.track];
				current_width[evt.track]++;
				placesound(evt, x, y+5, z_pos);
			} else {
				processChannel(evt);
			}
			break;
	}
	if (!scheduleNext) {
		placeMidiEvent(ptr+1);
	}
}

// MidiEvent processor
// Meta parser (timesig, keysig, tempo)
function processMeta(evt) {
	switch(evt.subtype) {
		case "timeSignature":
			timesig = evt;
			break;
		case "keySignature":
			keysig = evt;
			break;
		case "setTempo":
			tempo = evt.microsecondsPerBeat/1000;
//			console.log("Set tempo:"+tempo);
			break;
	}
}

// Non-noteOn channel parse (vol, pan)
function processChannel(evt) {
	if (evt.controllerType) {
		switch(evt.controllerType) {
			case 10: // Pan
				pan[evt.track] = evt.value;
				break;
			case 7: // Vol
				vol[evt.track] = evt.value;
				break;
		}
	} else if (evt.programNumber) {
		instrument[evt.track] = evt.programNumber;
	}
}

// Play it to minecraft
function playsound(evt) {
	q(generatePlaysoundCmd(evt)); //TODO
}

function placesound(evt, x, y, z) {
	var cmd = setblock("command_block 0 replace {Command:\""+generatePlaysoundCmd(evt)+"\"}", x, y, z);
	console.log("Place: "+x+" "+y+" "+z);
}

function fill(block, x1, y1, z1, x2, y2, z2) {
	q("fill "+x1+" "+y1+" "+z1+" "+x2+" "+y2+" "+z2+" "+block);
}

function setblock(block, x, y, z) {
	q("setblock "+x+" "+y+" "+z+" "+block);
	return "setblock "+x+" "+y+" "+z+" "+block;
}

// Utilities to generate the /playsound command
function generatePlaysoundCmd(evt) {
	var cmd = "execute @a ~ ~ ~ playsound <sound> @p ~ ~ ~ [volume] [pitch] [minimumVolume]";
	var note = evt.noteNumber;
	var scope = Math.floor(note/12);// TODO
	var pitch = [0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1, 1.05, 1.1, 1.2, 1.25, 1.32][note%12];

	// Volume and panning
	var volume = 1.0;
	var volumemin = 1.0;
	if (!config.MIDI.ignoreVol) {
		volume = vol[evt.track]/128;
		volumemin = vol[evt.track]/96;
//		console.log(evt.track+"@"+volume);
	}

	if (girigiri) {
		volume = [0, 72, 64, 128][evt.track]/128;
		volumemin = volume;
	}

	volume *= evt.velocity/96; // Reflect velocity into volume (longer = louder)

	var panx = 0;
	var panz = 0;
	if (!config.MIDI.ignorePan) {
		volume *= 1.5; // compensate for the distance penalty caused by panning
		switch(direction) {
			case "x+":
				panz = (pan[evt.track]-64)/8;
				break;
			case "x-":
				panz = (64-pan[evt.track])/8;
				break;
			case "z+":
				panx = (64-pan[evt.track])/8;
				break;
			case "z-":
				pany = (pan[evt.track]-64)/8;
				break;
		}
	}

	// Soundfont
	var soundname = "note."+config.MCSynth.instrumentMapping["*"];
	if (config.MCSynth.instrumentMapping[instrument[evt.track]]) {
		soundname = "note."+ config.MCSynth.instrumentMapping[instrument[evt.track]];
	}
	soundname += ".";
	soundname += scope;

	if (girigiri && evt.track == 3) {
		// Render as drum (Minecraft sound)
		var drum_mapping = {
			"4/9": "random.explode",	// A2	significant light
			"4/1": "random.explode",	// C#2	significant light
			"4/0": "mob.irongolem.hit",	// C2	significant heavy
			"3/11": "mob.irongolem.hit",	// B1	significant heavy
			"3/10": "mob.blaze.hit",		// A#1  floating light sound `mob.blaze.hit`
			"3/8": "random.orb", // Or click?	// G#1  floating light sound `dig.glass`
			"3/7": "random.eat",		// G1
			"3/6": "random.orb",		// F#1  floating light sound `random.click`
			"3/4": "mob.irongolem.hit",	// E1
			"3/2": "game.player.hurt",	// D1	major lighter
			"3/0": "dig.grass", // C1	major heavier
			"2/10": "random.break"		// A#0
		};
		soundname = drum_mapping[scope+"/"+note%12];
		// soundname = "";
		pitch = 1;
		switch (soundname) {
			case "mob.blaze.hit":
				volume *= 0.8;
				break;
			case "random.click":
			case "random.orb":
				volume *= 0.7;
				break;
			case "random.explode":
				volume *= 2.5;
				break;
			case "dig.grass":
				volume *= 1.4;
				break;
			case "game.player.hurt":
				volume *= 0.8;
				break;
		}
	}

	var cmd = "execute @a ~ ~ ~ playsound "+soundname+" @p ~"+panx+" ~ ~"+panz+" "+volume+" "+pitch/*+" "+volumemin*/;
	console.log(cmd);
	return cmd;
}

// Preview Entry
function preview() {
	console.log("[Debug] Start Preview...");
	q('tellraw '+mcuser+' "[Debug] Start preview"');
	rate = midi.header.ticksPerBeat;
	realtime = 0;
	for (var i=0; i<=midi.header.trackCount; i++) {
		vol[i] = 128;
		pan[i] = 128;
		instrument = 0;
	}
	starttime = new Date().getTime();
	playMidiEvent(0);
}

// Write to blocks

var x, y, z, gametick;

function render() {
	q("tp "+mcuser+" ~ ~ ~", function(err, response) {
		if (err) {
			console.error(err);
			return setTimeout(promptPrimaryUser, 1000);
		}
		var pattern = new RegExp("(.*) to (.*), (.*), (.*)");
		var mstusers = [];
		var result = pattern.exec(response.data);
		rate = midi.header.ticksPerBeat;
		seq[0].deltaTime = rate*4;
		x = Math.floor(result[2]);
		y = Math.floor(result[3]);
		z = Math.floor(result[4]);
		x -= x % 16;
		y -= y % 16;
		z -= z % 16;
		gametick = 0;
		realtime = 0;
		for (var i=0; i<=midi.header.trackCount; i++) {
			vol[i] = 128;
			pan[i] = 128;
			instrument = 0;
		}
		console.log("Render start");
		placeMidiEvent(0);
	});
}

// Finalize
function onDisconnect() {
	// Exit
	rl.close();
	process.exit();
}


// Main entry!!!
getMidiFile();
