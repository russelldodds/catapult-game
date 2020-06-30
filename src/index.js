import Phaser from 'phaser';

import constants from './configs/constants';
import TitleScene from './scenes/titleScene';
import GameScene from './scenes/gameScene';

import firebase from 'firebase/app';
import 'firebase/database';

const config = {
  type: Phaser.AUTO,
  backgroundColor: 0xFFCA33,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: 'gamediv',
    width: constants.width,
    height: constants.height
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      tileBias: 32,
      overlapBias: 8,
      useTree: false,
      fps: 30
    }
  }
};

// init firebase
firebase.initializeApp(constants.firebase);
const database = firebase.database();

// load phaser
let game = new Phaser.Game(config);

// load scenes
game.scene.add('titleScene', new TitleScene(), false, { database: database });
game.scene.add('gameScene', new GameScene(), false, { database: database });

// start title
game.scene.start('titleScene', { database: database} );
