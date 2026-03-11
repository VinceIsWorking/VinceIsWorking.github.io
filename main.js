const PLATFORM_TILE_WIDTH = 53;
const PLATFORM_TILE_HEIGHT = 16;
const PLATFORM_TILE_COUNT = 2;

let activeInteractable = null;
let isModalOpen = false;
let currentWeatherTheme = 'cloudy';
let duolingoStreak = 'Loading...';
let game = null;

const portfolioContent = {
  about: {
    title: 'About Me',
    body: `
      <h3>Hello, I'm Vincent</h3>
      <p class="about-text">
🐞 “Ah, bugs,”
🥲 he said, wiping his eyes.
🧙‍♂️ “A magic beyond all we do here!”
👨‍💻 he who is wholeheartedly developing www.aspectu4d.com using UE5/C++ for 4 years
</p>
      <div class="card-grid">
        <div class="pixel-card"><strong>Base</strong> Melbourne, Australia</div>
        <div class="pixel-card"><strong>Best Dance Placing</strong> Top 16</div>
        <div class="pixel-card"><strong>Duolingo</strong> <span id="duolingo-streak" class="pixel-streak">🔥 ${duolingoStreak}</span></div>
      </div>
    `
  },
  projects: {
    title: 'Projects',
    body: `
      <h3>Selected Project</h3>
      <div class="card-grid">
        <div class="pixel-card" style="border-color: rgba(250, 204, 21, 0.45); background: linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03)); box-shadow: 0 0 0 2px rgba(250, 204, 21, 0.08) inset;">
          <strong style="font-size: 24px; line-height: 1.2; margin-bottom: 12px;"><a href="https://www.aspectu4d.com/" target="_blank" rel="noopener noreferrer" style="color:#facc15; text-decoration:none; border-bottom:2px solid rgba(250,204,21,0.45); padding-bottom:2px;">Aspectu 4D</a></strong>
          <p style="margin:0 0 14px 0; color:#e2e8f0; line-height:1.8;">
            A 4D visualisation platform that combines project schedules with 3D models, helping teams turn static construction data into clear, interactive simulations for planning, coordination, progress communication, and better decision-making.
          </p>
          <p style="margin:0;">
            <a href="https://www.aspectu4d.com/" target="_blank" rel="noopener noreferrer" style="display:inline-block; color:#0f172a; background:#facc15; text-decoration:none; padding:8px 12px; border:2px solid #fff; box-shadow:0 2px 0 rgba(15,23,42,0.7); font-weight:700; text-transform:uppercase; font-size:14px;">Visit Website</a>
          </p>
        </div>
      </div>
    `
  },
  contact: {
    title: 'Contact',
    body: `
      <h3>Let's Connect</h3>
      <ul>
        <li>Email: <a href="mailto:vincentlee264@gmail.com">vincentlee264@gmail.com</a></li>
        <li>LinkedIn: <a href="https://www.linkedin.com/in/august264/" target="_blank" rel="noopener noreferrer">linkedin.com/in/august264</a></li>
      </ul>
    `
  },
  resume: {
    title: 'Resume',
    body: `
      <h3>Download Resume</h3>
      <p>Add your PDF to the repository, for example:</p>
      <ul>
        <li><code>/assets/Vincent_Li_Resume.pdf</code></li>
      </ul>
      <p>Then update this link:</p>
      <p><a href="./assets/Vincent_Li_Resume.pdf" target="_blank" rel="noopener noreferrer">Open Resume PDF</a></p>
    `
  }
};

const modalOverlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const closeModalButton = document.getElementById('close-modal');
const interactionHint = document.getElementById('interaction-hint');
const weatherBadge = document.getElementById('weather-badge');
const loadingBadge = document.getElementById('loading-badge');

function openModal(key) {
  const item = portfolioContent[key];
  if (!item) return;
  modalTitle.textContent = item.title;
  modalBody.innerHTML = item.body;
  modalOverlay.style.display = 'flex';
  isModalOpen = true;
}

function closeModal() {
  modalOverlay.style.display = 'none';
  isModalOpen = false;
}

function normalizeWeatherTheme(text) {
  const value = String(text || '').toLowerCase();
  if (
    value.includes('snow') ||
    value.includes('sleet') ||
    value.includes('blizzard') ||
    value.includes('ice')
  ) return 'snow';
  if (
    value.includes('rain') ||
    value.includes('shower') ||
    value.includes('drizzle') ||
    value.includes('storm')
  ) return 'rain';
  if (
    value.includes('sun') ||
    value.includes('clear') ||
    value.includes('fair')
  ) return 'sunny';
  return 'cloudy';
}

async function fetchMelbourneWeatherTheme() {
  const fallback = () => {
    currentWeatherTheme = normalizeWeatherTheme('partly sunny');
    if (weatherBadge) {
      weatherBadge.textContent = `Weather: ${currentWeatherTheme}`;
    }
    return currentWeatherTheme;
  };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=-37.8136&longitude=144.9631&current=weather_code,is_day&timezone=Australia%2FMelbourne',
      { signal: controller.signal }
    );

    clearTimeout(timer);

    if (!response.ok) return fallback();

    const data = await response.json();
    const code = data?.current?.weather_code;
    const codeMap = {
      0: 'sunny',
      1: 'sunny',
      2: 'cloudy',
      3: 'cloudy',
      45: 'cloudy',
      48: 'cloudy',
      51: 'rain',
      53: 'rain',
      55: 'rain',
      56: 'rain',
      57: 'rain',
      61: 'rain',
      63: 'rain',
      65: 'rain',
      66: 'rain',
      67: 'rain',
      71: 'snow',
      73: 'snow',
      75: 'snow',
      77: 'snow',
      80: 'rain',
      81: 'rain',
      82: 'rain',
      85: 'snow',
      86: 'snow',
      95: 'rain',
      96: 'snow',
      99: 'snow'
    };

    currentWeatherTheme = codeMap[code] || 'cloudy';

    if (weatherBadge) {
      weatherBadge.textContent = `Weather: ${currentWeatherTheme}`;
    }

    return currentWeatherTheme;
  } catch (error) {
    return fallback();
  }
}

function updateAboutDuolingoStreak(newText) {
  duolingoStreak = newText;

  portfolioContent.about.body = portfolioContent.about.body.replace(
    /<span id="duolingo-streak" class="pixel-streak">.*?<\/span>/,
    `<span id="duolingo-streak" class="pixel-streak">${duolingoStreak}</span>`
  );

  const streakNode = document.getElementById('duolingo-streak');
  if (streakNode) {
    streakNode.textContent = duolingoStreak;
  }
}

async function fetchDuolingoStreak() {
  try {
    const response = await fetch('./duolingo.json', { cache: 'no-store' });

    if (!response.ok) {
      updateAboutDuolingoStreak('Streak unavailable');
      return;
    }

    const data = await response.json();
    const streak = data?.streak;

    if (typeof streak === 'number') {
      updateAboutDuolingoStreak(`🔥 ${streak} day streak`);
    } else {
      updateAboutDuolingoStreak('Streak unavailable');
    }
  } catch (error) {
    updateAboutDuolingoStreak('Streak unavailable');
  }
}

closeModalButton.addEventListener('click', closeModal);

modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});

window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'q' && isModalOpen) closeModal();
});

class PortfolioScene extends Phaser.Scene {
  constructor() {
    super('PortfolioScene');
  }

  preload() {
    this.createTextures();
  }

  create() {
    activeInteractable = null;
    this.worldWidth = this.scale.width;
    this.worldHeight = this.scale.height;

    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.cameras.main.roundPixels = true;

    this.layout = this.buildResponsiveLayout();

    this.drawBackground();
    this.createPlatforms();
    this.createDecorations();
    this.createInteractables();
    this.createPlayer();
    this.createControls();
    this.createOverlapZones();
    this.createSigns();
  }

  createTextures() {
    const g = this.add.graphics();

    if (!this.textures.exists('ground')) {
      g.clear();
      g.fillStyle(0x22c55e, 1);
      g.fillRect(0, 0, 64, 24);
      g.fillStyle(0x166534, 1);
      for (let x = 0; x < 64; x += 8) {
        g.fillRect(x, 16, 8, 8);
      }
      g.generateTexture('ground', 64, 24);
    }

    if (!this.textures.exists('platform')) {
      g.clear();
      g.fillStyle(0xf59e0b, 1);
      g.fillRect(0, 0, PLATFORM_TILE_WIDTH, PLATFORM_TILE_HEIGHT);
      g.fillStyle(0x92400e, 1);
      g.fillRect(0, 12, PLATFORM_TILE_WIDTH, 4);
      g.generateTexture('platform', PLATFORM_TILE_WIDTH, PLATFORM_TILE_HEIGHT);
    }

    const playerVariants = [
      { key: 'player_red', body: 0xdc2626, head: 0xfde68a, leg: 0x1f2937 },
      { key: 'player_blue', body: 0x2563eb, head: 0xfbbf24, leg: 0x1e293b },
      { key: 'player_green', body: 0x16a34a, head: 0xfcd34d, leg: 0x334155 },
      { key: 'player_purple', body: 0x7c3aed, head: 0xfde68a, leg: 0x111827 }
    ];

    playerVariants.forEach((variant) => {
      if (this.textures.exists(variant.key)) return;
      g.clear();
      g.fillStyle(variant.body, 1);
      g.fillRect(10, 8, 20, 24);
      g.fillStyle(variant.head, 1);
      g.fillRect(14, 0, 12, 12);
      g.fillStyle(variant.leg, 1);
      g.fillRect(8, 30, 10, 6);
      g.fillRect(22, 30, 10, 6);
      g.generateTexture(variant.key, 40, 36);
    });

    if (!this.textures.exists('profile')) {
      g.clear();
      g.fillStyle(0x0f172a, 1);
      g.fillCircle(32, 18, 12);
      g.fillStyle(0x60a5fa, 1);
      g.fillRoundedRect(14, 32, 36, 20, 6);
      g.generateTexture('profile', 64, 64);
    }

    if (!this.textures.exists('computer')) {
      g.clear();
      g.fillStyle(0x475569, 1);
      g.fillRect(10, 8, 44, 34);
      g.fillStyle(0x0f172a, 1);
      g.fillRect(14, 12, 36, 22);
      g.fillStyle(0x64748b, 1);
      g.fillRect(0, 42, 64, 14);
      g.generateTexture('computer', 64, 56);
    }

    if (!this.textures.exists('mail')) {
      g.clear();
      g.fillStyle(0x94a3b8, 1);
      g.fillRect(8, 16, 48, 32);
      g.fillStyle(0xf8fafc, 1);
      g.fillRect(10, 18, 44, 28);
      g.fillStyle(0x1d4ed8, 1);
      g.fillTriangle(10, 18, 32, 34, 54, 18);
      g.fillStyle(0x93c5fd, 1);
      g.fillTriangle(10, 46, 24, 32, 32, 38);
      g.fillTriangle(54, 46, 40, 32, 32, 38);
      g.generateTexture('mail', 64, 64);
    }

    if (!this.textures.exists('resume_icon')) {
      g.clear();
      g.fillStyle(0x94a3b8, 1);
      g.fillRect(14, 6, 36, 50);
      g.fillStyle(0xf8fafc, 1);
      g.fillRect(16, 8, 32, 46);
      g.fillStyle(0xe2e8f0, 1);
      g.fillRect(42, 8, 6, 10);
      g.fillStyle(0x2563eb, 1);
      g.fillRect(22, 18, 20, 3);
      g.fillRect(22, 26, 20, 3);
      g.fillRect(22, 34, 16, 3);
      g.fillRect(22, 42, 18, 3);
      g.generateTexture('resume_icon', 64, 64);
    }

    if (!this.textures.exists('cloud')) {
      g.clear();
      g.fillStyle(0xffffff, 0.95);
      g.fillRect(0, 0, 64, 32);
      g.fillStyle(0xdbeafe, 1);
      g.fillRect(6, 6, 52, 20);
      g.generateTexture('cloud', 64, 32);
    }

    if (!this.textures.exists('raindrop')) {
      g.clear();
      g.fillStyle(0x60a5fa, 1);
      g.fillRect(2, 0, 2, 8);
      g.generateTexture('raindrop', 4, 8);
    }

    if (!this.textures.exists('snowflake')) {
      g.clear();
      g.fillStyle(0xffffff, 1);
      g.fillRect(2, 0, 2, 6);
      g.fillRect(0, 2, 6, 2);
      g.generateTexture('snowflake', 6, 6);
    }

    g.destroy();
  }

  buildResponsiveLayout() {
    const groundY = this.worldHeight - 78;
    const moveSpeed = Phaser.Math.Clamp(this.worldWidth * 0.16, 210, 360);
    const gravityY = Phaser.Math.Clamp(this.worldHeight * 1.9, 1450, 2100);
    const jumpVelocity = -Phaser.Math.Clamp(this.worldHeight * 0.92, 740, 980);
    const theoreticalJumpHeight = (jumpVelocity * jumpVelocity) / (2 * gravityY);
    const safeVerticalStep = Phaser.Math.Clamp(theoreticalJumpHeight * 0.68, 44, 92);
    const safeHorizontalStep = Phaser.Math.Clamp(this.worldWidth * 0.16, 120, 220);
    const firstPlatformRise = Phaser.Math.Clamp(theoreticalJumpHeight * 0.62, 70, 130);

    const level1Y = groundY - firstPlatformRise;
    const level2Y = level1Y - safeVerticalStep;
    const level3Y = level2Y - safeVerticalStep;
    const level4Y = level3Y - safeVerticalStep;

    const centerX = this.worldWidth / 2;
    const points = {
      about: centerX - safeHorizontalStep / 2,
      projects: centerX + safeHorizontalStep / 2,
      resume: centerX - safeHorizontalStep / 2,
      contact: centerX + safeHorizontalStep / 2
    };

    return {
      groundY,
      level1Y,
      level2Y,
      level3Y,
      level4Y,
      points,
      moveSpeed,
      gravityY,
      jumpVelocity
    };
  }

  drawBackground() {
    const themeStyles = {
      sunny: { top: 0x7dd3fc, bottom: 0xc4f09b, hill: 0x4ade80, cloudAlpha: 0.65 },
      cloudy: { top: 0x94a3b8, bottom: 0xcbd5e1, hill: 0x65a30d, cloudAlpha: 0.95 },
      rain: { top: 0x475569, bottom: 0x94a3b8, hill: 0x3f6212, cloudAlpha: 1 },
      snow: { top: 0xbfe3ff, bottom: 0xe0f2fe, hill: 0xe2e8f0, cloudAlpha: 0.95 }
    };

    const style = themeStyles[currentWeatherTheme] || themeStyles.cloudy;
    this.cameras.main.setBackgroundColor(style.top);

    this.add.rectangle(this.worldWidth / 2, this.worldHeight * 0.25, this.worldWidth, this.worldHeight * 0.5, style.top);
    this.add.rectangle(this.worldWidth / 2, this.worldHeight * 0.75, this.worldWidth, this.worldHeight * 0.5, style.bottom);

    if (currentWeatherTheme === 'sunny') {
      this.add.circle(this.worldWidth * 0.12, this.worldHeight * 0.14, 42, 0xfacc15);
    }

    const cloudCount = currentWeatherTheme === 'sunny' ? 4 : 7;
    for (let i = 0; i < cloudCount; i++) {
      this.add.image(
        80 + i * (this.worldWidth / cloudCount),
        70 + (i % 3) * 28,
        'cloud'
      ).setAlpha(style.cloudAlpha);
    }

    const hillCount = Math.max(4, Math.floor(this.worldWidth / 160));
    for (let i = 0; i < hillCount; i++) {
      const hill = this.add.ellipse(
        i * (this.worldWidth / hillCount) + 80,
        this.worldHeight - 60,
        220,
        120,
        style.hill
      );
      hill.setOrigin(0.5, 1);
    }

    if (currentWeatherTheme === 'rain') {
      for (let i = 0; i < 90; i++) {
        this.add.image(
          Phaser.Math.Between(0, this.worldWidth),
          Phaser.Math.Between(0, this.worldHeight - 120),
          'raindrop'
        ).setAlpha(0.75);
      }
    }

    if (currentWeatherTheme === 'snow') {
      for (let i = 0; i < 60; i++) {
        this.add.image(
          Phaser.Math.Between(0, this.worldWidth),
          Phaser.Math.Between(0, this.worldHeight - 120),
          'snowflake'
        ).setAlpha(0.85);
      }
    }
  }

  createPlatforms() {
    this.platforms = this.physics.add.staticGroup();

    for (let x = 0; x < this.worldWidth; x += 64) {
      const ground = this.platforms.create(x, this.layout.groundY, 'ground').setOrigin(0, 0);
      ground.refreshBody();
    }

    const centeredPlatform = (centerX, y) => {
      const totalWidth = PLATFORM_TILE_COUNT * PLATFORM_TILE_WIDTH;
      const startX = centerX - totalWidth / 2;
      for (let i = 0; i < PLATFORM_TILE_COUNT; i++) {
        const platform = this.platforms.create(
          startX + i * PLATFORM_TILE_WIDTH,
          y,
          'platform'
        ).setOrigin(0, 0);
        platform.refreshBody();
      }
    };

    centeredPlatform(this.layout.points.about, this.layout.level1Y);
    centeredPlatform(this.layout.points.projects, this.layout.level2Y);
    centeredPlatform(this.layout.points.resume, this.layout.level3Y);
    centeredPlatform(this.layout.points.contact, this.layout.level4Y);
  }

  createDecorations() {
    const deco = [
      { x: this.worldWidth * 0.10, y: this.layout.groundY - 8, color: 0x16a34a },
      { x: this.worldWidth * 0.18, y: this.layout.groundY - 8, color: 0x15803d },
      { x: this.worldWidth * 0.82, y: this.layout.groundY - 8, color: 0x16a34a },
      { x: this.worldWidth * 0.90, y: this.layout.groundY - 8, color: 0x166534 }
    ];

    deco.forEach(({ x, y, color }) => {
      this.add.rectangle(x, y, 28, 70, 0x92400e).setOrigin(0.5, 1);
      this.add.circle(x, y - 56, 34, color).setOrigin(0.5, 1);
    });
  }

  createInteractables() {
    this.interactables = [
      { x: this.layout.points.about, y: this.layout.level1Y, key: 'about', sprite: 'profile', label: 'ABOUT ME' },
      { x: this.layout.points.projects, y: this.layout.level2Y, key: 'projects', sprite: 'computer', label: 'PROJECTS' },
      { x: this.layout.points.resume, y: this.layout.level3Y, key: 'resume', sprite: 'resume_icon', label: 'RESUME' },
      { x: this.layout.points.contact, y: this.layout.level4Y, key: 'contact', sprite: 'mail', label: 'CONTACT' }
    ];

    this.interactables.forEach((item) => {
      item.gameObject = this.add.image(item.x, item.y, item.sprite).setOrigin(0.5, 1);
      item.zone = this.add.zone(item.x, item.y - 24, 110, 110);
      this.physics.world.enable(item.zone);
      item.zone.body.setAllowGravity(false);
      item.zone.body.moves = false;
    });
  }

  createSigns() {
    this.interactables.forEach((item) => {
      this.add.text(item.x, item.y - 84, item.label, {
        fontFamily: 'Courier New, monospace',
        fontSize: '16px',
        color: '#0f172a',
        backgroundColor: '#ffffff',
        padding: { left: 6, right: 6, top: 4, bottom: 4 }
      }).setOrigin(0.5, 1);
    });
  }

  createPlayer() {
    const variants = ['player_red', 'player_blue', 'player_green', 'player_purple'];
    const randomVariant = Phaser.Utils.Array.GetRandom(variants);
    this.player = this.physics.add.sprite(
      Math.max(70, this.worldWidth * 0.08),
      this.layout.groundY - 130,
      randomVariant
    );
    this.player.setCollideWorldBounds(true);
    this.player.setBounce(0);
    this.player.setSize(18, 34).setOffset(11, 2);
    this.player.body.setGravityY(this.layout.gravityY);
    this.physics.add.collider(this.player, this.platforms);
  }

  createControls() {
    this.keys = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      interact: Phaser.Input.Keyboard.KeyCodes.E,
      close: Phaser.Input.Keyboard.KeyCodes.Q
    });
  }

  createOverlapZones() {
    this.interactables.forEach((item) => {
      this.physics.add.overlap(this.player, item.zone, () => {
        activeInteractable = item;
      });
    });
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.keys.close) && isModalOpen) {
      closeModal();
    }

    if (isModalOpen) {
      this.player.setVelocityX(0);
      interactionHint.style.display = 'none';
      return;
    }

    let touching = null;
    for (const item of this.interactables) {
      const dist = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        item.x,
        item.y - 20
      );
      if (dist < 95) {
        touching = item;
        break;
      }
    }

    activeInteractable = touching;

    const speed = this.layout.moveSpeed;

    if (this.keys.left.isDown) {
      this.player.setVelocityX(-speed);
      this.player.setFlipX(true);
    } else if (this.keys.right.isDown) {
      this.player.setVelocityX(speed);
      this.player.setFlipX(false);
    } else {
      this.player.setVelocityX(0);
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.up) && this.player.body.blocked.down) {
      this.player.setVelocityY(this.layout.jumpVelocity);
    }

    if (this.keys.down.isDown && this.player.body.blocked.down) {
      this.player.setScale(1, 0.85);
    } else {
      this.player.setScale(1, 1);
    }

    if (activeInteractable) {
      interactionHint.style.display = 'block';
      interactionHint.textContent = `Press E to interact: ${activeInteractable.label}`;
      if (Phaser.Input.Keyboard.JustDown(this.keys.interact)) {
        openModal(activeInteractable.key);
      }
    } else {
      interactionHint.style.display = 'none';
    }
  }
}

async function bootstrapGame() {
  try {
    if (loadingBadge) {
      loadingBadge.textContent = 'Loading weather...';
    }

    await fetchMelbourneWeatherTheme();
  } finally {
    if (loadingBadge) {
      loadingBadge.textContent = 'Loading world...';
    }
  }

  const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#7dd3fc',
    pixelArt: true,
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0 },
        debug: false
      }
    },
    scene: [PortfolioScene]
  };

  game = new Phaser.Game(config);

  if (loadingBadge) {
    loadingBadge.style.display = 'none';
  }

  fetchDuolingoStreak();
}

window.addEventListener('resize', () => {
  if (!game) return;
  game.scale.resize(window.innerWidth, window.innerHeight);
  game.scene.stop('PortfolioScene');
  game.scene.start('PortfolioScene');
});

bootstrapGame();
