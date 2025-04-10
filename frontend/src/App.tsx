import React, { useState, useEffect, createContext, useContext } from 'react';
import { ConfigProvider, Layout, Menu, theme, Typography, notification } from 'antd';
import { DashboardOutlined, BarChartOutlined, SettingOutlined, BulbOutlined, LineChartOutlined } from '@ant-design/icons';
import './App.css';
import StockDashboard from './components/StockDashboard';
// @ts-ignore - Module exists but TypeScript cannot find it
import StockScreener from './pages/StockScreener';
// @ts-ignore - Module exists but TypeScript cannot find it
import Settings from './pages/Settings';
// @ts-ignore - Module exists but TypeScript cannot find it
import TechnicalAnalysis from './pages/TechnicalAnalysis';

const { Header, Content, Footer, Sider } = Layout;
const { Title } = Typography;

// Create a theme context to share theme across components
export type ThemeContextType = {
  darkMode: boolean;
  toggleTheme: () => void;
};

export const ThemeContext = createContext<ThemeContextType>({
  darkMode: true,
  toggleTheme: () => {}
});

// Hook to use theme in components
export const useTheme = () => useContext(ThemeContext);

function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'screener' | 'settings' | 'technical'>('dashboard');

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    // Apply theme class to body for global CSS variables
    document.body.className = darkMode ? 'dark-theme' : 'light-theme';
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode((prevMode: boolean) => !prevMode);
    notification.success({
      message: `Switched to ${darkMode ? 'Light' : 'Dark'} Mode`,
      description: `The application theme has been changed to ${darkMode ? 'light' : 'dark'} mode.`,
      placement: 'bottomRight',
      duration: 3
    });
  };

  // Dynamic theme based on dark mode state
  const { defaultAlgorithm, darkAlgorithm } = theme;

  // Shared theme values 
  const themeTokens = {
    colorPrimary: '#1890ff',
    borderRadius: 6,
    colorBgContainer: darkMode ? '#1f1f1f' : '#ffffff',
    colorText: darkMode ? '#e0e0e0' : '#000000',
    colorBgBase: darkMode ? '#141414' : '#f0f2f5',
  };

  // Render the current page based on selection
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'screener':
        return <StockScreener />;
      case 'settings':
        return <Settings />;
      case 'technical':
        return <TechnicalAnalysis />;
      case 'dashboard':
      default:
        return <StockDashboard />;
    }
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme }}>
      <ConfigProvider
        theme={{
          algorithm: darkMode ? darkAlgorithm : defaultAlgorithm,
          token: themeTokens,
          components: {
            Card: {
              colorBgContainer: darkMode ? '#1a1a1a' : '#ffffff',
              colorBorderSecondary: darkMode ? '#333333' : '#f0f0f0',
              colorTextHeading: darkMode ? '#e0e0e0' : '#000000'
            },
            Button: {
              colorText: darkMode ? '#e0e0e0' : '#000000',
              colorPrimaryHover: darkMode ? '#40a9ff' : '#40a9ff',
              colorBgContainer: darkMode ? '#1f1f1f' : '#ffffff'
            },
            Input: {
              colorBgContainer: darkMode ? '#2a2a2a' : '#ffffff',
              colorBorder: darkMode ? '#444444' : '#d9d9d9',
              colorText: darkMode ? '#e0e0e0' : '#000000',
              colorTextPlaceholder: darkMode ? '#737373' : '#bfbfbf'
            },
            Table: {
              colorBgContainer: darkMode ? '#1a1a1a' : '#ffffff',
              colorText: darkMode ? '#e0e0e0' : '#000000',
              colorBorderSecondary: darkMode ? '#333333' : '#f0f0f0',
              colorFillAlter: darkMode ? '#262626' : '#fafafa',
              colorFillContent: darkMode ? '#1f1f1f' : '#f5f5f5'
            },
            Select: {
              colorBgContainer: darkMode ? '#2a2a2a' : '#ffffff',
              colorText: darkMode ? '#e0e0e0' : '#000000',
              colorBgElevated: darkMode ? '#252525' : '#ffffff',
              colorBorder: darkMode ? '#444444' : '#d9d9d9',
              colorTextPlaceholder: darkMode ? '#737373' : '#bfbfbf'
            },
            Modal: {
              colorBgElevated: darkMode ? '#1a1a1a' : '#ffffff',
              colorIcon: darkMode ? '#a0a0a0' : '#00000073',
              colorIconHover: darkMode ? '#e0e0e0' : '#000000'
            },
            Menu: {
              colorItemBg: darkMode ? '#141414' : '#f0f2f5',
              colorItemText: darkMode ? '#e0e0e0' : '#000000',
              colorItemTextHover: darkMode ? '#ffffff' : '#1890ff',
              colorItemTextSelected: darkMode ? '#1890ff' : '#1890ff',
              colorActiveBarWidth: 3,
              colorActiveBarHeight: 0,
              colorActiveBarBorderSize: 0
            },
            Descriptions: {
              colorTextHeading: darkMode ? '#e0e0e0' : '#000000',
              colorText: darkMode ? '#e0e0e0' : '#000000',
              colorTextSecondary: darkMode ? '#a0a0a0' : '#595959',
              colorBorderSecondary: darkMode ? '#333333' : '#f0f0f0',
              colorSplit: darkMode ? '#333333' : '#f0f0f0'
            },
            Tree: {
              colorBgContainer: darkMode ? 'transparent' : 'transparent',
              colorText: darkMode ? '#e0e0e0' : '#000000',
              colorTextSecondary: darkMode ? '#a0a0a0' : '#595959',
              colorIcon: darkMode ? '#a0a0a0' : '#00000073'
            },
            Tooltip: {
              colorBgBase: darkMode ? 'rgba(0, 0, 0, 0.75)' : 'rgba(255, 255, 255, 0.75)',
              colorTextLightSolid: darkMode ? '#ffffff' : '#000000'
            },
            Dropdown: {
              colorBgElevated: darkMode ? '#252525' : '#ffffff',
              colorText: darkMode ? '#e0e0e0' : '#000000'
            },
            DatePicker: {
              colorBgContainer: darkMode ? '#2a2a2a' : '#ffffff',
              colorBgElevated: darkMode ? '#252525' : '#ffffff',
              colorText: darkMode ? '#e0e0e0' : '#000000',
              colorTextDisabled: darkMode ? '#737373' : '#00000040',
              colorIcon: darkMode ? '#a0a0a0' : '#00000073',
              colorIconHover: darkMode ? '#e0e0e0' : '#000000',
              colorBorder: darkMode ? '#444444' : '#d9d9d9'
            },
            Tag: {
              colorBgBase: darkMode ? '#252525' : '#fafafa',
              colorText: darkMode ? '#e0e0e0' : '#000000'
            },
            Typography: {
              colorText: darkMode ? '#e0e0e0' : '#000000',
              colorTextSecondary: darkMode ? '#a0a0a0' : '#595959'
            }
          }
        }}
      >
        <Layout style={{ minHeight: '100vh' }}>
          <Sider 
            collapsible 
            collapsed={collapsed} 
            onCollapse={setCollapsed}
            style={{
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              zIndex: 10
            }}
            theme={darkMode ? 'dark' : 'light'}
          >
            <div className="logo">
              <Title level={4} style={{ 
                margin: '16px 0',
                textAlign: 'center',
                color: darkMode ? '#e0e0e0' : '#000000',
                transition: 'color 0.3s ease'
              }}>
                {collapsed ? 'SM' : 'Stock Master'}
              </Title>
            </div>
            <Menu
              theme={darkMode ? 'dark' : 'light'}
              defaultSelectedKeys={['dashboard']}
              selectedKeys={[currentPage]}
              mode="inline"
              items={[
                {
                  key: 'dashboard',
                  icon: <DashboardOutlined />,
                  label: 'Dashboard',
                  onClick: () => setCurrentPage('dashboard'),
                },
                {
                  key: 'screener',
                  icon: <BarChartOutlined />,
                  label: 'Stock Screener',
                  onClick: () => setCurrentPage('screener'),
                },
                {
                  key: 'technical',
                  icon: <LineChartOutlined />,
                  label: 'Technical Analysis',
                  onClick: () => setCurrentPage('technical'),
                },
                {
                  key: 'settings',
                  icon: <SettingOutlined />,
                  label: 'Settings',
                  onClick: () => setCurrentPage('settings'),
                },
                {
                  key: 'theme',
                  icon: <BulbOutlined />,
                  label: `${darkMode ? 'Light' : 'Dark'} Mode`,
                  onClick: toggleTheme,
                },
              ]}
            />
          </Sider>
          <Layout>
            <Header style={{ 
              padding: 0,
              boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
              background: darkMode ? '#1f1f1f' : '#ffffff',
              transition: 'background-color 0.3s ease'
            }} />
            <Content style={{ margin: '16px' }}>
              <div style={{ 
                padding: 24, 
                minHeight: 360,
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                background: darkMode ? '#1a1a1a' : '#ffffff',
                transition: 'background-color 0.3s ease, box-shadow 0.3s ease'
              }}>
                {renderCurrentPage()}
              </div>
            </Content>
            <Footer style={{ 
              textAlign: 'center',
              background: darkMode ? '#1f1f1f' : '#f0f2f5',
              color: darkMode ? '#a0a0a0' : '#595959',
              transition: 'background-color 0.3s ease, color 0.3s ease'
            }}>
              Stock Master ©{new Date().getFullYear()} - Advanced Stock Analysis Platform
            </Footer>
          </Layout>
        </Layout>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}

export default App;
