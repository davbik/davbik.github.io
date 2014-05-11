var VERSION = 0.1;

document.getElementById('version').innerHTML = VERSION;

var DEBUG = false;

//==============================
//		helper functions
//==============================

// RequestAnimationFrame Shim
// http://www.kadrmasconcepts.com/blog/2012/05/20/save-battery-life-with-cancelanimationframe/
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = 
          window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());
// END RAF Shim

/*
 * Minimal classList shim for IE 9
 * By Devon Govett
 * MIT LICENSE
 */
if (!("classList" in document.documentElement) && Object.defineProperty && typeof HTMLElement !== 'undefined') {
    Object.defineProperty(HTMLElement.prototype, 'classList', {
        get: function() {
            var self = this;
            function update(fn) {
                return function(value) {
                    var classes = self.className.split(/\s+/),
                        index = classes.indexOf(value);

                    fn(classes, index, value);
                    self.className = classes.join(" ");
                }
            }

            var ret = {                    
                add: update(function(classes, index, value) {
                    ~index || classes.push(value);
                }),

                remove: update(function(classes, index) {
                    ~index && classes.splice(index, 1);
                }),

                toggle: update(function(classes, index, value) {
                    ~index ? classes.splice(index, 1) : classes.push(value);
                }),

                contains: function(value) {
                    return !!~self.className.split(/\s+/).indexOf(value);
                },

                item: function(i) {
                    return self.className.split(/\s+/)[i] || null;
                }
            };
            
            Object.defineProperty(ret, 'length', {
                get: function() {
                    return self.className.split(/\s+/).length;
                }
            });

            return ret;
        }
    });
}

// get current time in HH:MM format
function getTime() {
	var date = new Date();
	
	var hours = date.getHours(),
		minutes = date.getMinutes();
		
	if (hours < 10) hours = "0" + hours;
	if (minutes < 10) minutes = "0" + minutes;
	
	return hours + ":" + minutes;
}

function loadImage(object, name, path) {
	var image = new Image();
	image.src = path;
	object[name] = image;
}

function get(id) { return document.getElementById(id); }
function hide(id) { get(id).style.opacity = 0; }
function show(id) { get(id).style.opacity = 1; }
function html(id, text) { get(id).innerHTML = text; }
function addhighlight(id) { if (!(get(id).classList.contains('highlight'))) get(id).classList.add('highlight'); }
function remhighlight(id) { if (get(id).classList.contains('highlight')) get(id).classList.remove('highlight'); }

function rnd(min, max) { return (min + (Math.random() * (max - min))); } //returns a random number between min and max
function rndArray(arr) { return arr.splice(rnd(0, arr.length), 1)[0]; } //return a random element grom the array

DEBUG ? show('debug') : hide('debug');

//===============================
//		the game
//===============================

//tetrominoes
// blocks[rotation][x][y]
//we could use math to rotate them
//but tetris only have 7 tetrominoes with 4 rotations
var I = { blocks: [
			[[0, 1, 0, 0],
			 [0, 1, 0, 0],
			 [0, 1, 0, 0],
			 [0, 1, 0, 0]],
			[[0, 0, 0, 0],
			 [1, 1, 1, 1],
			 [0, 0, 0, 0],
			 [0, 0, 0, 0]],
			[[0, 0, 1, 0],
			 [0, 0, 1, 0],
			 [0, 0, 1, 0],
			 [0, 0, 1, 0]],
			[[0, 0, 0, 0],
			 [0, 0, 0, 0],
			 [1, 1, 1, 1],
			 [0, 0, 0, 0]],
		  ],
		  image: 'browser' };
var J = { blocks: [
			[[0, 1, 0, 0],
			 [0, 1, 0, 0],
			 [1, 1, 0, 0],
			 [0, 0, 0, 0]],
			[[1, 0, 0, 0],
			 [1, 1, 1, 0],
			 [0, 0, 0, 0],
			 [0, 0, 0, 0]],
			[[0, 1, 1, 0],
			 [0, 1, 0, 0],
			 [0, 1, 0, 0],
			 [0, 0, 0, 0]],
			[[0, 0, 0, 0],
			 [1, 1, 1, 0],
			 [0, 0, 1, 0],
			 [0, 0, 0, 0]],
		  ],
		  image: 'mail' };
var L = { blocks: [
			[[0, 1, 0, 0],
			 [0, 1, 0, 0],
			 [0, 1, 1, 0],
			 [0, 0, 0, 0]],
			[[0, 0, 0, 0],
			 [1, 1, 1, 0],
			 [1, 0, 0, 0],
			 [0, 0, 0, 0]],
			[[1, 1, 0, 0],
			 [0, 1, 0, 0],
			 [0, 1, 0, 0],
			 [0, 0, 0, 0]],
			[[0, 0, 1, 0],
			 [1, 1, 1, 0],
			 [0, 0, 0, 0],
			 [0, 0, 0, 0]],
		  ],
		  image: 'music' };
var O = { blocks: [
			[[1, 1, 0, 0],
			 [1, 1, 0, 0],
			 [0, 0, 0, 0],
			 [0, 0, 0, 0]],
			[[1, 1, 0, 0],
			 [1, 1, 0, 0],
			 [0, 0, 0, 0],
			 [0, 0, 0, 0]],
			[[1, 1, 0, 0],
			 [1, 1, 0, 0],
			 [0, 0, 0, 0],
			 [0, 0, 0, 0]],
			[[1, 1, 0, 0],
			 [1, 1, 0, 0],
			 [0, 0, 0, 0],
			 [0, 0, 0, 0]],
		  ],
		  image: 'phone' };
var S = { blocks: [
			[[0, 0, 0, 0],
			 [0, 1, 1, 0],
			 [1, 1, 0, 0],
			 [0, 0, 0, 0]],
			[[1, 0, 0, 0],
			 [1, 1, 0, 0],
			 [0, 1, 0, 0],
			 [0, 0, 0, 0]],
			[[0, 1, 1, 0],
			 [1, 1, 0, 0],
			 [0, 0, 0, 0],
			 [0, 0, 0, 0]],
			[[0, 1, 0, 0],
			 [0, 1, 1, 0],
			 [0, 0, 1, 0],
			 [0, 0, 0, 0]],
		  ],
		  image: 'settings' };
var T = { blocks: [
			[[0, 0, 0, 0],
			 [1, 1, 1, 0],
			 [0, 1, 0, 0],
			 [0, 0, 0, 0]],
			[[0, 1, 0, 0],
			 [1, 1, 0, 0],
			 [0, 1, 0, 0],
			 [0, 0, 0, 0]],
			[[0, 1, 0, 0],
			 [1, 1, 1, 0],
			 [0, 0, 0, 0],
			 [0, 0, 0, 0]],
			[[0, 1, 0, 0],
			 [0, 1, 1, 0],
			 [0, 1, 0, 0],
			 [0, 0, 0, 0]],
		  ],
		  image: 'store' };
var Z = { blocks: [
			[[0, 0, 0, 0],
			 [1, 1, 0, 0],
			 [0, 1, 1, 0],
			 [0, 0, 0, 0]],
			[[0, 1, 0, 0],
			 [1, 1, 0, 0],
			 [1, 0, 0, 0],
			 [0, 0, 0, 0]],
			[[1, 1, 0, 0],
			 [0, 1, 1, 0],
			 [0, 0, 0, 0],
			 [0, 0, 0, 0]],
			[[0, 0, 1, 0],
			 [0, 1, 1, 0],
			 [0, 1, 0, 0],
			 [0, 0, 0, 0]],
		  ],
		  image: 'tunes' };

//constants
var KEYS = {LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, A: 65, DEBUG: 192},		  
	TIME_STYLE = {font: 'lighter 72px Lato, "Helvetica Neue",  sans-serif', fill: 'rgba(255,255,255,0.7)'}, // font style for time text
	START_STYLE = {font: 'lighter 48px Lato, "Helvetica Neue", sans-serif', fill: 'rgba(255,255,255,1)'};   // and for start text
	BLOCK_WIDTH = 32,							  // in pixels
	BLOCK_HEIGHT = 32,
	wellWidth = 10,								// width of the field in blocks
	wellHeight = 18,							// height of the field in blocks

//objects
var	canvas = get('game'),						// canvas html element
	ctx = canvas.getContext('2d'),				// canvas 2d context
	images = {}, 								// object to hold images
	playing = false,							// are we playing?
	dt = 0,										// the number of milliseconds past since the last frame
	well = null,								// 2 dimensional array [wellWidth x wellHeight] representing game field
	current = null,								// current piece {type: tetromino, x: x position, y: y position, rot: rotation (0 - 3)}
	delayTime = 0;								// time (in milliseconds) since start of the game
	delay = 1000,								// how long before drop (in milliseconds)
	score = 0,
	lines = 0;

//functions

function eachBlock(type, x, y, rot, callback) {
	var blocks = type.blocks[rot];
	for (var row = 0; row < 4; row++) {
		for (var col = 0; col < 4; col++) {
			if (blocks[row][col] > 0) callback(x + row, y + col);
		}
	}
}

//check piece collisions
function free(type, x, y, rot) {
	var ret = true;
	eachBlock(type, x, y, rot, function (x, y) {
		if (x < 0 || x >= wellWidth || y < 0 || y >= wellHeight || getWell(x, y))
			ret = false;
	});
	return ret;
}

function notFree(type, x, y, rot) { return !free(type, x, y, rot); }

function getWell(x, y) { return well[x][y]; }
function setWell(x, y, type) { well[x][y] = type; }

function addScore(amount) { score += amount };
function addLines(amount) { lines += amount; addScore(Math.pow(amount, 2)*100); }
function gameOver() { playing = false; }

//drawing
//draw text on canvas
function text(ctx, text, x, y, style) {
	ctx.fillStyle = style.fill || 'black';
	ctx.font = style.font || '32px sans-serif';
	ctx.fillText(text, x, y);
}

function drawBlock(x, y, type) { ctx.drawImage(images[type.image], x*BLOCK_WIDTH, y*BLOCK_HEIGHT-8); }

function drawWell() {
	for (var x = 0; x < wellWidth; x++) {
		for (var y = 0; y < wellHeight; y++) {
			if (well[x][y]) drawBlock(x, y, well[x][y]);
		}
	}
}

function drawCurrentPiece() {
	eachBlock(current.type, current.x, current.y, current.rot, function (x, y) {
		drawBlock(x, y, current.type);
	});
}

//http://tetris.wikia.com/wiki/Random_Generator
var bag = [];
function getRandomPiece() {
	if (bag.length === 0)
		bag = [I, J, L, O, T, Z, S];
	var type = rndArray(bag);
	return {type: type, x: 3, y: 0, rot: 1};
}

function checkIfLine() {
	if (notFree(current.type, current.x, current.y + 1, current.rot)) {
		eachBlock(current.type, current.x, current.y, current.rot, function (x, y) {
			setWell(x, y, current.type);
		});
		
		deleteLines();
		
		current = getRandomPiece();
	}
	
	if (notFree(current.type, current.x, 0, current.rot)) gameOver();
}

function step() {
	checkIfLine();
	action.move(0, 1);
}

function deleteLines() {
	var x, y, lines = 0;
	
	for (y = wellHeight-1; y > 0; y--) {
		x = 0;
		while (x < wellWidth) {
			if (getWell(x, y) === null) break;
			x++;
		}
		if (x === wellWidth) {
			deleteLine(y);
			lines++;
			y++;
		}
	}
	
	if (lines > 0) addLines(lines);
}

function deleteLine(line) {
	for (var y = line; y > 0; y--) {
		for (var x = 0; x < wellWidth; x++) {
			setWell(x, y, getWell(x, y-1));
		}
	}
}

action = {
	move: function (x, y) {
		var newX = current.x + x,
			newY = current.y + y;
		if (free(current.type, newX, newY, current.rot)) {
			current.x = newX;
			current.y = newY;
			return true;
		}
		return false;
	},
	rotate: function () { 
		var newRotation = (current.rot + 1) % 4;
		if (free(current.type, current.x, current.y, newRotation)) {
			current.rot = newRotation;
		}
	},
	soft: function () {
		action.move(0, 1);
		addScore(1);
		checkIfLine();
	},
	hard: function () {
		var lines = 0;
		while (action.move(0, 1)) lines++;
		addScore(lines * 2);
		checkIfLine();
	}
};

(function init() {
	//load assets
	loadImage(images, 'background', 'assets/iphone-back-new.jpg');
	
	loadImage(images, 'store', 'assets/Store.png');
	loadImage(images, 'browser', 'assets/Browser.png');
	loadImage(images, 'mail', 'assets/Mail.png');
	loadImage(images, 'music', 'assets/Music.png');
	loadImage(images, 'phone', 'assets/Phone.png');
	loadImage(images, 'settings', 'assets/Settings.png');
	loadImage(images, 'tunes', 'assets/Tunes.png');
	
	//set input
	document.addEventListener('keydown', keyDown, false);
	document.addEventListener('keyup', keyUp, false);
	canvas.addEventListener('mousedown', mouseDown, false);
	
	ctx.drawImage(images['background'], 0, 0);
	
	start();
}());


//event handlers
function keyDown(event) {
	if (playing) {
		var prevent = true;
		switch (event.keyCode) {
			case KEYS.LEFT:  addhighlight('aleft');  action.move(-1, 0); break;
			case KEYS.RIGHT: addhighlight('aright'); action.move( 1, 0); break;
			case KEYS.UP: 	 addhighlight('aup'); 	 action.rotate();    break;
			case KEYS.DOWN:  addhighlight('adown');  action.soft(); 	 break;
			case KEYS.A: 	 addhighlight('akey'); 	 action.hard(); 	 break;
			default:		 prevent = false;		 break;
		}
		if (prevent) event.preventDefault();
	}
}

function keyUp(event) {
		var prevent = true;
		switch (event.keyCode) {
			case KEYS.LEFT:  remhighlight('aleft');  break;
			case KEYS.RIGHT: remhighlight('aright'); break;
			case KEYS.UP: 	 remhighlight('aup'); 	 break;
			case KEYS.DOWN:  remhighlight('adown');  break;
			case KEYS.A: 	 remhighlight('akey');   break;
			default:		 prevent = false;		 break;
		}
		if (prevent) event.preventDefault();
}

function mouseDown() {
	if (!playing) {
		reset();
		playing = true;
	}
}

function start() {
	var then = Date.now();
	
	function mainloop() {
		requestAnimationFrame(mainloop, canvas);
	
		var now = Date.now(),
			dt = now - then;
	
		update(dt);
		render();
		
		then = now;
	}
	
	reset();
	
	mainloop();
}

function reset() {
	//create and init well[wellWidth x wellHeight] array
	well = [];
	for (var i = 0; i < wellWidth; i++) {
		well[i] = [];
		for (var j = 0; j < wellHeight; j++) {
			well[i][j] = null;
		}
	}
	
	dt = 0;
	delayTime = 0;
	score = 0;
	lines = 0;
	
	current = getRandomPiece();
}

function update(dt) {
    if (playing) {
    	delayTime += dt;
		if (delayTime > delay) {
			step();
			delayTime = 0;
		}
	}
	
	if (DEBUG) { 
		html('debug-dt', dt);
		html('debug-delayTime', delayTime);
	}
}

function render() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	
	ctx.drawImage(images['background'], 0, 0);
	
	text(ctx, getTime(), 68, 110, TIME_STYLE);
	
	drawWell();
	
	if (!playing) {	
		text(ctx, 'click to start', 34, 510, START_STYLE);
	} else {
		drawCurrentPiece();
	}
	
	html('score', score);
	html('lines', lines);
}