const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: "arcade",
    arcade: { gravity: { y: 500 } }
  },
  scene: {
    preload,
    create,
    update
  }
};

const game = new Phaser.Game(config);

let player;
let cursors;

function preload() {
  this.load.image("sky","https://labs.phaser.io/assets/skies/space3.png");
  this.load.spritesheet("dude",
    "https://labs.phaser.io/assets/sprites/dude.png",
    { frameWidth:32, frameHeight:48 }
  );
}

function create() {

  this.add.image(400,300,"sky");

  player = this.physics.add.sprite(400,300,"dude");

  cursors = this.input.keyboard.addKeys({
    left:Phaser.Input.Keyboard.KeyCodes.A,
    right:Phaser.Input.Keyboard.KeyCodes.D,
    up:Phaser.Input.Keyboard.KeyCodes.W
  });
}

function update(){

  if(cursors.left.isDown){
    player.setVelocityX(-200);
  }
  else if(cursors.right.isDown){
    player.setVelocityX(200);
  }
  else{
    player.setVelocityX(0);
  }

  if(cursors.up.isDown){
    player.setVelocityY(-200);
  }

}
