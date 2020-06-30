import Phaser from 'phaser';
import WebFont from 'webfontloader';

import stars from '../assets/images/stars.png';
import clouds from '../assets/images/clouds.png';
import mountains from '../assets/images/mountains.png';
import trees from '../assets/images/trees.png';
import ground from '../assets/images/ground.png';
import music from '../assets/audio/game-music.mp3';

import { createMusicControls, createSfxControls, preloadControlImages } from '../ui/audio-controls'
import { getTopScore } from "../helpers/firebase";


class TitleScene extends Phaser.Scene {
  constructor() {
    super({key: 'titleScene'});
    this.loaded = false;
  }

  init(data) {
    this.database = data.database;
  }

  preload() {
    this.load.image('stars', stars);
    this.load.image('clouds', clouds);
    this.load.image('mountains', mountains);
    this.load.image('trees', trees);
    this.load.image('ground', ground);
    preloadControlImages(this)

    this.load.audio('music', music);
    // load font and listeners
    this.load.script('https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont');
    this.load.on('progress', this.onLoadProgress, this);
    this.load.on('complete', this.onLoadComplete, this);
  }

  create() {
    console.log("create called")
    this.add.sprite(0, 0, 'stars').setOrigin(0, 0);
    this.add.sprite(0, 0, 'clouds').setOrigin(0, 0);
    this.add.sprite(0, 0, 'mountains').setOrigin(0, 0);
    this.add.sprite(0, 0, 'trees').setOrigin(0, 0);
    this.add.sprite(0, 910, 'ground').setOrigin(0, 0);

    this.titleText = this.add.text(500, 300, '',
      {
        fontFamily: 'Luckiest Guy',
        fontSize: 112,
        color: '#ff0000',
        align: "center"
      }).setShadow(2, 2, "#000000", 2, false, true);
    this.titleText.visible = false;

    this.enterNameText = this.add.text(785, 430, 'Enter name:',
      {
        fontFamily: 'Luckiest Guy',
        fontSize: 72,
        color: '#000000',
        align: "left"
      }).setShadow(2, 2, "#ff0000", 2, false, true);
    this.enterNameText.visible = false;

    this.nameEntry = this.add.text(785, 550, '',
      {
        fontFamily: 'Luckiest Guy',
        fontSize: 72,
        color: '#000000',
        align: "left"
      }).setShadow(2, 2, "#ff0000", 2, false, true);
    this.nameEntry.visible = false;

    if (!localStorage.getItem("playerName")) {
      this.input.keyboard.on('keydown', (event) => {
        console.log("key pressed!", event.keyCode)
        if (event.keyCode === Phaser.Input.Keyboard.KeyCodes.ENTER) {
          if (this.nameEntry.text.length > 0 && this.nameEntry.text.length < 10) {
            this.input.keyboard.off("keydown");
            this.nameEntry.visible = false;
            this.enterNameText.visible = false;
            localStorage.setItem("playerName", this.nameEntry.text)
          }
        } else if (event.keyCode === Phaser.Input.Keyboard.KeyCodes.BACKSPACE) {
          this.nameEntry.text = this.nameEntry.text.substr(0, this.nameEntry.text.length - 1)
        } else if (
          (this.nameEntry.text.length <= 10) &&
          ((event.keyCode >= Phaser.Input.Keyboard.KeyCodes.A &&
            event.keyCode <= Phaser.Input.Keyboard.KeyCodes.Z) ||
          (event.keyCode >= Phaser.Input.Keyboard.KeyCodes.ZERO &&
            event.keyCode <= Phaser.Input.Keyboard.KeyCodes.NINE))
        ) {

          this.nameEntry.text = this.nameEntry.text + event.key;
        }
      })
    }

    this.createUI()
  }

  createUI() {
    createMusicControls(this)
    createSfxControls(this)
  }
  update() {
    if (!localStorage.getItem("playerName")) {
      this.nameEntry.visible = true;
      this.enterNameText.visible = true;
    } else if (this.loaded && !this.titleText.visible) {
      this.titleText.visible = true;
      this.titleText.text = 'Catapult';

      getTopScore(this.database, (score, name) => {
        console.log('score is: ', score)
        this.add.text(485, 430, 'Top Score: ' + Math.round(score) + " - " + name,
          {
            fontFamily: 'Luckiest Guy',
            fontSize: 72,
            color: '#000000',
            align: "left"
          }).setShadow(2, 2, "#ff0000", 2, false, true);
      })

      this.startText = this.add.text(700, 550, 'Start Game',
        {
          fontFamily: 'Luckiest Guy',
          fontSize: 92,
          color: '#ff0000',
          align: "center"
        }).setShadow(2, 2, "#000000", 2, false, true)
        .setInteractive({useHandCursor: true}).on('pointerdown', () => this.onStartClicked());
    }
  }

  onLoadProgress(progress) {
    console.log(`${Math.round(progress * 100)}%`);
  }

  onLoadComplete(loader, totalComplete, totalFailed) {
    WebFont.load({
      active: () => this.loaded = true,
      google: {
        families: ['Luckiest Guy']
      }
    });
  }

  onStartClicked() {
    this.scene.switch('gameScene');
  }

}

export default TitleScene;
