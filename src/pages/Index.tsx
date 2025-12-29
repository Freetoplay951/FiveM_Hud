import { HUD } from '@/components/HUD';

const Index = () => {
  return (
    <div 
      className="min-h-screen w-full"
      style={{ 
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
      }}
    >
      <HUD />
    </div>
  );
};

export default Index;
