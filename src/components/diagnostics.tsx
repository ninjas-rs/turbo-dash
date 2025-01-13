export default function Diagnostics({ scene }: { scene: Phaser.Scene | null }) {
  return (
    <div className="absolute top-2 left-8 text-red-400">
      Scene: {scene?.scene.key}
      {"  -  "}
      FPS: {scene?.game.loop.actualFps}
    </div>
  );
}
