import { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function VRSimpleUI({ 
  headLightsOn, 
  setHeadLightsOn, 
  rearLightsOn, 
  setRearLightsOn, 
  isNight, 
  setIsNight,
  speed,
  setSpeed,
  currentSeat,
  onSeatRequest,
  onExitCar
}) {
  const { gl, camera } = useThree();
  const panelRef = useRef();
  const buttonsRef = useRef([]);

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

      buttonsRef.current.forEach((button) => {
        if (!button || !button.userData.action) return;
        
        const intersects = raycaster.intersectObject(button, true);
        if (intersects.length > 0) {
          button.userData.action();
          
          // Haptic feedback
          const gamepad = event.target.gamepad;
          if (gamepad?.hapticActuators?.[0]) {
            gamepad.hapticActuators[0].pulse(0.5, 100);
          }
          
          // Visual feedback
          const originalColor = button.material.color.clone();
          button.material.color.set(0xffffff);
          setTimeout(() => {
            if (button.material) button.material.color.copy(originalColor);
          }, 150);
        }
      });
    };

    controller1.addEventListener("select", onSelect);
    controller2.addEventListener("select", onSelect);

    return () => {
      controller1.removeEventListener("select", onSelect);
      controller2.removeEventListener("select", onSelect);
    };
  }, [gl, setHeadLightsOn, setRearLightsOn, setIsNight, setSpeed, onSeatRequest, onExitCar, currentSeat]);

  useFrame(() => {
    if (!panelRef.current || !gl.xr) return;
    
    const session = gl.xr.getSession();
    if (session) {
      const cameraPos = camera.position.clone();
      const cameraDir = new THREE.Vector3(0, 0, -1);
      cameraDir.applyQuaternion(camera.quaternion);
      
      const panelPos = cameraPos.clone().add(cameraDir.multiplyScalar(0.8));
      panelPos.y = cameraPos.y - 0.2;
      
      panelRef.current.position.lerp(panelPos, 0.05);
      panelRef.current.lookAt(camera.position);
    }
  });

  return (
    <group ref={panelRef} position={[0, 1.4, -0.8]}>
      {/* Main panel */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[0.6, 0.8]} />
        <meshStandardMaterial color="#0a0a0a" transparent opacity={0.85} />
      </mesh>

      {/* Headlights button */}
      <mesh 
        position={[-0.15, 0.3, 0]}
        ref={(el) => {
          if (el) {
            buttonsRef.current[0] = el;
            el.userData.action = () => setHeadLightsOn((p) => !p);
          }
        }}
      >
        <boxGeometry args={[0.12, 0.08, 0.02]} />
        <meshStandardMaterial 
          color={headLightsOn ? "#ffff00" : "#333333"}
          emissive={headLightsOn ? "#ffff00" : "#000000"}
          emissiveIntensity={headLightsOn ? 0.5 : 0}
        />
      </mesh>

      {/* Rear lights button */}
      <mesh 
        position={[0.15, 0.3, 0]}
        ref={(el) => {
          if (el) {
            buttonsRef.current[1] = el;
            el.userData.action = () => setRearLightsOn((p) => !p);
          }
        }}
      >
        <boxGeometry args={[0.12, 0.08, 0.02]} />
        <meshStandardMaterial 
          color={rearLightsOn ? "#ff0000" : "#333333"}
          emissive={rearLightsOn ? "#ff0000" : "#000000"}
          emissiveIntensity={rearLightsOn ? 0.5 : 0}
        />
      </mesh>

      {/* Day/Night button */}
      <mesh 
        position={[0, 0.15, 0]}
        ref={(el) => {
          if (el) {
            buttonsRef.current[2] = el;
            el.userData.action = () => setIsNight((p) => !p);
          }
        }}
      >
        <boxGeometry args={[0.25, 0.08, 0.02]} />
        <meshStandardMaterial 
          color={isNight ? "#0044ff" : "#ffaa00"}
          emissive={isNight ? "#0044ff" : "#ffaa00"}
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Speed indicator */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.25, 0.06, 0.01]} />
        <meshStandardMaterial color="#00dcc8" emissive="#00dcc8" emissiveIntensity={0.3} />
      </mesh>

      {/* Speed - button */}
      <mesh 
        position={[-0.15, -0.1, 0]}
        ref={(el) => {
          if (el) {
            buttonsRef.current[3] = el;
            el.userData.action = () => setSpeed((s) => Math.max(0, s - 10));
          }
        }}
      >
        <boxGeometry args={[0.12, 0.08, 0.02]} />
        <meshStandardMaterial color="#ff4444" emissive="#ff0000" emissiveIntensity={0.2} />
      </mesh>

      {/* Speed + button */}
      <mesh 
        position={[0.15, -0.1, 0]}
        ref={(el) => {
          if (el) {
            buttonsRef.current[4] = el;
            el.userData.action = () => setSpeed((s) => Math.min(100, s + 10));
          }
        }}
      >
        <boxGeometry args={[0.12, 0.08, 0.02]} />
        <meshStandardMaterial color="#44ff44" emissive="#00ff00" emissiveIntensity={0.2} />
      </mesh>

      {/* Exit car button - only show when in seat */}
      {currentSeat && (
        <mesh 
          position={[0, -0.25, 0]}
          ref={(el) => {
            if (el) {
              buttonsRef.current[5] = el;
              el.userData.action = onExitCar;
            }
          }}
        >
          <boxGeometry args={[0.25, 0.08, 0.02]} />
          <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.3} />
        </mesh>
      )}

      {/* Seat buttons - only show when in seat */}
      {currentSeat && (
        <>
          <mesh 
            position={[-0.15, -0.35, 0]}
            ref={(el) => {
              if (el) {
                buttonsRef.current[6] = el;
                el.userData.action = () => onSeatRequest('driver');
              }
            }}
          >
            <boxGeometry args={[0.12, 0.06, 0.02]} />
            <meshStandardMaterial 
              color={currentSeat === 'driver' ? "#00dcc8" : "#333333"}
              emissive={currentSeat === 'driver' ? "#00dcc8" : "#000000"}
              emissiveIntensity={currentSeat === 'driver' ? 0.5 : 0}
            />
          </mesh>
          <mesh 
            position={[0.15, -0.35, 0]}
            ref={(el) => {
              if (el) {
                buttonsRef.current[7] = el;
                el.userData.action = () => onSeatRequest('passenger');
              }
            }}
          >
            <boxGeometry args={[0.12, 0.06, 0.02]} />
            <meshStandardMaterial 
              color={currentSeat === 'passenger' ? "#00dcc8" : "#333333"}
              emissive={currentSeat === 'passenger' ? "#00dcc8" : "#000000"}
              emissiveIntensity={currentSeat === 'passenger' ? 0.5 : 0}
            />
          </mesh>
        </>
      )}
    </group>
  );
}
