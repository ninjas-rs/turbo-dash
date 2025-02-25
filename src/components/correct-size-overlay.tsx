import { useEffect, useState } from "react";

export default function CorrectSizeOverlay() {
  const [aspectRatio, setAspectRatio] = useState(16 / 9);

  useEffect(() => {
    const updateAspectRatio = () => {
      const ratio = window.innerWidth / window.innerHeight;
      setAspectRatio(ratio);
    };

    updateAspectRatio();

    window.addEventListener("resize", updateAspectRatio);

    return () => {
      window.removeEventListener("resize", updateAspectRatio);
    };
  }, []);

  const valid = Math.abs(aspectRatio - 16 / 9) < 0.5; // Allow some tolerance

  if (!valid) {
    return (
      <div className="absolute h-screen w-screen inset-0 flex items-center justify-center bg-black bg-opacity-95 px-10">
        <div className="text-white text-center space-y-4">
          <h1 className="text-4xl text-red-400">Warning!</h1>
          <p className="text-lg">
            This game is best played in landscape mode on a laptop
            screen. <br/> (ps mobile support coming soon)
          </p>
        </div>
      </div>
    );
  }

  return null;
}
