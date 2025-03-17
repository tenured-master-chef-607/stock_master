import React from 'react';
import { Button, Tooltip } from 'antd';
import { UndoOutlined } from '@ant-design/icons';

interface FolderOperationsProps {
  onUndo: () => void;
  style?: React.CSSProperties;
}

export const FolderOperations: React.FC<FolderOperationsProps> = ({ onUndo, style }) => {
  return (
    <Tooltip title="撤回上一次操作">
      <Button
        type="link"
        icon={<UndoOutlined />}
        size="middle"
        onClick={onUndo}
        style={{
          padding: '4px 8px',
          ...style
        }}
      />
    </Tooltip>
  );
}; 