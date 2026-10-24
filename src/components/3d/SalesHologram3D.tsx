import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Maximize2, RotateCw, Eye, Sliders, ChevronDown, ChevronUp } from 'lucide-react';

interface SalesHologram3DProps {
  currentRevenue?: number;
  growthPct?: number | null;
  className?: string;
}

export const SalesHologram3D: React.FC<SalesHologram3DProps> = ({
  currentRevenue = 284500,
  growthPct = 14.8,
  className = ''
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webglSupported, setWebglSupported] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [wireframeMode, setWireframeMode] = useState(false);
  const [cameraView, setCameraView] = useState<'iso' | 'front' | 'top'>('iso');
  const [isControlsOpen, setIsControlsOpen] = useState(false);

  // References for live 3D updates without canvas teardown
  const stateRef = useRef({
    speedMultiplier: 1,
    wireframeMode: false,
    cameraView: 'iso' as 'iso' | 'front' | 'top',
    pointerX: 0,
    pointerY: 0,
    isTabVisible: true
  });

  useEffect(() => {
    stateRef.current.speedMultiplier = speedMultiplier;
    stateRef.current.wireframeMode = wireframeMode;
    stateRef.current.cameraView = cameraView;
  }, [speedMultiplier, wireframeMode, cameraView]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect WebGL support
    const probe = document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl');
    if (!probe) {
      setWebglSupported(false);
      return;
    }

    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    let width = container.clientWidth || 600;
    let height = container.clientHeight || 280;

    // Scene & Camera
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x070b14, 0.04);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(4.5, 3.2, 5.0);
    camera.lookAt(0, 0, 0);

    // Renderer
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
        alpha: true
      });
    } catch {
      setWebglSupported(false);
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // Procedural Studio Environment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Studio Lighting Rig
    const keyLight = new THREE.DirectionalLight(0x06b6d4, 2.2); // Electric cyan
    keyLight.position.set(4, 6, 4);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x6366f1, 2.8); // Cobalt/Violet
    rimLight.position.set(-4, -2, -3);
    scene.add(rimLight);

    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.8);
    scene.add(hemiLight);

    // 1. Procedural 3D Subject Group: Holographic Revenue Nucleus
    const hologramGroup = new THREE.Group();
    scene.add(hologramGroup);

    // Outer Geometric Glass Cage (Icosahedron)
    const cageGeo = new THREE.IcosahedronGeometry(1.6, 1);
    const cageMat = new THREE.MeshPhysicalMaterial({
      color: 0x06b6d4,
      metalness: 0.2,
      roughness: 0.15,
      transparent: true,
      opacity: isSoftwareGl ? 0.35 : 0.45,
      wireframe: false,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1
    });
    const cageMesh = new THREE.Mesh(cageGeo, cageMat);
    hologramGroup.add(cageMesh);

    // Wireframe lattice overlay
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.4
    });
    const wireMesh = new THREE.Mesh(cageGeo, wireMat);
    hologramGroup.add(wireMesh);

    // Inner Glowing Core (Sales Neural Nucleus)
    const coreGeo = new THREE.OctahedronGeometry(0.75, 2);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x6366f1,
      emissive: 0x4338ca,
      emissiveIntensity: 1.5,
      roughness: 0.3,
      metalness: 0.8
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    hologramGroup.add(coreMesh);

    // Orbital Revenue Pillar Nodes (5 cylindrical data pillars)
    const pillarGroup = new THREE.Group();
    hologramGroup.add(pillarGroup);

    const pillarHeights = [0.9, 1.4, 1.9, 1.2, 1.6];
    const pillarColors = [0x06b6d4, 0x38bdf8, 0x10b981, 0x6366f1, 0x8b5cf6];

    pillarHeights.forEach((h, idx) => {
      const angle = (idx / pillarHeights.length) * Math.PI * 2;
      const radius = 2.4;
      const pGeo = new THREE.CylinderGeometry(0.08, 0.08, h, 16);
      pGeo.translate(0, h / 2, 0); // bottom-center pivot
      const pMat = new THREE.MeshStandardMaterial({
        color: pillarColors[idx % pillarColors.length],
        emissive: pillarColors[idx % pillarColors.length],
        emissiveIntensity: 0.8,
        metalness: 0.9,
        roughness: 0.2
      });
      const pMesh = new THREE.Mesh(pGeo, pMat);
      pMesh.position.set(Math.cos(angle) * radius, -0.6, Math.sin(angle) * radius);
      pillarGroup.add(pMesh);

      // Node cap sphere
      const capGeo = new THREE.SphereGeometry(0.12, 16, 16);
      const capMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const capMesh = new THREE.Mesh(capGeo, capMat);
      capMesh.position.set(Math.cos(angle) * radius, -0.6 + h, Math.sin(angle) * radius);
      pillarGroup.add(capMesh);
    });

    // Orbital Ring
    const ringGeo = new THREE.TorusGeometry(2.4, 0.015, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.5
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = -0.6;
    hologramGroup.add(ringMesh);

    // Instanced Particles Atmosphere
    const particleCount = 120;
    const particleGeo = new THREE.BufferGeometry();
    const posArray = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      posArray[i] = (Math.random() - 0.5) * 8;
      posArray[i + 1] = (Math.random() - 0.5) * 5;
      posArray[i + 2] = (Math.random() - 0.5) * 8;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.04,
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.6
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Contact Shadow Grounding Plane
    const shadowGeo = new THREE.PlaneGeometry(6, 6);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x020617,
      transparent: true,
      opacity: 0.65,
      depthWrite: false
    });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -0.65;
    scene.add(shadowPlane);

    // Mouse Parallax tracking
    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      stateRef.current.pointerX = x;
      stateRef.current.pointerY = y;
    };
    container.addEventListener('mousemove', handlePointerMove);

    // Tab visibility handling
    const handleVisibility = () => {
      stateRef.current.isTabVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Resize Observer
    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      const w = container.clientWidth || 600;
      const h = container.clientHeight || 280;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    // Animation Loop
    let frameId = 0;
    const clock = new THREE.Clock();

    function tick() {
      if (!stateRef.current.isTabVisible) {
        frameId = requestAnimationFrame(tick);
        return;
      }

      const delta = clock.getDelta();
      const speed = stateRef.current.speedMultiplier;

      // Group rotation
      hologramGroup.rotation.y += delta * 0.45 * speed;
      coreMesh.rotation.y -= delta * 0.7 * speed;
      coreMesh.rotation.x += delta * 0.3 * speed;
      particles.rotation.y += delta * 0.08 * speed;

      // Wireframe toggle
      cageMat.wireframe = stateRef.current.wireframeMode;

      // Camera preset transitions using smooth exponential damping
      let targetX = 4.5;
      let targetY = 3.2;
      let targetZ = 5.0;

      if (stateRef.current.cameraView === 'front') {
        targetX = 0.0;
        targetY = 0.4;
        targetZ = 6.2;
      } else if (stateRef.current.cameraView === 'top') {
        targetX = 0.1;
        targetY = 6.8;
        targetZ = 0.5;
      }

      // Add subtle pointer parallax
      const px = stateRef.current.pointerX * 0.6;
      const py = stateRef.current.pointerY * 0.4;

      camera.position.x = THREE.MathUtils.damp(camera.position.x, targetX + px, 4.0, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, targetY + py, 4.0, delta);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, targetZ, 4.0, delta);
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(tick);
    }

    frameId = requestAnimationFrame(tick);

    // Cleanup
    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      container.removeEventListener('mousemove', handlePointerMove);
      document.removeEventListener('visibilitychange', handleVisibility);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      cageGeo.dispose();
      cageMat.dispose();
      wireMat.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className={`relative w-full h-[260px] md:h-[280px] rounded-xl overflow-hidden bg-gradient-to-br from-[#0c1322] via-[#090d18] to-[#070b14] border border-white/10 ${className}`}>
      {/* 3D WebGL Canvas Container */}
      {webglSupported ? (
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      ) : (
        /* Graceful 2D Fallback for Non-WebGL Devices */
        <div className="w-full h-full flex items-center justify-center p-6 bg-slate-900/80">
          <div className="text-center max-w-sm">
            <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Eye className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-200">Interactive 3D Engine Ready</h4>
            <p className="text-xs text-slate-400 mt-1">WebGL hardware acceleration is unavailable in this environment. Showing 2D high-fidelity metrics view.</p>
          </div>
        </div>
      )}

      {/* Floating Ambient Info Overlay (Left) */}
      <div className="absolute top-4 left-5 pointer-events-none z-10">
        <div className="flex items-center gap-2 text-xs text-cyan-400 font-medium">
          <span>Holographic Revenue Core</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums text-slate-300">${currentRevenue.toLocaleString()}</span>
          {growthPct !== null && (
            <>
              <span aria-hidden="true">·</span>
              <span className={`font-mono tabular-nums ${growthPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {growthPct >= 0 ? '+' : ''}{growthPct.toFixed(1)}%
              </span>
            </>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-0.5">Real-time geometric sales cluster & predictive vector space</p>
      </div>

      {/* Collapsible Unified Bottom Control Dock */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
        {/* Toggle Button */}
        <button
          onClick={() => setIsControlsOpen(!isControlsOpen)}
          className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-medium text-slate-400 hover:text-slate-200 bg-slate-900/80 border border-white/10 rounded-md transition-colors"
          title="Toggle 3D Viewport Controls"
        >
          <Sliders className="w-3 h-3 text-cyan-400" />
          <span>{isControlsOpen ? 'Hide 3D Controls' : '3D Controls'}</span>
          {isControlsOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
        </button>

        {/* Collapsible Panel */}
        {isControlsOpen && (
          <div className="mt-1.5 flex items-center gap-2 px-3 py-1.5 bg-[#0e1628]/95 border border-cyan-500/30 rounded-lg shadow-xl text-xs text-slate-300">
            {/* Camera View Selector */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-slate-400 mr-1">View:</span>
              <button
                onClick={() => setCameraView('iso')}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors ${cameraView === 'iso' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Isometric
              </button>
              <button
                onClick={() => setCameraView('front')}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors ${cameraView === 'front' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Front
              </button>
              <button
                onClick={() => setCameraView('top')}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors ${cameraView === 'top' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Top
              </button>
            </div>

            <span className="text-slate-700">|</span>

            {/* Speed Multiplier */}
            <div className="flex items-center gap-1">
              <RotateCw className="w-3 h-3 text-slate-400" />
              <button
                onClick={() => setSpeedMultiplier(speedMultiplier === 1 ? 2 : speedMultiplier === 2 ? 0.5 : 1)}
                className="px-2 py-0.5 bg-slate-800/80 hover:bg-slate-700/80 rounded text-[11px] font-mono tabular-nums text-slate-300 transition-colors"
                title="Toggle rotation speed"
              >
                {speedMultiplier}x
              </button>
            </div>

            <span className="text-slate-700">|</span>

            {/* Wireframe Mode */}
            <button
              onClick={() => setWireframeMode(!wireframeMode)}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors ${wireframeMode ? 'bg-violet-500/20 text-violet-300 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {wireframeMode ? 'Lattice' : 'Solid'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
