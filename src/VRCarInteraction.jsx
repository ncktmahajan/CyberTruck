import { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

export default function VRCarInteraction({ 
  carRef, 
  currentSeat, 
  onSeatRequest,
  onExitCar 
}) {
  const { gl, camera } = useThree();
  const hotspotRefs = useRef([]);
  const seatPanelRef = useRef();

  const seatPositions = {
    driver: { pos: [0.5, 1.5, 0.4], label: "DRIVER SEAT" },
    passenger: { pos: [-0.5, 1.5, 0.4], label: "PASSENGER" },
    rear_left: { pos: [0.6, 1.5, -0.2], label: "REAR LEFT" },
    rear_right: { pos: [-0.6, 1.5, -0.2], label: "REAR RIGHT" },
  };

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

        // Check hotspot intersections
        hotspotRefs.current.forEach((hotspot) => {
          if (!hotspot || !hotspot.userData.action) return;
          
          const intersects = raycaster.intersectObject(hotspot, true);
          if (intersects.length > 0) {
            hotspot.userData.action();
            
            // Haptic feedback
            const gamepad = event.target.gamepad;
            if (gamepad && gamepad.hapticActuators && gamepad.hapticActuators[0]) {
              gamepad.hapticActuators[0].pulse(0.6, 120);
            }
            
            // Visual feedback
            const originalScale = hotspot.scale.clone();
            hotspot.scale.multiplyScalar(1.3);
            setTimeout(() => {
              if (hotspot.scale) hotspot.scale.copy(originalScale);
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
      console.warn("VR car interaction setup failed:", err);
    }
  }, [gl, onSeatRequest, onExitCar, currentSeat]);

  useFrame(() => {
    if (!seatPanelRef.current || !gl.xr || !currentSeat) return;
    
    const session = gl.xr.getSession();
    if (session) {
      // Keep seat panel visible when inside car
      const cameraPos = camera.position.clone();
      const panelPos = cameraPos.clone();
      panelPos.y -= 0.4;
      panelPos.z -= 0.8;
      
      seatPanelRef.current.position.lerp(panelPos, 0.1);
      seatPanelRef.current.lookAt(camera.position);
    }
  });

  return (
    <>
      {/* Seat hotspots - only show when NOT in a seat */}
      {!currentSeat && Object.entries(seatPositions).map(([seatKey, data], index) => (
        <group key={seatKey} position={data.pos}>
          {/* Glowing sphere hotspot */}
          <mesh
            ref={(el) => {
              if (el) {
                hotspotRefs.current[index] = el;
                el.userData.action = () => onSeatRequest(seatKey);
              }
            }}
          >
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial
              color="#00dcc8"
              emissive="#00dcc8"
              emissiveIntensity={0.8}
              transparent
              opacity={0.7}
            />
          </mesh>
          
          {/* Label */}
          <Text
            position={[0, 0.25, 0]}
            fontSize={0.08}
            color="#00dcc8"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.01}
            outlineColor="#000000"
          >
            {data.label}
          </Text>
          
          {/* Pulsing ring */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
            <ringGeometry args={[0.18, 0.22, 32]} />
            <meshBasicMaterial color="#00dcc8" transparent opacity={0.5} />
          </mesh>
        </group>
      ))}

      {/* Seat selection panel - only show when IN a seat */}
      {currentSeat && (
        <group ref={seatPanelRef} position={[0, 1.2, -0.8]}>
          {/* Panel background */}
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[1.2, 0.7]} />
            <meshStandardMaterial 
              color="#050a14" 
              transparent 
              opacity={0.9}
              emissive="#00dcc8"
              emissiveIntensity={0.1}
            />
          </mesh>

          {/* Title */}
          <Text
            position={[0, 0.25, 0]}
            fontSize={0.05}
            color="#00dcc8"
            anchorX="center"
            anchorY="middle"
          >
            SEAT SELECTION
          </Text>

          {/* Exit button */}
          <mesh 
            position={[0, 0.1, 0]}
            ref={(el) => {
              if (el) {
                hotspotRefs.current[10] = el;
                el.userData.action = onExitCar;
              }
            }}
          >
            <boxGeometry args={[0.5, 0.12, 0.02]} />
            <meshStandardMaterial 
              color="#ff4444"
              emissive="#ff0000"
              emissiveIntensity={0.5}
            />
          </mesh>
          <Text
            position={[0, 0.1, 0.02]}
            fontSize={0.045}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            EXIT CAR
          </Text>

          {/* Seat buttons */}
          {Object.entries(seatPositions).map(([seatKey, data], idx) => {
            const row = Math.floor(idx / 2);
            const col = idx % 2;
            const x = col === 0 ? -0.28 : 0.28;
            const y = -0.05 - row * 0.15;
            const isCurrentSeat = currentSeat === seatKey;

            return (
              <group key={seatKey}>
                <mesh 
                  position={[x, y, 0]}
                  ref={(el) => {
                    if (el) {
                      hotspotRefs.current[11 + idx] = el;
                      el.userData.action = () => onSeatRequest(seatKey);
                    }
                  }}
                >
                  <boxGeometry args={[0.25, 0.1, 0.02]} />
                  <meshStandardMaterial 
                    color={isCurrentSeat ? "#00dcc8" : "#333333"}
                    emissive={isCurrentSeat ? "#00dcc8" : "#666666"}
                    emissiveIntensity={isCurrentSeat ? 0.8 : 0.3}
                  />
                </mesh>
                <Text
                  position={[x, y, 0.02]}
                  fontSize={0.03}
                  color="#ffffff"
                  anchorX="center"
                  anchorY="middle"
                >
                  {data.label.split(' ')[0]}
                </Text>
              </group>
            );
          })}

          {/* Instructions */}
          <Text
            position={[0, -0.32, 0]}
            fontSize={0.025}
            color="#888888"
            anchorX="center"
            anchorY="middle"
          >
            Point & Click to Switch
          </Text>
        </group>
      )}
    </>
  );
}
