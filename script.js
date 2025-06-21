// 1. RIFERIMENTI AGLI ELEMENTI HTML
const canvas = document.getElementById('art-canvas');
const ctx = canvas.getContext('2d');
const generateButton = document.getElementById('generate-button');
const mainContainer = document.getElementById('main-container');

// 2. VARIABILI DI STATO E IMPOSTAZIONI
let particlesArray = [];
let mainObject = {};
let animationId;
let currentAnimation = 'none';

const animationTypes = ['fireworks', 'network', 'rain', 'rocket', 'bouncingBall', 'orbit', 'vortex', 'matrix'];

const FIREWORK_PARTICLES = 200;
const GRAVITY = 0.05;
const FADE_SPEED = 0.98;
const NETWORK_PARTICLES = 100;
const CONNECTION_DISTANCE = 120;
const RAIN_PARTICLES = 150;
const ORBIT_PARTICLES = 50;
const VORTEX_PARTICLES = 150;
const MATRIX_COLUMNS = 50;

// =================================================================
// CLASSI DELLE PARTICELLE
// =================================================================
class FireworkParticle {
    constructor(x, y) {
        this.x = x; this.y = y; this.size = Math.random() * 5 + 1;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 7 + 2;
        this.velocityX = Math.cos(angle) * speed; this.velocityY = Math.sin(angle) * speed;
        this.life = 1;
    }
    update() {
        this.velocityY += GRAVITY; this.x += this.velocityX; this.y += this.velocityY;
        this.life *= FADE_SPEED;
    }
    draw() {
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${this.life})`; ctx.fill();
    }
}

class NetworkParticle {
    constructor() {
        this.x = Math.random() * canvas.width; this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1; this.velocityX = (Math.random() - 0.5) * 2;
        this.velocityY = (Math.random() - 0.5) * 2;
    }
    update() {
        if (this.x > canvas.width || this.x < 0) this.velocityX = -this.velocityX;
        if (this.y > canvas.height || this.y < 0) this.velocityY = -this.velocityY;
        this.x += this.velocityX; this.y += this.velocityY;
    }
    draw() {
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = 'white'; ctx.fill();
    }
}

class RainParticle {
    constructor() {
        this.x = Math.random() * canvas.width; this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 1; this.speed = Math.random() * 3 + 1;
    }
    update() {
        this.y += this.speed;
        if (this.y > canvas.height) { this.y = 0 - this.size; this.x = Math.random() * canvas.width; }
    }
    draw() {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillRect(this.x, this.y, this.size, this.size * 5);
    }
}

class OrbitalParticle {
    constructor() {
        this.centerX = canvas.width / 2; this.centerY = canvas.height / 2;
        this.radius = Math.random() * (Math.min(canvas.width, canvas.height) / 2 - 20) + 20;
        this.angle = Math.random() * Math.PI * 2;
        this.speed = Math.random() * 0.02 + 0.01;
        this.size = Math.random() * 3 + 1;
        this.color = `hsl(${Math.random() * 60 + 200}, 100%, 70%)`;
    }
    update() {
        this.angle += this.speed;
        this.x = this.centerX + Math.cos(this.angle) * this.radius;
        this.y = this.centerY + Math.sin(this.angle) * this.radius;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

class VortexParticle {
    constructor() {
        this.x = canvas.width / 2; this.y = canvas.height / 2;
        this.speed = Math.random() * 2 + 0.5; this.angle = Math.random() * Math.PI * 2;
        this.size = Math.random() * 3 + 1;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.1;
        this.color = `hsl(${Math.random() * 60}, 100%, 70%)`;
    }
    update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        this.rotation += this.rotationSpeed;
        this.size *= 0.99;
    }
    draw() {
        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.rotation);
        ctx.fillStyle = this.color; ctx.fillRect(-this.size * 5, -this.size / 2, this.size * 10, this.size);
        ctx.restore();
    }
}

class MatrixStream {
    constructor(x) {
        this.x = x; this.y = Math.random() * -canvas.height;
        this.speed = Math.random() * 5 + 2;
        this.chars = '日ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹｲﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ0123456789';
        this.streamLength = Math.floor(Math.random() * 20 + 10);
    }
    update() {
        this.y += this.speed;
        if (this.y > canvas.height + this.streamLength * 20) this.y = 0;
    }
    draw() {
        for (let i = 0; i < this.streamLength; i++) {
            const char = this.chars.charAt(Math.floor(Math.random() * this.chars.length));
            const yPos = this.y - (i * 20);
            if (yPos > 0 && yPos < canvas.height) {
                ctx.fillStyle = (i === 0) ? '#bbf7d0' : '#22c55e';
                ctx.fillText(char, this.x, yPos);
            }
        }
    }
}

// =================================================================
// FUNZIONI DI GESTIONE DELL'ANIMAZIONE
// =================================================================
function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }

function initFireworks() { currentAnimation = 'fireworks'; particlesArray = []; const startX = canvas.width / 2; const startY = canvas.height / 2; for (let i = 0; i < FIREWORK_PARTICLES; i++) { particlesArray.push(new FireworkParticle(startX, startY)); } }
function initNetwork() { currentAnimation = 'network'; particlesArray = []; for (let i = 0; i < NETWORK_PARTICLES; i++) { particlesArray.push(new NetworkParticle()); } }
function initRain() { currentAnimation = 'rain'; particlesArray = []; for (let i = 0; i < RAIN_PARTICLES; i++) { particlesArray.push(new RainParticle()); } }
function initRocket() { currentAnimation = 'rocket'; const angle = Math.random() * Math.PI * 2; mainObject = { x: canvas.width / 2, y: canvas.height / 2, size: 30, velocityX: Math.cos(angle) * 15, velocityY: Math.sin(angle) * 15 }; }
function initBouncingBall() { currentAnimation = 'bouncingBall'; mainObject = { x: canvas.width / 2, y: canvas.height / 2, size: 30, velocityX: (Math.random() - 0.5) * 10, velocityY: (Math.random() - 0.5) * 10, color: `hsl(${Math.random() * 360}, 100%, 50%)` }; }
function initOrbit() { currentAnimation = 'orbit'; particlesArray = []; for (let i = 0; i < ORBIT_PARTICLES; i++) { particlesArray.push(new OrbitalParticle()); } }
function initVortex() { currentAnimation = 'vortex'; particlesArray = []; ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < VORTEX_PARTICLES; i++) { particlesArray.push(new VortexParticle()); } }
function initMatrix() { currentAnimation = 'matrix'; particlesArray = []; const columnWidth = canvas.width / MATRIX_COLUMNS; for (let i = 0; i < MATRIX_COLUMNS; i++) { particlesArray.push(new MatrixStream(i * columnWidth)); } ctx.font = '20px monospace'; }

function drawConnections() { let opacity; for (let a = 0; a < particlesArray.length; a++) { for (let b = a; b < particlesArray.length; b++) { const dx = particlesArray[a].x - particlesArray[b].x; const dy = particlesArray[a].y - particlesArray[b].y; const distance = Math.sqrt(dx * dx + dy * dy); if (distance < CONNECTION_DISTANCE) { opacity = 1 - (distance / CONNECTION_DISTANCE); ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(particlesArray[a].x, particlesArray[a].y); ctx.lineTo(particlesArray[b].x, particlesArray[b].y); ctx.stroke(); } } } }

// Ciclo di animazione principale - ORA È COMPLETO E CORRETTO
function animate() {
    // Logica di disegno specifica per lo sfondo
    if (['fireworks', 'rocket', 'orbit', 'vortex', 'matrix'].includes(currentAnimation)) {
        ctx.fillStyle = 'rgba(12, 12, 20, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Logica di aggiornamento e disegno per ogni tipo di animazione
    if (currentAnimation === 'fireworks') {
        particlesArray.forEach((p, i) => { p.update(); p.draw(); if (p.life < 0.01) particlesArray.splice(i, 1); });
        if (particlesArray.length === 0) stopAnimation();
    } else if (currentAnimation === 'network') {
        particlesArray.forEach(p => { p.update(); p.draw(); });
        drawConnections();
    } else if (currentAnimation === 'rain') {
        particlesArray.forEach(p => { p.update(); p.draw(); });
    } else if (currentAnimation === 'rocket') {
        mainObject.x += mainObject.velocityX;
        mainObject.y += mainObject.velocityY;
        ctx.beginPath(); ctx.arc(mainObject.x, mainObject.y, mainObject.size, 0, Math.PI * 2);
        ctx.fillStyle = 'white'; ctx.fill();
    } else if (currentAnimation === 'bouncingBall') {
        if (mainObject.x + mainObject.size > canvas.width || mainObject.x - mainObject.size < 0) { mainObject.velocityX = -mainObject.velocityX; mainObject.color = `hsl(${Math.random() * 360}, 100%, 50%)`; }
        if (mainObject.y + mainObject.size > canvas.height || mainObject.y - mainObject.size < 0) { mainObject.velocityY = -mainObject.velocityY; mainObject.color = `hsl(${Math.random() * 360}, 100%, 50%)`; }
        mainObject.x += mainObject.velocityX; mainObject.y += mainObject.velocityY;
        ctx.beginPath(); ctx.arc(mainObject.x, mainObject.y, mainObject.size, 0, Math.PI * 2);
        ctx.fillStyle = mainObject.color; ctx.fill();
    } else if (currentAnimation === 'orbit') {
        particlesArray.forEach(p => { p.update(); p.draw(); });
    } else if (currentAnimation === 'vortex') {
        particlesArray.forEach((p, i) => { p.update(); p.draw(); if (p.size < 0.1) particlesArray.splice(i, 1); });
        if (particlesArray.length < VORTEX_PARTICLES) particlesArray.push(new VortexParticle());
    } else if (currentAnimation === 'matrix') {
        particlesArray.forEach(p => { p.update(); p.draw(); });
    }
    
    if (animationId) {
        animationId = requestAnimationFrame(animate);
    }
}

function startAnimation(type) {
    if (mainContainer.style.opacity !== '0') mainContainer.style.opacity = 0;
    
    ctx.globalCompositeOperation = 'source-over';
    
    if (type === 'fireworks') initFireworks();
    else if (type === 'network') initNetwork();
    else if (type === 'rain') initRain();
    else if (type === 'rocket') initRocket();
    else if (type === 'bouncingBall') initBouncingBall();
    else if (type === 'orbit') initOrbit();
    else if (type === 'vortex') initVortex();
    else if (type === 'matrix') initMatrix();
    
    if (!animationId) animationId = requestAnimationFrame(animate);
}

function stopAnimation() {
    if (currentAnimation === 'fireworks') {
        cancelAnimationFrame(animationId);
        animationId = null;
        currentAnimation = 'none';
    }
}

// =================================================================
// IMPOSTAZIONE INIZIALE E EVENTI
// =================================================================
resizeCanvas();
window.addEventListener('resize', () => { resizeCanvas(); if (animationId) startAnimation(currentAnimation); });

generateButton.addEventListener('click', () => {
    if (currentAnimation === 'fireworks' && particlesArray.length > 0) return;
    const randomAnimationType = animationTypes[Math.floor(Math.random() * animationTypes.length)];
    if(animationId) cancelAnimationFrame(animationId);
    animationId = null;
    startAnimation(randomAnimationType);
});

mainContainer.style.transition = 'opacity 0.5s ease-in-out';