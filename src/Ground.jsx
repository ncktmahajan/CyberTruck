import { useFrame, useLoader } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import * as THREE from "three";
import { TextureLoader } from "three";

export default function Ground({ speed, isNight }) {
  const grassMap = useLoader(TextureLoader, "/textures/grass.jpg");
  const roadMap = useLoader(TextureLoader, "/textures/road.jpg");

  const grassMat = useRef();
  const roadMat = useRef();

  useMemo(() => {
    grassMap.wrapS = grassMap.wrapT = THREE.RepeatWrapping;
    roadMap.wrapS = roadMap.wrapT = THREE.RepeatWrapping;
    grassMap.repeat.set(40, 40);
    roadMap.repeat.set(1, 20);
  }, [grassMap, roadMap]);

  useFrame((_, delta) => {
    if (speed <= 0) return;
    if (grassMat.current) grassMat.current.map.offset.y -= delta * speed * 0.1;
    if (roadMat.current) roadMat.current.map.offset.y -= delta * speed * 1.0;
  });

  return (
    <group>
      {/* Grass */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial
          ref={grassMat}
          map={grassMap}
          color={isNight ? "#1a2a1a" : "#ffffff"}
        />
      </mesh>

      {/* Road */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[8, 200]} />
        <meshStandardMaterial
          ref={roadMat}
          map={roadMap}
          color={isNight ? "#1a1a2e" : "#ffffff"}
          roughness={0.9}
        />
      </mesh>

      {/* Glowing center lane dashes */}
      {Array.from({ length: 30 }, (_, i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.005, -i * 6 + 60]}
        >
          <planeGeometry args={[0.12, 2.5]} />
          <meshStandardMaterial
            color={isNight ? "#00dcc8" : "#ffffff"}
            emissive={isNight ? "#00dcc8" : "#cccccc"}
            emissiveIntensity={isNight ? 1.2 : 0.3}
          />
        </mesh>
      ))}

      {/* Road edge lines */}
      {[-3.8, 3.8].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.005, 0]}>
          <planeGeometry args={[0.15, 200]} />
          <meshStandardMaterial
            color={isNight ? "#ff6600" : "#ffffff"}
            emissive={isNight ? "#ff4400" : "#aaaaaa"}
            emissiveIntensity={isNight ? 0.8 : 0.2}
          />
        </mesh>
      ))}
    </group>
  );
}
