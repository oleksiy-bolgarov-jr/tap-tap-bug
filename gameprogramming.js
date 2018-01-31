var FOOD_SIZE = 30;
var BUG_SIZE = 30;

var level;

var food = new Array();
var eatenFood = new Array();
var bugs = new Array();
var deadBugs = new Array();

var _id = 0;

/**
 * Returns a unique ID integer, used to enumerate items in arrays
 */
function getUniqueId() {
    _id++;
    return _id;
}


/**
 * Returns the Euclidean distance between (x1, y1) and (x2, y2).
 */
function euclideanDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x1-x2, 2) + Math.pow(y1-y2, 2));
}

/**
 * Removes the element with the given ID from the array
 */
function removeFromArray(id, array) {
    for (var i = 0; i < array.length; i++) {
        if (array[i].id == id) {
            return array.splice(i, 1);
        }
    }
}

function Food(image, x, y) {
    this.id = getUniqueId();
    this.x = x;
    this.y = y;
    this.centre_x = x + Math.floor(FOOD_SIZE/2);
    this.centre_y = y + Math.floor(FOOD_SIZE/2);
    this.image = image;
    this.timeEaten = null;  // when food is eaten, this will be set to the time 
                            //this happened

    food.push(this);
    
    /**
     * Draws this Food onto the canvas with the top left corner at x and y.
     * @param canvas The canvas element being used
     * @param context The context for the canvas
     */
    this.draw = function(canvas, context) {
        if (this.isEaten()) {
            var timeSinceEaten = Date.now() - this.timeEaten;
            if (timeSinceEaten > 2000) {
                removeFromArray(this.id, eatenFood);
                return;
            } else {
                context.globalAlpha = 1 - timeSinceEaten / 2000;
            }
        } else {
            context.globalAlpha = 1;
        }
        context.drawImage(this.image, this.x, this.y, FOOD_SIZE, FOOD_SIZE);
        context.globalAlpha = 1;  // reset so that it does not affect others
    };
    
    /**
     * A Bug is to call this function on this Food that causes it to be eaten.
     */
    this.eat = function() {
        this.timeEaten = Date.now();
        removeFromArray(this.id, food);
        eatenFood.push(this);
    };

    this.isEaten = function() {
        return this.timeEaten !== null;
    };

}

// type is 1 for orange bug (cockroach), 2 for red bug (fire ant), 3 for black
// bug (black widow spider)
// angle is the angle clockwise from the horizontal in radians, where the bug
// will be facing
function Bug(x, type, angle) {
    this.id = getUniqueId();
    this.x = x;
    this.y = 0;
    this.angle = angle;
    this.type = type;
    this.bugCollision = false;
    this.prevFrameCollision = false;  
    this.timeKilled = null;  // when bug is killed, this will be set to the time
                             // this happened         
    
    bugs.push(this);
    
    this.draw = function(canvas, context) {
        if (this.isDead()) {
            var timeDead = Date.now() - this.timeKilled;
            if (timeDead > 2000) {
                removeFromArray(this.id, deadBugs);
                return;
            } else {
                context.globalAlpha = 1 - timeDead / 2000;
            }
        } else {
            context.globalAlpha = 1;
        }
        if (this.type == 3) {
            drawBlackWidowSpider(canvas, context, this.x, this.y, this.angle);
        } else if (this.type == 2) {
            drawFireAnt(canvas, context, this.x, this.y, this.angle);
        } else {
            drawCockroach(canvas, context, this.x, this.y, this.angle);
        }
        context.globalAlpha = 1;  // reset so nothing else is affected
    };

    this.murder = function() {
        this.timeKilled = Date.now();
        removeFromArray(this.id, bugs);
        if (this.type == 3) {
            score += 5;
        } else if (this.type == 2) {
            score += 3;
        } else {
            score += 1;
        }
        deadBugs.push(this);
    };

    this.isDead = function() {
        return this.timeKilled !== null;
    };

    this.move = function(framerate) {
        // bug was killed or no food left
        if (this.isDead() || food.length == 0) {
            return;
        }
        
        var moveRate;
        if (this.type == 1) {
            moveRate = level == 2 ? 80 : 60;
        } else if (this.type == 2) {
            moveRate = level == 2 ? 100 : 75;
        } else {
            moveRate = level == 2 ? 200 : 150;
        }
		
        // find the closest food
        var closestFood = null;
        var foodDistance = null;
        for (var i = 0; i < food.length; i++) {
            var currentFood = food[i];
            var currentDistance = euclideanDistance(this.x, this.y,
                    currentFood.centre_x, currentFood.centre_y);
            if (closestFood == null || currentDistance < foodDistance) {
                closestFood = currentFood;
                foodDistance = currentDistance;
            }
        }

        // Collision Variables
        var BLACK_Y = 130;
        var RED_Y = 90;
        var DOWN_Y = -20;
        var SAME_BUG_Y = 40;
        var DIST_X = 95;
        var SAME_BUG_X = 60;


        this.bugCollision=false;
        var moveLeft = false;
        var moveOnlyDown = false;
        var xDistCollision = 0;
        // Check distance to other bugs
        for (var i = 0; i < bugs.length ; i++) {
            var yDist = this.y - bugs[i].y;
            var xDist = Math.abs(this.x - bugs[i].x);
            xDistCollision = xDist;
            if (bugs[i].id != this.id && this.type < bugs[i].type) {
                // collide earlier due to black bug
                if (yDist < BLACK_Y &&  yDist > DOWN_Y && xDist < DIST_X 
                        && bugs[i].type == 3) {
                    
                    this.bugCollision = true;
                    if (this.x < bugs[i].x) {
                        moveLeft = true;
                    }
                } else if (yDist < RED_Y &&  yDist > DOWN_Y && xDist < DIST_X 
                        && bugs[i].type != 3) {
                    this.bugCollision = true;
                    if(this.x < bugs[i].x)
                        moveLeft = true;

                }
                //Same type of bug
            } else if (bugs[i].id != this.id && this.type == bugs[i].type) {
                if (yDist < SAME_BUG_Y &&  yDist > DOWN_Y && xDist < SAME_BUG_X
                        && bugs[i].type == 3) {
                    this.bugCollision = true;
                    if (this.x < bugs[i].x) 
                        moveLeft = true;
                
                }
            }
        }
        prevFrameCollision = this.bugCollision;
        if (prevFrameCollision && xDistCollision > (DIST_X - 5)) {
            //Slowdown and only go down, fixes some jittery movements
            this.y += 0.8*moveRate / framerate;
            //this.angle = Math.PI/2;

        } else if (this.bugCollision) {
            this.angle = Math.atan(0.25);
             if (moveLeft) {
                this.x -= 0.8*moveRate / framerate;
                this.y += 0.2*moveRate / framerate;
            } else {
                this.x += 0.8*moveRate / framerate;
                this.y += 0.2*moveRate / framerate;
            }
        } else {
           // move to the closest food
            this.angle = Math.atan2(closestFood.centre_y-this.y, 
                closestFood.centre_x-this.x);
            if (this.angle < 0) this.angle += 2 * Math.PI;
            var distance = moveRate / framerate;
            this.x += distance * Math.cos(this.angle);
            this.y += distance * Math.sin(this.angle);
        }


        // eat the food if close enough
        if (foodDistance <= 10) {
            closestFood.eat();
        }
    
    };
}

/**
 * Draws a black widow spider with the "centre" (the point where its head and
 * body join) at (x, y) facing the given angle (in radians) clockwise away from
 * the horizontal.
 */
function drawBlackWidowSpider(canvas, context, x, y, angle) {
    context.save();
    context.translate(x,y);
    context.rotate(angle-(Math.PI/2));
    drawBlackSpider(context,0,0);
    context.restore();
}

/**
 * Draws a fire ant with the "centre" (the point where its head and body join) 
 * at (x, y) facing the given angle (in radians) counterclockwise away from the
 * horizontal.
 */
function drawFireAnt(canvas, context, x, y, angle) {
    context.save();
    context.translate(x,y);
    context.rotate(angle-(Math.PI/2));
    makeRedAnt(context,0,0);
    context.restore();

}

/**
 * Draws a cockroach with the "centre" (the point where its head and wings join)
 * at (x, y) facing the given angle (in radians) counterclockwise away from the
 * horizontal.
 */
function drawCockroach(canvas, context, x, y, angle) {
    context.save();
    context.translate(x,y);
    context.rotate(angle-(Math.PI/2));
    makeCockroach(context,0,0);
    context.restore();

}
