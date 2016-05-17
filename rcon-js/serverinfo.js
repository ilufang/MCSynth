var RCon = require("./node-rcon").newHandle;
var rcon = new RCon;

var data = {
	online: false
};

rcon.connect("localhost", 25576, "rcon", function(err, response) {
	if (err) {
		exit();
	}
	data.online = true;

	pendingCount++;
	rcon.sendCommand("time query daytime", function(err, response) {
		if (err) {
			data.time = false;
			return;
		};
		var time = /Time is (\d+)/.exec(response.data)[1];
		data.time = time%24000;
		jobCompleted();
	});

	pendingCount++;
	rcon.sendCommand("tp @a ~ ~ ~", function(err, response) {
		data.players = {};
		if (err) {
			return;
		}
		// Teleported test to -126.9588283892156, 63.0, 236.81694456301688
		var users = response.data.split("Teleported ");
		users.forEach(function(val) {
			try {
			var parts = /(\w+) to ((\-|[0-9]|\.)*), ((\-|[0-9]|\.)*), ((\-|[0-9]|\.)*)/.exec(val);
			data.players[parts[1]] = [parseFloat(parts[2]), parseFloat(parts[4]), parseFloat(parts[6])];
		}catch(e){}
		});
		jobCompleted();
	});
	jobIssued();
});

var pendingCount = 0;
var issued = false;
function jobCompleted() {
	pendingCount--;
	if (pendingCount==0) {
		exit();
	};
}
function jobIssued() {
	issued = true;
	if (pendingCount == 0) {
		exit();
	};
}

function exit() {
	console.log(JSON.stringify(data));
	rcon.end();
	process.exit();
}

