/**
 * Interactive Digital Developer Space Background
 * Powered by Three.js
 * 
 * Features:
 * - 3D Perspective Digital Floor Grid with horizon fog
 * - Dynamic Floating Particle System with custom radial luminescence
 * - Subtle Geometric Wireframe Nodes (Developer Space / Matrix motif)
 * - Damped Mouse Parallax & Dynamic Light Movement
 * - Smooth Scroll-based 3D Spatial Traversal
 * - Mobile Optimization, Reduced Motion Support, and Tab Visibility Throttling
 */

(function () {
    'use strict';

    // Check if Three.js is loaded
    if (typeof THREE === 'undefined') {
        console.warn('Three.js not found. Background space animation aborted.');
        return;
    }

    // Configuration & State
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;

    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth <= 768 || isTouchDevice;

    const CONFIG = {
        bgColor: 0x050811,
        fogDensity: 0.02,
        gridColorCenter: 0x3b82f6,
        gridColorGrid: 0x162a45,
        gridSize: 140,
        gridDivisions: isMobile ? 35 : 70,
        gridY: -4.5,
        particleCount: isMobile ? 120 : 450,
        particleColorBase: 0x60a5fa,
        accentLightColor: 0x3b82f6,
        ambientColor: 0x0d1b2a,
        cameraFov: 60,
        mouseSensitivity: isMobile ? 0.0 : 0.6,
        scrollSensitivity: 14.0
    };

    let scene, camera, renderer;
    let gridHelper, gridFloor2;
    let particleSystem, particlePositions, particleInitialData;
    let wireframeNodes = [];
    let pointLight, ambientLight;
    let isRunning = true;
    let animationFrameId = null;

    // Mouse & Scroll State (with smooth interpolation)
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const scroll = { current: 0, target: 0, progress: 0 };

    /**
     * Create a soft circular glowing texture for particles
     */
    function createParticleTexture() {
        const size = 64;
        const textureCanvas = document.createElement('canvas');
        textureCanvas.width = size;
        textureCanvas.height = size;
        const ctx = textureCanvas.getContext('2d');

        const center = size / 2;
        const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
        gradient.addColorStop(0.0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.15, 'rgba(147, 197, 253, 0.9)');
        gradient.addColorStop(0.4, 'rgba(59, 130, 246, 0.35)');
        gradient.addColorStop(0.8, 'rgba(29, 78, 216, 0.08)');
        gradient.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);

        const texture = new THREE.CanvasTexture(textureCanvas);
        texture.needsUpdate = true;
        return texture;
    }

    /**
     * Initialize Three.js Scene, Camera, Lights, and Renderer
     */
    function initScene() {
        // 1. Scene & Fog
        scene = new THREE.Scene();
        scene.background = new THREE.Color(CONFIG.bgColor);
        scene.fog = new THREE.FogExp2(CONFIG.bgColor, CONFIG.fogDensity);

        // 2. Camera
        camera = new THREE.PerspectiveCamera(
            CONFIG.cameraFov,
            window.innerWidth / window.innerHeight,
            0.1,
            200
        );
        camera.position.set(0, 1.0, 14);

        // 3. Renderer
        renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: !isMobile,
            powerPreference: 'high-performance',
            alpha: false
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));

        // 4. Lighting
        ambientLight = new THREE.AmbientLight(CONFIG.ambientColor, 1.8);
        scene.add(ambientLight);

        pointLight = new THREE.PointLight(CONFIG.accentLightColor, 2.5, 40, 1.8);
        pointLight.position.set(0, 4, 8);
        scene.add(pointLight);

        const secondaryLight = new THREE.PointLight(0x1d4ed8, 1.5, 50, 2);
        secondaryLight.position.set(-15, -2, -5);
        scene.add(secondaryLight);
    }

    /**
     * Build the 3D Perspective Digital Floor Grid
     */
    function buildPerspectiveGrid() {
        const gridGroup = new THREE.Group();

        // Primary floor grid
        gridHelper = new THREE.GridHelper(
            CONFIG.gridSize,
            CONFIG.gridDivisions,
            CONFIG.gridColorCenter,
            CONFIG.gridColorGrid
        );
        gridHelper.position.y = CONFIG.gridY;
        if (gridHelper.material) {
            gridHelper.material.transparent = true;
            gridHelper.material.opacity = 0.38;
            gridHelper.material.depthWrite = false;
        }
        gridGroup.add(gridHelper);

        // Subtle upper ceiling grid (creates full digital room corridor perspective)
        gridFloor2 = new THREE.GridHelper(
            CONFIG.gridSize,
            Math.floor(CONFIG.gridDivisions * 0.75),
            0x1e3a8a,
            0x0f172a
        );
        gridFloor2.position.y = 12.0;
        if (gridFloor2.material) {
            gridFloor2.material.transparent = true;
            gridFloor2.material.opacity = 0.15;
            gridFloor2.material.depthWrite = false;
        }
        gridGroup.add(gridFloor2);

        scene.add(gridGroup);
    }

    /**
     * Build Particle Field with custom luminescence and floating dynamics
     */
    function buildParticleSystem() {
        const count = CONFIG.particleCount;
        const geometry = new THREE.BufferGeometry();
        particlePositions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const scales = new Float32Array(count);
        particleInitialData = [];

        const colorPalette = [
            new THREE.Color(0x93c5fd), // Soft cyan blue
            new THREE.Color(0x60a5fa), // Electric blue
            new THREE.Color(0x3b82f6), // Pure blue
            new THREE.Color(0xc7d2fe), // Soft lavender white
            new THREE.Color(0x38bdf8)  // Sky blue
        ];

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            // Distribute across 3D bounding box
            const x = (Math.random() - 0.5) * 55;
            const y = (Math.random() - 0.5) * 28;
            const z = (Math.random() - 0.5) * 60 - 5;

            particlePositions[i3] = x;
            particlePositions[i3 + 1] = y;
            particlePositions[i3 + 2] = z;

            const chosenColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];
            colors[i3] = chosenColor.r;
            colors[i3 + 1] = chosenColor.g;
            colors[i3 + 2] = chosenColor.b;

            scales[i] = Math.random() * 0.8 + 0.4;

            particleInitialData.push({
                x, y, z,
                speedY: (Math.random() * 0.008 + 0.003) * (Math.random() < 0.5 ? 1 : -1),
                speedX: (Math.random() * 0.004 + 0.001) * (Math.random() < 0.5 ? 1 : -1),
                offset: Math.random() * Math.PI * 2
            });
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: isMobile ? 1.2 : 1.8,
            map: createParticleTexture(),
            vertexColors: true,
            transparent: true,
            opacity: 0.65,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        particleSystem = new THREE.Points(geometry, material);
        scene.add(particleSystem);
    }

    /**
     * Build subtle floating geometric wireframes (Developer Nodes)
     */
    function buildWireframeNodes() {
        if (isMobile) return; // Skip extra geometries on small mobile devices

        const nodeConfigs = [
            {
                geo: new THREE.IcosahedronGeometry(2.2, 0),
                pos: [-16, 3, -12],
                rotSpeed: { x: 0.002, y: 0.003, z: 0.001 },
                opacity: 0.15,
                color: 0x3b82f6
            },
            {
                geo: new THREE.OctahedronGeometry(1.6, 0),
                pos: [18, -1.5, -8],
                rotSpeed: { x: -0.002, y: 0.004, z: 0.002 },
                opacity: 0.18,
                color: 0x60a5fa
            },
            {
                geo: new THREE.DodecahedronGeometry(1.8, 0),
                pos: [-12, -3, -2],
                rotSpeed: { x: 0.003, y: -0.002, z: 0.003 },
                opacity: 0.12,
                color: 0x2563eb
            }
        ];

        nodeConfigs.forEach(cfg => {
            const wireframe = new THREE.WireframeGeometry(cfg.geo);
            const lineMat = new THREE.LineBasicMaterial({
                color: cfg.color,
                transparent: true,
                opacity: cfg.opacity,
                depthWrite: false
            });
            const line = new THREE.LineSegments(wireframe, lineMat);
            line.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
            line.userData = {
                rotSpeed: cfg.rotSpeed,
                initialY: cfg.pos[1],
                floatOffset: Math.random() * Math.PI * 2
            };

            wireframeNodes.push(line);
            scene.add(line);
        });
    }

    /**
     * Event Listeners (Resize, Mouse, Scroll, Visibility, Reduced Motion)
     */
    function setupEventListeners() {
        // Window Resize
        window.addEventListener('resize', onWindowResize, { passive: true });

        // Mouse Movement (Parallax)
        if (!isTouchDevice) {
            window.addEventListener('mousemove', (e) => {
                mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
                mouse.targetY = -(e.clientY / window.innerHeight - 0.5) * 2;
            }, { passive: true });

            window.addEventListener('mouseleave', () => {
                mouse.targetX = 0;
                mouse.targetY = 0;
            });
        }

        // Scroll Tracking
        function updateScroll() {
            const maxScroll = Math.max(
                document.documentElement.scrollHeight - window.innerHeight,
                1
            );
            scroll.target = window.pageYOffset || document.documentElement.scrollTop || 0;
            scroll.progress = Math.min(Math.max(scroll.target / maxScroll, 0), 1);
        }
        window.addEventListener('scroll', updateScroll, { passive: true });
        updateScroll();

        // Visibility Change (Pause rendering when tab inactive)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                isRunning = false;
                if (animationFrameId) cancelAnimationFrame(animationFrameId);
            } else {
                isRunning = true;
                lastTime = performance.now();
                animate();
            }
        });
    }

    function onWindowResize() {
        if (!camera || !renderer) return;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    }

    /**
     * Main Animation & Render Loop
     */
    let lastTime = performance.now();

    function animate() {
        if (!isRunning) return;
        animationFrameId = requestAnimationFrame(animate);

        const now = performance.now();
        const delta = Math.min((now - lastTime) / 1000, 0.1); // Cap delta to avoid jumps
        lastTime = now;
        const time = now * 0.001;

        // Smooth Interpolation for Mouse and Scroll
        const lerpFactor = 0.05;
        mouse.x += (mouse.targetX - mouse.x) * lerpFactor;
        mouse.y += (mouse.targetY - mouse.y) * lerpFactor;
        scroll.current += (scroll.target - scroll.current) * lerpFactor;

        // 1. Camera & Scene Dynamics
        if (!prefersReducedMotion) {
            // Subtle camera parallax based on mouse
            const camTargetX = mouse.x * CONFIG.mouseSensitivity * 1.8;
            const camTargetY = 1.0 + (mouse.y * CONFIG.mouseSensitivity * 0.9) - (scroll.progress * 2.5);
            const camTargetZ = 14.0 - (scroll.progress * CONFIG.scrollSensitivity * 0.4);

            camera.position.x += (camTargetX - camera.position.x) * 0.05;
            camera.position.y += (camTargetY - camera.position.y) * 0.05;
            camera.position.z += (camTargetZ - camera.position.z) * 0.05;

            camera.lookAt(
                mouse.x * 0.5,
                (scroll.progress * -2.0),
                -10
            );

            // 2. Light Movement (Follows mouse subtly)
            if (pointLight) {
                pointLight.position.x = mouse.x * 8;
                pointLight.position.y = 4 + mouse.y * 3;
            }

            // 3. Grid Forward Motion & Perspective Flow
            if (gridHelper) {
                const gridOffset = (time * 0.8 + scroll.current * 0.015) % (CONFIG.gridSize / CONFIG.gridDivisions);
                gridHelper.position.z = gridOffset;
                if (gridFloor2) {
                    gridFloor2.position.z = -gridOffset;
                }
            }

            // 4. Update Particles
            if (particleSystem && particlePositions && particleInitialData) {
                const positions = particleSystem.geometry.attributes.position.array;
                const count = CONFIG.particleCount;

                for (let i = 0; i < count; i++) {
                    const i3 = i * 3;
                    const data = particleInitialData[i];

                    // Floating motion
                    positions[i3 + 1] = data.y + Math.sin(time * 0.8 + data.offset) * 0.8;
                    positions[i3] = data.x + Math.cos(time * 0.5 + data.offset) * 0.4 + (mouse.x * 0.8);

                    // Move slowly along Z-axis (towards camera)
                    positions[i3 + 2] += (0.6 + data.speedY * 20) * delta;
                    if (positions[i3 + 2] > 18) {
                        positions[i3 + 2] = -50;
                    }
                }
                particleSystem.geometry.attributes.position.needsUpdate = true;
            }

            // 5. Rotate Wireframe Nodes
            for (let i = 0; i < wireframeNodes.length; i++) {
                const node = wireframeNodes[i];
                node.rotation.x += node.userData.rotSpeed.x;
                node.rotation.y += node.userData.rotSpeed.y;
                node.rotation.z += node.userData.rotSpeed.z;
                node.position.y = node.userData.initialY + Math.sin(time + node.userData.floatOffset) * 0.4;
            }
        }

        // Render
        renderer.render(scene, camera);
    }

    /**
     * Entry Point Initialization
     */
    function init() {
        initScene();
        buildPerspectiveGrid();
        buildParticleSystem();
        buildWireframeNodes();
        setupEventListeners();
        lastTime = performance.now();
        animate();
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
