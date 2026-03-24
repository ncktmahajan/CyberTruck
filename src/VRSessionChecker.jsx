import { useEffect, useState } from "react";
import { useThree } from "@react-three/fiber";

export default function VRSessionChecker({ children }) {
  const { gl } = useThree();
  const [isInVR, setIsInVR] = useState(false);

  useEffect(() => {
    if (!gl.xr) return;

    const checkSession = () => {
      const session = gl.xr.getSession();
      setIsInVR(!!session);
    };

    const interval = setInterval(checkSession, 100);
    return () => clearInterval(interval);
  }, [gl]);

  if (!isInVR) return null;
  
  return <>{children}</>;
}
