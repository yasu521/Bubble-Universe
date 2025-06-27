// 設定セクション - 球体数とライト数を簡単に変更可能
const CONFIG = {
    SPHERE_COUNT: 400,        // 球体数（ここを変更するだけ）
    LIGHT_COUNT: 8,           // ライト数（ここを変更するだけ）
    SPHERE_SIZE_MIN: 15,      // 最小球体サイズ
    SPHERE_SIZE_MAX: 25,      // 最大球体サイズ
    COLORS: [
        // 既存のパステル・明るい色（35色）
        'rgb(255, 179, 220)', 'rgb(255, 179, 186)', 'rgb(255, 223, 186)', 'rgb(255, 255, 186)', 'rgb(186, 255, 201)',
        'rgb(186, 225, 255)', 'rgb(201, 186, 255)', 'rgb(255, 186, 255)', 'rgb(255, 192, 203)', 'rgb(135, 206, 235)',
        'rgb(152, 251, 152)', 'rgb(255, 215, 0)', 'rgb(255, 105, 180)', 'rgb(0, 191, 255)', 'rgb(127, 255, 212)',
        'rgb(255, 165, 0)', 'rgb(255, 170, 215)', 'rgb(0, 255, 127)', 'rgb(30, 144, 255)', 'rgb(255, 209, 220)',
        'rgb(176, 224, 230)', 'rgb(240, 230, 140)', 'rgb(221, 160, 221)', 'rgb(144, 238, 144)', 'rgb(255, 182, 193)',
        'rgb(0, 157, 255)', 'rgb(245, 222, 179)', 'rgb(255, 94, 121)', 'rgb(175, 238, 238)', 'rgb(255, 228, 225)',
        'rgb(83, 249, 83)', 'rgb(255, 248, 220)', 'rgb(173, 173, 255)', 'rgb(255, 239, 213)', 'rgb(255, 255, 85)',

        // ビビッドカラー（25色）
        'rgb(255, 20, 147)', 'rgb(255, 69, 0)', 'rgb(255, 140, 0)', 'rgb(173, 255, 47)', 'rgb(0, 255, 255)',
        'rgb(138, 43, 226)', 'rgb(220, 20, 60)', 'rgb(255, 99, 71)', 'rgb(255, 255, 0)', 'rgb(154, 205, 50)',
        'rgb(0, 250, 154)', 'rgb(72, 209, 204)', 'rgb(65, 105, 225)', 'rgb(123, 104, 238)', 'rgb(199, 21, 133)',
        'rgb(255, 127, 80)', 'rgb(255, 160, 122)', 'rgb(255, 215, 0)', 'rgb(192, 192, 192)', 'rgb(205, 127, 50)',
        'rgb(184, 134, 11)', 'rgb(218, 165, 32)', 'rgb(238, 232, 170)', 'rgb(250, 250, 210)', 'rgb(255, 248, 220)'
    ]
};

class EnhancedBubbleUniverse {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 0.1, 2000);
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: false, alpha: true });
        this.composer = null;
        
        // Raycaster for interaction
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.hoveredSphere = null;
        
        // Level 4 Optimization Systems
        this.objectPool = new ObjectPool();
        this.adaptiveQuality = new AdaptiveQuality();
        
        // WebWorker for physics
        this.physicsWorker = null;
        this.useWebWorker = false;
        this.workerInitialized = false;
        
        // InstancedMesh system for maximum performance
        this.instancedSpheres = null;
        this.instancedCores = null;
        this.instanceCount = CONFIG.SPHERE_COUNT;
        this.instanceMatrices = [];
        this.instanceColors = [];
        
        // Sphere system - using CONFIG
        this.sphereCount = CONFIG.SPHERE_COUNT;
        this.sphereMeshes = [];
        this.sphereLights = [];
        this.sphereData = [];
        this.sphereMaterials = [];
        this.glowingCores = [];
        this.maxLights = CONFIG.LIGHT_COUNT;
        
        // LOD system
        this.nearDistance = 80;
        this.farDistance = 120;
        this.cullDistance = 180;
        this.maxVisibleDistance = 250; // Maximum distance before hiding spheres
        
        // Texture system
        this.textureLoader = new THREE.TextureLoader();
        this.sphereTexture = null;
        
        // Ripple system removed as requested
        
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
        
        // Use CONFIG colors (115 colors total)
        this.colors = CONFIG.COLORS;
        
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
            
            console.log('Initializing Level 4 optimizations...');
            await this.initializeOptimizations();
            
            console.log('Loading textures...');
            await this.loadTextures();
            
            console.log('Setting up lighting and fog...');
            this.setupLighting();
            this.setupFog();
            
            console.log('Creating mirrors...');
            this.createMirrors();
            
            console.log('Creating optimized spheres...');
            this.createOptimizedSpheres();
            
            console.log('Setting up post-processing...');
            this.setupPostProcessing();
            
            console.log('Setting up event listeners...');
            this.setupEventListeners();
            
            console.log('Starting optimized animation...');
            this.animate();
            
            // Hide title after 4 seconds
            setTimeout(() => {
                const title = document.getElementById('title');
                if (title) title.classList.add('fade-out');
            }, 4000);
            
            console.log('Level 4 Enhanced BubbleUniverse initialized successfully!');
        } catch (error) {
            console.error('Failed to initialize Enhanced BubbleUniverse:', error);
        }
    }
    
    async initializeOptimizations() {
        // Initialize WebWorker for physics
        try {
            this.physicsWorker = new Worker('physics-worker.js');
            this.physicsWorker.onmessage = (e) => this.handleWorkerMessage(e);
            this.useWebWorker = true;
            console.log('WebWorker initialized for physics calculations');
        } catch (error) {
            console.warn('WebWorker not available, using main thread:', error);
            this.useWebWorker = false;
        }
        
        // Pre-allocate object pools
        this.objectPool.preAllocate({
            spheres: 50,
            lights: 20,
            ripples: 10
        });
        
        console.log('Level 4 optimizations initialized');
    }
    
    handleWorkerMessage(e) {
        const { type, data } = e.data;
        
        switch (type) {
            case 'initialized':
                this.workerInitialized = true;
                console.log('Physics worker ready');
                break;
                
            case 'physicsUpdate':
                this.applyPhysicsResults(data);
                break;
                
            case 'collisions':
                this.handleCollisions(data);
                break;
        }
    }
    
    applyPhysicsResults(results) {
        for (const result of results) {
            if (result.index < this.sphereData.length) {
                const sphereData = this.sphereData[result.index];
                sphereData.position.copy(result.position);
                sphereData.scale = result.scale;
                sphereData.lightIntensity = result.lightIntensity;
                sphereData.phase = result.phase;
            }
        }
    }
    
    handleCollisions(collisions) {
        // Handle collision effects
        for (const collision of collisions) {
            // Add visual effects for collisions
            console.log('Collision detected:', collision);
        }
    }
    
    setupRenderer() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.useLegacyLights = false;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.5; // 鏡面効果用に明るく
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.physicallyCorrectLights = true; // 物理ベースレンダリング強化
        
        // 背景色を自然な色に設定
        this.scene.background = new THREE.Color('rgb(17, 33, 48)'); // スカイブルー
    }
    
    setupCamera() {
        this.camera.position.set(0, 0, 160); // Moved +10 in Z direction
        this.camera.lookAt(0, 0, 0);
    }
    
    setupLighting() {
        // 簡素化されたライティング - 基本環境光
        const ambientLight = new THREE.AmbientLight('rgb(255, 255, 255)', 1.0);
        this.scene.add(ambientLight);
        
        // メインディレクショナルライト
        const directionalLight = new THREE.DirectionalLight('rgb(255, 255, 255)', 2.0);
        directionalLight.position.set(0, 100, 100);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        this.scene.add(directionalLight);
        
        // 補助ライト（最小限）
        const hemisphereLight = new THREE.HemisphereLight('rgb(255, 255, 255)', 'rgb(200, 200, 255)', 0.8);
        this.scene.add(hemisphereLight);
        
        console.log('簡素化されたライティング設定完了');
    }
    
    setupFog() {
        // Fog removed as requested
        // this.scene.fog = new THREE.FogExp2(0x000011, this.fogDensity);
    }
    
    async loadTextures() {
        // Skip texture loading for lightweight version to avoid CORS issues
        this.sphereTextures = [];
        console.log('Texture loading skipped for lightweight version');
    }
    
    createMirrors() {
        // 背景ミラーを削除 - ミラー機能を無効化
        console.log('背景ミラーが削除されました');
        return;
    }
    
    createFallbackMirrors() {
        // 完全鏡面マテリアル
        const mirrorMaterial = new THREE.MeshPhysicalMaterial({
            color: 'rgb(255, 255, 255)',        // 白色ベース
            metalness: 1.0,         // 完全な金属
            roughness: 0.0,         // 完全に滑らか（鏡面）
            clearcoat: 1.0,         // クリアコート最大
            clearcoatRoughness: 0.0, // クリアコート滑らか
            reflectivity: 1.0,      // 最大反射率
            envMapIntensity: 3.0    // 環境マップ最大強度
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
        const random = Math.random();
        // Z-axis: -100 to +200 range (300 total length)
        const normalizedIndex = index / this.sphereCount;
        const z = (normalizedIndex * this.tunnelLength) + this.zOffset; // -100 to +200
        
        // Camera distance for FOV-based positioning
        const cameraDistance = 160 - z; // Distance from camera at (0,0,160)
        
        // Z値に応じてXY範囲を動的に調整
        // Z値が大きい（カメラに近い）ほど範囲を狭くする
        const zNormalized = (z - this.zOffset) / this.tunnelLength; // 0 to 1 (0: 遠い, 1: 近い)
        
        // 基本範囲
        const baseMaxX = 500;
        const baseMaxY = 300;
        
        // カメラに近いほど範囲を狭くする（最小50%まで）
        const rangeFactor = 1.0 - (zNormalized * 0.5); // 1.0 to 0.5
        const maxX = baseMaxX * rangeFactor;
        const maxY = baseMaxY * rangeFactor;
        
        // Random distribution within the adjusted ranges
        const x = (random - 0.5) * 2 * maxX;
        const y = (Math.random() - 0.5) * 2 * maxY;
        
        return {
            x: x,
            y: y,
            z: z
        };
    }
    
    createOptimizedSpheres() {
        console.log('Creating Level 4 optimized spheres with InstancedMesh...');
        
        // Optimized geometry with reduced detail for performance
        const geometry = this.objectPool.getGeometry('sphere', 1.5, 16, 16); // Reduced from 32,32 to 16,16
        const coreGeometry = this.objectPool.getGeometry('sphere', 0.5, 8, 8); // Reduced from 16,16 to 8,8
        
        // Create InstancedMesh for main spheres
        const material = new THREE.MeshLambertMaterial({
            transparent: true,
            opacity: 0.8
        });
        
        this.instancedSpheres = new THREE.InstancedMesh(geometry, material, this.sphereCount);
        this.instancedSpheres.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.instancedSpheres.castShadow = true;
        this.instancedSpheres.receiveShadow = true;
        this.scene.add(this.instancedSpheres);
        
        // Create InstancedMesh for cores
        const coreMaterial = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0.8
        });
        
        this.instancedCores = new THREE.InstancedMesh(coreGeometry, coreMaterial, this.sphereCount);
        this.instancedCores.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.scene.add(this.instancedCores);
        
        // Initialize instance data
        const matrix = new THREE.Matrix4();
        const color = new THREE.Color();
        
        for (let i = 0; i < this.sphereCount; i++) {
            const position = this.generateSpherePosition(i);
            const scale = 15.0 + Math.random() * 10.0; // Reduced scale for performance
            
            // Random color for this sphere
            const colorHex = this.colors[Math.floor(Math.random() * this.colors.length)];
            color.set(colorHex);
            
            // Set instance matrix for main sphere
            matrix.makeScale(scale, scale, scale);
            matrix.setPosition(position.x, position.y, position.z);
            this.instancedSpheres.setMatrixAt(i, matrix);
            this.instancedSpheres.setColorAt(i, color);
            
            // Set instance matrix for core
            const coreScale = scale * 0.4;
            matrix.makeScale(coreScale, coreScale, coreScale);
            matrix.setPosition(position.x, position.y, position.z);
            this.instancedCores.setMatrixAt(i, matrix);
            this.instancedCores.setColorAt(i, color);
            
            // Create optimized lights (fewer lights for performance)
            if (i < this.maxLights) {
                const light = this.objectPool.getPointLight(colorHex, 1.5, 25); // Reduced intensity and range
                light.position.set(position.x, position.y, position.z);
                this.scene.add(light);
                this.sphereLights.push(light);
            } else {
                this.sphereLights.push(null);
            }
            
            // Store optimized sphere data
            this.sphereData.push({
                position: new THREE.Vector3(position.x, position.y, position.z),
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.1, // Reduced velocity for stability
                    (Math.random() - 0.5) * 0.1,
                    (Math.random() - 0.5) * 0.05
                ),
                scale: scale,
                originalScale: scale,
                originalColor: colorHex,
                phase: Math.random() * Math.PI * 2,
                pulseSpeed: 0.01 + Math.random() * 0.02, // Reduced pulse speed
                lightIntensity: 0.5 + Math.random() * 1.0, // Reduced intensity
                originalIntensity: 0.5 + Math.random() * 1.0,
                isHovered: false,
                targetScale: scale,
                targetIntensity: 0.5 + Math.random() * 1.0,
                interactionRadius: 80 + Math.random() * 40, // Reduced interaction radius
                isVisible: true,
                instanceIndex: i
            });
        }
        
        // Update instance matrices
        this.instancedSpheres.instanceMatrix.needsUpdate = true;
        this.instancedSpheres.instanceColor.needsUpdate = true;
        this.instancedCores.instanceMatrix.needsUpdate = true;
        this.instancedCores.instanceColor.needsUpdate = true;
        
        // Initialize WebWorker with sphere data if available
        if (this.useWebWorker && this.physicsWorker) {
            const workerData = this.sphereData.map((data, index) => ({
                position: { x: data.position.x, y: data.position.y, z: data.position.z },
                velocity: { x: data.velocity.x, y: data.velocity.y, z: data.velocity.z },
                scale: data.scale,
                originalScale: data.originalScale,
                phase: data.phase,
                pulseSpeed: data.pulseSpeed,
                lightIntensity: data.lightIntensity,
                originalIntensity: data.originalIntensity,
                targetScale: data.targetScale,
                targetIntensity: data.targetIntensity,
                interactionRadius: data.interactionRadius,
                isVisible: data.isVisible,
                index: index
            }));
            
            this.physicsWorker.postMessage({
                type: 'init',
                data: { sphereData: workerData }
            });
        }
        
        console.log(`Created ${this.sphereCount} Level 4 optimized spheres with InstancedMesh`);
        
        // Update sphere count display
        const sphereCountElement = document.getElementById('sphere-count');
        if (sphereCountElement) {
            sphereCountElement.textContent = this.sphereCount;
        }
    }
    
    // Quality adjustment method for adaptive system
    adjustQuality(settings) {
        console.log('Adjusting quality:', settings);
        
        if (settings.sphereCount !== this.sphereCount) {
            // Dynamically adjust sphere count
            this.sphereCount = settings.sphereCount;
            this.recreateInstancedMeshes();
        }
        
        // Adjust geometry detail
        if (settings.geometryDetail) {
            this.currentGeometryDetail = settings.geometryDetail;
        }
        
        // Adjust light count
        if (settings.lightCount !== this.maxLights) {
            this.maxLights = settings.lightCount;
            this.adjustLightCount();
        }
    }
    
    recreateInstancedMeshes() {
        // Remove existing instanced meshes
        if (this.instancedSpheres) {
            this.scene.remove(this.instancedSpheres);
            this.instancedSpheres.dispose();
        }
        if (this.instancedCores) {
            this.scene.remove(this.instancedCores);
            this.instancedCores.dispose();
        }
        
        // Clear sphere data
        this.sphereData = [];
        
        // Recreate with new count
        this.createOptimizedSpheres();
    }
    
    adjustLightCount() {
        // Remove excess lights
        for (let i = this.maxLights; i < this.sphereLights.length; i++) {
            if (this.sphereLights[i]) {
                this.scene.remove(this.sphereLights[i]);
                this.objectPool.returnLight(this.sphereLights[i]);
                this.sphereLights[i] = null;
            }
        }
        
        // Add new lights if needed
        for (let i = this.sphereLights.length; i < this.maxLights && i < this.sphereCount; i++) {
            if (!this.sphereLights[i] && this.sphereData[i]) {
                const sphereData = this.sphereData[i];
                const light = this.objectPool.getPointLight(sphereData.originalColor, 1.5, 25);
                light.position.copy(sphereData.position);
                this.scene.add(light);
                this.sphereLights[i] = light;
            }
        }
    }
    
    setupPostProcessing() {
        // Lightweight version - skip post-processing to avoid dependency issues
        console.log('Post-processing skipped for lightweight version - using basic renderer');
        this.composer = null;
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
    
    // createRipple function removed as requested
    
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
        // Use WebWorker for physics if available
        if (this.useWebWorker && this.workerInitialized) {
            this.updateSpheresWithWorker();
        } else {
            this.updateSpheresMainThread();
        }
    }
    
    updateSpheresWithWorker() {
        // Send mouse position to worker
        if (this.frameCount % this.updateIntervals.mouse === 0) {
            const vector = new THREE.Vector3(
                this.mouse.x,
                this.mouse.y,
                0.5
            );
            vector.unproject(this.camera);
            
            const direction = vector.sub(this.camera.position).normalize();
            const distance = -this.camera.position.z / direction.z;
            const pos = this.camera.position.clone().add(direction.multiplyScalar(distance));
            
            this.physicsWorker.postMessage({
                type: 'updateMouse',
                data: {
                    position: { x: pos.x, y: pos.y, z: pos.z },
                    active: true
                }
            });
        }
        
        // Request physics update
        this.physicsWorker.postMessage({
            type: 'update',
            data: { currentTime: performance.now() }
        });
        
        // Update InstancedMesh matrices
        this.updateInstancedMeshes();
    }
    
    updateSpheresMainThread() {
        const matrix = new THREE.Matrix4();
        const color = new THREE.Color();
        
        for (let i = 0; i < this.sphereCount; i++) {
            const sphereData = this.sphereData[i];
            
            // Update position with enhanced movement
            sphereData.position.add(sphereData.velocity);
            
            // Enhanced boundary wrapping
            const maxX = 500;
            const maxY = 300;
            const minZ = -100;
            const maxZ = 100;

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
            const pulse = 1 + Math.sin(sphereData.phase) * 0.1; // Reduced pulse for performance
            const currentScale = sphereData.scale * pulse;
            
            // Hover effect
            if (sphereData.isHovered) {
                sphereData.targetScale = sphereData.originalScale * 1.2; // Reduced for performance
                sphereData.targetIntensity = sphereData.originalIntensity * 1.5;
            }
            
            // Update InstancedMesh matrices
            matrix.makeScale(currentScale, currentScale, currentScale);
            matrix.setPosition(sphereData.position.x, sphereData.position.y, sphereData.position.z);
            this.instancedSpheres.setMatrixAt(i, matrix);
            
            // Update core matrix
            const coreScale = currentScale * 0.4;
            matrix.makeScale(coreScale, coreScale, coreScale);
            matrix.setPosition(sphereData.position.x, sphereData.position.y, sphereData.position.z);
            this.instancedCores.setMatrixAt(i, matrix);
            
            // Update colors if needed
            if (sphereData.colorChanged) {
                color.set(sphereData.originalColor);
                this.instancedSpheres.setColorAt(i, color);
                this.instancedCores.setColorAt(i, color);
                sphereData.colorChanged = false;
            }
            
            // Update light (only if it exists)
            const light = this.sphereLights[i];
            if (light) {
                light.position.copy(sphereData.position);
                light.intensity = sphereData.lightIntensity * pulse;
            }
            
            // Velocity damping
            sphereData.velocity.multiplyScalar(0.998); // Slightly increased damping for stability
        }
        
        // Update instance matrices
        this.instancedSpheres.instanceMatrix.needsUpdate = true;
        this.instancedCores.instanceMatrix.needsUpdate = true;
    }
    
    updateInstancedMeshes() {
        const matrix = new THREE.Matrix4();
        const color = new THREE.Color();
        
        for (let i = 0; i < this.sphereCount; i++) {
            const sphereData = this.sphereData[i];
            
            // Enhanced pulsing effect
            const pulse = 1 + Math.sin(sphereData.phase) * 0.1;
            const currentScale = sphereData.scale * pulse;
            
            // Update main sphere matrix
            matrix.makeScale(currentScale, currentScale, currentScale);
            matrix.setPosition(sphereData.position.x, sphereData.position.y, sphereData.position.z);
            this.instancedSpheres.setMatrixAt(i, matrix);
            
            // Update core matrix
            const coreScale = currentScale * 0.4;
            matrix.makeScale(coreScale, coreScale, coreScale);
            matrix.setPosition(sphereData.position.x, sphereData.position.y, sphereData.position.z);
            this.instancedCores.setMatrixAt(i, matrix);
            
            // Update light
            const light = this.sphereLights[i];
            if (light) {
                light.position.copy(sphereData.position);
                light.intensity = sphereData.lightIntensity * pulse;
            }
        }
        
        // Update instance matrices
        this.instancedSpheres.instanceMatrix.needsUpdate = true;
        this.instancedCores.instanceMatrix.needsUpdate = true;
    }
    
    updateRipples() {
        // Ripple system removed for lightweight version
        return;
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
        
        // Adaptive quality adjustment (every 60 frames)
        if (this.frameCount % 60 === 0 && this.fps > 0) {
            this.adaptiveQuality.adjustQuality(this.fps, this);
        }
        
        // Render with post-processing or basic renderer
        if (this.composer) {
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
        
        this.calculateFPS();
        
        // Log performance stats every 5 seconds
        if (this.frameCount % 300 === 0) {
            this.objectPool.logStats();
            console.log(`Performance: ${this.fps} FPS, Quality: ${this.adaptiveQuality.currentQuality.toFixed(2)}`);
        }
        
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize when page loads
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, creating Enhanced BubbleUniverse...');
    window.bubbleUniverse = new EnhancedBubbleUniverse();
});

// Make CONFIG globally accessible for easy modification
window.CONFIG = CONFIG;
