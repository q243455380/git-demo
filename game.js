const state = {
  lives: 3,
  distance: 0,
  speed: 0.18,
  sprintMultiplier: 1.8,
  jumpVelocity: 0,
  isJumping: false,
  isPaused: false,
  isGameOver: false,
};

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x0d0f1a, 10, 60);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  200
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio || 1);
document.body.appendChild(renderer.domElement);

const loader = document.getElementById("loader");
loader?.classList.add("hidden");

const ambient = new THREE.AmbientLight(0xaab8ff, 0.6);
scene.add(ambient);

const directional = new THREE.DirectionalLight(0xffffff, 0.8);
directional.position.set(6, 10, 4);
scene.add(directional);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(120, 120, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0x1b223d })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

const grid = new THREE.GridHelper(120, 24, 0x2a355f, 0x1d2644);
scene.add(grid);

const mouseGroup = new THREE.Group();
const mouseBody = new THREE.Mesh(
  new THREE.SphereGeometry(0.5, 24, 24),
  new THREE.MeshStandardMaterial({ color: 0xf5d7b2 })
);
const mouseNose = new THREE.Mesh(
  new THREE.ConeGeometry(0.18, 0.4, 16),
  new THREE.MeshStandardMaterial({ color: 0xff9bb0 })
);
mouseNose.position.set(0, 0, 0.6);
mouseNose.rotation.x = Math.PI / 2;
const mouseTail = new THREE.Mesh(
  new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8),
  new THREE.MeshStandardMaterial({ color: 0xf0c4a0 })
);
mouseTail.position.set(0, 0.1, -0.8);
mouseTail.rotation.x = Math.PI / 2;
mouseGroup.add(mouseBody, mouseNose, mouseTail);
mouseGroup.position.set(0, 0.6, 6);
scene.add(mouseGroup);

const cityBlocks = [];
for (let i = 0; i < 12; i += 1) {
  const block = new THREE.Mesh(
    new THREE.BoxGeometry(3, 3 + Math.random() * 4, 3),
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(`hsl(${220 + Math.random() * 40}, 40%, ${30 + i}%)`),
    })
  );
  block.position.set(
    (i % 2 === 0 ? -1 : 1) * (6 + Math.random() * 2),
    block.geometry.parameters.height / 2 - 0.1,
    -i * 6
  );
  cityBlocks.push(block);
  scene.add(block);
}

const obstacleData = [
  { label: "猫", color: 0xff7b89, size: 0.8 },
  { label: "狗", color: 0xffc857, size: 0.9 },
  { label: "汽车", color: 0x5cf1ff, size: 1.1 },
  { label: "人", color: 0x9b7bff, size: 0.95 },
];

const obstacles = [];

const createLabelSprite = (text) => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = 256;
  canvas.height = 128;
  ctx.fillStyle = "rgba(8,12,28,0.8)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = "bold 42px sans-serif";
  ctx.fillStyle = "#e6ecff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(1.6, 0.8, 1);
  return sprite;
};

const spawnObstacle = () => {
  const type = obstacleData[Math.floor(Math.random() * obstacleData.length)];
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(type.size, type.size, type.size),
    new THREE.MeshStandardMaterial({ color: type.color })
  );
  mesh.userData = { type };
  mesh.position.set(
    (Math.random() - 0.5) * 8,
    type.size / 2,
    -30 - Math.random() * 30
  );
  const label = createLabelSprite(type.label);
  label.position.set(0, type.size + 0.6, 0);
  mesh.add(label);
  obstacles.push(mesh);
  scene.add(mesh);
};

for (let i = 0; i < 8; i += 1) {
  spawnObstacle();
}

const keys = new Set();
window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "p") {
    state.isPaused = !state.isPaused;
    return;
  }
  keys.add(event.key.toLowerCase());
});
window.addEventListener("keyup", (event) => {
  keys.delete(event.key.toLowerCase());
});

const livesEl = document.getElementById("lives");
const distanceEl = document.getElementById("distance");
const overlay = document.getElementById("overlay");
const message = document.getElementById("message");
const restartBtn = document.getElementById("restart");
const playAgainBtn = document.getElementById("play-again");

const resetGame = () => {
  state.lives = 3;
  state.distance = 0;
  state.speed = 0.18;
  state.jumpVelocity = 0;
  state.isJumping = false;
  state.isPaused = false;
  state.isGameOver = false;
  mouseGroup.position.set(0, 0.6, 6);
  obstacles.forEach((mesh) => scene.remove(mesh));
  obstacles.length = 0;
  for (let i = 0; i < 8; i += 1) {
    spawnObstacle();
  }
  overlay?.classList.add("hidden");
  updateHud();
};

restartBtn?.addEventListener("click", resetGame);
playAgainBtn?.addEventListener("click", resetGame);

const updateHud = () => {
  if (livesEl) livesEl.textContent = String(state.lives);
  if (distanceEl) distanceEl.textContent = Math.floor(state.distance).toString();
};

const onResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
};
window.addEventListener("resize", onResize);

const applyControls = () => {
  const moveSpeed = (keys.has("shift") ? state.sprintMultiplier : 1) * 0.18;
  if (keys.has("a") || keys.has("arrowleft")) {
    mouseGroup.position.x -= moveSpeed;
  }
  if (keys.has("d") || keys.has("arrowright")) {
    mouseGroup.position.x += moveSpeed;
  }
  if (keys.has("w") || keys.has("arrowup")) {
    mouseGroup.position.z -= moveSpeed;
  }
  if (keys.has("s") || keys.has("arrowdown")) {
    mouseGroup.position.z += moveSpeed;
  }

  mouseGroup.position.x = THREE.MathUtils.clamp(mouseGroup.position.x, -5, 5);
  mouseGroup.position.z = THREE.MathUtils.clamp(mouseGroup.position.z, 2, 10);

  if (!state.isJumping && keys.has(" ")) {
    state.jumpVelocity = 0.28;
    state.isJumping = true;
  }
};

const updateJump = () => {
  if (!state.isJumping) return;
  mouseGroup.position.y += state.jumpVelocity;
  state.jumpVelocity -= 0.012;
  if (mouseGroup.position.y <= 0.6) {
    mouseGroup.position.y = 0.6;
    state.isJumping = false;
  }
};

const checkCollisions = () => {
  const mouseBox = new THREE.Box3().setFromObject(mouseGroup);
  for (const obstacle of obstacles) {
    const obstacleBox = new THREE.Box3().setFromObject(obstacle);
    if (mouseBox.intersectsBox(obstacleBox)) {
      state.lives -= 1;
      obstacle.position.z = -40 - Math.random() * 30;
      obstacle.position.x = (Math.random() - 0.5) * 8;
      if (state.lives <= 0) {
        state.isGameOver = true;
        overlay?.classList.remove("hidden");
        message.textContent = "游戏结束";
      }
      updateHud();
      break;
    }
  }
};

const updateObstacles = () => {
  for (const obstacle of obstacles) {
    obstacle.position.z += state.speed;
    if (obstacle.position.z > 12) {
      obstacle.position.z = -40 - Math.random() * 30;
      obstacle.position.x = (Math.random() - 0.5) * 8;
      state.distance += 8;
      state.speed = Math.min(0.35, state.speed + 0.002);
      updateHud();
    }
  }
};

const updateCamera = () => {
  camera.position.set(
    mouseGroup.position.x * 0.4,
    6.5,
    mouseGroup.position.z + 10
  );
  camera.lookAt(mouseGroup.position.x, 0.6, mouseGroup.position.z - 4);
};

const animate = () => {
  requestAnimationFrame(animate);
  if (state.isPaused || state.isGameOver) {
    renderer.render(scene, camera);
    return;
  }
  applyControls();
  updateJump();
  updateObstacles();
  checkCollisions();
  updateCamera();
  renderer.render(scene, camera);
};

updateHud();
updateCamera();
animate();
