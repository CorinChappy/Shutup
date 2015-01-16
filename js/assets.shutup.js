// Contains the assest locations (images, JSON, etc) + a load function
(function(){
"use strict"; // @start

(function(obj){
	obj.assets = {
		sprites : {
			actors : {
				robin : [
					"actors/robin/1.png",
					"actors/robin/2.png",
					"actors/robin/3.png",
					"actors/robin/4.png",
					"actors/robin/5.png",
					"actors/robin/6.png",
					"actors/robin/7.png",
					"actors/robin/8.png",
					"actors/robin/9.png",
					"actors/robin/10.png"
				]
			}
		},

		// Audio stored in an array, index: 0 = ogg; 1 = mp3
		/* Audio keys need to be strings so the closure compiler will not rename them */
		audio : {},


		load : function(callback){
			var toLoad = 0, loaded = 0, prep = false, er = false,
			f = function(a){ // Function called when an asset is loaded
				if(er){return;} // Error has already happened, no point here
				if(a){
					callback.call(obj, false, a); // Failure
					er = true;
					return;
				}

				obj.assets.loaded = (loaded/toLoad)*100; // Set the loaded var
				if(obj.assets.isLoaded()){
					callback.call(obj, true); // Fully Loaded
					return;
				}
			};

			// Create new Image objects for each asset and wait till the have all loaded
			(function ims(l, p){
				var s = (!p)?l:l[p];
				if(typeof s === 'string'){ // String means load
					toLoad++;
					var i = new Image();
					i.addEventListener("load", function(){l[p] = i; loaded++; f();});
					i.addEventListener("error", function(){f(s);});
					i.src = obj.assetDir + s;
				}else{ // Assume string OR object/array
					for(var a in s){
						ims(s, a); // Recurse
					}
				}
			})(obj.assets.sprites);


			// Load audio using XHR
			var ty = (function(){ // Use the right codec
				try {
					var a = new Audio();
					if(a.canPlayType("audio/ogg; codecs=vorbis") != ""){
						return 0;
					}else{
						if(a.canPlayType("audio/mpeg") != ""){
							return 1;
						}
					}
				}catch(e){}
				return -1;
			})();
			var dud = {  // Stub methods for audio.js to call
				play : function(){}, stop : function(){}, setVolume : function(){}, loop : 0
			};
			if(ty >= 0 && window.AudioContext){
				// Function that loads each audio file
				var audioLoader = function(m){
					toLoad++;
					var au = obj.assetDir + obj.assets.audio[m][ty],
					    xhr = new XMLHttpRequest();
					xhr.open('GET', au, true);
					xhr.responseType = 'arraybuffer';
					xhr.addEventListener("load",function(){
						if(this.status == 200){
							obj.audio.create(xhr.response, function(aud){
								obj.assets.audio[m] = aud;
								obj.assets.audio[m].volume = obj.settings.volume;
								loaded++;
								f();
							});
						}
					});
					xhr.addEventListener("error",function(){ // Losing sound is not the end of the world, do not throw an error
						obj.assets.audio[m] = dud;
						loaded++;
						f();
					});
					try{
						xhr.send(); // Attempt to send, if running the game locally (file:///) audio will fail and an error will be thrown here
					}catch(e){}
				}

				for(var m in obj.assets.audio){
					if(obj.assets.audio.hasOwnProperty(m)){
						audioLoader(m);
					}
				}
			}else{ // No codec supported
				for(var m in obj.assets.audio){
					if(obj.assets.audio.hasOwnProperty(m)){
						obj.assets.audio[m] = dud;
					}
				}
			}



			prep = true;
			obj.assets.isLoaded = function(){return (prep && (toLoad === loaded));};

			// Call f here just in case there are no assets
			f();
		},

		isLoaded : function(){return false;},

		loaded : 0 // percentage loaded
	};
})(shutup);

})(); // @end
