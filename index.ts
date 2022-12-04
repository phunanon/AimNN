const { PI, cos, sin, sqrt } = Math;

declare class RNG {
  constructor(seed: string);
  uniform(): number;
}

let rng = new RNG("...");
const rng2 = new RNG("...");
const rn2 = () => rng2.uniform();
const rn = () => rng.uniform();

type Neuron = {
  bias: number;
  weights: number[];
};
type Layer = Neuron[];
type Brain = Layer[];

type Subject = {
  brain: Brain;
  score: number;
};

const vec = (n: number) => [...Array(n)].map(() => 0);

function brain(inputs: number, layers: number, neuronsPerLayer: number): Brain {
  return [
    vec(inputs).map((n) => ({ bias: 0, weights: vec(neuronsPerLayer) })),
    ...vec(layers).map((l) =>
      vec(neuronsPerLayer).map((n) => ({
        bias: 0,
        weights: vec(neuronsPerLayer),
      }))
    ),
  ];
}

const think = (layers: Brain, inputs: number[]): number[] => {
  return layers.reduce(
    (inputs, layer) =>
      layer.map(({ bias, weights }) =>
        Math.tanh(
          inputs.reduce((sum, input, i) => sum + input * weights[i], 0) + bias
        )
      ),
    inputs
  );
};

const mutant = (brain: Brain) => {
  return brain.map((layer) =>
    layer.map((neuron) => {
      const { bias, weights } = neuron;
      return {
        bias: rn2() > 0.8 ? rn2() * 2 - 1 : bias,
        weights: weights.map((w) => (rn2() > 0.8 ? rn2() * 2 - 1 : w)),
      };
    })
  );
};

function subject(): Subject {
  const numInput = 2;
  const numLayer = 2;
  const neuronsPerLayer = 3;
  return {
    score: 0,
    brain: mutant(brain(numInput, numLayer, neuronsPerLayer)),
  };
}

const width = 500;
const height = 300;
const lineChartSegmentWidth = 4;
const ballSpeed = 11;
const numBrain = 1000;
const numTestPerBrain = 100;
let subjects = vec(numBrain).map(subject);
const bestScores: number[] = [];
let generationNum = 0;
let brainNum = 0;
let testNum = 0;
let hits: boolean[] = [];

function next(hit: boolean, failed: boolean) {
  if (hit) {
    ++subjects[brainNum].score;
  }
  if (hit || failed) {
    ++testNum;
    if (testNum == numTestPerBrain) {
      testNum = 0;
      ++brainNum;
      rng = new RNG("...");
      hits = [];
      if (brainNum == subjects.length) {
        subjects.sort((a, b) => b.score - a.score);
        const parent = subjects[0];
        bestScores.push(parent.score);
        if (bestScores.length > width / lineChartSegmentWidth) {
          bestScores.shift();
        }
        subjects = [
          { score: 0, brain: parent.brain },
          ...vec(numBrain - 1).map((n) => ({
            score: 0,
            brain: mutant(parent.brain),
          })),
        ];
        brainNum = 0;
        ++generationNum;
      }
    }
    reset();
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const [brainAnswer] = think(subjects[brainNum].brain, [
      (target.x - halfWidth) / halfWidth,
      (target.y - halfHeight) / halfHeight,
    ]);
    const a = brainAnswer * PI;
    ball.vx = cos(a) * ballSpeed;
    ball.vy = sin(a) * ballSpeed;
  }
}

const ball = { x: 0, y: 0, vx: 0, vy: 0, radius: 4, colour: "#000" };
const target = { x: 0, y: 0, radius: 8, colour: "#a00" };

function reset() {
  ball.x = 0;
  ball.y = height;
  ball.vx = 0;
  ball.vy = 0;
  target.x = rn() * width;
  target.y = rn() * height;
  target.colour = "#a00";
}

function isColliding(
  a: { x: number; y: number; radius: number },
  b: { x: number; y: number; radius: number }
) {
  const distance = sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  return distance < a.radius + b.radius;
}

const info = [
  "This is an example of a genetic/evolutionary algorithm",
  "",
  "1000 brains are being tested 100 times each",
  "The best is cloned and randomly mutated 999x for the next generation",
  "Each brain has neurons: 2 input (x, y), 6 hidden, 1 output (angle)",
  "",
  "Click / tap to watch in real-time",
  "",
  "It's impressive because this is the equation it intuits:",
];

function display(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  equation: HTMLImageElement
) {
  //Clear background
  ctx.fillStyle = "rgba(255, 255, 255, .1)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  //Draw box
  ctx.strokeStyle = "#aaa";
  ctx.strokeRect(0, canvas.height - height, width, height);
  //Draw line chart
  ctx.strokeStyle = "#4a4";
  ctx.lineWidth = 1;
  ctx.moveTo(canvas.width, 0);
  ctx.beginPath();
  bestScores.forEach((score, i) => {
    ctx.lineTo(
      i * lineChartSegmentWidth,
      height - (height / numTestPerBrain) * score - (height - canvas.height)
    );
  });
  ctx.stroke();
  //Draw info
  ctx.fillStyle = "#222";
  info.map((text, i) => {
    ctx.fillText(text, 10, 128 + i * 16);
  });
  ctx.drawImage(equation, 10, 270, 378 * 0.8, 68 * 0.8);
  ctx.fillText(`Generation ${generationNum + 1}`, canvas.width / 2 - 32, 64);
  const bestScore = bestScores[bestScores.length - 1] ?? 0;
  ctx.fillText(`Best accuracy: ${bestScore}%`, canvas.width / 2 - 32, 80);
  //Draw ball and target
  const objects = [ball, target];
  objects.forEach(({ x, y, radius, colour }) => {
    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.arc(x, y - (height - canvas.height), radius, 0, PI * 2);
    ctx.fill();
  });
  //Draw bars
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width / (subjects.length / brainNum), 8);
  const segmentWidth = canvas.width / numTestPerBrain;
  hits.forEach((hit, i) => {
    ctx.fillStyle = hit ? "green" : "red";
    ctx.fillRect(i * segmentWidth, 8, segmentWidth, 8);
  });
}

let slowMode = false;
function work() {
  for (let i = 0; i < 100000; ++i) {
    if (slowMode && i && !brainNum) {
      break;
    }
    ball.x += ball.vx;
    ball.y += ball.vy;
    ball.vy += 0.1;
    const targetHit = isColliding(ball, target);
    const wallHit =
      Math.abs(ball.x) - target.radius * 2 > target.x || ball.y > height;
    if (targetHit) hits.push(true);
    if (wallHit) hits.push(false);
    next(targetHit, wallHit);
  }
  if (bestScores[bestScores.length - 1] === numTestPerBrain) {
    slowMode = true;
  }
}

function DomLoad() {
  const canvas = document.querySelector("canvas")!;
  const ctx = canvas.getContext("2d")!;
  const equation = document.querySelector("img")!;
  ctx.font = "12px monospace";
  reset();
  setInterval(() => display(canvas, ctx, equation), 10);
  setInterval(work, 10);
}
