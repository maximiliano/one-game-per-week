var playState = {
    create: function() {
        game.stage.backgroundColor = '#a9f2ba';
        this.player = game.add.sprite(game.world.centerX, game.world.centerY, 'player');
        this.coin = game.add.sprite(60, 140, 'coin');
        this.playerBombs = 0;

        // Set anchor point to center of sprite
        this.player.anchor.setTo(0.5, 0.5);
        this.coin.anchor.setTo(0.5, 0.5);

        game.physics.enable(this.player);
        game.physics.enable(this.coin);
        this.player.body.gravity.y = 500;

        this.enemies = game.add.group();
        this.enemies.enableBody = true;
        this.enemies.createMultiple(10, 'enemy');

        this.bombs = game.add.group();
        this.bombs.enableBody = true;
        this.bombs.createMultiple(3, 'bomb');

        this.cursor = game.input.keyboard.createCursorKeys();
        this.createWorld();
        this.addScoreBoard();
        this.addBombCounter();

        this.jumpSound = game.add.audio('jump');
        this.coinSound = game.add.audio('coin');
        this.deadSound = game.add.audio('dead');

        this.player.animations.add('right', [1, 2], 8, true);
        this.player.animations.add('left', [3, 4], 8, true);

        this.deathEmitter = this.createParticleEmitter('whitePixel');
        this.coinEmitter = this.createParticleEmitter('yellowPixel');
        this.bombEmitter = this.createParticleEmitter('grayPixel');
        this.explosionEmitter = this.createParticleEmitter('redPixel')

        this.nextEnemy = 0;

        game.input.keyboard.addKeyCapture([Phaser.Keyboard.UP,
                                           Phaser.Keyboard.DOWN,
                                           Phaser.Keyboard.LEFT,
                                           Phaser.Keyboard.RIGHT]);

        this.wasd = {
            up: game.input.keyboard.addKey(Phaser.Keyboard.W),
            left: game.input.keyboard.addKey(Phaser.Keyboard.A),
            down: game.input.keyboard.addKey(Phaser.Keyboard.S),
            right: game.input.keyboard.addKey(Phaser.Keyboard.D)
        };

        if (!game.device.desktop) {
            this.addMobileInputs();
        }
    },
    update: function() {
        // Be careful to always add the collisions at the beginning of the update function,
        // otherwise it might cause some bugs.
        game.physics.arcade.collide(this.player, this.layer);
        game.physics.arcade.collide(this.enemies, this.layer);
        game.physics.arcade.overlap(this.player, this.coin, this.takeCoin, null, this);
        game.physics.arcade.overlap(this.player, this.bombs, this.takeBomb, null, this);
        game.physics.arcade.overlap(this.player, this.enemies, this.playerDie, null, this);

        if (this.nextEnemy < game.time.now) {
            var start = 4000, end = 1000, score = 20;
            // Formula to decrease the delay between enemies over time
            // At first it's 4000ms, then slowly goes to 1000ms
            var delay = Math.max(start - (start-end)*game.global.score/score, end);
            this.addEnemy();
            this.nextEnemy = game.time.now + delay;
        }

        this.playerAction();
        if (!this.player.inWorld) {
            this.playerDie();
        }
    },
    createWorld: function() {
        this.tilemap = game.add.tilemap('tilemap');
        this.tilemap.addTilesetImage('tileset');
        this.layer = this.tilemap.createLayer('Tile Layer 1');
        // Set the world size to match the size of the layer
        this.layer.resizeWorld();
        // Enable collisions for the first element of our tileset (the blue wall)
        this.tilemap.setCollision(1);
    },
    playerAction: function() {
        if (this.cursor.left.isDown || this.wasd.left.isDown || this.moveLeft) {
            this.player.body.velocity.x = -200;
            this.player.animations.play('left');
        } else if (this.cursor.right.isDown || this.wasd.right.isDown || this.moveRight) {
            this.player.body.velocity.x = 200;
            this.player.animations.play('right');
        } else {
            this.player.body.velocity.x = 0;
            this.player.frame = 0;
        }

        if (this.cursor.up.isDown || this.wasd.up.isDown) {
            this.jumpPlayer();
        }

        if ((this.cursor.down.isDown || this.wasd.down.isDown) && this.playerBombs > 0) {
            this.explodeBomb();
        }
    },
    playerDie: function() {
        if (!this.player.alive) {
            return;
        }

        this.player.kill();

        this.deadSound.play();

        this.deathEmitter.x = this.player.x;
        this.deathEmitter.y = this.player.y;
        this.deathEmitter.start(true, 600, null, 15);

        game.time.events.add(1000, this.gameOver, this);
    },
    gameOver: function () {
        game.state.start('gameOver');
    },
    addScoreBoard: function() {
        this.scoreLabel = game.add.text(30, 30, 'score: 0', {font: '18px Geo', fill: '#ffffff'});
        game.global.score = 0;
    },
    addBombCounter: function() {
        this.bombLabel = game.add.text(30, 50, 'bombs: 0', {font: '18px Geo', fill: '#ffffff'});
    },
    takeCoin: function(player, coin) {
        this.coinEmitter.x = this.coin.x;
        this.coinEmitter.y = this.coin.y;
        this.coinEmitter.start(true, 600, null, 15);

        this.coin.scale.setTo(0, 0)
        this.coinSound.play();

        game.add.tween(this.coin.scale).to({x: 1, y: 1}, 300).start();
        game.add.tween(this.player.scale).to({x: 1.3, y: 1.3}, 50).to({x: 1, y: 1}, 150).start();

        game.global.score += 1;
        this.scoreLabel.text = 'score: ' + game.global.score;
        this.updateCoinPosition();
        if (Math.random() < 0.2) {
            this.addBomb();
        }
    },
    takeBomb: function (player, bomb) {
        this.bombEmitter.x = bomb.x;
        this.bombEmitter.y = bomb.y;
        this.bombEmitter.start(true, 600, null, 15);

        bomb.kill();
        this.playerBombs += 1;
        this.updateBombLabel();
    },
    explodeBomb: function () {
        this.enemies.forEachAlive(function(enemy) {
            this.explosionEmitter.x = enemy.x;
            this.explosionEmitter.y = enemy.y;
            this.explosionEmitter.start(true, 600, null, 15);
            enemy.kill();
        }, this);
        this.playerBombs -= 1;
        this.updateBombLabel();
    },
    updateBombLabel: function () {
        this.bombLabel.text = 'bombs: ' + this.playerBombs;
    },
    updateCoinPosition: function() {
        var coinPosition = [
            // Top row
            {x: 140, y: 60}, {x: 360, y: 60},
            // Middle row
            {x: 60, y: 140}, {x: 440, y: 140},
            // Bottom row
            {x: 130, y: 300}, {x: 370, y: 300}
        ];

        // Remove the current coin position from the array
        // Otherwise the coin could appear at the same spot twice in a row
        for (var i = 0; i < coinPosition.length; i++) {
            if (coinPosition[i].x === this.coin.x) {
                coinPosition.splice(i, 1);
            }
        }

        // Randomly select a position from the array
        var newPosition = coinPosition[game.rnd.integerInRange(0, coinPosition.length-1)];

        // Set the new position of the coin
        this.coin.reset(newPosition.x, newPosition.y);
    },
    addEnemy: function() {
        var enemy = this.enemies.getFirstDead();
        if (!enemy) {
            return;
        }

        enemy.anchor.setTo(0.5, 1);
        enemy.reset(game.world.centerX, 0);
        enemy.body.gravity.y = 500;
        enemy.body.velocity.x = 100 * Phaser.Utils.randomChoice(-1, 1);
        enemy.body.bounce.x = 1;
        enemy.checkWorldBounds = true;
        enemy.outOfBoundsKill = true;
    },
    addBomb: function () {
        var bomb = this.bombs.getFirstDead();
        if (!bomb) {
            return;
        }

        bomb.anchor.setTo(0.5, 0.5);
        bomb.reset(game.world.centerX, game.world.centerY);
    },
    addMobileInputs: function () {
        this.jumpButton = game.add.sprite(350, 247, 'jumpButton');
        this.jumpButton.inputEnabled = true;
        this.jumpButton.alpha = 0.5;
        this.jumpButton.events.onInputDown.add(this.jumpPlayer, this)

        this.moveLeft = false;
        this.leftButton = game.add.sprite(50, 247, 'leftButton');
        this.leftButton.inputEnabled = true;
        this.leftButton.events.onInputOver.add(function () { this.moveLeft = true; }, this);
        this.leftButton.events.onInputOut.add(function () { this.moveLeft = false; }, this);
        this.leftButton.events.onInputDown.add(function () { this.moveLeft = true; }, this);
        this.leftButton.events.onInputUp.add(function () { this.moveLeft = false; }, this);
        this.leftButton.alpha = 0.5;

        this.moveRight = false;
        this.rightButton = game.add.sprite(130, 247, 'rightButton');
        this.rightButton.inputEnabled = true;
        this.rightButton.events.onInputOver.add(function () { this.moveRight = true; }, this);
        this.rightButton.events.onInputOut.add(function () { this.moveRight = false; }, this);
        this.rightButton.events.onInputDown.add(function () { this.moveRight = true; }, this);
        this.rightButton.events.onInputUp.add(function () { this.moveRight = false; }, this);
        this.rightButton.alpha = 0.5;

    },
    jumpPlayer: function () {
        if (this.player.body.onFloor()) {
            this.player.body.velocity.y = - 320;
            this.jumpSound.play()
        }
    },
    createParticleEmitter: function (imageName) {
        emitter = game.add.emitter(0, 0, 15);
        emitter.makeParticles(imageName);
        emitter.setYSpeed(-150, 150);
        emitter.setXSpeed(-150, 150);
        emitter.gravity = 0;
        emitter.minParticleScale = 0.5;
        emitter.maxParticleScale = 1.2;
        emitter.minRotation = 10;
        emitter.maxRotation = 100;
        return emitter;
    }
};
