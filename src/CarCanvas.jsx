import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { useRef, useState, useEffect } from "react";
import * as THREE from "three";

// =========================================================================
// CAR MODEL COMPONENT (No changes needed here, keeping previous lighting/position fixes)
// =========================================================================

function CarModel({ onSeatRequest, currentSeat, headLightsOn, rearLightsOn, carRef, headLightRef, rearLightRef }) {
  const { scene } = useGLTF("cyber truck.glb");

  // ... (targets, state, find function, useEffect for scene setup, useEffect for glow, useEffect for auto-close remain the same)
  const targets = {
    LF: useRef(0), RF: useRef(0), LR: useRef(0), RR: useRef(0), Frunk: useRef(0),
  };
  const trunkTarget = useRef(0);
  const [openLF, setOpenLF] = useState(false);
  const [openRF, setOpenRF] = useState(false);
  const [openLR, setOpenLR] = useState(false);
  const [openRR, setOpenRR] = useState(false);
  const [openFrunk, setOpenFrunk] = useState(false);
  const [openTrunk, setOpenTrunk] = useState(false);
  const trunkMeshRef = useRef(null);
  const lightMaterials = useRef({});

  const find = (name) => {
    let found = null;
    scene.traverse((n) => {
      if (!found && n.name === name) found = n;
    });
    return found;
  };

  useEffect(() => {
    scene.traverse((node) => {
      if (node.name === "Trunk" && node.morphTargetInfluences) {
        trunkMeshRef.current = node;
        if (trunkMeshRef.current.morphTargetInfluences[0] === undefined) {
          trunkMeshRef.current.morphTargetInfluences[0] = 0;
        }
      }
      
      // Look for "Front_Light" in addition to "Rear_Light"
      if (node.isMesh && (node.name === "Rear_Light" || node.name === "Front_Light")) {
        if (node.material && !lightMaterials.current[node.name]) {
            const clonedMaterial = node.material.clone();
            clonedMaterial.name = node.name;
            
            // Explicitly set lights to OFF state during initialization
            clonedMaterial.emissive = new THREE.Color(0x000000); 
            clonedMaterial.emissiveIntensity = 0; 
            
            lightMaterials.current[node.name] = clonedMaterial;
            node.material = clonedMaterial;
        }
      }
      // Set all meshes to cast/receive shadows
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });
  }, [scene]);

  useEffect(() => {
    // Front Lights Material (Glow)
    const headMat = lightMaterials.current["Front_Light"];
    if (headMat) {
        headMat.emissiveIntensity = headLightsOn ? 2.5 : 0; 
        headMat.emissive.set(headLightsOn ? 0xffffff : 0x000000);
        headMat.needsUpdate = true;
    }

    // Rear Lights Material (Glow)
    const rearMat = lightMaterials.current["Rear_Light"];
    if (rearMat) {
        rearMat.emissiveIntensity = rearLightsOn ? 3.0 : 0; 
        rearMat.emissive.set(rearLightsOn ? 0xff0000 : 0x000000);
        rearMat.needsUpdate = true;
    }
  }, [headLightsOn, rearLightsOn]);

  useEffect(() => {
    if (currentSeat) {
      const doorMap = { 
          driver: { ref: targets.LF, set: setOpenLF },
          passenger: { ref: targets.RF, set: setOpenRF },
          rear_left: { ref: targets.LR, set: setOpenLR },
          rear_right: { ref: targets.RR, set: setOpenRR },
      };
      const doorToClose = doorMap[currentSeat];
      if (doorToClose) {
        const timeoutId = setTimeout(() => {
          doorToClose.ref.current = 0; 
          doorToClose.set(false);     
        }, 500);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [currentSeat, targets]);

  // Frame Loop (Doors/Tires/Lights)
  useFrame(() => {
    // Door Lerping
    const lf = find("LF_Door");
    if (lf) lf.rotation.y = THREE.MathUtils.lerp(lf.rotation.y, targets.LF.current, 0.12);
    const rf = find("RF_Door");
    if (rf) rf.rotation.y = THREE.MathUtils.lerp(rf.rotation.y, targets.RF.current, 0.12);
    const lr = find("LR_Door");
    if (lr) lr.rotation.y = THREE.MathUtils.lerp(lr.rotation.y, targets.LR.current, 0.12);
    const rr = find("RR_Door");
    if (rr) rr.rotation.y = THREE.MathUtils.lerp(rr.rotation.y, targets.RR.current, 0.12);
    const fr = find("Frunk");
    if (fr) fr.rotation.x = THREE.MathUtils.lerp(fr.rotation.x, targets.Frunk.current, 0.12);
    if (trunkMeshRef.current && trunkMeshRef.current.morphTargetInfluences) {
        trunkMeshRef.current.morphTargetInfluences[0] = THREE.MathUtils.lerp(
          trunkMeshRef.current.morphTargetInfluences[0] ?? 0,
          trunkTarget.current,
          0.12
        );
    }

    // Tire spin
    const flt = find("FL_Tire");
    if (flt) flt.rotation.x += 0.05;
    const frt = find("FR_Tire");
    if (frt) frt.rotation.x += 0.05;
    const rlt = find("RL_Tire");
    if (rlt) rlt.rotation.x += 0.05;
    const rrt = find("RR_Tire");
    if (rrt) rrt.rotation.x += 0.05;

    // Update actual light position to follow the car's position
    if (carRef.current && headLightRef.current && rearLightRef.current) {
        const carPos = carRef.current.position;
        const carWidthOffset = 0.8; 
        
        // Front Light update (using previous settings)
        headLightRef.current.position.set(carPos.x, carPos.y + 0.3, carPos.z + 1.2); 
        headLightRef.current.target.position.set(carPos.x + carWidthOffset, carPos.y - 0.5, carPos.z + 10);
        headLightRef.current.target.updateMatrixWorld();
        
        // Rear Light update (using previous settings)
        rearLightRef.current.position.set(carPos.x, carPos.y + 0.3, carPos.z - 1.2);
        rearLightRef.current.target.position.set(carPos.x - carWidthOffset, carPos.y - 0.5, carPos.z - 10);
        rearLightRef.current.target.updateMatrixWorld();
    }
  });

  // Click Handler (remains the same)
  const targetNames = ["LF_Door", "RF_Door", "LR_Door", "RR_Door", "Frunk", "Trunk"];

  const findClickable = (obj) => {
    let cur = obj;
    while (cur) {
      if (targetNames.includes(cur.name)) return cur;
      cur = cur.parent;
    }
    return null;
  };

  const handlePointerDown = (e) => {
    e.stopPropagation();
    const hit = findClickable(e.object);
    if (!hit) return;

    const name = hit.name;

    const doorHandlers = {
      "LF_Door": { set: setOpenLF, state: openLF, targetRef: targets.LF, seat: "driver", angle: -Math.PI / 2 },
      "RF_Door": { set: setOpenRF, state: openRF, targetRef: targets.RF, seat: "passenger", angle: Math.PI / 2 },
      "LR_Door": { set: setOpenLR, state: openLR, targetRef: targets.LR, seat: "rear_left", angle: -Math.PI / 2 },
      "RR_Door": { set: setOpenRR, state: openRR, targetRef: targets.RR, seat: "rear_right", angle: Math.PI / 2 },
    };

    if (doorHandlers[name]) {
      const { set, state, targetRef, seat, angle } = doorHandlers[name];

      // If already inside: always change seat view
      if (currentSeat) {
        onSeatRequest(seat);
        return;
      }
      
      // If door is OPEN, second click enters the car
      if (state) {
        onSeatRequest(seat);
      } else {
        // If door is CLOSED, first click opens the door
        set(true); 
        targetRef.current = angle; 
      }
      return;
    }

    // Frunk and Trunk clicks
    if (name === "Frunk") {
      setOpenFrunk((v) => {
        const next = !v;
        targets.Frunk.current = next ? -Math.PI / 3 : 0;
        return next;
      });
      return;
    }

    if (name === "Trunk") {
      setOpenTrunk((v) => {
        const next = !v;
        trunkTarget.current = next ? 1 : 0;
        return next;
      });
      return;
    }
  };

  return (
    <primitive
      object={scene}
      ref={carRef}
      scale={1}
      onPointerDown={handlePointerDown}
      onPointerOver={() => (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "auto")}
    />
  );
}

// =========================================================================
// CAMERA RIG COMPONENT (Remains the same)
// =========================================================================
function CameraRig({ seat, controls }) {
  const { camera, gl } = useThree();

  const seatPositions = {
    driver: new THREE.Vector3(0.5, 1.5, 0.4),
    passenger: new THREE.Vector3(-0.5, 1.5, 0.4),
    rear_left: new THREE.Vector3(0.6, 1.5, -0.2),
    rear_right: new THREE.Vector3(-0.6, 1.5, -0.2),
    default: new THREE.Vector3(3, 1.5, 5),
  };

  const yaw = useRef(0);
  const pitch = useRef(0);
  const PITCH_LIMIT = Math.PI / 4;

  useEffect(() => {
    if (!seat) {
      yaw.current = 0;
      pitch.current = 0;
    }
  }, [seat]);
  
  useEffect(() => {
    function onMove(e) {
      if (!seat) return;

      yaw.current -= e.movementX * 0.002;
      pitch.current -= e.movementY * 0.002;

      pitch.current = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitch.current));
    }

    gl.domElement.addEventListener("mousemove", onMove);
    return () => gl.domElement.removeEventListener("mousemove", onMove);
  }, [seat, gl.domElement]);

  useFrame(() => {
    if (!controls.current) return;

    if (!seat) {
      controls.current.enabled = true;
      return; 
    }

    controls.current.enabled = false;
    const target = seatPositions[seat];

    camera.position.lerp(target, 0.08);

    const dir = new THREE.Vector3(
      Math.sin(yaw.current) * Math.cos(pitch.current),
      Math.sin(pitch.current),
      Math.cos(yaw.current) * Math.cos(pitch.current)
    );

    camera.lookAt(camera.position.clone().add(dir));

    camera.fov = 70;
    camera.updateProjectionMatrix();
  });

  return null;
}

// =========================================================================
// MAIN CANVAS COMPONENT
// =========================================================================

export default function CarCanvas() {
  const [seatView, setSeatView] = useState(null);
  const [headLightsOn, setHeadLightsOn] = useState(false); 
  const [rearLightsOn, setRearLightsOn] = useState(false);
  const controls = useRef();
  const carRef = useRef();
  const headLightRef = useRef(); 
  const rearLightRef = useRef(); 

  const handleExitCar = () => {
    setSeatView(null);
    if (controls.current) {
      controls.current.reset(); 
    }
  };

  // Determine the interior light intensity based on seatView
  const interiorIntensity = seatView ? 1.0 : 0; // Turn on if inside, off if outside

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      
      {/* Buttons (Remains the same) */}
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

      <button
        onClick={() => setHeadLightsOn(p => !p)}
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

      <button
        onClick={() => setRearLightsOn(p => !p)}
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

      <Canvas
        camera={{ position: [3, 1.5, 5], fov: 60 }} 
        style={{ width: "100%", height: "100%", background: "#242424" }}
        shadows
      >
        {/* Exterior Lights (General Scene Lighting) */}
        <ambientLight intensity={0.3} />
        <directionalLight 
            position={[10, 10, 5]} 
            intensity={0.8}
            castShadow 
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-far={50}
            shadow-camera-left={-20}
            shadow-camera-right={20}
            shadow-camera-top={20}
            shadow-camera-bottom={-20}
            shadow-bias={-0.0001}
        /> 

        {/* 💡 FIX 1: Interior Cabin Light (Activates when seatView is true) */}
        <pointLight
          color={0xffffff} 
          intensity={interiorIntensity} // Controlled by the state
          distance={5} // Light only affects the local area (cabin)
          position={[0, 1.8, 0]} // Center of the cabin, slightly above the seats
        />

        {/* Headlight SpotLight (using previous, slightly adjusted, wider settings) */}
        <spotLight
          ref={headLightRef}
          color={0xffffff} 
          intensity={headLightsOn ? 20 : 0} 
          distance={100}
          angle={Math.PI / 6} 
          penumbra={0.2} 
          decay={1}
          castShadow
          position={[0, 0.3, 1.2]} 
          target-position={[0.8, -0.5, 10]} 
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-bias={-0.001}
        />

        {/* Rear Light SpotLight (using previous, slightly adjusted, wider settings) */}
        <spotLight
          ref={rearLightRef}
          color={0xff0000} 
          intensity={rearLightsOn ? 15 : 0} 
          distance={50}
          angle={Math.PI / 5} 
          penumbra={0.2}
          decay={1}
          castShadow
          position={[0, 0.3, -1.2]} 
          target-position={[-0.8, -0.5, -10]} 
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-bias={-0.001}
        />

        {/* Floor Plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
            <planeGeometry args={[100, 100]} />
            <meshStandardMaterial color={0xffffff} />
        </mesh>
        
        <CarModel 
          onSeatRequest={setSeatView} 
          currentSeat={seatView} 
          headLightsOn={headLightsOn} 
          rearLightsOn={rearLightsOn}
          carRef={carRef}
          headLightRef={headLightRef} 
          rearLightRef={rearLightRef} 
        />
        <OrbitControls ref={controls} enableDamping />
        <CameraRig seat={seatView} controls={controls} />
      </Canvas>
    </div>
  );
}