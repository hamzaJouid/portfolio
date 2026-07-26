/* ============================================================
   NEXUS//OS — Portfolio WebGL
   Champ de particules qui se métamorphose selon la section
   ============================================================ */

const COUNT = 6000;
const SECTIONS = 4;
let currentSection = 0;
let isTransitioning = false;

/* ---------- Scène Three.js ---------- */
const canvas = document.getElementById('webgl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x030409, 0.035);
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
camera.position.z = 16;

/* ---------- Générateurs de formes (cibles de morphing) ---------- */
function shapeGalaxy() {           // Accueil : spirale galactique
  const p = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    const arm = i % 3, t = (i / COUNT) * Math.PI * 6 + arm * (Math.PI * 2 / 3);
    const r = 1 + (i / COUNT) * 8 + (Math.random() - 0.5);
    p[i * 3] = Math.cos(t) * r;
    p[i * 3 + 1] = (Math.random() - 0.5) * (1.5 - r * 0.1);
    p[i * 3 + 2] = Math.sin(t) * r;
  }
  return p;
}
function shapeMatrix() {           // Projets : grille cubique
  const p = new Float32Array(COUNT * 3), side = Math.ceil(Math.cbrt(COUNT));
  for (let i = 0; i < COUNT; i++) {
    p[i * 3]     = ((i % side) / side - 0.5) * 12 + (Math.random() - 0.5) * 0.2;
    p[i * 3 + 1] = ((Math.floor(i / side) % side) / side - 0.5) * 12 + (Math.random() - 0.5) * 0.2;
    p[i * 3 + 2] = (Math.floor(i / (side * side)) / side - 0.5) * 12;
  }
  return p;
}
function shapeHelix() {            // Profil : double hélice ADN
  const p = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    const strand = i % 2, t = (i / COUNT) * Math.PI * 10;
    const off = strand * Math.PI;
    p[i * 3]     = Math.cos(t + off) * 3 + (Math.random() - 0.5) * 0.4;
    p[i * 3 + 1] = (i / COUNT - 0.5) * 14;
    p[i * 3 + 2] = Math.sin(t + off) * 3 + (Math.random() - 0.5) * 0.4;
  }
  return p;
}
function shapeTorus() {            // Contact : tore lumineux
  const p = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    const u = Math.random() * Math.PI * 2, v = Math.random() * Math.PI * 2;
    const R = 5.5, r = 1.6;
    p[i * 3]     = (R + r * Math.cos(v)) * Math.cos(u);
    p[i * 3 + 1] = r * Math.sin(v) * 1.4;
    p[i * 3 + 2] = (R + r * Math.cos(v)) * Math.sin(u);
  }
  return p;
}
const targets = [shapeGalaxy(), shapeMatrix(), shapeHelix(), shapeTorus()];

/* ---------- Nuage de particules ---------- */
const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(targets[0]);
const colors = new Float32Array(COUNT * 3);
const cyan = new THREE.Color(0x00f0ff), pink = new THREE.Color(0xff2d78);
for (let i = 0; i < COUNT; i++) {
  const c = cyan.clone().lerp(pink, Math.random() * 0.6);
  colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
}
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

const material = new THREE.PointsMaterial({
  size: 0.06, vertexColors: true, transparent: true, opacity: 0.9,
  blending: THREE.AdditiveBlending, depthWrite: false
});
const points = new THREE.Points(geometry, material);
scene.add(points);

/* ---------- Boucle d'animation ---------- */
const mouse = { x: 0, y: 0 };
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  const pos = geometry.attributes.position.array;
  const target = targets[currentSection];

  // Morphing progressif vers la forme cible + ondulation organique
  for (let i = 0; i < COUNT * 3; i += 3) {
    pos[i]     += (target[i]     - pos[i])     * 0.045;
    pos[i + 1] += (target[i + 1] - pos[i + 1]) * 0.045 + Math.sin(t * 2 + pos[i]) * 0.003;
    pos[i + 2] += (target[i + 2] - pos[i + 2]) * 0.045;
  }
  geometry.attributes.position.needsUpdate = true;

  points.rotation.y = t * 0.08;
  points.rotation.x = Math.sin(t * 0.1) * 0.15;

  // Parallaxe caméra sur la souris
  camera.position.x += (mouse.x * 2.5 - camera.position.x) * 0.04;
  camera.position.y += (-mouse.y * 2.5 - camera.position.y) * 0.04;
  camera.lookAt(scene.position);

  renderer.render(scene, camera);
}
animate();

/* ---------- Navigation entre sections ---------- */
const panels = document.querySelectorAll('.panel');
const nodes = document.querySelectorAll('.nav-node');
const counter = document.getElementById('current-index');

function goTo(index) {
  if (index < 0 || index >= SECTIONS || index === currentSection || isTransitioning) return;
  isTransitioning = true;
  currentSection = index;

  panels.forEach(p => p.classList.toggle('active', +p.dataset.section === index));
  nodes.forEach(n => n.classList.toggle('active', +n.dataset.index === index));
  counter.textContent = String(index + 1).padStart(2, '0');

  setTimeout(() => (isTransitioning = false), 900);
}

// Molette (avec debounce) — remplace le scroll classique
let wheelLock = false;
addEventListener('wheel', e => {
  if (wheelLock) return;
  wheelLock = true;
  goTo(currentSection + (e.deltaY > 0 ? 1 : -1));
  setTimeout(() => (wheelLock = false), 1100);
}, { passive: true });

// Clavier
addEventListener('keydown', e => {
  if (['ArrowDown', 'ArrowRight', 'PageDown'].includes(e.key)) goTo(currentSection + 1);
  if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) goTo(currentSection - 1);
});

// Tactile (swipe vertical)
let touchY = 0;
addEventListener('touchstart', e => (touchY = e.touches[0].clientY), { passive: true });
addEventListener('touchend', e => {
  const dy = touchY - e.changedTouches[0].clientY;
  if (Math.abs(dy) > 50) goTo(currentSection + (dy > 0 ? 1 : -1));
}, { passive: true });

// Menu orbital + bouton CTA
nodes.forEach(n => n.addEventListener('click', () => goTo(+n.dataset.index)));
document.querySelectorAll('[data-goto]').forEach(b =>
  b.addEventListener('click', () => goTo(+b.dataset.goto)));

/* ---------- Curseur personnalisé ---------- */
const dot = document.querySelector('.cursor-dot');
const ring = document.querySelector('.cursor-ring');
let ringX = 0, ringY = 0;

addEventListener('mousemove', e => {
  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = (e.clientY / innerHeight) * 2 - 1;
  dot.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%,-50%)`;
});
(function followRing() {
  const x = (mouse.x + 1) / 2 * innerWidth, y = (mouse.y + 1) / 2 * innerHeight;
  ringX += (x - ringX) * 0.15; ringY += (y - ringY) * 0.15;
  ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%,-50%)`;
  requestAnimationFrame(followRing);
})();
document.querySelectorAll('[data-hover]').forEach(el => {
  el.addEventListener('mouseenter', () => ring.classList.add('hover'));
  el.addEventListener('mouseleave', () => ring.classList.remove('hover'));
});

/* ---------- Tilt 3D des cartes holographiques ---------- */
document.querySelectorAll('.holo-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const rx = ((e.clientY - r.top) / r.height - 0.5) * -16;
    const ry = ((e.clientX - r.left) / r.width - 0.5) * 16;
    card.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) translateZ(12px)`;
  });
  card.addEventListener('mouseleave', () => (card.style.transform = ''));
});

/* ---------- Horloge HUD ---------- */
setInterval(() => {
  document.getElementById('clock').textContent = new Date().toLocaleTimeString('fr-FR');
}, 1000);

/* ---------- Redimensionnement ---------- */
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
