// Artemis 2 Mini Game
class ArtemisGame {
    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    constructor() {
        // Detekcja mobile
        if (this.isMobileDevice()) {
            document.body.innerHTML = '<div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; font-family: Arial, sans-serif; text-align: center;"><h1 style="font-size: 2.5em; margin-bottom: 20px;">❌ Gra niedostępna na mobilnych</h1><p style="font-size: 1.2em; color: #cbd5e1;">Artemis 2 wymaga klawiatury (WSAD). Spróbuj na komputerze!</p></div>';
            return;
        }
        
        this.canvas = document.getElementById('artemis-canvas');
        if (!this.canvas) {
            console.error('Canvas not found');
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        
        this.gameState = 'idle'; // idle, playing, paused, gameOver
        this.score = 0;
        this.lives = 3;
        this.fuel = 100;
        this.maxFuel = 100;
        this.asteroidSpawnRate = 0;
        this.difficulty = 1.0; // Trudność (1.0 = normal)
        this.maxScore = 500; // Maksymalny cel
        
        // Statek kosmiczny - SLS rakieta
        this.ship = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 120,
            width: 20,
            height: 100,
            speed: 5,
            velocityY: 0
        };
        
        this.keys = {};
        this.particles = [];
        this.fuel_items = [];
        this.asteroids = [];
        this.scrollOffset = 0; // Dla parallax tła
        
        console.log('ArtemisGame initialized with gameState:', this.gameState);
        
        // Hide game over screen on init
        const gameOverEl = document.getElementById('game-over');
        if (gameOverEl) gameOverEl.hidden = true;
        
        this.setupEventListeners();
        this.updateUI();
        this.draw();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (e.key === ' ') e.preventDefault();
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        const startBtn = document.getElementById('start-btn');
        const pauseBtn = document.getElementById('pause-btn');
        const restartBtn = document.getElementById('restart-btn');
        
        if (startBtn) startBtn.addEventListener('click', () => this.start());
        if (pauseBtn) pauseBtn.addEventListener('click', () => this.togglePause());
        if (restartBtn) restartBtn.addEventListener('click', () => this.restart());
    }
    
    start() {
        console.log('Start clicked, gameState:', this.gameState);
        if (this.gameState === 'idle') {
            this.gameState = 'playing';
            const startBtn = document.getElementById('start-btn');
            const pauseBtn = document.getElementById('pause-btn');
            const gameOverEl = document.getElementById('game-over');
            
            if (startBtn) startBtn.disabled = true;
            if (pauseBtn) pauseBtn.disabled = false;
            if (gameOverEl) gameOverEl.hidden = true;
            
            console.log('Game started, gameState changed to:', this.gameState);
            this.spawnAsteroid();
        }
    }
    
    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            const pauseBtn = document.getElementById('pause-btn');
            if (pauseBtn) pauseBtn.textContent = 'Wznów';
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            const pauseBtn = document.getElementById('pause-btn');
            if (pauseBtn) pauseBtn.textContent = 'Pauza';
        }
    }
    
    restart() {
        this.score = 0;
        this.lives = 3;
        this.fuel = this.maxFuel;
        this.ship.x = this.canvas.width / 2;
        this.particles = [];
        this.fuel_items = [];
        this.asteroids = [];
        this.gameState = 'idle';
        
        const startBtn = document.getElementById('start-btn');
        const pauseBtn = document.getElementById('pause-btn');
        const gameOverEl = document.getElementById('game-over');
        
        if (startBtn) startBtn.disabled = false;
        if (pauseBtn) {
            pauseBtn.disabled = true;
            pauseBtn.textContent = 'Pauza';
        }
        if (gameOverEl) gameOverEl.hidden = true;
        
        this.updateUI();
    }
    
    spawnAsteroid() {
        if (this.gameState !== 'playing') return;
        
        // Asteroidy rosną w wielkości i szybkości wraz z punktami
        const sizeMultiplier = 1 + (this.score / 500) * 0.4; // Max +40% wielkości
        const speedMultiplier = 1 + (this.score / 500) * 0.6; // Max +60% szybkości
        
        const asteroid = {
            x: Math.random() * (this.canvas.width - 30),
            y: -30,
            width: 30 * sizeMultiplier,
            height: 30 * sizeMultiplier,
            speed: (2 + Math.random() * 2) * speedMultiplier,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: Math.random() * 0.1 - 0.05,
            type: Math.floor(Math.random() * 3) // 3 różne typy asteroidów
        };
        this.asteroids.push(asteroid);
    }
    
    spawnFuel() {
        if (Math.random() < 0.015) {
            const fuel = {
                x: Math.random() * (this.canvas.width - 20),
                y: -20,
                width: 20,
                height: 20,
                speed: 2,
                bobbing: 0
            };
            this.fuel_items.push(fuel);
        }
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        // Ruch statku - lewo/prawo (tylko WSAD)
        const moveLeft = this.keys['a'];
        const moveRight = this.keys['d'];
        
        if (moveLeft && this.ship.x > 0) {
            this.ship.x -= this.ship.speed;
        }
        if (moveRight && this.ship.x < this.canvas.width - this.ship.width) {
            this.ship.x += this.ship.speed;
        }
        
        // Ruch statku - góra/dół (tylko WSAD)
        const moveUp = this.keys['w'];
        const moveDown = this.keys['s'];
        
        if (moveUp && this.ship.y > 50) {
            this.ship.y -= this.ship.speed;
            this.scrollOffset += this.ship.speed * 0.5;
        }
        if (moveDown && this.ship.y < this.canvas.height - this.ship.height - 20) {
            this.ship.y += this.ship.speed;
            this.scrollOffset -= this.ship.speed * 0.5;
        }
        
        // Zmniejszanie paliwa - zwiększa się trudność
        const fuelDrain = 0.08 + (this.score / 500) * 0.06; // Od 0.08 do 0.14
        this.fuel = Math.max(0, this.fuel - fuelDrain);
        
        // Spawning asteroids - zwiększa się trudność
        this.asteroidSpawnRate++;
        const spawnThreshold = Math.max(15, 30 - Math.floor(this.score / 100)); // Im więcej punktów, tym częściej
        if (this.asteroidSpawnRate > spawnThreshold) {
            this.spawnAsteroid();
            this.asteroidSpawnRate = 0;
        }
        
        this.spawnFuel();
        
        // Update asteroids
        this.asteroids = this.asteroids.filter(a => {
            a.y += a.speed;
            a.rotation += a.rotationSpeed;
            
            // Kolizja z graczem
            if (this.checkCollision(this.ship, a)) {
                this.lives--;
                this.createExplosion(a.x, a.y);
                
                if (this.lives <= 0) {
                    this.gameOver(false);
                    return false;
                }
                return false;
            }
            
            return a.y < this.canvas.height;
        });
        
        // Update fuel items
        this.fuel_items = this.fuel_items.filter(f => {
            f.y += f.speed;
            f.bobbing += 0.05;
            
            // Kolizja z graczem
            if (this.checkCollision(this.ship, f)) {
                this.fuel = Math.min(this.maxFuel, this.fuel + 30);
                this.score += 10;
                this.createExplosion(f.x, f.y, 'yellow');
                return false;
            }
            
            return f.y < this.canvas.height;
        });
        
        // Game Over z braku paliwa
        if (this.fuel <= 0) {
            this.gameOver(false);
            return;
        }
        
        // Victory check
        if (this.score >= this.maxScore) {
            this.gameOver(true);
            return;
        }
        
        // Update particles
        this.particles = this.particles.filter(p => {
            p.life -= 0.02;
            return p.life > 0;
        });
        
        this.updateUI();
    }
    
    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    createExplosion(x, y, color = 'red') {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 1,
                color: color
            });
        }
    }
    
    updateUI() {
        const scoreEl = document.getElementById('score');
        const livesEl = document.getElementById('lives');
        const fuelTextEl = document.getElementById('fuel-text');
        const fuelAmountEl = document.getElementById('fuel-amount');
        const goalEl = document.getElementById('goal');
        
        if (scoreEl) scoreEl.textContent = this.score;
        if (livesEl) livesEl.textContent = `${this.lives} ❤️`;
        if (fuelTextEl) fuelTextEl.textContent = `${Math.round(this.fuel)}%`;
        if (fuelAmountEl) fuelAmountEl.style.width = `${Math.max(0, this.fuel)}%`;
        if (goalEl) goalEl.textContent = `${this.maxScore - this.score} pkt`;
    }
    
    gameOver(victory) {
        console.log('Game Over called, victory:', victory);
        this.gameState = 'gameOver';
        const pauseBtn = document.getElementById('pause-btn');
        const gameOverEl = document.getElementById('game-over');
        const titleEl = document.getElementById('game-over-title');
        const messageEl = document.getElementById('game-over-message');
        const finalScoreEl = document.getElementById('final-score');
        
        if (pauseBtn) pauseBtn.disabled = true;
        if (gameOverEl) gameOverEl.hidden = false;
        
        if (victory) {
            if (titleEl) titleEl.textContent = '🎉 Sukces Misji!';
            if (messageEl) messageEl.textContent = 'Wysłałeś Artemis 2 na Księżyc!';
        } else {
            if (titleEl) titleEl.textContent = '❌ Misja Nie Powiodła Się';
            if (messageEl) messageEl.textContent = 'Spróbuj jeszcze raz!';
        }
        
        if (finalScoreEl) finalScoreEl.textContent = this.score;
    }
    
    draw() {
        // Clear canvas with gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, 'rgba(15, 23, 42, 0.98)');
        gradient.addColorStop(1, 'rgba(30, 41, 59, 0.98)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Parallax starfield - warstwy gwiazdek
        this.drawParallaxStars(150, 0.3);
        this.drawParallaxStars(100, 0.6);
        this.drawParallaxStars(50, 1.0);
        
        // Draw asteroids - nowa grafika
        this.asteroids.forEach(a => {
            this.ctx.save();
            this.ctx.translate(a.x + a.width / 2, a.y + a.height / 2);
            this.ctx.rotate(a.rotation);
            a.rotation += a.rotationSpeed;
            
            // Glow effect - pomarańczowy
            this.ctx.fillStyle = 'rgba(234, 88, 12, 0.3)';
            this.ctx.beginPath();
            this.ctx.arc(0, 0, a.width / 1.4, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Asteroid - skalisty wygląd z bumpami
            const centerGradient = this.ctx.createRadialGradient(-3, -3, 0, 0, 0, a.width);
            centerGradient.addColorStop(0, '#8b7355');
            centerGradient.addColorStop(0.5, '#5c4033');
            centerGradient.addColorStop(1, '#3e2723');
            this.ctx.fillStyle = centerGradient;
            
            // Nieregularny kształt asteroidy - bumpki
            this.ctx.beginPath();
            const bumps = 6;
            const radius = a.width / 2;
            for (let i = 0; i < bumps; i++) {
                const angle = (i / bumps) * Math.PI * 2;
                const bumpRadius = radius + Math.sin(Date.now() * 0.003 + i) * (radius * 0.2);
                const x = Math.cos(angle) * bumpRadius;
                const y = Math.sin(angle) * bumpRadius;
                if (i === 0) this.ctx.moveTo(x, y);
                else this.ctx.lineTo(x, y);
            }
            this.ctx.closePath();
            this.ctx.fill();
            
            // Kratery na asteroidy
            for (let i = 0; i < 3; i++) {
                const craterX = Math.cos(i * Math.PI / 3) * (a.width * 0.3);
                const craterY = Math.sin(i * Math.PI / 3) * (a.width * 0.3);
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                this.ctx.beginPath();
                this.ctx.arc(craterX, craterY, a.width * 0.08, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            // Świetne krawędzie - glow
            this.ctx.strokeStyle = 'rgba(255, 200, 100, 0.5)';
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            const bumps2 = 6;
            for (let i = 0; i < bumps2; i++) {
                const angle = (i / bumps2) * Math.PI * 2;
                const bumpRadius = radius + Math.sin(Date.now() * 0.003 + i) * (radius * 0.2);
                const x = Math.cos(angle) * bumpRadius;
                const y = Math.sin(angle) * bumpRadius;
                if (i === 0) this.ctx.moveTo(x, y);
                else this.ctx.lineTo(x, y);
            }
            this.ctx.closePath();
            this.ctx.stroke();
            
            this.ctx.restore();
        });
        
        // Draw fuel items with pulse animation
        this.fuel_items.forEach(f => {
            this.ctx.save();
            
            const pulse = Math.sin(Date.now() * 0.005 + f.y) * 0.3 + 0.7;
            this.ctx.globalAlpha = pulse;
            
            // Glow
            this.ctx.fillStyle = 'rgba(251, 191, 36, 0.4)';
            this.ctx.beginPath();
            this.ctx.arc(f.x + f.width / 2, f.y + f.height / 2, f.width, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Fuel can gradient
            const fuelGradient = this.ctx.createRadialGradient(f.x + 5, f.y + 5, 2, f.x + f.width / 2, f.y + f.height / 2, f.width / 1.5);
            fuelGradient.addColorStop(0, '#fcd34d');
            fuelGradient.addColorStop(1, '#f59e0b');
            this.ctx.fillStyle = fuelGradient;
            this.ctx.beginPath();
            this.ctx.arc(f.x + f.width / 2, f.y + f.height / 2, f.width / 2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Fuel outline
            this.ctx.strokeStyle = '#d97706';
            this.ctx.lineWidth = 1.5;
            this.ctx.stroke();
            
            this.ctx.restore();
        });
        
        // Draw NASA SLS rocket
        this.drawRocket();
        
        // Draw particles with better effects
        this.particles.forEach(p => {
            const colorStr = p.color === 'yellow' ? '251, 191, 36' : '239, 68, 68';
            
            // Glow
            this.ctx.fillStyle = `rgba(${colorStr}, ${p.life * 0.3})`;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Particle
            this.ctx.fillStyle = `rgba(${colorStr}, ${p.life})`;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
            
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2; // gravity
        });
        
        // Update and draw again - only if playing
        if (this.gameState === 'playing') {
            this.update();
        }
        requestAnimationFrame(() => this.draw());
    }
    
    drawParallaxStars(count, speed) {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        for (let i = 0; i < count; i++) {
            const x = (i * 79 + Math.sin(Date.now() * 0.0001 + i) * 2) % this.canvas.width;
            const y = ((i * 113 + this.scrollOffset * speed) % (this.canvas.height + 100));
            const size = 1 + Math.sin(Date.now() * 0.0005 + i) * 0.5;
            this.ctx.fillRect(x, y, size, size);
        }
    }
    
    drawRocket() {
        this.ctx.save();
        
        const x = this.ship.x;
        const y = this.ship.y;
        const w = this.ship.width;
        const h = this.ship.height;
        
        // Rocket glow - niebieskie świecenie
        const glowGradient = this.ctx.createRadialGradient(x + w / 2, y + h / 2, 0, x + w / 2, y + h / 2, 40);
        glowGradient.addColorStop(0, 'rgba(59, 130, 246, 0.6)');
        glowGradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
        this.ctx.fillStyle = glowGradient;
        this.ctx.fillRect(x - 20, y - 20, w + 40, h + 40);
        
        // MAIN BODY - Gradient bardzo ładny
        const bodyGradient = this.ctx.createLinearGradient(x, y + 30, x + w, y + 30);
        bodyGradient.addColorStop(0, '#0f172a');
        bodyGradient.addColorStop(0.3, '#1e40af');
        bodyGradient.addColorStop(0.5, '#3b82f6');
        bodyGradient.addColorStop(0.7, '#1e40af');
        bodyGradient.addColorStop(1, '#0f172a');
        this.ctx.fillStyle = bodyGradient;
        this.ctx.beginPath();
        this.ctx.moveTo(x + 3, y + 25);
        this.ctx.lineTo(x + w - 3, y + 25);
        this.ctx.lineTo(x + w - 3, y + h - 25);
        this.ctx.lineTo(x + 3, y + h - 25);
        this.ctx.closePath();
        this.ctx.fill();
        
        // External tank - biały pasek w środku
        this.ctx.fillStyle = 'rgba(248, 248, 248, 0.3)';
        this.ctx.fillRect(x + w / 2 - 1.5, y + 25, 3, h - 50);
        
        // Nose cone - ostry, czerwony
        this.ctx.fillStyle = '#dc2626';
        this.ctx.beginPath();
        this.ctx.moveTo(x + w / 2, y);
        this.ctx.lineTo(x - 1, y + 25);
        this.ctx.lineTo(x + w + 1, y + 25);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Nose highlight - biały pasek
        this.ctx.strokeStyle = '#fca5a5';
        this.ctx.lineWidth = 0.8;
        this.ctx.beginPath();
        this.ctx.moveTo(x + w / 2, y + 2);
        this.ctx.lineTo(x + w / 2, y + 25);
        this.ctx.stroke();
        
        // Left booster (Solid Rocket Booster)
        const boosterL_x = x - 8;
        const boosterGradientL = this.ctx.createLinearGradient(boosterL_x, y + 35, boosterL_x + 5, y + 35);
        boosterGradientL.addColorStop(0, '#374151');
        boosterGradientL.addColorStop(1, '#1f2937');
        this.ctx.fillStyle = boosterGradientL;
        this.ctx.fillRect(boosterL_x, y + 35, 5, h - 60);
        
        // Right booster
        const boosterR_x = x + w + 3;
        const boosterGradientR = this.ctx.createLinearGradient(boosterR_x, y + 35, boosterR_x + 5, y + 35);
        boosterGradientR.addColorStop(0, '#1f2937');
        boosterGradientR.addColorStop(1, '#374151');
        this.ctx.fillStyle = boosterGradientR;
        this.ctx.fillRect(boosterR_x, y + 35, 5, h - 60);
        
        // Left fin - niebieskie
        this.ctx.fillStyle = '#0284c7';
        this.ctx.beginPath();
        this.ctx.moveTo(x + 1, y + h - 35);
        this.ctx.lineTo(x - 10, y + h - 20);
        this.ctx.lineTo(x + 2, y + h - 25);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Left fin highlight
        this.ctx.strokeStyle = '#06b6d4';
        this.ctx.lineWidth = 0.5;
        this.ctx.stroke();
        
        // Right fin
        this.ctx.fillStyle = '#0284c7';
        this.ctx.beginPath();
        this.ctx.moveTo(x + w - 1, y + h - 35);
        this.ctx.lineTo(x + w + 10, y + h - 20);
        this.ctx.lineTo(x + w - 2, y + h - 25);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Right fin highlight
        this.ctx.strokeStyle = '#06b6d4';
        this.ctx.lineWidth = 0.5;
        this.ctx.stroke();
        
        // Main engines - RS-25
        const enginePositions = [
            { x: x + 4, name: 'main1' },
            { x: x + w - 6, name: 'main2' }
        ];
        
        enginePositions.forEach((engine, idx) => {
            const engX = engine.x;
            const engY = y + h;
            
            // Engine nozzle - metaliczny
            const nozzleGradient = this.ctx.createRadialGradient(engX, engY - 5, 1, engX, engY, 3.5);
            nozzleGradient.addColorStop(0, '#374151');
            nozzleGradient.addColorStop(1, '#111827');
            this.ctx.fillStyle = nozzleGradient;
            this.ctx.beginPath();
            this.ctx.arc(engX, engY - 5, 3.5, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Flame
            if (this.gameState === 'playing') {
                const flameLength = 18 + Math.random() * 15;
                const flameWidth = 2.5 + Math.random() * 1;
                
                // Inner flame - white/yellow
                const flameGradient1 = this.ctx.createLinearGradient(engX, engY - 5, engX, engY - 5 + flameLength);
                flameGradient1.addColorStop(0, '#fef3c7');
                flameGradient1.addColorStop(0.4, '#fbbf24');
                flameGradient1.addColorStop(1, 'rgba(251, 191, 36, 0)');
                
                this.ctx.fillStyle = flameGradient1;
                this.ctx.beginPath();
                this.ctx.moveTo(engX - flameWidth, engY - 5);
                this.ctx.lineTo(engX + flameWidth, engY - 5);
                this.ctx.lineTo(engX + (Math.random() - 0.5) * 2, engY - 5 + flameLength);
                this.ctx.closePath();
                this.ctx.fill();
                
                // Outer flame - orange/red
                const flameGradient2 = this.ctx.createLinearGradient(engX, engY - 5, engX, engY - 5 + flameLength * 0.7);
                flameGradient2.addColorStop(0, '#ff8c42');
                flameGradient2.addColorStop(1, 'rgba(255, 107, 53, 0)');
                
                this.ctx.fillStyle = flameGradient2;
                this.ctx.beginPath();
                this.ctx.moveTo(engX - flameWidth * 1.5, engY - 5);
                this.ctx.lineTo(engX + flameWidth * 1.5, engY - 5);
                this.ctx.lineTo(engX + (Math.random() - 0.5) * 3, engY - 5 + flameLength * 0.7);
                this.ctx.closePath();
                this.ctx.fill();
            }
        });
        
        // Booster engines (SRB flame)
        if (this.gameState === 'playing') {
            [boosterL_x + 2.5, boosterR_x + 2.5].forEach(bx => {
                const flameLength = 15 + Math.random() * 12;
                const flameGradient = this.ctx.createLinearGradient(bx, y + h - 25, bx, y + h - 25 + flameLength);
                flameGradient.addColorStop(0, '#fbbf24');
                flameGradient.addColorStop(0.6, '#f97316');
                flameGradient.addColorStop(1, 'rgba(249, 115, 22, 0)');
                
                this.ctx.fillStyle = flameGradient;
                this.ctx.beginPath();
                this.ctx.moveTo(bx - 1.5, y + h - 25);
                this.ctx.lineTo(bx + 1.5, y + h - 25);
                this.ctx.lineTo(bx + (Math.random() - 0.5) * 2, y + h - 25 + flameLength);
                this.ctx.closePath();
                this.ctx.fill();
            });
        }
        
        // Body highlights - centrale pasek
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 0.8;
        this.ctx.beginPath();
        this.ctx.moveTo(x + w / 2, y + 25);
        this.ctx.lineTo(x + w / 2, y + h - 25);
        this.ctx.stroke();
        
        this.ctx.restore();
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('artemis-canvas')) {
        new ArtemisGame();
    }
});
