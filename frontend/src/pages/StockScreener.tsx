import React, { useState } from 'react';
import { 
  Card, 
  Form, 
  Select, 
  InputNumber, 
  Button, 
  Table, 
  Space, 
  Typography, 
  Tag, 
  Divider, 
  Spin 
} from 'antd';
import { SearchOutlined, FileAddOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;
const { Option } = Select;

// Define the stock screening criteria types
interface ScreeningCriteria {
  field: string;
  operator: string;
  value: number;
}

// Define the stock result interface
interface StockResult {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  change: number;
  volume: number;
  marketCap: number;
  pe: number;
}

const StockScreener: React.FC = () => {
  const [form] = Form.useForm();
  const [criteria, setCriteria] = useState<ScreeningCriteria[]>([]);
  const [results, setResults] = useState<StockResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Available fields for screening
  const fields = [
    { label: 'Price', value: 'price' },
    { label: 'Volume', value: 'volume' },
    { label: 'Market Cap', value: 'marketCap' },
    { label: 'P/E Ratio', value: 'pe' },
    { label: 'EPS Growth', value: 'epsGrowth' },
    { label: 'Dividend Yield', value: 'dividendYield' },
    { label: 'Revenue Growth', value: 'revenueGrowth' },
    { label: '52-Week High', value: '52WeekHigh' },
    { label: '52-Week Low', value: '52WeekLow' },
  ];

  // Operators for screening
  const operators = [
    { label: 'Greater Than', value: '>' },
    { label: 'Less Than', value: '<' },
    { label: 'Equals', value: '=' },
    { label: 'Not Equals', value: '!=' },
    { label: 'Greater Than or Equal', value: '>=' },
    { label: 'Less Than or Equal', value: '<=' },
  ];

  // Add a new criteria
  const addCriteria = () => {
    const values = form.getFieldsValue();
    if (values.field && values.operator && values.value !== undefined) {
      setCriteria([...criteria, values]);
      form.resetFields();
    }
  };

  // Remove a criteria
  const removeCriteria = (index: number) => {
    const newCriteria = [...criteria];
    newCriteria.splice(index, 1);
    setCriteria(newCriteria);
  };

  // Run the screening
  const runScreening = async () => {
    if (criteria.length === 0) return;

    setLoading(true);
    try {
      // In a real app, this would be an API call to your backend
      // For now, we'll simulate with dummy data
      const apiUrl = `${process.env.REACT_APP_API_URL}/api/analysis/screening`;
      
      const response = await axios.post(apiUrl, { criteria });
      
      // Process the results
      setResults(response.data.results || []);
    } catch (error) {
      console.error("Error running stock screening:", error);
      // In a real app, display an error message
    } finally {
      setLoading(false);
    }
  };

  // Add a stock to watchlist
  const addToWatchlist = async (symbol: string) => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/watchlist/add`, {
        symbol,
        group: "Default Group"
      });
      
      if (response.data.success) {
        console.log(`Added ${symbol} to watchlist`);
        // In a real app, display a success message
      }
    } catch (error) {
      console.error(`Error adding ${symbol} to watchlist:`, error);
      // In a real app, display an error message
    }
  };

  // Table columns
  const columns = [
    {
      title: 'Symbol',
      dataIndex: 'symbol',
      key: 'symbol',
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Sector',
      dataIndex: 'sector',
      key: 'sector',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `$${price.toFixed(2)}`,
    },
    {
      title: 'Change',
      dataIndex: 'change',
      key: 'change',
      render: (change: number) => (
        <Text style={{ color: change >= 0 ? 'green' : 'red' }}>
          {change >= 0 ? '+' : ''}{change.toFixed(2)}%
        </Text>
      ),
    },
    {
      title: 'Volume',
      dataIndex: 'volume',
      key: 'volume',
      render: (volume: number) => volume.toLocaleString(),
    },
    {
      title: 'Market Cap',
      dataIndex: 'marketCap',
      key: 'marketCap',
      render: (marketCap: number) => {
        if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
        if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
        if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
        return `$${marketCap.toLocaleString()}`;
      },
    },
    {
      title: 'P/E',
      dataIndex: 'pe',
      key: 'pe',
      render: (pe: number) => pe.toFixed(2),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: StockResult) => (
        <Button 
          type="primary" 
          icon={<FileAddOutlined />} 
          size="small"
          onClick={() => addToWatchlist(record.symbol)}
        >
          Add
        </Button>
      ),
    },
  ];

  // Generate example data for initial demo
  const generateExampleData = () => {
    const exampleResults: StockResult[] = [
      { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', price: 188.31, change: 0.5, volume: 58234000, marketCap: 2890000000000, pe: 31.2 },
      { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology', price: 420.45, change: 1.2, volume: 22145000, marketCap: 3120000000000, pe: 36.5 },
      { symbol: 'GOOG', name: 'Alphabet Inc.', sector: 'Technology', price: 175.89, change: -0.3, volume: 15234000, marketCap: 2210000000000, pe: 25.8 },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Cyclical', price: 178.25, change: 0.8, volume: 32125000, marketCap: 1845000000000, pe: 42.1 },
      { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Automotive', price: 175.45, change: -1.5, volume: 65481000, marketCap: 557000000000, pe: 47.3 },
    ];
    setResults(exampleResults);
  };

  return (
    <div>
      <Title level={2}>Stock Screener</Title>
      <Text type="secondary">Find stocks matching your specific criteria</Text>

      <Divider />

      <Card title="Screening Criteria" style={{ marginBottom: 20 }}>
        <Form form={form} layout="inline" style={{ marginBottom: 16 }}>
          <Form.Item name="field" label="Field" rules={[{ required: true }]}>
            <Select style={{ width: 180 }} placeholder="Select field">
              {fields.map(field => (
                <Option key={field.value} value={field.value}>{field.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="operator" label="Operator" rules={[{ required: true }]}>
            <Select style={{ width: 180 }} placeholder="Select operator">
              {operators.map(op => (
                <Option key={op.value} value={op.value}>{op.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="value" label="Value" rules={[{ required: true }]}>
            <InputNumber style={{ width: 120 }} />
          </Form.Item>
          <Form.Item>
            <Button type="dashed" onClick={addCriteria}>Add Criteria</Button>
          </Form.Item>
        </Form>

        <div style={{ marginBottom: 16 }}>
          {criteria.length === 0 ? (
            <Text type="secondary">No criteria added yet. Add at least one criteria to run screening.</Text>
          ) : (
            <Space direction="vertical" style={{ width: '100%' }}>
              {criteria.map((item, index) => (
                <Card 
                  key={index} 
                  size="small" 
                  style={{ width: '100%' }}
                  extra={<Button type="text" danger onClick={() => removeCriteria(index)}>Remove</Button>}
                >
                  {fields.find(f => f.value === item.field)?.label} 
                  {' '}
                  {operators.find(o => o.value === item.operator)?.label} 
                  {' '}
                  {item.value}
                </Card>
              ))}
            </Space>
          )}
        </div>

        <Button 
          type="primary" 
          icon={<SearchOutlined />}
          onClick={runScreening}
          disabled={criteria.length === 0}
          style={{ marginRight: 8 }}
        >
          Run Screening
        </Button>
        <Button onClick={generateExampleData}>
          Show Example Results
        </Button>
      </Card>

      <Card title="Screening Results">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>Processing your request...</div>
          </div>
        ) : (
          <Table 
            dataSource={results} 
            columns={columns} 
            rowKey="symbol" 
            pagination={{ pageSize: 10 }}
            scroll={{ x: true }}
          />
        )}
      </Card>
    </div>
  );
};

export default StockScreener; 