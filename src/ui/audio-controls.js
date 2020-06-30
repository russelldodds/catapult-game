import constants from '../configs/constants'
import pauseButton from '../assets/images/ui/Button_Pause.png';
import playButton from '../assets/images/ui/Button_Right_Arrow.png';
import volumeUpButton from '../assets/images/ui/Button_Up_Arrow.png';
import volumeDownButton from '../assets/images/ui/Button_Down_Arrow.png';

const MAX_VOLUME = 5
const MIN_VOLUME = 0
const CONTROL_SCALE = 0.25

// music
const MUSIC_STORAGE_KEY = 'MANGO_FANDANGO_MUSIC'
const MUSIC_LABEL_Y = 10
const MUSIC_LABEL_X = 10
const MUSIC_CONTROL_Y = 65

// sfx
const SFX_STORAGE_KEY = 'MANGO_FANDANGO_SFX'
const SFX_LABEL_Y = 110
const SFX_LABEL_X = 10
const SFX_CONTROL_Y = 165

// x values to keep controls tight
const SLOT_1_X = 40
const SLOT_2_X = SLOT_1_X + 50
const SLOT_3_X = SLOT_2_X + 50

function getMusicAll () {
  return JSON.parse(localStorage.getItem(MUSIC_STORAGE_KEY))
}

function getMusicVolumeFromStorage() {
  const musicSettings = getMusicAll()
  return musicSettings ? musicSettings.volume : constants.volume.music
}

function setMusicVolumeToStorage (volume) {
  localStorage.setItem(MUSIC_STORAGE_KEY, JSON.stringify({ ...getMusicAll(), volume }))
}

function getMusicPaused() {
  const musicSettings = getMusicAll()
  return musicSettings ? musicSettings.paused : false
}

function setMusicPaused(paused) {
  localStorage.setItem(MUSIC_STORAGE_KEY, JSON.stringify({...getMusicAll(), paused}))
}

function getSfxAll() {
  return JSON.parse(localStorage.getItem(SFX_STORAGE_KEY))
}

function getSfxPaused() {
  const sfxSettings = getSfxAll()
  return sfxSettings ? sfxSettings.paused : false
}

function setSfxPaused(paused) {
  const sfxSettings = getSfxAll()
  localStorage.setItem(SFX_STORAGE_KEY, JSON.stringify({ ...sfxSettings, paused }))
}

function createControl(self, x, y, texture, onFn) {
  self.add.sprite(x, y, texture)
    .setScale(CONTROL_SCALE, CONTROL_SCALE)
    .setInteractive({useHandCursor: true})
    .on('pointerup', onFn)
}

const preloadControlImages = (self) => {
  self.load.image('pauseBtn', pauseButton);
  self.load.image('playBtn', playButton);
  self.load.image('volumeDownBtn', volumeDownButton)
  self.load.image('volumeUpBtn', volumeUpButton)
}

const createMusicControls = (self) => {
  self.music = self.sound.get('music');
  if (self.music == null) {
    const musicConfig = {
      mute: false,
      volume: getMusicVolumeFromStorage(),
      rate: 1,
      detune: 0,
      seek: 0,
      loop: true,
      delay: 0
    }
    self.music = self.sound.add('music', musicConfig);
  }
  self.musicPaused = getMusicPaused()
  if(self.musicPaused) {
    self.music.pause()
  } else {
    self.music.play()
  }
  self.musicText = self.add.text(MUSIC_LABEL_X, MUSIC_LABEL_Y, 'Music - ' + getMusicVolumeFromStorage(), { fontFamily: 'Luckiest Guy', fontSize: 30, color: '#ff0000', align: "center" })
  // music control: pause / play
  // can't use createControl, because I couldn't figure out how to update self.musicControl texture
  const musicControlInitialTexture = self.musicPaused ?  'playBtn' : 'pauseBtn'
  self.musicControl = self.add.sprite(SLOT_1_X, MUSIC_CONTROL_Y, musicControlInitialTexture)
    .setScale(CONTROL_SCALE, CONTROL_SCALE)
    .setInteractive({useHandCursor: true})
    .on('pointerup', () => {
      if(self.musicPaused) {
        self.music.play()
        self.musicControl.setTexture('pauseBtn')
        setMusicPaused(false)
      } else {
        self.music.pause()
        self.musicControl.setTexture('playBtn')
        setMusicPaused(true)
      }
      self.musicPaused = !self.musicPaused
    })

  // music volume up button
  createControl(self, SLOT_2_X, MUSIC_CONTROL_Y, 'volumeUpBtn', () => {
    if(self.music.volume < MAX_VOLUME) {
      const newVolume = self.music.volume + 1
      self.music.setVolume(newVolume)
      self.musicText.text = 'Music - ' + newVolume
      setMusicVolumeToStorage(newVolume)
    }
  })

  // music volume down button
  createControl(self, SLOT_3_X, MUSIC_CONTROL_Y, 'volumeDownBtn', () => {
    if(self.music.volume > MIN_VOLUME) {
      const newVolume = self.music.volume - 1
      self.music.setVolume(newVolume)
      self.musicText.setText('Music - ' + newVolume)
      setMusicVolumeToStorage(newVolume)
    }
  })
}

const createSfxControls = (self) => {
  var tempVolume = 1
  self.sfxText = self.add.text(SFX_LABEL_X, SFX_LABEL_Y, 'SFX(WIP) - ' + tempVolume, { fontFamily: 'Luckiest Guy', fontSize: 30, color: '#ff0000', align: "center" })

  self.sfxPaused = getSfxPaused()

  // sfx control: pause / play
  const sfxControlInitialTexture = self.sfxPaused ? 'playBtn' : 'pauseBtn'
  self.sfxControl = self.add.sprite(SLOT_1_X, SFX_CONTROL_Y, sfxControlInitialTexture)
    .setScale(CONTROL_SCALE, CONTROL_SCALE)
    .setInteractive({ useHandCursor: true })
    .on('pointerup', () => {
      if (self.sfxPaused) {
        self.sfxControl.setTexture('pauseBtn')
        setSfxPaused(false)
      } else {
        self.sfxControl.setTexture('playBtn')
        setSfxPaused(true)
      }

      self.sfxPaused = !self.sfxPaused
    })

  // volume up button
  createControl(self, SLOT_2_X, SFX_CONTROL_Y, 'volumeUpBtn', () => {
    self.sfxText.text = 'SFX(WIP) - ' + ++tempVolume
  })
  // volume down button
  createControl(self, SLOT_3_X, SFX_CONTROL_Y, 'volumeDownBtn', () => {
    self.sfxText.text = 'SFX(WIP) - ' + --tempVolume
  })
}

export {
  preloadControlImages,
  createMusicControls,
  createSfxControls
}