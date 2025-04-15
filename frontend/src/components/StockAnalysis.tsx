import React, { useState } from 'react';
import { Descriptions, Tag, Space, Spin, Button, DatePicker, Modal, message, Tooltip, Divider, Typography, Card } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, HistoryOutlined, StockOutlined, InfoCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { ThemeContext } from '../App';

// 添加 dayjs 插件
dayjs.extend(utc);
dayjs.extend(timezone);

const { Text, Title } = Typography;

interface AnalysisProps {
  symbol: string;
}

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8002/api/v1';

// Prediction verification card component with theme support
const PredictionCard = ({ prediction, index }: { prediction: any, index: number }) => {
  const { darkMode } = React.useContext(ThemeContext);
  
  return (
    <div key={index} style={{ 
      padding: '10px', 
      backgroundColor: darkMode ? 'var(--bg-elevated)' : 'white', 
      borderRadius: '8px',
      marginBottom: '8px',
      border: `1px solid var(--border-color)`,
      transition: 'all 0.3s ease',
      boxShadow: '0 2px 6px var(--shadow-color)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <Space style={{ display: 'flex', alignItems: 'center' }}>
        {prediction.correct ? 
          <CheckCircleOutlined style={{ color: 'var(--success-color)', fontSize: '16px', marginRight: '8px' }} /> :
          <CloseCircleOutlined style={{ color: 'var(--error-color)', fontSize: '16px', marginRight: '8px' }} />
        }
        <Text strong>{prediction.signal}</Text>
      </Space>
      <Space>
        <Tag color="blue">Prediction: {prediction.prediction}</Tag>
        <Tag color={prediction.correct ? 'success' : 'error'}>
          {prediction.correct ? 'Correct' : 'Incorrect'}
        </Tag>
      </Space>
    </div>
  );
};

// 首先定义信号解释的映射
const SIGNAL_EXPLANATIONS: { [key: string]: string } = {
  "MACD金叉": "MACD线从下向上穿越信号线，表示可能出现上涨趋势，是买入信号。",
  "MACD死叉": "MACD线从上向下穿越信号线，表示可能出现下跌趋势，是卖出信号。",
  "RSI超买": "相对强弱指标(RSI)高于70，表示市场可能过热，股价可能回落。",
  "RSI超卖": "相对强弱指标(RSI)低于30，表示市场可能见底，股价可能反弹。",
  "KDJ金叉": "KDJ指标中，K线从下向上穿越D线，表示可能开始上涨，是买入信号。",
  "KDJ死叉": "KDJ指标中，K线从上向下穿越D线，表示可能开始下跌，是卖出信号。",
  "突破上轨": "股价突破布林带上轨，表示上涨趋势强劲，但也可能出现回调。",
  "突破下轨": "股价突破布林带下轨，表示下跌趋势明显，但也可能出现反弹。",
  "成交量突破": "当前成交量显著高于平均水平，表示市场活跃度增加。",
  "量能减弱": "成交量低于平均水平，表示市场参与度下降。"
};

// 修改 Analysis 接口定义
interface Analysis {
  price: number;
  change: number;
  volume: number;
  volatility_alert: string;
  money_flow: string;
  technical_signals: string[];
  volume_alert: string;
  date: string;
  error?: string;  // 添加可选的 error 属性
}

// 或者创建一个 AnalysisResponse 类型
type AnalysisResponse = Analysis | { error: string };

interface BackTestPrediction {
  signal: string;
  prediction: string;
  correct: boolean;
}

interface BackTestResults {
  date: string;
  price: number;
  change: number;
  volume: number;
  volatility_alert?: string;
  money_flow?: string;
  technical_signals?: string[];
  volume_alert?: string;
  next_day?: {
    date: string;
    price: number;
    change: number;
  };
  predictions_verified?: BackTestPrediction[];
  accuracy?: number;
  open?: number;
  close?: number;
  high?: number;
  low?: number;
}

const StockAnalysis: React.FC<AnalysisProps> = ({ symbol }) => {
  const [analysis, setAnalysis] = React.useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [backTestResults, setBackTestResults] = useState<BackTestResults | null>(null);
  const [isBackTesting, setIsBackTesting] = useState(false);
  const [isBackTestModalVisible, setIsBackTestModalVisible] = useState(false);
  const [backTestDate, setBackTestDate] = useState<dayjs.Dayjs | null>(null);
  const [selectedSignal, setSelectedSignal] = useState<string | null>(null);
  const { darkMode } = React.useContext(ThemeContext);

  React.useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/stock/analysis/${symbol}`);
        
        if (!response.ok) {
          console.warn(`No analysis data found for ${symbol}, using mock data`);
          // Create mock analysis data for demonstration
          const mockAnalysis: Analysis = {
            price: Math.random() * 500 + 50,
            change: (Math.random() * 5) * (Math.random() > 0.5 ? 1 : -1),
            volume: Math.random() * 10,
            volatility_alert: Math.random() > 0.5 ? "波动性正常" : "波动性预警",
            money_flow: Math.random() > 0.5 ? "资金流入" : "资金外流",
            technical_signals: [
              "MACD金叉",
              "RSI超买 (72.3)",
              "K线突破上轨"
            ],
            volume_alert: Math.random() > 0.5 ? "成交量正常" : "成交量异常",
            date: new Date().toISOString().split('T')[0]
          };
          setAnalysis(mockAnalysis);
          return;
        }
        
        const data = await response.json();
        setAnalysis(data);
      } catch (error) {
        console.error('获取分析数据失败:', error);
        // Create mock analysis on error
        const mockAnalysis: Analysis = {
          price: Math.random() * 500 + 50,
          change: (Math.random() * 5) * (Math.random() > 0.5 ? 1 : -1),
          volume: Math.random() * 10,
          volatility_alert: Math.random() > 0.5 ? "波动性正常" : "波动性预警",
          money_flow: Math.random() > 0.5 ? "资金流入" : "资金外流",
          technical_signals: [
            "MACD金叉",
            "RSI超买 (72.3)",
            "K线突破上轨"
          ],
          volume_alert: Math.random() > 0.5 ? "成交量正常" : "成交量异常",
          date: new Date().toISOString().split('T')[0]
        };
        setAnalysis(mockAnalysis);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [symbol]);

  const runBackTest = async () => {
    if (!backTestDate) {
      return;
    }
    
    // 确保选择的是过去的日期
    if (backTestDate.isAfter(dayjs())) {
      message.error('Cannot select future dates');
      return;
    }
    
    // 获取选择日期的数据
    const endDate = backTestDate.format('YYYY-MM-DD');
    const startDate = backTestDate.clone().subtract(60, 'day').format('YYYY-MM-DD');
    
    try {
      setIsBackTesting(true);
      const url = `${API_URL}/stock/backtest/${symbol}?start_date=${startDate}&end_date=${endDate}`;
      console.log('Requesting backtest:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': window.location.origin
        },
        credentials: 'omit'  // 不发送 cookies
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', response.status, errorText);
        throw new Error(`Request failed: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Backtest results:', data);
      
      if (data.error) {
        message.error(data.error);
        return;
      }
      
      setBackTestResults(data);
      message.success('Backtest analysis completed');
    } catch (error) {
      console.error('Backtest analysis failed:', error);
      message.error(error instanceof Error ? error.message : 'Backtest analysis failed, please try again later');
    } finally {
      setIsBackTesting(false);
      setIsBackTestModalVisible(false);
    }
  };

  const handleBackTest = async () => {
    await runBackTest();
  };

  const handleDateChange = (date: dayjs.Dayjs | null) => {
    setBackTestDate(date);
  };

  const handleSignalClick = (signal: string) => {
    // 修改处理函数来匹配部分信号文本
    let matchedSignal = signal;
    if (signal.startsWith('RSI超买') || signal.startsWith('RSI超卖')) {
      matchedSignal = signal.split(' (')[0];
    }
    
    const explanation = SIGNAL_EXPLANATIONS[matchedSignal] || "No detailed explanation available for this signal.";
    message.info({
      content: (
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{signal}</div>
          <div>{explanation}</div>
        </div>
      ),
      icon: <InfoCircleOutlined style={{ color: 'var(--primary-color)' }} />,
      duration: 6
    });
    
    setSelectedSignal(matchedSignal);
  };

  // 添加获取美国东部时间的函数
  const getUsEasternTime = () => {
    return dayjs().tz('America/New_York').format('YYYY-MM-DD HH:mm:ss');
  };

  if (loading) {
    return (
      <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', padding: '20px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Loading stock analysis...</div>
      </div>
    );
  }

  // 使用类型守卫来检查是否有错误
  if (!analysis || 'error' in analysis) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        backgroundColor: darkMode ? 'rgba(255, 77, 79, 0.1)' : 'rgba(255, 77, 79, 0.05)',
        borderRadius: '8px',
        border: '1px solid var(--error-color)'
      }}>
        <Text type="danger" strong>Unable to retrieve analysis data</Text>
        <Divider style={{ margin: '12px 0' }} />
        <Button 
          type="primary" 
          danger 
          onClick={() => window.location.reload()}
          style={{ marginTop: '8px' }}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', width: '100%'}}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <Space>
          <Button 
            type="link" 
            icon={<StockOutlined />}
            href={`https://www.bing.com/search?q=${symbol}+stock+site:msn.com/en-us/money/stockdetails`}
            target="_blank"
            className="analysis-link-button"
            style={{ 
              padding: '4px 8px', 
              borderRadius: '6px',
              background: darkMode ? 'rgba(24, 144, 255, 0.1)' : 'rgba(24, 144, 255, 0.05)', 
              color: 'var(--primary-color)'
            }}
          >
            MSN
          </Button>
          <Button 
            type="link" 
            icon={<StockOutlined />}
            href={`https://finance.yahoo.com/quote/${symbol}`}
            target="_blank"
            className="analysis-link-button"
            style={{ 
              padding: '4px 8px', 
              borderRadius: '6px',
              background: darkMode ? 'rgba(24, 144, 255, 0.1)' : 'rgba(24, 144, 255, 0.05)', 
              color: 'var(--primary-color)'
            }}
          >
            Yahoo
          </Button>
        </Space>
        <Button 
          type="primary" 
          icon={<HistoryOutlined />} 
          onClick={() => setIsBackTestModalVisible(true)}
          style={{ borderRadius: '6px' }}
        >
          Back Test
        </Button>
      </div>

      <div style={{ 
        display: 'flex', 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        width: '100%',
        flexWrap: 'wrap'
      }}>
        <Card 
          style={{ 
            marginBottom: '16px', 
            width: backTestResults ? 'calc(50% - 8px)' : '100%',
            borderRadius: '8px',
            boxShadow: '0 2px 8px var(--shadow-color)'
          }}
          bodyStyle={{ padding: '12px' }}
          bordered={false}
        >
          <div style={{ textAlign: 'left' }} >
            <Title level={5} style={{ margin: 0, marginBottom: '4px', color: 'var(--text-primary)' }}>{symbol} Summary</Title>
            <div style={{ color: 'var(--text-secondary)', fontSize: '12px', textAlign: 'left' }}>
              As of {getUsEasternTime()} EST
            </div>
          </div>
          <Descriptions column={1} size="small" style={{ marginTop: 16 }}>
            <Descriptions.Item 
              label={<Text strong style={{ color: 'var(--text-secondary)' }}>Current</Text>}
              contentStyle={{ fontWeight: 'bold' }}
            >
              ${analysis.price.toFixed(2)}
              <Tag className={analysis.change >= 0 ? 'price-up' : 'price-down'} style={{ marginLeft: 8 }}>
                {analysis.change >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                {Math.abs(analysis.change).toFixed(2)}%
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item 
              label={<Text strong style={{ color: 'var(--text-secondary)' }}>Volume</Text>}
            >
              {analysis.volume.toFixed(1)}M
            </Descriptions.Item>
            <Descriptions.Item 
              label={
                <Tooltip title="Market volatility indicator">
                  <Text strong style={{ color: 'var(--text-secondary)' }}>Volatility Alert <InfoCircleOutlined style={{ fontSize: '12px' }} /></Text>
                </Tooltip>
              }
            >
              <Tag color={analysis.volatility_alert.includes('预警') ? 'error' : 'success'}>
                {analysis.volatility_alert}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item 
              label={
                <Tooltip title="Direction of capital flow in the stock">
                  <Text strong style={{ color: 'var(--text-secondary)' }}>Money Flow <InfoCircleOutlined style={{ fontSize: '12px' }} /></Text>
                </Tooltip>
              }
            >
              <Tag color={
                analysis.money_flow.includes('流入') ? 'success' : 
                analysis.money_flow.includes('外流') ? 'error' : 'processing'
              }>
                {analysis.money_flow}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item 
              label={
                <Tooltip title="Technical indicators based on price patterns">
                  <Text strong style={{ color: 'var(--text-secondary)' }}>Technical Signals <InfoCircleOutlined style={{ fontSize: '12px' }} /></Text>
                </Tooltip>
              }
            >
              <Space wrap>
                {analysis.technical_signals.map((signal: string, index: number) => (
                  <Tooltip 
                    key={index} 
                    title="Click for explanation"
                    placement="top"
                  >
                    <Tag
                      color={signal.includes('金叉') || signal.includes('超卖') ? 'success' : 
                             signal.includes('死叉') || signal.includes('超买') ? 'error' : 'processing'}
                      style={{ 
                        cursor: 'pointer', 
                        margin: '4px',
                        transition: 'all 0.3s ease',
                        transform: 'scale(1)',
                        padding: '4px 8px',
                      }}
                      onClick={() => handleSignalClick(signal)}
                      className="signal-tag"
                    >
                      {signal}
                    </Tag>
                  </Tooltip>
                ))}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item 
              label={
                <Tooltip title="Analysis based on trading volume">
                  <Text strong style={{ color: 'var(--text-secondary)' }}>Volume Analysis <InfoCircleOutlined style={{ fontSize: '12px' }} /></Text>
                </Tooltip>
              }
            >
              <Tag color={
                analysis.volume_alert.includes('突破') ? 'error' :
                analysis.volume_alert.includes('清淡') ? 'warning' : 'success'
              }>  
                {analysis.volume_alert}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {backTestResults && !isBackTesting && (
          <Card 
            style={{ 
              marginBottom: '16px', 
              width: 'calc(50% - 8px)',
              borderRadius: '8px',
              boxShadow: '0 2px 8px var(--shadow-color)'
            }}
            bodyStyle={{ padding: '12px' }}
            bordered={false}
          >
            <div style={{ textAlign: 'left' }} >
              <Title level={5} style={{ margin: 0, marginBottom: '4px', color: 'var(--text-primary)' }}>{backTestResults.date} Backtest</Title>
              <div style={{ color: 'var(--text-secondary)', fontSize: '12px', textAlign: 'left' }}>
                Historical data analysis
              </div>
            </div>
            <Descriptions column={1} size="small" style={{ marginTop: 16 }}>
              <Descriptions.Item 
                label={<Text strong style={{ color: 'var(--text-secondary)' }}>O - C</Text>}
                contentStyle={{ fontWeight: 'bold' }}
              >
                ${backTestResults.open?.toFixed(2)} - ${backTestResults.price?.toFixed(2)}
                <Tag className={backTestResults.change >= 0 ? 'price-up' : 'price-down'} style={{ marginLeft: 8 }}>
                  {backTestResults.change >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                  {Math.abs(backTestResults.change || 0).toFixed(2)}%
                </Tag>
              </Descriptions.Item>

              <Descriptions.Item 
                label={<Text strong style={{ color: 'var(--text-secondary)' }}>Range</Text>}
              >
                ${backTestResults.low?.toFixed(2)} - ${backTestResults.high?.toFixed(2)}
              </Descriptions.Item>
              
              <Descriptions.Item 
                label={<Text strong style={{ color: 'var(--text-secondary)' }}>Volume</Text>}
              >
                {backTestResults.volume?.toFixed(1)}M
              </Descriptions.Item>
              {backTestResults.volatility_alert && (
                <Descriptions.Item 
                  label={<Text strong style={{ color: 'var(--text-secondary)' }}>Volatility Alert</Text>}
                >
                  <Tag color={backTestResults.volatility_alert?.includes('预警') ? 'error' : 'success'}>
                    {backTestResults.volatility_alert}
                  </Tag>
                </Descriptions.Item>
              )}
              {backTestResults.money_flow && (
                <Descriptions.Item 
                  label={<Text strong style={{ color: 'var(--text-secondary)' }}>Money Flow</Text>}
                >
                  <Tag color={
                    backTestResults.money_flow?.includes('流入') ? 'success' : 
                    backTestResults.money_flow?.includes('外流') ? 'error' : 'processing'
                  }>
                    {backTestResults.money_flow}
                  </Tag>
                </Descriptions.Item>
              )}
              {backTestResults.technical_signals && (
                <Descriptions.Item 
                  label={<Text strong style={{ color: 'var(--text-secondary)' }}>Technical Signals</Text>}
                >
                  <Space wrap>
                    {backTestResults.technical_signals.map((signal: string, index: number) => (
                      <Tooltip 
                        key={index} 
                        title="Click for explanation"
                        placement="top"
                      >
                        <Tag
                          color={signal.includes('金叉') || signal.includes('超卖') ? 'success' : 
                                 signal.includes('死叉') || signal.includes('超买') ? 'error' : 'processing'}
                          style={{ cursor: 'pointer', margin: '4px', padding: '4px 8px' }}
                          onClick={() => handleSignalClick(signal)}
                          className="signal-tag"
                        >
                          {signal}
                        </Tag>
                      </Tooltip>
                    ))}
                  </Space>
                </Descriptions.Item>
              )}
              {backTestResults.volume_alert && (
                <Descriptions.Item 
                  label={<Text strong style={{ color: 'var(--text-secondary)' }}>Volume Analysis</Text>}
                >
                  <Tag color={
                    backTestResults.volume_alert?.includes('突破') ? 'error' :
                    backTestResults.volume_alert?.includes('清淡') ? 'warning' : 'success'
                  }>
                    {backTestResults.volume_alert}
                  </Tag>
                </Descriptions.Item>
              )}
              {backTestResults.next_day && (
                <Descriptions.Item 
                  label={<Text strong style={{ color: 'var(--text-secondary)' }}>Next Day</Text>}
                  contentStyle={{ fontWeight: 'bold' }}
                >
                  ${backTestResults.next_day.price?.toFixed(2)}
                  <Tag className={backTestResults.next_day.change >= 0 ? 'price-up' : 'price-down'} style={{ marginLeft: 8 }}>
                    {backTestResults.next_day.change >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                    {Math.abs(backTestResults.next_day.change || 0).toFixed(2)}%
                  </Tag>
                </Descriptions.Item>
              )}
            </Descriptions>

            {backTestResults.predictions_verified && (
              <div style={{ marginTop: 12 }}>
                <Title level={5} style={{ marginBottom: 12, marginTop: 0, color: 'var(--text-primary)' }}>
                  Prediction Verification
                </Title>
                <Space direction="vertical" style={{ width: '100%' }}>
                  {backTestResults.predictions_verified.map((prediction: any, index: number) => (
                    <PredictionCard prediction={prediction} index={index} key={index} />
                  ))}
                </Space>
                
                {backTestResults.accuracy !== null && backTestResults.accuracy !== undefined && (
                  <div style={{ 
                    marginTop: 12,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: backTestResults.accuracy >= 60 ? 
                      (darkMode ? 'rgba(82, 196, 26, 0.1)' : 'rgba(82, 196, 26, 0.05)') : 
                      (darkMode ? 'rgba(255, 77, 79, 0.1)' : 'rgba(255, 77, 79, 0.05)'),
                    border: `1px solid ${backTestResults.accuracy >= 60 ? 'var(--success-color)' : 'var(--error-color)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <Text strong>Prediction Accuracy:</Text>
                    <Text strong style={{ 
                      color: backTestResults.accuracy >= 60 ? 'var(--success-color)' : 'var(--error-color)'
                    }}>
                      {backTestResults.accuracy.toFixed(1)}%
                    </Text>
                  </div>
                )}
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Back Test Modal */}
      <Modal
        title="Select Date for Backtest"
        open={isBackTestModalVisible}
        onOk={handleBackTest}
        onCancel={() => setIsBackTestModalVisible(false)}
        okButtonProps={{ disabled: !backTestDate }}
        destroyOnClose={true}
      >
        <div style={{ textAlign: 'center' }}>
          <p>Select a past date to analyze historical data:</p>
          <DatePicker 
            onChange={handleDateChange} 
            style={{ width: '100%' }} 
            disabledDate={current => current && current > dayjs().endOf('day')}
          />
        </div>
      </Modal>
      
      {/* Add CSS for tag hover effect */}
      <style>
        {`
        .signal-tag:hover {
          transform: scale(1.05) !important;
          box-shadow: 0 2px 6px var(--shadow-color);
        }
        
        .analysis-link-button:hover {
          background: ${darkMode ? 'rgba(24, 144, 255, 0.2)' : 'rgba(24, 144, 255, 0.1)'} !important;
        }
        
        @media (max-width: 768px) {
          .ant-card {
            width: 100% !important;
          }
        }
        `}
      </style>
    </div>
  );
};

export default StockAnalysis; 