// Functions for binding to and handling mouse clicks
(function(){ 
"use strict"; // @start

	shutup.mouse = {

		Coords : function(x, y){
			this.x = x;
			this.y = y;

			this.within = function(t, b, l, r){
				return this.x >= t && this.x <= b && this.y >= l && this.y <= r;
			};
			this.boxed = function(t, h, l, w){
				return this.x >= t && this.x <= t + h && this.y >= l && this.y <= l + w;
			};
		},

		getCoords : function(e){ // Get the coords from a given mouse event
			var rect = shutup.canvas.getBoundingClientRect();
			return new shutup.mouse.Coords(
				(e.clientX-rect.left)/(rect.right-rect.left)*shutup.width,
				(e.clientY-rect.top)/(rect.bottom-rect.top)*shutup.height
			);
		},

		constant : {
			NONE: 0, LEFT : 1, MIDDLE : 2, RIGHT : 3
		},

		func : [
			// No button
			function(coords, e){

			},
			// Left button
			function(coords, e){
				switch(shutup.state){
					case 1 : { // Main Menu
						if(coords.within(325, 425, 90, 130)){
							shutup.newGame();
						}
						if(coords.within(580, 650, 400, 500)){
							if(shutup.menuClickSize > 0){
								shutup.menuClickSize -= 3;
							}else{
								shutup.menuClickSize = 30;
							}
						}
					break; }
					case 2 : { // IN GAME
						var pos = shutup.game.room.findPosFromDraw(coords);
						var a = shutup.game.room.getActor(pos);
						if(a){
							a.onClick(e.which);
						}
					break; }

					case 3 :   // Success
					case 4 : { // Failure
						if(coords.within(250, 500, 500, 540)){
							shutup.state = 1;
						}
					break; }
				}
			},
			// Middle button
			function(coords, e){

			},
			// Right button
			function(coords, e){

			}
		],

		init : function(){
			shutup.canvas.addEventListener("click", function(e){
				e.preventDefault(); // Prevent default to prevent highlighting of text white playing

				var coords = shutup.mouse.getCoords(e),
					w = e.which;
				if(w === 0 || (w && w < 4 && w > 0)){
					shutup.mouse.func[w](coords, e);
				}
			}, true);
		}

	};


})(); // @end
