import { Canvas } from "@react-three/fiber";
import { OrbitControls, Sky, Stars } from "@react-three/drei";
import { useRef, useState, useEffect, useCallback } from "react";
import * as THREE from "three";

import CameraRig from "./CameraRig";
import CarModel from "./CarModel";
import Ground from "./Ground";
import VRButton from "./VRButton";
import VRManager from "./VRManager";
import VRTeleport from "./VRTeleport";
import VRControllerRays from "./VRControllerRays";
import VRUIPanel from "./VRUIPanel";
import VRCarInteraction from "./VRCarInteraction";

if (!Math.easeInOutCubic) {
  Math.easeInOutCubic = (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export default function CarCanvas() {
  const [seatView, setSeatView] = useState(null);
  const [headLightsOn, setHeadLightsOn] = useState(false);
  const [rearLightsOn, setRearLightsOn] = useState(false);
  const [speed, setSpeed] = useState(0);
  const [isNight, setIsNight] = useState(false);
  const [vrMode, setVrMode] = useState(false);
  const [glInstance, setGlInstance] = useState(null);
  const [introPlayed, setIntroPlayed] = useState(false);
  const [isIntro, setIsIntro] = useState(true);

  const controls = useRef();
  const carRef = useRef();
  const headLightRef = useRef();
  const rearLightRef = useRef();

  const handleExitCar = () => {
    setSeatView(null);
    if (controls.current) controls.current.reset();
  };

  const interiorIntensity = seatView ? 1.0 : 0;

  const playIntro = useCallback(() => {
    const ctrl = controls.current;
    const cam = ctrl?.object;
    const car = carRef.current;
    if (!cam || !car) return;
    setIsIntro(true);

    const phase1Start = new THREE.Vector3(car.position.x + 15, car.position.y + 8, car.position.z - 25);
    const phase1End = new THREE.Vector3(car.position.x - 12, car.position.y + 6, car.position.z + 18);
    const phase2End = new THREE.Vector3(car.position.x + 8, car.position.y + 3, car.position.z + 12);
    const finalPos = new THREE.Vector3(car.position.x - 3, car.position.y + 2.5, car.position.z + 7.5);

    cam.position.copy(phase1Start);
    cam.lookAt(car.position);
    ctrl.enabled = false;

    const phase1Duration = 2000;
    const phase2Duration = 1800;
    const phase3Duration = 1200;
    const totalDuration = phase1Duration + phase2Duration + phase3Duration;
    let startTime = null;

    function animateIntro(ts) {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;
      const t = Math.min(elapsed / totalDuration, 1);

      if (elapsed < phase1Duration) {
        const t1 = elapsed / phase1Duration;
        const ease1 = Math.easeInOutCubic(t1);
        cam.position.lerpVectors(phase1Start, phase1End, ease1);
        const lookTarget = new THREE.Vector3(car.position.x, car.position.y + 1, car.position.z);
        cam.lookAt(lookTarget);
      } else if (elapsed < phase1Duration + phase2Duration) {
        const t2 = (elapsed - phase1Duration) / phase2Duration;
        const ease2 = Math.easeInOutCubic(t2);
        cam.position.lerpVectors(phase1End, phase2End, ease2);
        const lookTarget = new THREE.Vector3(car.position.x - 0.5, car.position.y + 0.8, car.position.z - 1);
        cam.lookAt(lookTarget);
      } else {
        const t3 = (elapsed - phase1Duration - phase2Duration) / phase3Duration;
        const ease3 = Math.easeInOutCubic(t3);
        cam.position.lerpVectors(phase2End, finalPos, ease3);
        cam.lookAt(car.position);
      }

      if (t < 1) {
        requestAnimationFrame(animateIntro);
      } else {
        cam.position.copy(finalPos);
        cam.lookAt(car.position);
        ctrl.target.copy(car.position);
        ctrl.update();
        ctrl.enabled = true;
        setIsIntro(false);
        setIntroPlayed(true);
      }
    }

    requestAnimationFrame(animateIntro);
  }, []);

  function CinematicStartTrigger({ onReady }) {
    useEffect(() => { setTimeout(() => onReady(), 200); }, []);
    return null;
  }

  const speedPct = speed / 100;

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>

      <div className="vignette" />
      <div className="scanlines" />

      <div className="brand-badge">CYBER<span>TRUCK</span></div>

      {/* VR Button */}
      <div className="vr-button-container">
        <VRButton
          gl={glInstance}
          onSessionStart={() => setVrMode(true)}
          onSessionEnd={() => setVrMode(false)}
        />
      </div>

      <div className="hud-top">
        {seatView && (
          <button className="hud-btn active-blue" onClick={handleExitCar}>
            ← EXIT
          </button>
        )}
        <button
          className={`hud-btn ${headLightsOn ? "active-yellow" : ""}`}
          onClick={() => setHeadLightsOn((p) => !p)}
        >
          ◈ FRONT {headLightsOn ? "ON" : "OFF"}
        </button>
        <button
          className={`hud-btn ${rearLightsOn ? "active-red" : ""}`}
          onClick={() => setRearLightsOn((p) => !p)}
        >
          ◈ REAR {rearLightsOn ? "ON" : "OFF"}
        </button>
        <button
          className={`hud-btn ${isNight ? "active-cyan" : ""}`}
          onClick={() => setIsNight((p) => !p)}
        >
          {isNight ? "☽ NIGHT" : "☀ DAY"}
        </button>
      </div>

      <div className="speed-container">
        <div className="speed-panel">
          <div className="speed-label">velocity</div>
          <div className="speed-value">{speed.toFixed(0)}</div>
          <div className="speed-unit">KM/H</div>
          <div className="speed-track">
            <div className="speed-fill" style={{ width: `${speedPct * 100}%` }} />
          </div>
          <input
            type="range" min="0" max="100" step="0.5"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
          />
        </div>
      </div>

      <Canvas
        camera={{ position: [0, 1.6, 5], fov: 60 }}
        style={{ width: "100%", height: "100%" }}
        shadows
        onCreated={({ gl }) => {
          gl.xr.enabled = true;
          setGlInstance(gl);
        }}
      >
        {isNight ? (
          <>
            <color attach="background" args={["#020510"]} />
            <Stars radius={120} depth={60} count={4000} factor={4} fade />
            <ambientLight intensity={0.15} />
            <directionalLight position={[-30, 50, -20]} intensity={0.8} color="#b8c5ff" castShadow />
            <mesh position={[-30, 50, -80]}>
              <sphereGeometry args={[8, 32, 32]} />
              <meshStandardMaterial 
                color="#e8f0ff" 
                emissive="#c8d8ff" 
                emissiveIntensity={1.2}
              />
            </mesh>
          </>
        ) : (
          <>
            <Sky sunPosition={[100, 20, 100]} turbidity={6} rayleigh={0.5} />
            <ambientLight intensity={0.5} />
            <directionalLight position={[50, 100, 50]} intensity={2.2} color="#fff8e6" castShadow />
          </>
        )}

        <fog attach="fog" args={[isNight ? "#020510" : "#c9dff0", 60, 200]} />

        <pointLight color={0xffffff} intensity={interiorIntensity} distance={5} position={[0, 1.8, 0]} />

        <spotLight
          ref={headLightRef}
          color={0xffffff}
          intensity={headLightsOn ? 1000 : 0}
          distance={100}
          angle={Math.PI / 6}
          penumbra={0.2}
          castShadow
        />
        <spotLight
          ref={rearLightRef}
          color={0xff0000}
          intensity={rearLightsOn ? 100 : 0}
          distance={50}
          angle={Math.PI / 5}
          penumbra={0.2}
          castShadow
        />

        <Ground speed={speed} isNight={isNight} />

        {/* VR Components */}
        <VRManager onGLReady={setGlInstance} />

        <CarModel
          onSeatRequest={setSeatView}
          currentSeat={seatView}
          headLightsOn={headLightsOn}
          rearLightsOn={rearLightsOn}
          carRef={carRef}
          headLightRef={headLightRef}
          rearLightRef={rearLightRef}
          speed={speed}
        />

        {!introPlayed && <CinematicStartTrigger onReady={playIntro} />}
        <OrbitControls ref={controls} enableDamping={!isIntro} />
        <CameraRig seat={seatView} controls={controls} />
      </Canvas>
    </div>
  );
}
