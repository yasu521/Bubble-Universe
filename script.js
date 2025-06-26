class BubbleUniverse {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.spheres = [];
        this.mouse = { x: 0, y: 0 };
        this.ripples = [];
        this.time = 0;
        this.fps = 0;
        this.lastTime = 0;
        this.frameCount = 0;
        
        // Colors inspired by teamLab's palette
        this.colors = [
            '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57',
            '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43',
            '#10ac84', '#ee5a24', '#0abde3', '#006ba6', '#f368e0',
            '#3742fa', '#2f3542', '#ff3838', '#ff9500', '#ffdd59',
            '#c44569', '#f8b500', '#786fa6', '#f19066', '#778beb',
            '#e77f67', '#cf6679', '#f8b500', '#4b7bec', '#a55eea',
            '#26de81', '#fc5c65', '#fed330', '#45aaf2', '#fd79a8',
            '#fdcb6e', '#6c5ce7', '#74b9ff', '#00b894', '#e17055',
            '#81ecec', '#fab1a0', '#ff7675', '#00cec9', '#55a3ff'
        ];
        
        this.init();
    }
    
    init() {
        this.resize();
        this.createSpheres();
        this.setupEventListeners();
        this.animate();
        
        // Hide title after 3 seconds
        setTimeout(() => {
            document.getElementById('title').classList.add('fade-out');
        }, 3000);
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    createSpheres() {
        const count = Math.min(300, Math.floor((this.canvas.width * this.canvas.height) / 5000));
        
        for (let i = 0; i < count; i++) {
            this.spheres.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                z: Math.random() * 1000 + 100, // Depth for 3D effect
                radius: Math.random() * 15 + 5,
                color: this.colors[Math.floor(Math.random() * this.colors.length)],
                originalColor: this.colors[Math.floor(Math.random() * this.colors.length)],
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                vz: (Math.random() - 0.5) * 0.5,
                phase: Math.random() * Math.PI * 2,
                pulseSpeed: 0.02 + Math.random() * 0.03,
                glowIntensity: 0.5 + Math.random() * 0.5,
                interactionRadius: 100 + Math.random() * 50
            });
        }
        
        document.getElementById('sphere-count').textContent = this.spheres.length;
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => this.resize());
        
        this.canvas.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
        
        this.canvas.addEventListener('click', (e) => {
            this.createRipple(e.clientX, e.clientY);
        });
        
        // Touch support
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.mouse.x = touch.clientX;
            this.mouse.y = touch.clientY;
        });
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.createRipple(touch.clientX, touch.clientY);
        });
    }
    
    createRipple(x, y) {
        this.ripples.push({
            x: x,
            y: y,
            radius: 0,
            maxRadius: 200,
            opacity: 1,
            color: this.colors[Math.floor(Math.random() * this.colors.length)]
        });
    }
    
    updateSpheres() {
        this.spheres.forEach(sphere => {
            // Basic movement
            sphere.x += sphere.vx;
            sphere.y += sphere.vy;
            sphere.z += sphere.vz;
            
            // Boundary wrapping
            if (sphere.x < -sphere.radius) sphere.x = this.canvas.width + sphere.radius;
            if (sphere.x > this.canvas.width + sphere.radius) sphere.x = -sphere.radius;
            if (sphere.y < -sphere.radius) sphere.y = this.canvas.height + sphere.radius;
            if (sphere.y > this.canvas.height + sphere.radius) sphere.y = -sphere.radius;
            if (sphere.z < 50) sphere.z = 1000;
            if (sphere.z > 1000) sphere.z = 50;
            
            // Pulsing effect
            sphere.phase += sphere.pulseSpeed;
            
            // Mouse interaction
            const dx = this.mouse.x - sphere.x;
            const dy = this.mouse.y - sphere.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < sphere.interactionRadius) {
                const force = (sphere.interactionRadius - distance) / sphere.interactionRadius;
                sphere.vx += dx * force * 0.001;
                sphere.vy += dy * force * 0.001;
                sphere.glowIntensity = Math.min(2, sphere.glowIntensity + force * 0.1);
                
                // Color shift on interaction
                if (force > 0.5) {
                    sphere.color = '#ffffff';
                }
            } else {
                sphere.glowIntensity = Math.max(0.5, sphere.glowIntensity - 0.02);
                sphere.color = sphere.originalColor;
            }
            
            // Velocity damping
            sphere.vx *= 0.99;
            sphere.vy *= 0.99;
        });
    }
    
    updateRipples() {
        this.ripples = this.ripples.filter(ripple => {
            ripple.radius += 3;
            ripple.opacity = 1 - (ripple.radius / ripple.maxRadius);
            return ripple.radius < ripple.maxRadius;
        });
    }
    
    drawSphere(sphere) {
        const scale = 1000 / (1000 + sphere.z);
        const x = sphere.x;
        const y = sphere.y;
        const radius = sphere.radius * scale * (1 + Math.sin(sphere.phase) * 0.2);
        
        if (radius < 1) return;
        
        // Create gradient for glow effect
        const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius * 2);
        const alpha = Math.min(255, Math.max(0, Math.floor(sphere.glowIntensity * 255))).toString(16).padStart(2, '0');
        gradient.addColorStop(0, sphere.color + alpha);
        gradient.addColorStop(0.7, sphere.color + '40');
        gradient.addColorStop(1, sphere.color + '00');
        
        // Draw glow
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw core
        this.ctx.fillStyle = sphere.color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius * 0.6, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawRipple(ripple) {
        this.ctx.strokeStyle = ripple.color + Math.floor(ripple.opacity * 100).toString(16).padStart(2, '0');
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        this.ctx.stroke();
    }
    
    calculateFPS() {
        this.frameCount++;
        const currentTime = performance.now();
        
        if (currentTime - this.lastTime >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
            this.frameCount = 0;
            this.lastTime = currentTime;
            document.getElementById('fps').textContent = this.fps;
        }
    }
    
    animate() {
        this.time += 0.016;
        
        // Clear canvas with slight trail effect
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update and draw
        this.updateSpheres();
        this.updateRipples();
        
        // Sort spheres by depth for proper rendering
        this.spheres.sort((a, b) => b.z - a.z);
        
        // Draw spheres
        this.spheres.forEach(sphere => this.drawSphere(sphere));
        
        // Draw ripples
        this.ripples.forEach(ripple => this.drawRipple(ripple));
        
        this.calculateFPS();
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize when page loads
window.addEventListener('DOMContentLoaded', () => {
    new BubbleUniverse();
});
