import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";

export default function VREnvironment() {
  const { gl } = useThree();
  const markersRef = useRef([]);

  useEffect(() => {
    if (!gl.xr || !gl.xr.enabled) return;

    const checkVR = () => {
      try {
        const session = gl.xr.getSession();
        const isActive = !!session;
        
        markersRef.current.forEach((marker) => {
          if (marker) marker.visible = isActive;
        });
      } catch (err) {
        // Session not available yet
      }
    };

    const interval = setInterval(checkVR, 100);
    return () => clearInterval(interval);
  }, [gl]);

  return (
    <group>
      {/* Teleport markers */}
      {[
        [-3, 0.05, 3],
        [3, 0.05, 3],
        [-3, 0.05, -3],
        [3, 0.05, -3],
      ].map((pos, i) => (
        <mesh
          key={i}
          position={pos}
          rotation={[-Math.PI / 2, 0, 0]}
          ref={(el) => (markersRef.current[i] = el)}
          visible={false}
        >
          <ringGeometry args={[0.3, 0.4, 32]} />
          <meshBasicMaterial color="#00dcc8" transparent opacity={0.6} />
        </mesh>
      ))}

      {/* VR Info Panel */}
      <group position={[0, 1.6, -2]} visible={false} ref={(el) => (markersRef.current[4] = el)}>
        <mesh>
          <planeGeometry args={[1.5, 0.8]} />
          <meshBasicMaterial color="#050a14" transparent opacity={0.85} />
        </mesh>
        <mesh position={[0, 0, 0.01]}>
          <planeGeometry args={[1.4, 0.7]} />
          <meshBasicMaterial color="#00dcc8" transparent opacity={0.15} />
        </mesh>
      </group>
    </group>
  );
}
