import { useEffect, useState } from "react";

export default function VRButton({ gl, onSessionStart, onSessionEnd }) {
  const [vrSupported, setVrSupported] = useState(null);
  const [vrActive, setVrActive] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!navigator.xr) {
      setVrSupported(false);
      setMessage("WebXR not supported");
      return;
    }

    navigator.xr.isSessionSupported("immersive-vr")
      .then((supported) => {
        setVrSupported(supported);
        if (!supported) {
          setMessage("VR headset not detected");
        }
      })
      .catch(() => {
        setVrSupported(false);
        setMessage("WebXR check failed");
      });
  }, []);

  const handleClick = async () => {
    if (!vrSupported) {
      alert("VR is not supported on this device/browser. Please use a VR headset with a WebXR-compatible browser.");
      return;
    }

    if (!gl || !gl.xr) {
      alert("VR system not ready. Please wait a moment and try again.");
      return;
    }

    if (vrActive) {
      const session = gl.xr.getSession();
      if (session) await session.end();
    } else {
      try {
        const session = await navigator.xr.requestSession("immersive-vr", {
          optionalFeatures: ["local-floor", "bounded-floor", "hand-tracking"],
        });

        await gl.xr.setSession(session);
        setVrActive(true);
        if (onSessionStart) onSessionStart();

        session.addEventListener("end", () => {
          setVrActive(false);
          if (onSessionEnd) onSessionEnd();
        });
      } catch (err) {
        console.error("VR session failed:", err);
        alert("Failed to start VR session: " + err.message);
      }
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`hud-btn ${vrActive ? "vr-active" : ""}`}
      title={message || "Enter VR mode"}
    >
      {vrActive ? "◈ EXIT VR" : "◈ ENTER VR"}
    </button>
  );
}
