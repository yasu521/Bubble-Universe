// Object Pool Manager for Enhanced Bubble Universe
// Manages reusable objects to minimize garbage collection

class ObjectPool {
    constructor() {
        this.spherePool = [];
        this.lightPool = [];
        this.materialPool = [];
        this.geometryPool = [];
        this.ripplePool = [];
        
        // Pool statistics
        this.stats = {
            spheresCreated: 0,
            spheresReused: 0,
            lightsCreated: 0,
            lightsReused: 0,
            materialsCreated: 0,
            materialsReused: 0
        };
        
        console.log('ObjectPool initialized');
    }
    
    // Sphere mesh pooling
    getSphere(geometry, material) {
        if (this.spherePool.length > 0) {
            const sphere = this.spherePool.pop();
            sphere.geometry = geometry;
            sphere.material = material;
            sphere.visible = true;
            this.stats.spheresReused++;
            return sphere;
        } else {
            const sphere = new THREE.Mesh(geometry, material);
            this.stats.spheresCreated++;
            return sphere;
        }
    }
    
    returnSphere(sphere) {
        if (sphere) {
            sphere.visible = false;
            sphere.position.set(0, 0, 0);
            sphere.scale.set(1, 1, 1);
            sphere.rotation.set(0, 0, 0);
            this.spherePool.push(sphere);
        }
    }
    
    // Light pooling
    getPointLight(color, intensity, distance) {
        if (this.lightPool.length > 0) {
            const light = this.lightPool.pop();
            light.color.setHex(color);
            light.intensity = intensity;
            light.distance = distance;
            this.stats.lightsReused++;
            return light;
        } else {
            const light = new THREE.PointLight(color, intensity, distance);
            this.stats.lightsCreated++;
            return light;
        }
    }
    
    returnLight(light) {
        if (light) {
            light.intensity = 0;
            light.position.set(0, 0, 0);
            this.lightPool.push(light);
        }
    }
    
    // Material pooling
    getMaterial(type, options = {}) {
        const materialKey = `${type}_${JSON.stringify(options)}`;
        
        if (this.materialPool[materialKey] && this.materialPool[materialKey].length > 0) {
            const material = this.materialPool[materialKey].pop();
            this.stats.materialsReused++;
            return material;
        } else {
            let material;
            switch (type) {
                case 'lambert':
                    material = new THREE.MeshLambertMaterial(options);
                    break;
                case 'basic':
                    material = new THREE.MeshBasicMaterial(options);
                    break;
                case 'physical':
                    material = new THREE.MeshPhysicalMaterial(options);
                    break;
                default:
                    material = new THREE.MeshLambertMaterial(options);
            }
            this.stats.materialsCreated++;
            return material;
        }
    }
    
    returnMaterial(material, type) {
        if (material) {
            const materialKey = `${type}_${JSON.stringify(material.userData || {})}`;
            if (!this.materialPool[materialKey]) {
                this.materialPool[materialKey] = [];
            }
            this.materialPool[materialKey].push(material);
        }
    }
    
    // Geometry pooling
    getGeometry(type, ...params) {
        const geometryKey = `${type}_${params.join('_')}`;
        
        if (this.geometryPool[geometryKey] && this.geometryPool[geometryKey].length > 0) {
            return this.geometryPool[geometryKey].pop();
        } else {
            let geometry;
            switch (type) {
                case 'sphere':
                    geometry = new THREE.SphereGeometry(...params);
                    break;
                case 'ring':
                    geometry = new THREE.RingGeometry(...params);
                    break;
                case 'plane':
                    geometry = new THREE.PlaneGeometry(...params);
                    break;
                default:
                    geometry = new THREE.SphereGeometry(...params);
            }
            return geometry;
        }
    }
    
    returnGeometry(geometry, type, ...params) {
        if (geometry) {
            const geometryKey = `${type}_${params.join('_')}`;
            if (!this.geometryPool[geometryKey]) {
                this.geometryPool[geometryKey] = [];
            }
            this.geometryPool[geometryKey].push(geometry);
        }
    }
    
    // Ripple effect pooling
    getRipple() {
        if (this.ripplePool.length > 0) {
            const ripple = this.ripplePool.pop();
            ripple.radius = 0;
            ripple.opacity = 1;
            ripple.visible = true;
            return ripple;
        } else {
            const rippleGeometry = new THREE.RingGeometry(0, 1, 32);
            const rippleMaterial = new THREE.MeshBasicMaterial({
                transparent: true,
                side: THREE.DoubleSide
            });
            const ripple = new THREE.Mesh(rippleGeometry, rippleMaterial);
            ripple.radius = 0;
            ripple.opacity = 1;
            ripple.maxRadius = 100;
            ripple.speed = 2;
            return ripple;
        }
    }
    
    returnRipple(ripple) {
        if (ripple) {
            ripple.visible = false;
            ripple.position.set(0, 0, 0);
            ripple.scale.set(1, 1, 1);
            this.ripplePool.push(ripple);
        }
    }
    
    // Batch operations
    preAllocate(counts) {
        console.log('Pre-allocating objects...');
        
        // Pre-allocate spheres
        if (counts.spheres) {
            const geometry = new THREE.SphereGeometry(1, 16, 16);
            const material = new THREE.MeshLambertMaterial();
            for (let i = 0; i < counts.spheres; i++) {
                const sphere = new THREE.Mesh(geometry, material);
                sphere.visible = false;
                this.spherePool.push(sphere);
            }
        }
        
        // Pre-allocate lights
        if (counts.lights) {
            for (let i = 0; i < counts.lights; i++) {
                const light = new THREE.PointLight(0xffffff, 0, 30);
                this.lightPool.push(light);
            }
        }
        
        // Pre-allocate ripples
        if (counts.ripples) {
            for (let i = 0; i < counts.ripples; i++) {
                const ripple = this.getRipple();
                this.returnRipple(ripple);
            }
        }
        
        console.log('Pre-allocation complete:', counts);
    }
    
    // Memory management
    cleanup() {
        // Dispose of unused objects
        this.spherePool.forEach(sphere => {
            if (sphere.geometry) sphere.geometry.dispose();
            if (sphere.material) sphere.material.dispose();
        });
        
        this.lightPool.forEach(light => {
            // Lights don't need disposal
        });
        
        Object.values(this.materialPool).forEach(materials => {
            materials.forEach(material => material.dispose());
        });
        
        Object.values(this.geometryPool).forEach(geometries => {
            geometries.forEach(geometry => geometry.dispose());
        });
        
        this.ripplePool.forEach(ripple => {
            if (ripple.geometry) ripple.geometry.dispose();
            if (ripple.material) ripple.material.dispose();
        });
        
        // Clear pools
        this.spherePool = [];
        this.lightPool = [];
        this.materialPool = [];
        this.geometryPool = [];
        this.ripplePool = [];
        
        console.log('ObjectPool cleanup complete');
    }
    
    // Statistics
    getStats() {
        return {
            ...this.stats,
            poolSizes: {
                spheres: this.spherePool.length,
                lights: this.lightPool.length,
                materials: Object.values(this.materialPool).reduce((sum, arr) => sum + arr.length, 0),
                geometries: Object.values(this.geometryPool).reduce((sum, arr) => sum + arr.length, 0),
                ripples: this.ripplePool.length
            }
        };
    }
    
    logStats() {
        const stats = this.getStats();
        console.log('ObjectPool Statistics:', stats);
    }
}

// Adaptive Quality Manager
class AdaptiveQuality {
    constructor() {
        this.targetFPS = 60;
        this.minFPS = 30;
        this.maxFPS = 120;
        
        this.currentQuality = 1.0; // 0.0 to 1.0
        this.qualityLevels = {
            sphereCount: { min: 50, max: 150 },
            geometryDetail: { min: 8, max: 32 },
            lightCount: { min: 5, max: 15 },
            shadowQuality: { min: 256, max: 1024 }
        };
        
        this.adjustmentCooldown = 0;
        this.adjustmentInterval = 60; // frames
        
        console.log('AdaptiveQuality initialized');
    }
    
    adjustQuality(currentFPS, sphereSystem) {
        if (this.adjustmentCooldown > 0) {
            this.adjustmentCooldown--;
            return false;
        }
        
        let adjusted = false;
        
        if (currentFPS < this.targetFPS - 10) {
            // Reduce quality
            this.currentQuality = Math.max(0.1, this.currentQuality - 0.1);
            this.applyQualitySettings(sphereSystem);
            adjusted = true;
            console.log(`Quality reduced to ${this.currentQuality.toFixed(1)} (FPS: ${currentFPS})`);
        } else if (currentFPS > this.targetFPS + 15) {
            // Increase quality
            this.currentQuality = Math.min(1.0, this.currentQuality + 0.05);
            this.applyQualitySettings(sphereSystem);
            adjusted = true;
            console.log(`Quality increased to ${this.currentQuality.toFixed(1)} (FPS: ${currentFPS})`);
        }
        
        if (adjusted) {
            this.adjustmentCooldown = this.adjustmentInterval;
        }
        
        return adjusted;
    }
    
    applyQualitySettings(sphereSystem) {
        const quality = this.currentQuality;
        
        // Adjust sphere count
        const targetSphereCount = Math.floor(
            this.qualityLevels.sphereCount.min + 
            (this.qualityLevels.sphereCount.max - this.qualityLevels.sphereCount.min) * quality
        );
        
        // Adjust geometry detail
        const geometryDetail = Math.floor(
            this.qualityLevels.geometryDetail.min + 
            (this.qualityLevels.geometryDetail.max - this.qualityLevels.geometryDetail.min) * quality
        );
        
        // Adjust light count
        const lightCount = Math.floor(
            this.qualityLevels.lightCount.min + 
            (this.qualityLevels.lightCount.max - this.qualityLevels.lightCount.min) * quality
        );
        
        // Apply settings to sphere system
        if (sphereSystem) {
            sphereSystem.adjustQuality({
                sphereCount: targetSphereCount,
                geometryDetail: geometryDetail,
                lightCount: lightCount,
                quality: quality
            });
        }
    }
    
    getQualityInfo() {
        return {
            currentQuality: this.currentQuality,
            targetFPS: this.targetFPS,
            qualityLevels: this.qualityLevels
        };
    }
}

// Export for use in main script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ObjectPool, AdaptiveQuality };
}
