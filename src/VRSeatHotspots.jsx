import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

export default function VRSeatHotspots({ currentSeat, onSeatRequest }) {
  const { gl } = useThree();
  const hotspotsRef = useRef([]);

  const seatPositions = {
    driver: [0.5, 1.2, 0.4],
    passenger: [-0.5, 1.2, 0.4],
    rear_left: [0.6, 1.2, -0.2],
    rear_right: [-0.6, 1.2, -0.2],
  };

  useEffect(() => {
    if (!gl.xr || !gl.xr.enabled) return;

    const controller1 = gl.xr.getController(0);
    const controller2 = gl.xr.getController(1);

    const onSelect = (event) => {
      const controller = event.target;
      const tempMatrix = new THREE.Matrix4();
      tempMatrix.identity().extractRotation(controller.matrixWorld);

      const raycaster = new THREE.Raycaster();
      raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
      raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

      hotspotsRef.current.forEach((hotspot) => {
        if (!hotspot || !hotspot.userData.action) return;
        
        const intersects = raycaster.intersectObject(hotspot, true);
        if (intersects.length > 0) {
          hotspot.userData.action();
          
          // Haptic feedback
          const gamepad = event.target.gamepad;
          if (gamepad?.hapticActuators?.[0]) {
            gamepad.hapticActuators[0].pulse(0.7, 150);
          }
        }
      });
    };

    controller1.addEventListener("select", onSelect);
    controller2.addEventListener("select", onSelect);

    return () => {
      controller1.removeEventListener("select", onSelect);
      controller2.removeEventListener("select", onSelect);
    };
  }, [gl, onSeatRequest]);

  if (currentSeat) return null;

  return (
    <group>
      {Object.entries(seatPositions).map(([seatKey, pos], idx) => (
        <group key={seatKey} position={pos}>
          <mesh
            ref={(el) => {
              if (el) {
                hotspotsRef.current[idx] = el;
                el.userData.action = () => onSeatRequest(seatKey);
              }
            }}
          >
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial
              color="#00dcc8"
              emissive="#00dcc8"
              emissiveIntensity={1}
              transparent
              opacity={0.8}
            />
          </mesh>
          
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
            <ringGeometry args={[0.12, 0.15, 32]} />
            <meshBasicMaterial color="#00dcc8" transparent opacity={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
