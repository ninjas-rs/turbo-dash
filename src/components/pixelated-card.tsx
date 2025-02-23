import { ReactNode } from "react";

const PixelatedCard = ({ children }: { children: ReactNode }) => {
  return (
    <div
      className="h-full min-w-[28vw] pointer-events-auto flex flex-col items-center justify-center bg-no-repeat bg-contain bg-center relative"
      style={{
        backgroundImage: "url('/assets/modal.svg')",
        backgroundSize: "100% 100%",
      }}
    >
      {children}
    </div>
  );
};

export default PixelatedCard;
