import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Spin, message, Layout, Input, Button, Modal, Form, Dropdown, Badge, AutoComplete, DatePicker, Tree, Tooltip } from 'antd';
import { PlusOutlined, DeleteOutlined, FolderOutlined, MoreOutlined, AlertOutlined, StockOutlined, ExpandOutlined, CompressOutlined, EditOutlined, ReloadOutlined } from '@ant-design/icons';
import { AdvancedRealTimeChart } from 'react-ts-tradingview-widgets';
import StockAnalysis from './StockAnalysis';
import dayjs from 'dayjs';
import type { RangePickerProps } from 'antd/es/date-picker';
import type { DataNode, TreeProps, EventDataNode } from 'antd/es/tree';
import type { Key } from 'rc-tree/lib/interface';
import { StockSearch } from './StockSearch';
import { ThemeContext } from '../App';

const { Sider, Content } = Layout;
const { Search, TextArea } = Input;

interface StockCardProps {
  symbol: string;
  timeframe: "1" | "3" | "5" | "15" | "30" | "60" | "120" | "180" | "240" | "D" | "W" | "BACKTEST";
  backTestRange?: [dayjs.Dayjs | null, dayjs.Dayjs | null];
}

interface StockGroup {
  description: string;
  stocks: string[];
  subGroups?: { [key: string]: StockGroup };  // 添加子文件夹
}

interface GroupData {
  [key: string]: StockGroup;
}

interface AlertData {
  type: string;
  message: string;
  value: number;
  threshold: number;
}

// 添加 WatchlistData 接口
interface WatchlistData {
  groups: {
    [key: string]: StockGroup;
  };
}

const StockCard: React.FC<StockCardProps> = ({ symbol, timeframe, backTestRange }) => {
  const [note, setNote] = useState<string>("");
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [editedNote, setEditedNote] = useState<string>("");
  const noteEditorRef = React.useRef<HTMLDivElement>(null);
  const analysisColRef = React.useRef<HTMLDivElement>(null);
  const { darkMode } = React.useContext(ThemeContext);

  // 计算编辑窗口位置的函数
  const calculateEditorPosition = () => {
    if (analysisColRef.current) {
      const rect = analysisColRef.current.getBoundingClientRect();
      return {
        top: rect.top - 210, // 在分析报告上方20px
        left: rect.left,
      };
    }
    return null;
  };

  // 修改点击外部处理函数
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (noteEditorRef.current && !noteEditorRef.current.contains(event.target as Node)) {
        setIsEditingNote(false);  // 更正为false，点击外部应该关闭编辑窗口
      }
    };

    if (isEditingNote) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditingNote]);

  // 获取备注
  useEffect(() => {
    const fetchNote = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/stock/note/${symbol}`);
        if (response.ok) {
          const data = await response.json();
          setNote(data.note);
        }
      } catch (error) {
        console.error('Failed to fetch note:', error);
      }
    };
    fetchNote();
  }, [symbol]);

  // 更新备注
  const updateNote = async (newNote: string) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/stock/note`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol,
          note: newNote,
        }),
      });

      if (response.ok) {
        setNote(newNote);
        message.success('Note updated');
      } else {
        message.error('Failed to update note');
      }
    } catch (error) {
      console.error('Failed to update note:', error);
      message.error('Failed to update note');
    }
  };

  // 处理备注编辑
  const handleNoteEdit = () => {
    setEditedNote(note);
    setIsEditingNote(true);
  };

  // 处理备注保存
  const handleNoteSave = () => {
    updateNote(editedNote);
    setIsEditingNote(false);
  };

  const getChartRange = () => {
    if (timeframe === "BACKTEST" && backTestRange && backTestRange[0] && backTestRange[1]) {
      const diffDays = backTestRange[1].diff(backTestRange[0], 'day');
      if (diffDays <= 30) return "1M";
      if (diffDays <= 90) return "3M";
      if (diffDays <= 180) return "6M";
      return "12M";
    }
    return timeframe === "D" ? "12M" : 
           timeframe === "W" ? "60M" : "1D";
  };

  // 计算开始时间和结束时间
  const getFromTo = () => {
    if (timeframe === "BACKTEST" && backTestRange && backTestRange[0] && backTestRange[1]) {
      return {
        from: backTestRange[0].format('YYYY-MM-DD'),
        to: backTestRange[1].format('YYYY-MM-DD')
      };
    }
    return undefined;
  };

  const dateRange = getFromTo();

  return (
    <Card 
      className="stock-card"
      title={
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          position: 'relative',
          justifyContent: 'center',
          minHeight: '32px'
        }}>
          <span style={{ 
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            fontWeight: 500,
            color: 'var(--primary-color)',
            fontSize: '16px',
            padding: '4px 12px',
            borderRadius: '12px',
            background: darkMode ? 'rgba(24, 144, 255, 0.1)' : 'rgba(24, 144, 255, 0.08)',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
            transition: 'all 0.3s ease'
          }}>{symbol}</span>
          <div style={{ position: 'absolute', right: 0 }}>
            {isEditingNote ? (
              <div 
                ref={noteEditorRef}
                style={{ 
                  position: 'fixed',
                  zIndex: 1000,
                  background: darkMode 
                    ? 'linear-gradient(to bottom, var(--bg-secondary), var(--bg-elevated))' 
                    : 'var(--bg-secondary)',
                  padding: '16px',
                  borderRadius: '12px',
                  boxShadow: '0 8px 24px var(--shadow-color)',
                  width: '400px',
                  maxWidth: '90vw',
                  transition: 'all 0.3s ease',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  ...(calculateEditorPosition() || {})
                }}
              >
                <div style={{ 
                  marginBottom: '12px', 
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>Edit Note</span>
                  <span style={{ 
                    color: 'var(--primary-color)', 
                    backgroundColor: 'var(--highlight-bg)', 
                    padding: '2px 8px', 
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}>
                    {symbol}
                  </span>
                </div>
                <TextArea
                  value={editedNote}
                  onChange={(e) => {
                    setEditedNote(e.target.value);
                    // 自动调整高度
                    const textarea = e.target as HTMLTextAreaElement;
                    textarea.style.height = 'auto';
                    textarea.style.height = `${textarea.scrollHeight}px`;
                  }}
                  placeholder="Add note here..."
                  autoFocus
                  autoSize={{ minRows: 3 }}
                  style={{ 
                    resize: 'none',
                    maxHeight: '60vh',
                    overflowY: 'auto',
                    borderRadius: '8px',
                    backgroundColor: darkMode ? 'var(--bg-elevated)' : 'var(--bg-primary)',
                    transition: 'all 0.3s ease'
                  }}
                />
                <div style={{ 
                  marginTop: '12px',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '8px'
                }}>
                  <Button 
                    onClick={() => setIsEditingNote(false)}
                    size="middle"
                    style={{
                      borderRadius: '6px'
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="primary" 
                    onClick={handleNoteSave}
                    size="middle"
                    style={{
                      borderRadius: '6px'
                    }}
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <Tooltip title={note || 'Click to add note'} placement="topRight">
                <div
                  onClick={handleNoteEdit}
                  style={{
                    cursor: 'pointer',
                    color: note ? 'var(--text-secondary)' : 'var(--primary-color)',
                    fontSize: '14px',
                    maxWidth: 500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    textAlign: 'right',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    transition: 'all 0.3s ease',
                    backgroundColor: note ? (darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)') : 'transparent'
                  }}
                >
                  {note ? note.split('\n')[0].slice(0, 30) + (note.split('\n')[0].length > 30 ? '...' : '') : '+ Add note'}
                </div>
              </Tooltip>
            )}
          </div>
        </div>
      }
      style={{ 
        marginBottom: 16,
        marginLeft: timeframe === "BACKTEST" ? '10px' : 0
      }}
      bodyStyle={{ padding: '12px' }}
      bordered={false}
    >
      <Row gutter={16}>
        <Col flex="auto">
          <div className="tradingview-chart-container" style={{ height: 400 }}>
            <AdvancedRealTimeChart
              symbol={symbol}
              interval={timeframe === "BACKTEST" ? "D" : timeframe}
              theme={darkMode ? "dark" : "light"}
              width="100%"
              height={400}
              allow_symbol_change={true}
              hide_side_toolbar={false}
              range={getChartRange()}
              timezone="America/New_York"
              style = "3"
            />
          </div>
        </Col>
        <Col style={{ width: 530, maxHeight: 400, overflowY: 'auto' }} ref={analysisColRef}>
          <StockAnalysis symbol={symbol} />
        </Col>
      </Row>
    </Card>
  );
};

const StockDashboard: React.FC = () => {
  const [watchlist, setWatchlist] = useState<WatchlistData>({ groups: {} });
  const [loading, setLoading] = useState(true);
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [timeframe, setTimeframe] = useState<StockCardProps['timeframe']>("D");
  const [selectedKeys, setSelectedKeys] = useState<Key[]>([]);
  const [siderVisible, setSiderVisible] = useState(false);
  const [siderPinned, setSiderPinned] = useState(false);
  // Add state for rename and delete folder prompts
  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [newFolderName, setNewFolderName] = useState<string>('');
  const renameModalRef = React.useRef<HTMLDivElement>(null);
  const deleteModalRef = React.useRef<HTMLDivElement>(null);
  const { darkMode } = React.useContext(ThemeContext);

  // Add a ref for the sider element to handle mouse interactions
  const siderRef = React.useRef<HTMLDivElement>(null);

  // Add handlers for mouse events
  const handleMouseEnter = () => {
    if (!siderPinned) {
      setSiderVisible(true);
    }
  };

  const handleMouseLeave = () => {
    if (!siderPinned) {
      setSiderVisible(false);
    }
  };

  // Toggle pinned state
  const toggleSiderPin = () => {
    setSiderPinned(!siderPinned);
    setSiderVisible(true); // Ensure sidebar is visible when pinning
  };

  // Add click outside handler to close sider when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (siderRef.current && !siderRef.current.contains(event.target as Node)) {
        if (!siderPinned) {
          setSiderVisible(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [siderPinned]);

  // 添加 ref 映射来存储每个股票卡片的引用
  const stockRefs = React.useRef<{ [key: string]: HTMLDivElement | null }>({});

  // 滚动到指定股票的函数
  const scrollToStock = (symbol: string) => {
    const element = stockRefs.current[symbol];
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  // 获取观察列表
  const fetchWatchlist = React.useCallback(async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/watchlist`);
      if (!response.ok) {
        throw new Error('获取观察列表失败');
      }
      const data = await response.json();
      
      // 完全替换现有的 watchlist 状态
      setWatchlist({ groups: data.groups || {} });
      
      // 清理 stockRefs
      stockRefs.current = {};
      
      // 清除选中状态
      setSelectedStock(null);
      setSelectedKeys([]);
      
      // 默认展开所有分组
      setExpandedKeys(getAllFolderKeys(data.groups));
    } catch (error) {
      console.error('获取观察列表失败:', error);
      message.error('获取观察列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  // 获取所有唯一的股票
  const getAllStocks = () => {
    const allStocks = new Set<string>();
    
    const addStocksFromGroup = (group: StockGroup) => {
      // 添加当前分组的股票
      group.stocks.forEach(stock => allStocks.add(stock));
      
      // 递归处理子分组
      if (group.subGroups) {
        Object.values(group.subGroups).forEach(subGroup => {
          addStocksFromGroup(subGroup);
        });
      }
    };
    
    Object.values(watchlist.groups).forEach(group => {
      addStocksFromGroup(group);
    });
    
    return Array.from(allStocks);
  };

  // 获取已分组的股票
  const getGroupedStocks = () => {
    const groupedStocks = new Set<string>();
    
    const addStocksFromGroup = (group: StockGroup) => {
      // 添加当前分组的股票
      group.stocks.forEach(stock => groupedStocks.add(stock));
      
      // 递归处理子分组
      if (group.subGroups) {
        Object.values(group.subGroups).forEach(subGroup => {
          addStocksFromGroup(subGroup);
        });
      }
    };
    
    Object.entries(watchlist.groups).forEach(([groupName, group]) => {
      if (groupName !== "默认分组") {
        addStocksFromGroup(group);
      }
    });
    
    return groupedStocks;
  };

  // 获取未分组的股票
  const getUngroupedStocks = () => {
    const allStocks = getAllStocks();
    const groupedStocks = getGroupedStocks();
    return allStocks.filter(stock => !groupedStocks.has(stock));
  };

  // 修改 handleDeleteStock 函数
  const handleDeleteStock = async (groupName: string, symbol: string) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/watchlist/${encodeURIComponent(groupName)}/${encodeURIComponent(symbol)}`,
        {
          method: 'DELETE',
        }
      );
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '删除股票失败');
      }
  
      await fetchWatchlist();
      message.success('删除成功');
    } catch (error) {
      console.error('删除股票失败:', error);
      message.error(error instanceof Error ? error.message : '删除股票失败');
    }
  };

  // 修改 onDrop 处理函数
  const onDrop: TreeProps['onDrop'] = async (info) => {
    const dropKey = info.node.key as string;
    const dragKey = info.dragNode.key as string;
    const dropPos = info.node.pos.split('-');
    const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1]);
    
    // 处理文件夹的拖拽
    if (dragKey.startsWith('folder-')) {
        const sourceFolder = dragKey.replace('folder-', '');
        const targetFolder = dropKey.replace(/^(folder|stock)-/, '');
        
        // 如果是重新排序（放在另一个文件夹的前面或后面）
        if (dropPosition === -1 || dropPosition === 1) {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/api/groups/reorder`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        source_group: sourceFolder,
                        target_group: targetFolder,
                        position: dropPosition === -1 ? 'before' : 'after'
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || '重新排序失败');
                }

                const data = await response.json();
                setWatchlist({ groups: data.groups });
                message.success('重新排序成功');
            } catch (error) {
                console.error('重新排序失败:', error);
                message.error(error instanceof Error ? error.message : '重新排序失败');
            }
            return;
        }
        
        // 如果是移动到另一个文件夹内部
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/groups/move`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    source_group: sourceFolder,
                    target_group: dropPosition === 0 ? targetFolder : ''
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '移动文件夹失败');
            }

            const data = await response.json();
            setWatchlist({ groups: data.groups });
            message.success('移动成功');
        } catch (error) {
            console.error('移动文件夹失败:', error);
            message.error(error instanceof Error ? error.message : '移动文件夹失败');
        }
        return;
    }
    
    // 处理股票的拖拽
    if (dragKey.startsWith('stock-')) {
      const symbol = dragKey.replace('stock-', '');
      let fromGroup = '';
      let toGroup = '';

      // 确定源分组
      for (const [groupName, group] of Object.entries(watchlist.groups)) {
        if (group.stocks.includes(symbol)) {
          fromGroup = groupName;
          break;
        }
      }

      // 确定目标位置和分组
      if (dropKey.startsWith('folder-')) {
        // 如果拖到文件夹上，移动到该文件夹
        toGroup = dropKey.replace('folder-', '');
      } else if (dropKey.startsWith('stock-')) {
        // 如果拖到另一个股票上，可能是重新排序或移动到其他分组
        const targetSymbol = dropKey.replace('stock-', '');
        
        // 找到目标股票所在的分组
        for (const [groupName, group] of Object.entries(watchlist.groups)) {
          if (group.stocks.includes(targetSymbol)) {
            toGroup = groupName;
            break;
          }
        }

        // 如果在同一个分组内，执行重新排序
        if (fromGroup === toGroup) {
          try {
            // 构建完整的分组路径
            let fullGroupPath = '';
            for (const [groupName, group] of Object.entries(watchlist.groups)) {
              if (group.stocks.includes(targetSymbol)) {
                fullGroupPath = groupName;
                break;
              }
              if (group.subGroups) {
                for (const [subGroupName, subGroup] of Object.entries(group.subGroups)) {
                  if (subGroup.stocks.includes(targetSymbol)) {
                    fullGroupPath = `${groupName}/${subGroupName}`;
                    break;
                  }
                }
                if (fullGroupPath) break;
              }
            }

            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/watchlist/reorder`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                group: fullGroupPath,
                source_symbol: symbol,
                target_symbol: targetSymbol,
                position: dropPosition === -1 ? 'before' : 'after'
              }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || '重新排序失败');
            }

            const data = await response.json();
            setWatchlist({ groups: data.groups });
            message.success('重新排序成功');
            return;
          } catch (error) {
            console.error('重新排序失败:', error);
            message.error(error instanceof Error ? error.message : '重新排序失败');
            return;
          }
        }
      } else {
        // 如果拖到未分组区域
        toGroup = '默认分组';
      }

      // 如果源分组和目标分组相同，不执行移动
      if (fromGroup === toGroup) {
        return;
      }

      try {
        // 获取要移动的所有股票
        let stocksToMove: string[] = [];
        if (selectedKeys.length > 1 && selectedKeys.includes(dragKey)) {
          // 如果有多个选中项且包含被拖拽的项，移动所有选中的股票
          stocksToMove = selectedKeys
            .filter(key => typeof key === 'string' && key.startsWith('stock-'))
            .map(key => (key as string).replace('stock-', ''));
        } else {
          // 否则只移动被拖拽的股票
          stocksToMove = [symbol];
        }

        // 依次移动每个股票
        for (const stockSymbol of stocksToMove) {
          console.log(`Moving stock ${stockSymbol} from ${fromGroup} to ${toGroup}`);
          const response = await fetch(`${process.env.REACT_APP_API_URL}/api/watchlist/move`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              symbol: stockSymbol,
              from_group: fromGroup,
              to_group: toGroup,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '移动股票失败');
          }
        }

        // 移动成功后立即更新状态
        setWatchlist(prevState => {
          const newState = {
            groups: { ...prevState.groups }
          };

          // 从源分组中移除股票
          if (newState.groups[fromGroup]) {
            newState.groups[fromGroup] = {
              ...newState.groups[fromGroup],
              stocks: newState.groups[fromGroup].stocks.filter(s => !stocksToMove.includes(s))
            };
          }

          // 添加到目标分组
          if (newState.groups[toGroup]) {
            newState.groups[toGroup] = {
              ...newState.groups[toGroup],
              stocks: [...newState.groups[toGroup].stocks, ...stocksToMove]
            };
          }

          return newState;
        });

        message.success(`成功移动 ${stocksToMove.length} 个股票到 ${toGroup}`);
        setSelectedKeys([]); // 清除选中状态
      } catch (error) {
        console.error('移动股票失败:', error);
        message.error(error instanceof Error ? error.message : '移动股票失败');
      }
    }
  };

  // 新建文件夹
  const handleAddFolder = async (values: { name: string; description: string }) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: values.name,
          description: values.description,
        }),
      });

      if (!response.ok) throw new Error('创建分组失败');

      await fetchWatchlist();
      setIsModalVisible(false);
      form.resetFields();
      message.success('创建分组成功');
    } catch (error) {
      console.error('创建分组失败:', error);
      message.error('创建分组失败');
    }
  };

  // 修改 Tree 的 onSelect 处理函数
  const handleTreeSelect = (selectedKeys: Key[]) => {
    const key = selectedKeys[0] as string;
    if (key?.startsWith('stock-')) {
      const symbol = key.replace('stock-', '');
      setSelectedStock(symbol);
      scrollToStock(symbol);
    }
  };

  // 添加 handleExpand 函数
  const handleExpand = (
    expandedKeys: Key[],
    info: {
      node: EventDataNode<DataNode>;
      expanded: boolean;
      nativeEvent: MouseEvent;
    }
  ) => {
    setExpandedKeys(expandedKeys as string[]);
  };

  // 修改删除文件夹的处理函数
  const handleDeleteFolder = async (groupPath: string) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/groups/${encodeURIComponent(groupPath)}`, 
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '删除文件夹失败');
      }

      await fetchWatchlist();
      message.success('删除成功');
    } catch (error) {
      console.error('删除文件夹失败:', error);
      message.error(error instanceof Error ? error.message : '删除文件夹失败');
    }
  };

  // 修改 handleRenameFolder 函数
  const handleRenameFolder = async (groupPath: string, newName: string) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/groups/rename`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          old_path: encodeURIComponent(groupPath),  // 编码路径中的特殊字符
          new_name: newName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '重命名文件夹失败');
      }

      await fetchWatchlist();
      message.success('重命名成功');
    } catch (error) {
      console.error('重命名文件夹失败:', error);
      message.error(error instanceof Error ? error.message : '重命名文件夹失败');
    }
  };

  // Add click outside handler for rename and delete modals
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (renameModalRef.current && !renameModalRef.current.contains(event.target as Node)) {
        setIsRenameModalVisible(false);
      }
      if (deleteModalRef.current && !deleteModalRef.current.contains(event.target as Node)) {
        setIsDeleteModalVisible(false);
      }
    };

    if (isRenameModalVisible || isDeleteModalVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isRenameModalVisible, isDeleteModalVisible]);

  // Handle rename folder submit
  const handleRenameSubmit = () => {
    if (newFolderName.trim()) {
      handleRenameFolder(selectedFolder, newFolderName.trim());
      setIsRenameModalVisible(false);
    }
  };

  // Handle delete folder confirm
  const handleDeleteConfirm = () => {
    handleDeleteFolder(selectedFolder);
    setIsDeleteModalVisible(false);
  };

  // 修改 generateTreeData 函数
  const generateTreeData = (group: StockGroup, groupPath: string): DataNode => {
    // Stock nodes - simplified
    const stockNodes: DataNode[] = group.stocks.map((stock: string) => ({
      title: (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '2px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <StockOutlined style={{ fontSize: '14px', color: 'var(--primary-color)' }} />
            <span style={{ fontSize: '14px' }}>{stock}</span>
          </div>
          <DeleteOutlined 
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              handleDeleteStock(groupPath, stock);
            }}
            style={{ 
              fontSize: '14px', 
              color: 'var(--text-tertiary)', 
              cursor: 'pointer',
              opacity: 0.6
            }}
            className="tree-action-icon"
          />
        </div>
      ),
      key: `stock-${stock}`,
      isLeaf: true,
    }));

    // 创建子文件夹节点 - simplified
    const subGroupNodes: DataNode[] = group.subGroups ? 
      Object.entries(group.subGroups).map(([subName, subGroup]) =>
        generateTreeData(subGroup, `${groupPath}/${subName}`)
      ) : [];

    // 返回当前文件夹节点 - simplified
    return {
      title: (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '3px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FolderOutlined style={{ fontSize: '16px', color: 'var(--warning-color)' }} />
            <span style={{ fontWeight: 500, fontSize: '14px' }}>{groupPath.split('/').pop()}</span>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <EditOutlined
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                const currentName = groupPath.split('/').pop() || '';
                setSelectedFolder(groupPath);
                setNewFolderName(currentName);
                setIsRenameModalVisible(true);
              }}
              style={{ 
                fontSize: '14px', 
                color: 'var(--text-tertiary)', 
                cursor: 'pointer',
                opacity: 0.6
              }}
              className="tree-action-icon"
            />
            <DeleteOutlined 
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                setSelectedFolder(groupPath);
                setIsDeleteModalVisible(true);
              }}
              style={{ 
                fontSize: '14px', 
                color: 'var(--text-tertiary)', 
                cursor: 'pointer',
                opacity: 0.6
              }}
              className="tree-action-icon"
            />
          </div>
        </div>
      ),
      key: `folder-${groupPath}`,
      children: [...stockNodes, ...subGroupNodes],
      selectable: false,
    };
  };

  // 修改 treeData 的生成
  const treeData: DataNode[] = [
    // 未分组的股票
    ...getUngroupedStocks().map((stock: string): DataNode => ({
      title: (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <StockOutlined />
            <span>{stock}</span>
          </div>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'delete',
                  icon: <DeleteOutlined />,
                  label: 'Delete',
                  onClick: () => handleDeleteStock('默认分组', stock)
                }
              ]
            }}
            trigger={['click']}
          >
            <MoreOutlined
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              style={{ cursor: 'pointer' }}
            />
          </Dropdown>
        </div>
      ),
      key: `stock-${stock}`,
      isLeaf: true,
    })),
    // 分组的股票和子分组
    ...Object.entries(watchlist.groups)
      .filter(([groupName]) => groupName !== "默认分组")
      .map(([groupName, group]) => generateTreeData(group, groupName))
  ];

  // 添加获取所有文件夹 key 的函数
  const getAllFolderKeys = (groups: GroupData): string[] => {
    const keys: string[] = [];
    
    const addFolderKeys = (groupPath: string, group: StockGroup) => {
      keys.push(`folder-${groupPath}`);
      if (group.subGroups) {
        Object.entries(group.subGroups).forEach(([subName, subGroup]) => {
          addFolderKeys(`${groupPath}/${subName}`, subGroup);
        });
      }
    };

    Object.entries(groups)
      .filter(([groupName]) => groupName !== "默认分组")
      .forEach(([groupName, group]) => {
        addFolderKeys(groupName, group);
      });

    return keys;
  };

  // 添加展开/折叠所有文件夹的处理函数
  const handleExpandAll = (expand: boolean) => {
    if (expand) {
      // 展开所有文件夹
      const allKeys = getAllFolderKeys(watchlist.groups);
      setExpandedKeys(allKeys);
    } else {
      // 折叠所有文件夹
      setExpandedKeys([]);
    }
  };

  // 添加刷新目录的函数
  const handleRefreshDirectory = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/watchlist`);
      if (!response.ok) {
        throw new Error('获取观察列表失败');
      }
      const data = await response.json();
      setWatchlist({ groups: data.groups || {} });
    } catch (error) {
      console.error('刷新目录失败:', error);
      message.error('刷新目录失败');
    }
  };

  // Add useEffect to refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      handleRefreshDirectory();
    }, 5000);

    // Clear interval on component unmount
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <Layout>
        <Sider 
          width={280} 
          style={{ 
            background: 'var(--card-bg)',
            boxShadow: '-2px 0 8px var(--shadow-color)',
            position: 'fixed',
            right: 0,
            top: 64,
            height: 'calc(100vh - 64px)',
            transition: 'all 0.3s ease',
            zIndex: 5,
            overflow: 'auto',
            transform: `translateX(${siderVisible ? 0 : 280}px)`,
            borderLeft: '1px solid var(--border-color)'
          }}
          className="stock-sider"
          ref={siderRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div style={{ 
            position: 'absolute', 
            left: siderVisible ? -40 : -30, 
            top: '50%',
            padding: '12px 12px 12px 8px',
            background: 'var(--card-bg)',
            borderRadius: '50% 0 0 50%',
            boxShadow: '-2px 0 8px var(--shadow-color)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            zIndex: 4,
            border: '1px solid var(--border-color)',
            borderRight: 'none',
            color: 'var(--text-primary)',
            backgroundColor: siderPinned ? 'var(--highlight-bg)' : 'var(--card-bg)'
          }} 
          onClick={toggleSiderPin}
          >
            {siderVisible ? 
             (siderPinned ? <CompressOutlined /> : <ExpandOutlined rotate={90} />) 
             : <ExpandOutlined rotate={270} />}
          </div>
          
          <div style={{ padding: '16px 8px 8px' }}>
            <div style={{ 
              marginBottom: '16px',
              textAlign: 'center',
              color: 'var(--text-primary)',
              fontWeight: 'bold',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              Watchlist {siderPinned && <span style={{ fontSize: '12px', color: 'var(--primary-color)', background: 'var(--highlight-bg)', padding: '2px 6px', borderRadius: '4px' }}>Pinned</span>}
            </div>
            
            <div style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <Input.Search 
                placeholder="Search stocks" 
                style={{ flex: 1 }} 
                size="middle"
                onSearch={(value) => {
                  if (value) {
                    const stockFound = getAllStocks().find(stock => 
                      stock.toLowerCase().includes(value.toLowerCase())
                    );
                    if (stockFound) {
                      setSelectedStock(stockFound);
                      scrollToStock(stockFound);
                    }
                  }
                }}
              />
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={() => setIsModalVisible(true)}
                style={{ marginLeft: '8px', borderRadius: '6px' }}
              />
            </div>
            
            <div style={{ display: 'flex', marginBottom: '12px' }}>
              <Button 
                onClick={() => handleExpandAll(true)} 
                size="small" 
                style={{ flex: 1, margin: '0 4px', borderRadius: '6px' }}
              >
                Expand All
              </Button>
              <Button 
                onClick={() => handleExpandAll(false)} 
                size="small" 
                style={{ flex: 1, margin: '0 4px', borderRadius: '6px' }}
              >
                Collapse All
              </Button>
              <Button 
                onClick={handleRefreshDirectory} 
                icon={<ReloadOutlined />} 
                size="small" 
                style={{ margin: '0 4px', borderRadius: '6px' }}
              />
            </div>
            
            <div style={{ marginBottom: '12px' }}>
              <Button.Group style={{ width: '100%' }}>
                {['1', '5', '15', '30', '60', 'D', 'W'].map(t => (
                  <Button 
                    key={t} 
                    type={timeframe === t ? 'primary' : 'default'} 
                    onClick={() => setTimeframe(t as StockCardProps['timeframe'])}
                    style={{ 
                      flex: 1, 
                      fontWeight: timeframe === t ? 500 : 400,
                      borderRadius: 0
                    }}
                  >
                    {t}
                  </Button>
                ))}
              </Button.Group>
            </div>
            
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Spin />
                <div style={{ marginTop: 8 }}>Loading watchlist...</div>
              </div>
            ) : (
              <Tree
                className="draggable-tree"
                draggable
                blockNode
                showIcon={false}
                onDrop={onDrop}
                onSelect={selectedKeys => {
                  setSelectedKeys(selectedKeys);
                  handleTreeSelect(selectedKeys);
                }}
                onExpand={(expandedKeys, info) => {
                  setExpandedKeys(expandedKeys as string[]);
                  handleExpand(expandedKeys, info);
                }}
                expandedKeys={expandedKeys}
                selectedKeys={selectedKeys}
                treeData={Object.keys(watchlist.groups).map(groupName => 
                  generateTreeData(watchlist.groups[groupName], groupName)
                )}
                style={{ 
                  background: 'transparent', 
                  borderRadius: '4px'
                }}
              />
            )}
          </div>
        </Sider>
        
        <Content style={{ 
          marginRight: siderVisible ? 290 : 10, 
          marginLeft: 10,
          transition: 'margin-right 0.3s ease',
          paddingTop: 8
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin size="large" />
              <div style={{ marginTop: 16 }}>Loading stocks data...</div>
            </div>
          ) : (
            <>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                marginBottom: '12px',
                paddingRight: '8px'
              }}>
                <Button 
                  icon={siderPinned ? <CompressOutlined /> : <ExpandOutlined />}
                  onClick={toggleSiderPin}
                  type={siderPinned ? "primary" : "default"}
                  style={{ 
                    borderRadius: '50%', 
                    width: '36px', 
                    height: '36px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px var(--shadow-color)',
                    backgroundColor: siderPinned ? 'var(--primary-color)' : undefined,
                    color: siderPinned ? '#ffffff' : undefined
                  }}
                  title={siderPinned ? "Unpin Watchlist" : "Pin Watchlist"}
                />
              </div>
              
              {selectedStock ? (
                <div ref={el => {
                  if (el) stockRefs.current[selectedStock] = el;
                }}>
                  <StockCard symbol={selectedStock} timeframe={timeframe} />
                </div>
              ) : (
                <>
                  {getAllStocks().map(symbol => (
                    <div key={symbol} ref={el => {
                      if (el) stockRefs.current[symbol] = el;
                    }}>
                      <StockCard symbol={symbol} timeframe={timeframe} />
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </Content>
      </Layout>

      {/* Group Add Modal */}
      <Modal
        title="Add Folder"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={() => {
              form.validateFields().then(values => {
                handleAddFolder(values);
              });
            }}
          >
            Create
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Folder Name"
            rules={[{ required: true, message: 'Please enter folder name' }]}
          >
            <Input placeholder="E.g., Tech Stocks" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea placeholder="Optional description for this folder" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Rename Folder Modal */}
      {isRenameModalVisible && (
        <div
          ref={renameModalRef}
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
            background: 'var(--bg-elevated)',
            borderRadius: '12px',
            padding: '20px',
            width: '300px',
            boxShadow: '0 4px 12px var(--shadow-color)',
            border: '1px solid var(--border-color)'
          }}
        >
          <h3 style={{ marginTop: 0, color: 'var(--text-primary)' }}>Rename Folder</h3>
          <Input
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            placeholder="New folder name"
            style={{ marginBottom: '15px' }}
            autoFocus
          />
          <div style={{ textAlign: 'right' }}>
            <Button
              onClick={() => setIsRenameModalVisible(false)}
              style={{ marginRight: '8px' }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={handleRenameSubmit}
              disabled={!newFolderName.trim()}
            >
              Rename
            </Button>
          </div>
        </div>
      )}

      {/* Delete Folder Confirmation */}
      {isDeleteModalVisible && (
        <div
          ref={deleteModalRef}
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
            background: 'var(--bg-elevated)',
            borderRadius: '12px',
            padding: '20px',
            width: '300px',
            boxShadow: '0 4px 12px var(--shadow-color)',
            border: '1px solid var(--border-color)'
          }}
        >
          <h3 style={{ marginTop: 0, color: 'var(--text-primary)' }}>Delete Folder</h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            Are you sure you want to delete the folder <strong>{selectedFolder}</strong>?
            All stocks will be moved to the default group.
          </p>
          <div style={{ textAlign: 'right' }}>
            <Button
              onClick={() => setIsDeleteModalVisible(false)}
              style={{ marginRight: '8px' }}
            >
              Cancel
            </Button>
            <Button type="primary" danger onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockDashboard; 