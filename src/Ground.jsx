// Ground.js
import { useFrame, useLoader } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { TextureLoader } from "three";

export default function Ground({ speed }) {
  // Load textures
  const grassMap = useLoader(TextureLoader, "/textures/grass.jpg");
  const roadMap = useLoader(TextureLoader, "/textures/road.jpg");

  const grassMaterial = useRef();
  const roadMaterial = useRef();

  // Make textures repeat
  grassMap.wrapS = grassMap.wrapT = THREE.RepeatWrapping;
  roadMap.wrapS = roadMap.wrapT = THREE.RepeatWrapping;

  // Tilings
  grassMap.repeat.set(40, 40);
  roadMap.repeat.set(1, 20);

  // Animate textures
  useFrame((state, delta) => {
    if (speed <= 0) return;

    const grassScroll = speed * 0.1;
    const roadScroll = speed * 1.0;

    if (grassMaterial.current) {
      grassMaterial.current.map.offset.y -= delta * grassScroll;
    }
    if (roadMaterial.current) {
      roadMaterial.current.map.offset.y -= delta * roadScroll;
    }
  });

  return (
    <group>
      {/* Large Grass Area */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.02, 0]}
        receiveShadow
      >
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial ref={grassMaterial} map={grassMap} />
      </mesh>

      {/* Road */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
        receiveShadow
      >
        <planeGeometry args={[4, 200]} />
        <meshStandardMaterial ref={roadMaterial} map={roadMap} />
      </mesh>
    </group>
  );
}
