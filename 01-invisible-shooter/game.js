var WIDTH = 800,
    HEIGHT = 400,
    avatar,
    enemyManager,
    scoreManager,
    LEFT = 37, UP = 38, RIGHT = 39, DOWN = 40, FIRE = 16, RESET = 27;

var sfx = {
    fire: new Audio("sound/missile.wav"),
    enemyHit: new Audio("sound/hit.wav"),
    avatarHit: new Audio("sound/hurt.wav")
};


var Game = function (canvas) {
    var that = this,
        INTERVAL = 30,
        timer = -1,
        previousTime = 0;

    this.currentState = null;
    this.introState = null;
    this.gameplayState = null;

    this.onFrame = function () {
        var currentTime = new Date().getTime(),
            timeElapsed;

        if (previousTime === 0) {
            previousTime = currentTime;
        }

        timeElapsed = currentTime - previousTime;

        that.clearCanvas(canvas);
        // Only update the currentState.
        that.currentState.update (timeElapsed, currentTime);
        that.currentState.draw (canvas, timeElapsed, currentTime);

        previousTime = currentTime;
    };

    this.init = function () {
        timer = setInterval( that.onFrame, INTERVAL );
        that.reset();
    };

    this.startGame = function () {
        that.clearCanvas();
        that.gameplayState = new GameplayState(that);
        that.currentState = that.gameplayState;
        that.introState = null;
    };

    this.reset = function () {
        that.clearCanvas();
        that.introState = new IntroState(that);
        that.currentState = that.introState;
        that.gameplayState = null;
    };

    this.clearCanvas = function () {
        var context = canvas.getContext("2d");
        context.beginPath();
        context.rect(0, 0, WIDTH, HEIGHT);
        context.fillStyle = "#CCCC99";
        context.fill();
    };
};


function IntroState (game) {
    var that = this;
    this.game = game;

    var img = new Image();
    img.src = "img/title.png";

    var waitTime = 200;

    // startTime thing prevents accidentally starting the game again.
    var startTime = 0;

    this.update = function (timeElapsed, currentTime) {
        if (startTime === 0) {
            startTime = currentTime;
        }

        var runningTime = currentTime - startTime;

        if (runningTime > waitTime &&
            key.getPressedKeyCodes().length >= 1) {
            this.game.startGame();
        }
    };

    this.draw = function (canvas, timeElapsed, currentTime) {
        var context = canvas.getContext("2d");
        context.drawImage (img, 0, 0, WIDTH, HEIGHT);
    };
}

function GameplayState (game) {
    var that = this;

    this.game = game;

    var avatar = new Avatar();
    var enemyManager = new EnemyManager();
    var scoreManager = new ScoreManager();

    this.update = function (timeElapsed, currentTime) {
        enemyManager.update(timeElapsed, currentTime);

        // quit game on ESC
        if (key.isPressed(RESET)) {
            this.game.reset();
        }

        if (key.isPressed(RIGHT)) {
            avatar.x += avatar.vx;
        }

        if (key.isPressed(LEFT)) {
            avatar.x -= avatar.vx;
        }

        if (key.isPressed(UP)) {
            avatar.y -= avatar.vy;
        }

        if (key.isPressed(DOWN)) {
            avatar.y += avatar.vy;
        }

        if (key.isPressed(FIRE) && avatar.canFire()) {
            avatar.spawnBullet();
        }

        // constrain avatar to bounds of screen.
        avatar.x = Math.max(0, Math.min(avatar.x, WIDTH - avatar.size));
        avatar.y = Math.max(0, Math.min(avatar.y, HEIGHT - avatar.size));

        var bullet = avatar.bullet;
        if (bullet) {
            bullet.vx += bullet.ax;
            bullet.x += bullet.vx;

            if (bullet.x > WIDTH) {
                avatar.killBullet();
            }
        }

        that.detectCollisions();
    };

    this.draw = function (canvas, timeElapsed, currentTime) {
        var context = canvas.getContext("2d");
            bullet = avatar.bullet;

        enemyManager.draw(canvas, timeElapsed, currentTime);
        scoreManager.draw(canvas, timeElapsed, currentTime);

        if (bullet) {
            bullet.draw(context);
        }

        avatar.draw(context);
    };

    this.detectCollisions = function () {
        for (var i = 0; i < enemyManager.enemies.length; i++) {
            var enemy = enemyManager.enemies[i];

            if (! enemy) {
                continue;
            }

            if (
                (avatar.x + avatar.size > enemy.x && avatar.x < enemy.x + enemy.size) &&
                (avatar.y + avatar.size > enemy.y && avatar.y < enemy.y + enemy.size)
               ) {
                that.resolveEnemyHitAvatar(enemy, avatar);
            }

            var bullet = avatar.bullet;
            if (bullet &&
                (bullet.x + bullet.size > enemy.x && bullet.x < enemy.x + enemy.size) &&
                (bullet.y + bullet.size > enemy.y && bullet.y < enemy.y + enemy.size)) {
                that.resolveBulletHitEnemy(bullet, enemy);
            }
        }
    };

    this.resolveEnemyHitAvatar = function (enemy, avatar) {
        enemyManager.killEnemy(enemy);
        avatar.hitPoints--;
        avatar.x -= 40;
        console.log("OUCH!");
        sfx.avatarHit.play();
    };

    this.resolveBulletHitEnemy = function (bullet, enemy) {
        enemyManager.killEnemy(enemy);
        avatar.killBullet();
        scoreManager.incrementScore();
        sfx.enemyHit.play();
    };
}

function Avatar() {
    // Position
    this.x = 0;
    this.y = 0;

    // Velocity
    this.vx = 10;
    this.vy = 10;

    this.hitPoints = 10;

    this.size = 50;
    this.color = "#9900FF";

    this.draw = function (context) {
        context.beginPath();
        context.rect(this.x, this.y, this.size, this.size);
        context.fillStyle = this.color;
        context.fill();
    };

    this.bullet = null;

    this.canFire = function () {
        return this.bullet === null;
    };

    this.spawnBullet = function () {
        this.bullet = new Bullet();
        this.bullet.x = this.x + this.size;
        this.bullet.y = this.y + this.size / 2;
        sfx.fire.play();
    };

    this.killBullet = function () {
        this.bullet = null;
    };

}

function Bullet () {
    this.x = 0;
    this.y = 0;

    this.vx = 0;
    this.ax = 1;

    this.size = 10;
    this.color = "#000000";

    this.draw = function (context) {
        context.beginPath();
        context.rect(this.x, this.y, this.size, this.size);
        context.fillStyle = this.color;
        context.fill();
    };
}

function Enemy (startTime) {
    this.x = 0;
    this.y = 0;

    this.startTime = startTime;

    this.size = 50;
    this.color = "#FF0000";

    this.draw = function (context) {
        context.beginPath();
        context.rect(this.x, this.y, this.size, this.size);
        context.fillStyle = this.color;
        context.fill();
    };

}

function EnemyManager () {
    this.enemies = [];
    this.SPEED = -5;
    this.SPAWN_FREQUENCY = 800;
    this.spawnTimer = 0;

    this.spawnEnemy = function (currentTime) {
        var enemy = new Enemy(currentTime);

        enemy.x = WIDTH;
        enemy.y = Math.random() * (HEIGHT - enemy.size);

        console.log("Spawned enemy");

        this.enemies.push(enemy);
    };

    this.update = function (timeElapsed, currentTime) {
        this.spawnTimer += timeElapsed;
        if (this.spawnTimer > this.SPAWN_FREQUENCY) {
            this.spawnEnemy(currentTime);
            this.spawnTimer = 0;
        }

        for (var i = 0; i < this.enemies.length; i++ ) {
            var enemy = this.enemies[i];
            if (enemy !== null) {
                enemy.x += this.SPEED;

                // If enemy goes off screen.
                if (enemy.x + enemy.size < 0) {
                    this.killEnemy(enemy);
                }
            }
        }
    };

    this.draw = function (canvas, timeElapsed, currentTime) {
        var context = canvas.getContext("2d");
        for (var i = 0; i < this.enemies.length; i++ ) {
            var enemy = this.enemies[i];
            if (enemy !== null) {
                enemy.draw(context, timeElapsed, currentTime);
            }
        }
    };

    this.killEnemy = function (enemy) {
        var i = this.enemies.indexOf(enemy);
        if (i >= 0) {
            this.enemies.splice(i, 1);
        }
    };
}

function ScoreManager() {
    this.score = 0;

    this.x = WIDTH / 2;
    this.y = 40;

    this.incrementScore = function () {
        this.score += 100;
    };

    this.resetScore = function () {
        this.score = 0;
    };

    this.draw = function (canvas, timeElapsed, currentTime) {
        var context = canvas.getContext("2d"),
            text = this.score;

        context.font = "32px Arial";
        context.fillStyle = "white";
        context.fillText(text, this.x, this.y);
    };
}

window.onload = function(){
    var canvas = document.getElementById("game");

    var game = new Game(canvas);
    game.init();
};