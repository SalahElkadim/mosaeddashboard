import { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Avatar,
  Tag,
  Spin,
  Button,
  Space,
  Descriptions,
  Table,
  Empty,
  message,
  Popconfirm,
  Badge,
  Divider,
  Typography,
  Timeline,
} from "antd";
import {
  ArrowRightOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  StopOutlined,
  ClockCircleOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";

const { Text, Title } = Typography;

const STATUS_MAP = {
  pending: {
    label: "قيد الانتظار",
    color: "orange",
    icon: <ClockCircleOutlined />,
  },
  confirmed: { label: "مؤكد", color: "blue", icon: <SyncOutlined /> },
  completed: { label: "مكتمل", color: "green", icon: <CheckCircleOutlined /> },
  cancelled: { label: "ملغي", color: "red", icon: <CloseCircleOutlined /> },
};

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bLoading, setBLoading] = useState(false);

  /* ── جلب بيانات العميل ── */
  const fetchCustomer = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/accounts/admin/customers/${id}/`);
      setCustomer(res.data);
    } catch {
      message.error("فشل تحميل بيانات العميل");
    } finally {
      setLoading(false);
    }
  };

  /* ── جلب حجوزات العميل ── */
  const fetchBookings = async () => {
    setBLoading(true);
    try {
      const res = await api.get(
        `/existedservices/admin/bookings/?customer_id=${id}`
      );
      const data = Array.isArray(res.data) ? res.data : res.data.results ?? [];
      setBookings(data);
    } catch {
      // مش كل الـ backends بتدعم filter بالـ customer_id — نعرض فاضي
      setBookings([]);
    } finally {
      setBLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
    fetchBookings();
  }, [id]);

  const handleDeactivate = async () => {
    try {
      await api.delete(`/accounts/admin/customers/${id}/`);
      message.success("تم تعطيل الحساب");
      fetchCustomer();
    } catch {
      message.error("فشل تعطيل الحساب");
    }
  };

  /* ── أعمدة جدول الحجوزات ── */
  const bookingColumns = [
    {
      title: "رقم الحجز",
      dataIndex: "id",
      render: (v) => (
        <Text style={{ fontFamily: "monospace", fontWeight: 600 }}>
          #{String(v).slice(0, 8)}
        </Text>
      ),
    },
    {
      title: "الخدمة",
      dataIndex: "service_title",
      render: (v) => (
        <Tag color="orange" style={{ borderRadius: 6 }}>
          {v ?? "—"}
        </Tag>
      ),
    },
    {
      title: "مزود الخدمة",
      dataIndex: "provider_name",
      render: (v) => v ?? "—",
    },
    {
      title: "التكلفة",
      key: "cost",
      render: (_, r) => {
        const hasDiscount = parseFloat(r.discount_amount ?? 0) > 0;
        return hasDiscount ? (
          <Space direction="vertical" size={0}>
            <Text delete type="secondary" style={{ fontSize: 12 }}>
              {parseFloat(r.total_cost).toFixed(2)} ر.س
            </Text>
            <Text style={{ color: "#52c41a", fontWeight: 700 }}>
              {parseFloat(r.final_cost ?? r.total_cost).toFixed(2)} ر.س
            </Text>
          </Space>
        ) : (
          <Text style={{ fontWeight: 600 }}>
            {parseFloat(r.total_cost ?? 0).toFixed(2)} ر.س
          </Text>
        );
      },
    },
    {
      title: "تاريخ الموعد",
      dataIndex: "scheduled_date",
      render: (v) => (v ? new Date(v).toLocaleDateString("ar-SA") : "—"),
    },
    {
      title: "الحالة",
      dataIndex: "status",
      render: (v) => {
        const s = STATUS_MAP[v] ?? { label: v, color: "default" };
        return (
          <Tag
            icon={s.icon}
            color={s.color}
            style={{ borderRadius: 20, fontWeight: 600 }}
          >
            {s.label}
          </Tag>
        );
      },
    },
    {
      title: "",
      key: "view",
      render: (_, r) => (
        <Button
          type="link"
          size="small"
          onClick={() => navigate(`/bookings/${r.id}`)}
        >
          تفاصيل
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <div
        style={{ display: "flex", justifyContent: "center", paddingTop: 100 }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!customer) return null;

  /* ── إحصاءات حريفة ── */
  const bCounts = {
    total: bookings.length,
    completed: bookings.filter((b) => b.status === "completed").length,
    pending: bookings.filter((b) => b.status === "pending").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  };
  const totalSpent = bookings
    .filter((b) => b.status === "completed")
    .reduce((sum, b) => sum + parseFloat(b.final_cost ?? b.total_cost ?? 0), 0);

  return (
    <div style={{ fontFamily: "'Cairo', sans-serif" }}>
      {/* ── رأس الصفحة ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <Button
          type="text"
          icon={<ArrowRightOutlined />}
          onClick={() => navigate("/customers")}
          style={{ color: "#0f1f1a", fontWeight: 600 }}
        >
          العملاء
        </Button>
        <span style={{ color: "#ccc" }}>/</span>
        <span style={{ fontWeight: 700, color: "#0f1f1a" }}>
          {customer.name}
        </span>
      </div>

      <Row gutter={24}>
        {/* ── عمود يسار: بطاقة العميل ── */}
        <Col xs={24} lg={8} style={{ marginBottom: 24 }}>
          {/* بطاقة المعلومات الشخصية */}
          <Card
            bordered={false}
            style={{
              borderRadius: 16,
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
              marginBottom: 16,
            }}
          >
            {/* صورة + اسم */}
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <Avatar
                size={72}
                icon={<UserOutlined />}
                style={{ background: "#e07b1a", marginBottom: 12 }}
              />
              <Title level={4} style={{ margin: 0 }}>
                {customer.name || "—"}
              </Title>
              <div style={{ marginTop: 6 }}>
                {customer.is_active ? (
                  <Tag color="success">نشط</Tag>
                ) : (
                  <Tag color="error">موقوف</Tag>
                )}
                {customer.is_phone_verified ? (
                  <Tag icon={<CheckCircleOutlined />} color="blue">
                    رقم محقق
                  </Tag>
                ) : (
                  <Tag icon={<CloseCircleOutlined />} color="default">
                    غير محقق
                  </Tag>
                )}
              </div>
            </div>

            <Divider style={{ margin: "12px 0" }} />

            {/* تفاصيل التواصل */}
            <Space direction="vertical" style={{ width: "100%" }} size={10}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <PhoneOutlined style={{ color: "#e07b1a" }} />
                <Text style={{ fontFamily: "monospace" }}>
                  {customer.phone_number}
                </Text>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <MailOutlined style={{ color: "#e07b1a" }} />
                <Text>{customer.email || "—"}</Text>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CalendarOutlined style={{ color: "#e07b1a" }} />
                <Text>
                  انضم في{" "}
                  {new Date(customer.created_at).toLocaleDateString("ar-SA")}
                </Text>
              </div>
              {customer.last_login && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <ClockCircleOutlined style={{ color: "#888" }} />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    آخر دخول:{" "}
                    {new Date(customer.last_login).toLocaleString("ar-SA")}
                  </Text>
                </div>
              )}
            </Space>

            {/* زر التعطيل */}
            {customer.is_active && (
              <>
                <Divider style={{ margin: "16px 0" }} />
                <Popconfirm
                  title="تعطيل الحساب؟"
                  description="سيتم إيقاف حساب العميل."
                  onConfirm={handleDeactivate}
                  okText="تعطيل"
                  cancelText="تراجع"
                  okButtonProps={{ danger: true }}
                >
                  <Button
                    danger
                    icon={<StopOutlined />}
                    block
                    style={{ borderRadius: 8 }}
                  >
                    تعطيل الحساب
                  </Button>
                </Popconfirm>
              </>
            )}
          </Card>

          {/* ── إحصاءات الحجوزات ── */}
          <Card
            bordered={false}
            title={<span style={{ fontWeight: 700 }}>ملخص الحجوزات</span>}
            style={{
              borderRadius: 16,
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
              marginBottom: 16,
            }}
          >
            <Row gutter={8}>
              {[
                { label: "إجمالي", value: bCounts.total, color: "#e07b1a" },
                { label: "مكتملة", value: bCounts.completed, color: "#52c41a" },
                {
                  label: "قيد الانتظار",
                  value: bCounts.pending,
                  color: "#fa8c16",
                },
                { label: "ملغاة", value: bCounts.cancelled, color: "#ff4d4f" },
              ].map((s, i) => (
                <Col span={12} key={i} style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      textAlign: "center",
                      padding: "10px 8px",
                      borderRadius: 10,
                      background: "#fafafa",
                      border: "1px solid #f0f0f0",
                    }}
                  >
                    <div
                      style={{ fontSize: 22, fontWeight: 700, color: s.color }}
                    >
                      {s.value}
                    </div>
                    <div style={{ fontSize: 11, color: "#888" }}>{s.label}</div>
                  </div>
                </Col>
              ))}
            </Row>
            <Divider style={{ margin: "8px 0 12px" }} />
            <div style={{ textAlign: "center" }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                إجمالي الإنفاق (مكتملة)
              </Text>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#52c41a",
                  marginTop: 4,
                }}
              >
                {totalSpent.toFixed(2)} ر.س
              </div>
            </div>
          </Card>

          {/* ── العناوين ── */}
          <Card
            bordered={false}
            title={
              <Space>
                <EnvironmentOutlined style={{ color: "#e07b1a" }} />
                <span style={{ fontWeight: 700 }}>العناوين</span>
                <Badge
                  count={customer.addresses?.length ?? 0}
                  style={{ background: "#0f1f1a" }}
                />
              </Space>
            }
            style={{
              borderRadius: 16,
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            }}
          >
            {customer.addresses?.length ? (
              <Space direction="vertical" style={{ width: "100%" }} size={10}>
                {customer.addresses.map((addr) => (
                  <div
                    key={addr.id}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 10,
                      background: "#fafafa",
                      border: "1px solid #f0f0f0",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 4,
                      }}
                    >
                      <Text strong style={{ fontSize: 13 }}>
                        {addr.label || "عنوان"}
                      </Text>
                      {addr.is_default && (
                        <Tag color="gold" style={{ fontSize: 11 }}>
                          افتراضي
                        </Tag>
                      )}
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {[addr.city, addr.district, addr.street]
                        .filter(Boolean)
                        .join("، ")}
                    </Text>
                    {(addr.building_no ||
                      addr.floor_no ||
                      addr.apartment_no) && (
                      <div
                        style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}
                      >
                        {addr.building_no && `مبنى ${addr.building_no}`}
                        {addr.floor_no && ` · طابق ${addr.floor_no}`}
                        {addr.apartment_no && ` · شقة ${addr.apartment_no}`}
                      </div>
                    )}
                  </div>
                ))}
              </Space>
            ) : (
              <Empty
                description="لا توجد عناوين"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </Card>
        </Col>

        {/* ── عمود يمين: الحجوزات ── */}
        <Col xs={24} lg={16}>
          <Card
            bordered={false}
            title={
              <Space>
                <CalendarOutlined style={{ color: "#e07b1a" }} />
                <span style={{ fontWeight: 700 }}>سجل الحجوزات</span>
              </Space>
            }
            style={{
              borderRadius: 16,
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            }}
            bodyStyle={{ padding: 0 }}
          >
            <Table
              columns={bookingColumns}
              dataSource={bookings}
              loading={bLoading}
              rowKey="id"
              scroll={{ x: 700 }}
              pagination={{
                pageSize: 8,
                showSizeChanger: false,
                showTotal: (t) => `${t} حجز`,
              }}
              locale={{
                emptyText: (
                  <Empty
                    description="لا توجد حجوزات"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                ),
              }}
              style={{ padding: "0 8px" }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
