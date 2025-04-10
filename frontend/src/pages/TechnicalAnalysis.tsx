import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Select, 
  Button, 
  Tabs, 
  Space, 
  Divider, 
  Input, 
  Tag, 
  Spin, 
  notification, 
  Row, 
  Col, 
  Switch,
  Tooltip,
  Form
} from 'antd';
import { 
  AreaChartOutlined, 
  StockOutlined, 
  RobotOutlined, 
  LineChartOutlined, 
  PlusOutlined, 
  SyncOutlined, 
  InfoCircleOutlined, 
  SettingOutlined,
  SaveOutlined
} from '@ant-design/icons';
import { AdvancedRealTimeChart, TechnicalAnalysis as TVTechnicalAnalysis } from 'react-ts-tradingview-widgets';
import axios from 'axios';
import { useTheme } from '../App';
import StockAnalysis from '../components/StockAnalysis';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;

// Interface for analysis agent
interface AnalysisAgent {
  id: string;
  name: string;
  description: string;
  indicators: string[];
  isRunning: boolean;
  results?: any;
}

// Interface for stock data
interface StockInfo {
  symbol: string;
  name: string;
  price: number;
  change: number;
}

// Main component
const TechnicalAnalysis: React.FC = () => {
  const { darkMode } = useTheme();
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [stockResults, setStockResults] = useState<StockInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [analysisAgents, setAnalysisAgents] = useState<AnalysisAgent[]>([]);
  const [activeTab, setActiveTab] = useState('chart');
  const [customIndicators, setCustomIndicators] = useState<string[]>([
    'RSI', 'MACD', 'Bollinger Bands', 'Moving Average', 'Volume'
  ]);
  
  // Load top stocks on initial render
  useEffect(() => {
    fetchTopStocks();
  }, []);

  // Fetch top stocks
  const fetchTopStocks = async () => {
    try {
      setIsSearching(true);
      // Use predefined popular stocks since there's no /api/stocks/top endpoint
      const popularStocks = [
        { symbol: 'AAPL', name: 'Apple Inc.', price: 188.31, change: 0.5 },
        { symbol: 'MSFT', name: 'Microsoft Corporation', price: 420.45, change: 1.2 },
        { symbol: 'GOOG', name: 'Alphabet Inc.', price: 175.89, change: -0.3 },
        { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 178.25, change: 0.8 },
        { symbol: 'TSLA', name: 'Tesla Inc.', price: 175.45, change: -1.5 },
        { symbol: 'NVDA', name: 'NVIDIA Corporation', price: 112.67, change: 2.1 },
        { symbol: 'META', name: 'Meta Platforms Inc.', price: 501.32, change: 0.7 },
        { symbol: 'BRK.B', name: 'Berkshire Hathaway Inc.', price: 418.96, change: 0.2 },
        { symbol: 'JPM', name: 'JPMorgan Chase & Co.', price: 186.49, change: -0.4 },
        { symbol: 'V', name: 'Visa Inc.', price: 274.58, change: 0.6 }
      ];
      setStockResults(popularStocks);
    } catch (error) {
      console.error('Error setting up popular stocks:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Search for stocks
  const searchStocks = async () => {
    if (!searchQuery.trim()) {
      return;
    }

    try {
      setIsSearching(true);
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/stock/search/${searchQuery}`);
      
      // Transform the response to match our StockInfo interface
      if (Array.isArray(response.data)) {
        const formattedResults = response.data.map((item: any) => ({
          symbol: item.symbol,
          name: item.name,
          price: item.price || 0,
          change: item.change || 0
        }));
        setStockResults(formattedResults);
      } else {
        setStockResults([]);
      }
    } catch (error) {
      console.error('Error searching stocks:', error);
      notification.error({
        message: 'Search failed',
        description: 'Failed to search for stocks. Please try again.',
      });
      setStockResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Add a new analysis agent
  const addAnalysisAgent = () => {
    if (!selectedStock) {
      notification.warning({
        message: 'No stock selected',
        description: 'Please select a stock before creating an analysis agent',
      });
      return;
    }

    const newAgent: AnalysisAgent = {
      id: `agent-${Date.now()}`,
      name: `Analysis Agent ${analysisAgents.length + 1}`,
      description: 'Technical analysis using selected indicators',
      indicators: customIndicators.slice(0, 3),
      isRunning: false
    };

    setAnalysisAgents([...analysisAgents, newAgent]);
    notification.success({
      message: 'Agent created',
      description: `New analysis agent for ${selectedStock} has been created`
    });
  };

  // Run an analysis agent
  const runAnalysisAgent = async (agentId: string) => {
    const agentIndex = analysisAgents.findIndex(agent => agent.id === agentId);
    if (agentIndex === -1 || !selectedStock) return;

    // Update agent status
    const updatedAgents = [...analysisAgents];
    updatedAgents[agentIndex].isRunning = true;
    setAnalysisAgents(updatedAgents);

    try {
      // Simulate API call for analysis
      // In a real implementation, this would call your backend
      setTimeout(() => {
        const mockResults = {
          summary: `${selectedStock} shows ${Math.random() > 0.5 ? 'bullish' : 'bearish'} patterns based on the selected indicators.`,
          signals: [
            { name: 'RSI', value: Math.floor(Math.random() * 100), interpretation: Math.random() > 0.5 ? 'Overbought' : 'Oversold' },
            { name: 'MACD', value: (Math.random() * 2 - 1).toFixed(2), interpretation: Math.random() > 0.5 ? 'Bullish' : 'Bearish' },
            { name: 'Bollinger Bands', value: 'Middle', interpretation: 'Neutral trend with moderate volatility' }
          ],
          recommendation: Math.random() > 0.3 ? 'Buy' : Math.random() > 0.5 ? 'Hold' : 'Sell',
          confidence: Math.floor(Math.random() * 40 + 60)
        };

        // Update agent with results
        const finalUpdatedAgents = [...analysisAgents];
        finalUpdatedAgents[agentIndex].isRunning = false;
        finalUpdatedAgents[agentIndex].results = mockResults;
        setAnalysisAgents(finalUpdatedAgents);

        notification.success({
          message: 'Analysis complete',
          description: `The analysis for ${selectedStock} has been completed successfully.`
        });
      }, 3000);
    } catch (error) {
      console.error('Error running analysis:', error);
      notification.error({
        message: 'Analysis failed',
        description: 'Failed to complete the analysis. Please try again.',
      });

      // Reset agent status
      const finalUpdatedAgents = [...analysisAgents];
      finalUpdatedAgents[agentIndex].isRunning = false;
      setAnalysisAgents(finalUpdatedAgents);
    }
  };

  return (
    <div>
      <Title level={2}>Technical Analysis & Trading Tools</Title>
      <Text type="secondary">Select a stock and create agents to perform quantitative analysis</Text>
      
      <Divider />
      
      {/* Stock selection section */}
      <Card
        title={
          <Space>
            <StockOutlined />
            <span>Stock Selection</span>
          </Space>
        }
        style={{ marginBottom: 20 }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space style={{ width: '100%' }}>
            <Input 
              placeholder="Search for a stock by symbol or name" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: 300 }}
              onPressEnter={searchStocks}
            />
            <Button 
              type="primary" 
              onClick={searchStocks} 
              loading={isSearching}
              icon={<StockOutlined />}
            >
              Search
            </Button>
          </Space>
          
          {isSearching ? (
            <div style={{ padding: '20px 0', textAlign: 'center' }}>
              <Spin size="small" />
              <div style={{ marginTop: 8 }}>Searching stocks...</div>
            </div>
          ) : (
            <div style={{ maxHeight: 200, overflowY: 'auto', marginTop: 10 }}>
              {stockResults.length > 0 ? (
                stockResults.map((stock) => (
                  <Tag
                    key={stock.symbol}
                    color={selectedStock === stock.symbol ? 'blue' : undefined}
                    style={{ 
                      margin: '5px',
                      padding: '5px 10px',
                      cursor: 'pointer',
                      borderRadius: '15px'
                    }}
                    onClick={() => setSelectedStock(stock.symbol)}
                  >
                    <Space>
                      <span style={{ fontWeight: 'bold' }}>{stock.symbol}</span>
                      <span>{stock.name}</span>
                      <span style={{ color: stock.change >= 0 ? 'green' : 'red' }}>
                        {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
                      </span>
                    </Space>
                  </Tag>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <Text type="secondary">No stocks found. Try searching for a company name or symbol.</Text>
                </div>
              )}
            </div>
          )}
        </Space>
      </Card>
      
      {/* Main content area */}
      {selectedStock ? (
        <React.Fragment>
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            type="card"
            style={{ marginBottom: 20 }}
          >
            <TabPane 
              tab={<span><AreaChartOutlined />Chart</span>}
              key="chart"
            >
              <Card style={{ height: 600 }}>
                <AdvancedRealTimeChart
                  symbol={selectedStock}
                  theme={darkMode ? "dark" : "light"}
                  width="100%"
                  height={600}
                  allow_symbol_change={true}
                  hide_side_toolbar={false}
                />
              </Card>
            </TabPane>
            
            <TabPane 
              tab={<span><LineChartOutlined />Technical Indicators</span>}
              key="indicators"
            >
              <Card style={{ height: 600 }}>
                <TVTechnicalAnalysis
                  symbol={selectedStock}
                  colorTheme={darkMode ? 'dark' : 'light'}
                  isTransparent={false}
                  showIntervalTabs={true}
                  width="100%"
                  height={600}
                />
              </Card>
            </TabPane>
            
            <TabPane 
              tab={<span><StockOutlined />Analysis</span>}
              key="analysis"
            >
              <Card style={{ minHeight: 600 }}>
                <StockAnalysis symbol={selectedStock} />
              </Card>
            </TabPane>
            
            <TabPane
              tab={<span><RobotOutlined />Quantitative Agents</span>}
              key="agents"
            >
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Card 
                    title="Available Indicators"
                    bordered
                    style={{ marginBottom: 16 }}
                    extra={
                      <Tooltip title="Add custom indicators">
                        <Button type="link" icon={<PlusOutlined />} />
                      </Tooltip>
                    }
                  >
                    <Form layout="vertical">
                      <Form.Item label="Select indicators for your agent:">
                        <Select
                          mode="multiple"
                          style={{ width: '100%' }}
                          placeholder="Select indicators"
                          value={customIndicators}
                          onChange={setCustomIndicators}
                          maxTagCount={5}
                        >
                          <Option value="RSI">RSI (Relative Strength Index)</Option>
                          <Option value="MACD">MACD (Moving Average Convergence Divergence)</Option>
                          <Option value="Bollinger Bands">Bollinger Bands</Option>
                          <Option value="Moving Average">Moving Average</Option>
                          <Option value="Volume">Volume Analysis</Option>
                          <Option value="Fibonacci">Fibonacci Retracement</Option>
                          <Option value="Stochastic">Stochastic Oscillator</Option>
                          <Option value="ATR">ATR (Average True Range)</Option>
                          <Option value="OBV">OBV (On-Balance Volume)</Option>
                          <Option value="ADX">ADX (Average Directional Index)</Option>
                        </Select>
                      </Form.Item>
                      
                      <Form.Item label="Analysis Period:">
                        <Select defaultValue="medium" style={{ width: '100%' }}>
                          <Option value="short">Short-term (Days)</Option>
                          <Option value="medium">Medium-term (Weeks)</Option>
                          <Option value="long">Long-term (Months)</Option>
                        </Select>
                      </Form.Item>
                      
                      <Form.Item label="Analysis Depth:">
                        <Select defaultValue="standard" style={{ width: '100%' }}>
                          <Option value="basic">Basic</Option>
                          <Option value="standard">Standard</Option>
                          <Option value="advanced">Advanced</Option>
                        </Select>
                      </Form.Item>
                      
                      <Form.Item>
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={addAnalysisAgent}
                          style={{ width: '100%' }}
                          disabled={!selectedStock}
                        >
                          Create Analysis Agent
                        </Button>
                      </Form.Item>
                    </Form>
                  </Card>
                </Col>
                
                <Col span={16}>
                  <Card 
                    title="Analysis Agents"
                    bordered
                    style={{ minHeight: 460 }}
                  >
                    {analysisAgents.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: 40 }}>
                        <RobotOutlined style={{ fontSize: 48, color: '#ccc', marginBottom: 16 }} />
                        <Paragraph>
                          No analysis agents created yet. Select a stock and create an agent to perform quantitative analysis.
                        </Paragraph>
                      </div>
                    ) : (
                      <Space direction="vertical" style={{ width: '100%' }}>
                        {analysisAgents.map((agent) => (
                          <Card 
                            key={agent.id}
                            size="small"
                            title={
                              <Space>
                                <RobotOutlined />
                                <span>{agent.name}</span>
                                <Tag color="blue">{selectedStock}</Tag>
                              </Space>
                            }
                            extra={
                              <Space>
                                <Tooltip title="Configure agent">
                                  <Button type="text" icon={<SettingOutlined />} size="small" />
                                </Tooltip>
                                <Tooltip title="Run analysis">
                                  <Button 
                                    type="primary"
                                    icon={agent.isRunning ? <SyncOutlined spin /> : <SyncOutlined />}
                                    size="small"
                                    onClick={() => runAnalysisAgent(agent.id)}
                                    loading={agent.isRunning}
                                    disabled={agent.isRunning}
                                  >
                                    {agent.isRunning ? 'Running...' : 'Run Analysis'}
                                  </Button>
                                </Tooltip>
                              </Space>
                            }
                            style={{ marginBottom: 12 }}
                          >
                            <Space direction="vertical" style={{ width: '100%' }}>
                              <div>
                                <Text type="secondary">Indicators: </Text>
                                {agent.indicators.map((indicator, idx) => (
                                  <Tag key={idx} color="blue" style={{ margin: '0 4px' }}>{indicator}</Tag>
                                ))}
                              </div>
                              
                              {agent.results ? (
                                <div style={{ marginTop: 12, padding: 12, background: darkMode ? '#1a1a1a' : '#f5f5f5', borderRadius: 8 }}>
                                  <Paragraph>
                                    <Text strong>Summary: </Text>
                                    <Text>{agent.results.summary}</Text>
                                  </Paragraph>
                                  
                                  <Divider style={{ margin: '12px 0' }} />
                                  
                                  <Space direction="vertical" style={{ width: '100%' }}>
                                    {agent.results.signals.map((signal: any, idx: number) => (
                                      <div key={idx}>
                                        <Text strong>{signal.name}: </Text>
                                        <Text>{signal.value} - {signal.interpretation}</Text>
                                      </div>
                                    ))}
                                  </Space>
                                  
                                  <Divider style={{ margin: '12px 0' }} />
                                  
                                  <Space align="center">
                                    <Text strong>Recommendation: </Text>
                                    <Tag color={
                                      agent.results.recommendation === 'Buy' ? 'success' :
                                      agent.results.recommendation === 'Sell' ? 'error' : 'warning'
                                    }>
                                      {agent.results.recommendation}
                                    </Tag>
                                    <Text type="secondary">(Confidence: {agent.results.confidence}%)</Text>
                                    
                                    <Tooltip title="Save analysis to your reports">
                                      <Button type="text" icon={<SaveOutlined />} size="small" />
                                    </Tooltip>
                                  </Space>
                                </div>
                              ) : (
                                agent.isRunning ? (
                                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                    <Spin />
                                    <div style={{ marginTop: 8 }}>Running analysis...</div>
                                  </div>
                                ) : (
                                  <div style={{ padding: '10px 0' }}>
                                    <Text type="secondary">
                                      <InfoCircleOutlined style={{ marginRight: 8 }} />
                                      Run analysis to see results
                                    </Text>
                                  </div>
                                )
                              )}
                            </Space>
                          </Card>
                        ))}
                      </Space>
                    )}
                  </Card>
                </Col>
              </Row>
            </TabPane>
          </Tabs>
        </React.Fragment>
      ) : (
        <Card style={{ textAlign: 'center', padding: 40 }}>
          <StockOutlined style={{ fontSize: 48, color: '#ccc', marginBottom: 16 }} />
          <Title level={4}>Select a Stock to Begin Analysis</Title>
          <Paragraph type="secondary">
            Use the search box above to find a stock for detailed technical analysis and trading tools.
          </Paragraph>
        </Card>
      )}
    </div>
  );
};

export default TechnicalAnalysis; 