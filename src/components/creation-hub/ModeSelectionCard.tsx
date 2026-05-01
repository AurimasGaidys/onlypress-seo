'use client';

import { Sparkles, FilePlus, PenTool, MessageSquarePlus } from 'lucide-react';
import { Card } from '../ui/card';

interface ModeSelectionCardProps {
  icon: string;
  title: string;
  description: string;
  isActive: boolean;
  onClick: () => void;
}

export default function ModeSelectionCard({
  icon,
  title,
  description,
  isActive,
  onClick
}: ModeSelectionCardProps) {
  const renderIcon = () => {
    const iconProps = { className: 'h-8 w-8 mb-3' };

    switch (icon) {
      case 'Sparkles':
        return <Sparkles {...iconProps} />;
      case 'MessageSquarePlus':
        return <MessageSquarePlus {...iconProps} />;
      case 'FilePlus2':
        return <PenTool {...iconProps} />;
      case 'FilePlus':
        return <FilePlus {...iconProps} />;
      default:
        return null;
    }
  };

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 p-6 ${
        isActive
          ? 'border-primary bg-primary/5 shadow-lg'
          : 'hover:border-primary/50 hover:shadow-md'
      }`}
      onClick={onClick}
    >
      <div className="text-center">
        <div className={`${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
          {renderIcon()}
        </div>
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </Card>
  );
}
