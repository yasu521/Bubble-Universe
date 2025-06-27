// Physics Worker for Enhanced Bubble Universe
// Handles all physics calculations in a separate thread

class PhysicsWorker {
    constructor() {
        this.sphereData = [];
        this.time = 0;
        this.deltaTime = 0;
        this.lastTime = 0;
        
        // Spatial configuration
        this.maxX = 500;
        this.maxY = 300;
        this.minZ = -100;
        this.maxZ = 100;
        
        // Mouse interaction data
        this.mousePosition = { x: 0, y: 0, z: 0 };
        this.mouseActive = false;
    }
    
    initializeSpheres(sphereDataArray) {
        this.sphereData = sphereDataArray.map(data => ({
            position: { ...data.position },
            velocity: { ...data.velocity },
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
            index: data.index || 0
        }));
    }
    
    updateMousePosition(mouseData) {
        this.mousePosition = mouseData.position;
        this.mouseActive = mouseData.active;
    }
    
    updatePhysics(currentTime) {
        this.deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        this.time += 0.016;
        
        const results = [];
        
        for (let i = 0; i < this.sphereData.length; i++) {
            const sphereData = this.sphereData[i];
            
            // Update position with enhanced movement
            sphereData.position.x += sphereData.velocity.x;
            sphereData.position.y += sphereData.velocity.y;
            sphereData.position.z += sphereData.velocity.z;
            
            // Enhanced boundary wrapping
            if (sphereData.position.x > this.maxX) sphereData.position.x = -this.maxX;
            if (sphereData.position.x < -this.maxX) sphereData.position.x = this.maxX;
            if (sphereData.position.y > this.maxY) sphereData.position.y = -this.maxY;
            if (sphereData.position.y < -this.maxY) sphereData.position.y = this.maxY;
            if (sphereData.position.z > this.maxZ) sphereData.position.z = this.minZ;
            if (sphereData.position.z < this.minZ) sphereData.position.z = this.maxZ;
            
            // Update phase for pulsing
            sphereData.phase += sphereData.pulseSpeed;
            
            // Mouse interaction
            if (this.mouseActive) {
                const dx = this.mousePosition.x - sphereData.position.x;
                const dy = this.mousePosition.y - sphereData.position.y;
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
            
            // Smooth transitions
            sphereData.scale += (sphereData.targetScale - sphereData.scale) * 0.08;
            sphereData.lightIntensity += (sphereData.targetIntensity - sphereData.lightIntensity) * 0.08;
            
            // Enhanced pulsing effect
            const pulse = 1 + Math.sin(sphereData.phase) * 0.15;
            const currentScale = sphereData.scale * pulse;
            
            // Velocity damping
            sphereData.velocity.x *= 0.995;
            sphereData.velocity.y *= 0.995;
            sphereData.velocity.z *= 0.995;
            
            // Prepare result data
            results.push({
                index: i,
                position: { ...sphereData.position },
                scale: currentScale,
                lightIntensity: sphereData.lightIntensity * pulse,
                phase: sphereData.phase
            });
        }
        
        return results;
    }
    
    // Collision detection (advanced feature)
    detectCollisions() {
        const collisions = [];
        
        for (let i = 0; i < this.sphereData.length; i++) {
            for (let j = i + 1; j < this.sphereData.length; j++) {
                const sphere1 = this.sphereData[i];
                const sphere2 = this.sphereData[j];
                
                const dx = sphere1.position.x - sphere2.position.x;
                const dy = sphere1.position.y - sphere2.position.y;
                const dz = sphere1.position.z - sphere2.position.z;
                const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
                
                const minDistance = (sphere1.scale + sphere2.scale) * 0.8;
                
                if (distance < minDistance) {
                    collisions.push({
                        sphere1: i,
                        sphere2: j,
                        distance: distance,
                        normal: {
                            x: dx / distance,
                            y: dy / distance,
                            z: dz / distance
                        }
                    });
                }
            }
        }
        
        return collisions;
    }
}

// Worker message handling
const physicsWorker = new PhysicsWorker();

self.onmessage = function(e) {
    const { type, data } = e.data;
    
    switch (type) {
        case 'init':
            physicsWorker.initializeSpheres(data.sphereData);
            self.postMessage({ type: 'initialized' });
            break;
            
        case 'updateMouse':
            physicsWorker.updateMousePosition(data);
            break;
            
        case 'update':
            const results = physicsWorker.updatePhysics(data.currentTime);
            self.postMessage({
                type: 'physicsUpdate',
                data: results
            });
            break;
            
        case 'detectCollisions':
            const collisions = physicsWorker.detectCollisions();
            self.postMessage({
                type: 'collisions',
                data: collisions
            });
            break;
            
        default:
            console.warn('Unknown message type:', type);
    }
};
