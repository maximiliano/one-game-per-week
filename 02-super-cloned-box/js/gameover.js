gameOverState = {
    create: function() {
        game.stage.backgroundColor = '#3498db';

        game.add.text(game.world.centerX, game.world.centerY - 40,
                      'GAME OVER!',
                      {font: '40px Geo', fill: '#000000', align: 'center'}
                      ).anchor.setTo(0.5, 0.5);

        var retryLabel = game.add.text(game.world.centerX, game.world.centerY,
                      'Press up to try again',
                      {font: '20px Geo', fill: '#000000', align: 'center'});
        retryLabel.anchor.setTo(0.5, 0.5);

        if (game.device.desktop) {
            var retryLabelText = 'press up to try again';
        } else {
            var retryLabelText = 'touch the screen to try again';
        }

        var tween = game.add.tween(retryLabel)
        tween.to({angle: -2}, 500).to({angle: 2}, 500);
        tween.loop().start();

        var upKey = game.input.keyboard.addKey(Phaser.Keyboard.UP);
        upKey.onDown.addOnce(this.retry, this);
        game.input.onDown.addOnce(this.retry, this);


        commandsLabelText = 'Use arrow keys or WASD to move\nPress down or S to use bomb'
        var comandsLabel = game.add.text(game.world.centerX, game.world.height - 40,
                                         commandsLabelText,
                                         {font: '20px Geo', fill: '#000000', align: 'center'});
        comandsLabel.anchor.setTo(0.5, 0.5);
    },
    retry: function () {
        game.state.start('menu');
    }
};