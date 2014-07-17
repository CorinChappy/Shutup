// Contains the objects used in the game
(function(){ 
"use strict"; // @start


// The layout and composition of a room
shutup.Room = function(rows, cols){

	this.size = {cols : (cols || 6), rows : (rows || 6)};

	// Create the 2D array of actor positions (accessed with this.actors[col][row];) Col starts from the top, row from the left
	this.actors = (function(y, x){
		var ar = [];
		var genLine = function(){var a = []; while(a.length < x){a.push(false);} return a;};
		for(var i = 0; i < y; i++){
			ar.push(genLine());
		}
		return ar;
	})(this.size.cols, this.size.rows);

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
			if(act){
				if(act.animating || act.entering || act.exiting || act.moving || act.noise > 0){
					act.update(dt);
				}
			}
		});
	});
};
shutup.Room.prototype.draw = function(){
	shutup.h.defaultCan();
	shutup.ctx.fillStyle = "green";
	//shutup.ctx.drawImage(this.g.i.bg, this.g.x, this.g.y, this.g.w, this.g.h);
	shutup.ctx.fillRect(this.g.x, this.g.y, this.g.w, this.g.h);

	// Draw each actor from top to bottom
	this.actors.forEach(function(arr, row){
		arr.forEach(function(act, col){
			if(act){
				act.draw();
			}
		});
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

};


// A person that is in the room
shutup.Actor = function(def, initalPosition){

	this.position = initalPosition || {x : 0, y : 0};
	this.speed = 100;

	this.noise = 0; // The amount of noise being made

	this.animating = false; // Whether the character is animating
	this.entering = false; // Whether the character is moving to their position
	this.exiting = false; // Whether the character is moving away
	this.moving = false; // Whether character is moving from one position to another

	this.animationStep = 0; // How far through the animation the character is (out of 100)

	this.imgs = def.imgs;

	this.g = {
		x: 0,
		y: 0,
		h : def.h,
		w : def.w,
		i : this.imgs.front
	};
	this.g.target = {
		x : this.g.x,
		y : this.g.y
	};
};
shutup.Actor.prototype.update = function(dt){
	
};
shutup.Actor.prototype.draw = function(){

};
shutup.Actor.prototype.animate = function(dt){ // Animate the character
	if(this.entering){

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
shutup.Actor.prototype.updatePosition = function(positionX, positionY, drawX, drawY){

};




})(); // @end
