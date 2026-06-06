import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Space,
  Input,
  Tag,
  Card,
  Row,
  Col,
  Statistic,
  Tooltip,
  Avatar,
  message,
  Popconfirm,
  Badge,
} from "antd";
import {
  SearchOutlined,
  EyeOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UsergroupAddOutlined,
  PhoneOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

const { Search } = Input;

export default function Customers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filter, setFilter] = useState("all"); // all | active | inactive

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params =
        filter === "active"
          ? "?is_active=true"
          : filter === "inactive"
          ? "?is_active=false"
          : "";
      const res = await api.get(`/accounts/admin/customers/${params}`);
      const data = Array.isArray(res.data) ? res.data : res.data.results ?? [];
      setCustomers(data);
    } catch {
      message.error("فشل تحميل العملاء");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [filter]);

  const handleDeactivate = async (id) => {
    try {
      await api.delete(`/accounts/admin/customers/${id}/`);
      message.success("تم تعطيل الحساب");
      fetchCustomers();
    } catch {
      message.error("فشل تعطيل الحساب");
    }
  };

  /* ── فلترة محلية بالبحث ── */
  const filtered = customers.filter((c) => {
    const s = searchText.toLowerCase();
    return (
      (c.name ?? "").toLowerCase().includes(s) ||
      (c.phone_number ?? "").includes(s) ||
      (c.email ?? "").toLowerCase().includes(s)
    );
  });

  /* ── إحصاءات ── */
  const counts = {
    all: customers.length,
    active: customers.filter((c) => c.is_active).length,
    inactive: customers.filter((c) => !c.is_active).length,
    verified: customers.filter((c) => c.is_phone_verified).length,
  };

  const statCards = [
    {
      title: "إجمالي العملاء",
      value: counts.all,
      color: "#e07b1a",
      bg: "#fff7e6",
      icon: <UsergroupAddOutlined />,
    },
    {
      title: "نشطون",
      value: counts.active,
      color: "#52c41a",
      bg: "#f6ffed",
      icon: <CheckCircleOutlined />,
    },
    {
      title: "موقوفون",
      value: counts.inactive,
      color: "#ff4d4f",
      bg: "#fff2f0",
      icon: <CloseCircleOutlined />,
    },
    {
      title: "رقم محقق",
      value: counts.verified,
      color: "#1677ff",
      bg: "#e6f4ff",
      icon: <PhoneOutlined />,
    },
  ];

  /* ── أعمدة الجدول ── */
  const columns = [
    {
      title: "العميل",
      key: "customer",
      render: (_, r) => (
        <Space>
          <Avatar
            size={38}
            icon={<UserOutlined />}
            style={{ background: "#e07b1a", flexShrink: 0 }}
          />
          <div>
            <div style={{ fontWeight: 600, color: "#1a1a2e", lineHeight: 1.3 }}>
              {r.name || "—"}
            </div>
            <div style={{ fontSize: 12, color: "#888" }}>{r.email || "—"}</div>
          </div>
        </Space>
      ),
    },
    {
      title: "رقم الجوال",
      dataIndex: "phone_number",
      key: "phone",
      render: (v) => (
        <Space>
          <PhoneOutlined style={{ color: "#888" }} />
          <span style={{ fontFamily: "monospace" }}>{v}</span>
        </Space>
      ),
    },
    {
      title: "التحقق",
      dataIndex: "is_phone_verified",
      key: "verified",
      align: "center",
      render: (v) =>
        v ? (
          <Tag icon={<CheckCircleOutlined />} color="success">
            محقق
          </Tag>
        ) : (
          <Tag icon={<CloseCircleOutlined />} color="default">
            غير محقق
          </Tag>
        ),
    },
    {
      title: "العناوين",
      key: "addresses",
      align: "center",
      render: (_, r) => (
        <Badge
          count={r.addresses?.length ?? 0}
          showZero
          style={{ background: r.addresses?.length ? "#0f1f1a" : "#ccc" }}
        />
      ),
    },
    {
      title: "الحجوزات",
      dataIndex: "bookings_count",
      key: "bookings",
      align: "center",
      render: (v) => (
        <Badge
          count={v ?? 0}
          showZero
          style={{ background: v ? "#e07b1a" : "#ccc" }}
        />
      ),
    },
    {
      title: "الحالة",
      dataIndex: "is_active",
      key: "status",
      align: "center",
      render: (v) =>
        v ? <Tag color="success">نشط</Tag> : <Tag color="error">موقوف</Tag>,
    },
    {
      title: "تاريخ التسجيل",
      dataIndex: "created_at",
      key: "created_at",
      render: (v) => (v ? new Date(v).toLocaleDateString("ar-SA") : "—"),
    },
    {
      title: "الإجراءات",
      key: "actions",
      fixed: "left",
      render: (_, r) => (
        <Space size="small">
          <Tooltip title="عرض التفاصيل">
            <Button
              type="text"
              icon={<EyeOutlined />}
              style={{ color: "#1677ff" }}
              onClick={() => navigate(`/customers/${r.id}`)}
            />
          </Tooltip>
          {r.is_active && (
            <Popconfirm
              title="تعطيل الحساب؟"
              description="سيتم إيقاف حساب العميل."
              onConfirm={() => handleDeactivate(r.id)}
              okText="تعطيل"
              cancelText="تراجع"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="تعطيل الحساب">
                <Button
                  type="text"
                  icon={<StopOutlined />}
                  style={{ color: "#ff4d4f" }}
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ fontFamily: "'Cairo', sans-serif" }}>
      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {statCards.map((s, i) => (
          <Col xs={24} sm={12} md={6} key={i} style={{ marginBottom: 8 }}>
            <Card
              bordered={false}
              style={{ borderRadius: 12, background: s.bg }}
              bodyStyle={{ padding: "16px 20px" }}
            >
              <Statistic
                title={
                  <span style={{ color: "#666", fontSize: 12 }}>{s.title}</span>
                }
                value={s.value}
                valueStyle={{ color: s.color, fontWeight: 700, fontSize: 26 }}
                prefix={
                  <span style={{ color: s.color, marginLeft: 6 }}>
                    {s.icon}
                  </span>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Table Card */}
      <Card
        bordered={false}
        style={{ borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
        bodyStyle={{ padding: 0 }}
      >
        {/* Toolbar */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid #f0f0f0",
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              color: "#0f1f1a",
            }}
          >
            العملاء
          </h2>

          <Space wrap>
            <Search
              placeholder="بحث بالاسم أو الجوال أو البريد..."
              allowClear
              style={{ width: 280 }}
              prefix={<SearchOutlined style={{ color: "#bbb" }} />}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Space>
              {[
                { key: "all", label: "الكل", count: counts.all },
                { key: "active", label: "نشطون", count: counts.active },
                { key: "inactive", label: "موقوفون", count: counts.inactive },
              ].map((f) => (
                <Button
                  key={f.key}
                  size="small"
                  type={filter === f.key ? "primary" : "default"}
                  onClick={() => setFilter(f.key)}
                  style={
                    filter === f.key
                      ? { background: "#0f1f1a", borderColor: "#0f1f1a" }
                      : {}
                  }
                >
                  {f.label}
                  <Badge
                    count={f.count}
                    showZero
                    style={{
                      marginRight: 4,
                      background: filter === f.key ? "#e07b1a" : "#ccc",
                      fontSize: 10,
                    }}
                  />
                </Button>
              ))}
            </Space>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={filtered}
          loading={loading}
          rowKey="id"
          scroll={{ x: 900 }}
          pagination={{
            pageSize: 12,
            showSizeChanger: false,
            showTotal: (total) => `${total} عميل`,
          }}
          style={{ padding: "0 8px" }}
        />
      </Card>
    </div>
  );
}
