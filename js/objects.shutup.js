// Contains the objects used in the game
(function(){ 
"use strict"; // @start


// The layout and composition of a room
shutup.Room = function(x, y){

	this.size = {x : (x || 5), y : (y || 5)};

	this.actors = [];
};


// A person that is in the room
shutup.Actor = function(def, initalPosition){

	this.position = initalPosition || {x : 0, y : 0};

	this.noise = 0; // The amount of noise being made

	this.animating = false; // Whether the character is animating
	this.entering = false; // Whether the character is moving to their position
	this.exiting = false; // Whether the character is moving away

	this.animationStep = 0; // How far through the animation the character is

	this.imgs = def.imgs;

	this.g = {
		x: 0,
		y: 0,
		h : def.h,
		w : def.w,
		i : this.imgs.front
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
shutup.Actor.prototype.updatePosition = function(position, x, y){

};




})(); // @end
