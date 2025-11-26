import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useRef, useState } from "react";
import * as THREE from "three";
import CameraRig from "./CameraRig";
import CarModel from "./CarModel";
import Ground from "./Ground";

export default function CarCanvas() {
  const [seatView, setSeatView] = useState(null);
  const [headLightsOn, setHeadLightsOn] = useState(false);
  const [rearLightsOn, setRearLightsOn] = useState(false);
  const [speed, setSpeed] = useState(0); // 🔥 SPEED SLIDER

  const controls = useRef();
  const carRef = useRef();
  const headLightRef = useRef();
  const rearLightRef = useRef();

  const handleExitCar = () => {
    setSeatView(null);
    if (controls.current) controls.current.reset();
  };

  const interiorIntensity = seatView ? 1.0 : 0;

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      
      {/* Exit button */}
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

      {/* Headlight toggle */}
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

      {/* Rear light toggle */}
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
          max="20"
          step="0.1"
          value={speed}
          onChange={(e) => setSpeed(parseFloat(e.target.value))}
          style={{ width: "100%", marginTop: "10px" }}
        />
      </div>

      {/* CANVAS */}
      <Canvas
        camera={{ position: [3, 1.5, 5], fov: 60 }}
        style={{ width: "100%", height: "100%", background: "#242424" }}
        shadows
      >
        {/* Ambient Light */}
        <ambientLight intensity={0.3} />

        {/* Sun Light */}
        <directionalLight
          position={[50, 100, 50]}
          intensity={2.2}
          color={"#fff8e6"}
          castShadow
          shadow-mapSize-width={4096}
          shadow-mapSize-height={4096}
          shadow-bias={-0.00015}
        />

        {/* Interior Light */}
        <pointLight
          color={0xffffff}
          intensity={interiorIntensity}
          distance={5}
          position={[0, 1.8, 0]}
        />

        {/* Head Light */}
        <spotLight
          ref={headLightRef}
          color={0xffffff}
          intensity={headLightsOn ? 20 : 0}
          distance={100}
          angle={Math.PI / 6}
          penumbra={0.2}
          decay={-1}
          castShadow
        />

        {/* Rear Light */}
        <spotLight
          ref={rearLightRef}
          color={0xff0000}
          intensity={rearLightsOn ? 15 : 0}
          distance={50}
          angle={Math.PI / 5}
          penumbra={0.2}
          decay={1}
          castShadow
        />


        {/* Ground */}
        <Ground speed={speed} />

        {/* Car Model */}
        <CarModel
          onSeatRequest={setSeatView}
          currentSeat={seatView}
          headLightsOn={headLightsOn}
          rearLightsOn={rearLightsOn}
          carRef={carRef}
          headLightRef={headLightRef}
          rearLightRef={rearLightRef}
          speed={speed} // 🔥 PASS SPEED
        />

        {/* Orbit Controls */}
        <OrbitControls ref={controls} enableDamping />

        <CameraRig seat={seatView} controls={controls} />
      </Canvas>
    </div>
  );
}
