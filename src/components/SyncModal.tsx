import React from 'react';
import { SyncBackupModal } from './SyncBackupModal';
import type { SyncBackupModalProps } from './SyncBackupModal';

export type SyncModalProps = SyncBackupModalProps;

export const SyncModal: React.FC<SyncModalProps> = (props) => {
  return <SyncBackupModal {...props} />;
};

export default SyncModal;
