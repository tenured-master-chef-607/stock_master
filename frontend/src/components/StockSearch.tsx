import React, { useState, useCallback } from 'react';
import { AutoComplete, Input, Spin, message } from 'antd';
import { PlusCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { debounce } from 'lodash';
import type { SelectProps } from 'antd/es/select';

interface StockSearchProps {
  onSelect: (symbol: string) => void;
  style?: React.CSSProperties;
}

interface StockSuggestion {
  symbol: string;
  name: string;
  exchange: string;
  logo?: string;
}

// 使用普通的 CSS 类和内联样式替代 styled-components
const styles = {
  suggestionItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
  },
  stockInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  ticker: {
    fontWeight: 600,
    color: '#1a1a1a',
  },
  companyName: {
    color: '#666',
    fontSize: '12px',
  },
  exchangeTag: {
    fontSize: '11px',
    padding: '2px 6px',
    borderRadius: '4px',
    backgroundColor: '#f0f0f0',
    color: '#666',
  },
  addButton: {
    cursor: 'pointer',
    transition: 'opacity 0.2s',
    opacity: 0.6,
    ':hover': {
      opacity: 1,
    },
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
};

const formatCompanyName = (name: string, isMobile: boolean): string => {
  const maxLength = isMobile ? 20 : 35;
  return name.length > maxLength ? `${name.slice(0, maxLength-3)}...` : name;
};

export const StockSearch: React.FC<StockSearchProps> = ({ onSelect, style }) => {
  const [options, setOptions] = useState<SelectProps['options']>([]);
  const [loading, setLoading] = useState(false);
  const [searchCache] = useState<Map<string, StockSuggestion[]>>(new Map());

  const searchStocks = useCallback(
    debounce(async (query: string) => {
      if (!query) {
        setOptions([]);
        return;
      }

      try {
        setLoading(true);
        const url = `${process.env.REACT_APP_API_URL}/api/stock/search/${query}`;
        console.log('Searching at URL:', url);

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response:', errorText);
          throw new Error(`搜索请求失败: ${response.status} ${errorText}`);
        }

        const suggestions: StockSuggestion[] = await response.json();
        console.log('Search results:', suggestions);
        formatAndSetOptions(suggestions);
      } catch (error) {
        console.error('搜索股票失败:', error);
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
          message.error('无法连接到服务器，请确保后端服务正在运行');
        } else {
          message.error('搜索失败: ' + (error instanceof Error ? error.message : String(error)));
        }
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  const formatAndSetOptions = (suggestions: StockSuggestion[]) => {
    const isMobile = window.innerWidth < 768;
    const formattedOptions = suggestions.map(item => ({
      value: item.symbol,
      label: (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '8px 12px', 
          width: '100%' 
        }}>
          {/* 左侧内容：股票代码和公司名称（垂直布局） */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '4px', 
            flex: 1, // 关键：占据剩余空间
            overflow: 'hidden' // 防止内容溢出
          }}>
            <span style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            minWidth: '120px', // 关键：固定最小宽度
            marginLeft: '12px', // 与左侧内容保持间距
            flexShrink: 0 // 禁止挤压
          }}>{item.symbol}</span>
            <span style={{ 
              color: '#666', 
              wordBreak: 'break-word' // 允许长名称换行
            }}>
              {item.name}
            </span>
          </div>
  
          {/* 右侧内容：交易所代码和加号图标 */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            minWidth: '120px', // 关键：固定最小宽度
            marginLeft: '12px', // 与左侧内容保持间距
            flexShrink: 0 // 禁止挤压
          }}>
            <span style={{ fontSize: '10px', color: '#888' }}>
              {item.exchange}
            </span>
            <PlusCircleOutlined
              style={{ 
                cursor: 'pointer', 
                opacity: 0.6, 
                fontSize: '10px',
                flexShrink: 0 // 图标禁止挤压
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
              onClick={(e) => {
                e.stopPropagation();
                handleAddStock(item.symbol);
              }}
            />
          </div>
        </div>
      ),
    }));
    setOptions(formattedOptions);
  };

  const handleAddStock = async (symbol: string) => {
    try {
      console.log('开始添加股票:', symbol);
      
      // 首先检查股票是否已经存在于任何分组中
      const watchlistResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/watchlist`);
      if (!watchlistResponse.ok) {
        throw new Error('获取观察列表失败');
      }
      const watchlistData = await watchlistResponse.json();
      
      // 检查股票是否已存在于任何分组
      let existingGroup = null;
      Object.entries(watchlistData.groups).forEach(([groupName, group]: [string, any]) => {
        if (group.stocks.includes(symbol)) {
          existingGroup = groupName;
        }
      });
      
      if (existingGroup) {
        message.warning(`股票 ${symbol} 已存在于分组 "${existingGroup}" 中`);
        return;
      }
      
      const requestBody = {
        symbol: symbol,
        group: '默认分组'
      };
      
      console.log('发送请求体:', requestBody);
      
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/watchlist/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody),
      });

      console.log('添加股票响应状态:', response.status);
      const data = await response.json();
      console.log('添加股票响应数据:', data);

      if (!response.ok) {
        if (data.detail) {
          throw new Error(Array.isArray(data.detail) ? data.detail[0].msg : data.detail);
        }
        throw new Error(data.error || '添加股票失败');
      }

      message.success(data.message || `成功添加 ${symbol} 到观察列表`);
      onSelect(symbol);  // 通知父组件更新
    } catch (error) {
      console.error('添加股票失败:', error);
      message.error(error instanceof Error ? error.message : '添加股票失败');
    }
  };

  return (
    <AutoComplete
      options={options}
      onSelect={onSelect}
      onSearch={searchStocks}
      notFoundContent={loading ? <Spin size="small" /> : "未找到匹配项，尝试输入完整代码或公司名称"}
      style={style}
      dropdownMatchSelectWidth={false}
    >
      <Input
        placeholder="搜索股票代码或公司名称"
        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
        allowClear
      />
    </AutoComplete>
  );
}; 