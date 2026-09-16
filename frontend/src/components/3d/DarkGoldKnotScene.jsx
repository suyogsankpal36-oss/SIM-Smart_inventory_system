import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * DarkGoldKnotScene
 * 
 * High-end production "Dark Gold" interactive animation using Three.js.
 * 
 * Specifications:
 * - Void aesthetic: #070709 with imperial gold #C59D3F / #D4AF37
 * - Material: PBR MeshPhysicalMaterial (metalness: 0.96, roughness: 0.22, clearcoat: 0.7, clearcoatRoughness: 0.15, reflectivity: 0.95, emissive: #1F1404)
 * - Geometry: Organic morphing Torus Knot with floating thin orbital rings
 * - 3-Point Studio Lighting: Warm golden key (#FFF0C4, 3.2), cool obsidian rim (#7FA2C4, 2.5), dynamic orbiting specular point light (#F7D268, 2.8)
 * - Procedural HDR studio environment map with ACESFilmicToneMapping & exposure: 1.35
 * - 750+ floating additive golden stardust / bokeh micro-particles with organic vertical drift
 * - Interactivity: Smooth lerped mouse parallax, drag-to-rotate with inertia, responsive canvas resizing
 */
export default function DarkGoldKnotScene({
  mode = "hero", // "hero" (interactive with drag & controls) | "ambient" (background layer)
  className = "",
  style = {},
  enableDrag = true,
  enableParallax = true,
  autoRotate = true,
  rotationSpeed = 1.0,
  autoRotateSpeed,
  knotScale = 1.0,
  knotPosition,
  displacementAmp = 0.045,
  responsiveOffset = false,
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // --- 1. Scene & Camera Setup ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x070709, mode === "ambient" ? 0.04 : 0.025);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, mode === "ambient" ? 11 : 7.2);

    // --- 2. WebGL Renderer with High-End Color Grading ---
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // --- 3. Procedural Studio Environment Map ---
    // Generates a soft dual-tone studio gradient radiance map for metallic reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    const envCanvas = document.createElement("canvas");
    envCanvas.width = 512;
    envCanvas.height = 256;
    const ctx = envCanvas.getContext("2d");
    if (ctx) {
      // Dark studio gradient with warm golden overhead softbox and cool rim
      const grad = ctx.createLinearGradient(0, 0, 512, 256);
      grad.addColorStop(0, "#0c0d14");
      grad.addColorStop(0.3, "#2a1e0b");
      grad.addColorStop(0.5, "#fff0c4"); // Warm key highlight
      grad.addColorStop(0.7, "#171c26"); // Cool ambient fill
      grad.addColorStop(1, "#070709");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 256);

      // Studio overhead light strip
      ctx.fillStyle = "rgba(255, 235, 170, 0.85)";
      ctx.beginPath();
      ctx.ellipse(256, 40, 160, 30, 0, 0, Math.PI * 2);
      ctx.fill();

      // Side accent softbox
      ctx.fillStyle = "rgba(127, 162, 196, 0.5)";
      ctx.beginPath();
      ctx.ellipse(440, 160, 60, 90, 0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    const envTexture = new THREE.CanvasTexture(envCanvas);
    envTexture.mapping = THREE.EquirectangularReflectionMapping;
    const envMap = pmremGenerator.fromEquirectangular(envTexture).texture;
    scene.environment = envMap;
    pmremGenerator.dispose();
    envTexture.dispose();

    // --- 4. PBR Imperial Gold Material ---
    const goldMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xc59d3f),
      metalness: 0.96,
      roughness: 0.22,
      clearcoat: 0.7,
      clearcoatRoughness: 0.15,
      reflectivity: 0.95,
      emissive: new THREE.Color(0x1f1404),
      envMapIntensity: 1.4,
    });

    const ringMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xd4af37),
      metalness: 0.98,
      roughness: 0.18,
      clearcoat: 0.9,
      clearcoatRoughness: 0.1,
      reflectivity: 1.0,
      emissive: new THREE.Color(0x281a06),
      envMapIntensity: 1.6,
    });

    // --- 5. Geometry: Torus Knot with Floating Orbital Rings ---
    const getKnotPos = (w) => {
      if (knotPosition) return knotPosition;
      if (responsiveOffset && w >= 860) {
        return [-2.1, 0, 0];
      }
      return [0, 0, 0];
    };

    const rootGroup = new THREE.Group();
    const [initKx, initKy, initKz] = getKnotPos(width);
    rootGroup.position.set(initKx, initKy, initKz);
    scene.add(rootGroup);

    // Torus Knot geometry with high segment density for silky PBR sheen
    const knotGeom = new THREE.TorusKnotGeometry(1.45 * knotScale, 0.44 * knotScale, 220, 34, 2, 3);
    const knotMesh = new THREE.Mesh(knotGeom, goldMaterial);
    rootGroup.add(knotMesh);

    // Store original knot position attributes for organic undulating morphing
    const posAttr = knotGeom.attributes.position;
    const origPositions = new Float32Array(posAttr.array);

    // Orbital Ring 1 (Equatorial tilt)
    const ring1Geom = new THREE.TorusGeometry(2.55 * knotScale, 0.024 * knotScale, 16, 120);
    const ring1Mesh = new THREE.Mesh(ring1Geom, ringMaterial);
    ring1Mesh.rotation.x = Math.PI / 3;
    ring1Mesh.rotation.y = Math.PI / 6;
    rootGroup.add(ring1Mesh);

    // Orbital Ring 2 (Polar counter-tilt)
    const ring2Geom = new THREE.TorusGeometry(2.95 * knotScale, 0.018 * knotScale, 16, 120);
    const ring2Mesh = new THREE.Mesh(ring2Geom, ringMaterial);
    ring2Mesh.rotation.x = -Math.PI / 4;
    ring2Mesh.rotation.z = Math.PI / 5;
    rootGroup.add(ring2Mesh);

    // Orbital Ring 3 (Outer whispering ring)
    const ring3Geom = new THREE.TorusGeometry(3.35 * knotScale, 0.012 * knotScale, 16, 120);
    const ring3Mesh = new THREE.Mesh(ring3Geom, ringMaterial);
    ring3Mesh.rotation.y = Math.PI / 2.5;
    rootGroup.add(ring3Mesh);

    // --- 6. Studio 3-Point Lighting Setup ---
    // Warm Golden Key Light
    const keyLight = new THREE.DirectionalLight(0xfff0c4, 3.2);
    keyLight.position.set(5, 6, 5);
    scene.add(keyLight);

    // Cool Obsidian/Slate Rim Light for silhouette separation
    const rimLight = new THREE.DirectionalLight(0x7fa2c4, 2.5);
    rimLight.position.set(-6, -4, -4);
    scene.add(rimLight);

    // Dynamic Orbiting Specular Point Light
    const orbitingLight = new THREE.PointLight(0xf7d268, 2.8, 14);
    scene.add(orbitingLight);

    // Orbiting light glow helper orb
    const lightSphereGeom = new THREE.SphereGeometry(0.06, 12, 12);
    const lightSphereMat = new THREE.MeshBasicMaterial({ color: 0xffe680 });
    const lightOrb = new THREE.Mesh(lightSphereGeom, lightSphereMat);
    orbitingLight.add(lightOrb);

    // Gentle base ambient light
    const ambientLight = new THREE.AmbientLight(0x1a150a, 1.2);
    scene.add(ambientLight);

    // --- 7. 750+ Floating Additive Golden Stardust Particles ---
    const particleCount = mode === "ambient" ? 850 : 750;
    const particleGeom = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleVelocities = new Float32Array(particleCount * 3);
    const particleScales = new Float32Array(particleCount);

    // Create a circular soft glow particle texture
    const particleCanvas = document.createElement("canvas");
    particleCanvas.width = 64;
    particleCanvas.height = 64;
    const pCtx = particleCanvas.getContext("2d");
    if (pCtx) {
      const pGrad = pCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
      pGrad.addColorStop(0, "rgba(255, 235, 170, 1)");
      pGrad.addColorStop(0.2, "rgba(212, 175, 55, 0.8)");
      pGrad.addColorStop(0.55, "rgba(197, 157, 63, 0.3)");
      pGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      pCtx.fillStyle = pGrad;
      pCtx.fillRect(0, 0, 64, 64);
    }
    const particleTexture = new THREE.CanvasTexture(particleCanvas);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const radius = 2.5 + Math.random() * 6.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;

      particlePositions[i3] = radius * Math.cos(phi) * Math.cos(theta);
      particlePositions[i3 + 1] = radius * Math.sin(phi);
      particlePositions[i3 + 2] = radius * Math.cos(phi) * Math.sin(theta);

      particleVelocities[i3] = (Math.random() - 0.5) * 0.003;
      particleVelocities[i3 + 1] = 0.002 + Math.random() * 0.004; // Organic upward drift
      particleVelocities[i3 + 2] = (Math.random() - 0.5) * 0.003;

      particleScales[i] = 0.5 + Math.random() * 1.5;
    }

    particleGeom.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));

    const particleMat = new THREE.PointsMaterial({
      size: mode === "ambient" ? 0.07 : 0.085,
      map: particleTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: new THREE.Color(0xf6d365),
      opacity: 0.85,
    });

    const particles = new THREE.Points(particleGeom, particleMat);
    scene.add(particles);

    // --- 8. Interactivity: Mouse Parallax & Drag to Rotate ---
    let mouseX = 0;
    let mouseY = 0;
    let targetParallaxX = 0;
    let targetParallaxY = 0;
    let currentParallaxX = 0;
    let currentParallaxY = 0;

    let isDragging = false;
    let previousPointerX = 0;
    let previousPointerY = 0;
    let dragVelocityX = 0;
    let dragVelocityY = 0;

    const handlePointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      if (enableParallax) {
        targetParallaxX = x * 0.6;
        targetParallaxY = y * 0.45;
      }

      if (isDragging && enableDrag) {
        const deltaX = e.clientX - previousPointerX;
        const deltaY = e.clientY - previousPointerY;
        previousPointerX = e.clientX;
        previousPointerY = e.clientY;

        dragVelocityX = deltaX * 0.008;
        dragVelocityY = deltaY * 0.008;

        rootGroup.rotation.y += dragVelocityX;
        rootGroup.rotation.x += dragVelocityY;
      }
    };

    const handlePointerDown = (e) => {
      if (!enableDrag) return;
      isDragging = true;
      previousPointerX = e.clientX;
      previousPointerY = e.clientY;
      dragVelocityX = 0;
      dragVelocityY = 0;
    };

    const handlePointerUp = () => {
      isDragging = false;
    };

    if (enableDrag) {
      container.addEventListener("pointerdown", handlePointerDown);
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    } else if (enableParallax) {
      window.addEventListener("pointermove", handlePointerMove);
    }

    // --- 9. Responsive Resizing ---
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || window.innerHeight;
      if (width === 0 || height === 0) return;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      const [kx, ky, kz] = getKnotPos(width);
      rootGroup.position.set(kx, ky, kz);
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);

    // --- 10. Animation Loop ---
    let animationFrameId;
    const startTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (document.hidden) return; // Save GPU cycles when tab is unfocused

      const elapsedTime = (performance.now() - startTime) * 0.001;

      // Continuous natural rotation & drag inertia damping
      const effSpeed = (autoRotateSpeed !== undefined ? autoRotateSpeed : rotationSpeed) * (autoRotate ? 1 : 0);
      if (!isDragging) {
        rootGroup.rotation.y += 0.005 * effSpeed + dragVelocityX;
        rootGroup.rotation.x += 0.002 * effSpeed + dragVelocityY;
        dragVelocityX *= 0.94;
        dragVelocityY *= 0.94;
      }

      // Orbital Rings counter-rotations
      ring1Mesh.rotation.z += 0.008;
      ring2Mesh.rotation.y -= 0.006;
      ring3Mesh.rotation.x += 0.004;

      // Orbiting Specular Point Light path
      const lightAngle = elapsedTime * 0.85;
      const lightRadius = 3.8;
      orbitingLight.position.x = Math.cos(lightAngle) * lightRadius;
      orbitingLight.position.y = Math.sin(lightAngle * 0.7) * 2.2;
      orbitingLight.position.z = Math.sin(lightAngle) * lightRadius;

      // Organic geometry morphing (subtle breathing pulse on vertices)
      const currentPos = posAttr.array;
      const vertexCount = posAttr.count;
      const pulseFactor = Math.sin(elapsedTime * 1.5) * displacementAmp;

      for (let i = 0; i < vertexCount; i++) {
        const i3 = i * 3;
        const ox = origPositions[i3];
        const oy = origPositions[i3 + 1];
        const oz = origPositions[i3 + 2];

        // Wave undulation based on distance from center
        const wave = Math.sin(elapsedTime * 2.2 + ox * 1.8 + oy * 1.8) * displacementAmp * 0.8;
        currentPos[i3] = ox * (1 + pulseFactor + wave);
        currentPos[i3 + 1] = oy * (1 + pulseFactor + wave);
        currentPos[i3 + 2] = oz * (1 + pulseFactor + wave);
      }
      posAttr.needsUpdate = true;

      // Golden Stardust particle drift & recycling
      const pPositions = particleGeom.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        pPositions[i3] += particleVelocities[i3];
        pPositions[i3 + 1] += particleVelocities[i3 + 1];
        pPositions[i3 + 2] += particleVelocities[i3 + 2];

        // Reset if drifted beyond bounding bubble
        if (pPositions[i3 + 1] > 6) {
          pPositions[i3 + 1] = -5.5;
        }
      }
      particleGeom.attributes.position.needsUpdate = true;

      // Smooth lerped mouse parallax
      currentParallaxX += (targetParallaxX - currentParallaxX) * 0.05;
      currentParallaxY += (targetParallaxY - currentParallaxY) * 0.05;

      camera.position.x = currentParallaxX;
      camera.position.y = currentParallaxY;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    // --- Cleanup on unmount ---
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();

      if (enableDrag) {
        container.removeEventListener("pointerdown", handlePointerDown);
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
      } else if (enableParallax) {
        window.removeEventListener("pointermove", handlePointerMove);
      }

      knotGeom.dispose();
      goldMaterial.dispose();
      ring1Geom.dispose();
      ring2Geom.dispose();
      ring3Geom.dispose();
      ringMaterial.dispose();
      particleGeom.dispose();
      particleMat.dispose();
      particleTexture.dispose();
      envMap.dispose();
      lightSphereGeom.dispose();
      lightSphereMat.dispose();

      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [mode, enableDrag, enableParallax, autoRotateSpeed, autoRotate, rotationSpeed, knotScale, displacementAmp, responsiveOffset]);

  const baseClass = mode === "ambient" ? "absolute inset-0 z-0 pointer-events-auto" : "relative w-full h-full";

  return (
    <div
      ref={containerRef}
      className={`${baseClass} overflow-hidden select-none ${className}`}
      style={{
        touchAction: enableDrag ? "none" : "auto",
        cursor: enableDrag ? "grab" : "default",
        ...style,
      }}
    />
  );
}
