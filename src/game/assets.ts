export class GameAssets {
  static createTextures(scene: Phaser.Scene) {
    const g = scene.add.graphics();

    this._createHeart(g);
    this._createPlayer(g);
    this._createGround(g);
    this._createBackgrounds(g);
    this._createObstacles(g);

    g.destroy();
  }

  static _createHeart(g: Phaser.GameObjects.Graphics) {
    g.clear();
    g.fillStyle(0xff0000);
    const heartPoints = [
      25,
      0, // Top center
      20,
      -5, // Top right curve
      10,
      -5,
      0,
      15, // Left point
      25,
      40, // Bottom point
      50,
      15, // Right point
      40,
      -5,
      30,
      -5,
      25,
      0, // Back to top
    ];
    const heartPath = new Phaser.Curves.Path(heartPoints[0], heartPoints[1]);
    for (let i = 2; i < heartPoints.length; i += 2) {
      heartPath.lineTo(heartPoints[i], heartPoints[i + 1]);
    }
    g.fillPoints(heartPath.getPoints(), true);
    g.generateTexture("heart", 50, 50);
  }

  static _createPlayer(g: Phaser.GameObjects.Graphics) {
    g.clear();
    g.fillStyle(0xff0000);
    g.lineStyle(2, 0xffffff);
    g.fillRect(0, 0, 40, 40);
    g.strokeRect(0, 0, 40, 40);
    g.generateTexture("player", 40, 40);
  }

  static _createGround(g: Phaser.GameObjects.Graphics) {
    g.clear();
    // Dirt layer
    g.fillStyle(0x8b4513);
    g.fillRect(0, 0, 64, 64);
    // Grass layer
    g.fillStyle(0x228b22);
    g.fillRect(0, 0, 64, 12);
    // Grid pattern
    g.lineStyle(1, 0x006400);
    for (let i = 0; i < 64; i += 16) {
      g.moveTo(i, 0);
      g.lineTo(i, 64);
      g.moveTo(0, i);
      g.lineTo(64, i);
    }
    g.generateTexture("ground", 64, 64);
  }

  static _createBackgrounds(g: Phaser.GameObjects.Graphics) {
    // Day background
    g.clear();
    g.fillStyle(0x87ceeb);
    g.fillRect(0, 0, 800, 600);
    // Add clouds
    g.fillStyle(0xffffff);
    for (let i = 0; i < 10; i++) {
      const x = Phaser.Math.Between(0, 800);
      const y = Phaser.Math.Between(50, 300);
      g.fillCircle(x, y, 20);
      g.fillCircle(x + 15, y - 10, 15);
    }
    g.generateTexture("bg-day", 800, 600);

    // Night background
    g.clear();
    g.fillStyle(0x1a1a3a);
    g.fillRect(0, 0, 800, 600);
    // Add stars
    g.fillStyle(0xffffff);
    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(0, 800);
      const y = Phaser.Math.Between(0, 400);
      g.fillCircle(x, y, 1);
    }
    g.generateTexture("bg-night", 800, 600);
  }

  static _createObstacles(g: Phaser.GameObjects.Graphics) {
    // Create all obstacle types
    this._createSpike(g);
    this._createLongSpike(g);
    this._createDoubleSpike(g);
    this._createFlyingObstacle(g);
    this._createBlade(g);
  }

  static _createSpike(g: Phaser.GameObjects.Graphics) {
    g.clear();
    g.fillStyle(0x808080);
    g.beginPath();
    g.moveTo(20, 0);
    g.lineTo(40, 40);
    g.lineTo(0, 40);
    g.closePath();
    g.fill();
    g.generateTexture("spike", 40, 40);
  }

  static _createLongSpike(g: Phaser.GameObjects.Graphics) {
    g.clear();
    g.fillStyle(0x808080);
    g.beginPath();
    g.moveTo(40, 0);
    g.lineTo(80, 40);
    g.lineTo(0, 40);
    g.closePath();
    g.fill();
    g.generateTexture("long-spike", 80, 40);
  }

  static _createDoubleSpike(g: Phaser.GameObjects.Graphics) {
    g.clear();
    g.fillStyle(0x808080);
    for (let i = 0; i < 2; i++) {
      g.beginPath();
      g.moveTo(20 + i * 40, 0);
      g.lineTo(40 + i * 40, 40);
      g.lineTo(0 + i * 40, 40);
      g.closePath();
      g.fill();
    }
    g.generateTexture("double-spike", 80, 40);
  }

  static _createFlyingObstacle(g: Phaser.GameObjects.Graphics) {
    g.clear();
    g.fillStyle(0x4682b4);
    g.beginPath();
    g.moveTo(0, 10);
    g.lineTo(30, 0);
    g.lineTo(60, 10);
    g.lineTo(30, 20);
    g.closePath();
    g.fill();
    g.generateTexture("flying", 60, 20);
  }

  static _createBlade(g: Phaser.GameObjects.Graphics) {
    g.clear();
    g.lineStyle(2, 0xc0c0c0);
    g.fillStyle(0x808080);
    g.beginPath();
    g.moveTo(20, 0);
    g.lineTo(40, 20);
    g.lineTo(20, 40);
    g.lineTo(0, 20);
    g.closePath();
    g.fill();
    g.stroke();
    g.generateTexture("blade", 40, 40);
  }
}
