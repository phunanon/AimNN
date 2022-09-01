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

const vec = (n: number) => [...Array(n)].map((n) => 0);

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
const ballSpeed = 11;
const numBrain = 1000;
const numTestPerBrain = 100;
let subjects: Subject[];
const bestScores: number[] = [];
let generationNum = 0;
let brainNum = 0;
let testNum = 0;
let didHit = false;

function next(hit: boolean, failed: boolean) {
  let status: "nothing" | "test" | "brain" = "nothing";
  if (hit) {
    ++subjects[brainNum].score;
  }
  if (hit || failed) {
    ++testNum;
    status = "test";
    if (testNum == numTestPerBrain) {
      testNum = 0;
      ++brainNum;
      status = "brain";
      rng = new RNG("...");
      if (brainNum == subjects.length) {
        subjects.sort((a, b) => b.score - a.score);
        const parent = subjects[0];
        bestScores.push(parent.score);
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
  return status;
}

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;

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

function display() {
  //Clear background
  ctx.fillStyle = "rgba(255, 255, 255, .1)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  //Draw box
  ctx.strokeStyle = "#000";
  ctx.strokeRect(0, canvas.height - height, width, height);
  //Draw line chart
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1;
  ctx.moveTo(canvas.width, 0);
  ctx.beginPath();
  bestScores.forEach((score, i) => {
    ctx.lineTo(
      i * 4,
      height - (height / numTestPerBrain) * score - (height - canvas.height)
    );
  });
  ctx.stroke();
  //Draw ball and target
  const objects = [ball, target];
  objects.forEach(({ x, y, radius, colour }) => {
    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.arc(x, y - (height - canvas.height), radius, 0, PI * 2);
    ctx.fill();
  });
  //Draw info
  ctx.fillStyle = "black";
  ctx.fillText(
    `Generation ${generationNum + 1}`,
    canvas.width / 2 - 32,
    canvas.height / 2
  );
  ctx.fillText(
    `Best score: ${bestScores[bestScores.length - 1]} / ${numTestPerBrain}`,
    canvas.width / 2 - 32,
    canvas.height / 2 + 16
  );
  //Draw bars
  ctx.fillRect(0, 0, canvas.width / (subjects.length / brainNum), 8);
  ctx.fillStyle = didHit ? "green" : "red";
  ctx.fillRect(0, 8, canvas.width / (numTestPerBrain / testNum), 8);
  setTimeout(display, 10);
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
    const wallHit = Math.abs(ball.x) + ball.radius > width || ball.y > height;
    const status = next(targetHit, wallHit);
    if (status == "test") {
      didHit = false;
    }
    if (targetHit) {
      didHit = true;
    }
  }
  setTimeout(work, 10);
}

function DomLoad() {
  canvas = document.querySelector("canvas")!;
  ctx = canvas.getContext("2d")!;
  subjects = vec(numBrain).map(subject);
  reset();
  display();
  work();
}
