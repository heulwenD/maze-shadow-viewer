const MAZES = [
  {
    id: "maze01",
    name: "Maze 01",
    base: "assets/maze01-base.png",
    solved: "assets/maze01-solved.png",
  },
  {
    id: "maze02",
    name: "Maze 02",
    base: "assets/maze02-base.png",
    solved: "assets/maze02-solved.png",
  },
   {
    id: "maze03",
    name: "Maze 03",
    base: "assets/maze03-base.png",
    solved: "assets/maze03-solved.png",
  },
   {
    id: "maze04",
    name: "Maze 04",
    base: "assets/maze04-base.png",
    solved: "assets/maze04-solved.png",
  },
   {
    id: "maze05",
    name: "Maze 05",
    base: "assets/maze05-base.png",
    solved: "assets/maze05-solved.png",
  },
   {
    id: "maze06",
    name: "Maze 06",
    base: "assets/maze06-base.png",
    solved: "assets/maze06-solved.png",
  },
   {
    id: "maze07",
    name: "Maze 07",
    base: "assets/maze07-base.png",
    solved: "assets/maze07-solved.png",
  },
   {
    id: "maze08",
    name: "Maze 08",
    base: "assets/maze08-base.png",
    solved: "assets/maze08-solved.png",
  },
   {
    id: "maze09",
    name: "Maze 09",
    base: "assets/maze09-base.png",
    solved: "assets/maze09-solved.png",
  },
   {
    id: "maze10",
    name: "Maze 10",
    base: "assets/maze10-base.png",
    solved: "assets/maze10-solved.png",
  },
];

const mazeSelect = document.getElementById("mazeSelect");
const shadowToggle = document.getElementById("shadowToggle");
const solutionBtn = document.getElementById("solutionBtn");
const canvas = document.getElementById("mazeCanvas");
const ctx = canvas.getContext("2d");

const imageCache = new Map();

let currentMazeIndex = 0;
let showSolution = false;

init();

async function init() {
  createMazeOptions();
  await preloadImages();
  bindEvents();
  updateSolutionButton();
  render();
}

function createMazeOptions() {
  MAZES.forEach((maze, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = maze.name;
    mazeSelect.appendChild(option);
  });
}

function bindEvents() {
  mazeSelect.addEventListener("change", () => {
    currentMazeIndex = Number(mazeSelect.value);
    showSolution = false;
    updateSolutionButton();
    render();
  });

  shadowToggle.addEventListener("change", render);

  solutionBtn.addEventListener("click", () => {
    showSolution = !showSolution;
    updateSolutionButton();
    render();
  });
}

function updateSolutionButton() {
  solutionBtn.textContent = showSolution ? "Hide Solution" : "Show Solution";
}

async function preloadImages() {
  const tasks = [];
  for (const maze of MAZES) {
    tasks.push(loadImage(maze.base));
    tasks.push(loadImage(maze.solved));
  }
  await Promise.all(tasks);
}

function loadImage(src) {
  if (imageCache.has(src)) {
    return Promise.resolve(imageCache.get(src));
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = () => reject(new Error("Không load được ảnh: " + src));
    img.src = src;
  });
}

function getCurrentMaze() {
  return MAZES[currentMazeIndex];
}

function render() {
  const maze = getCurrentMaze();
  const baseImg = imageCache.get(maze.base);
  const solvedImg = imageCache.get(maze.solved);

  if (!baseImg || !solvedImg) return;

  const depth = shadowToggle.checked ? 14 : 0;
  const padding = depth + 4;

  canvas.width = baseImg.naturalWidth + padding;
  canvas.height = baseImg.naturalHeight + padding;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const baseData = extractMasksFromImage(baseImg);
  const solvedData = extractMasksFromImage(solvedImg);

  if (shadowToggle.checked) {
    renderShadowMaze(baseData, depth);
  } else {
    renderFlatMaze(baseData);
  }

  if (showSolution) {
    drawSolutionMask(solvedData.solutionMask);
  }
}

/* =========================
   ĐỌC ẢNH -> TÁCH MASK
   ========================= */
function extractMasksFromImage(img) {
  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");

  tempCanvas.width = img.naturalWidth;
  tempCanvas.height = img.naturalHeight;
  tempCtx.drawImage(img, 0, 0);

  const width = tempCanvas.width;
  const height = tempCanvas.height;
  const imageData = tempCtx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const wallMask = Array.from({ length: height }, () => Array(width).fill(0));
  const solutionMask = Array.from({ length: height }, () => Array(width).fill(0));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (a === 0) continue;

      const brightness = (r + g + b) / 3;
      const isWall = brightness < 120;
      const isRed = r > 160 && g < 150 && b < 150;

      if (isWall) wallMask[y][x] = 1;
      if (isRed) solutionMask[y][x] = 1;
    }
  }

  return {
    width,
    height,
    wallMask,
    solutionMask,
  };
}

/* =========================
   NỞ TƯỜNG CHO DÀY HƠN
   ========================= */
function dilateMask(mask, radius = 1) {
  const height = mask.length;
  const width = mask[0].length;
  const out = Array.from({ length: height }, () => Array(width).fill(0));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!mask[y][x]) continue;

      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const ny = y + dy;
          const nx = x + dx;

          if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
            out[ny][nx] = 1;
          }
        }
      }
    }
  }

  return out;
}

/* =========================
   CHẾ ĐỘ KHÔNG SHADOW
   ========================= */
function renderFlatMaze(baseData) {
  const { width, height, wallMask } = baseData;

  ctx.fillStyle = "#e8e8e8";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#e3e3e3";
  ctx.fillRect(0, 0, width, height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!wallMask[y][x]) continue;
      ctx.fillStyle = "#707070";
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

/* =========================
   CHẾ ĐỘ SHADOW DÀY ĐẶC
   ========================= */
function renderShadowMaze(baseData, depth) {
  const { width, height, wallMask } = baseData;

  // nở tường ra để nhìn đặc hơn
  const thickWallMask = dilateMask(wallMask, 1);

  ctx.fillStyle = "#e6e6e6";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#e1e1e1";
  ctx.fillRect(0, 0, width, height);

  drawWallFaces(thickWallMask, width, height, depth);
  drawWallTop(thickWallMask, width, height);
  drawWallOutline(thickWallMask, width, height);
}

function drawWallFaces(wallMask, width, height, depth) {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!wallMask[y][x]) continue;

      const rightEmpty = x + 1 < width && wallMask[y][x + 1] === 0;
      const bottomEmpty = y + 1 < height && wallMask[y + 1][x] === 0;

      if (rightEmpty && x > 0 && x < width - 1 && y > 0 && y < height - 1) {
        drawRightFace(x, y, depth);
      }

      if (bottomEmpty && x > 0 && x < width - 1 && y > 0 && y < height - 1) {
        drawBottomFace(x, y, depth);
      }

      if (rightEmpty && bottomEmpty && x > 0 && x < width - 1 && y > 0 && y < height - 1) {
        drawCornerFace(x, y, depth);
      }
    }
  }
}

function drawRightFace(x, y, depth) {
  ctx.beginPath();
  ctx.moveTo(x + 1, y - 0.5);
  ctx.lineTo(x + 1, y + 1.5);
  ctx.lineTo(x + 1 + depth, y + 1.5 + depth);
  ctx.lineTo(x + 1 + depth, y - 0.5 + depth);
  ctx.closePath();
  ctx.fillStyle = "#b8b8b8";
  ctx.fill();

  ctx.strokeStyle = "#9e9e9e";
  ctx.lineWidth = 0.6;
  ctx.stroke();
}

function drawBottomFace(x, y, depth) {
  ctx.beginPath();
  ctx.moveTo(x - 0.5, y + 1);
  ctx.lineTo(x + 1.5, y + 1);
  ctx.lineTo(x + 1.5 + depth, y + 1 + depth);
  ctx.lineTo(x - 0.5 + depth, y + 1 + depth);
  ctx.closePath();
  ctx.fillStyle = "#b2b2b2";
  ctx.fill();

  ctx.strokeStyle = "#979797";
  ctx.lineWidth = 0.6;
  ctx.stroke();
}

function drawCornerFace(x, y, depth) {
  ctx.beginPath();
  ctx.moveTo(x + 1, y + 1);
  ctx.lineTo(x + 1 + depth, y + 1 + depth);
  ctx.lineTo(x + depth, y + 1 + depth);
  ctx.closePath();
  ctx.fillStyle = "#aaaaaa";
  ctx.fill();
}

function drawWallTop(wallMask, width, height) {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!wallMask[y][x]) continue;
      ctx.fillStyle = "#c3c3c3";
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

function drawWallOutline(wallMask, width, height) {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!wallMask[y][x]) continue;

      const leftEmpty = x - 1 >= 0 ? wallMask[y][x - 1] === 0 : true;
      const rightEmpty = x + 1 < width ? wallMask[y][x + 1] === 0 : true;
      const topEmpty = y - 1 >= 0 ? wallMask[y - 1][x] === 0 : true;
      const bottomEmpty = y + 1 < height ? wallMask[y + 1][x] === 0 : true;

      ctx.fillStyle = "#6f6f6f";

      if (leftEmpty) ctx.fillRect(x, y, 1, 1);
      if (rightEmpty) ctx.fillRect(x, y, 1, 1);
      if (topEmpty) ctx.fillRect(x, y, 1, 1);
      if (bottomEmpty) ctx.fillRect(x, y, 1, 1);
    }
  }

  ctx.strokeStyle = "#787878";
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, width - 1, height - 1);
}

/* =========================
   VẼ SOLUTION BẰNG CODE
   ========================= */
function drawSolutionMask(solutionMask) {
  const height = solutionMask.length;
  const width = solutionMask[0].length;

  ctx.fillStyle = "rgba(255, 0, 0, 0.95)";

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!solutionMask[y][x]) continue;
      ctx.fillRect(x - 1, y - 1, 3, 3);
    }
  }
}
