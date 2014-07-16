// Contains keybindings and functions for the game
(function(){ 
"use strict"; // @start
	
	shutup.keysDown = {}; // Contins the currently pressed keys

	shutup.keyFunc = {
		keydown : function(e){
			//e.preventDefault();
			shutup.keysDown[e.keyCode] = true;

			if(shutup.keyPressAction[e.keyCode] && !shutup.locked){
				e.preventDefault();
				shutup.keyPressAction[e.keyCode].call(shutup, e);
			}
		},
		keyup : function(e){
			//e.preventDefault();
			delete shutup.keysDown[e.keyCode];
		}
	};

	/* Event listeners for the keypresses */
	window.addEventListener("keydown", shutup.keyFunc.keydown);
	window.addEventListener("keyup", shutup.keyFunc.keyup);


	/* The actions taken when each key is HELD
	 *
	 */
	shutup.keyAction = {
		37 : function(dt, a){
			// LEFT
		},
		38 : function(dt, a){
			// UP
		},
		39 : function(dt, a){
			// RIGHT
		},
		40 : function(dt, a){
			// DOWN
		},

		32 : function(dt, a){
			// SPACE
		}
	};


	/* 
	 * The actions taken when each key is PRESSED
	 */
	shutup.keyPressAction = {
		37 : function(e){
			// LEFT
			if(shutup.state === 1){ // MAIN MENU
				shutup.menuOption = Math.max(0, shutup.menuOption-1);
			}
		},
		38 : function(e){
			// UP
		},
		39 : function(e){
			// RIGHT
			if(shutup.state === 1){ // MAIN MENU
				shutup.menuOption = Math.min(shutup.menuOption+1, 0);
			}
		},
		40 : function(e){
			// DOWN
		},

		32 : function(e){
			// SPACE
		},

		68 : function(e){
			// D
		},

		73 : function(e){ // I
			// Show/hide the instructions
			switch(shutup.state){
				case 1 : { // MAIN MENU
					shutup.state = 5;
				break; }

				case 2 : { // IN GAME
					shutup.game.instructions = !shutup.game.instructions;
				break; }

				case 5 : { // ALREADY IN INSTRUCTIONS
					shutup.state = 1;
				break; }
			}
		},

	};
	shutup.keyPressAction[13] = shutup.keyPressAction[32]; // Make ENTER an alias for SPACE

})(); // @end
