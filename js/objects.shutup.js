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

	this.g = {
		x : 0,
		y : 0,
		h : shutup.height,
		w : shutup.width,
		top : 50, // pxs from the top of the room that don't have rows on them
		i : {
				//bg : shutup.def.assets.bg.green,
				//bench : shutup.def.assets.bg.bench
			}
	}
};
shutup.Room.prototype.update = function(dt){
	// See if any of the actors need updating
	this.actors.forEach(function(arr, row){
		arr.forEach(function(act, col){
			if(act && (act.animating || act.moving || act.entering || act.exiting || act.noise > 0)){
				act.update(dt);
			}
		});
	});
	// Update the moving actors, move from the larray if they have finished moving etc.
	this.moving.forEach(function(arr, row){
		if(arr.length > 0){
			arr.forEach(function(act){
				if(act && (act.entering || act.exiting || act.moving)){
					act.update(dt);
				}else{
					this.removeActor(act, row);
				}
			});
		}
	});
};
shutup.Room.prototype.draw = function(){
	shutup.h.defaultCan();
	shutup.ctx.fillStyle = "green";
	//shutup.ctx.drawImage(this.g.i.bg, this.g.x, this.g.y, this.g.w, this.g.h);
	shutup.ctx.fillRect(this.g.x, this.g.y, this.g.w, this.g.h);
	shutup.h.defaultCan(24);
	shutup.ctx.fillText("The room", 30, 30);

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
			y = this.g.top + (size * row) + (size/2),
			w = this.g.w,
			h = size/2;
			//shutup.ctx.drawImage(this.g.i.desk, x, y, w, h);
			shutup.ctx.fillStyle = "blue";
			shutup.ctx.fillRect(x, y, w, h);
	}, this);

};
shutup.Room.prototype.findDrawPos = function(row, col){	// Finds the x/y coords to draw an actor, given it's position
	var sizeRow = (this.g.h - this.g.top)/this.size.rows, // Size of each row (bench + space above)
		sizeCol = this.g.w/this.size.cols, // Size of each col

		/* The centre points of the actors are returned */
		coords = {
			y : this.g.top + (sizeRow * row) + sizeRow/2,
			x : (col)?(sizeCol/2) + sizeCol*col:0
		};


	return coords;
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
shutup.Room.prototype.removeActor = function(actor, row){ // Remove the actor from the moving array so it is no longer drawn or updated
	var i = this.moving[row].indexOf(actor);
	return (i > -1) && !!(this.moving[row].splice(i, 1));
};

// A person that is in the room
shutup.Actor = function(def){
	if(!def){throw new Error("Actor not given a definition");}

	this.position = {row : -1, col : -1}; // Either of col or row -1 then the actor is not in the room
	this.speed = 150;

	this.noise = 0; // The amount of noise being made

	this.animating = false; // Whether the character is animating
	this.entering = false; // Whether the character is moving to their position
	this.exiting = false; // Whether the character is moving away
	this.moving = false; // Whether character is moving from one position to another

	this.direction = 1; // Direction the player is moving (1 is left to right, -1 is right to left)

	this.animationStep = 0; // How far through the animation the character is (out of 100)

	//this.imgs = def.imgs;

	this.g = {
		x: 0,
		y: 0,
		h : def.h || 50,
		w : def.w || 50,
	//	i : this.imgs.front
	};
	this.g.target = {
		x : this.g.x,
		y : this.g.y
	};
};
shutup.Actor.prototype.update = function(dt){
	this.animate(dt);
};
shutup.Actor.prototype.draw = function(){
	//shutup.ctx.drawImage(this.g.i, this.g.x, this.g.y, this.g.w, this.g.h);
	shutup.ctx.fillStyle = "purple";
	shutup.ctx.fillRect(this.g.x, this.g.y, this.g.w, this.g.h);
};
shutup.Actor.prototype.animate = function(dt){ // Animate the character
	if(this.entering){
		var cond = (this.direction > 0)?(this.g.x < this.g.target.x):(this.g.x > this.g.target.x);
		if(cond){
			this.g.x += this.direction*dt*this.speed;
		}else{
			this.entering = false;
		}
		return true;
	}
	if(this.exiting){

		return true;
	}
	if(this.animating){

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
		this.direction = 1; // Always enter and exit from the left
	}else{
		if(oldOff){
			this.entering = true;
			this.direction = 1;
		}else{
			this.moving = true;
		}
	}

	this.position.row = row;
	this.position.col = col;
	this.g.target.x = drawX && drawX - (this.g.w/2);
	this.g.y = drawY && drawY - (this.g.h/2);
	return true;
};




})(); // @end
