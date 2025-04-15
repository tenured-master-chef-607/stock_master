import React, { useEffect, createContext } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ConfigProvider, Layout, Menu, Typography, notification, theme } from 'antd';
import { 
  DashboardOutlined, 
  BarChartOutlined, 
  SettingOutlined, 
  BulbOutlined, 
  LineChartOutlined,
  UserOutlined
} from '@ant-design/icons';
import './App.css';
import { useAppSelector, useAppDispatch } from './store/hooks';
import { toggleDarkMode, toggleSidebar, setCurrentPage } from './store/slices/uiSlice';
import { getProfile } from './store/slices/authSlice';

// Pages
import Dashboard from './pages/Dashboard';
import StockScreener from './pages/StockScreener';
import Settings from './pages/Settings';
import TechnicalAnalysis from './pages/TechnicalAnalysis';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';

const { Header, Content, Footer, Sider } = Layout;
const { Title } = Typography;

// Create a theme context
export const ThemeContext = createContext({ darkMode: false });

// Create a custom hook for using theme
export const useTheme = () => React.useContext(ThemeContext);

function App() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode, sidebarCollapsed, currentPage } = useAppSelector(state => state.ui);
  const { isAuthenticated, token } = useAppSelector(state => state.auth);
  
  useEffect(() => {
    // Apply theme class to body for global CSS variables
    document.body.className = darkMode ? 'dark-theme' : 'light-theme';
  }, [darkMode]);
  
  useEffect(() => {
    // If authenticated, fetch user profile
    if (isAuthenticated && token) {
      dispatch(getProfile());
    }
  }, [isAuthenticated, token, dispatch]);

  // Sync menu selection with current route
  useEffect(() => {
    const pathname = location.pathname;
    
    if (pathname === '/') {
      dispatch(setCurrentPage('dashboard'));
    } else if (pathname === '/screener') {
      dispatch(setCurrentPage('screener'));
    } else if (pathname === '/technical') {
      dispatch(setCurrentPage('technical'));
    } else if (pathname === '/settings') {
      dispatch(setCurrentPage('settings'));
    }
  }, [location.pathname, dispatch]);

  const handleToggleTheme = () => {
    dispatch(toggleDarkMode());
    notification.success({
      message: `Switched to ${darkMode ? 'Light' : 'Dark'} Mode`,
      description: `The application theme has been changed to ${darkMode ? 'light' : 'dark'} mode.`,
      placement: 'bottomRight',
      duration: 3
    });
  };

  const handleMenuClick = (key: string) => {
    if (key === 'theme') {
      handleToggleTheme();
    } else {
      dispatch(setCurrentPage(key as any));
      // Navigate to the corresponding route
      switch(key) {
        case 'dashboard':
          navigate('/');
          break;
        case 'screener':
          navigate('/screener');
          break;
        case 'technical':
          navigate('/technical');
          break;
        case 'settings':
          navigate('/settings');
          break;
      }
    }
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

  return (
    <ThemeContext.Provider value={{ darkMode }}>
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
        <Routes>
          <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/" /> : <Register />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <Layout style={{ minHeight: '100vh' }}>
                <Sider 
                  collapsible 
                  collapsed={sidebarCollapsed} 
                  onCollapse={() => dispatch(toggleSidebar())}
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
                      {sidebarCollapsed ? 'SM' : 'Stock Master'}
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
                        onClick: () => handleMenuClick('dashboard'),
                      },
                      {
                        key: 'screener',
                        icon: <BarChartOutlined />,
                        label: 'Stock Screener',
                        onClick: () => handleMenuClick('screener'),
                      },
                      {
                        key: 'technical',
                        icon: <LineChartOutlined />,
                        label: 'Technical Analysis',
                        onClick: () => handleMenuClick('technical'),
                      },
                      {
                        key: 'settings',
                        icon: <SettingOutlined />,
                        label: 'Settings',
                        onClick: () => handleMenuClick('settings'),
                      },
                      {
                        key: 'theme',
                        icon: <BulbOutlined />,
                        label: `${darkMode ? 'Light' : 'Dark'} Mode`,
                        onClick: () => handleMenuClick('theme'),
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
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/screener" element={<StockScreener />} />
                        <Route path="/technical" element={<TechnicalAnalysis />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
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
            </ProtectedRoute>
          } />
        </Routes>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}

export default App;
