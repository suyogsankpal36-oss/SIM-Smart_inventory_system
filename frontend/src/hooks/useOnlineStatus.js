import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== "undefined" && typeof navigator.onLine === "boolean"
      ? navigator.onLine
      : true
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Internet connection restored. Realtime sync resumed!", {
        id: "network-status",
        duration: 3500,
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error("Internet disconnected. Running in offline mode.", {
        id: "network-status",
        duration: 4500,
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
