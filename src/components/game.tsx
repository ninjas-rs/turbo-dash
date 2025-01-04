import { Card } from "pixel-retroui";

export default function Game({ scene }: { scene: Phaser.Scene }) {
  return (
    <div className="h-full relative">
      <Card className="absolute top-4 left-4">Player Name</Card>
      <Card className="absolute top-4 right-8">$100</Card>
    </div>
  );
}
