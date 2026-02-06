const canvas = document.getElementById("game");
const context = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const restartButton = document.getElementById("restart");
const message = document.getElementById("message");
const messageTitle = document.getElementById("message-title");
const messageBody = document.getElementById("message-body");

const keys = new Set();
const stars = [];
const comets = [];
const starCount = 6;
const cometCount = 3;

let score = 0;
let lives = 3;
let running = true;
let lastTime = 0;

const player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 14,
  speed: 220,
};

function resetEntities() {
  stars.length = 0;
  comets.length = 0;

  for (let i = 0; i < starCount; i += 1) {
    stars.push(makeStar());
  }

  for (let i = 0; i < cometCount; i += 1) {
    comets.push(makeComet());
  }
}

function makeStar() {
  return {
    x: 40 + Math.random() * (canvas.width - 80),
    y: 40 + Math.random() * (canvas.height - 80),
    radius: 10,
  };
}

function makeComet() {
  const angle = Math.random() * Math.PI * 2;
  const speed = 80 + Math.random() * 60 + score * 2;

  return {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: 12,
    velocityX: Math.cos(angle) * speed,
    velocityY: Math.sin(angle) * speed,
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function update(delta) {
  const moveX =
    (keys.has("ArrowRight") || keys.has("d") ? 1 : 0) -
    (keys.has("ArrowLeft") || keys.has("a") ? 1 : 0);
  const moveY =
    (keys.has("ArrowDown") || keys.has("s") ? 1 : 0) -
    (keys.has("ArrowUp") || keys.has("w") ? 1 : 0);

  if (moveX !== 0 || moveY !== 0) {
    const length = Math.hypot(moveX, moveY) || 1;
    player.x += (moveX / length) * player.speed * delta;
    player.y += (moveY / length) * player.speed * delta;
  }

  player.x = clamp(player.x, player.radius, canvas.width - player.radius);
  player.y = clamp(player.y, player.radius, canvas.height - player.radius);

  for (const comet of comets) {
    comet.x += comet.velocityX * delta;
    comet.y += comet.velocityY * delta;

    if (comet.x < comet.radius || comet.x > canvas.width - comet.radius) {
      comet.velocityX *= -1;
    }

    if (comet.y < comet.radius || comet.y > canvas.height - comet.radius) {
      comet.velocityY *= -1;
    }

    if (distance(player, comet) < player.radius + comet.radius) {
      lives -= 1;
      livesEl.textContent = lives;
      player.x = canvas.width / 2;
      player.y = canvas.height / 2;
      comet.velocityX *= -1;
      comet.velocityY *= -1;

      if (lives <= 0) {
        endGame("Game Over", "The comets were too fast this time.");
      }
    }
  }

  for (let i = stars.length - 1; i >= 0; i -= 1) {
    const star = stars[i];
    if (distance(player, star) < player.radius + star.radius) {
      stars.splice(i, 1);
      score += 1;
      scoreEl.textContent = score;

      if (score % 5 === 0) {
        comets.push(makeComet());
      }

      stars.push(makeStar());
    }
  }
}

function draw() {
  context.clearRect(0, 0, canvas.width, canvas.height);

  const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#101a42");
  gradient.addColorStop(1, "#0a1029");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  for (const star of stars) {
    context.beginPath();
    context.fillStyle = "#ffe27a";
    context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    context.fill();
  }

  for (const comet of comets) {
    context.beginPath();
    context.fillStyle = "#ff7a7a";
    context.arc(comet.x, comet.y, comet.radius, 0, Math.PI * 2);
    context.fill();
  }

  context.beginPath();
  context.fillStyle = "#6ce5ff";
  context.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  context.fill();
}

function tick(timestamp) {
  if (!running) {
    return;
  }

  const delta = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;
  update(delta);
  draw();
  requestAnimationFrame(tick);
}

function endGame(title, body) {
  running = false;
  messageTitle.textContent = title;
  messageBody.textContent = body;
  message.hidden = false;
}

function restartGame() {
  score = 0;
  lives = 3;
  running = true;
  scoreEl.textContent = score;
  livesEl.textContent = lives;
  message.hidden = true;
  player.x = canvas.width / 2;
  player.y = canvas.height / 2;
  resetEntities();
  lastTime = performance.now();
  requestAnimationFrame(tick);
}

window.addEventListener("keydown", (event) => {
  keys.add(event.key);
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key);
});

restartButton.addEventListener("click", restartGame);

resetEntities();
requestAnimationFrame((timestamp) => {
  lastTime = timestamp;
  tick(timestamp);
});
