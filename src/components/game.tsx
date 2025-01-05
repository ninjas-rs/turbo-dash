import { Card } from "pixel-retroui";

export default function Game({ scene }: { scene: Phaser.Scene }) {
  return (
    <div className="h-full w-full flex flex-col p-8">
      <div className="flex flex-row justify-between">
        <Card className="">Player Name</Card>
        <Card className="">$100</Card>
      </div>
    </div>
  );
}
