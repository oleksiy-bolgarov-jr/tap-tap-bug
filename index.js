var FRAMERATE = 30;  // frames per second
var CLICKBOX = 30;  // px
var newBugTimeout, animationInterval;
var timerInterval, timeLeft, timer;
var gameRunning = false;
var paused = false;
var level;

// Load the array of images to be used as food
var imageFilenames = [
    "apple.jpg", // Obtained from https://sprayitaway.com/wp-content/uploads/2013/08/apple_by_grv422-d5554a4.jpg
    "cake.jpg", // Obtained from http://happy-birthdaycake.com/wp-content/uploads/2015/09/Happy-Birthday-Cake-For-Uncle33.jpg
    "cherry-pie.png", // Obtained from http://media.lolusercontent.com/api/embedly/1/image/resize?url=http%3A%2F%2Fwww.prioryfinepastries.com%2Fwp-content%2Fgallery%2Fpies%2Fcherry-pie.png&key=a45e967db0914c7fb472fd4381e6c85b&width=425
    "chicken.png", // Obtained from https://www.swisschalet.com/images/menu-images/Category_460x244_0004_C_HalfChickenDinner.png
    "fruits.jpg", // Obtained from https://res.cloudinary.com/streethub/image/upload/c_scale,fl_progressive,w_460/brand/530df3dc6aa9530000000179/vxuYne60S6iP7IoDgzP8
    "hamburger.png", // Obtained from https://d1nqx6es26drid.cloudfront.net/app/uploads/2015/04/04043817/product-hamburger.png
    "hot-pepper.jpg", // Obtained from http://dietsinreview.s3.amazonaws.com/diet_column/wp-content/uploads/2012/05/hot-pepper.jpg
    "lollipop.jpg", // Obtained from http://boldstreetsweets.co.uk/wp-content/uploads/2013/08/scorpion-bug-pop-41.jpg
    "pizza.png" // Obtained from http://corp.7-eleven.com/images/140127-pizza.jpg
] 
var foodImages = new Array();
for (var i = 0; i < imageFilenames.length; i++) {
    var img = new Image();
    img.src = "images/" + imageFilenames[i];
    foodImages.push(img);
}
var startPage, level1radioButton, level2radioButton, startButton;
var level1highScoreDisplay, level2highScoreDisplay;
var gamePage, statusBar, gameCanvas, gameContext;

window.onload = function() {
    startPage = document.getElementById("start-page");
    level1radioButton = document.getElementById("level-1-select");
    level2radioButton = document.getElementById("level-2-select");
    level1highScoreDisplay = document.getElementById("level-1-score");
    level1highScoreDisplay.innerHTML = localStorage.getItem("highscore1");
    level2highScoreDisplay = document.getElementById("level-2-score");
    level2highScoreDisplay.innerHTML = localStorage.getItem("highscore2");
    
    startButton = document.getElementById("start-button");
    startButton.onclick = startButtonClick;

    gamePage = document.getElementById("game");

    statusBar = document.getElementById("status-bar");
    statusBarContext = statusBar.getContext("2d");
    statusBar.addEventListener("mousedown", pauseButtonClick, false);

    gameCanvas = document.getElementById("game-canvas");
    gameContext = gameCanvas.getContext("2d");
};

/**
 * Returns a random integer in the range [start, stop], i.e. between start and
 * stop, possibly including either.
 * @param start The result will be greater than or equal to this
 * @param stop The result will be less than or equal to this
 */
function getRandomInt(start, stop) {
    var range = stop - start + 1;
    return Math.floor(Math.random() * range + start);
}

function startButtonClick() {
    startPage.style.display = "none";
    gamePage.style.display = "block";
    if (level2radioButton.checked)
        level = 2;
    else
        level = 1;
    gameStart();
}

/**
* Returns whether or not the new food location collides 
* with an existing food
* @param x position of new food
* @param y podition of new food
*/
function isFoodCollision(x,y) {

    for(var i = 0; i < food.length; i++) {
        var dist = euclideanDistance(food[i].x,food[i].y,x,y);
        if(dist < FOOD_SIZE*2) 
            return true;
    }
    return false;
}

function gameStart() {
    console.log("Starting level " + level);
    // first, clear the gameCanvas
    gameCanvas.removeEventListener("mousedown", gameOverScreenButtons, false);
    gameCanvas.addEventListener("mousedown", tryToAnnihilate, false);
    gameContext.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    food.length = 0; // empty the food array
    bugs.length = 0; // empty the array of bugs
    score = 0;

    gameRunning = true;

    var x, y, foodImg;
    for (var i = 0; i < 5; i++) {
        do {
            x = getRandomInt(0, gameCanvas.width-FOOD_SIZE);
            y = getRandomInt(0.2*gameCanvas.height, gameCanvas.height-FOOD_SIZE);
        } while (isFoodCollision(x,y));
        
        foodImg = foodImages[getRandomInt(0, foodImages.length-1)];
        new Food(foodImg, x, y).draw(gameCanvas, gameContext);
    }
    newBugTimeout = setTimeout(newBugTiming, 2000);
    animationInterval = setInterval(nextFrame, 1000/FRAMERATE);
    timeLeft = 60;
    timer = "60 seconds left"
    timerInterval = setInterval(timerCountdown, 1000);
    updateStatusBar();
}

function gameEnd() {
    clearInterval(timerInterval);
    clearTimeout(newBugTimeout);
    clearInterval(animationInterval);
    timer = "Timer inactive";
    eatenFood.length = 0;
    deadBugs.length = 0;
    updateStatusBar();
    gameRunning = false;
    gameContext.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    gameContext.font = "60px sans-serif";
    gameContext.fillStyle = "black";
    gameContext.textAlign = "center";
    gameContext.fillText("GAME OVER", gameCanvas.width/2, gameCanvas.height/4);
    gameContext.font = "30px sans-serif";
    gameContext.fillText("Your score was "+score, gameCanvas.width/2, 
            gameCanvas.height/2);
    gameContext.fillStyle = "#cccccc";
    gameContext.fillRect(10, 3*gameCanvas.height/4-25, gameCanvas.width/2-15, 
            50);
    gameContext.fillRect(gameCanvas.width/2+5, 3*gameCanvas.height/4-25, 
            gameCanvas.width/2-15, 50);
    gameContext.fillStyle = "black";
    gameContext.textAlign = "center";
    gameContext.fillText("RESTART", gameCanvas.width/4, 
            3*gameCanvas.height/4+12);
    gameContext.fillText("EXIT", 3*gameCanvas.width/4, 
            3*gameCanvas.height/4+12);
    gameCanvas.removeEventListener("mousedown", tryToAnnihilate, false);
    gameCanvas.addEventListener("mousedown", gameOverScreenButtons, false);
    uploadScore();
}

function uploadScore() {
    var highScoreKey = level == 2 ? "highscore2" : "highscore1";
    var currentHighScore = Number(localStorage.getItem(highScoreKey));
    if (score > currentHighScore) {
        localStorage.setItem(highScoreKey, score);
    }
}

function timerCountdown() {
    timeLeft--;
    if (timeLeft <= 0) {
        timesUp();
    } else if (timeLeft <= 1) {
        timer = "1 second left";
    } else {
        timer = timeLeft + " seconds left";
    }
    updateStatusBar();
}

function timesUp() {
    gameEnd();
    if (level == 1) {
        level = 2;
        gameStart();
    }
}

/**
 * Returns a type for a new Bug
 */
function getBugType() {
    var rand = Math.random();
    return rand < 0.3 ? 3 :
        rand < 0.6 ? 2 :
        1;
}

function drawPauseButton() {
    if (paused) {
        // Draw a resume button instead of a pause button
        statusBarContext.beginPath();
        statusBarContext.moveTo(185, 5);
        statusBarContext.lineTo(215, 20);
        statusBarContext.lineTo(185, 35);
        statusBarContext.closePath();
        statusBarContext.fill();
    } else {
        statusBarContext.fillRect(185, 5, 10, 30);
        statusBarContext.fillRect(205, 5, 10, 30);
    }
}

function updateStatusBar() {
    statusBarContext.clearRect(0, 0, statusBar.width, statusBar.height);
    statusBarContext.font = "20px sans-serif";
    statusBarContext.fillStyle = "black";
    
    statusBarContext.textAlign = "left";
    statusBarContext.fillText(timer, 5, 25);

    statusBarContext.textAlign = "right";
    statusBarContext.fillText(score, 395, 25);

    drawPauseButton();
}

function drawAll() {
    gameContext.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    for (var i = 0; i < food.length; i++) {
        food[i].draw(gameCanvas, gameContext);
    }
    for (var i = 0; i < eatenFood.length; i++) {
        eatenFood[i].draw(gameCanvas, gameContext);
    }

    for (var i = 0; i < bugs.length; i++) {
        bugs[i].draw(gameCanvas, gameContext);
    }
    for (var i = 0; i < deadBugs.length; i++) {
        deadBugs[i].draw(gameCanvas, gameContext);
    }
}

function moveBugs() {
    for (var i = 0; i < bugs.length; i++) {
        bugs[i].move(FRAMERATE);
    }
}

function newBug() {
    var x = getRandomInt(10, gameCanvas.width-10);
    new Bug(x, getBugType(), 0, 1);
}

function newBugTiming() {
    newBug();
    var delay = getRandomInt(1000, 3000);
    if (gameRunning) {
        newBugTimeout = setTimeout(newBugTiming, delay);
    }
}

function nextFrame() {
    moveBugs();
    drawAll(gameCanvas, gameContext);
    if (food.length == 0) {
        gameEnd();
    }
    if (!gameRunning) {
        clearInterval(animationInterval);
    }
}

function tryToAnnihilate(click) {
    var x = click.offsetX;
    var y = click.offsetY;
    for (var i = 0; i < bugs.length; i++) {
        if (euclideanDistance(x, y, bugs[i].x, bugs[i].y) < CLICKBOX) {
            bugs[i].murder();
        }
    }
    updateStatusBar();  // to update score
}

function gameOverScreenButtons(click) {
    var x = click.offsetX;
    var y = click.offsetY;
    console.log(x + ", " + y);
    // Restart
    if (x > 10 && x < 195 && y > 425 && y < 475) {
        gameCanvas.removeEventListener("mousedown", gameOverScreenButtons, 
                false);
        gameStart();
    } else if (x > 205 && 350 && y > 425 && y < 475) {
        location.reload();
    }
}

function pauseButtonClick(click) {
    var x = click.offsetX;
    var y = click.offsetY;
    if (x > 180 && x < 220) {
        if (gameRunning) {
            if (!paused) {
                pause();
            } else {
                unpause();
            }
        }
    }
}

function pause() {
    paused = true;
    clearTimeout(newBugTimeout);
    clearInterval(animationInterval);
    clearInterval(timerInterval);
    // prevent killing bugs while game is paused
    gameCanvas.removeEventListener("mousedown", tryToAnnihilate, false);
    updateStatusBar();
}

function unpause() {
    paused = false;
    newBugTimeout = setTimeout(newBugTiming, 1000);
    animationInterval = setInterval(nextFrame, 1000/FRAMERATE);
    timerInterval = setInterval(timerCountdown, 1000);
    gameCanvas.addEventListener("mousedown", tryToAnnihilate, false);
    updateStatusBar();
}
