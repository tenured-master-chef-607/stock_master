import React, { useState } from 'react';
import { Card, Descriptions, Tag, Space, Spin, Button, DatePicker, Modal, message, Tooltip } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, HistoryOutlined, StockOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import type { RangePickerProps } from 'antd/es/date-picker';

// 添加 dayjs 插件
dayjs.extend(utc);
dayjs.extend(timezone);

interface AnalysisProps {
  symbol: string;
}

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8002';

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

  React.useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/stock/analysis/${symbol}`);
        const data = await response.json();
        setAnalysis(data);
      } catch (error) {
        console.error('获取分析数据失败:', error);
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
      message.error('不能选择未来的日期');
      return;
    }
    
    // 获取选择日期的数据
    const endDate = backTestDate.format('YYYY-MM-DD');
    const startDate = backTestDate.clone().subtract(60, 'day').format('YYYY-MM-DD');
    
    try {
      setIsBackTesting(true);
      const url = `${API_URL}/api/stock/backtest/${symbol}?start_date=${startDate}&end_date=${endDate}`;
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
        throw new Error(`请求失败: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Backtest results:', data);
      
      if (data.error) {
        message.error(data.error);
        return;
      }
      
      setBackTestResults(data);
      message.success('回测分析完成');
    } catch (error) {
      console.error('回测分析失败:', error);
      message.error(error instanceof Error ? error.message : '回测分析失败，请稍后重试');
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
    setSelectedSignal(matchedSignal);
  };

  // 添加获取美国东部时间的函数
  const getUsEasternTime = () => {
    return dayjs().tz('America/New_York').format('YYYY-MM-DD HH:mm:ss');
  };

  if (loading) {
    return <Spin />;
  }

  // 使用类型守卫来检查是否有错误
  if (!analysis || 'error' in analysis) {
    return <div>无法获取分析数据</div>;
  }

  return (
    <div style={{ height: '100%', width: '100%'}}>
      <Space>
          <Button 
            type="link" 
            icon={<StockOutlined />}
            href={`https://www.bing.com/search?q=${symbol}+stock+site:msn.com/en-us/money/stockdetails`}
            target="_blank"
            style={{ padding: '4px 8px' }}
          >
            MSN
          </Button>
          <Button 
            type="link" 
            icon={<StockOutlined />}
            href={`https://finance.yahoo.com/quote/${symbol}`}
            target="_blank"
            style={{ padding: '4px 8px' }}
          >
            Yahoo
          </Button>
          <Button 
            type="primary" 
            icon={<HistoryOutlined />} 
            onClick={() => setIsBackTestModalVisible(true)}
            style={{ marginLeft: 20 }}
          >
            回测分析
          </Button>
        </Space>

      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '100%'}}>
        <div style={{ width: '50%', paddingRight: 4 }}>
          <div style={{ textAlign: 'left' }} >
            <h3 style={{ margin: 0, marginBottom: '4px', textAlign: 'left', marginTop: 16 }}>{symbol} 分析报告</h3>
            <div style={{ color: '#666', fontSize: '12px', textAlign: 'left' }}>
              截止至 {getUsEasternTime()} EST
            </div>
          </div>
          <Descriptions column={1} size="small" style={{ marginTop: 16 }}>
            <Descriptions.Item label="当前价格">
              ${analysis.price.toFixed(2)}
              <Tag color={analysis.change >= 0 ? 'green' : 'red'} style={{ marginLeft: 8 }}>
                {analysis.change >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                {Math.abs(analysis.change).toFixed(2)}%
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="成交量">
              {analysis.volume.toFixed(1)}M
            </Descriptions.Item>
            <Descriptions.Item label="波动预警">
              <Tag color={analysis.volatility_alert.includes('预警') ? 'red' : 'green'}>
                {analysis.volatility_alert}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="资金流向">
              <Tag color={
                analysis.money_flow.includes('流入') ? 'green' : 
                analysis.money_flow.includes('外流') ? 'red' : 'blue'
              }>
                {analysis.money_flow}
              </Tag>
            </Descriptions.Item>
          </Descriptions>

          <div style={{ marginTop: 12 }}>
            <h4>技术信号</h4>
            <Space direction="vertical" style={{ width: '100%' }}>
              {analysis.technical_signals.map((signal: string, index: number) => (
                <Tag
                  key={index}
                  color={signal.includes('金叉') || signal.includes('超卖') ? 'green' : 
                         signal.includes('死叉') || signal.includes('超买') ? 'red' : 'blue'}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleSignalClick(signal)}
                >
                  {signal}
                </Tag>
              ))}
            </Space>
          </div>

          <div style={{ marginTop: 12 }}>
            <h4>成交量分析</h4>
            <Tag color={
              analysis.volume_alert.includes('突破') ? 'red' :
              analysis.volume_alert.includes('清淡') ? 'orange' : 'green'
            }>
              {analysis.volume_alert}
            </Tag>
          </div>
        </div>
        <div style={{ width: '50%', paddingLeft: 4 }}>
          {backTestResults && !isBackTesting && (
            <Card 
              title={`${backTestResults.date} 分析报告回测`} 
              style={{ marginTop: 0, backgroundColor: '#fafafa' }}
              bordered={false}
            >
              <Descriptions column={1} size="small">
                <Descriptions.Item label="当日收盘">
                  ${backTestResults.price?.toFixed(2)}
                  <Tag color={backTestResults.change >= 0 ? 'green' : 'red'} style={{ marginLeft: 8 }}>
                    {backTestResults.change >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                    {Math.abs(backTestResults.change || 0).toFixed(2)}%
                  </Tag>
                </Descriptions.Item>

                <Descriptions.Item label="当日最高">
                  ${backTestResults.high?.toFixed(2)}
                </Descriptions.Item>

                <Descriptions.Item label="当日最低">
                  ${backTestResults.low?.toFixed(2)}
                </Descriptions.Item>
                
                <Descriptions.Item label="成交量">
                  {backTestResults.volume?.toFixed(1)}M
                </Descriptions.Item>
                
                {backTestResults.volatility_alert && (
                  <Descriptions.Item label="波动预警">
                    <Tag color={backTestResults.volatility_alert?.includes('预警') ? 'red' : 'green'}>
                      {backTestResults.volatility_alert}
                    </Tag>
                  </Descriptions.Item>
                )}
                {backTestResults.money_flow && (
                  <Descriptions.Item label="资金流向">
                    <Tag color={
                      backTestResults.money_flow?.includes('流入') ? 'green' : 
                      backTestResults.money_flow?.includes('外流') ? 'red' : 'blue'
                    }>
                      {backTestResults.money_flow}
                    </Tag>
                  </Descriptions.Item>
                )}
              </Descriptions>

              {backTestResults.technical_signals && (
                <div style={{ marginTop: 8 }}>
                  <h4>技术信号</h4>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {backTestResults.technical_signals.map((signal: string, index: number) => (
                      <Tag 
                        key={index} 
                        color={
                          signal?.includes('金叉') || signal?.includes('超卖') ? 'green' : 
                          signal?.includes('死叉') || signal?.includes('超买') ? 'red' : 'blue'
                        } 
                        style={{ margin: '4px 0', cursor: 'pointer' }}
                        onClick={() => handleSignalClick(signal)}
                      >
                        {signal}
                      </Tag>
                    ))}
                  </Space>
                </div>
              )}

              {backTestResults.volume_alert && (
                <div style={{ marginTop: 12 }}>
                  <h4>成交量分析</h4>
                  <Tag color={
                    backTestResults.volume_alert?.includes('突破') ? 'red' :
                    backTestResults.volume_alert?.includes('清淡') ? 'orange' : 'green'
                  }>
                    {backTestResults.volume_alert}
                  </Tag>
                </div>
              )}

              {backTestResults.next_day && (
                <div style={{ marginTop: 12 }}>
                  <h4>预测验证</h4>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="次日实际">
                      ${backTestResults.next_day.price?.toFixed(2)}
                      <Tag color={backTestResults.next_day.change >= 0 ? 'green' : 'red'} style={{ marginLeft: 8 }}>
                        {backTestResults.next_day.change >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                        {Math.abs(backTestResults.next_day.change || 0).toFixed(2)}%
                      </Tag>
                    </Descriptions.Item>
                  </Descriptions>
                  
                  {backTestResults.predictions_verified && (
                    <Space direction="vertical" style={{ width: '100%', marginTop: 8 }}>
                      {backTestResults.predictions_verified.map((prediction: any, index: number) => (
                        <div key={index} style={{ 
                          padding: '8px', 
                          backgroundColor: 'white', 
                          borderRadius: '6px',
                          marginBottom: '4px'
                        }}>
                          <Space style={{ width: '100%', display: 'flex', flexWrap: 'wrap' }}>
                            <span>{prediction.signal}</span>
                            <Tag color="blue">预测: {prediction.prediction}</Tag>
                            <Tag color={prediction.correct ? 'green' : 'red'}>
                              {prediction.correct ? '预测正确' : '预测错误'}
                            </Tag>
                          </Space>
                        </div>
                      ))}
                    </Space>
                  )}

                  {backTestResults.accuracy !== null && backTestResults.accuracy !== undefined && (
                    <div style={{ marginTop: 8 }}>
                      <Tag color={backTestResults.accuracy >= 60 ? 'green' : 'red'}>
                        预测准确率: {backTestResults.accuracy.toFixed(1)}%
                      </Tag>
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      <Modal
        title="选择回测日期"
        open={isBackTestModalVisible}
        onOk={handleBackTest}
        onCancel={() => setIsBackTestModalVisible(false)}
        okButtonProps={{ disabled: !backTestDate }}
      >
        <DatePicker
          style={{ width: '100%' }}
          onChange={handleDateChange}
          value={backTestDate}
          disabledDate={current => {
            // 禁用今天和未来的日期
            return current && current > dayjs().endOf('day');
          }}
          allowClear={true}
          placeholder="选择要分析的交易日"
          presets={[
            { label: '上月底', value: dayjs().subtract(1, 'month').endOf('month') },
            { label: '三个月前', value: dayjs().subtract(3, 'month').endOf('month') },
          ]}
        />
        <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
          选择日期后，系统将分析该日的市场信号，并用下一个交易日的数据验证预测准确性
        </div>
      </Modal>

      <Modal
        title="技术指标解释"
        open={!!selectedSignal}
        onCancel={() => setSelectedSignal(null)}
        footer={null}
      >
        {selectedSignal && (
          <div>
            <h3>{selectedSignal}</h3>
            <p>{SIGNAL_EXPLANATIONS[selectedSignal]}</p>
            <div style={{ marginTop: 16 }}>
              <h4>如何使用这个信号：</h4>
              <ul>
                <li>信号含义：{SIGNAL_EXPLANATIONS[selectedSignal]}</li>
                <li>建议操作：{
                  selectedSignal.includes('金叉') || selectedSignal.includes('超卖') ? 
                    '考虑买入或持有' : 
                    selectedSignal.includes('死叉') || selectedSignal.includes('超买') ?
                    '考虑卖出或观望' : '密切关注市场变化'
                }</li>
                <li>注意事项：技术指标仅供参考，请结合基本面和市场环境综合判断</li>
              </ul>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StockAnalysis; 