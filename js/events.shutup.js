/* Custom event emitter, same syntax as event naitve JS */
(function(){ 
"use strict"; // @start

(function(obj){

	var listeners = {}; // Pairing from name of event and array of registered listeners

	var AEL = function(name, func){
		if(!(func && {}.toString.call(func) === '[object Function]')){ // Check if func is a function
			return false;
		}

		var a = listeners[name];

		if(!a){
			listeners[name] = a = [];
		}

		return a.push(func);
	};

	var REL = function(name, func){
		var a = listeners[name];

		if(!a || a.length === 0){
			return false;
		}

		var i = a.indexOf(func);
		if(i > -1){
			return a.splice(i,1).length;
		}

		return false;
	};

	var EM = function(name, info){
		var a = listeners[name];

		if(!a || a.length === 0){
			return;
		}

		a.forEach(function(f){
			f.call(obj, info);
		});
	};

	// Add to the object
	obj["addEventListener"] = AEL;
	obj["removeEventListener"] = REL;
	obj.emmitEvent = EM;
})(shutup);

})(); // @end
