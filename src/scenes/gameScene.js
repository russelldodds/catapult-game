import Phaser from 'phaser';
import WebFont from  'webfontloader';
import constants from '../configs/constants';
import { preloadControlImages, createMusicControls } from '../ui/audio-controls'

import stars from '../assets/images/stars.png';
import clouds from '../assets/images/clouds.png';
import mountains from '../assets/images/mountains.png';
import trees from '../assets/images/trees.png';
import ground from '../assets/images/ground.png';

import bush from '../assets/images/Bush.png';
import crate from '../assets/images/Crate.png';
import mushroom1 from '../assets/images/Mushroom_1.png';
import mushroom2 from '../assets/images/Mushroom_2.png';
import stone from '../assets/images/Stone.png';
import stump from '../assets/images/Stump.png';
import tree2 from '../assets/images/Tree_2.png';
import tree3 from '../assets/images/Tree_3.png';
import ninja1 from '../assets/sprites/ninja/Jump_Attack__005.png';
import star from '../assets/images/star.png';
import deathParticle from '../assets/images/RainbowBall.png';

import jump from '../assets/sprites/jump.png';
import jumpJson from '../assets/sprites/jump.json';
import idle from '../assets/sprites/idle.png';
import idleJson from '../assets/sprites/idle.json';
import fall from '../assets/sprites/fall.png';
import fallJson from '../assets/sprites/fall.json';
import dead from '../assets/sprites/dead.png';
import deadJson from '../assets/sprites/dead.json';
import dylanNinjaTest from  '../assets/sprites/ninja/dylanNinjaTest.png';
import dylanNinjaTestJson  from '../assets/sprites/ninja/dylanNinjaTest.json';

import bounce from '../assets/audio/bounce.wav';
import boost from '../assets/audio/boost.wav';
import gameOver from '../assets/audio/game-over.wav';

import { v4 as uuidv4 } from 'uuid';
import { set, merge, orderBy, take } from 'lodash'
import { getTopScore } from "../helpers/firebase";


class GameScene extends Phaser.Scene {

  constructor() {
    super({key: 'gameScene'});
  }

  init (data) {
    this.database = data.database;
    this.configLoaded = false;
    this.gameId = uuidv4();

    this.progress = 0;
    this.boosting = false;
    this.fontLoaded = false;
    this.starActive = false;
    this.boundary = new Phaser.Geom.Rectangle(0, 0, constants.width * constants.scene.width, constants.height);

    this.loadConfigFromFirebase();

    getTopScore(this.database, (score, name) => {
      this.topScore = score;
      this.topScoreName = name;
    })
  }

  loadConfigFromFirebase() {
    // Uncomment the line below to reset the config
    // this.resetGameConfigInFirebaseFromLocalConfig()
    console.debug("fetching config from firebase");
    // Try to load the game constants from firebase
    this.database.ref("currentGame/config")
      .once("value", (snapshot) => {
        merge(constants, snapshot.val());
      }).then(() => this.configLoaded = true, () => {
        console.error("unable to load config from firebase. Continuing with defaults");
        this.configLoaded = true;
      }
    )

  }

  isEverythingLoaded() {
    return this.configLoaded && this.fontLoaded;
  }

  preload() {
    preloadControlImages(this)
    // obstacles
    this.load.image('bush', bush);
    this.load.image('crate', crate);
    this.load.image('mushroom1', mushroom1);
    this.load.image('mushroom2', mushroom2);
    this.load.image('stone', stone);
    this.load.image('stump', stump);
    this.load.image('tree2', tree2);
    this.load.image('tree3', tree3);
    this.load.image('ninja1', ninja1);
    this.load.image('star', star)
    this.load.image('deathParticle', deathParticle)

    // scene
    this.load.image('stars', stars);
    this.load.image('clouds', clouds);
    this.load.image('mountains', mountains);
    this.load.image('trees', trees);
    this.load.image('ground', ground);

    // load player atlases
    this.load.atlas('jump', jump, jumpJson);
    this.load.atlas('idle', idle, idleJson);
    this.load.atlas('fall', fall, fallJson);
    this.load.atlas('dead', dead, deadJson);

    this.load.atlas('dylanNinjaTest', dylanNinjaTest, dylanNinjaTestJson)

    // load sounds
    this.load.audio('bounce', bounce)
    this.load.audio('boost', boost)
    this.load.audio('gameover', gameOver)

    // load font and listeners
    this.load.script('https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont')
    this.load.on('progress', this.onLoadProgress, this);
    this.load.on('complete', this.onLoadComplete, this);
  }

  onLoadProgress(progress) {
    console.log(`${Math.round(progress * 100)}%`);
  }

  onLoadComplete(loader, totalComplete, totalFailed) {
    WebFont.load({
      active: () => this.fontLoaded = true,
      google: {
        families: ['Luckiest Guy']
      }
    });
  }

  create() {
    this.createScene();
    this.createAnimations();
    this.createDamping();
    this.createBoosters();
    this.createKillers();
    this.createNinja();
    this.createPlayer();
    this.createScoreBoard();
    createMusicControls(this);
  }

  createPlayer() {
    this.player = this.physics.add.sprite(constants.player.start.x, constants.player.start.y, 'player');
    this.player.body.gravity.y = constants.player.gravity;
    this.player.setBounce(constants.player.bounce);
    this.player.setScale(0.25);
    this.player.setCircle(150, 80, 100);
    this.player.setDrag(constants.player.drag, constants.player.drag);
    this.player.setMaxVelocity(2000, 2000)
    this.player.setDepth(50);

    this.player.body.setEnable(false);
    this.player.debugShowVelocity=this.physics.getConfig().debug;

    this.input.on('pointerdown', function () {
      if (this.player.x > constants.player.start.x + 200 && this.isEverythingLoaded()) {
        console.log('boosting!')
        this.sound.play('boost');
        this.boosting = true;
      }
    }, this);

    this.cameras.main.setBounds(0, 0, constants.width * constants.scene.width, this.stars.height)
    this.cameras.main.startFollow(this.player);

    var star = this.add.particles('star');

    this.playerStarEmitter = star.createEmitter({
      //frame: [ 'fall', 'jump' ],
      // x: 400,
      // y: 400,
      lifespan: 2000,
      angle: { min: 180, max: 315 },
      speed: { min: 300, max: 500 },
      scale: { start: 0.15, end: 0 },
      gravityY: 300,
      bounce: 0.9,
      //frequency: 75,
      //bounds: { x: 250, y: 0, w: 350, h: 0 },
      collideTop: false,
      collideBottom: false,
      blendMode: 'ADD'
    });
    this.playerStarEmitter.stop()
    this.playerStarEmitter.startFollow(this.player)

    var deathParticle = this.add.particles('deathParticle');

    this.deathEmitter = deathParticle.createEmitter({
      lifespan: 1000,
      angle: { min: 180, max: 315 },
      speed: { min: 300, max: 500 },
      scale: { start: 0.2, end: 0 },
      gravityY: 800,
      bounce: 0.3,
      frequency: 100,
      //bounds: { x: 250, y: 0, w: 350, h: 0 },
      collideTop: false,
      collideBottom: false
      //blendMode: 'ADD'
    });
    this.deathEmitter.stop()
    this.deathEmitter.startFollow(this.player)

    this.createLauncher();
  }

  createLauncher() {
    // launch the player
    this.launcher = this.add.graphics().setDefaultStyles({ lineStyle: { width: 20, color: 0xff0000, alpha: 0.5 } });
    let line = new Phaser.Geom.Line();
    let angle = 0;
    let dist = 0;

    this.input.on('pointermove', function (pointer) {
      angle = Phaser.Math.Angle.BetweenPoints(this.player, pointer);
      dist = Phaser.Math.Distance.BetweenPoints(this.player, pointer);
      Phaser.Geom.Line.SetToAngle(line, this.player.x, this.player.y, angle, dist);
      this.launcher.clear().strokeLineShape(line);
    }, this);

    this.input.on('pointerup', function () {
      if(this.launcher.visible) {
        console.log('launching!')
        this.initializeGameInFirebase();
        this.sound.play('boost');
        this.player.body.setEnable(true);
        // making the distance a bit less impactful and adding a const bump
        // this way the long distance stays around the same
        // but the short distance isn't so short
        this.physics.velocityFromRotation(angle, (dist/1.5 + 700) * constants.player.speed, this.player.body.velocity);
        this.launcher.visible = false;
        for(var i = 0; i < this.ninjaGroup.children.entries.length; ++i) {
          let ninja = this.ninjaGroup.children.entries[i]
          ninja.body.setEnable(true)
          ninja.play('dylanNinjaTest')
        }
        for(var i = 0; i < this.starGroup.children.entries.length; ++i) {
          let star = this.starGroup.children.entries[i]
          star.body.setEnable(true)
        }
      }
    }, this);
  }

  initializeGameInFirebase() {
    this.gameStart = Date.now();
    this.database.ref(`/games/${this.gameId}`).set({"game_start": this.gameStart})
  }

  createAnimations() {
    this.anims.create({ key: 'jump', frames: this.anims.generateFrameNames('jump', { prefix: 'Jump (', start: 1, end: 8, zeroPad: 0, suffix: ').png' }), repeat: 3 });
    this.anims.create({ key: 'idle', frames: this.anims.generateFrameNames('idle', { prefix: 'Idle (', start: 1, end: 10, zeroPad: 0, suffix: ').png' }), repeat: 0 });
    this.anims.create({ key: 'fall', frames: this.anims.generateFrameNames('fall', { prefix: 'Fall (', start: 1, end: 8, zeroPad: 0, suffix: ').png' }), repeat: 3 });
    this.anims.create({ key: 'dead', frames: this.anims.generateFrameNames('dead', { prefix: 'Dead (', start: 1, end: 8, zeroPad: 0, suffix: ').png' }), repeat: 0 });
    this.anims.create({ key: 'dylanNinjaTest', frames: this.anims.generateFrameNames('dylanNinjaTest', { prefix: 'Jump_Attack__00', start: 0, end: 9, zeroPad: 0, suffix: '.png' }), repeat: 1000 });
  }

  createDamping() {
    // create the data set
    let obstacle = null;
    this.dampingGroup = this.physics.add.group();
    let scale = 1;
    let posX = 0;
    for (let i = 0; i < constants.obstacles.crates.count; i++) {
      scale = Phaser.Math.FloatBetween(constants.obstacles.crates.min, constants.obstacles.crates.max);
      posX = Phaser.Math.Between(constants.scene.start, constants.width * 5);
      obstacle = this.dampingGroup.create(posX, constants.height - 168, 'crate')
      .setOrigin(1, 1)
      .setImmovable(true)
      .setBounce(constants.obstacles.crates.bounce)
      .setScale(scale, scale)
      .setDepth(3);
    }
    for (let i = 0; i < constants.obstacles.rocks.count; i++) {
      scale = Phaser.Math.FloatBetween(constants.obstacles.rocks.min, constants.obstacles.rocks.max);
      posX = Phaser.Math.Between(constants.scene.start, constants.width * 5);
      obstacle = this.dampingGroup.create(posX, constants.height - 168, 'stone')
      .setOrigin(1, 1)
      .setImmovable(true)
      .setBounce(constants.obstacles.rocks.bounce)
      .setScale(scale, scale)
      .setDepth(4);
    }
  }

  createBoosters() {
    // create the data set
    let obstacle = null;
    this.boosterGroup = this.physics.add.group();
    let scale = 1;
    let posX = 0;
    for (let i = 0; i < constants.obstacles.mushrooms.count / 2; i++) {
      scale = Phaser.Math.FloatBetween(constants.obstacles.mushrooms.min, constants.obstacles.mushrooms.max);
      posX = Phaser.Math.Between(constants.scene.start, constants.width * 5);
      obstacle = this.boosterGroup.create(posX, constants.height - 168, 'mushroom1')
      .setOrigin(1, 1)
      .setImmovable(true)
      .setBounce(constants.obstacles.mushrooms.bounce)
      .setScale(scale, scale)
      .setDepth(5);
    }
    for (let i = 0; i < constants.obstacles.mushrooms.count / 2; i++) {
      scale = Phaser.Math.FloatBetween(constants.obstacles.mushrooms.min, constants.obstacles.mushrooms.max);
      posX = Phaser.Math.Between(constants.scene.start, constants.width * 5);
      obstacle = this.boosterGroup.create(posX, constants.height - 168, 'mushroom2')
      .setOrigin(1, 1)
      .setImmovable(true)
      .setBounce(constants.obstacles.mushrooms.bounce)
      .setScale(scale, scale)
      .setDepth(6);
    }
    for (let i = 0; i < constants.obstacles.bushes.count; i++) {
      scale = Phaser.Math.FloatBetween(constants.obstacles.bushes.min, constants.obstacles.bushes.max);
      posX = Phaser.Math.Between(constants.scene.start, constants.width * 5);
      obstacle = this.boosterGroup.create(posX, constants.height - 168, 'bush')
      .setOrigin(1, 1)
      .setImmovable(true)
      .setBounce(constants.obstacles.bushes.bounce)
      .setScale(scale, scale)
      .setDepth(7);
    }
  }

  createKillers() {
    // create the data set
    let obstacle = null;
    this.killerGroup = this.physics.add.group();
    let posX = 0;
    let scale = 1;
    for (let i = 0; i < constants.obstacles.trees.count / 2; i++) {
      scale = Phaser.Math.FloatBetween(constants.obstacles.trees.min, constants.obstacles.trees.max);
      posX = Phaser.Math.Between(constants.scene.start + 400, constants.width * 5);
      obstacle = this.killerGroup.create(posX, constants.height - 168, 'tree2')
      .setOrigin(1, 1)
      .setImmovable(true)
      .setBounce(constants.obstacles.trees.bounce)
      .setScale(scale, scale)
      .setDepth(8);
    }
    for (let i = 0; i < constants.obstacles.trees.count / 2; i++) {
      scale = Phaser.Math.FloatBetween(constants.obstacles.trees.min, constants.obstacles.trees.max);
      posX = Phaser.Math.Between(constants.scene.start + 400, constants.width * 5);
      obstacle = this.killerGroup.create(posX, constants.height - 168, 'tree3')
      .setOrigin(1, 1)
      .setImmovable(true)
      .setBounce(constants.obstacles.trees.bounce)
      .setScale(scale, scale)
      .setDepth(9);
    }
    for (let i = 0; i < constants.obstacles.stumps.count; i++) {
      scale = Phaser.Math.FloatBetween(constants.obstacles.stumps.min, constants.obstacles.stumps.max);
      posX = Phaser.Math.Between(constants.scene.start, constants.width * 5);
      obstacle = this.killerGroup.create(posX, constants.height - 168, 'stump')
      .setOrigin(1, 1)
      .setImmovable(true)
      .setBounce(constants.obstacles.stumps.bounce)
      .setScale(scale, scale)
      .setDepth(10);
    }
  }

  createNinja() {
    this.ninjaGroup = this.physics.add.group();
    let ninja =  this.ninjaGroup.create(constants.obstacles.ninja.startingXPositionOffset, this.getRandomAirHeight(), 'ninja1')
    ninja.setScale(-0.25 * constants.obstacles.sizeModifier, 0.25 * constants.obstacles.sizeModifier)
    ninja.setOrigin(1, 1);
    this.createNinjaBody(ninja)
    ninja.body.setEnable(false); // set this to false initially, otherwise ninja will start flying before launch

    this.starGroup = this.physics.add.group();
    let star = this.starGroup.create(constants.obstacles.star.startingXPositionOffset, this.getRandomAirHeight(), 'star')
    //let star = this.starGroup.create(500, 800, 'star')
    star.setScale(0.75 * constants.obstacles.sizeModifier, 0.75 * constants.obstacles.sizeModifier)
    this.createStarBody(star)
    star.body.setEnable(false); // set this to false initially, otherwise star will start flying before launch
  }

  createNinjaBody(ninja) {
    ninja.body.setCircle(200, 400, 50);
    ninja.body.setVelocity(-constants.obstacles.ninja.speed, 0)
    ninja.body.gravity.y = constants.player.gravity;
  }

  createStarBody(star) {
    star.body.setVelocity(-constants.obstacles.star.speed, 0)
  }

  getRandomAirHeight() {
    return Phaser.Math.Between(100, constants.height - 300);
  }

  createScene() {
    this.stars = this.add.tileSprite(constants.width / 2, constants.height / 2, constants.width, constants.height, "stars")
    .setScrollFactor(0, 0);

    this.clouds = this.add.tileSprite(constants.width / 2, constants.height / 2, constants.width, constants.height, "clouds")
    .setScrollFactor(0, 0);

    this.mountains = this.add.tileSprite(constants.width / 2, constants.height / 2, constants.width, constants.height, "mountains")
    .setScrollFactor(0, 0);

    this.trees = this.add.tileSprite(constants.width / 2, constants.height / 2, constants.width, constants.height, "trees")
    .setScrollFactor(0, 0);

    this.add.tileSprite(constants.width / 2, 995, constants.width, 170, "ground")
    .setScrollFactor(0, 0);

    this.groundCollider = this.physics.add.sprite(constants.width / 2, constants.height, "ground")
    .setOrigin(1, 1)
    .setImmovable(true)
    .setBounce(0.7)
    .setVisible(false);
  }

  createScoreBoard() {
    this.score = 0;
    this.hits = 0;
    // this.topScore = localStorage.getItem(constants.top_score) == null ? 0 : Math.round(localStorage.getItem(constants.top_score));

    this.scoreText = this.add.text(constants.width - 600, 10, '',
      { fontFamily: 'Luckiest Guy', fontSize: 52, color: '#ff0000' }).setShadow(2, 2, "#333333", 2, false, true);
    this.scoreText.visible = false;
    this.scoreText.setScrollFactor(0,0);
  }

  updateScore(distance) {
    this.score = Math.round(distance / 10) - this.hits * 5;
    this.scoreText.text = 'Score: ' + this.score + '\nBest: ' + this.topScore + "\nLeader: " + this.topScoreName;
  }

  update() {
    if (this.isEverythingLoaded()) {
      if (!this.scoreText.visible) {
        this.scoreText.visible  = true;
        this.hits = 0;
        this.updateScore(0);
      }

      this.updateScore(this.player.x);

      // parallax the background
      this.stars.tilePositionX += 0.4;
      this.mountains.tilePositionX += constants.scene.speed + 0.2;
      this.clouds.tilePositionX += constants.scene.speed;
      this.trees.tilePositionX += constants.scene.speed - 0.2;

      // animate player
      if (this.launcher.visible) {
        this.player.play('idle');
      } else if (this.player.body.velocity.y >= 0) {
        this.player.play('jump');
      } else if (this.player.body.velocity.y < 0) {
        this.player.play('fall');
      }

      // boosting
      if (this.boosting) {
        this.physics.velocityFromAngle(constants.player.angle, constants.player.boost, this.player.body.velocity);
      }

      // handle the ground bounce
      this.physics.world.collide(this.groundCollider, this.player, function() {
        if (!this.launcher.visible) {
          this.sound.play('bounce');
          this.boosting = false;
          // detect stopped
          if (this.player.body.deltaAbsY() < 1) {
            this.gameOverReset();
          }
        }
      }, null, this);

      // handle damping objects
      this.physics.world.collide(this.player, this.dampingGroup, function() {
        this.hits += 1;
        this.sound.play('bounce');
        this.boosting = false;
      }, null, this);


      // handle boosting objects
      this.physics.world.collide(this.player, this.boosterGroup, function() {
        this.sound.play('bounce');
        this.boosting = false;
      }, null, this);

      // handle ninjas
      this.physics.world.collide(this.player, this.ninjaGroup, function() {
        this.gameOverReset();
      }, function() { return !this.starActive }, this);
      // reset ninja to in front of player if applicable
      for(var i = 0; i < this.ninjaGroup.children.entries.length; ++i) {
        let ninja = this.ninjaGroup.children.entries[i]
        // check if ninja is past player by X amount
        if(this.player.body.position.x - ninja.body.position.x > 1000) {
          // find and set a new ninja position
          ninja.body.reset(this.player.body.position.x + constants.obstacles.ninja.xPositionOffset, this.getRandomAirHeight());
          this.createNinjaBody(ninja)
        }
        if(ninja.body.position.y > 800) {
          // bounce the ninja back up
          ninja.body.setVelocityY(-1000)
        }
      }

      // handle stars
      this.physics.world.collide(this.player, this.starGroup, function() {}, function() {
        if(!this.starActive) {
          // Begin star active
          this.starActive = true
          this.playerStarEmitter.start()
          setTimeout(
            function (theThis) {
              // After X seconds end star active
              theThis.playerStarEmitter.stop()
              theThis.starActive = false
            }, constants.obstacles.star.activeLengthInMilliseconds, this);
        }
        return false
      }, this);

      // reset star to in front of player if applicable
      for(var i = 0; i < this.starGroup.children.entries.length; ++i) {
        let star = this.starGroup.children.entries[i]
        // check if star is past player by X amount
        if(this.player.body.position.x - star.body.position.x > 1000) {
          // find and set a new star position
          star.body.reset(this.player.body.position.x + constants.obstacles.star.xPositionOffset, this.getRandomAirHeight());
          this.createStarBody(star)
        }
      }

      // handle killing objects
      this.physics.world.collide(this.player, this.killerGroup, function() {
        this.gameOverReset();
      }, function() { return !this.starActive }, this);

      // adjust object positions
      this.moveObjects();

      // just in case it goes out of bounds
      if (this.player.x < 0 || this.player.x > constants.width * constants.scene.width || this.player.y > constants.height) {
        this.gameOverReset();
      }
    }
  }

  moveObjects() {
    // move any crates and rocks that are out of scene
    let scale = 1;
    let posX = 0;
    for (let i = 0; i < this.dampingGroup.children.entries.length; i++) {
      let obj = this.dampingGroup.children.entries[i]
      if (obj.body.position.x < this.player.body.position.x - constants.width / 2 - 50) {
        posX = Phaser.Math.Between(this.player.body.position.x + constants.width * 5, this.player.body.position.x + constants.width * 7);
        obj.body.reset(posX, constants.height - 168);
        scale = Phaser.Math.Between(0.9, 1.1);
        obj.setScale(scale, scale);
      }
    }

    // move any mushrooms and bushed that are out of scene
    for (let i = 0; i < this.boosterGroup.children.entries.length; i++) {
      let scale = 1;
      let obj = this.boosterGroup.children.entries[i]
      if (obj.body.position.x < this.player.body.position.x - constants.width / 2 - 50) {
        posX = Phaser.Math.Between(this.player.body.position.x + constants.width * 5, this.player.body.position.x + constants.width * 7);
        obj.body.reset(posX, constants.height - 168);
        scale = Phaser.Math.Between(0.8, 1.2);
        obj.setScale(scale, scale);
      }
    }

    // move any tress and stump that are out of scene
    for (let i = 0; i < this.killerGroup.children.entries.length; i++) {
      let scale = 1;
      let obj = this.killerGroup.children.entries[i]
      if (obj.body.position.x < this.player.body.position.x - constants.width / 2 - 100) {
        posX = Phaser.Math.Between(this.player.body.position.x + constants.width * 5, this.player.body.position.x + constants.width * 7);
        obj.body.reset(posX, constants.height - 168);
        scale = Phaser.Math.Between(0.6, 1.1);
        obj.setScale(scale, scale);
      }
    }

    // move the ground with the player
    this.groundCollider.x = this.player.x + constants.width / 2;

  }

  createEndGame() {
    let startText = this.add.text(640, 240, 'Game Over',
      { fontFamily: 'Luckiest Guy', fontSize: 112, color: '#ff0000', align: "center" }).setShadow(2, 2, "#333333", 2, false, true);

    let scoreText = this.add.text(750, 340, 'Score: ' + this.score,
      { fontFamily: 'Luckiest Guy', fontSize: 72, color: '#000000', align: "left" }).setShadow(2, 2, "#ff0000", 2, false, true);

    let startButton = this.add.text(660, 500, 'Start Game',
      { fontFamily: 'Luckiest Guy', fontSize: 92, color: '#ff0000', align: "center" }).setShadow(2, 2, "#000000", 2, false, true)
    .setInteractive().on('pointerup', () => this.gameReset('gameScene'));

    let quitButton = this.add.text(800, 600, 'Quit',
      { fontFamily: 'Luckiest Guy', fontSize: 92, color: '#ff0000', align: "center" }).setShadow(2, 2, "#000000", 2, false, true)
    .setInteractive().on('pointerup', () => this.gameReset('titleScene'));

    this.gameOverContainer = this.add.container(this.cameras.main.worldView.centerX - (this.cameras.main.worldView.width / 2), 0, [startText, scoreText, startButton, quitButton])
    .setDepth(100);

    this.deathEmitter.start()
  }

  updateConfig(key, val) {
    set(constants, key, val);
    this.updateGameConfigInFirebase(constants.obstacles, constants.player)

    this.gameOverContainer.destroy(true);
    this.createEndGame();
  }

  createTopScoreMod() {
    this.createChangeList();

    let startText = this.add.text(250, 240, 'W00t W00t!!! Great Score',
      { fontFamily: 'Luckiest Guy', fontSize: 112, color: '#ff0000', align: "center" }).setShadow(2, 2, "#333333", 2, false, true);

    let instructionsText = this.add.text(150, 350, 'Pick a mushroom to update the game settings',
      { fontFamily: 'Luckiest Guy', fontSize: 72, color: '#000000', align: "left" }).setShadow(2, 2, "#ff0000", 2, false, true);

    //
    let button1 = this.add.sprite(200, 650, 'mushroom1')
    .setScale(2, 2)
    .setInteractive({useHandCursor: true})
    .setDepth(200)
    .on('pointerup', () => {
      let key = "player.bounce";
      let val = Phaser.Math.FloatBetween(this.editList[key].min, this.editList[key].max);
      this.updateConfig(key, val);
    });
    let button2 = this.add.sprite(290, 750, 'mushroom2')
    .setScale(2, 2)
    .setInteractive({useHandCursor: true})
    .setDepth(200)
    .on('pointerup', () => {
      let key = "obstacles.mushrooms.count";
      let val = Phaser.Math.FloatBetween(this.editList[key].min, this.editList[key].max);
      this.updateConfig(key, val);
    });
    let button3 = this.add.sprite(410, 600, 'mushroom2')
    .setScale(2, 2)
    .setInteractive({useHandCursor: true})
    .setDepth(200)
    .on('pointerup', () => {
      let key = "obstacles.crates.count";
      let val = Phaser.Math.FloatBetween(this.editList[key].min, this.editList[key].max);
      this.updateConfig(key, val);
    });
    let button4 = this.add.sprite(540, 810, 'mushroom1')
    .setScale(2, 2)
    .setInteractive({useHandCursor: true})
    .setDepth(200)
    .on('pointerup', () => {
      let key = "player.bounce";
      let val = Phaser.Math.FloatBetween(this.editList[key].min, this.editList[key].max);
      this.updateConfig(key, val);
    });
    let button5 = this.add.sprite(670, 560, 'mushroom2')
    .setScale(2, 2)
    .setInteractive({useHandCursor: true})
    .setDepth(200)
    .on('pointerup', () => {
      let key = "obstacles.bushes.count";
      let val = Phaser.Math.FloatBetween(this.editList[key].min, this.editList[key].max);
      this.updateConfig(key, val);
    });
    let button6 = this.add.sprite(830, 740, 'mushroom2')
    .setScale(2, 2)
    .setInteractive({useHandCursor: true})
    .setDepth(200)
    .on('pointerup', () => {
      let key = "obstacles.rocks.count";
      let val = Phaser.Math.FloatBetween(this.editList[key].min, this.editList[key].max);
      this.updateConfig(key, val);
    });
    let button7 = this.add.sprite(980, 590, 'mushroom1')
    .setScale(2, 2)
    .setInteractive({useHandCursor: true})
    .setDepth(200)
    .on('pointerup', () => {
      let key = "player.drag";
      let val = Phaser.Math.FloatBetween(this.editList[key].min, this.editList[key].max);
      this.updateConfig(key, val);
    });
    let button8 = this.add.sprite(1080, 690, 'mushroom2')
    .setScale(2, 2)
    .setInteractive({useHandCursor: true})
    .setDepth(200)
    .on('pointerup', () => {
      let key = "obstacles.stumps.count";
      let val = Phaser.Math.FloatBetween(this.editList[key].min, this.editList[key].max);
      this.updateConfig(key, val);
    });
    let button9 = this.add.sprite(1140, 820, 'mushroom1')
    .setScale(2, 2)
    .setInteractive({useHandCursor: true})
    .setDepth(200)
    .on('pointerup', () => {
      let key = "player.gravity";
      let val = Phaser.Math.FloatBetween(this.editList[key].min, this.editList[key].max);
      this.updateConfig(key, val);
    });
    let button10 = this.add.sprite(1280, 690, 'mushroom2')
    .setScale(2, 2)
    .setInteractive({useHandCursor: true})
    .setDepth(200)
    .on('pointerup', () => {
      let key = "obstacles.trees.count";
      let val = Phaser.Math.FloatBetween(this.editList[key].min, this.editList[key].max);
      this.updateConfig(key, val);
    });
    let button11 = this.add.sprite(1360, 540, 'mushroom1')
    .setScale(2, 2)
    .setInteractive({useHandCursor: true})
    .setDepth(200)
    .on('pointerup', () => {
      let key = "obstacles.sizeModifier";
      let val = Phaser.Math.FloatBetween(this.editList[key].min, this.editList[key].max);
      this.updateConfig(key, val);
    });
    let button12 = this.add.sprite(1450, 790, 'mushroom1')
    .setScale(2, 2)
    .setInteractive({useHandCursor: true})
    .setDepth(200)
    .on('pointerup', () => {
      let key = "obstacles.ninja.speed";
      let val = Phaser.Math.FloatBetween(this.editList[key].min, this.editList[key].max);
      this.updateConfig(key, val);
    });
    let button13 = this.add.sprite(1650, 670, 'mushroom2')
    .setScale(2, 2)
    .setInteractive({useHandCursor: true})
    .setDepth(200)
    .on('pointerup', () => {
      let key = "player.speed";
      let val = Phaser.Math.FloatBetween(this.editList[key].min, this.editList[key].max);
      this.updateConfig(key, val);
    });

    this.gameOverContainer = this.add.container(this.cameras.main.worldView.centerX - (this.cameras.main.worldView.width / 2), 0, [startText, instructionsText,
      button1, button2, button3, button4, button5, button6, button7, button8, button9, button10, button11, button12, button13])
    .setDepth(200);
  }

  gameReset(scene) {
    this.fontLoaded = true;
    this.configLoaded = false;
    this.loadConfigFromFirebase();
    this.launcher.visible = true;
    this.input.enabled = true;
    this.gameOverContainer.destroy();
    // always reload the game scene to reset the physics
    this.scene.start('gameScene');
    this.scene.switch(scene);
    this.deathEmitter.stop();
  }

  gameOverReset() {
    if (this.score > constants.player.threshold) {
      this.createTopScoreMod();
    } else {
      this.createEndGame();
    }
    this.boosting = false;
    this.sound.play('gameover');
    this.player.play('dead');
    this.fontLoaded = false;
    this.physics.pause();

    const valuesToUpdate = {
      "game_start": this.gameStart,
      "game_end": Date.now(),
      score: this.score,
      hits: this.hits,
      distance: this.player.x,
      name: localStorage.getItem("playerName").substr(0, 10)
    }
    console.debug('[' + this.gameId + '] values to update are ', valuesToUpdate);
    this.database.ref(`/games/${this.gameId}`).update(valuesToUpdate);
    // localStorage.setItem(constants.top_score, Math.max(this.score, this.topScore));
  }

  resetGameConfigInFirebaseFromLocalConfig() {
    this.updateGameConfigInFirebase(constants.obstacles, constants.player)
  }

  updateGameConfigInFirebase(obstacles, player) {
    this.database.ref(`/currentGame/config`).update({ obstacles, player });
  }

  createChangeList() {
    this.editList = {};
    this.editList["obstacles.crates.count"] = {min: 4, max: 10};
    this.editList["obstacles.rocks.count"] = {min: 4, max: 10};
    this.editList["obstacles.mushrooms.count"] = {min: 4, max: 10};
    this.editList["obstacles.stumps.count"] = {min: 4, max: 10};
    this.editList["obstacles.trees.count"] = {min: 4, max: 10};
    this.editList["obstacles.bushes.count"] = {min: 4, max: 10};
    this.editList["obstacles.ninja.speed"] = {min: 200, max: 500};
    this.editList["obstacles.sizeModifier"] = {min: 0.5, max: 1.5};
    this.editList["player.boost"] = {min: 1000, max: 3000};
    this.editList["player.bounce"] = {min: 0.2, max: 1};
    this.editList["player.gravity"] = {min: 400, max: 800};
    this.editList["player.speed"] = {min: 0.5, max: 3};
    this.editList["player.drag"] = {min: 0.2, max: 0.8};
  }
}

export default GameScene;
