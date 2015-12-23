var menuState = {
    create: function () {
        var tween;

        game.add.image(0, 0, 'background');

        var nameLabel = game.add.text(game.world.centerX, -50, 'Super Cloned Box',
                                      {font: '50px Geo', fill: '#ffffff'});
        nameLabel.anchor.setTo(0.5, 0.5);
        tween = game.add.tween(nameLabel).to({y: 60}, 1000);
        tween.easing(Phaser.Easing.Bounce.Out).start();

        if (!localStorage.bestScore) {
            localStorage.bestScore = 0;
        }
        if (game.global.score > localStorage.bestScore) {
            localStorage.bestScore = game.global.score;
        }

        var text = 'score: ' + game.global.score + '\nbest score: ' + localStorage.bestScore;
        var scoreLabel = game.add.text(game.world.centerX, game.world.centerY - 40,
                                       text,
                                       {font: '25px Geo', fill: '#ffffff', align: 'center'});
        scoreLabel.anchor.setTo(0.5, 0.5);

        if (game.device.desktop) {
            var startLabelText = 'press the up arrow key to start';
        } else {
            var startLabelText = 'touch the screen to start';
        }
        var startLabel = game.add.text(game.world.centerX, game.world.height - 130,
                                       startLabelText,
                                       {font: '25px Geo', fill: '#ffffff'});
        startLabel.anchor.setTo(0.5, 0.5);

        tween = game.add.tween(startLabel)
        tween.to({angle: -2}, 500).to({angle: 2}, 500);
        tween.loop().start();

        commandsLabelText = 'Use arrow keys or WASD to move\nPress down or S to use bomb'
        var comandsLabel = game.add.text(game.world.centerX, game.world.height - 40,
                                         commandsLabelText,
                                         {font: '20px Geo', fill: '#ffffff', align: 'center'});
        comandsLabel.anchor.setTo(0.5, 0.5);

        var upKey = game.input.keyboard.addKey(Phaser.Keyboard.UP);
        upKey.onDown.addOnce(this.start, this);
        game.input.onDown.addOnce(this.start, this);

        this.muteButton = game.add.button(20, 20, 'mute', this.toggleSound, this);
        this.muteButton.input.useHandCursor = true;
        if (game.sound.mute) {
            this.muteButton.frame = 1;
        }
    },
    start: function () {
        game.state.start('play');
    },
    toggleSound: function() {
        game.sound.mute = ! game.sound.mute;
        this.muteButton.frame = game.sound.mute ? 1 : 0;
    },
}
