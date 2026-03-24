import { useXR } from "@react-three/xr";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

export default function VRHelper() {
  const { isPresenting, controllers } = useXR();
  const leftMarker = useRef();
  const rightMarker = useRef();

  useFrame(() => {
    if (!isPresenting) return;
    
    // Pulse animation for teleport markers
    if (leftMarker.current) {
      leftMarker.current.scale.setScalar(1 + Math.sin(Date.now() * 0.003) * 0.1);
    }
    if (rightMarker.current) {
      rightMarker.current.scale.setScalar(1 + Math.sin(Date.now() * 0.003) * 0.1);
    }
  });

  if (!isPresenting) return null;

  return (
    <group>
      {/* Teleport markers around car */}
      {[
        [-3, 0.05, 3],
        [3, 0.05, 3],
        [-3, 0.05, -3],
        [3, 0.05, -3],
      ].map((pos, i) => (
        <mesh key={i} position={pos} rotation={[-Math.PI / 2, 0, 0]} ref={i === 0 ? leftMarker : i === 1 ? rightMarker : null}>
          <ringGeometry args={[0.3, 0.4, 32]} />
          <meshBasicMaterial color="#00dcc8" transparent opacity={0.6} />
        </mesh>
      ))}

      {/* Controller visualization */}
      {controllers.map((controller, i) => (
        <group key={i}>
          <primitive object={controller.grip}>
            <mesh>
              <sphereGeometry args={[0.05, 16, 16]} />
              <meshStandardMaterial color="#00dcc8" emissive="#00dcc8" emissiveIntensity={0.5} />
            </mesh>
          </primitive>
        </group>
      ))}

      {/* VR UI Panel floating in front */}
      <group position={[0, 1.6, -2]}>
        <mesh>
          <planeGeometry args={[1.2, 0.6]} />
          <meshBasicMaterial color="#050a14" transparent opacity={0.8} />
        </mesh>
        <mesh position={[0, 0, 0.01]}>
          <planeGeometry args={[1.1, 0.5]} />
          <meshBasicMaterial color="#00dcc8" transparent opacity={0.1} />
        </mesh>
      </group>
    </group>
  );
}
