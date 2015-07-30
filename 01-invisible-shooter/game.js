var previousTime = 0,
    INTERVAL = 30,
    WIDTH = 800,
    HEIGHT = 400,
    avatar,
    enemyManager,
    scoreManager,
    LEFT = 37, UP = 38, RIGHT = 39, DOWN = 40, FIRE = 16;

window.onload = function(){
    var canvas = document.getElementById("game"),
        context = canvas.getContext("2d");

    avatar = new Avatar();
    enemyManager = new EnemyManager();
    scoreManager = new ScoreManager();

    // Main Loop
    setInterval(
        function () {
            var currentTime = new Date().getTime(),
                timeElapsed;

            if (previousTime === 0) {
                previousTime = currentTime;
            }

            timeElapsed = currentTime - previousTime;

            update(timeElapsed, currentTime);
            draw(canvas, timeElapsed, currentTime);

            previousTime = currentTime;
        }, INTERVAL);
};

function update(timeElapsed, currentTime) {
    enemyManager.update(timeElapsed, currentTime);

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

    // Constrain avatar to bounds of screen.
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

    detectCollisions();
}

function detectCollisions () {
    for (var i = 0; i < enemyManager.enemies.length; i++) {
        var enemy = enemyManager.enemies[i];

        if (! enemy) {
            continue;
        }

        if (
            (avatar.x + avatar.size > enemy.x && avatar.x < enemy.x + enemy.size) &&
            (avatar.y + avatar.size > enemy.y && avatar.y < enemy.y + enemy.size)
           ) {
            resolveEnemyHitAvatar(enemy, avatar);
        }

        var bullet = avatar.bullet;
        if (bullet &&
            (bullet.x + bullet.size > enemy.x && bullet.x < enemy.x + enemy.size) &&
            (bullet.y + bullet.size > enemy.y && bullet.y < enemy.y + enemy.size)) {
            resolveBulletHitEnemy(bullet, enemy);
        }
    }
}

function resolveEnemyHitAvatar(enemy, avatar) {
    enemyManager.killEnemy(enemy);
    avatar.hitPoints--;
    avatar.x -= 40;
    console.log("OUCH!");
}

function resolveBulletHitEnemy (bullet, enemy) {
    enemyManager.killEnemy(enemy);
    avatar.killBullet();
    scoreManager.incrementScore();
}


function draw(canvas, timeElapsed, currentTime) {
    var context = canvas.getContext("2d");
        bullet = avatar.bullet;
    clearCanvas(canvas);

    enemyManager.draw(canvas, timeElapsed, currentTime);
    scoreManager.draw(canvas, timeElapsed, currentTime);

    if (bullet) {
        bullet.draw(context);
    }

    avatar.draw(context);
}

function clearCanvas(canvas) {
    var context = canvas.getContext("2d");
    context.beginPath();
    context.rect(0, 0, WIDTH, HEIGHT);
    context.fillStyle = "#CCCC99";
    context.fill();
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
