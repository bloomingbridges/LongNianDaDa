
const LEVELS = 3;
const dX = 6;
const RES = 512;
const FPS = 60;

let bgCOL;
let darkCOL;
let greenCOL;
let lightCOL;

let mainCanvas;
let longGFX;
let longTex;

let tS = 100;
let hTS = 50;
let qTS = 25;

let cols = -1;
let rows = 0;
let seamA = [];
let seamB = [];

var generating = true;
var moving = 0;
var debug = false;
var t = 0;

function setup() {
  mainCanvas = createCanvas(512, 512, WEBGL);
  longGFX = createGraphics(RES, RES);
  pixelDensity(1);
  
  tS = width / (LEVELS - 0.5);
  hTS = tS * 0.5;
  qTS = tS * 0.25;
  
  // Colour palette
  bgCOL = color(22, 28, 15);
  darkCOL = color(17, 142, 56);
  greenCOL = color(30, 199, 89);
  lightCOL = color(32, 228, 112);

  frameRate(FPS);
  noLoop();
  smooth();
 
  textureMode(NORMAL);
  textureWrap(REPEAT, CLAMP);
  background(bgCOL);
  ambientLight(bgCOL);
}

function draw() {
  if (generating) {
    generateLong();
    cleanUpMemory();
    generating = false;
    toggleAnimation();
    loop();
  } else {
    background(bgCOL);
    t += (deltaTime / 16);
    drawLong();
  }
}

function generateLong() {
  longGFX.fill(greenCOL);
  longGFX.rect(0, 0, RES, RES);
  while (cols < LEVELS * 4 + 1) {
    longGFX.push();
      longGFX.translate(-hTS, -hTS);
      let offset = (cols % 2 == 0) ? 1 : 0;
      
      let scaleGFX;
      if (cols === LEVELS * 4) {
        scaleGFX = seamB[rows];
      } else if (cols === LEVELS * 4 - 1) {
        scaleGFX = seamA[rows];
      } else {
        if (debug) {
          scaleGFX = drawScale(rows >= 4);
        } else {
          scaleGFX = drawScale(rows > 2);
        }
      }
      longGFX.image(scaleGFX, (cols - 1)*qTS, rows*hTS - (offset * qTS), tS, tS);
      
      if (cols === 1) {
        seamA.push(scaleGFX);
      } else if (cols === 2) {
        seamB.push(scaleGFX);
      }
      scaleGFX.remove();
    longGFX.pop();
    rows++;
    if (rows > LEVELS * 2) {
      rows = 0;
      cols++;
    }
  }
  longTex = createImage(RES, RES);
  longTex.copy(longGFX, 0, 0, RES, RES, 0, 0, RES, RES);
}

function cleanUpMemory() {
  var g = 0;
  const G = seamA.length;
  for ( g; g < G; ++g ) {
    seamA[g].remove();
    seamB[g].remove();
  }
  seamA = [];
  seamB = [];
}

function drawLong() {
  push();
    texture(longTex);
    if (debug) {
      scale(0.75, 0.75);
    }
    noStroke();
    translate(RES / -2, RES / -2);
    drawFan();
  pop();
  if (debug) {
    push();
      scale(0.75, 0.75);
      noFill();
      stroke(lightCOL);
      strokeWeight(2);
      translate(RES / -2, RES / -2);
      drawFan();
    pop();
  }
}

function drawFan() {
  const cW = RES / dX;
  for (let h = 0; h < dX; h++) {
    var u1 = (h*cW) / RES;
    var u2 = ((h+1) * cW) / RES;
    var o1 = 0;
    var o2 = 0;
    if (moving != 0) {
      u1 += (t % RES / (RES / 15)) * moving;
      u2 += (t % RES / (RES / 15)) * moving;
      o1 = sin((t / 15) + (h/dX)) * cW;
      o2 = sin((((t / 15) + ((h+1) / dX)))) * cW;
    }
    beginShape();
      vertex(h*cW, RES + o1, 0, u1, 1);
      vertex(h*cW, 0 + o1, 0, u1, 0); 
      vertex((h+1)*cW, + o2, 0, u2, 0);
      vertex((h+1)*cW, + o2, 0, u2, 0);
      vertex(h*cW, RES + o1, 0, u1, 1);
      vertex((h+1)*cW, RES + o2, 0, u2, 1);
      vertex((h+1)*cW, 0 + o2, 0, u2, 0);
    endShape();
  }
}

function drawScale(darker = false) {
  let gfx = createGraphics(RES, RES);
  let gradient = createGraphics(RES, RES);
  let comp = createGraphics(RES, RES);
  let gradientMask = createGraphics(RES, RES);
  
  let size = random(32, 86);
  let lines = random(12, 32);
  let ap = random(-1, 1);
  let al = random(24, 128);
  
  gfx.scale(RES / 100, RES / 100);
  
  if (darker) {
    drawDarkerGradient(gradient, ap, al);
  } else {
    drawGradient(gradient, ap, al);
  }
  
  gradientMask.push();
    gradientMask.scale(RES / 100, RES / 100);
    gradientMask.fill(255);
    gradientMask.noStroke();
    gradientMask.beginShape();
      gradientMask.vertex(10, 50 - abs(ap / 20 * lines));
      yOffset = map(0, 0, lines, 10, size);
      yEdge = (100 - size) / 2;
      gradientMask.quadraticVertex(40, yEdge + yOffset - ap, 100, yEdge + yOffset + ap);
      yOffset = map(lines, 0, lines, 10, size, true);
      gradientMask.vertex(100, yEdge + yOffset + ap);
      gradientMask.quadraticVertex(40, yEdge + yOffset - ap, 10, 50 - abs(ap / 20 * 0));
      gradientMask.vertex(10, 50 - abs(ap / 20 * lines));
    gradientMask.endShape();
  gradientMask.pop();
  
  comp.image(gradient, 0, 0, RES, RES);
  let c = comp.get();
  c.mask(gradientMask.get());
  gfx.image(c, 0, 0, 100, 100);
  
  gfx.noFill();
  darkCOL.setAlpha(al);
  gfx.stroke(darkCOL);
  gfx.strokeWeight(0.5 + ap);
  gfx.strokeCap(SQUARE);
  var l = 1; 
  var yOffset, yEdge;
  //gfx.blendMode(DODGE);
  while (l < lines - 1) {
    gfx.beginShape();
      gfx.vertex(11, 50 - abs(ap / 20 * (lines - l)));
      yOffset = map(l, 0, lines, 10, size);
      yEdge = (100 - size) / 2;
      gfx.quadraticVertex(40, yEdge + yOffset - ap, 100, yEdge + yOffset + ap);
    gfx.endShape();
    l++;
  }
  gfx.stroke(darkCOL);
  gfx.strokeWeight(0.4 + (ap * 0.1));
  l = 0;
  gfx.blendMode(MULTIPLY);
  while (l <= lines) {
    gfx.beginShape();
      gfx.vertex(5, 50 + ap);
      gfx.vertex(10, 50 - abs(ap / 20 * (lines - l)));
      yOffset = map(l, 0, lines, 10, size);
      yEdge = (100 - size) / 2;
      gfx.quadraticVertex(40, yEdge + yOffset - ap, 100, yEdge + yOffset + ap);
    gfx.endShape();
    l++;
  }
  
  gradient.remove();
  comp.remove();
  gradientMask.remove();
  
  return gfx;
}

function drawDarkerGradient(gradient, r, g) {
  gradient.noStroke();
  gradient.push();
    gradient.background(greenCOL);
    gradient.translate(100, 50);
    gradient.rotate(r * QUARTER_PI);
    for (let i = -RES * 2; i <= RES * 2; i++) {
      gradient.fill(lerpColor(darkCOL, greenCOL, map(i, 0, RES / 2, -0.5 + abs(r - (i / 255)), 1, false)));
      gradient.rect(i, -RES, 1, RES * 3);
    }
  gradient.pop();
}

function drawGradient(gradient, r, g) {
  gradient.noStroke();
  gradient.push();
    gradient.background(greenCOL);
    gradient.translate(100, 50);
    gradient.rotate(r * QUARTER_PI);
    for (let i = -RES * 1.5; i <= RES * 1.5; i++) {
      gradient.fill(lerpColor(greenCOL, lightCOL, map(i, 0, RES / 2, -0.5 + abs(r - (i / 255)), 1, false)));
      gradient.rect(i, -RES, 1, RES * 3);
    }
  gradient.pop();
}

function keyPressed() {
  if (key === 'd') {
    debug = !debug;
  }
}

function toggleAnimation() {
  moving = moving === 0 ? -1 : 0;
}

function mouseClicked() {
  if (mouseButton === CENTER) { 
    window.location.reload();
  }
  else {
    toggleAnimation();
  }
}
