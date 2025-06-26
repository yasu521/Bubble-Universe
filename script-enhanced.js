import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';
import { EffectComposer } from 'https://unpkg.com/three@0.158.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://unpkg.com/three@0.158.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://unpkg.com/three@0.158.0/examples/jsm/postprocessing/UnrealBloomPass.js';
import { Reflector } from 'https://unpkg.com/three@0.158.0/examples/jsm/objects/Reflector.js';

class EnhancedBubbleUniverse {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
        this.composer = null;
        
        // Raycaster for interaction
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.hoveredSphere = null;
        
        // Sphere system - Enhanced count
        this.sphereCount = 10;
        this.instancedMesh = null;
        this.sphereLights = [];
        this.sphereData = [];
        this.glowingCores = []; // Internal glowing objects
        
        // Ripple system
        this.ripples = [];
        this.rippleMeshes = [];
        
        // Animation
        this.time = 0;
        this.fps = 0;
        this.lastTime = 0;
        this.frameCount = 0;
        
        // Spatial configuration
        this.baseRadius = 60;
        this.tunnelLength = 400;
        this.maxRadiusMultiplier = 1.2;
        
        // Fog settings
        this.fogDensity = 0.0007;
        
        // Colors for lights - Extended palette
        this.colors = [
            0xff6b6b, 0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xfeca57,
            0xff9ff3, 0x54a0ff, 0x5f27cd, 0x00d2d3, 0xff9f43,
            0x10ac84, 0xee5a24, 0x0abde3, 0x006ba6, 0xf368e0,
            0x3742fa, 0x2f3542, 0xff3838, 0xff9500, 0xffdd59,
            0xc44569, 0xf8b500, 0x786fa6, 0xf19066, 0x778beb,
            0xe77f67, 0xcf6679, 0x4b7bec, 0xa55eea, 0x26de81,
            0xfc5c65, 0xfed330, 0x45aaf2, 0xfd79a8, 0xfdcb6e,
            0x6c5ce7, 0x74b9ff, 0x00b894, 0xe17055, 0x81ecec,
            0xfab1a0, 0xff7675, 0x00cec9, 0x55a3ff, 0xdda0dd,
            0x98fb98, 0xf0e68c, 0xdda0dd, 0x87ceeb, 0xffa07a
        ];
        
        // Mirrors
        this.mirrors = [];
        
        console.log('Enhanced BubbleUniverse initializing...');
        this.init();
    }
    
    async init() {
        try {
            console.log('Setting up renderer...');
            this.setupRenderer();
            
            console.log('Setting up camera...');
            this.setupCamera();
            
            console.log('Setting up lighting and fog...');
            this.setupLighting();
            this.setupFog();
            
            console.log('Creating mirrors...');
            this.createMirrors();
            
            console.log('Creating spheres...');
            this.createSpheres();
            
            console.log('Setting up post-processing...');
            this.setupPostProcessing();
            
            console.log('Setting up event listeners...');
            this.setupEventListeners();
            
            console.log('Starting animation...');
            this.animate();
            
            // Hide title after 4 seconds
            setTimeout(() => {
                const title = document.getElementById('title');
                if (title) title.classList.add('fade-out');
            }, 4000);
            
            console.log('Enhanced BubbleUniverse initialized successfully!');
        } catch (error) {
            console.error('Failed to initialize Enhanced BubbleUniverse:', error);
        }
    }
    
    setupRenderer() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.physicallyCorrectLights = true;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
    }
    
    setupCamera() {
        this.camera.position.set(0, 0, 150);
        this.camera.lookAt(0, 0, 0);
    }
    
    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(ambientLight);
        
        // Main directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
        directionalLight.position.set(100, 100, 100);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.1;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -200;
        directionalLight.shadow.camera.right = 200;
        directionalLight.shadow.camera.top = 200;
        directionalLight.shadow.camera.bottom = -200;
        this.scene.add(directionalLight);
        
        // Additional rim lighting
        const rimLight = new THREE.DirectionalLight(0x4ecdc4, 0.3);
        rimLight.position.set(-50, -50, -50);
        this.scene.add(rimLight);
    }
    
    setupFog() {
        this.scene.fog = new THREE.FogExp2(0x000011, this.fogDensity);
    }
    
    createMirrors() {
        const reflectorOptions = {
            clipBias: 0.003,
            textureWidth: 1024,
            textureHeight: 1024,
            color: 0x888888,
            multisample: 4
        };
        
        // Floor mirror
        const floorGeometry = new THREE.PlaneGeometry(500, 500);
        const floorMirror = new Reflector(floorGeometry, reflectorOptions);
        floorMirror.rotation.x = -Math.PI / 2;
        floorMirror.position.y = -80;
        this.scene.add(floorMirror);
        this.mirrors.push(floorMirror);
        
        // Left wall mirror
        const leftWallGeometry = new THREE.PlaneGeometry(500, 300);
        const leftWallMirror = new Reflector(leftWallGeometry, reflectorOptions);
        leftWallMirror.rotation.y = Math.PI / 2;
        leftWallMirror.position.x = -120;
        this.scene.add(leftWallMirror);
        this.mirrors.push(leftWallMirror);
        
        // Right wall mirror
        const rightWallGeometry = new THREE.PlaneGeometry(500, 300);
        const rightWallMirror = new Reflector(rightWallGeometry, reflectorOptions);
        rightWallMirror.rotation.y = -Math.PI / 2;
        rightWallMirror.position.x = 120;
        this.scene.add(rightWallMirror);
        this.mirrors.push(rightWallMirror);
        
        console.log('Mirrors created: floor and side walls');
    }
    
    generateSpherePosition(index) {
        // Z-axis (depth): tunnel direction with enhanced distribution
        const normalizedIndex = index / this.sphereCount;
        const z = (normalizedIndex * this.tunnelLength) - (this.tunnelLength / 2);
        
        // Depth-based radius expansion (distant spheres spread more)
        const depthRatio = Math.abs(z) / (this.tunnelLength / 2);
        const radiusMultiplier = 1 + (depthRatio * (this.maxRadiusMultiplier - 1));
        
        // Radial distribution with some randomness
        const angle = Math.random() * Math.PI * 2;
        const radiusRandom = Math.random() * 0.8 + 0.2; // 0.2 to 1.0
        const radius = this.baseRadius * radiusMultiplier * radiusRandom;
        
        return {
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
            z: z
        };
    }
    
    createSpheres() {
        // Create sphere geometry with higher detail
        const geometry = new THREE.SphereGeometry(1, 32, 32);
        
        // Enhanced glass material
        const material = new THREE.MeshPhysicalMaterial({
            transmission: 0.95,
            opacity: 0.2,
            transparent: true,
            thickness: 0.8,
            ior: 1.45,
            clearcoat: 1.0,
            clearcoatRoughness: 0.02,
            envMapIntensity: 1.5,
            side: THREE.DoubleSide,
            roughness: 0.05,
            metalness: 0.1
        });
        
        // Create instanced mesh
        this.instancedMesh = new THREE.InstancedMesh(geometry, material, this.sphereCount);
        this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.instancedMesh.castShadow = true;
        this.instancedMesh.receiveShadow = true;
        this.scene.add(this.instancedMesh);
        
        // Create glowing cores geometry
        const coreGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const coreMaterial = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0.8
        });
        
        this.glowingCores = new THREE.InstancedMesh(coreGeometry, coreMaterial, this.sphereCount);
        this.glowingCores.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.scene.add(this.glowingCores);
        
        // Initialize sphere data and lights
        const matrix = new THREE.Matrix4();
        const coreMatrix = new THREE.Matrix4();
        const color = new THREE.Color();
        
        for (let i = 0; i < this.sphereCount; i++) {
            const position = this.generateSpherePosition(i);
            
            // Random scale with size variation
            const scale = 0.8 + Math.random() * 2.5;
            
            // Set sphere matrix
            matrix.makeScale(scale, scale, scale);
            matrix.setPosition(position.x, position.y, position.z);
            this.instancedMesh.setMatrixAt(i, matrix);
            
            // Set core matrix (smaller than sphere)
            const coreScale = scale * 0.4;
            coreMatrix.makeScale(coreScale, coreScale, coreScale);
            coreMatrix.setPosition(position.x, position.y, position.z);
            this.glowingCores.setMatrixAt(i, coreMatrix);
            
            // Random color
            const colorHex = this.colors[Math.floor(Math.random() * this.colors.length)];
            color.setHex(colorHex);
            this.instancedMesh.setColorAt(i, color);
            this.glowingCores.setColorAt(i, color);
            
            // Create point light for each sphere
            const light = new THREE.PointLight(colorHex, 1.5, 15);
            light.position.set(position.x, position.y, position.z);
            this.scene.add(light);
            this.sphereLights.push(light);
            
            // Store sphere data
            this.sphereData.push({
                position: new THREE.Vector3(position.x, position.y, position.z),
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.15,
                    (Math.random() - 0.5) * 0.15,
                    (Math.random() - 0.5) * 0.08
                ),
                scale: scale,
                originalScale: scale,
                originalColor: colorHex,
                phase: Math.random() * Math.PI * 2,
                pulseSpeed: 0.015 + Math.random() * 0.025,
                lightIntensity: 1 + Math.random() * 1.5,
                originalIntensity: 1 + Math.random() * 1.5,
                isHovered: false,
                targetScale: scale,
                targetIntensity: 1 + Math.random() * 1.5,
                interactionRadius: 80 + Math.random() * 40
            });
        }
        
        this.instancedMesh.instanceMatrix.needsUpdate = true;
        this.glowingCores.instanceMatrix.needsUpdate = true;
        if (this.instancedMesh.instanceColor) {
            this.instancedMesh.instanceColor.needsUpdate = true;
        }
        if (this.glowingCores.instanceColor) {
            this.glowingCores.instanceColor.needsUpdate = true;
        }
        
        // Update sphere count display
        const sphereCountElement = document.getElementById('sphere-count');
        if (sphereCountElement) {
            sphereCountElement.textContent = this.sphereCount;
        }
    }
    
    setupPostProcessing() {
        this.composer = new EffectComposer(this.renderer);
        
        // Render pass
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);
        
        // Enhanced bloom pass
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1.8, // strength
            0.6, // radius
            0.7  // threshold
        );
        this.composer.addPass(bloomPass);
    }
    
    setupEventListeners() {
        // Resize handler
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Mouse events
        this.canvas.addEventListener('mousemove', (event) => this.onMouseMove(event));
        this.canvas.addEventListener('click', (event) => this.onMouseClick(event));
        
        // Touch events
        this.canvas.addEventListener('touchmove', (event) => {
            event.preventDefault();
            const touch = event.touches[0];
            this.onMouseMove(touch);
        });
        
        this.canvas.addEventListener('touchstart', (event) => {
            event.preventDefault();
            const touch = event.touches[0];
            this.onMouseClick(touch);
        });
        
        // Control sliders
        const fogSlider = document.getElementById('fog-slider');
        const sphereSlider = document.getElementById('sphere-slider');
        
        if (fogSlider) {
            fogSlider.addEventListener('input', (e) => {
                this.fogDensity = parseFloat(e.target.value);
                this.scene.fog.density = this.fogDensity;
                document.getElementById('fog-density').textContent = this.fogDensity.toFixed(4);
            });
        }
        
        if (sphereSlider) {
            sphereSlider.addEventListener('input', (e) => {
                const newCount = parseInt(e.target.value);
                if (newCount !== this.sphereCount) {
                    this.updateSphereCount(newCount);
                }
            });
        }
    }
    
    updateSphereCount(newCount) {
        // This is a simplified version - in a full implementation,
        // you'd want to properly manage the instanced meshes
        console.log(`Sphere count change requested: ${this.sphereCount} -> ${newCount}`);
        // For now, just update the display
        document.getElementById('sphere-count').textContent = newCount;
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
    }
    
    onMouseMove(event) {
        // Update mouse coordinates
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Perform raycasting (limited for performance)
        if (this.frameCount % 3 === 0) {
            this.performRaycast();
        }
        
        // Mouse interaction with spheres
        this.updateMouseInteraction(event.clientX, event.clientY);
    }
    
    updateMouseInteraction(mouseX, mouseY) {
        // Convert screen coordinates to world coordinates for interaction
        const vector = new THREE.Vector3(
            (mouseX / window.innerWidth) * 2 - 1,
            -(mouseY / window.innerHeight) * 2 + 1,
            0.5
        );
        vector.unproject(this.camera);
        
        const direction = vector.sub(this.camera.position).normalize();
        const distance = -this.camera.position.z / direction.z;
        const pos = this.camera.position.clone().add(direction.multiplyScalar(distance));
        
        // Interact with nearby spheres
        for (let i = 0; i < this.sphereData.length; i++) {
            const sphereData = this.sphereData[i];
            const dx = pos.x - sphereData.position.x;
            const dy = pos.y - sphereData.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < sphereData.interactionRadius) {
                const force = (sphereData.interactionRadius - distance) / sphereData.interactionRadius;
                
                // Apply attraction force
                sphereData.velocity.x += dx * force * 0.002;
                sphereData.velocity.y += dy * force * 0.002;
                
                // Enhance glow
                sphereData.targetIntensity = Math.min(3, sphereData.originalIntensity + force * 2);
                sphereData.targetScale = Math.min(sphereData.originalScale * 1.3, sphereData.originalScale + force * 0.5);
            } else {
                // Return to normal
                sphereData.targetIntensity = sphereData.originalIntensity;
                sphereData.targetScale = sphereData.originalScale;
            }
        }
    }
    
    onMouseClick(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Create ripple effect
        this.createRipple(event.clientX, event.clientY);
        
        this.performRaycast();
        
        if (this.hoveredSphere !== null) {
            const sphereData = this.sphereData[this.hoveredSphere];
            
            // Animate clicked sphere
            sphereData.targetScale = sphereData.originalScale * 2;
            sphereData.targetIntensity = sphereData.originalIntensity * 3;
            
            // Change color
            const newColor = this.colors[Math.floor(Math.random() * this.colors.length)];
            this.sphereLights[this.hoveredSphere].color.setHex(newColor);
            
            const color = new THREE.Color();
            color.setHex(newColor);
            this.instancedMesh.setColorAt(this.hoveredSphere, color);
            this.glowingCores.setColorAt(this.hoveredSphere, color);
            this.instancedMesh.instanceColor.needsUpdate = true;
            this.glowingCores.instanceColor.needsUpdate = true;
            
            // Reset after animation
            setTimeout(() => {
                sphereData.targetScale = sphereData.originalScale;
                sphereData.targetIntensity = sphereData.originalIntensity;
            }, 1500);
        }
    }
    
    createRipple(screenX, screenY) {
        // Convert screen coordinates to world coordinates
        const vector = new THREE.Vector3(
            (screenX / window.innerWidth) * 2 - 1,
            -(screenY / window.innerHeight) * 2 + 1,
            0.5
        );
        vector.unproject(this.camera);
        
        const direction = vector.sub(this.camera.position).normalize();
        const distance = -this.camera.position.z / direction.z;
        const pos = this.camera.position.clone().add(direction.multiplyScalar(distance));
        
        // Create ripple data
        const ripple = {
            position: pos.clone(),
            radius: 0,
            maxRadius: 100,
            opacity: 1,
            color: this.colors[Math.floor(Math.random() * this.colors.length)],
            speed: 2
        };
        
        this.ripples.push(ripple);
        
        // Create visual ripple mesh
        const rippleGeometry = new THREE.RingGeometry(0, 1, 32);
        const rippleMaterial = new THREE.MeshBasicMaterial({
            color: ripple.color,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });
        
        const rippleMesh = new THREE.Mesh(rippleGeometry, rippleMaterial);
        rippleMesh.position.copy(pos);
        rippleMesh.lookAt(this.camera.position);
        this.scene.add(rippleMesh);
        
        this.rippleMeshes.push(rippleMesh);
    }
    
    performRaycast() {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // Reset previous hover state
        if (this.hoveredSphere !== null) {
            this.sphereData[this.hoveredSphere].isHovered = false;
            this.hoveredSphere = null;
        }
        
        // Check intersection with instanced mesh
        const intersects = this.raycaster.intersectObject(this.instancedMesh);
        
        if (intersects.length > 0) {
            const instanceId = intersects[0].instanceId;
            if (instanceId !== undefined) {
                this.hoveredSphere = instanceId;
                this.sphereData[instanceId].isHovered = true;
            }
        }
    }
    
    updateSpheres() {
        const matrix = new THREE.Matrix4();
        const coreMatrix = new THREE.Matrix4();
        
        for (let i = 0; i < this.sphereCount; i++) {
            const sphereData = this.sphereData[i];
            
            // Update position with enhanced movement
            sphereData.position.add(sphereData.velocity);
            
            // Enhanced boundary wrapping with tunnel consideration
            const maxX = this.baseRadius * 1.5;
            const maxY = this.baseRadius * 1.5;
            const maxZ = this.tunnelLength / 2;
            
            if (sphereData.position.x > maxX) sphereData.position.x = -maxX;
            if (sphereData.position.x < -maxX) sphereData.position.x = maxX;
            if (sphereData.position.y > maxY) sphereData.position.y = -maxY;
            if (sphereData.position.y < -maxY) sphereData.position.y = maxY;
            if (sphereData.position.z > maxZ) sphereData.position.z = -maxZ;
            if (sphereData.position.z < -maxZ) sphereData.position.z = maxZ;
            
            // Update phase for pulsing
            sphereData.phase += sphereData.pulseSpeed;
            
            // Smooth transitions
            sphereData.scale += (sphereData.targetScale - sphereData.scale) * 0.08;
            sphereData.lightIntensity += (sphereData.targetIntensity - sphereData.lightIntensity) * 0.08;
            
            // Enhanced pulsing effect
            const pulse = 1 + Math.sin(sphereData.phase) * 0.15;
            const currentScale = sphereData.scale * pulse;
            
            // Hover effect
            if (sphereData.isHovered) {
                sphereData.targetScale = sphereData.originalScale * 1.4;
                sphereData.targetIntensity = sphereData.originalIntensity * 2;
            }
            
            // Update matrices
            matrix.makeScale(currentScale, currentScale, currentScale);
            matrix.setPosition(sphereData.position.x, sphereData.position.y, sphereData.position.z);
            this.instancedMesh.setMatrixAt(i, matrix);
            
            // Update core matrix
            const coreScale = currentScale * 0.4;
            coreMatrix.makeScale(coreScale, coreScale, coreScale);
            coreMatrix.setPosition(sphereData.position.x, sphereData.position.y, sphereData.position.z);
            this.glowingCores.setMatrixAt(i, coreMatrix);
            
            // Update light
            const light = this.sphereLights[i];
            light.position.copy(sphereData.position);
            light.intensity = sphereData.lightIntensity * pulse;
            
            // Velocity damping
            sphereData.velocity.multiplyScalar(0.995);
        }
        
        this.instancedMesh.instanceMatrix.needsUpdate = true;
        this.glowingCores.instanceMatrix.needsUpdate = true;
    }
    
    updateRipples() {
        for (let i = this.ripples.length - 1; i >= 0; i--) {
            const ripple = this.ripples[i];
            const rippleMesh = this.rippleMeshes[i];
            
            if (ripple && rippleMesh) {
                ripple.radius += ripple.speed;
                ripple.opacity = 1 - (ripple.radius / ripple.maxRadius);
                
                // Update ripple mesh
                rippleMesh.scale.setScalar(ripple.radius);
                rippleMesh.material.opacity = ripple.opacity * 0.6;
                
                // Remove completed ripples
                if (ripple.radius >= ripple.maxRadius) {
                    this.scene.remove(rippleMesh);
                    rippleMesh.geometry.dispose();
                    rippleMesh.material.dispose();
                    this.ripples.splice(i, 1);
                    this.rippleMeshes.splice(i, 1);
                }
            }
        }
    }
    
    calculateFPS() {
        this.frameCount++;
        const currentTime = performance.now();
        
        if (currentTime - this.lastTime >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
            this.frameCount = 0;
            this.lastTime = currentTime;
            
            const fpsElement = document.getElementById('fps');
            if (fpsElement) {
                fpsElement.textContent = this.fps;
            }
        }
    }
    
    animate() {
        this.time += 0.016;
        
        // Update systems
        this.updateSpheres();
        this.updateRipples();
        
        // Enhanced camera movement
        const cameraRadius = 8;
        this.camera.position.x = Math.sin(this.time * 0.08) * cameraRadius;
        this.camera.position.y = Math.cos(this.time * 0.12) * cameraRadius * 0.5;
        this.camera.position.z = 150 + Math.sin(this.time * 0.05) * 20;
        this.camera.lookAt(0, 0, 0);
        
        // Render with post-processing
        this.composer.render();
        
        this.calculateFPS();
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize when page loads
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, creating Enhanced BubbleUniverse...');
    new EnhancedBubbleUniverse();
});
