import { useState } from "react";
import { Layout, Menu, Avatar, Dropdown, Badge, Button, theme } from "antd";
import {
  DashboardOutlined,
  TeamOutlined,
  AppstoreOutlined,
  CalendarOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  ApartmentOutlined,
  FileProtectOutlined,
  TagsOutlined,
  UsergroupAddOutlined,
  EnvironmentOutlined, // ← العملاء
} from "@ant-design/icons";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import api from "../../api/axios";
import logo from "../../assets/logo.png";

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: "/dashboard", icon: <DashboardOutlined />, label: "لوحة التحكم" },
  { key: "/specializations", icon: <ApartmentOutlined />, label: "التخصصات" },
  { key: "/cities", icon: <EnvironmentOutlined />, label: "المدن والمناطق" },
  { key: "/providers", icon: <TeamOutlined />, label: "مزودو الخدمة" },
  { key: "/customers", icon: <UsergroupAddOutlined />, label: "العملاء" }, // ← جديد
  { key: "/services", icon: <AppstoreOutlined />, label: "الخدمات" },
  { key: "/bookings", icon: <CalendarOutlined />, label: "الحجوزات" },
  {
    key: "/completions",
    icon: <FileProtectOutlined />,
    label: "إتمام الخدمات",
  },
  { key: "/coupons", icon: <TagsOutlined />, label: "كوبونات الخصم" },
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      const refresh = localStorage.getItem("refresh_token");
      await api.post("/accounts/logout/", { refresh });
    } catch (_) {}
    localStorage.clear();
    navigate("/login");
  };

  const userMenu = {
    items: [
      {
        key: "logout",
        icon: <LogoutOutlined />,
        label: "تسجيل الخروج",
        danger: true,
        onClick: handleLogout,
      },
    ],
  };

  return (
    <Layout
      style={{
        minHeight: "100vh",
        direction: "rtl",
        fontFamily: "'Cairo', sans-serif",
      }}
    >
      {/* ===== Sidebar ===== */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={220}
        style={{
          background: "#0f1f1a",
          boxShadow: "2px 0 12px rgba(0,0,0,0.18)",
          position: "fixed",
          right: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            padding: collapsed ? 0 : "0 20px",
            gap: 10,
            borderBottom: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <img
            src={logo}
            alt="مساعد"
            style={{ width: "50px", height: "50px" }}
          />
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          onClick={({ key }) => navigate(key)}
          items={menuItems}
          style={{
            background: "transparent",
            border: "none",
            marginTop: 8,
            fontFamily: "'Cairo', sans-serif",
          }}
        />
      </Sider>

      {/* ===== Main Layout ===== */}
      <Layout
        style={{
          marginRight: collapsed ? 80 : 220,
          transition: "margin-right 0.2s",
          background: "#f0f4f2",
        }}
      >
        {/* ===== Header ===== */}
        <Header
          style={{
            padding: "0 24px",
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 99,
            boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
            height: 64,
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 18, color: "#333" }}
          />

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Badge count={3} size="small">
              <Button
                type="text"
                icon={<BellOutlined style={{ fontSize: 18 }} />}
                style={{ color: "#555" }}
              />
            </Badge>
            <Dropdown
              menu={userMenu}
              placement="bottomLeft"
              trigger={["click"]}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                  padding: "4px 8px",
                  borderRadius: 8,
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#f5f5f5")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <Avatar
                  size={34}
                  icon={<UserOutlined />}
                  style={{ background: "#e07b1a" }}
                />
                {!collapsed && (
                  <span
                    style={{ fontSize: 13, fontWeight: 600, color: "#333" }}
                  >
                    المدير
                  </span>
                )}
              </div>
            </Dropdown>
          </div>
        </Header>

        {/* ===== Page Content ===== */}
        <Content style={{ padding: 24, minHeight: "calc(100vh - 64px)" }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
