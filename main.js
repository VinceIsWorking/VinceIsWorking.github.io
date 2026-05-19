const PLATFORM_TILE_WIDTH = 53;
const PLATFORM_TILE_HEIGHT = 16;
const PLATFORM_TILE_COUNT = 2;
const MINIGAME_TRIGGER_HITS = 5;
const MINIGAME_TRIGGER_WINDOW_MS = 10000;
const MINIGAME_APPLE_DROP_INTERVAL_MS = 2000;
const MINIGAME_MAX_GROUND_APPLES = 8;
const MINIGAME_MAX_CARRIED_APPLES = 2;

let activeInteractable = null;
let isModalOpen = false;
let currentWeatherTheme = 'cloudy';
let duolingoStreak = 'Loading...';
let game = null;
let hasBootstrapped = false;
let mobileControlsBound = false;
let resizeRaf = null;
let mobileJumpRequested = false;
let mobileInteractRequested = false;

const isMobileDevice = window.matchMedia('(pointer: coarse)').matches;

const portfolioContent = {
  about: {
    title: 'About Me',
    body: `
      <h3>Greetings, I'm Vincent</h3>
      <p class="about-text">
🐞 “Ah, bugs,”
🥲 he said, wiping his eyes.
🧙‍♂️ “A magic beyond all we do here!”
👨‍💻 he who is wholeheartedly developing www.aspectu4d.com using UE5/C++ for 4 years

</p>
      <div class="card-grid">
        <div class="pixel-card"><strong>Haidilao Premium Member</strong> 🍲 海底捞黑海会员</div>
        <div class="pixel-card"><strong>Best Dance Placing</strong> 🕺 Top 16</div>
        <div class="pixel-card"><strong>Duolingo</strong> <span id="duolingo-streak" class="pixel-streak">🔥 ${duolingoStreak}</span></div>
      </div>
    `
  },
  projects: {
    title: 'Projects',
    body: `
      <h3>Highlight Project</h3>
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
      <h3>View Resume</h3>
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
const rotateOverlay = document.getElementById('rotate-overlay');
const mobileControls = document.getElementById('mobile-controls');

function getViewportSize() {
  const vv = window.visualViewport;
  return {
    width: Math.max(1, Math.round(vv ? vv.width : window.innerWidth)),
    height: Math.max(1, Math.round(vv ? vv.height : window.innerHeight))
  };
}

function isMobileLandscape() {
  return window.matchMedia('(pointer: coarse) and (orientation: landscape)').matches;
}

function updateCloseButtonLabel() {
  if (!closeModalButton) return;
  closeModalButton.textContent = isMobileDevice ? 'Close' : 'Close Q';
}

function showRotateOverlay() {
  if (rotateOverlay) {
    rotateOverlay.style.display = 'flex';
  }
}

function hideRotateOverlay() {
  if (rotateOverlay) {
    rotateOverlay.style.display = 'none';
  }
}

function showMobileControls() {
  if (mobileControls && !isModalOpen) {
    mobileControls.style.display = 'flex';
  }
}

function hideMobileControls() {
  if (mobileControls) {
    mobileControls.style.display = 'none';
  }
}

function openModal(key) {
  const item = portfolioContent[key];
  if (!item) return;
  modalTitle.textContent = item.title;
  modalBody.innerHTML = item.body;
  modalOverlay.style.display = 'flex';
  isModalOpen = true;
  hideMobileControls();
  updateCloseButtonLabel();
}

function closeModal() {
  modalOverlay.style.display = 'none';
  isModalOpen = false;
  updateCloseButtonLabel();

  if (isMobileDevice && isMobileLandscape()) {
    showMobileControls();
  }
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

    this.minigameActive = false;
    this.minigameHitTimestamps = [];
    this.lastMiniGameHitAt = 0;
    this.playerAppleCount = 0;
    this.basketAppleCount = 0;
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

    this.createMiniGamePlatform();
    this.createMiniGameObjects();
    this.createMiniGameAppleSpawner();
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

    if (!this.textures.exists('apple')) {
      g.clear();
      g.fillStyle(0xef4444, 1);
      g.fillCircle(8, 9, 7);
      g.fillStyle(0x7c2d12, 1);
      g.fillRect(7, 1, 2, 5);
      g.fillStyle(0x16a34a, 1);
      g.fillTriangle(9, 3, 15, 2, 10, 7);
      g.generateTexture('apple', 16, 18);
    }

    if (!this.textures.exists('basket')) {
      g.clear();
      g.fillStyle(0x92400e, 1);
      g.fillRect(4, 12, 40, 24);
      g.fillStyle(0xf59e0b, 1);
      g.fillRect(7, 15, 34, 18);
      g.lineStyle(4, 0x78350f, 1);
      g.strokeCircle(24, 14, 17);
      g.generateTexture('basket', 48, 40);
    }

    g.destroy();
  }
    buildResponsiveLayout() {
    const mobileLandscapeMode = isMobileLandscape();

    const groundY = this.worldHeight - (mobileLandscapeMode ? 56 : 78);
    const moveSpeed = Phaser.Math.Clamp(this.worldWidth * 0.16, 210, 360);
    const gravityY = Phaser.Math.Clamp(this.worldHeight * 1.9, 1450, 2100);

    let jumpVelocity;
    let safeVerticalStep;
    let firstPlatformRise;
    let safeHorizontalStep;

    if (mobileLandscapeMode) {
      jumpVelocity = -Phaser.Math.Clamp(this.worldHeight * 0.72, 520, 620);

      safeVerticalStep = Phaser.Math.Clamp(this.worldHeight * 0.11, 34, 44);
      firstPlatformRise = Phaser.Math.Clamp(this.worldHeight * 0.13, 38, 50);
      safeHorizontalStep = Phaser.Math.Clamp(this.worldWidth * 0.20, 130, 210);
    } else {
      jumpVelocity = -Phaser.Math.Clamp(this.worldHeight * 0.92, 740, 980);

      const theoreticalJumpHeight = (jumpVelocity * jumpVelocity) / (2 * gravityY);

      safeVerticalStep = Phaser.Math.Clamp(theoreticalJumpHeight * 0.68, 44, 92);
      firstPlatformRise = Phaser.Math.Clamp(theoreticalJumpHeight * 0.62, 70, 130);
      safeHorizontalStep = Phaser.Math.Clamp(this.worldWidth * 0.16, 120, 220);
    }

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
      jumpVelocity,
      mobileLandscapeMode
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

    this.add.rectangle(
      this.worldWidth / 2,
      this.worldHeight * 0.25,
      this.worldWidth,
      this.worldHeight * 0.5,
      style.top
    );

    this.add.rectangle(
      this.worldWidth / 2,
      this.worldHeight * 0.75,
      this.worldWidth,
      this.worldHeight * 0.5,
      style.bottom
    );

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
      const fontSize = this.layout.mobileLandscapeMode ? '12px' : '16px';

      this.add.text(item.x, item.y - 84, item.label, {
        fontFamily: 'Courier New, monospace',
        fontSize,
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
    createMiniGamePlatform() {
    const platformWidth = PLATFORM_TILE_COUNT * PLATFORM_TILE_WIDTH;
    const platformHeight = PLATFORM_TILE_HEIGHT;

    const resumePlatformCenterX = this.layout.points.resume;
    const miniGameY = this.layout.level3Y - this.getMiniGamePlatformOffset();

    this.miniGamePlatformVisual = this.add.rectangle(
      resumePlatformCenterX,
      miniGameY + platformHeight / 2,
      platformWidth,
      platformHeight,
      0xa16207
    );

    this.miniGamePlatformVisual.setVisible(false);

    this.miniGamePlatformZone = this.add.zone(
      resumePlatformCenterX,
      miniGameY + platformHeight / 2,
      platformWidth,
      platformHeight
    );

    this.physics.add.existing(this.miniGamePlatformZone, true);

    this.miniGamePlatformZone.name = 'MiniGame';

    this.miniGamePlatformCollider = this.physics.add.collider(
      this.player,
      this.miniGamePlatformZone,
      () => {
        this.registerMiniGamePlatformHit();
      }
    );
  }

  getMiniGamePlatformOffset() {
    return this.layout.level2Y - this.layout.level3Y;
  }

  registerMiniGamePlatformHit() {
    if (this.minigameActive) return;
    if (!this.player || !this.player.body || !this.miniGamePlatformZone) return;

    const now = this.time.now;

    if (now - this.lastMiniGameHitAt < 250) return;

    const playerBottom = this.player.body.bottom;
    const platformTop = this.miniGamePlatformZone.body.top;
    const isUnderPlatform = playerBottom > platformTop + 6;
    const isHittingFromBelow =  isUnderPlatform && (this.player.body.blocked.up || this.player.body.touching.up);

    if (!isHittingFromBelow) return;

    this.lastMiniGameHitAt = now;

    this.minigameHitTimestamps.push(now);

    this.minigameHitTimestamps = this.minigameHitTimestamps.filter(
      (time) => now - time <= MINIGAME_TRIGGER_WINDOW_MS
    );

    if (this.minigameHitTimestamps.length >= MINIGAME_TRIGGER_HITS) {
      this.startMiniGame();
    }
  }

  createMiniGameObjects() {
    this.appleTrees = [];
    this.applesGroup = this.physics.add.group({
      allowGravity: true,
      collideWorldBounds: true
    });

    this.physics.add.collider(this.applesGroup, this.platforms);
    this.physics.add.collider(this.applesGroup, this.miniGamePlatformZone);
    this.physics.add.collider(
      this.applesGroup,
      this.applesGroup,
      undefined,
      (a, b) => a !== b
    );

    this.physics.add.overlap(this.player, this.applesGroup, (player, apple) => {
      this.collectApple(apple);
    });

    const treeBaseY = this.layout.level3Y - this.getMiniGamePlatformOffset() - 44;
    const treeSpacing = Math.max(72, Math.min(120, this.worldWidth * 0.12));
    const centerX = this.layout.points.resume;

    for (let i = 0; i < 4; i++) {
      const treeX = centerX + (i - 1.5) * treeSpacing;

      const trunk = this.add.rectangle(treeX, treeBaseY, 16, 58, 0x92400e);
      trunk.setOrigin(0.5, 1);
      trunk.setVisible(false);

      const leaves = this.add.circle(treeX, treeBaseY - 52, 34, 0x16a34a);
      leaves.setVisible(false);

      const leaves2 = this.add.circle(treeX - 22, treeBaseY - 43, 24, 0x15803d);
      leaves2.setVisible(false);

      const leaves3 = this.add.circle(treeX + 22, treeBaseY - 43, 24, 0x22c55e);
      leaves3.setVisible(false);

      this.appleTrees.push({
        x: treeX,
        y: treeBaseY - 76,
        visuals: [trunk, leaves, leaves2, leaves3]
      });
    }

    this.basket = this.physics.add.staticSprite(
      centerX,
      this.layout.level3Y - this.getMiniGamePlatformOffset() - 16,
      'basket'
    );

    this.basket.name = 'MiniGameBasket';
    this.basket.setVisible(false);
    this.basket.refreshBody();

    this.physics.add.overlap(this.player, this.basket, () => {
      this.depositApples();
    });

    this.miniGameHud = this.add.text(
      16,
      16,
      '',
      {
        fontFamily: 'Courier New, monospace',
        fontSize: this.layout.mobileLandscapeMode ? '12px' : '16px',
        color: '#ffffff',
        backgroundColor: '#0f172a',
        padding: { left: 8, right: 8, top: 6, bottom: 6 }
      }
    );

    this.miniGameHud.setScrollFactor(0);
    this.miniGameHud.setDepth(1000);
    this.miniGameHud.setVisible(false);

    this.updateMiniGameHud();
  }

  createMiniGameAppleSpawner() {
    this.appleSpawnTimer = this.time.addEvent({
      delay: MINIGAME_APPLE_DROP_INTERVAL_MS,
      loop: true,
      callback: () => {
        if (!this.minigameActive) return;
        this.spawnMiniGameApple();
      }
    });
  }

  spawnMiniGameApple() {
    if (!this.applesGroup || !this.appleTrees || this.appleTrees.length === 0) return;

    if (this.applesGroup.countActive(true) >= MINIGAME_MAX_GROUND_APPLES) {
      return;
    }

    const tree = Phaser.Utils.Array.GetRandom(this.appleTrees);

    const apple = this.applesGroup.create(tree.x, tree.y, 'apple');

    apple.setCircle(7);
    apple.setBounce(0.12);
    apple.setDragX(40);
    apple.setCollideWorldBounds(true);
    apple.body.setGravityY(this.layout.gravityY * 0.55);
    apple.setVelocityX(Phaser.Math.Between(-25, 25));
    apple.setVelocityY(Phaser.Math.Between(-20, 10));
    apple.setData('isApple', true);
  }

  collectApple(apple) {
    if (!this.minigameActive) return;
    if (!apple || !apple.active) return;

    if (this.playerAppleCount >= MINIGAME_MAX_CARRIED_APPLES) {
      return;
    }

    apple.destroy();

    this.playerAppleCount += 1;

    this.updateMiniGameHud();
  }

  depositApples() {
    if (!this.minigameActive) return;
    if (this.playerAppleCount <= 0) return;

    this.basketAppleCount += this.playerAppleCount;
    this.playerAppleCount = 0;
    this.applesGroup.clear(true, true);

    this.updateMiniGameHud();
  }

  updateMiniGameHud() {
    if (!this.miniGameHud) return;

    if (!this.minigameActive) {
      this.miniGameHud.setText('');
      return;
    }

    this.miniGameHud.setText(
      `MiniGame\nCarry: ${this.playerAppleCount}/${MINIGAME_MAX_CARRIED_APPLES}\nBasket: ${this.basketAppleCount}\nGround: ${this.applesGroup ? this.applesGroup.countActive(true) : 0}/${MINIGAME_MAX_GROUND_APPLES}`
    );
  }

  startMiniGame() {
    if (this.minigameActive) return;

    this.minigameActive = true;

    if (this.miniGamePlatformVisual) {
      this.miniGamePlatformVisual.setVisible(true);
    }

    if (this.appleTrees) {
      this.appleTrees.forEach((tree) => {
        tree.visuals.forEach((visual) => visual.setVisible(true));
      });
    }

    if (this.basket) {
      this.basket.setVisible(true);
    }

    if (this.miniGameHud) {
      this.miniGameHud.setVisible(true);
    }

    this.updateMiniGameHud();

    const title = this.add.text(
      this.worldWidth / 2,
      Math.max(72, this.worldHeight * 0.18),
      'MINIGAME START',
      {
        fontFamily: 'Courier New, monospace',
        fontSize: this.layout.mobileLandscapeMode ? '20px' : '32px',
        color: '#0f172a',
        backgroundColor: '#facc15',
        padding: { left: 14, right: 14, top: 8, bottom: 8 }
      }
    );

    title.setOrigin(0.5);
    title.setDepth(1200);

    this.tweens.add({
      targets: title,
      y: title.y - 24,
      alpha: 0,
      duration: 1800,
      ease: 'Sine.easeOut',
      onComplete: () => title.destroy()
    });
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.keys.close) && isModalOpen) {
      closeModal();
    }

    if (isModalOpen) {
      this.player.setVelocityX(0);
      interactionHint.style.display = 'none';
      mobileJumpRequested = false;
      mobileInteractRequested = false;
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

    const jumpPressed =
      Phaser.Input.Keyboard.JustDown(this.keys.up) || mobileJumpRequested;

    if (jumpPressed && this.player.body.blocked.down) {
      this.player.setVelocityY(this.layout.jumpVelocity);
    }

    mobileJumpRequested = false;

    if (this.keys.down.isDown && this.player.body.blocked.down) {
      this.player.setScale(1, 0.85);
    } else {
      this.player.setScale(1, 1);
    }

    if (activeInteractable) {
      interactionHint.style.display = 'block';
      interactionHint.textContent = isMobileDevice
        ? `Tap E to interact: ${activeInteractable.label}`
        : `Press E to interact: ${activeInteractable.label}`;

      const interactPressed =
        Phaser.Input.Keyboard.JustDown(this.keys.interact) || mobileInteractRequested;

      if (interactPressed) {
        openModal(activeInteractable.key);
      }

      mobileInteractRequested = false;
    } else {
      interactionHint.style.display = 'none';
      mobileInteractRequested = false;
    }

    if (this.minigameActive) {
      this.updateMiniGameHud();
    }
  }
}

async function bootstrapGame() {
  try {
    if (loadingBadge) {
      loadingBadge.style.display = 'block';
      loadingBadge.textContent = 'Loading weather...';
    }

    await fetchMelbourneWeatherTheme();
  } finally {
    if (loadingBadge) {
      loadingBadge.textContent = 'Loading world...';
    }
  }

  const viewport = getViewportSize();

  const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: viewport.width,
    height: viewport.height,
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

function restartSceneToViewport() {
  if (!game) return;

  const viewport = getViewportSize();
  game.scale.resize(viewport.width, viewport.height);

  const scene = game.scene.getScene('PortfolioScene');
  if (!scene) return;

  game.scene.stop('PortfolioScene');
  game.scene.start('PortfolioScene');
}

function scheduleRefresh() {
  if (resizeRaf) {
    cancelAnimationFrame(resizeRaf);
  }

  resizeRaf = requestAnimationFrame(() => {
    resizeRaf = null;
    initExperience();
  });
}

function initExperience() {
  updateCloseButtonLabel();

  if (!isMobileDevice) {
    hideRotateOverlay();
    hideMobileControls();

    if (!hasBootstrapped) {
      hasBootstrapped = true;
      bootstrapGame();
    } else {
      restartSceneToViewport();
    }

    return;
  }

  if (isMobileLandscape()) {
    hideRotateOverlay();

    if (!isModalOpen) {
      showMobileControls();
    }

    if (!hasBootstrapped) {
      hasBootstrapped = true;
      bootstrapGame();
    } else {
      restartSceneToViewport();
    }
  } else {
    showRotateOverlay();
    hideMobileControls();

    if (game && interactionHint) {
      interactionHint.style.display = 'none';
    }
  }
}

function setupMobileControls() {
  if (mobileControlsBound) return;
  mobileControlsBound = true;

  const btnLeft = document.getElementById('btn-left');
  const btnRight = document.getElementById('btn-right');
  const btnJump = document.getElementById('btn-jump');
  const btnInteract = document.getElementById('btn-interact');

  if (!btnLeft || !btnRight || !btnJump || !btnInteract) return;

  const withScene = (callback) => {
    if (!game) return;
    const scene = game.scene.getScene('PortfolioScene');
    if (!scene || !scene.keys) return;
    callback(scene);
  };

  const press = (key) => {
    withScene((scene) => {
      scene.keys[key].isDown = true;
    });
  };

  const release = (key) => {
    withScene((scene) => {
      scene.keys[key].isDown = false;
    });
  };

  const bindHoldButton = (button, key) => {
    const start = (e) => {
      e.preventDefault();
      press(key);
    };

    const end = (e) => {
      e.preventDefault();
      release(key);
    };

    button.addEventListener('touchstart', start, { passive: false });
    button.addEventListener('touchend', end, { passive: false });
    button.addEventListener('touchcancel', end, { passive: false });
    button.addEventListener('mousedown', start);
    button.addEventListener('mouseup', end);
    button.addEventListener('mouseleave', end);
  };

  bindHoldButton(btnLeft, 'left');
  bindHoldButton(btnRight, 'right');

  btnJump.addEventListener('touchstart', (e) => {
    e.preventDefault();
    mobileJumpRequested = true;
  }, { passive: false });

  btnJump.addEventListener('mousedown', (e) => {
    e.preventDefault();
    mobileJumpRequested = true;
  });

  btnInteract.addEventListener('touchstart', (e) => {
    e.preventDefault();

    if (isModalOpen) {
      closeModal();
    } else {
      mobileInteractRequested = true;
    }
  }, { passive: false });

  btnInteract.addEventListener('mousedown', (e) => {
    e.preventDefault();

    if (isModalOpen) {
      closeModal();
    } else {
      mobileInteractRequested = true;
    }
  });
}

window.addEventListener('load', () => {
  updateCloseButtonLabel();
  setupMobileControls();
  initExperience();
});

window.addEventListener('resize', scheduleRefresh);

if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', scheduleRefresh);
}
