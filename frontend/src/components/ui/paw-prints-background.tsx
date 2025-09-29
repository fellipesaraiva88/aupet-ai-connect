import React from 'react';

interface PawPrint {
  id: number;
  type: 'cat' | 'dog';
  x: number;
  y: number;
  rotation: number;
  delay: number;
  size: number;
}

// SVG Components for different paw types
const CatPaw = ({ size = 20 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className="opacity-[0.04] dark:opacity-[0.06]"
  >
    <path d="M8 8C8 6.34315 9.34315 5 11 5C12.6569 5 14 6.34315 14 8C14 9.65685 12.6569 11 11 11C9.34315 11 8 9.65685 8 8Z"/>
    <ellipse cx="7" cy="13" rx="2" ry="1.5"/>
    <ellipse cx="15" cy="13" rx="2" ry="1.5"/>
    <ellipse cx="11" cy="16" rx="1.5" ry="2"/>
    <ellipse cx="11" cy="20" rx="2.5" ry="1.5"/>
  </svg>
);

const DogPaw = ({ size = 24 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className="opacity-[0.04] dark:opacity-[0.06]"
  >
    <circle cx="8" cy="8" r="2.5"/>
    <circle cx="16" cy="8" r="2.5"/>
    <circle cx="6" cy="14" r="2"/>
    <circle cx="18" cy="14" r="2"/>
    <ellipse cx="12" cy="18" rx="4" ry="3"/>
  </svg>
);

const generatePawPrints = (): PawPrint[] => {
  const pawPrints: PawPrint[] = [];
  const count = window.innerWidth < 768 ? 8 : window.innerWidth < 1024 ? 12 : 16;
  
  for (let i = 0; i < count; i++) {
    pawPrints.push({
      id: i,
      type: Math.random() > 0.5 ? 'cat' : 'dog',
      x: Math.random() * 90 + 5, // 5% to 95% of screen width
      y: Math.random() * 90 + 5, // 5% to 95% of screen height
      rotation: Math.random() * 360,
      delay: Math.random() * 5,
      size: Math.random() * 8 + 16, // 16-24px
    });
  }
  
  return pawPrints;
};

export const PawPrintsBackground: React.FC = () => {
  const [pawPrints] = React.useState<PawPrint[]>(generatePawPrints);

  return (
    <div 
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      style={{ zIndex: -1 }}
    >
      {pawPrints.map((paw) => (
        <div
          key={paw.id}
          className="absolute animate-apple-gentle-hover text-muted-foreground"
          style={{
            left: `${paw.x}%`,
            top: `${paw.y}%`,
            transform: `rotate(${paw.rotation}deg)`,
            animationDelay: `${paw.delay}s`,
            animationDuration: `${4 + Math.random() * 2}s`,
          }}
        >
          {paw.type === 'cat' ? (
            <CatPaw size={paw.size} />
          ) : (
            <DogPaw size={paw.size} />
          )}
        </div>
      ))}
    </div>
  );
};