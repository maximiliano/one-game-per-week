var bootState = {
    preload: function () {
        game.load.image('progressBar', 'assets/progressBar.png');
    },
    create: function () {
        game.stage.backgroundColor = '#a9f2ba';
        game.physics.startSystem(Phaser.Physics.ARCADE);

        game.scale.pageAlignHorizontally = true;
        game.scale.pageAlignVertically = true;

        game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        game.scale.minWidth = 250;
        game.scale.minHeight = 170;
        game.scale.maxWidth = 1000;
        game.scale.maxHeight = 680;

        // Apply the scale changes
        game.scale.setScreenSize = true;

        if (!game.device.desktop) {
            document.body.backgroundColor = '#3498db';
        }
        game.state.start('load');
    }
}