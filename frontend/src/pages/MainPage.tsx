import React, { useState, useEffect } from 'react';
import { StockDebugInfo } from '../components/StockDebugInfo';
import { FolderOperations } from '../components/FolderOperations';
import { message, Button, Input } from 'antd';

interface WatchlistItem {
  symbol: string;
  group: string;
  subgroup?: string;
}

interface GroupedStocks {
  [key: string]: {
    [key: string]: string[];
  };
}

interface FolderState {
  expanded: boolean;
  stocks: string[];
}

interface FolderHistory {
  timestamp: number;
  groupName: string;
  previousState: FolderState;
}

interface FolderOperation {
  type: 'ADD' | 'DELETE' | 'MOVE';
  timestamp: number;
  data: {
    symbol: string;
    fromGroup?: string;
    toGroup?: string;
  };
}

export const MainPage: React.FC = () => {
  const [loadedStocks, setLoadedStocks] = useState<string[]>([]);
  const [groupedStocks, setGroupedStocks] = useState<GroupedStocks>({});
  const [folderHistory, setFolderHistory] = useState<FolderHistory[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [operationHistory, setOperationHistory] = useState<FolderOperation[]>([]);

  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/watchlist`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('获取观察列表失败');
        }
        
        const data: WatchlistItem[] = await response.json();
        console.log('Watchlist data:', data);

        // 处理所有股票（不分组）
        setLoadedStocks(data.map(item => item.symbol));

        // 处理分组股票
        const grouped: GroupedStocks = {};
        data.forEach(item => {
          const group = item.group || '默认分组';
          const subgroup = item.subgroup || '默认子分组';
          
          if (!grouped[group]) {
            grouped[group] = {};
          }
          if (!grouped[group][subgroup]) {
            grouped[group][subgroup] = [];
          }
          
          grouped[group][subgroup].push(item.symbol);
        });

        setGroupedStocks(grouped);
        console.log('Grouped stocks:', grouped);

      } catch (error) {
        console.error('加载观察列表失败:', error);
        message.error('加载观察列表失败');
      }
    };

    fetchWatchlist();
  }, []);

  // 用于调试的函数，打印所有分组信息
  const printGroupStructure = () => {
    Object.entries(groupedStocks).forEach(([group, subgroups]) => {
      console.log(`Group: ${group}`);
      Object.entries(subgroups).forEach(([subgroup, stocks]) => {
        console.log(`  Subgroup: ${subgroup}`);
        console.log(`    Stocks: ${stocks.join(', ')}`);
      });
    });
  };

  useEffect(() => {
    printGroupStructure();
  }, [groupedStocks]);

  const handleFolderToggle = (groupName: string, isExpanded: boolean) => {
    // 保存当前状态到历史记录
    const currentState: FolderState = {
      expanded: !isExpanded,
      stocks: groupedStocks[groupName]?.['默认子分组'] || []
    };

    setFolderHistory(prev => [...prev, {
      timestamp: Date.now(),
      groupName,
      previousState: currentState
    }]);

    // 更新展开状态
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (isExpanded) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  };

  const handleUndo = () => {
    if (operationHistory.length === 0) {
      message.info('没有可撤回的操作');
      return;
    }

    const lastOperation = operationHistory[operationHistory.length - 1];
    try {
      // 根据操作类型执行撤回
      switch (lastOperation.type) {
        case 'ADD':
          // 撤回添加操作
          fetch(`${process.env.REACT_APP_API_URL}/api/watchlist/remove`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              symbol: lastOperation.data.symbol,
              group: lastOperation.data.toGroup
            }),
          });
          break;
        case 'DELETE':
          // 撤回删除操作
          fetch(`${process.env.REACT_APP_API_URL}/api/watchlist/add`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              symbol: lastOperation.data.symbol,
              group: lastOperation.data.fromGroup
            }),
          });
          break;
        // 可以添加其他操作类型的处理
      }

      // 从历史记录中移除该操作
      setOperationHistory(prev => prev.slice(0, -1));
      message.success('已撤回上一次操作');
    } catch (error) {
      console.error('撤回操作失败:', error);
      message.error('撤回操作失败');
    }
  };

  const renderFolderStructure = () => {
    return (
      <div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginBottom: '16px',
          gap: '8px'
        }}>
          <Input.Search placeholder="搜索股票" style={{ width: '200px' }} />
          <Button>+ 新建文件夹</Button>
          <FolderOperations 
            onUndo={handleUndo}
            style={{ marginLeft: 'auto' }}
          />
        </div>

        {/* 文件夹列表 */}
        {Object.entries(groupedStocks).map(([groupName, subgroups]) => (
          <div key={groupName} style={{ marginBottom: '8px' }}>
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center',
                cursor: 'pointer',
                padding: '4px',
                backgroundColor: '#f5f5f5',
                borderRadius: '4px'
              }}
            >
              <span 
                style={{ width: '20px', textAlign: 'center' }}
                onClick={() => handleFolderToggle(groupName, expandedFolders.has(groupName))}
              >
                {expandedFolders.has(groupName) ? '▼' : '▶'}
              </span>
              <span style={{ marginLeft: '8px' }}>{groupName}</span>
            </div>
            {expandedFolders.has(groupName) && (
              <div style={{ 
                marginLeft: '20px',
                marginTop: '4px',
                padding: '4px',
                backgroundColor: '#fafafa',
                borderRadius: '4px'
              }}>
                {subgroups['默认子分组']?.map(stock => (
                  <div key={stock} style={{ padding: '4px 8px' }}>{stock}</div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ padding: '20px' }}>
      {renderFolderStructure()}
      <StockDebugInfo stocks={loadedStocks} />
    </div>
  );
}; 