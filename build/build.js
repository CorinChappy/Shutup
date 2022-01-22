/* Build script for StageSoc game shutup, parser, combiner, minifier and optional compresser */
/*
	StageSoc Games (Including shutup)
	Copyright (C) 2014  Corin Chaplin

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

"use strict";

var fs = require("fs");
var querystring = require('querystring');
var https = require('https');

if(process.argv.indexOf("-h") >= 0 || process.argv.indexOf("--help") >= 0){
	console.log("Build file for shutup");
	console.log();
	console.log("Usage:");
	console.log("     node build [-h] [-c] [-m] [<filename>]");
	console.log();
	console.log("             -h   Output this message");
	console.log("             -c   Compress the program and it's assets into a zip file. Note: For this to work jszip must be installed (run 'npm install jszip')");
	console.log("             -m   Output a merged file (do not compile using Google Closure Compiler). Can be used in combination with -c");
	console.log("     <filename>   Specify the filename for the outputted (zip or js) file");
	console.log();
	process.exit(0);
}

// Get the command line input (to check for compression) + filename
var a = process.argv,
useCompress = a.indexOf("-c"),
merge = a.indexOf("-m"),
filename = (useCompress >= 0)?"shutup.zip":"shutup.js";

if(a.length-1 > useCompress && a.length-1 > merge && a.length-1 > 2){
	filename = a[a.length-1];
}
useCompress = (useCompress >= 0);
merge = (merge >= 0);

console.log("Build file for shutup");
console.log("Using compression = "+useCompress);
console.log("Outputting merged file = "+merge);
console.log("Output file = "+filename);
console.log();

if(useCompress){
	try{
		var JSZip = require("jszip");
	}catch(e){
		console.log();
		console.log("===========ERROR: Cannot load jszip module===========");
		console.log("==       Have you run 'npm install jszip' yet?     ==");
		console.log("=====================================================");
		process.exit(1);
	}
}

/* Read the copyright file */
var copyfile = "../CopyrightNotice";
var copyright = "/*\n" + fs.readFileSync(copyfile) + "\n*/\n";

/*
	Read each file (assumes that root dir is the parent of the current dir)
	Remove bits before @start and after @end on each file
	Then combine them into one file
*/
var rootDir = "../";
var dir = rootDir + "js/";
var suffix = ".shutup.js";
var prefix = "";

var files = ["main", "events", "assets", "objects", "mouse", "keybind", "audio", "def"];

console.log("Reading files");
var strings = files.map(function(a){
	var fn = dir + prefix + a + suffix;
	console.log("    "+fn);
	var f = fs.readFileSync(fn); // Synconous to make dep order eaiser
	if(!f){throw new Error();}
	f = f.toString();

	// Simple split
	f = f.split("@start")[1] || f;
	var v = f.split("@end");
	if(v[1]){
		f = v[0];
		// Remove the last line
		f = f.substring(0, f.lastIndexOf("\n")) || f;
	}

	return f;
});

console.log("Combining Files");
var full = strings.reduce(function(p, c){
	return p + c;
}, "");

if(merge){
	console.log("Outputting merged file");
	if(useCompress){
		preCompress(copyright + full);
	}else{
		fs.writeFileSync(filename, copyright + full);
	}
	console.log("Done!");
	process.exit(0);
}

console.log("Minifying - Google Closure Compiler");

var post_data = querystring.stringify({
	'compilation_level' : 'ADVANCED_OPTIMIZATIONS',
	//'compilation_level' : 'SIMPLE_OPTIMIZATIONS',
	'output_format': 'json',
	'output_info': ['compiled_code', 'errors'],
	'language_out': 'ES5',
	'language' : 'ECMASCRIPT5_STRICT',
	'js_code' : full
});

// An object of options to indicate where to post to
var post_options = {
	host: 'closure-compiler.appspot.com',
	port: '443',
	path: '/compile',
	method: 'POST',
	headers: {
		'Content-Type': 'application/x-www-form-urlencoded',
		'Content-Length': post_data.length
  }
};

var chunkAcc = "";

// Set up the request
var post_req = https.request(post_options, function(res) {
	res.setEncoding('utf8');
	res.on("data", function(chunk){
		chunkAcc += chunk;
	});
	res.on("end", postProcess);
});

// post the data
console.log("Sending request to Google");
post_req.write(post_data);
post_req.end();



function postProcess(){
	console.log("Got response!");
	var s = JSON.parse(chunkAcc);

	if(s.errors){
		console.log();
		console.log("=========Errors during compliation============");
		console.log(JSON.stringify(s.errors));
		console.log();
		console.log("Writing merged file");
		fs.writeFileSync("merged.js", full);
		return;
	}

	var cc = copyright + s.compiledCode;

	// Compress
	if(useCompress){
		preCompress(cc);
	}else{
		// Writing data to file
		fs.writeFileSync(filename, cc);
	}

	console.log("Done");
}

function preCompress(shutupjs){
	console.log("Compressing files");
	var zip = new JSZip();

	var assRoot = rootDir + "assets";
	compresser(assRoot, zip);

	var blob = zip.file("js/shutup.js", shutupjs)
		.file("example.html", fs.readFileSync("example.html"))
		.file("CopyrightNotice", copyright)
		.file("LICENSE", fs.readFileSync(rootDir + "LICENSE"))
		.generateNodeStream({type:"nodebuffer", compression: "DEFLATE"});
	fs.writeFileSync(filename, blob);
}


function compresser(dir, zip){
	fs.readdirSync(dir).forEach(function(a){
		var f = dir + "/" + a;
		var stat = fs.statSync(f);
		if(stat.isDirectory()){
			compresser(f, zip);
		}else{
			if(a.indexOf(".svg") === -1){ // Do NOT export svgs
				zip.file(f.split("../")[1], fs.readFileSync(f));
			}
		}
	});
}