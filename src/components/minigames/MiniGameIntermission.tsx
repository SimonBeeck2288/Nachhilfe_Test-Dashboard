import React from 'react';
import { MeditativeIntermission } from './MeditativeIntermission';

interface MiniGameIntermissionProps {
  onComplete: () => void;
  nextModuleTitle?: string;
}

export const MiniGameIntermission: React.FC<MiniGameIntermissionProps> = ({
  onComplete,
  nextModuleTitle = 'Nächstes Modul',
}) => {
  return (
    <MeditativeIntermission
      onComplete={onComplete}
      nextModuleTitle={nextModuleTitle}
    />
  );
};

export { MeditativeIntermission };
