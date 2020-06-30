export default {
  width: 1920,
  height: 1080,
  top_score: 'top_score',
  volume: {
    music: 1,
    sfx: 5
  },
  scene: {
    speed: 2,
    width: 500,
    restart: 3000,
    start: 900
  },
  obstacles: {
    crates: {
      count: 5.0,
      bounce: 0.4,
      min: 0.9,
      max: 1.1
    },
    rocks: {
      count: 4.0,
      bounce: 0.4,
      min: 0.8,
      max: 1.2
    },
    mushrooms: {
      count: 6.0,
      bounce: 0.9,
      min: 0.8,
      max: 1.2
    },
    stumps: {
      count: 4.0,
      bounce: 0,
      min: 0.9,
      max: 1.2
    },
    trees: {
      count: 4.0,
      bounce: 0,
      min: 0.6,
      max: 1.1
    },
    bushes: {
      count: 5.0,
      bounce: 0.6,
      min: 0.8,
      max: 1.2
    },
    star: {
      speed: 300,
      startingXPositionOffset: 4000, // changing this will change the time until the first star encounter
      xPositionOffset: 4000, // changing this will change the frequency of the star
      activeLengthInMilliseconds: 5000
    },
    ninja: {
      speed: 250,
      startingXPositionOffset: 5000, // changing this will change the time until the first ninja encounter
      xPositionOffset: 3000, // changing this will change the frequency of the ninja
    },
    sizeModifier: 1 // changing this will change the size of the obstacles
  },
  player: {
    threshold: 2000,
    angle: 60,
    boost: 1800,
    bounce: 0.7,
    gravity: 500,
    speed: 1,
    drag: 0.5,
    start: {
      x: 400,
      y: 860
    }
  },
  firebase :  {
    apiKey: "AIzaSyA0rWoM6b3ZEAJvFCEjZVOo4bh4pJGk0wk",
    authDomain: "catapult-phaser3.firebaseapp.com",
    databaseURL: "https://catapult-phaser3.firebaseio.com",
    projectId: "catapult-phaser3",
    storageBucket: "catapult-phaser3.appspot.com",
    messagingSenderId: "582432023105",
    appId: "1:582432023105:web:a3051143153f34083f1cc0"
  }
};
