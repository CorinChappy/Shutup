/*
	Shutup is a game in a series of Stage Technician themed games (StageSoc Games), designed for use
	on the University of Southampton Stage Technicians' Society's website (stagesoc.org.uk).

	
	Copyright (C) 2014  Corin Chaplin
			All files contained herein have this notice unless otherwise stated
			To view all collaborators on this project see the list
			included in this program.

	This program is free software; you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation; either version 2 of the License, or
	(at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License along
	with this program; if not, write to the Free Software Foundation, Inc.,
	51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/

(function(){
"use strict";

/* Import fonts from Google fonts */
window["WebFontConfig"] = {};
window["WebFontConfig"]["google"] = {};
window["WebFontConfig"]["google"]["families"] = [
	'Press+Start+2P::latin' // By: CodeMan38,  http://www.google.com/fonts/#QuickUsePlace:quickUse/Family:Press+Start+2P
];
(function() {
	var wf = document.createElement('script');
	wf.src = ('https:' == document.location.protocol ? 'https' : 'http') +
		'://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js';
	wf.type = 'text/javascript';
	wf.async = 'true';
	var s = document.getElementsByTagName('script')[0];
	s.parentNode.insertBefore(wf, s);
})();

/* Some util functions */
Math.clamp = function(num, min, max){ // Keeps a given number in some bounds
	return Math.max(min, Math.min(num, max));
};
// Vendor prefix independent function to check if the tab/page is hidden
// Adpated from: http://www.html5rocks.com/en/tutorials/pagevisibility/intro/
var pageHidden = (function(){
	var prop = (function(){
		var prefixes = ["webkit","moz","ms","o"];
		if ("hidden" in document) return "hidden";

		for (var i = 0; i < prefixes.length; i++){
			if ((prefixes[i] + "Hidden") in document){
				return prefixes[i] + "Hidden";
			}
		}
		return null;
	})();
	
	if (!prop){
		return function(){return false;};
	}
	return function(){return document[prop];};
})();


/* Implimentation of the Fisher–Yates shuffle to randomise array order */
function shuffle(array){
	var m = array.length, t, i;
	while(m){
		i = Math.floor(Math.random() * m--);
		t = array[m];
		array[m] = array[i];
		array[i] = t;
	}
	return array;
}

/* Game functions */
function startGameloop(){
	// Create gameloop etc.
	var reqAnimFrame = window.requestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		(function(){
			throw new Error("Game not supported in this browser/version: No support for rAF");
		})();
	var last = null;
	var cb = function(ts){
		var dt = Math.min(80, (ts - last))/1000;
		last = ts;
		// Do shizz
		shutup.e.update(dt);
		shutup.e.draw();
		reqAnimFrame(cb);
	};
	reqAnimFrame(function(ts){
		last = ts;
		cb(ts);
	});
}



var shutup = {

	width : 750, height : 600,

	assetDir : "assets/",

	canvas : null, // The canvas object
	ctx : null, // The canvas context

	/* State of the game
	 * -1 = error; 0 = loading; 1 = main menu; 2 = in game; 3 = victory; 4 = failure; 5 = instructions
	*/
	state : 0,

	menuOption : 0, // Currently selected menu option (top to bottom/left to right)

	locked : false, // If locked interaction is disabled


	game : { // Game state references

		time : 0, // Time since game started

		/* Currently displayed menu overlay
		 * 0 = none; 1 = in game menu;
		*/
		menu : 0,

		instructions : true, // Whether to display the instructions

		noiseLevel : 0, // Current noise level

		noiseThreshold : 100, // Level at which the game is lost

		room : null, // Object representing the current composition of the room

		onStage : null // A queue of actors currently on stage (not in play)
	},

	/* Global settings for the game */
	settings : {
		volume : 1 // Volume for sound effects (0-1)

	},
	

	// Helper functions
	h : {
		generateCast : function(num){ // Generates a number of cast memebers 
			num = num || 10;
			// Get array of the actor definitions
			var actors = shuffle(shutup.def.actors.slice(0)),
				doneActors = [],
				offStage = 0.5, // Chance of an actor being in the game
				roomSize = shutup.game.room.size;
			while(num > 0){
				if(actors.length === 0){ // If there are no more unused actors start from the top
					var t = actors;
					actors = shuffle(doneActors);
					doneActors = t;
				}

				var def = actors.pop(),
					act = new shutup.Actor(def);
				if(Math.random() > offStage){
					shutup.game.onStage.push(act);
				}else{
					// Attempt to push into the room until the game allows
					var b = false;
					while(!b){
						b = shutup.game.room.moveActor(act, Math.floor(Math.random()*roomSize.rows), Math.floor(Math.random()*roomSize.cols));
					}
				}
				doneActors.push(def);
				num--;
			}
		},

		timeConvert : function(t, p){ // Takes the time (ms) and converts it into a time of day (p represents need for second presistion)
			var startTime = [19,0];
			// 1 sec = 1 min
			var s = Math.floor(t/1000), // Secs
				hours = Math.floor(s/60),
				mins = s % 60;

			var a = startTime[0]+hours,
				b = startTime[1]+mins;

			a -= 24*Math.floor(a/24);
			b = ((b > 9)?b:(0).toString()+b);

			var m;
			if(a < 12){
				m = "am";
			}else{
				m = "pm";
				a -= 12;
			}


			var str = a + ":" + b;
			if(p){
				str += ":" + ((t%1000)/10).toFixed(0);
			}
			return str + m;
		},

		defaultCan : function(a){
			shutup.ctx.restore();
			shutup.ctx.save();
			if(a % 1 === 0){
				shutup.ctx.font = a+"px 'Press Start 2P' Helvetica";
			}
		}
	},

	e : {
		// Update the bits with respect to time
		update : function(dt){
			if(!shutup.locked){
				// Call the event if a key is held down
				for(var i in shutup.keysDown){
					if(shutup.keyAction[i]){
						shutup.keyAction[i].call(shutup, dt);
					}
				}
			}

			switch(shutup.state){
				case 2 : { // IN GAME

					if(shutup.game.menu !== 2){ // Do not update on pause/game menu
						shutup.e.tick(dt); // Update the timer
					
						// Check for winning conditions
						if(shutup.game.time > 180000){ // 210000ms = 210s = 3.5 minutes = 3.5 hours in gametime (IE winning is at 10:30pm)
							shutup.state = 3;
							shutup.emmitEvent("victory");
						}
						// Check for failure condition
						if(shutup.game.noiseLevel >= shutup.game.noiseThreshold){
							shutup.state = 4;
							shutup.emmitEvent("failure");
						}
						shutup.game.room.update(dt);
					}
				break; }
			}

		},

		// THE drawing function
		draw : function(){
			shutup.ctx.clearRect(0,0, shutup.canvas.width, shutup.canvas.height); // Clear the screen (blank canvas)
			shutup.h.defaultCan();

			switch(shutup.state){
				case -1 : { // ERROR
					shutup.d.error();
					return;
				}

				case 0 : { // LOADING
					shutup.d.loading();
					return;
				}

				case 1 : { // MAIN MENU
					shutup.d.menu();
					return;
				}

				case 2 : { // IN GAME
					shutup.d.room();

					// Display the time
					shutup.h.defaultCan(20);
					shutup.ctx.textAlign = "right";
					shutup.ctx.fillText(""+shutup.h.timeConvert(shutup.game.time), shutup.width - 10, 10);

					switch(shutup.game.menu){
						case 0 : { // No overlay
						break; }

						case 2 : { // In game menu/paused
							shutup.d.o.inGame();
						break; }
					}

				break; }

				case 3 : { // VICTORY
					shutup.d.o.victory();
				break; }

				case 4 : { // FAILURE
					shutup.d.o.failure();
				break; }

				case 5 : { // INSTRUCTIONS
					shutup.d.instructions();
				break; }
			}
		},
		tick : function(dt){
			shutup.game.time += dt*1000;
		}
	},

	// Misc drawing functions
	d : {
		room : function(){
			shutup.game.room.draw();
		},
		o : { // Overlays/menus
			inGame : function(){
				shutup.h.defaultCan();
				// Transparent layer
				shutup.ctx.globalAlpha = 0.5;
				shutup.ctx.fillStyle = "white";
				shutup.ctx.fillRect(0, 0, shutup.width, shutup.height);


				shutup.h.defaultCan(24);
				shutup.ctx.textAlign = "center";
				shutup.ctx.fillText("Game Paused...", shutup.width/2, shutup.height/5);
			},
			victory : function(){
				shutup.ctx.fillStyle = "green";
				shutup.ctx.fillRect(0, 0, shutup.width, shutup.height);
				shutup.h.defaultCan(24);
				shutup.ctx.fillText("You win", 30, 30);

			},
			failure : function(){
				shutup.ctx.fillStyle = "green";
				shutup.ctx.fillRect(0, 0, shutup.width, shutup.height);
				shutup.h.defaultCan(24);
				shutup.ctx.fillText("You do not win", 30, 30);
			}
		},
		error : function(){
			shutup.ctx.fillStyle = "green";
			shutup.ctx.fillRect(0,0, shutup.width, shutup.height);
			shutup.h.defaultCan(20);
			shutup.ctx.textBaseline = "bottom";
			shutup.ctx.fillText("Oh PANTS.", 10, 200);
			shutup.ctx.textBaseline = "top";
			shutup.ctx.fillText("An error has occurred, see the console for more info", 25, 205);
		},
		instructions : function(){
			/* More detailed instructions */
			shutup.h.defaultCan(24);
			shutup.ctx.strokeRect(0, 0, shutup.width, shutup.height);
			shutup.ctx.fillText("How to play", 10, 10);
			shutup.ctx.fillText("Detailed instructions coming soon...", 20, 200);
		},
		loading : function(){
			shutup.ctx.fillStyle = "green";
			shutup.ctx.fillRect(0,0, shutup.width, shutup.height);
			shutup.h.defaultCan(24);
			shutup.ctx.textBaseline = "bottom";
			shutup.ctx.fillText("LOADING...", 20, 200);

			shutup.ctx.clearRect(20, 205, 200, 20);
			shutup.ctx.fillRect(20, 205, shutup.assets.loaded*2, 20);
		},
		menu : function(){
			shutup.ctx.fillStyle = "green";
			shutup.ctx.fillRect(0, 0, shutup.width, shutup.height);
			shutup.h.defaultCan(24);
			shutup.ctx.fillText("Press space to play", 30, 30);
		}

	},



	newGame : function(rows, cols){
		shutup.game.room = new shutup.Room(rows, cols); // Generate new playing room!

		// Reset everything
		shutup.game.time = 0;
		shutup.game.menu = 0;
		shutup.game.instructions = true;
		shutup.game.noiseLevel = 0;
		shutup.game.noiseThreshold = 100;
		shutup.game.onStage = [];

		shutup.h.generateCast(10); // Create a new cast

		shutup.locked = false; // Unlock

		shutup.state = 2; // Start the game!
		shutup.emmitEvent("newgame");
	}

};

(function(){
	var tempVol = shutup.settings.volume;
	shutup.pause = function(){
		tempVol = shutup.settings.volume;
		shutup.audio.setVol(0);
		if(shutup.state !== 2){return;} // Only pause in game
		shutup.game.menu = 2;
		shutup.locked = true;
		shutup.emmitEvent("pause");
	};
	shutup.unpause = function(){
		shutup.audio.setVol(tempVol);
		if(shutup.game.menu !== 2){return;} // Cannot unpause unless paused
		shutup.game.menu = 0;
		shutup.locked = false;
		shutup.emmitEvent("unpause");
	};
})();



shutup.init = function(div, assetDir){
	if(!div){throw new Error("Where do I put my canvas?!");}
	if(assetDir){
		shutup.assetDir = (assetDir.lastIndexOf("/") === assetDir.length-1)?assetDir:assetDir+"/"; // Check if parameter has a trailing slash, and if not add one
	}
	// Create the canvas object
	var canvas = document.createElement("canvas"),
		ctx = canvas.getContext("2d");
	canvas.width = shutup.width;
	canvas.height = shutup.height;
	div.appendChild(canvas);
	shutup.canvas = canvas;
	shutup.ctx = ctx;

	// Default fonts, etc for drawing
	shutup.ctx.font = "12px 'Press Start 2P' Helvetica";
	shutup.ctx.textBaseline = "top";
	shutup.ctx.save();



	try{
		startGameloop();
	}catch(e){
		div.innerHTML = "Error has occurred: Game not supported in this browser/version";
		throw e;
	}


	// Load the assets
	shutup.assets.load(function(load, t){
		if(load === true){ // Check for success (strictly)
			shutup.state = 1; // Show the main menu, let's play!
			shutup.emmitEvent("loaded");
		}else{
			shutup.state = -1;
			shutup.emmitEvent("error");
			throw new Error("Asset \""+t+"\" couldn't load :(");
		}

	});

	// Add the pause and resume listeners, using the PageVisibility API
	var evname = (function(){
		var prefixes = ["webkit","moz","ms","o"];
		if ("hidden" in document) return "visibilitychange";

		for (var i = 0; i < prefixes.length; i++){
			if ((prefixes[i] + "Hidden") in document){
				return prefixes[i] + "visibilitychange";
			}
		}
		return null;
	})();
	if(evname){
		document.addEventListener(evname,function(){
			if(pageHidden()){
				shutup.pause();
			}else{
				shutup.unpause();
			}
		});
	}else{
		// Fallback with blur and focus
		window.addEventListener("blur", function(){shutup.pause();});
		window.addEventListener("focus", function(){setTimeout(shutup.unpause, 50);});
	}
};


// Export shutup object for the rest of the JS
window["shutup"] = shutup;
window["shutup"]["init"] = shutup.init; // Needed for compliltion
})(); // @end
