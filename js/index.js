var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var PI = Math.PI, cos = Math.cos, sin = Math.sin, sqrt = Math.sqrt;
var rng = new RNG("...");
var rng2 = new RNG("...");
var rn2 = function () { return rng2.uniform(); };
var rn = function () { return rng.uniform(); };
var vec = function (n) { return __spreadArray([], Array(n), true).map(function () { return 0; }); };
function brain(inputs, layers, neuronsPerLayer) {
    return __spreadArray([
        vec(inputs).map(function (n) { return ({ bias: 0, weights: vec(neuronsPerLayer) }); })
    ], vec(layers).map(function (l) {
        return vec(neuronsPerLayer).map(function (n) { return ({
            bias: 0,
            weights: vec(neuronsPerLayer)
        }); });
    }), true);
}
var think = function (layers, inputs) {
    return layers.reduce(function (inputs, layer) {
        return layer.map(function (_a) {
            var bias = _a.bias, weights = _a.weights;
            return Math.tanh(inputs.reduce(function (sum, input, i) { return sum + input * weights[i]; }, 0) + bias);
        });
    }, inputs);
};
var mutant = function (brain) {
    return brain.map(function (layer) {
        return layer.map(function (neuron) {
            var bias = neuron.bias, weights = neuron.weights;
            return {
                bias: rn2() > 0.8 ? rn2() * 2 - 1 : bias,
                weights: weights.map(function (w) { return (rn2() > 0.8 ? rn2() * 2 - 1 : w); })
            };
        });
    });
};
function subject() {
    var numInput = 2;
    var numLayer = 2;
    var neuronsPerLayer = 3;
    return {
        score: 0,
        brain: mutant(brain(numInput, numLayer, neuronsPerLayer))
    };
}
var width = 500;
var height = 300;
var lineChartSegmentWidth = 4;
var ballSpeed = 11;
var numBrain = 1000;
var numTestPerBrain = 100;
var subjects = vec(numBrain).map(subject);
var bestScores = [];
var generationNum = 0;
var brainNum = 0;
var testNum = 0;
var hits = [];
function next(hit, failed) {
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
                subjects.sort(function (a, b) { return b.score - a.score; });
                var parent_1 = subjects[0];
                bestScores.push(parent_1.score);
                if (bestScores.length > width / lineChartSegmentWidth) {
                    bestScores.shift();
                }
                subjects = __spreadArray([
                    { score: 0, brain: parent_1.brain }
                ], vec(numBrain - 1).map(function (n) { return ({
                    score: 0,
                    brain: mutant(parent_1.brain)
                }); }), true);
                brainNum = 0;
                ++generationNum;
            }
        }
        reset();
        var halfWidth = width / 2;
        var halfHeight = height / 2;
        var brainAnswer = think(subjects[brainNum].brain, [
            (target.x - halfWidth) / halfWidth,
            (target.y - halfHeight) / halfHeight,
        ])[0];
        var a = brainAnswer * PI;
        ball.vx = cos(a) * ballSpeed;
        ball.vy = sin(a) * ballSpeed;
    }
}
var ball = { x: 0, y: 0, vx: 0, vy: 0, radius: 4, colour: "#000" };
var target = { x: 0, y: 0, radius: 8, colour: "#a00" };
function reset() {
    ball.x = 0;
    ball.y = height;
    ball.vx = 0;
    ball.vy = 0;
    target.x = rn() * width;
    target.y = rn() * height;
    target.colour = "#a00";
}
function isColliding(a, b) {
    var distance = sqrt(Math.pow((a.x - b.x), 2) + Math.pow((a.y - b.y), 2));
    return distance < a.radius + b.radius;
}
var info = [
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
function display(canvas, ctx, equation) {
    var _a;
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
    bestScores.forEach(function (score, i) {
        ctx.lineTo(i * lineChartSegmentWidth, height - (height / numTestPerBrain) * score - (height - canvas.height));
    });
    ctx.stroke();
    //Draw info
    ctx.fillStyle = "#222";
    info.map(function (text, i) {
        ctx.fillText(text, 10, 128 + i * 16);
    });
    ctx.drawImage(equation, 10, 270, 378 * 0.8, 68 * 0.8);
    ctx.fillText("Generation ".concat(generationNum + 1), canvas.width / 2 - 32, 64);
    var bestScore = (_a = bestScores[bestScores.length - 1]) !== null && _a !== void 0 ? _a : 0;
    ctx.fillText("Best accuracy: ".concat(bestScore, "%"), canvas.width / 2 - 32, 80);
    //Draw ball and target
    var objects = [ball, target];
    objects.forEach(function (_a) {
        var x = _a.x, y = _a.y, radius = _a.radius, colour = _a.colour;
        ctx.fillStyle = colour;
        ctx.beginPath();
        ctx.arc(x, y - (height - canvas.height), radius, 0, PI * 2);
        ctx.fill();
    });
    //Draw bars
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width / (subjects.length / brainNum), 8);
    var segmentWidth = canvas.width / numTestPerBrain;
    hits.forEach(function (hit, i) {
        ctx.fillStyle = hit ? "green" : "red";
        ctx.fillRect(i * segmentWidth, 8, segmentWidth, 8);
    });
}
var slowMode = false;
function work() {
    for (var i = 0; i < 100000; ++i) {
        if (slowMode && i && !brainNum) {
            break;
        }
        ball.x += ball.vx;
        ball.y += ball.vy;
        ball.vy += 0.1;
        var targetHit = isColliding(ball, target);
        var wallHit = Math.abs(ball.x) - target.radius * 2 > target.x || ball.y > height;
        if (targetHit)
            hits.push(true);
        if (wallHit)
            hits.push(false);
        next(targetHit, wallHit);
    }
    if (bestScores[bestScores.length - 1] === numTestPerBrain) {
        slowMode = true;
    }
}
function DomLoad() {
    var canvas = document.querySelector("canvas");
    var ctx = canvas.getContext("2d");
    var equation = document.querySelector("img");
    ctx.font = "12px monospace";
    reset();
    setInterval(function () { return display(canvas, ctx, equation); }, 10);
    setInterval(work, 10);
}
//# sourceMappingURL=index.js.map