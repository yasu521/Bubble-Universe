import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';
import { EffectComposer } from 'https://unpkg.com/three@0.158.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://unpkg.com/three@0.158.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://unpkg.com/three@0.158.0/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'https://unpkg.com/three@0.158.0/examples/jsm/postprocessing/ShaderPass.js';

class BubbleUniverse {
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
        
        // Sphere system
        this.sphereCount = 100; // Reduced from 500 for better performance
        this.instancedMesh = null;
        this.sphereLights = [];
        this.sphereData = [];
        
        // Animation
        this.time = 0;
        this.fps = 0;
        this.lastTime = 0;
        this.frameCount = 0;
        
        // Textures
        this.textures = {};
        
        // Colors for lights
        this.colors = [
            0xff6b6b, 0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xfeca57,
            0xff9ff3, 0x54a0ff, 0x5f27cd, 0x00d2d3, 0xff9f43,
            0x10ac84, 0xee5a24, 0x0abde3, 0x006ba6, 0xf368e0,
            0x3742fa, 0x2f3542, 0xff3838, 0xff9500, 0xffdd59,
            0xc44569, 0xf8b500, 0x786fa6, 0xf19066, 0x778beb
        ];
        
        console.log('BubbleUniverse initializing...');
        this.init();
    }
    
    async init() {
        try {
            console.log('Setting up renderer...');
            this.setupRenderer();
            
            console.log('Loading textures...');
            await this.loadTextures();
            
            console.log('Setting up camera...');
            this.setupCamera();
            
            console.log('Setting up lighting...');
            this.setupLighting();
            
            console.log('Creating spheres...');
            this.createSpheres();
            
            console.log('Setting up post-processing...');
            this.setupPostProcessing();
            
            console.log('Setting up event listeners...');
            this.setupEventListeners();
            
            console.log('Starting animation...');
            this.animate();
            
            // Hide title after 3 seconds
            setTimeout(() => {
                const title = document.getElementById('title');
                if (title) title.classList.add('fade-out');
            }, 3000);
            
            console.log('BubbleUniverse initialized successfully!');
        } catch (error) {
            console.error('Failed to initialize BubbleUniverse:', error);
        }
    }
    
    setupRenderer() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.physicallyCorrectLights = true;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
    }
    
    async loadTextures() {
        const loader = new THREE.TextureLoader();
        
        try {
            // Load textures
            this.textures.albedo = await this.loadTexture(loader, 'texture/1.png');
            this.textures.roughness = await this.loadTexture(loader, 'texture/2.png');
            this.textures.normal = await this.loadTexture(loader, 'texture/3.png');
            
            // Configure texture settings
            Object.values(this.textures).forEach(texture => {
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                texture.repeat.set(1, 1);
            });
            
            console.log('Textures loaded successfully');
        } catch (error) {
            console.warn('Failed to load some textures:', error);
            // Create fallback textures
            this.createFallbackTextures();
        }
    }
    
    loadTexture(loader, path) {
        return new Promise((resolve, reject) => {
            loader.load(
                path,
                resolve,
                undefined,
                reject
            );
        });
    }
    
    createFallbackTextures() {
        console.log('Creating fallback textures...');
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // Fallback albedo (white)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 256, 256);
        this.textures.albedo = new THREE.CanvasTexture(canvas);
        
        // Fallback roughness (gray)
        ctx.fillStyle = '#808080';
        ctx.fillRect(0, 0, 256, 256);
        this.textures.roughness = new THREE.CanvasTexture(canvas);
        
        // Fallback normal (blue)
        ctx.fillStyle = '#8080ff';
        ctx.fillRect(0, 0, 256, 256);
        this.textures.normal = new THREE.CanvasTexture(canvas);
    }
    
    setupCamera() {
        this.camera.position.set(0, 0, 100);
        this.camera.lookAt(0, 0, 0);
    }
    
    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.2);
        this.scene.add(ambientLight);
        
        // Main directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(50, 50, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
        
        // HDRI environment (simplified)
        const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        const envTexture = pmremGenerator.fromScene(new THREE.Scene()).texture;
        this.scene.environment = envTexture;
        pmremGenerator.dispose();
    }
    
    createSpheres() {
        // Create sphere geometry
        const geometry = new THREE.SphereGeometry(1, 32, 32);
        
        // Create glass material with textures
        const material = new THREE.MeshPhysicalMaterial({
            map: this.textures.albedo,
            roughnessMap: this.textures.roughness,
            normalMap: this.textures.normal,
            transmission: 1.0,
            opacity: 0.2,
            transparent: true,
            thickness: 0.5,
            ior: 1.45,
            clearcoat: 1.0,
            clearcoatRoughness: 0.05,
            envMapIntensity: 1.0,
            side: THREE.DoubleSide
        });
        
        // Create instanced mesh
        this.instancedMesh = new THREE.InstancedMesh(geometry, material, this.sphereCount);
        this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.instancedMesh.castShadow = true;
        this.instancedMesh.receiveShadow = true;
        this.scene.add(this.instancedMesh);
        
        // Initialize sphere data and lights
        const matrix = new THREE.Matrix4();
        const color = new THREE.Color();
        
        for (let i = 0; i < this.sphereCount; i++) {
            // Random position
            const x = (Math.random() - 0.5) * 200;
            const y = (Math.random() - 0.5) * 200;
            const z = (Math.random() - 0.5) * 200;
            
            // Random scale
            const scale = 0.5 + Math.random() * 2;
            
            // Set matrix
            matrix.makeScale(scale, scale, scale);
            matrix.setPosition(x, y, z);
            this.instancedMesh.setMatrixAt(i, matrix);
            
            // Random color
            const colorHex = this.colors[Math.floor(Math.random() * this.colors.length)];
            color.setHex(colorHex);
            this.instancedMesh.setColorAt(i, color);
            
            // Create point light for each sphere (reduced intensity for performance)
            const light = new THREE.PointLight(colorHex, 1, 8);
            light.position.set(x, y, z);
            this.scene.add(light);
            this.sphereLights.push(light);
            
            // Store sphere data
            this.sphereData.push({
                position: new THREE.Vector3(x, y, z),
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.1,
                    (Math.random() - 0.5) * 0.1,
                    (Math.random() - 0.5) * 0.1
                ),
                scale: scale,
                originalScale: scale,
                originalColor: colorHex,
                phase: Math.random() * Math.PI * 2,
                pulseSpeed: 0.02 + Math.random() * 0.03,
                lightIntensity: 0.5 + Math.random() * 1,
                originalIntensity: 0.5 + Math.random() * 1,
                isHovered: false,
                targetScale: scale,
                targetIntensity: 0.5 + Math.random() * 1
            });
        }
        
        this.instancedMesh.instanceMatrix.needsUpdate = true;
        if (this.instancedMesh.instanceColor) {
            this.instancedMesh.instanceColor.needsUpdate = true;
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
        
        // Bloom pass
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1.2, // strength (reduced)
            0.4, // radius
            0.85 // threshold
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
        if (this.frameCount % 5 === 0) { // Only raycast every 5th frame
            this.performRaycast();
        }
    }
    
    onMouseClick(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        this.performRaycast();
        
        if (this.hoveredSphere !== null) {
            const sphereData = this.sphereData[this.hoveredSphere];
            
            // Animate clicked sphere
            sphereData.targetScale = sphereData.originalScale * 1.5;
            sphereData.targetIntensity = sphereData.originalIntensity * 2;
            
            // Change color
            const newColor = this.colors[Math.floor(Math.random() * this.colors.length)];
            this.sphereLights[this.hoveredSphere].color.setHex(newColor);
            
            const color = new THREE.Color();
            color.setHex(newColor);
            this.instancedMesh.setColorAt(this.hoveredSphere, color);
            this.instancedMesh.instanceColor.needsUpdate = true;
            
            // Reset after animation
            setTimeout(() => {
                sphereData.targetScale = sphereData.originalScale;
                sphereData.targetIntensity = sphereData.originalIntensity;
            }, 1000);
        }
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
        
        for (let i = 0; i < this.sphereCount; i++) {
            const sphereData = this.sphereData[i];
            
            // Update position
            sphereData.position.add(sphereData.velocity);
            
            // Boundary wrapping
            if (sphereData.position.x > 100) sphereData.position.x = -100;
            if (sphereData.position.x < -100) sphereData.position.x = 100;
            if (sphereData.position.y > 100) sphereData.position.y = -100;
            if (sphereData.position.y < -100) sphereData.position.y = 100;
            if (sphereData.position.z > 100) sphereData.position.z = -100;
            if (sphereData.position.z < -100) sphereData.position.z = 100;
            
            // Update phase for pulsing
            sphereData.phase += sphereData.pulseSpeed;
            
            // Smooth scale and intensity transitions
            sphereData.scale += (sphereData.targetScale - sphereData.scale) * 0.1;
            sphereData.lightIntensity += (sphereData.targetIntensity - sphereData.lightIntensity) * 0.1;
            
            // Pulsing effect
            const pulse = 1 + Math.sin(sphereData.phase) * 0.1;
            const currentScale = sphereData.scale * pulse;
            
            // Hover effect
            if (sphereData.isHovered) {
                sphereData.targetScale = sphereData.originalScale * 1.2;
                sphereData.targetIntensity = sphereData.originalIntensity * 1.5;
            } else if (!sphereData.isHovered && sphereData.targetScale > sphereData.originalScale) {
                sphereData.targetScale = sphereData.originalScale;
                sphereData.targetIntensity = sphereData.originalIntensity;
            }
            
            // Update matrix
            matrix.makeScale(currentScale, currentScale, currentScale);
            matrix.setPosition(sphereData.position.x, sphereData.position.y, sphereData.position.z);
            this.instancedMesh.setMatrixAt(i, matrix);
            
            // Update light
            const light = this.sphereLights[i];
            light.position.copy(sphereData.position);
            light.intensity = sphereData.lightIntensity * pulse;
        }
        
        this.instancedMesh.instanceMatrix.needsUpdate = true;
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
        
        // Update spheres
        this.updateSpheres();
        
        // Camera movement
        this.camera.position.x = Math.sin(this.time * 0.1) * 5;
        this.camera.position.y = Math.cos(this.time * 0.15) * 3;
        this.camera.lookAt(0, 0, 0);
        
        // Render
        this.composer.render();
        
        this.calculateFPS();
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize when page loads
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, creating BubbleUniverse...');
    new BubbleUniverse();
});
