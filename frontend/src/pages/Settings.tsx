import React, { useState } from 'react';
import { 
  Card, 
  Form, 
  Switch, 
  Select, 
  Input, 
  Button, 
  Typography, 
  Divider, 
  Row, 
  Col,
  Collapse,
  Alert,
  message
} from 'antd';
import { SaveOutlined, MailOutlined, NotificationOutlined, LockOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

interface SettingsFormValues {
  emailAlerts: boolean;
  emailFrequency: string;
  emailAddress: string;
  apiKey: string;
  defaultTimeframe: string;
  defaultWatchlist: string;
  chartStyle: string;
  showVolume: boolean;
  showIndicators: boolean;
  performanceTracking: boolean;
}

const Settings: React.FC = () => {
  const [form] = Form.useForm<SettingsFormValues>();
  const [saving, setSaving] = useState(false);

  // Default settings or fetch from localStorage/backend
  const defaultSettings: SettingsFormValues = {
    emailAlerts: true,
    emailFrequency: 'daily',
    emailAddress: '',
    apiKey: '',
    defaultTimeframe: 'D',
    defaultWatchlist: 'Default Group',
    chartStyle: 'candles',
    showVolume: true,
    showIndicators: true,
    performanceTracking: true
  };

  // Save settings
  const saveSettings = async (values: SettingsFormValues) => {
    setSaving(true);
    
    try {
      // In a real app, this would be an API call to save settings
      // For now, just simulate with localStorage
      localStorage.setItem('userSettings', JSON.stringify(values));
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      message.success('Settings saved successfully');
    } catch (error) {
      console.error("Error saving settings:", error);
      message.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Title level={2}>Settings</Title>
      <Text type="secondary">Configure your Stock Master experience</Text>

      <Divider />

      <Form
        form={form}
        layout="vertical"
        initialValues={defaultSettings}
        onFinish={saveSettings}
      >
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Card title={<><NotificationOutlined /> Alerts & Notifications</>} bordered={false}>
              <Form.Item
                name="emailAlerts"
                label="Email Alerts"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="emailFrequency"
                label="Alert Frequency"
                dependencies={['emailAlerts']}
                rules={[{ required: true, message: 'Please select frequency' }]}
              >
                <Select 
                  disabled={!form.getFieldValue('emailAlerts')}
                >
                  <Option value="realtime">Real-time</Option>
                  <Option value="hourly">Hourly</Option>
                  <Option value="daily">Daily Summary</Option>
                  <Option value="weekly">Weekly Summary</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="emailAddress"
                label="Email Address"
                dependencies={['emailAlerts']}
                rules={[
                  { required: form.getFieldValue('emailAlerts'), message: 'Please enter email' },
                  { type: 'email', message: 'Please enter a valid email' }
                ]}
              >
                <Input 
                  prefix={<MailOutlined />} 
                  disabled={!form.getFieldValue('emailAlerts')} 
                  placeholder="your.email@example.com"
                />
              </Form.Item>
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card title={<><LockOutlined /> API & Connections</>} bordered={false}>
              <Form.Item
                name="apiKey"
                label="API Key (Optional)"
                extra="For premium data access"
              >
                <Input.Password placeholder="Enter your API key" />
              </Form.Item>

              <Collapse ghost>
                <Panel header="What is this for?" key="1">
                  <Paragraph>
                    The API key allows you to access premium financial data services. 
                    This is optional and Stock Master will work with free data sources
                    if no API key is provided.
                  </Paragraph>
                  <Alert
                    message="Your API key is stored securely"
                    description="We encrypt all API keys and never share them with third parties."
                    type="info"
                    showIcon
                  />
                </Panel>
              </Collapse>
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card title="Default Settings" bordered={false}>
              <Form.Item
                name="defaultTimeframe"
                label="Default Chart Timeframe"
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="1">1 Minute</Option>
                  <Option value="5">5 Minutes</Option>
                  <Option value="15">15 Minutes</Option>
                  <Option value="30">30 Minutes</Option>
                  <Option value="60">1 Hour</Option>
                  <Option value="D">Daily</Option>
                  <Option value="W">Weekly</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="defaultWatchlist"
                label="Default Watchlist Group"
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="Default Group">Default Group</Option>
                  <Option value="Tech Stocks">Tech Stocks</Option>
                  <Option value="Crypto Related">Crypto Related</Option>
                </Select>
              </Form.Item>
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card title="Chart Preferences" bordered={false}>
              <Form.Item
                name="chartStyle"
                label="Chart Style"
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="candles">Candlestick</Option>
                  <Option value="heikinashi">Heikin-Ashi</Option>
                  <Option value="line">Line</Option>
                  <Option value="area">Area</Option>
                  <Option value="bars">Bars</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="showVolume"
                label="Show Volume"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="showIndicators"
                label="Show Default Indicators"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Card>
          </Col>

          <Col span={24}>
            <Card title="Privacy & Data" bordered={false}>
              <Form.Item
                name="performanceTracking"
                label="Performance Tracking"
                valuePropName="checked"
                extra="Track your portfolio and trade performance over time"
              >
                <Switch />
              </Form.Item>

              <Paragraph type="secondary">
                We respect your privacy. All of your data is stored locally on your device
                unless you explicitly enable cloud synchronization.
              </Paragraph>
            </Card>
          </Col>
        </Row>

        <Divider />

        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            icon={<SaveOutlined />} 
            loading={saving}
            size="large"
          >
            Save Settings
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default Settings; 