// CarCanvas.js
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useRef, useState, useEffect, useCallback } from "react";
import * as THREE from "three";

import CameraRig from "./CameraRig";
import CarModel from "./CarModel";
import Ground from "./Ground";

// =========================================
// Easing (Cubic) for cinematic camera motion
// =========================================
if (!Math.easeInOutCubic) {
  Math.easeInOutCubic = (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export default function CarCanvas() {
  const [seatView, setSeatView] = useState(null);
  const [headLightsOn, setHeadLightsOn] = useState(false);
  const [rearLightsOn, setRearLightsOn] = useState(false);
  const [speed, setSpeed] = useState(100);

  const controls = useRef();
  const carRef = useRef();
  const headLightRef = useRef();
  const rearLightRef = useRef();

  const [introPlayed, setIntroPlayed] = useState(false);
  const [isIntro, setIsIntro] = useState(true);

  // =========================================
  // EXIT CAR (same as before)
  // =========================================
  const handleExitCar = () => {
    setSeatView(null);
    if (controls.current) controls.current.reset();
  };

  const interiorIntensity = seatView ? 1.0 : 0;

  // =========================================
  // 🎬 CINEMATIC INTRO CAMERA
  // =========================================
const playIntro = useCallback(() => {
  const ctrl = controls.current;
  const cam = ctrl?.object;
  const car = carRef.current;

  if (!cam || !car) return;

  setIsIntro(true);

  // NEW: Start from behind BUT opposite side
  const startPos = new THREE.Vector3(
    car.position.x - 8,
    car.position.y + 12,
    car.position.z + 32
  );

  // NEW: End position also on opposite side
  const endPos = new THREE.Vector3(
    car.position.x - 3,
    car.position.y + 2.5,
    car.position.z + 7.5
  );

  cam.position.copy(startPos);
  cam.lookAt(car.position);
  ctrl.enabled = false;

  const duration = 2600;
  let startTime = null;

  function animateIntro(ts) {
    if (!startTime) startTime = ts;
    const elapsed = ts - startTime;

    const t = Math.min(elapsed / duration, 1);
    const ease = Math.easeInOutCubic(t);

    cam.position.lerpVectors(startPos, endPos, ease);
    cam.lookAt(car.position);

    if (t < 1) {
      requestAnimationFrame(animateIntro);
    } else {
      cam.position.copy(endPos);
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


  // =========================================
  // Delay intro until scene is loaded
  // =========================================
  function CinematicStartTrigger({ onReady }) {
    useEffect(() => {
      setTimeout(() => onReady(), 200);
    }, []);
    return null;
  }

  // =========================================
  // JSX
  // =========================================
  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      
      {/* EXIT BUTTON */}
      {seatView && (
        <button
          onClick={handleExitCar}
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            padding: "10px 18px",
            background: "#256AFF",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
            zIndex: 20,
          }}
        >
          Exit Car
        </button>
      )}

      {/* HEADLIGHT TOGGLE */}
      <button
        onClick={() => setHeadLightsOn((p) => !p)}
        style={{
          position: "absolute",
          top: "20px",
          right: "130px",
          padding: "10px 14px",
          background: headLightsOn ? "#FFFF00" : "#555",
          color: headLightsOn ? "black" : "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: "600",
          zIndex: 20,
        }}
      >
        Front: {headLightsOn ? "ON" : "OFF"}
      </button>

      {/* REAR LIGHT TOGGLE */}
      <button
        onClick={() => setRearLightsOn((p) => !p)}
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          padding: "10px 14px",
          background: rearLightsOn ? "#FF0000" : "#555",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: "600",
          zIndex: 20,
        }}
      >
        Rear: {rearLightsOn ? "ON" : "OFF"}
      </button>

      {/* SPEED SLIDER */}
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "320px",
          zIndex: 20,
          textAlign: "center",
          color: "#fff",
          fontWeight: "600",
        }}
      >
        Speed: {speed.toFixed(1)}
        <input
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={speed}
          onChange={(e) => setSpeed(parseFloat(e.target.value))}
          style={{ width: "100%", marginTop: "10px" }}
        />
      </div>

      {/* ===================== */}
      {/*       CANVAS          */}
      {/* ===================== */}

      <Canvas
        camera={{ position: [3, 1.5, 5], fov: 60 }}
        style={{ width: "100%", height: "100%", background: "#242424" }}
        shadows
      >
        <ambientLight intensity={0.3} />

        <directionalLight
          position={[50, 100, 50]}
          intensity={2.2}
          color={"#fff8e6"}
          castShadow
        />

        <pointLight
          color={0xffffff}
          intensity={interiorIntensity}
          distance={5}
          position={[0, 1.8, 0]}
        />

        {/* HEADLIGHT */}
        <spotLight
          ref={headLightRef}
          color={0xffffff}
          intensity={headLightsOn ? 1000 : 0}
          distance={100}
          angle={Math.PI / 6}
          penumbra={0.2}
          castShadow
        />

        {/* REAR LIGHT */}
        <spotLight
          ref={rearLightRef}
          color={0xff0000}
          intensity={rearLightsOn ? 100 : 0}
          distance={50}
          angle={Math.PI / 5}
          penumbra={0.2}
          castShadow
        />

        <Ground speed={speed} />

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
