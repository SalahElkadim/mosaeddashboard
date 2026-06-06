import { useState, useEffect, useCallback } from "react";
import {
  Table,
  Tag,
  Button,
  Space,
  Input,
  Select,
  Avatar,
  Popconfirm,
  message,
  Card,
  Row,
  Col,
  Statistic,
  Tooltip,
  Modal,
  Form,
  Divider,
} from "antd";
import {
  SearchOutlined,
  CheckCircleOutlined,
  StopOutlined,
  UnlockOutlined,
  EyeOutlined,
  UserOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  CheckOutlined,
  PlusOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

const { Search } = Input;
const { Option } = Select;

const STATUS_MAP = {
  active: { color: "success", label: "نشط" },
  blocked: { color: "error", label: "محظور" },
  pending: { color: "warning", label: "قيد المراجعة" },
};

const primaryAddress = (addresses = []) =>
  addresses.find((a) => a.is_default) ?? addresses[0] ?? null;

export default function Providers() {
  const navigate = useNavigate();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("active");
  const [searchText, setSearchText] = useState("");
  const [stats, setStats] = useState({ active: 0, blocked: 0, pending: 0 });
  const [actionLoading, setActionLoading] = useState({});

  // ── Specializations ──
  const [specializations, setSpecializations] = useState([]);

  // ── Add Provider Modal ──
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [form] = Form.useForm();

  // ─────────────────────────────────────────────
  // Data fetching
  // ─────────────────────────────────────────────
  const fetchSpecializations = async () => {
    try {
      const res = await api.get("/accounts/specializations/");
      const data = Array.isArray(res.data) ? res.data : res.data.results ?? [];
      setSpecializations(data.filter((s) => s.is_active));
    } catch {}
  };

  const fetchProviders = useCallback(
    async (status = statusFilter) => {
      setLoading(true);
      try {
        const res = await api.get(
          `/accounts/admin/providers/?status=${status}`
        );
        const data = Array.isArray(res.data)
          ? res.data
          : res.data.results ?? [];
        setProviders(data);
      } catch {
        message.error("فشل تحميل مزودي الخدمة");
      } finally {
        setLoading(false);
      }
    },
    [statusFilter]
  );

  const fetchStats = async () => {
    try {
      const [a, b, p] = await Promise.allSettled([
        api.get("/accounts/admin/providers/?status=active"),
        api.get("/accounts/admin/providers/?status=blocked"),
        api.get("/accounts/admin/providers/?status=pending"),
      ]);
      const count = (r) => {
        if (r.status !== "fulfilled") return 0;
        const d = r.value.data;
        return (
          d.count ?? (Array.isArray(d) ? d.length : d.results?.length ?? 0)
        );
      };
      setStats({ active: count(a), blocked: count(b), pending: count(p) });
    } catch {}
  };

  useEffect(() => {
    fetchProviders(statusFilter);
    fetchStats();
    fetchSpecializations();
  }, [statusFilter]);

  // ─────────────────────────────────────────────
  // Actions
  // ─────────────────────────────────────────────
  const handleAction = async (id, action) => {
    setActionLoading((prev) => ({ ...prev, [`${id}_${action}`]: true }));
    try {
      if (action === "approve") {
        await api.post(`/accounts/admin/providers/${id}/approve/`);
        message.success("تم قبول مزود الخدمة");
      } else if (action === "block") {
        await api.post(`/accounts/admin/providers/${id}/block/`);
        message.success("تم حظر مزود الخدمة");
      } else if (action === "unblock") {
        await api.delete(`/accounts/admin/providers/${id}/block/`);
        message.success("تم رفع الحظر عن مزود الخدمة");
      }
      fetchProviders(statusFilter);
      fetchStats();
    } catch {
      message.error("حدث خطأ، حاول مرة أخرى");
    } finally {
      setActionLoading((prev) => ({ ...prev, [`${id}_${action}`]: false }));
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/accounts/admin/providers/${id}/`);
      message.success("تم حذف مزود الخدمة نهائياً");
      fetchProviders(statusFilter);
      fetchStats();
    } catch {
      message.error("حدث خطأ أثناء الحذف");
    }
  };

  // ─────────────────────────────────────────────
  // Add Provider — بيانات أساسية فقط، بدون عنوان
  // ─────────────────────────────────────────────
  const resetAddModal = () => {
    form.resetFields();
  };

  const handleAddProvider = async (values) => {
    setAddLoading(true);
    try {
      const registerPayload = {
        name: values.name,
        phone_number: values.phone_number,
        email: values.email || undefined,
        specialization: values.specialization,
        national_id: values.national_id || undefined,
        commercial_registration: values.commercial_registration || undefined,
      };

      await api.post("/accounts/provider/register/", registerPayload);

      message.success(
        "تم إضافة مزود الخدمة بنجاح. يمكنك إضافة العنوان من صفحة التفاصيل."
      );
      resetAddModal();
      setAddModalOpen(false);
      setStatusFilter("pending");
      fetchStats();
    } catch (err) {
      const data = err?.response?.data;
      if (data && typeof data === "object") {
        const firstMsg = Object.values(data).flat()[0];
        message.error(firstMsg || "حدث خطأ أثناء الإضافة");
      } else {
        message.error("حدث خطأ أثناء الإضافة");
      }
    } finally {
      setAddLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // Table
  // ─────────────────────────────────────────────
  const filtered = providers.filter((p) => {
    const name = p.name ?? p.user?.name ?? "";
    const phone = p.phone_number ?? p.user?.phone_number ?? "";
    const q = searchText.toLowerCase();
    return name.toLowerCase().includes(q) || phone.includes(q);
  });

  const columns = [
    {
      title: "مزود الخدمة",
      key: "name",
      render: (_, r) => (
        <Space>
          <Avatar
            size={40}
            icon={<UserOutlined />}
            style={{ background: "#e07b1a", flexShrink: 0 }}
          />
          <div>
            <div style={{ fontWeight: 600, color: "#1a1a2e" }}>
              {r.name ?? r.user?.name ?? "—"}
            </div>
            <div style={{ fontSize: 12, color: "#888" }}>
              {r.phone_number ?? r.user?.phone_number ?? "—"}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: "التخصص",
      dataIndex: "specialization",
      key: "specialization",
      render: (v) =>
        v ? (
          <Tag color="orange" style={{ borderRadius: 6 }}>
            {v.name ?? v}
          </Tag>
        ) : (
          "—"
        ),
    },
    {
      title: "المدينة",
      key: "city",
      render: (_, r) => {
        const addr = primaryAddress(r.addresses);
        return addr?.city_name ?? "—";
      },
    },
    {
      title: "المنطقة",
      key: "region",
      render: (_, r) => {
        const addr = primaryAddress(r.addresses);
        return addr?.region_name ?? "—";
      },
    },
    {
      title: "الحالة",
      key: "status",
      render: (_, r) => {
        const st =
          r.status ??
          (r.is_blocked ? "blocked" : r.is_approved ? "active" : "pending");
        const cfg = STATUS_MAP[st] ?? { color: "default", label: st };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: "الإجراءات",
      key: "actions",
      fixed: "left",
      render: (_, r) => {
        const st =
          r.status ??
          (r.is_blocked ? "blocked" : r.is_approved ? "active" : "pending");
        return (
          <Space size="small">
            <Tooltip title="عرض التفاصيل">
              <Button
                type="text"
                icon={<EyeOutlined />}
                onClick={() => navigate(`/providers/${r.id}`)}
                style={{ color: "#1677ff" }}
              />
            </Tooltip>

            {st === "pending" && (
              <Popconfirm
                title="قبول مزود الخدمة؟"
                onConfirm={() => handleAction(r.id, "approve")}
                okText="نعم"
                cancelText="لا"
              >
                <Tooltip title="قبول">
                  <Button
                    type="text"
                    icon={<CheckCircleOutlined />}
                    loading={actionLoading[`${r.id}_approve`]}
                    style={{ color: "#52c41a" }}
                  />
                </Tooltip>
              </Popconfirm>
            )}

            {st === "active" && (
              <Popconfirm
                title="حظر مزود الخدمة؟"
                onConfirm={() => handleAction(r.id, "block")}
                okText="نعم"
                cancelText="لا"
              >
                <Tooltip title="حظر">
                  <Button
                    type="text"
                    icon={<StopOutlined />}
                    loading={actionLoading[`${r.id}_block`]}
                    style={{ color: "#ff4d4f" }}
                  />
                </Tooltip>
              </Popconfirm>
            )}

            {st === "blocked" && (
              <Popconfirm
                title="رفع الحظر عن مزود الخدمة؟"
                onConfirm={() => handleAction(r.id, "unblock")}
                okText="نعم"
                cancelText="لا"
              >
                <Tooltip title="رفع الحظر">
                  <Button
                    type="text"
                    icon={<UnlockOutlined />}
                    loading={actionLoading[`${r.id}_unblock`]}
                    style={{ color: "#faad14" }}
                  />
                </Tooltip>
              </Popconfirm>
            )}

            <Popconfirm
              title={
                <span>
                  حذف مزود الخدمة نهائياً؟
                  <br />
                  <span style={{ color: "#ff4d4f", fontSize: 12 }}>
                    لا يمكن التراجع عن هذا الإجراء
                  </span>
                </span>
              }
              onConfirm={() => handleDelete(r.id)}
              okText="حذف"
              cancelText="إلغاء"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="حذف نهائي">
                <Button
                  type="text"
                  icon={<DeleteOutlined />}
                  style={{ color: "#ff4d4f" }}
                />
              </Tooltip>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "'Cairo', sans-serif" }}>
      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {[
          {
            title: "النشطون",
            value: stats.active,
            icon: <CheckOutlined />,
            color: "#52c41a",
            bg: "#f6ffed",
            key: "active",
          },
          {
            title: "قيد المراجعة",
            value: stats.pending,
            icon: <ClockCircleOutlined />,
            color: "#faad14",
            bg: "#fffbe6",
            key: "pending",
          },
          {
            title: "المحظورون",
            value: stats.blocked,
            icon: <StopOutlined />,
            color: "#ff4d4f",
            bg: "#fff2f0",
            key: "blocked",
          },
          {
            title: "الإجمالي",
            value: stats.active + stats.pending + stats.blocked,
            icon: <TeamOutlined />,
            color: "#e07b1a",
            bg: "#fff7e6",
            key: "total",
          },
        ].map((s) => (
          <Col xs={12} sm={6} key={s.key}>
            <Card
              bordered={false}
              style={{
                borderRadius: 12,
                background: s.bg,
                cursor: s.key !== "total" ? "pointer" : "default",
                border:
                  statusFilter === s.key
                    ? `2px solid ${s.color}`
                    : "2px solid transparent",
                transition: "all 0.2s",
              }}
              onClick={() => s.key !== "total" && setStatusFilter(s.key)}
              bodyStyle={{ padding: "16px 20px" }}
            >
              <Statistic
                title={
                  <span style={{ color: "#666", fontSize: 13 }}>{s.title}</span>
                }
                value={s.value}
                valueStyle={{ color: s.color, fontWeight: 700, fontSize: 28 }}
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
            مزودو الخدمة
          </h2>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Search
              placeholder="بحث بالاسم أو الهاتف..."
              allowClear
              style={{ width: 220 }}
              prefix={<SearchOutlined style={{ color: "#bbb" }} />}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Select
              value={statusFilter}
              style={{ width: 150 }}
              onChange={(v) => setStatusFilter(v)}
            >
              <Option value="active">النشطون</Option>
              <Option value="pending">قيد المراجعة</Option>
              <Option value="blocked">المحظورون</Option>
            </Select>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setAddModalOpen(true)}
              style={{ background: "#e07b1a", borderColor: "#e07b1a" }}
            >
              إضافة مزود
            </Button>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={filtered}
          loading={loading}
          rowKey="id"
          scroll={{ x: 800 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total) => `${total} مزود`,
          }}
          style={{ padding: "0 8px" }}
          rowClassName={(_, i) => (i % 2 === 0 ? "row-even" : "")}
        />
      </Card>

      {/* ══════════════════════════════════════════
          Modal: Add Provider — بيانات أساسية فقط
      ══════════════════════════════════════════ */}
      <Modal
        title={
          <span style={{ fontFamily: "'Cairo', sans-serif", fontWeight: 700 }}>
            إضافة مزود خدمة جديد
          </span>
        }
        open={addModalOpen}
        onCancel={() => {
          setAddModalOpen(false);
          resetAddModal();
        }}
        footer={null}
        width={580}
        style={{ fontFamily: "'Cairo', sans-serif" }}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddProvider}
          style={{ marginTop: 8 }}
        >
          <Divider
            orientation="right"
            orientationMargin={0}
            style={{ color: "#888", fontSize: 13 }}
          >
            البيانات الأساسية
          </Divider>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="الاسم"
                name="name"
                rules={[{ required: true, message: "أدخل الاسم" }]}
              >
                <Input placeholder="اسم مزود الخدمة" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="رقم الهاتف"
                name="phone_number"
                rules={[{ required: true, message: "أدخل رقم الهاتف" }]}
              >
                <Input placeholder="05xxxxxxxx" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="البريد الإلكتروني"
                name="email"
                rules={[{ type: "email", message: "بريد إلكتروني غير صحيح" }]}
              >
                <Input placeholder="example@email.com" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="التخصص"
                name="specialization"
                rules={[{ required: true, message: "اختر التخصص" }]}
              >
                <Select
                  placeholder="اختر التخصص"
                  showSearch
                  optionFilterProp="children"
                  notFoundContent="لا توجد تخصصات متاحة"
                >
                  {specializations.map((s) => (
                    <Option key={s.id} value={s.id}>
                      {s.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="رقم الهوية الوطنية" name="national_id">
                <Input placeholder="1234567890" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="السجل التجاري (اختياري)"
                name="commercial_registration"
              >
                <Input placeholder="اتركه فارغاً إن لم يكن متاحاً" />
              </Form.Item>
            </Col>
          </Row>

          {/* ملاحظة للمستخدم */}
          <div
            style={{
              background: "#fff7e6",
              border: "1px solid #ffd591",
              borderRadius: 8,
              padding: "10px 14px",
              marginBottom: 16,
              fontSize: 13,
              color: "#874d00",
            }}
          >
            💡 يمكنك إضافة العنوان وصورة العقد بعد الإنشاء من صفحة تفاصيل مزود
            الخدمة.
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 4,
            }}
          >
            <Button
              onClick={() => {
                setAddModalOpen(false);
                resetAddModal();
              }}
            >
              إلغاء
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={addLoading}
              style={{ background: "#e07b1a", borderColor: "#e07b1a" }}
            >
              إضافة
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
