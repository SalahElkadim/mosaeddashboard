import { useEffect, useState, useCallback } from "react";
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Tag,
  Spin,
  Typography,
  Button,
  Space,
  Popconfirm,
  message,
  Badge,
  Select,
  Empty,
  Avatar,
  Modal,
  Form,
  Input,
  Divider,
  Tooltip,
} from "antd";
import {
  TeamOutlined,
  AppstoreOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  StopOutlined,
  UserAddOutlined,
  ReloadOutlined,
  UserOutlined,
  DollarOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
  SettingOutlined,
  EditOutlined,
} from "@ant-design/icons";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import api from "../../api/axios";

const { Title, Text } = Typography;

// ── Booking status ───────────────────────────────────────────────────────────
const STATUS_COLOR = {
  pending: "#fa8c16",
  confirmed: "#1677ff",
  completed: "#52c41a",
  cancelled: "#ff4d4f",
};
const STATUS_LABEL = {
  pending: "قيد الانتظار",
  confirmed: "مؤكد",
  completed: "مكتمل",
  cancelled: "ملغي",
};
const PIE_COLORS = ["#fa8c16", "#1677ff", "#52c41a", "#ff4d4f"];

// ── Custom Request status ────────────────────────────────────────────────────
const CR_STATUS_COLOR = {
  published: "#1677ff",
  offers_received: "#722ed1",
  accepted: "#13c2c2",
  in_progress: "#fa8c16",
  completed: "#52c41a",
  cancelled: "#ff4d4f",
  expired: "#8c8c8c",
};
const CR_STATUS_LABEL = {
  published: "منشور",
  offers_received: "وصلت عروض",
  accepted: "تم القبول",
  in_progress: "جارٍ",
  completed: "مكتمل",
  cancelled: "ملغي",
  expired: "منتهي",
};

// الانتقالات المسموحة (مطابقة للـ serializer)
const CR_VALID_TRANSITIONS = {
  published: ["cancelled", "expired"],
  offers_received: ["cancelled", "expired"],
  accepted: ["in_progress", "cancelled"],
  in_progress: ["completed"],
  completed: [],
  cancelled: [],
  expired: [],
};

// ─────────────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  // existing state
  const [bookings, setBookings] = useState([]);
  const [providers, setProviders] = useState([]);
  const [pendingProviders, setPendingProviders] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(null);

  // custom requests
  const [customRequests, setCustomRequests] = useState([]);
  const [crStatusFilter, setCrStatusFilter] = useState("all");
  const [crLoading, setCrLoading] = useState(false);
  const [crStatusUpdating, setCrStatusUpdating] = useState(null);

  // platform settings
  const [platformSettings, setPlatformSettings] = useState([]);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [editSettingModal, setEditSettingModal] = useState(false);
  const [editingSetting, setEditingSetting] = useState(null);
  const [settingForm] = Form.useForm();
  const [settingSaving, setSettingSaving] = useState(false);

  // ── Fetchers ─────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [b, p, pp, s] = await Promise.all([
        api.get("/existedservices/admin/bookings/"),
        api.get("/accounts/admin/providers/"),
        api.get("/accounts/admin/providers/?status=pending"),
        api.get("/existedservices/admin/existed/"),
      ]);
      setBookings(Array.isArray(b.data) ? b.data : b.data.results ?? []);
      setProviders(Array.isArray(p.data) ? p.data : p.data.results ?? []);
      setPendingProviders(
        Array.isArray(pp.data) ? pp.data : pp.data.results ?? []
      );
      setServices(Array.isArray(s.data) ? s.data : s.data.results ?? []);
    } catch {
      message.error("حدث خطأ أثناء جلب البيانات");
    }
    setLoading(false);
  }, []);

  const fetchCustomRequests = useCallback(async (statusFilter = "all") => {
    setCrLoading(true);
    try {
      const url =
        statusFilter === "all"
          ? "/custom_services/admin/custom-requests/"
          : `/custom_services/admin/custom-requests/?status=${statusFilter}`;
      const res = await api.get(url);
      setCustomRequests(
        Array.isArray(res.data) ? res.data : res.data.results ?? []
      );
    } catch {
      message.error("فشل تحميل الطلبات المخصصة");
    }
    setCrLoading(false);
  }, []);

  const fetchPlatformSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const res = await api.get("/custom_services/admin/platform-settings/");
      setPlatformSettings(
        Array.isArray(res.data) ? res.data : res.data.results ?? []
      );
    } catch {
      message.error("فشل تحميل إعدادات المنصة");
    }
    setSettingsLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    fetchCustomRequests("all");
    fetchPlatformSettings();
  }, [fetchAll, fetchCustomRequests, fetchPlatformSettings]);

  // ── Existing actions ──────────────────────────────────────────────────────
  const approveProvider = async (id) => {
    setLoadingAction(`approve_${id}`);
    try {
      await api.post(`/accounts/admin/providers/${id}/approve/`);
      message.success("تمت الموافقة على المزود");
      fetchAll();
    } catch {
      message.error("فشلت عملية الموافقة");
    }
    setLoadingAction(null);
  };

  const blockProvider = async (id) => {
    setLoadingAction(`block_${id}`);
    try {
      await api.post(`/accounts/admin/providers/${id}/block/`);
      message.success("تم حظر المزود");
      fetchAll();
    } catch {
      message.error("فشلت عملية الحظر");
    }
    setLoadingAction(null);
  };

  const updateBookingStatus = async (id, status) => {
    try {
      await api.post(`/existedservices/admin/bookings/${id}/status/`, {
        status,
      });
      message.success("تم تحديث حالة الحجز");
      fetchAll();
    } catch {
      message.error("فشل تحديث الحالة");
    }
  };

  // ── Custom Request: update status ─────────────────────────────────────────
  const updateCrStatus = async (id, newStatus) => {
    setCrStatusUpdating(id);
    try {
      await api.patch(`/custom_services/admin/custom-requests/${id}/status/`, {
        status: newStatus,
      });
      message.success("تم تحديث حالة الطلب");
      fetchCustomRequests(crStatusFilter);
    } catch (err) {
      const msg =
        err?.response?.data?.status?.[0] ||
        err?.response?.data?.non_field_errors?.[0] ||
        "فشل تحديث الحالة";
      message.error(msg);
    }
    setCrStatusUpdating(null);
  };

  // ── Platform Settings ─────────────────────────────────────────────────────
  const openEditSetting = (setting) => {
    setEditingSetting(setting);
    settingForm.setFieldsValue({ value: setting.value });
    setEditSettingModal(true);
  };

  const saveSetting = async () => {
    try {
      const values = await settingForm.validateFields();
      setSettingSaving(true);
      await api.patch("/custom_services/admin/platform-settings/", {
        key: editingSetting.key,
        value: values.value,
      });
      message.success("تم تحديث الإعداد بنجاح");
      setEditSettingModal(false);
      fetchPlatformSettings();
    } catch (e) {
      if (e?.errorFields) return;
      message.error("فشل حفظ الإعداد");
    } finally {
      setSettingSaving(false);
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const totalRevenue = bookings
    .filter((b) => b.status === "completed")
    .reduce((sum, b) => sum + parseFloat(b.total_cost ?? 0), 0);

  const crStats = Object.keys(CR_STATUS_LABEL).reduce((acc, s) => {
    acc[s] = customRequests.filter((r) => r.status === s).length;
    return acc;
  }, {});

  const stats = [
    {
      title: "مزودو الخدمة",
      value: providers.length,
      icon: <TeamOutlined />,
      color: "#1677ff",
      bg: "#e8f0fe",
      suffix: "مزود",
    },
    {
      title: "الخدمات النشطة",
      value: services.filter((s) => s.is_active !== false).length,
      icon: <AppstoreOutlined />,
      color: "#52c41a",
      bg: "#e8f8e8",
      suffix: "خدمة",
    },
    {
      title: "إجمالي الحجوزات",
      value: bookings.length,
      icon: <CalendarOutlined />,
      color: "#e07b1a",
      bg: "#fef0e0",
      suffix: "حجز",
    },
    {
      title: "حجوزات معلقة",
      value: bookings.filter((b) => b.status === "pending").length,
      icon: <ClockCircleOutlined />,
      color: "#fa541c",
      bg: "#fff2e8",
      suffix: "بانتظار",
    },
    {
      title: "الإيرادات المكتملة",
      value: totalRevenue.toLocaleString("ar-SA"),
      icon: <DollarOutlined />,
      color: "#52c41a",
      bg: "#e8f8e8",
      suffix: "ر.س",
    },
    {
      title: "مزودون جدد",
      value: pendingProviders.length,
      icon: <UserAddOutlined />,
      color: "#722ed1",
      bg: "#f9f0ff",
      suffix: "بانتظار الموافقة",
    },
  ];

  const statusCounts = ["pending", "confirmed", "completed", "cancelled"].map(
    (s) => ({
      name: STATUS_LABEL[s],
      value: bookings.filter((b) => b.status === s).length,
    })
  );

  const serviceTitles = [
    ...new Set(bookings.map((b) => b.service_title).filter(Boolean)),
  ];
  const serviceBookingData = serviceTitles.slice(0, 6).map((title) => ({
    name: title.length > 12 ? title.slice(0, 12) + "…" : title,
    حجوزات: bookings.filter((b) => b.service_title === title).length,
  }));

  // ── Helper: is percentage key ─────────────────────────────────────────────
  const isPctKey = (key = "") =>
    ["fee", "rate", "percent", "commission"].some((w) =>
      String(key).toLowerCase().includes(w)
    );

  // ── Columns ───────────────────────────────────────────────────────────────
  const bookingColumns = [
    {
      title: "#",
      dataIndex: "id",
      key: "id",
      width: 80,
      render: (id) => (
        <Text style={{ fontSize: 12, color: "#999", fontFamily: "monospace" }}>
          #{String(id).slice(0, 6)}
        </Text>
      ),
    },
    {
      title: "العميل",
      key: "customer",
      render: (_, r) => (
        <Space>
          <Avatar
            size={28}
            icon={<UserOutlined />}
            style={{ background: "#e07b1a", flexShrink: 0 }}
          />
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.3 }}>
              {r.customer_name || "—"}
            </div>
            {r.customer_phone && (
              <Text
                type="secondary"
                style={{ fontSize: 11, direction: "ltr", display: "block" }}
              >
                {r.customer_phone}
              </Text>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: "الخدمة",
      key: "service",
      render: (_, r) => (
        <Tag color="orange" style={{ borderRadius: 6 }}>
          {r.service_title || "—"}
        </Tag>
      ),
    },
    {
      title: "المزود",
      key: "provider",
      render: (_, r) => (
        <div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>
            {r.provider_name || "—"}
          </div>
          {r.provider_phone && (
            <Text
              type="secondary"
              style={{ fontSize: 11, direction: "ltr", display: "block" }}
            >
              {r.provider_phone}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: "التكلفة",
      key: "cost",
      render: (_, r) => (
        <Text style={{ color: "#52c41a", fontWeight: 600 }}>
          {r.total_cost
            ? `${parseFloat(r.total_cost).toLocaleString("ar-SA")} ر.س`
            : "—"}
        </Text>
      ),
    },
    {
      title: "الموعد",
      dataIndex: "scheduled_date",
      key: "date",
      render: (d) => (d ? new Date(d).toLocaleDateString("ar-SA") : "—"),
    },
    {
      title: "الحالة",
      dataIndex: "status",
      key: "status",
      render: (s, record) => (
        <Select
          value={s}
          size="small"
          style={{ width: 135, fontFamily: "'Cairo', sans-serif" }}
          onChange={(val) => updateBookingStatus(record.id, val)}
        >
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <Select.Option key={k} value={k}>
              <Tag
                color={STATUS_COLOR[k]}
                style={{ margin: 0, borderRadius: 20 }}
              >
                {v}
              </Tag>
            </Select.Option>
          ))}
        </Select>
      ),
    },
  ];

  const pendingProviderColumns = [
    {
      title: "الاسم",
      dataIndex: "name",
      key: "name",
      render: (n) => <Text strong>{n || "—"}</Text>,
    },
    {
      title: "التخصص",
      dataIndex: "specialization",
      key: "specialization",
      render: (s) => s?.name ?? s ?? "—",
    },
    {
      title: "المدينة",
      dataIndex: "city",
      key: "city",
      render: (c) => c || "—",
    },
    {
      title: "الهاتف",
      dataIndex: "phone_number",
      key: "phone",
      render: (p) => (
        <Text style={{ direction: "ltr", display: "inline-block" }}>
          {p || "—"}
        </Text>
      ),
    },
    {
      title: "إجراء",
      key: "action",
      render: (_, record) => (
        <Space size="small">
          <Popconfirm
            title="تأكيد الموافقة على هذا المزود؟"
            onConfirm={() => approveProvider(record.id)}
            okText="نعم"
            cancelText="لا"
          >
            <Button
              size="small"
              type="primary"
              icon={<CheckCircleOutlined />}
              loading={loadingAction === `approve_${record.id}`}
              style={{ background: "#52c41a", borderColor: "#52c41a" }}
            >
              موافقة
            </Button>
          </Popconfirm>
          <Popconfirm
            title="تأكيد حظر هذا المزود؟"
            onConfirm={() => blockProvider(record.id)}
            okText="نعم"
            cancelText="لا"
            okButtonProps={{ danger: true }}
          >
            <Button
              size="small"
              danger
              icon={<StopOutlined />}
              loading={loadingAction === `block_${record.id}`}
            >
              حظر
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const crColumns = [
    {
      title: "#",
      dataIndex: "id",
      key: "id",
      width: 70,
      render: (id) => (
        <Text style={{ fontSize: 11, color: "#999", fontFamily: "monospace" }}>
          #{String(id).slice(0, 6)}
        </Text>
      ),
    },
    {
      title: "العميل",
      key: "customer",
      render: (_, r) => (
        <Space>
          <Avatar
            size={28}
            icon={<UserOutlined />}
            style={{ background: "#722ed1", flexShrink: 0 }}
          />
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>
              {r.customer_name || "—"}
            </div>
            {r.customer_phone && (
              <Text
                type="secondary"
                style={{ fontSize: 11, direction: "ltr", display: "block" }}
              >
                {r.customer_phone}
              </Text>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: "العنوان",
      dataIndex: "title",
      key: "title",
      render: (t) => (
        <Text
          style={{ fontSize: 13, maxWidth: 160, display: "block" }}
          ellipsis={{ tooltip: t }}
        >
          {t || "—"}
        </Text>
      ),
    },
    {
      title: "التخصص",
      key: "specialization",
      render: (_, r) => {
        const name = r.specialization?.name ?? r.specialization_name ?? "—";
        return (
          <Tag color="purple" style={{ borderRadius: 6 }}>
            {name}
          </Tag>
        );
      },
    },
    {
      title: "الموعد",
      dataIndex: "scheduled_date",
      key: "date",
      render: (d) => (d ? new Date(d).toLocaleDateString("ar-SA") : "—"),
    },
    {
      title: "العروض",
      dataIndex: "offers_count",
      key: "offers",
      align: "center",
      render: (v) => (
        <Badge
          count={v ?? 0}
          showZero
          style={{ background: v > 0 ? "#722ed1" : "#d9d9d9" }}
        />
      ),
    },
    {
      title: "الحالة",
      dataIndex: "status",
      key: "status",
      render: (s, record) => {
        const allowed = CR_VALID_TRANSITIONS[s] ?? [];
        if (allowed.length === 0) {
          return (
            <Tag
              color={CR_STATUS_COLOR[s] ?? "default"}
              style={{ borderRadius: 20 }}
            >
              {CR_STATUS_LABEL[s] ?? s}
            </Tag>
          );
        }
        return (
          <Select
            value={s}
            size="small"
            style={{ width: 148, fontFamily: "'Cairo', sans-serif" }}
            loading={crStatusUpdating === record.id}
            onChange={(val) => updateCrStatus(record.id, val)}
          >
            <Select.Option value={s}>
              <Tag
                color={CR_STATUS_COLOR[s]}
                style={{ margin: 0, borderRadius: 20 }}
              >
                {CR_STATUS_LABEL[s]}
              </Tag>
            </Select.Option>
            {allowed.map((k) => (
              <Select.Option key={k} value={k}>
                <Tag
                  color={CR_STATUS_COLOR[k]}
                  style={{ margin: 0, borderRadius: 20 }}
                >
                  {CR_STATUS_LABEL[k]}
                </Tag>
              </Select.Option>
            ))}
          </Select>
        );
      },
    },
    {
      title: "الفني المقبول",
      key: "provider",
      render: (_, r) =>
        r.accepted_provider_name ? (
          <Text style={{ fontSize: 12 }}>{r.accepted_provider_name}</Text>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>
            لم يُقبل بعد
          </Text>
        ),
    },
  ];

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ textAlign: "center", paddingTop: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  const cardStyle = {
    borderRadius: 16,
    boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
  };
  const titleStyle = { fontFamily: "'Cairo', sans-serif", fontWeight: 700 };

  return (
    <div style={{ fontFamily: "'Cairo', sans-serif" }}>
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <Title level={4} style={{ margin: 0, color: "#1a2e25" }}>
          لوحة التحكم
        </Title>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => {
            fetchAll();
            fetchCustomRequests(crStatusFilter);
            fetchPlatformSettings();
          }}
          style={{ fontFamily: "'Cairo', sans-serif" }}
        >
          تحديث
        </Button>
      </div>

      {/* ── Stats Cards ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 28 }}>
        {stats.map((s) => (
          <Col xs={24} sm={12} lg={8} xl={4} key={s.title}>
            <Badge.Ribbon
              text={
                s.value > 0 && s.suffix === "بانتظار الموافقة"
                  ? `${s.value} جديد`
                  : null
              }
              color="purple"
              style={{
                display:
                  s.value > 0 && s.suffix === "بانتظار الموافقة"
                    ? "block"
                    : "none",
              }}
            >
              <Card
                bordered={false}
                style={cardStyle}
                bodyStyle={{ padding: "20px 24px" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <Statistic
                    title={
                      <span
                        style={{
                          fontSize: 12,
                          color: "#6b7c74",
                          fontFamily: "'Cairo', sans-serif",
                        }}
                      >
                        {s.title}
                      </span>
                    }
                    value={s.value}
                    suffix={<span style={{ fontSize: 12 }}>{s.suffix}</span>}
                    valueStyle={{
                      color: s.color,
                      fontWeight: 700,
                      fontSize: 24,
                    }}
                  />
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: s.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                      color: s.color,
                    }}
                  >
                    {s.icon}
                  </div>
                </div>
              </Card>
            </Badge.Ribbon>
          </Col>
        ))}
      </Row>

      {/* ── Charts ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={10}>
          <Card
            title={<span style={titleStyle}>توزيع حالات الحجوزات</span>}
            bordered={false}
            style={cardStyle}
          >
            {bookings.length === 0 ? (
              <Empty description="لا توجد حجوزات" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={statusCounts.filter((d) => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {statusCounts.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i]} stroke="none" />
                    ))}
                  </Pie>
                  <ReTooltip
                    contentStyle={{ fontFamily: "'Cairo', sans-serif" }}
                  />
                  <Legend
                    wrapperStyle={{
                      fontFamily: "'Cairo', sans-serif",
                      fontSize: 13,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>
        <Col xs={24} md={14}>
          <Card
            title={<span style={titleStyle}>الحجوزات حسب الخدمة</span>}
            bordered={false}
            style={cardStyle}
          >
            {serviceBookingData.length === 0 ? (
              <Empty description="لا توجد بيانات" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={serviceBookingData}
                  margin={{ top: 8, right: 8, left: -10, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontFamily: "'Cairo', sans-serif", fontSize: 11 }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontFamily: "'Cairo', sans-serif", fontSize: 11 }}
                  />
                  <ReTooltip
                    contentStyle={{ fontFamily: "'Cairo', sans-serif" }}
                  />
                  <Bar dataKey="حجوزات" fill="#e07b1a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>
      </Row>

      {/* ── Pending Providers ── */}
      {pendingProviders.length > 0 && (
        <Card
          title={
            <Space>
              <span style={titleStyle}>مزودون بانتظار الموافقة</span>
              <Tag color="purple">{pendingProviders.length}</Tag>
            </Space>
          }
          bordered={false}
          style={{
            ...cardStyle,
            marginBottom: 24,
            border: "1.5px solid #d3adf7",
          }}
          extra={
            <a
              href="/providers"
              style={{
                color: "#722ed1",
                fontSize: 13,
                fontFamily: "'Cairo', sans-serif",
              }}
            >
              عرض الكل
            </a>
          }
        >
          <Table
            dataSource={pendingProviders}
            columns={pendingProviderColumns}
            rowKey="id"
            pagination={false}
            size="middle"
            style={{ fontFamily: "'Cairo', sans-serif" }}
            locale={{ emptyText: "لا يوجد مزودون معلقون" }}
          />
        </Card>
      )}

      {/* ── Recent Bookings ── */}
      <Card
        title={<span style={titleStyle}>آخر الحجوزات</span>}
        bordered={false}
        style={{ ...cardStyle, marginBottom: 24 }}
        extra={
          <a
            href="/bookings"
            style={{
              color: "#e07b1a",
              fontFamily: "'Cairo', sans-serif",
              fontSize: 13,
            }}
          >
            عرض الكل
          </a>
        }
      >
        <Table
          dataSource={bookings.slice(0, 10)}
          columns={bookingColumns}
          rowKey="id"
          pagination={false}
          size="middle"
          scroll={{ x: 900 }}
          style={{ fontFamily: "'Cairo', sans-serif" }}
          locale={{ emptyText: "لا توجد حجوزات" }}
          rowClassName={(r) => (r.status === "pending" ? "row-pending" : "")}
        />
      </Card>

      {/* ════════════ CUSTOM REQUESTS SECTION ════════════ */}
      <Divider
        orientation="right"
        orientationMargin={0}
        style={{ borderColor: "#722ed1", marginBottom: 20 }}
      >
        <Space>
          <FileTextOutlined style={{ color: "#722ed1" }} />
          <span
            style={{
              fontFamily: "'Cairo', sans-serif",
              fontWeight: 700,
              color: "#722ed1",
            }}
          >
            الطلبات المخصصة
          </span>
        </Space>
      </Divider>

      {/* CR mini-stat cards */}
      <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
        {[
          { key: "published", label: "منشور", color: "#1677ff", bg: "#e6f4ff" },
          {
            key: "offers_received",
            label: "وصلت عروض",
            color: "#722ed1",
            bg: "#f9f0ff",
          },
          {
            key: "accepted",
            label: "تم القبول",
            color: "#13c2c2",
            bg: "#e6fffb",
          },
          {
            key: "in_progress",
            label: "جارٍ",
            color: "#fa8c16",
            bg: "#fff7e6",
          },
          { key: "completed", label: "مكتمل", color: "#52c41a", bg: "#f6ffed" },
          {
            key: "expired",
            label: "منتهي الصلاحية",
            color: "#8c8c8c",
            bg: "#f5f5f5",
          },
          { key: "cancelled", label: "ملغي", color: "#ff4d4f", bg: "#fff2f0" },
          { key: "all", label: "الإجمالي", color: "#e07b1a", bg: "#fff7ee" },
        ].map((s) => (
          <Col xs={12} sm={6} md={4} lg={3} key={s.key}>
            <Card
              bordered={false}
              onClick={() => {
                setCrStatusFilter(s.key);
                fetchCustomRequests(s.key);
              }}
              style={{
                borderRadius: 12,
                background: s.bg,
                cursor: "pointer",
                border:
                  crStatusFilter === s.key
                    ? `2px solid ${s.color}`
                    : "2px solid transparent",
                transition: "all .2s",
                textAlign: "center",
              }}
              bodyStyle={{ padding: "12px 8px" }}
            >
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>
                {s.key === "all" ? customRequests.length : crStats[s.key] ?? 0}
              </div>
              <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>
                {s.label}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* CR table */}
      <Card
        bordered={false}
        style={{ ...cardStyle, marginBottom: 24 }}
        bodyStyle={{ padding: 0 }}
      >
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid #f0f0f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <Space>
            <span style={{ ...titleStyle, fontSize: 15 }}>الطلبات المخصصة</span>
            {crStatusFilter !== "all" && (
              <Tag
                color={CR_STATUS_COLOR[crStatusFilter]}
                style={{ borderRadius: 20 }}
              >
                {CR_STATUS_LABEL[crStatusFilter]}
              </Tag>
            )}
            <Tag color="default">{customRequests.length} طلب</Tag>
          </Space>

          <Space wrap>
            <Select
              value={crStatusFilter}
              size="small"
              style={{ width: 155, fontFamily: "'Cairo', sans-serif" }}
              onChange={(v) => {
                setCrStatusFilter(v);
                fetchCustomRequests(v);
              }}
            >
              <Select.Option value="all">كل الطلبات</Select.Option>
              {Object.entries(CR_STATUS_LABEL).map(([k, v]) => (
                <Select.Option key={k} value={k}>
                  {v}
                </Select.Option>
              ))}
            </Select>

            <Button
              size="small"
              icon={<ExclamationCircleOutlined />}
              onClick={() => {
                setCrStatusFilter("expired");
                fetchCustomRequests("expired");
              }}
              style={{ borderColor: "#8c8c8c", color: "#8c8c8c" }}
            >
              المنتهية
            </Button>
          </Space>
        </div>

        <Table
          dataSource={customRequests.slice(0, 10)}
          columns={crColumns}
          rowKey="id"
          loading={crLoading}
          pagination={false}
          size="middle"
          scroll={{ x: 950 }}
          style={{ fontFamily: "'Cairo', sans-serif" }}
          locale={{ emptyText: "لا توجد طلبات" }}
          rowClassName={(r) => (r.status === "expired" ? "row-expired" : "")}
        />
      </Card>

      {/* ════════════ PLATFORM SETTINGS SECTION ════════════ */}
      <Divider
        orientation="right"
        orientationMargin={0}
        style={{ borderColor: "#e07b1a", marginBottom: 20 }}
      >
        <Space>
          <SettingOutlined style={{ color: "#e07b1a" }} />
          <span
            style={{
              fontFamily: "'Cairo', sans-serif",
              fontWeight: 700,
              color: "#e07b1a",
            }}
          >
            إعدادات المنصة
          </span>
        </Space>
      </Divider>

      <Card
        bordered={false}
        style={{ ...cardStyle, marginBottom: 8 }}
        loading={settingsLoading}
      >
        {platformSettings.length === 0 && !settingsLoading ? (
          <Empty
            description="لا توجد إعدادات"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Row gutter={[16, 16]}>
            {platformSettings.map((setting) => (
              <Col xs={24} sm={12} md={8} lg={6} key={setting.key}>
                <Card
                  size="small"
                  bordered={false}
                  style={{
                    background: "#fafafa",
                    borderRadius: 12,
                    border: "1px solid #f0f0f0",
                  }}
                  bodyStyle={{ padding: "14px 16px" }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <Text
                        type="secondary"
                        style={{
                          fontSize: 11,
                          display: "block",
                          marginBottom: 4,
                        }}
                      >
                        {setting.key}
                      </Text>
                      <Text
                        style={{
                          fontSize: 24,
                          fontWeight: 700,
                          color: "#e07b1a",
                        }}
                      >
                        {setting.value}
                        {isPctKey(setting.key) ? "%" : ""}
                      </Text>
                      {setting.updated_at && (
                        <Text
                          type="secondary"
                          style={{
                            fontSize: 10,
                            display: "block",
                            marginTop: 4,
                          }}
                        >
                          آخر تعديل:{" "}
                          {new Date(setting.updated_at).toLocaleDateString(
                            "ar-SA"
                          )}
                        </Text>
                      )}
                    </div>
                    <Tooltip title="تعديل">
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => openEditSetting(setting)}
                        style={{ color: "#e07b1a" }}
                      />
                    </Tooltip>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>

      {/* Edit Setting Modal */}
      <Modal
        title={
          <Space style={{ fontFamily: "'Cairo', sans-serif", fontWeight: 700 }}>
            <SettingOutlined style={{ color: "#e07b1a" }} />
            تعديل: {editingSetting?.key}
          </Space>
        }
        open={editSettingModal}
        onOk={saveSetting}
        onCancel={() => setEditSettingModal(false)}
        okText="حفظ"
        cancelText="إلغاء"
        confirmLoading={settingSaving}
        okButtonProps={{
          style: { background: "#e07b1a", borderColor: "#e07b1a" },
        }}
        style={{ direction: "rtl", fontFamily: "'Cairo', sans-serif" }}
        width={420}
      >
        <Form form={settingForm} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item
            name="value"
            label="القيمة الجديدة"
            rules={[{ required: true, message: "أدخل القيمة" }]}
          >
            <Input
              placeholder="أدخل القيمة الجديدة"
              addonAfter={isPctKey(editingSetting?.key) ? "%" : undefined}
            />
          </Form.Item>
          {editingSetting?.updated_at && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              آخر تعديل:{" "}
              {new Date(editingSetting.updated_at).toLocaleDateString("ar-SA")}
            </Text>
          )}
        </Form>
      </Modal>

      <style>{`
        .row-pending td { background: #fffbe6 !important; }
        .row-expired td { background: #f5f5f5 !important; color: #8c8c8c; }
      `}</style>
    </div>
  );
}
