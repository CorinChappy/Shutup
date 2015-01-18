// Contains the objects used in the game
(function(){ 
"use strict"; // @start


// The layout and composition of a room
shutup.Room = function(rows, cols){

	this.size = {rows : (rows || 6), cols : (cols || 6)};

	// Create the 2D array of actor positions (accessed with this.actors[row][col];) Row starts from the top, col from the left
	this.actors = (function(y, x){
		var ar = [];
		var genLine = function(){var a = []; while(a.length < x){a.push(false);} return a;};
		for(var i = 0; i < y; i++){
			ar.push(genLine());
		}
		return ar;
	})(this.size.rows, this.size.cols);

	// 2D Array of actors moving on and off stage. First array represents the row they are on
	this.moving = (function(b){var a = []; while(a.length < b){a.push([]);} return a;})(this.size.rows);
	this.moveable = 0; // Can an actor move?
	this.newActor = 0; // Should a new actor come on stage?
	this.newActorThreashold = 5;

	this.noiseLevel = 0;

	this.g = {
		x : 0,
		y : 0,
		h : shutup.height,
		w : shutup.width,
		top : 290, // pxs from the top of the room that don't have rows on them
		i : {
				bg : shutup.assets.sprites.bg.green,
				bench : shutup.assets.sprites.bg.bench
			}
	};
};
shutup.Room.prototype.update = function(dt){
	this.noiseLevel = 0; // Reset noise variable
	this.moveable += dt;
	this.newActor += dt;


	// See if any of the actors need updating
	this.forEachActor(function(act, row, col){
		// See if this actor needs move
		if(this.moveable > 5 && Math.random() < 0.1){
			if(Math.random() < 0.4){
				// Move off stage
				this.moveActor(act, row, -1);
			}else{
				// Attempt to push into the room until the game allows
				var a = false;
				while(!a){
					a = this.moveActor(act, row, shutup.h.randomInt(0, this.size.cols));
				}
			}
			this.moveable = 0;
		}


		act.update(dt);

		// Update the noise values regardless
		this.noiseLevel += act.noise;
	});
	// See if an actor needs to get into the room
	if(this.newActor > this.newActorThreashold){
		var os = shutup.game.onStage;
		if(os.length && Math.random() < 0.8){
			var act = os.splice(shutup.h.randomInt(0, os.length), 1)[0],
			// Attempt to push into the room until the game allows
				b = false;
			while(!b){
				b = shutup.game.room.moveActor(act, shutup.h.randomInt(0, this.size.rows), shutup.h.randomInt(0, this.size.cols));
			}
		}
		this.newActor = 0;
		this.newActorThreashold = shutup.h.randomInt(5, 10);
	}

	// Update the moving actors, move from the larray if they have finished moving etc.
	this.moving.forEach(function(arr, row){
		if(arr.length > 0){
			arr.forEach(function(act){
				if(act && (act.entering || act.exiting || act.moving)){
					act.update(dt);
				}else{
					this.removeActor(act, row);
				}
			}, this);
		}
	}, this);
};
shutup.Room.prototype.draw = function(){
	shutup.h.defaultCan();

	shutup.ctx.drawImage(this.g.i.bg, this.g.x, this.g.y, this.g.w, this.g.h);

	// Draw each actor from top to bottom
	this.actors.forEach(function(arr, row){
		arr.forEach(function(act, col){
			if(act){
				act.draw();
			}
		});
		// Draw moving actors for this row
		if(this.moving[row].length > 0){
			this.moving[row].forEach(function(act){
				if(act){
					act.draw();
				}
			});
		}
		// Draw the bench for this row
		var x = 0,
			size = (this.g.h - this.g.top)/this.size.rows, // Size of each row (bench + space above)
			//  top padding   top of row     row padding
			y = this.g.top + (size * row),// + (size/2),
			w = this.g.w,
			h = size;//2;
			shutup.ctx.drawImage(this.g.i.bench, x, y, w, h);
	}, this);

};
shutup.Room.prototype.getActor = function(position){
	try{
		return position.row >= 0 && position.col >= 0 && this.actors[position.row][position.col];
	}catch(e){
		return false;
	}
};
shutup.Room.prototype.findDrawPos = function(row, col){	// Finds the x/y coords to draw an actor, given it's position
	var sizeRow = (this.g.h - this.g.top)/this.size.rows, // Size of each row (bench + space above)
		sizeCol = this.g.w/this.size.cols; // Size of each col

		/* The centre points of the actors are returned */
		return {
			y : this.g.top + (sizeRow * row) + sizeRow/2,
			x : (col || col === 0)?(sizeCol/2) + sizeCol*col:(Math.random() > 0.5)?0:shutup.width // if col doesn't exist then random which side to exit the actor
		};

};
shutup.Room.prototype.findPosFromDraw = function(x, y){ // Finds the position from given x,y coords
		if(!y && y !== 0){ // Check if x is an object
			y = x.y; x = x.x; // Extract out the objects
		}

		var sizeCol = this.g.w/this.size.cols, // Size of each col
			sizeRow = (this.g.h - this.g.top)/this.size.rows; // Size of each row (bench + space above)

		return { col : Math.floor(x/sizeCol),
				row : Math.floor(((y - this.g.top)/sizeRow)) + 1};
};
shutup.Room.prototype.moveActor = function(actor, row, col){
	if(row !== -1 && col !== -1 && this.actors[row][col]){ // Check if there is already an actor in that position
		return false;
	}

	var oldPos = actor.position;
	if(oldPos.col !== -1 && oldPos.row !== -1 && this.actors[oldPos.row][oldPos.col] == actor){
		this.actors[oldPos.row][oldPos.col] = false; // Remove actor from current position
	}

	var drawPos;
	if(row === -1 || col === -1){
		drawPos = this.findDrawPos(row); // Just passing in row will return the col as 0 and the correct row
		this.moving[row].push(actor); // Push actor onto moving array so it is updated and drawn by the room
	}else{
		drawPos = this.findDrawPos(row, col);
		this.actors[row][col] = actor;
	}

	actor.updatePosition(row, col, drawPos.x, drawPos.y);
	return actor;
};
shutup.Room.prototype.removeActor = function(actor, row){ // Remove the actor from the moving array so it is no longer drawn or updated, providing row makes the search quicker
	var i, a;
	if(row){
		a = this.moving[row];
		i = a.indexOf(actor);
	}else{
		this.moving.some(function(arr){
			i = arr.indexOf(actor);
			a = arr;
			return (i > -1);
		});
	}
	return (i > -1) && !!(a.splice(i, 1));
};

// Util functions
/* Applies given function to each actor, this is thisArg or the room */
shutup.Room.prototype.forEachActor = function(fun, thisArg){
	this.actors.forEach(function(arr, row){
		arr.forEach(function(act, col){
			if(act){
				fun.call(thisArg || this, act, row, col);
			}
		}, this);
	}, this);
};


// A person that is in the room
shutup.Actor = function(def){
	if(!def){throw new Error("Actor not given a definition");}

	this.position = {row : -1, col : -1}; // Either of col or row -1 then the actor is not in the room
	this.speed = 150;

	this.noise = 0; // The amount of noise being made
	this.volatility = 0; // How likely they are to make noise

	this.animating = false; // Whether the character is animating
	this.entering = false; // Whether the character is moving to their position
	this.exiting = false; // Whether the character is moving away
	this.moving = false; // Whether character is moving from one position to another

	this.direction = 1; // Direction the player is moving (1 is left to right, -1 is right to left)

	this.animationStep = 0; // How far through the animation the character is (out of 100)

	//this.imgs = def.imgs;

	this.g = {
		y : 0,
		h : def.h || 50,
		w : def.w || 50,
	//	i : this.imgs.front
	};
	if(def.imgs){
		this.g.i = def.imgs;
	}

	this.g.x = 0 - this.g.w;
	this.g.target = {
		x : this.g.x,
		y : this.g.y
	};
};
shutup.Actor.prototype.update = function(dt){
	if(this.animating || this.entering || this.exiting || this.moving){
		this.animate(dt);
	}else{
		// Randomly see if I should increase noise
		if(Math.random()*5000 < this.volatility){
			this.noise += shutup.h.randomInt(5, 15);
			this.volatility = 0;
		}else{
			this.volatility += dt;
		}
	}

	if(this.noise > 0){
		// Something here needed? No?
	}


};
shutup.Actor.prototype.draw = function(){
	if(this.g.i){
		shutup.ctx.drawImage(this.g.i, this.g.x, this.g.y, this.g.w, this.g.h);
		
		// Do some size magic, depending on how much noise is made
		if(this.noise > 0){
			var size = this.noise*3;


			var ratio = 279/229; // Taken from note image dimensions (w/h)
			shutup.ctx.drawImage(shutup.assets.sprites.misc.note, this.g.x, this.g.y-size, size*ratio, size);
		}
	}else{
		shutup.ctx.fillStyle = "purple";
		shutup.ctx.fillRect(this.g.x, this.g.y, this.g.w, this.g.h);
	}
};
shutup.Actor.prototype.animate = function(dt){ // Animate the character
	if(this.animating){

		return true;
	}
	if(this.entering || this.exiting || this.moving){
		var cond = (this.direction > 0)?(this.g.x < this.g.target.x):(this.g.x > this.g.target.x);
		if(cond){
			this.g.x += this.direction*dt*this.speed;
		}else{
			if(this.entering){
				this.entering = false;
			}
			if(this.exiting){
				this.exiting = false;
				if(shutup.game.room.removeActor(this, this.position.row)){ // Remove actor from the screen
					shutup.game.onStage.push(this); // Put actor onStage
				}
			}
			if(this.moving){
				this.moving = false;
			}
		}
		return true;
	}

	return false;
};
shutup.Actor.prototype.updatePosition = function(row, col, drawX, drawY){
	// Discover the action from the current and old positions
	var oldOff = (this.position.col === -1 || this.position.row === -1),
		newOff = (col === -1 || row === -1);
	if(oldOff && newOff){
		return false; // Offscreen to offscreen?
	}

	this.animating = false;
	this.entering = false;
	this.exiting = false;
	this.moving = false;

	if(newOff){
		this.exiting = true;
		this.direction = (drawX === 0)?-1:1;
	}else{
		if(oldOff){
			this.entering = true;
			if(Math.random() > 0.5){
				// Enter from the left
				this.g.x = 0 - this.g.w;
				this.direction = 1;
			}else{
				// Enter from the right
				this.g.x = shutup.width + this.g.w;
				this.direction = -1;
			}
		}else{
			this.moving = true;
			this.direction = (this.position.col > col)?-1:1;
		}
	}

	this.position.row = row;
	this.position.col = col;
	this.g.target.x = drawX - (this.g.w/2);
	this.g.y = drawY - (this.g.h*9/10);
	return true;
};

shutup.Actor.prototype.onClick = function(which){
	console.log(this);
	this.noise = Math.max(this.noise - 3, 0); // Decrease noise of the actor
};




})(); // @end
