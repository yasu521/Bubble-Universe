class EnhancedBubbleUniverse {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 0.1, 2000); // FOV 100 degrees
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: false, alpha: true }); // Disabled antialias for performance
        this.composer = null;
        
        // Raycaster for interaction
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.hoveredSphere = null;
        
        // Hybrid sphere system - Near spheres (individual) + Far spheres (instanced)
        this.sphereCount = 300; // Reduced from 50 for performance
        this.nearSpheres = []; // Individual meshes for near spheres
        this.farInstancedMesh = null; // InstancedMesh for far spheres
        this.sphereMeshes = []; // All sphere meshes for raycasting
        this.sphereLights = [];
        this.sphereData = [];
        this.sphereMaterials = []; // Individual materials for near spheres
        this.glowingCores = []; // Internal glowing objects
        this.maxLights = 15; // Reduced from 20
        
        // LOD system
        this.nearDistance = 80;
        this.farDistance = 120;
        this.cullDistance = 180;
        this.maxVisibleDistance = 250; // Maximum distance before hiding spheres
        
        // Texture system
        this.textureLoader = new THREE.TextureLoader();
        this.sphereTexture = null;
        
        // Ripple system with pooling
        this.ripples = [];
        this.rippleMeshes = [];
        this.ripplePool = [];
        this.maxRipples = 10;
        
        // Animation and performance
        this.time = 0;
        this.fps = 0;
        this.lastTime = 0;
        this.frameCount = 0;
        this.deltaTime = 0;
        
        // Update frequency optimization
        this.updateIntervals = {
            physics: 1,        // Every frame
            distance: 5,       // Every 5 frames
            mouse: 2,          // Every 2 frames
            lighting: 3,       // Every 3 frames
            frustum: 10,       // Every 10 frames
            lod: 15           // Every 15 frames
        };
        
        // Spatial configuration - Updated: X(±500), Y(±100), Z(-100 to +200)
        this.baseRadius = 500; // Expanded to 500 for X-axis range ±500
        this.tunnelLength = 300; // -100 to +200 = 300 range
        this.zOffset = -100; // Start from Z = -100
        this.maxRadiusMultiplier = 1.2;
        
        // Frustum culling
        this.frustum = new THREE.Frustum();
        this.cameraMatrix = new THREE.Matrix4();
        
        // WebWorker for physics (will be initialized if supported)
        this.physicsWorker = null;
        this.useWebWorker = false;
        
        // Fog settings - Reduced for brighter environment
        this.fogDensity = 0.0003; // Reduced from 0.0007
        
        // Colors for lights - White base + bright colorful palette (no dark colors)
        this.colors = [
            0xffffff, 0xffb3ba, 0xffdfba, 0xffffba, 0xbaffc9,
            0xbae1ff, 0xc9baff, 0xffbaff, 0xffc0cb, 0x87ceeb,
            0x98fb98, 0xffd700, 0xff69b4, 0x00bfff, 0x7fffd4,
            0xffa500, 0xff1493, 0x00ff7f, 0x1e90ff, 0xffd1dc,
            0xb0e0e6, 0xf0e68c, 0xdda0dd, 0x90ee90, 0xffb6c1,
            0x87cefa, 0xf5deb3, 0xffc0cb, 0xafeeee, 0xffe4e1,
            0xf0fff0, 0xfff8dc, 0xe6e6fa, 0xffefd5, 0xf5f5dc,
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
            
            console.log('Loading textures...');
            await this.loadTextures();
            
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
        this.renderer.useLegacyLights = false;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 2.5; // 鏡面効果用に明るく
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.physicallyCorrectLights = true; // 物理ベースレンダリング強化
        
        // 鏡面背景の設定
        this.scene.background = new THREE.Color(0xf8f8ff); // ゴーストホワイト
    }
    
    setupCamera() {
        this.camera.position.set(0, 0, 160); // Moved +10 in Z direction
        this.camera.lookAt(0, 0, 0);
    }
    
    setupLighting() {
        // Enhanced ambient light for brighter environment
        const ambientLight = new THREE.AmbientLight(0x404040, 0.8); // Increased from 0.3 to 0.8
        this.scene.add(ambientLight);
        
        // Main directional light - enhanced
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2); // Increased from 0.6 to 1.2
        directionalLight.position.set(100, 100, 100);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 1024; // Reduced from 2048 for performance
        directionalLight.shadow.mapSize.height = 1024;
        directionalLight.shadow.camera.near = 0.1;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -200;
        directionalLight.shadow.camera.right = 200;
        directionalLight.shadow.camera.top = 200;
        directionalLight.shadow.camera.bottom = -200;
        this.scene.add(directionalLight);
        
        // Hemisphere light for natural lighting
        const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x000000, 0.6);
        this.scene.add(hemisphereLight);
        
        // Multiple fill lights for enhanced brightness
        const fillLights = [
            { pos: [-100, 50, 50], color: 0x4ecdc4, intensity: 0.4 },
            { pos: [100, -50, 50], color: 0xff6b6b, intensity: 0.4 },
            { pos: [0, 100, -50], color: 0xfeca57, intensity: 0.3 }
        ];
        
        fillLights.forEach(light => {
            const dirLight = new THREE.DirectionalLight(light.color, light.intensity);
            dirLight.position.set(...light.pos);
            this.scene.add(dirLight);
        });
        
        console.log('Enhanced lighting setup complete - brighter environment');
    }
    
    setupFog() {
        // Fog removed as requested
        // this.scene.fog = new THREE.FogExp2(0x000011, this.fogDensity);
    }
    
    async loadTextures() {
        try {
            // Load multiple textures
            this.sphereTextures = [];
            const textureFiles = ['texture/1.png','texture/3.png'];
            
            for (const file of textureFiles) {
                try {
                    const texture = await this.textureLoader.loadAsync(file);
                    texture.wrapS = THREE.RepeatWrapping;
                    texture.wrapT = THREE.RepeatWrapping;
                    texture.generateMipmaps = true;
                    texture.minFilter = THREE.LinearMipmapLinearFilter;
                    texture.magFilter = THREE.LinearFilter;
                    texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
                    this.sphereTextures.push(texture);
                } catch (error) {
                    console.warn(`Failed to load texture ${file}:`, error);
                }
            }
            
            console.log(`Loaded ${this.sphereTextures.length} textures successfully`);
        } catch (error) {
            console.warn('Failed to load textures:', error);
            this.sphereTextures = [];
        }
    }
    
    createMirrors() {
        // Check if Reflector is available
        if (typeof THREE.Reflector === 'undefined') {
            console.warn('Reflector not available, skipping mirrors');
            return;
        }
        
        const reflectorOptions = {
            clipBias: 0.003,
            textureWidth: 1024,
            textureHeight: 1024,
            color: 0x888888,
            multisample: 4
        };
        
        try {
            // Floor mirror
            const floorGeometry = new THREE.PlaneGeometry(500, 500);
            const floorMirror = new THREE.Reflector(floorGeometry, reflectorOptions);
            floorMirror.rotation.x = -Math.PI / 2;
            floorMirror.position.y = -80;
            this.scene.add(floorMirror);
            this.mirrors.push(floorMirror);
            
            // Left wall mirror
            const leftWallGeometry = new THREE.PlaneGeometry(500, 300);
            const leftWallMirror = new THREE.Reflector(leftWallGeometry, reflectorOptions);
            leftWallMirror.rotation.y = Math.PI / 2;
            leftWallMirror.position.x = -120;
            this.scene.add(leftWallMirror);
            this.mirrors.push(leftWallMirror);
            
            // Right wall mirror
            const rightWallGeometry = new THREE.PlaneGeometry(500, 300);
            const rightWallMirror = new THREE.Reflector(rightWallGeometry, reflectorOptions);
            rightWallMirror.rotation.y = -Math.PI / 2;
            rightWallMirror.position.x = 120;
            this.scene.add(rightWallMirror);
            this.mirrors.push(rightWallMirror);
            
            console.log('Mirrors created: floor and side walls');
        } catch (error) {
            console.warn('Failed to create mirrors:', error);
            // Create simple reflective planes as fallback
            this.createFallbackMirrors();
        }
    }
    
    createFallbackMirrors() {
        const mirrorMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x888888,
            metalness: 1.0,
            roughness: 0.1,
            clearcoat: 1.0,
            clearcoatRoughness: 0.05,
            reflectivity: 0.9
        });
        
        // Floor mirror
        const floorGeometry = new THREE.PlaneGeometry(500, 500);
        const floorMirror = new THREE.Mesh(floorGeometry, mirrorMaterial);
        floorMirror.rotation.x = -Math.PI / 2;
        floorMirror.position.y = -80;
        floorMirror.receiveShadow = true;
        this.scene.add(floorMirror);
        
        // Side mirrors
        const sideGeometry = new THREE.PlaneGeometry(500, 300);
        
        const leftMirror = new THREE.Mesh(sideGeometry, mirrorMaterial);
        leftMirror.rotation.y = Math.PI / 2;
        leftMirror.position.x = -120;
        this.scene.add(leftMirror);
        
        const rightMirror = new THREE.Mesh(sideGeometry, mirrorMaterial);
        rightMirror.rotation.y = -Math.PI / 2;
        rightMirror.position.x = 120;
        this.scene.add(rightMirror);
        
        console.log('Fallback mirrors created');
        
        // Giant inner sphere removed as requested
    }
    
    
    generateSpherePosition(index) {
        // Z-axis: -100 to +200 range (300 total length)
        const normalizedIndex = index / this.sphereCount;
        const z = (normalizedIndex * this.tunnelLength) + this.zOffset; // -100 to +200
        
        // Camera distance for FOV-based positioning
        const cameraDistance = 160 - z; // Distance from camera at (0,0,160)
        
        // FOV-based maximum radius calculation
        const fov = 100 * Math.PI / 180; // 100 degrees in radians
        const maxViewRadius = Math.tan(fov / 2) * Math.abs(cameraDistance) * 0.75; // Use 75% of view
        
        // New range-based positioning: X(±500), Y(±300)
        const maxX = 500;
        const maxY = 300;
        
        // Random distribution within the new ranges
        const x = (Math.random() - 0.5) * 2 * maxX; // -500 to +500
        const y = (Math.random() - 0.5) * 2 * maxY; // -300 to +300
        
        return {
            x: x,
            y: y,
            z: z
        };
    }
    
    createSpheres() {
        // Create larger sphere geometry with higher detail
        const geometry = new THREE.SphereGeometry(1.5, 32, 32); // Increased from 1 to 1.5
        
        // Create glowing core geometry
        const coreGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        
        // Create individual spheres with texture support
        for (let i = 0; i < this.sphereCount; i++) {
            const position = this.generateSpherePosition(i);
            
            // Massive scale range: 8.0 to 24.0 for extremely prominent spheres (2-3x larger)
            const scale = 8.0 + Math.random() * 16.0;
            
            // Random color for this sphere
            const colorHex = this.colors[Math.floor(Math.random() * this.colors.length)];
            const color = new THREE.Color(colorHex);
            
            // Select random texture from available textures
            const randomTexture = this.sphereTextures.length > 0 ? 
                this.sphereTextures[Math.floor(Math.random() * this.sphereTextures.length)] : null;
            
            // Create simple material without mirror effects
            const material = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.8,
                map: randomTexture,
                alphaMap: randomTexture
            });
            
            // Create sphere mesh
            const sphereMesh = new THREE.Mesh(geometry, material);
            sphereMesh.position.set(position.x, position.y, position.z);
            sphereMesh.scale.setScalar(scale);
            sphereMesh.castShadow = true;
            sphereMesh.receiveShadow = true;
            this.scene.add(sphereMesh);
            this.sphereMeshes.push(sphereMesh);
            this.sphereMaterials.push(material);
            
            // Create glowing core (static)
            const coreMaterial = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.8
            });
            
            const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
            coreMesh.position.set(position.x, position.y, position.z);
            coreMesh.scale.setScalar(scale * 0.4);
            this.scene.add(coreMesh);
            this.glowingCores.push(coreMesh);
            
            
            // Create point light only for selected spheres to avoid WebGL limits
            if (i < this.maxLights) {
                const light = new THREE.PointLight(colorHex, 2.0, 30); // Increased range
                light.position.set(position.x, position.y, position.z);
                this.scene.add(light);
                this.sphereLights.push(light);
            } else {
                this.sphereLights.push(null); // Placeholder for non-lit spheres
            }
            
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
                lightIntensity: 0.8 + Math.random() * 1.2,
                originalIntensity: 0.8 + Math.random() * 1.2,
                isHovered: false,
                targetScale: scale,
                targetIntensity: 0.8 + Math.random() * 1.2,
                interactionRadius: 100 + Math.random() * 50, // Increased interaction radius
                isVisible: true,
                mesh: sphereMesh,
                coreMesh: coreMesh,
                material: material
            });
        }
        
        console.log(`Created ${this.sphereCount} enhanced spheres with textures`);
        
        // Update sphere count display
        const sphereCountElement = document.getElementById('sphere-count');
        if (sphereCountElement) {
            sphereCountElement.textContent = this.sphereCount;
        }
    }
    
    setupPostProcessing() {
        // Check if post-processing classes are available
        if (typeof THREE.EffectComposer === 'undefined' || 
            typeof THREE.RenderPass === 'undefined' || 
            typeof THREE.UnrealBloomPass === 'undefined') {
            console.warn('Post-processing not available, using basic renderer');
            return;
        }
        
        try {
            this.composer = new THREE.EffectComposer(this.renderer);
            
            // Render pass
            const renderPass = new THREE.RenderPass(this.scene, this.camera);
            this.composer.addPass(renderPass);
            
            // Enhanced bloom pass
            const bloomPass = new THREE.UnrealBloomPass(
                new THREE.Vector2(window.innerWidth, window.innerHeight),
                1.5, // strength
                0.6, // radius
                0.7  // threshold
            );
            this.composer.addPass(bloomPass);
            
            console.log('Post-processing setup complete');
        } catch (error) {
            console.warn('Failed to setup post-processing:', error);
            this.composer = null;
        }
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
        console.log(`Sphere count change requested: ${this.sphereCount} -> ${newCount}`);
        document.getElementById('sphere-count').textContent = newCount;
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        if (this.composer) {
            this.composer.setSize(window.innerWidth, window.innerHeight);
        }
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
        try {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            
            // Ripple effect removed as requested
            
            this.performRaycast();
            
            if (this.hoveredSphere !== null && this.hoveredSphere < this.sphereData.length) {
                const sphereData = this.sphereData[this.hoveredSphere];
                
                if (sphereData && sphereData.material && sphereData.coreMesh) {
                    // Animate clicked sphere
                    sphereData.targetScale = sphereData.originalScale * 2;
                    sphereData.targetIntensity = sphereData.originalIntensity * 3;
                    
                    // Change color
                    const newColor = this.colors[Math.floor(Math.random() * this.colors.length)];
                    const color = new THREE.Color(newColor);
                    
                    // Update sphere material color safely
                    if (sphereData.material.color) {
                        sphereData.material.color.copy(color);
                    }
                    
                    // Update core color safely
                    if (sphereData.coreMesh.material && sphereData.coreMesh.material.color) {
                        sphereData.coreMesh.material.color.copy(color);
                    }
                    
                    // Update light color safely
                    const light = this.sphereLights[this.hoveredSphere];
                    if (light && light.color) {
                        light.color.setHex(newColor);
                    }
                    
                    // Store new color
                    sphereData.originalColor = newColor;
                    
                    // Reset after animation
                    setTimeout(() => {
                        if (sphereData) {
                            sphereData.targetScale = sphereData.originalScale;
                            sphereData.targetIntensity = sphereData.originalIntensity;
                        }
                    }, 1500);
                }
            }
        } catch (error) {
            console.warn('Error in onMouseClick:', error);
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
        
        // Check intersection with individual sphere meshes
        const intersects = this.raycaster.intersectObjects(this.sphereMeshes);
        
        if (intersects.length > 0) {
            // Find which sphere was hit
            const hitMesh = intersects[0].object;
            const sphereIndex = this.sphereMeshes.indexOf(hitMesh);
            
            if (sphereIndex !== -1) {
                this.hoveredSphere = sphereIndex;
                this.sphereData[sphereIndex].isHovered = true;
            }
        }
    }
    
    updateSpheres() {
        for (let i = 0; i < this.sphereCount; i++) {
            const sphereData = this.sphereData[i];
            
            // Automatic sphere hiding disabled as requested - all spheres remain visible
            // Ensure all spheres are always visible
            if (!sphereData.mesh.visible) {
                sphereData.mesh.visible = true;
                sphereData.coreMesh.visible = true;
                sphereData.isVisible = true;
            }
            
            // Update position with enhanced movement
            sphereData.position.add(sphereData.velocity);
            
            // Enhanced boundary wrapping with new ranges: X(±500), Y(±300), Z(-100 to +200)
            const maxX = 500;  // ±500
            const maxY = 300;  // ±300
            const minZ = -100; // -100
            const maxZ = +100; // +100

            if (sphereData.position.x > maxX) sphereData.position.x = -maxX;
            if (sphereData.position.x < -maxX) sphereData.position.x = maxX;
            if (sphereData.position.y > maxY) sphereData.position.y = -maxY;
            if (sphereData.position.y < -maxY) sphereData.position.y = maxY;
            if (sphereData.position.z > maxZ) sphereData.position.z = minZ;
            if (sphereData.position.z < minZ) sphereData.position.z = maxZ;
            
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
            
            // Update mesh positions and scales
            sphereData.mesh.position.copy(sphereData.position);
            sphereData.mesh.scale.setScalar(currentScale);
            
            sphereData.coreMesh.position.copy(sphereData.position);
            sphereData.coreMesh.scale.setScalar(currentScale * 0.4);
            
            
            // Update light (only if it exists and sphere is visible)
            const light = this.sphereLights[i];
            if (light && sphereData.isVisible) {
                light.position.copy(sphereData.position);
                light.intensity = sphereData.lightIntensity * pulse;
            }
            
            // Velocity damping
            sphereData.velocity.multiplyScalar(0.995);
        }
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
    
    shouldUpdate(system) {
        return this.frameCount % this.updateIntervals[system] === 0;
    }
    
    updateFrustumCulling() {
        // Update frustum for culling
        this.camera.updateMatrixWorld();
        this.cameraMatrix.multiplyMatrices(
            this.camera.projectionMatrix,
            this.camera.matrixWorldInverse
        );
        this.frustum.setFromProjectionMatrix(this.cameraMatrix);
        
        let visibleCount = 0;
        for (let i = 0; i < this.sphereCount; i++) {
            const sphereData = this.sphereData[i];
            const sphere = new THREE.Sphere(
                sphereData.position, 
                sphereData.scale * 1.5
            );
            
            const isInFrustum = this.frustum.intersectsSphere(sphere);
            
            if (sphereData.inFrustum !== isInFrustum) {
                sphereData.inFrustum = isInFrustum;
                // Additional culling logic can be added here
            }
            
            if (isInFrustum) visibleCount++;
        }
        
        return visibleCount;
    }
    
    animate() {
        const currentTime = performance.now();
        this.deltaTime = currentTime - this.lastTime;
        this.time += 0.016;
        
        // Physics update (every frame)
        this.updateSpheres();
        
        // Mouse interaction (every 2 frames)
        if (this.shouldUpdate('mouse')) {
            // Mouse interaction is handled in onMouseMove
        }
        
        // Distance culling (every 5 frames)
        if (this.shouldUpdate('distance')) {
            // Distance culling is handled in updateSpheres
        }
        
        // Lighting updates (every 3 frames)
        if (this.shouldUpdate('lighting')) {
            // Lighting updates are handled in updateSpheres
        }
        
        // Frustum culling (every 10 frames)
        if (this.shouldUpdate('frustum')) {
            this.updateFrustumCulling();
        }
        
        // LOD system (every 15 frames)
        if (this.shouldUpdate('lod')) {
            // LOD logic is integrated into updateSpheres
        }
        
        // Ripple updates (every frame)
        this.updateRipples();
        
        // Camera is now fixed - no movement
        // this.camera.position remains at (0, 0, 150)
        
        // Render with post-processing or basic renderer
        if (this.composer) {
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
        
        this.calculateFPS();
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize when page loads
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, creating Enhanced BubbleUniverse...');
    new EnhancedBubbleUniverse();
});
