import { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function VRUIPanel({ 
  headLightsOn, 
  setHeadLightsOn, 
  rearLightsOn, 
  setRearLightsOn, 
  isNight, 
  setIsNight,
  speed,
  setSpeed 
}) {
  const { gl, camera } = useThree();
  const panelRef = useRef();
  const buttonsRef = useRef([]);

  useEffect(() => {
    if (!gl.xr || !gl.xr.enabled) return;

    try {
      const controller1 = gl.xr.getController(0);
      const controller2 = gl.xr.getController(1);

      const onSelect = (event) => {
        const controller = event.target;
        const tempMatrix = new THREE.Matrix4();
        tempMatrix.identity().extractRotation(controller.matrixWorld);

        const raycaster = new THREE.Raycaster();
        raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
        raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

        // Check button intersections
        buttonsRef.current.forEach((button) => {
          if (!button || !button.userData.action) return;
          
          const intersects = raycaster.intersectObject(button, true);
          if (intersects.length > 0) {
            button.userData.action();
            
            // Haptic feedback
            const gamepad = event.target.gamepad;
            if (gamepad && gamepad.hapticActuators && gamepad.hapticActuators[0]) {
              gamepad.hapticActuators[0].pulse(0.5, 100);
            }
            
            // Visual feedback
            button.material.emissiveIntensity = 1;
            setTimeout(() => {
              if (button.material) button.material.emissiveIntensity = 0.3;
            }, 200);
          }
        });
      };

      controller1.addEventListener("select", onSelect);
      controller2.addEventListener("select", onSelect);

      return () => {
        controller1.removeEventListener("select", onSelect);
        controller2.removeEventListener("select", onSelect);
      };
    } catch (err) {
      console.warn("VR UI setup failed:", err);
    }
  }, [gl, setHeadLightsOn, setRearLightsOn, setIsNight, setSpeed]);

  useFrame(() => {
    if (!panelRef.current || !gl.xr) return;
    
    const session = gl.xr.getSession();
    if (session) {
      // Keep panel in front of user
      const cameraPos = camera.position.clone();
      const cameraDir = new THREE.Vector3(0, 0, -1);
      cameraDir.applyQuaternion(camera.quaternion);
      
      const panelPos = cameraPos.clone().add(cameraDir.multiplyScalar(1.5));
      panelPos.y = camera.position.y - 0.3;
      
      panelRef.current.position.lerp(panelPos, 0.1);
      panelRef.current.lookAt(camera.position);
    }
  });

  return (
    <group ref={panelRef} position={[0, 1.3, -1.5]}>
      {/* Main panel background */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[1.4, 0.9]} />
        <meshStandardMaterial 
          color="#050a14" 
          transparent 
          opacity={0.9}
          emissive="#00dcc8"
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* Title */}
      <mesh position={[0, 0.35, 0]}>
        <planeGeometry args={[0.8, 0.08]} />
        <meshBasicMaterial color="#00dcc8" transparent opacity={0.8} />
      </mesh>

      {/* Headlights Button */}
      <mesh 
        position={[-0.35, 0.15, 0]}
        ref={(el) => {
          if (el) {
            buttonsRef.current[0] = el;
            el.userData.action = () => setHeadLightsOn((p) => !p);
          }
        }}
      >
        <boxGeometry args={[0.3, 0.12, 0.02]} />
        <meshStandardMaterial 
          color={headLightsOn ? "#ffd700" : "#333333"}
          emissive={headLightsOn ? "#ffd700" : "#666666"}
          emissiveIntensity={headLightsOn ? 0.8 : 0.3}
        />
      </mesh>

      {/* Rear Lights Button */}
      <mesh 
        position={[0.35, 0.15, 0]}
        ref={(el) => {
          if (el) {
            buttonsRef.current[1] = el;
            el.userData.action = () => setRearLightsOn((p) => !p);
          }
        }}
      >
        <boxGeometry args={[0.3, 0.12, 0.02]} />
        <meshStandardMaterial 
          color={rearLightsOn ? "#ff4444" : "#333333"}
          emissive={rearLightsOn ? "#ff0000" : "#666666"}
          emissiveIntensity={rearLightsOn ? 0.8 : 0.3}
        />
      </mesh>

      {/* Day/Night Button */}
      <mesh 
        position={[0, -0.05, 0]}
        ref={(el) => {
          if (el) {
            buttonsRef.current[2] = el;
            el.userData.action = () => setIsNight((p) => !p);
          }
        }}
      >
        <boxGeometry args={[0.4, 0.12, 0.02]} />
        <meshStandardMaterial 
          color={isNight ? "#4444ff" : "#ffaa00"}
          emissive={isNight ? "#0066ff" : "#ff8800"}
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Speed Display */}
      <mesh position={[0, -0.25, 0]}>
        <planeGeometry args={[0.4, 0.15]} />
        <meshBasicMaterial color="#00dcc8" transparent opacity={0.3} />
      </mesh>

      {/* Speed - Button */}
      <mesh 
        position={[-0.25, -0.38, 0]}
        ref={(el) => {
          if (el) {
            buttonsRef.current[3] = el;
            el.userData.action = () => setSpeed((s) => Math.max(0, s - 10));
          }
        }}
      >
        <boxGeometry args={[0.15, 0.1, 0.02]} />
        <meshStandardMaterial 
          color="#ff4444"
          emissive="#ff0000"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Speed + Button */}
      <mesh 
        position={[0.25, -0.38, 0]}
        ref={(el) => {
          if (el) {
            buttonsRef.current[4] = el;
            el.userData.action = () => setSpeed((s) => Math.min(100, s + 10));
          }
        }}
      >
        <boxGeometry args={[0.15, 0.1, 0.02]} />
        <meshStandardMaterial 
          color="#44ff44"
          emissive="#00ff00"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Instructions - simplified */}
      <mesh position={[0, -0.52, 0]}>
        <planeGeometry args={[0.6, 0.04]} />
        <meshBasicMaterial color="#888888" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}
