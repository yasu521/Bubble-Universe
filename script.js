class BubbleUniverse {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.init();
    }
    
    async init() {
        try {
            console.log('Loading Three.js...');
            
            // Import Three.js
            const THREE = await import('https://unpkg.com/three@0.158.0/build/three.module.js');
            this.THREE = THREE;
            
            console.log('Three.js loaded successfully');
            
            // Initialize basic scene
            this.scene = new this.THREE.Scene();
            this.camera = new this.THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            this.renderer = new this.THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
            
            this.setupRenderer();
            this.setupCamera();
            this.setupLighting();
            this.createSpheres();
            this.setupEventListeners();
            this.animate();
            
            // Hide title after 3 seconds
            setTimeout(() => {
                const title = document.getElementById('title');
                if (title) title.classList.add('fade-out');
            }, 3000);
            
            console.log('BubbleUniverse initialized successfully!');
            
        } catch (error) {
            console.error('Failed to initialize BubbleUniverse:', error);
            // Fallback: show error message
            const title = document.getElementById('title');
            if (title) {
                title.innerHTML = '<h1>Error Loading</h1><p>Failed to load Three.js. Please refresh the page.</p>';
            }
        }
    }
    
    setupRenderer() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.scene.background = new this.THREE.Color(0x000011);
    }
    
    setupCamera() {
        this.camera.position.z = 50;
    }
    
    setupLighting() {
        // Ambient light
        const ambientLight = new this.THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);
        
        // Directional light
        const directionalLight = new this.THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        this.scene.add(directionalLight);
    }
    
    createSpheres() {
        this.spheres = [];
        const geometry = new this.THREE.SphereGeometry(1, 16, 16);
        
        // Colors for spheres
        const colors = [
            0xff6b6b, 0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xfeca57,
            0xff9ff3, 0x54a0ff, 0x5f27cd, 0x00d2d3, 0xff9f43
        ];
        
        // Create 50 spheres
        for (let i = 0; i < 50; i++) {
            const color = colors[i % colors.length];
            const material = new this.THREE.MeshPhongMaterial({
                color: color,
                transparent: true,
                opacity: 0.8,
                emissive: color,
                emissiveIntensity: 0.2
            });
            
            const sphere = new this.THREE.Mesh(geometry, material);
            
            // Random position
            sphere.position.x = (Math.random() - 0.5) * 80;
            sphere.position.y = (Math.random() - 0.5) * 80;
            sphere.position.z = (Math.random() - 0.5) * 80;
            
            // Random scale
            const scale = 0.5 + Math.random() * 1.5;
            sphere.scale.setScalar(scale);
            
            // Add velocity for animation
            sphere.userData = {
                velocity: new this.THREE.Vector3(
                    (Math.random() - 0.5) * 0.02,
                    (Math.random() - 0.5) * 0.02,
                    (Math.random() - 0.5) * 0.02
                ),
                originalScale: scale,
                phase: Math.random() * Math.PI * 2
            };
            
            this.scene.add(sphere);
            this.spheres.push(sphere);
        }
        
        // Update sphere count display
        const sphereCountElement = document.getElementById('sphere-count');
        if (sphereCountElement) {
            sphereCountElement.textContent = this.spheres.length;
        }
        
        console.log(`Created ${this.spheres.length} spheres`);
    }
    
    setupEventListeners() {
        // Resize handler
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
        
        // Mouse interaction
        this.canvas.addEventListener('click', (event) => {
            // Simple click effect - make spheres pulse
            this.spheres.forEach(sphere => {
                sphere.userData.phase = 0; // Reset pulse
            });
        });
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const time = Date.now() * 0.001;
        
        // Animate spheres
        this.spheres.forEach((sphere, index) => {
            // Move spheres
            sphere.position.add(sphere.userData.velocity);
            
            // Boundary wrapping
            if (Math.abs(sphere.position.x) > 40) {
                sphere.userData.velocity.x *= -1;
            }
            if (Math.abs(sphere.position.y) > 40) {
                sphere.userData.velocity.y *= -1;
            }
            if (Math.abs(sphere.position.z) > 40) {
                sphere.userData.velocity.z *= -1;
            }
            
            // Pulsing effect
            sphere.userData.phase += 0.02;
            const pulse = 1 + Math.sin(sphere.userData.phase) * 0.1;
            sphere.scale.setScalar(sphere.userData.originalScale * pulse);
            
            // Rotation
            sphere.rotation.x += 0.01;
            sphere.rotation.y += 0.01;
        });
        
        // Camera movement
        this.camera.position.x = Math.cos(time * 0.1) * 20;
        this.camera.position.y = Math.sin(time * 0.15) * 10;
        this.camera.lookAt(this.scene.position);
        
        // Render
        this.renderer.render(this.scene, this.camera);
        
        // Update FPS (simple version)
        if (Math.floor(time) !== this.lastSecond) {
            this.lastSecond = Math.floor(time);
            const fpsElement = document.getElementById('fps');
            if (fpsElement) {
                fpsElement.textContent = '60'; // Approximate
            }
        }
    }
}

// Initialize when page loads
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, creating BubbleUniverse...');
    new BubbleUniverse();
});
