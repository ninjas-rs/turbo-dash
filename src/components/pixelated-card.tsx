import { ReactNode } from "react";

const cn = (...classes: (string | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

interface PixelatedCardProps {
  children: ReactNode;
  className?: string;
}

const PixelatedCard = ({ children, className }: PixelatedCardProps) => {
  return (
    <div
      className={cn(
        "h-full min-w-[28vw] pointer-events-auto flex flex-col items-center justify-center bg-no-repeat bg-contain bg-center relative",
        className
      )}
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