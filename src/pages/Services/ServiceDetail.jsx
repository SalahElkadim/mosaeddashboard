import { useState, useEffect, useCallback } from "react";
import {
  Card,
  Tabs,
  Table,
  Button,
  Space,
  Tag,
  Switch,
  Popconfirm,
  message,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Avatar,
  Typography,
  Row,
  Col,
  Statistic,
  Rate,
  Tooltip,
  Skeleton,
  Empty,
  Badge,
  Image,
  Spin,
} from "antd";
import {
  ArrowRightOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  AppstoreOutlined,
  UserOutlined,
  StarOutlined,
  SettingOutlined,
  TeamOutlined,
  MessageOutlined,
  ClearOutlined,
  SafetyCertificateOutlined,
  CarOutlined,
  SwapOutlined,
  EyeOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";

const { Text, Title } = Typography;
const { Option } = Select;

const fmt = (v) => (v ? new Date(v).toLocaleDateString("ar-SA") : "—");
const fmtFull = (v) =>
  v
    ? new Date(v).toLocaleDateString("ar-SA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

const DURATION_LABELS = { day: "يوم", month: "شهر", year: "سنة" };

export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [service, setService] = useState(null);
  const [loadingService, setLoadingService] = useState(true);

  const [attributes, setAttributes] = useState([]);
  const [loadingAttr, setLoadingAttr] = useState(false);
  const [attrModal, setAttrModal] = useState(false);
  const [editingAttr, setEditingAttr] = useState(null);
  const [savingAttr, setSavingAttr] = useState(false);
  const [attrForm] = Form.useForm();

  const [providers, setProviders] = useState([]);
  const [loadingProv, setLoadingProv] = useState(false);
  const [assignModal, setAssignModal] = useState(false);
  const [assignForm] = Form.useForm();
  const [savingAssign, setSavingAssign] = useState(false);
  const [availableProviders, setAvailableProviders] = useState([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(null);
  const [loadingRev, setLoadingRev] = useState(false);

  const [warranty, setWarranty] = useState(null);
  const [loadingWarranty, setLoadingWarranty] = useState(false);
  const [warrantyModal, setWarrantyModal] = useState(false);
  const [savingWarranty, setSavingWarranty] = useState(false);
  const [warrantyForm] = Form.useForm();

  // ── Previous Works State (NEW) ──
  const [previousWorks, setPreviousWorks] = useState([]);
  const [loadingPrevWorks, setLoadingPrevWorks] = useState(false);
  const [previewWork, setPreviewWork] = useState(null); // { before_image, after_image, created_at }

  // ── Fetchers ──
  const fetchService = useCallback(async () => {
    setLoadingService(true);
    try {
      const res = await api.get(`/existedservices/admin/existed/${id}/`);
      setService(res.data);
    } catch {
      message.error("فشل تحميل بيانات الخدمة");
    } finally {
      setLoadingService(false);
    }
  }, [id]);

  const fetchAttributes = useCallback(async () => {
    setLoadingAttr(true);
    try {
      const res = await api.get(
        `/existedservices/admin/existed/${id}/attributes/`
      );
      setAttributes(
        Array.isArray(res.data) ? res.data : res.data.results ?? []
      );
    } catch {
      message.error("فشل تحميل الخصائص");
    } finally {
      setLoadingAttr(false);
    }
  }, [id]);

  const fetchProviders = useCallback(async () => {
    setLoadingProv(true);
    try {
      const res = await api.get(
        `/existedservices/admin/services/${id}/providers/`
      );
      setProviders(Array.isArray(res.data) ? res.data : res.data.results ?? []);
    } catch {
      message.error("فشل تحميل مقدمي الخدمة");
    } finally {
      setLoadingProv(false);
    }
  }, [id]);

  const fetchReviews = useCallback(async () => {
    setLoadingRev(true);
    try {
      const [revRes, ratingRes] = await Promise.all([
        api.get(`/existedservices/services/${id}/reviews/`),
        api.get(`/existedservices/services/${id}/rating/`),
      ]);
      setReviews(
        Array.isArray(revRes.data) ? revRes.data : revRes.data.results ?? []
      );
      setRating(ratingRes.data);
    } catch {
      message.error("فشل تحميل التقييمات");
    } finally {
      setLoadingRev(false);
    }
  }, [id]);

  const fetchWarranty = useCallback(async () => {
    setLoadingWarranty(true);
    try {
      const res = await api.get(
        `/existedservices/admin/services/${id}/warranty/`
      );
      setWarranty(res.data);
    } catch (err) {
      if (err?.response?.status === 404) setWarranty(null);
      else message.error("فشل تحميل بيانات الضمان");
    } finally {
      setLoadingWarranty(false);
    }
  }, [id]);

  // ── Fetch Previous Works (NEW) ──
  const fetchPreviousWorks = useCallback(async () => {
    setLoadingPrevWorks(true);
    try {
      const res = await api.get(
        `/existedservices/services/${id}/previous-works/`
      );
      setPreviousWorks(
        Array.isArray(res.data) ? res.data : res.data.results ?? []
      );
    } catch {
      message.error("فشل تحميل الأعمال السابقة");
    } finally {
      setLoadingPrevWorks(false);
    }
  }, [id]);

  useEffect(() => {
    fetchService();
    fetchAttributes();
    fetchProviders();
    fetchReviews();
    fetchWarranty();
    fetchPreviousWorks();
  }, [
    fetchService,
    fetchAttributes,
    fetchProviders,
    fetchReviews,
    fetchWarranty,
    fetchPreviousWorks,
  ]);

  // ── Attribute Handlers ──
  const openAttrModal = (attr = null) => {
    setEditingAttr(attr);
    if (attr) {
      attrForm.setFieldsValue({
        name: attr.name,
        details: attr.details,
        unit_cost: attr.unit_cost,
        unit_name: attr.unit_name,
        quantity_name: attr.quantity_name,
      });
    } else {
      attrForm.resetFields();
    }
    setAttrModal(true);
  };

  const handleSaveAttr = async () => {
    try {
      const values = await attrForm.validateFields();
      setSavingAttr(true);
      if (editingAttr) {
        await api.patch(
          `/existedservices/admin/existed/${id}/attributes/${editingAttr.id}/`,
          values
        );
        message.success("تم تحديث الخاصية");
      } else {
        await api.post(
          `/existedservices/admin/existed/${id}/attributes/`,
          values
        );
        message.success("تم إضافة الخاصية");
      }
      setAttrModal(false);
      fetchAttributes();
    } catch (e) {
      if (e?.errorFields) return;
      message.error("فشل الحفظ");
    } finally {
      setSavingAttr(false);
    }
  };

  const handleDeleteAttr = async (attrId) => {
    try {
      await api.delete(
        `/existedservices/admin/existed/${id}/attributes/${attrId}/`
      );
      message.success("تم حذف الخاصية");
      fetchAttributes();
    } catch {
      message.error("فشل الحذف");
    }
  };

  // ── Provider Handlers ──
  const openAssignModal = () => {
    fetchAvailableProviders();
    setAssignModal(true);
  };

  const fetchAvailableProviders = async () => {
    setLoadingAvailable(true);
    try {
      const res = await api.get(
        `/existedservices/admin/services/${id}/available-providers/`
      );
      setAvailableProviders(Array.isArray(res.data) ? res.data : []);
    } catch {
      message.error("فشل تحميل مزودي الخدمة المتاحين");
    } finally {
      setLoadingAvailable(false);
    }
  };

  const handleAssignProvider = async () => {
    try {
      const values = await assignForm.validateFields();
      setSavingAssign(true);
      await api.post(`/existedservices/admin/services/${id}/providers/`, {
        provider_id: values.provider_id,
      });
      message.success("تم تعيين مقدم الخدمة");
      setAssignModal(false);
      assignForm.resetFields();
      fetchProviders();
    } catch (e) {
      if (e?.errorFields) return;
      message.error("فشل التعيين");
    } finally {
      setSavingAssign(false);
    }
  };

  const handleToggleAvailability = async (spId, current) => {
    try {
      await api.patch(
        `/existedservices/admin/services/${id}/providers/${spId}/`,
        { is_available: !current }
      );
      message.success(current ? "تم إيقاف الإتاحة" : "تم تفعيل الإتاحة");
      fetchProviders();
    } catch {
      message.error("فشل تغيير الحالة");
    }
  };

  const handleRemoveProvider = async (spId) => {
    try {
      await api.delete(
        `/existedservices/admin/services/${id}/providers/${spId}/`
      );
      message.success("تم إزالة مقدم الخدمة");
      fetchProviders();
    } catch {
      message.error("فشل الإزالة");
    }
  };

  // ── Review Handlers ──
  const handleDeleteReview = async (reviewId) => {
    try {
      await api.delete(`/existedservices/reviews/${reviewId}/`);
      message.success("تم حذف التقييم");
      fetchReviews();
    } catch {
      message.error("فشل حذف التقييم");
    }
  };

  const handleClearAllReviews = async () => {
    try {
      await api.delete(`/existedservices/services/${id}/reviews/clear/`);
      message.success("تم مسح جميع التقييمات");
      fetchReviews();
    } catch {
      message.error("فشل مسح التقييمات");
    }
  };

  // ── Warranty Handlers ──
  const openWarrantyModal = () => {
    if (warranty) {
      warrantyForm.setFieldsValue({
        duration_value: warranty.duration_value,
        duration_type: warranty.duration_type,
        notes: warranty.notes,
      });
    } else {
      warrantyForm.resetFields();
      warrantyForm.setFieldsValue({ duration_type: "month" });
    }
    setWarrantyModal(true);
  };

  const handleSaveWarranty = async () => {
    try {
      const values = await warrantyForm.validateFields();
      setSavingWarranty(true);
      if (warranty) {
        await api.patch(
          `/existedservices/admin/services/${id}/warranty/`,
          values
        );
        message.success("تم تحديث الضمان");
      } else {
        await api.post(
          `/existedservices/admin/services/${id}/warranty/`,
          values
        );
        message.success("تم إضافة الضمان");
      }
      setWarrantyModal(false);
      fetchWarranty();
    } catch (e) {
      if (e?.errorFields) return;
      message.error("فشل حفظ الضمان");
    } finally {
      setSavingWarranty(false);
    }
  };

  const handleDeleteWarranty = async () => {
    try {
      await api.delete(`/existedservices/admin/services/${id}/warranty/`);
      message.success("تم حذف الضمان");
      setWarranty(null);
    } catch {
      message.error("فشل حذف الضمان");
    }
  };

  const handleToggleServiceActive = async () => {
    if (!service) return;
    try {
      await api.patch(`/existedservices/admin/existed/${id}/`, {
        is_active: !service.is_active,
      });
      message.success(
        service.is_active ? "تم تعطيل الخدمة" : "تم تفعيل الخدمة"
      );
      fetchService();
    } catch {
      message.error("فشل تغيير الحالة");
    }
  };

  // ── Table Columns ──
  const attrColumns = [
    {
      title: "اسم الخاصية",
      dataIndex: "name",
      key: "name",
      render: (v) => <span style={{ fontWeight: 600 }}>{v}</span>,
    },
    {
      title: "التفاصيل",
      dataIndex: "details",
      key: "details",
      render: (v) => (
        <Text type="secondary" style={{ fontSize: 13 }}>
          {v || "—"}
        </Text>
      ),
    },
    {
      title: "اسم الكمية",
      dataIndex: "quantity_name",
      key: "quantity_name",
      render: (v) =>
        v ? <Tag color="purple">{v}</Tag> : <Text type="secondary">—</Text>,
    },
    {
      title: "الوحدة",
      dataIndex: "unit_name",
      key: "unit_name",
      render: (v) =>
        v ? <Tag color="cyan">{v}</Tag> : <Text type="secondary">—</Text>,
    },
    {
      title: "التكلفة / وحدة",
      dataIndex: "unit_cost",
      key: "unit_cost",
      render: (v) =>
        v != null ? (
          <Tag color="orange" style={{ fontWeight: 600, fontSize: 13 }}>
            {Number(v).toLocaleString("ar-SA")} ر.س
          </Tag>
        ) : (
          "—"
        ),
    },
    {
      title: "الإجراءات",
      key: "actions",
      fixed: "left",
      render: (_, r) => (
        <Space size="small">
          <Tooltip title="تعديل">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => openAttrModal(r)}
              style={{ color: "#e07b1a" }}
            />
          </Tooltip>
          <Popconfirm
            title="حذف الخاصية؟"
            description="هذا الإجراء لا يمكن التراجع عنه."
            onConfirm={() => handleDeleteAttr(r.id)}
            okText="حذف"
            cancelText="إلغاء"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="حذف">
              <Button
                type="text"
                icon={<DeleteOutlined />}
                style={{ color: "#ff4d4f" }}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const provColumns = [
    {
      title: "مقدم الخدمة",
      key: "provider",
      render: (_, r) => (
        <Space>
          <Avatar
            size={40}
            icon={<UserOutlined />}
            style={{ background: "#0f1f1a" }}
          />
          <div>
            <div style={{ fontWeight: 600 }}>
              {r.provider_name ?? `#${r.id}`}
            </div>
            {r.provider_phone && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {r.provider_phone}
              </Text>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: "الإتاحة",
      key: "is_available",
      render: (_, r) => (
        <Switch
          checked={r.is_available}
          checkedChildren="متاح"
          unCheckedChildren="غير متاح"
          onChange={() => handleToggleAvailability(r.id, r.is_available)}
          style={r.is_available ? { background: "#52c41a" } : {}}
        />
      ),
    },
    {
      title: "تاريخ التعيين",
      dataIndex: "assigned_at",
      key: "assigned_at",
      render: fmt,
    },
    {
      title: "الإجراءات",
      key: "actions",
      fixed: "left",
      render: (_, r) => (
        <Popconfirm
          title="إزالة مقدم الخدمة؟"
          description="سيتم إزالة هذا المقدم من الخدمة."
          onConfirm={() => handleRemoveProvider(r.id)}
          okText="إزالة"
          cancelText="إلغاء"
          okButtonProps={{ danger: true }}
        >
          <Tooltip title="إزالة">
            <Button
              type="text"
              icon={<DeleteOutlined />}
              style={{ color: "#ff4d4f" }}
            />
          </Tooltip>
        </Popconfirm>
      ),
    },
  ];

  const revColumns = [
    {
      title: "العميل",
      key: "customer",
      render: (_, r) => (
        <Space>
          <Avatar
            size={36}
            icon={<UserOutlined />}
            style={{ background: "#e07b1a" }}
          />
          <span style={{ fontWeight: 600 }}>
            {r.customer_name ?? `عميل #${r.id}`}
          </span>
        </Space>
      ),
    },
    {
      title: "التقييم",
      dataIndex: "stars",
      key: "stars",
      render: (v) => (
        <Rate disabled defaultValue={v} style={{ fontSize: 14 }} />
      ),
    },
    {
      title: "التعليق",
      dataIndex: "comment",
      key: "comment",
      render: (v) => (
        <Text type="secondary" style={{ fontSize: 13 }}>
          {v || "—"}
        </Text>
      ),
    },
    {
      title: "التاريخ",
      dataIndex: "created_at",
      key: "created_at",
      render: fmt,
    },
    {
      title: "حذف",
      key: "actions",
      fixed: "left",
      render: (_, r) => (
        <Popconfirm
          title="حذف التقييم؟"
          onConfirm={() => handleDeleteReview(r.id)}
          okText="حذف"
          cancelText="إلغاء"
          okButtonProps={{ danger: true }}
        >
          <Tooltip title="حذف">
            <Button
              type="text"
              icon={<DeleteOutlined />}
              style={{ color: "#ff4d4f" }}
            />
          </Tooltip>
        </Popconfirm>
      ),
    },
  ];

  // ── Render ──
  return (
    <div style={{ fontFamily: "'Cairo', sans-serif", direction: "rtl" }}>
      <Button
        type="text"
        icon={<ArrowRightOutlined />}
        onClick={() => navigate("/services")}
        style={{ marginBottom: 16, color: "#0f1f1a", fontWeight: 600 }}
      >
        العودة إلى الخدمات
      </Button>

      {/* Service Header */}
      {loadingService ? (
        <Card
          bordered={false}
          style={{ borderRadius: 16, marginBottom: 24 }}
          bodyStyle={{ padding: 24 }}
        >
          <Skeleton active avatar paragraph={{ rows: 2 }} />
        </Card>
      ) : service ? (
        <Card
          bordered={false}
          style={{
            borderRadius: 16,
            marginBottom: 24,
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            background: "linear-gradient(135deg, #0f1f1a 0%, #1a3a30 100%)",
            color: "#fff",
          }}
          bodyStyle={{ padding: "24px 28px" }}
        >
          <Space align="start" size={20} style={{ width: "100%" }}>
            {service.image ? (
              <Avatar
                size={80}
                src={service.image}
                shape="square"
                style={{
                  borderRadius: 12,
                  flexShrink: 0,
                  border: "3px solid rgba(255,255,255,0.2)",
                }}
              />
            ) : (
              <Avatar
                size={80}
                icon={<AppstoreOutlined />}
                shape="square"
                style={{
                  background: "#e07b1a",
                  borderRadius: 12,
                  flexShrink: 0,
                  fontSize: 32,
                }}
              />
            )}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                  marginBottom: 6,
                }}
              >
                <Title
                  level={3}
                  style={{
                    margin: 0,
                    color: "#fff",
                    fontFamily: "'Cairo', sans-serif",
                  }}
                >
                  {service.title}
                </Title>
                <Switch
                  checked={service.is_active}
                  checkedChildren="نشطة"
                  unCheckedChildren="معطلة"
                  onChange={handleToggleServiceActive}
                  style={service.is_active ? { background: "#52c41a" } : {}}
                />
              </div>
              {service.details && (
                <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>
                  {service.details}
                </Text>
              )}
              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
                  تاريخ الإضافة: {fmt(service.date)}
                </Text>
                {service.visit_cost != null ? (
                  <Tag
                    icon={<CarOutlined />}
                    color="blue"
                    style={{ borderRadius: 6, fontWeight: 600, fontSize: 12 }}
                  >
                    تكلفة الزيارة:{" "}
                    {Number(service.visit_cost).toLocaleString("ar-SA")} ر.س
                  </Tag>
                ) : (
                  <Tag
                    color="default"
                    style={{ borderRadius: 6, fontSize: 12 }}
                  >
                    بدون تكلفة زيارة
                  </Tag>
                )}
                {service.warranty && (
                  <Tag
                    icon={<SafetyCertificateOutlined />}
                    color="green"
                    style={{ borderRadius: 6, fontSize: 12 }}
                  >
                    ضمان: {service.warranty.duration_value}{" "}
                    {DURATION_LABELS[service.warranty.duration_type]}
                  </Tag>
                )}
              </div>
            </div>
          </Space>
        </Card>
      ) : null}

      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {[
          {
            title: "عدد الخصائص",
            value: attributes.length,
            icon: <SettingOutlined />,
            color: "#e07b1a",
            bg: "#fff7e6",
          },
          {
            title: "مقدمو الخدمة",
            value: providers.length,
            icon: <TeamOutlined />,
            color: "#1677ff",
            bg: "#e6f4ff",
          },
          {
            title: "متوسط التقييم",
            value: rating?.average_stars
              ? Number(rating.average_stars).toFixed(1)
              : "—",
            suffix: rating?.average_stars ? " / 5" : "",
            icon: <StarOutlined />,
            color: "#faad14",
            bg: "#fffbe6",
          },
          {
            title: "عدد التقييمات",
            value: rating?.total_reviews ?? reviews.length,
            icon: <MessageOutlined />,
            color: "#52c41a",
            bg: "#f6ffed",
          },
          {
            title: "الأعمال السابقة",
            value: previousWorks.length,
            icon: <SwapOutlined />,
            color: "#e07b1a",
            bg: "#fff7e6",
          },
        ].map((s, i) => (
          <Col
            xs={24}
            sm={12}
            lg={i < 4 ? 6 : 24}
            key={i}
            style={i === 4 ? { display: "none" } : {}}
          >
            <Card
              bordered={false}
              style={{ borderRadius: 12, background: s.bg }}
              bodyStyle={{ padding: "16px 20px" }}
            >
              <Statistic
                title={
                  <span style={{ color: "#666", fontSize: 13 }}>{s.title}</span>
                }
                value={s.value}
                suffix={s.suffix}
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

      {/* Tabs */}
      <Card
        bordered={false}
        style={{ borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
        bodyStyle={{ padding: 0 }}
      >
        <Tabs
          defaultActiveKey="attributes"
          style={{ fontFamily: "'Cairo', sans-serif" }}
          tabBarStyle={{ padding: "0 24px", marginBottom: 0 }}
          items={[
            // ── Attributes Tab ──
            {
              key: "attributes",
              label: (
                <Space>
                  <SettingOutlined />
                  الخصائص
                  <Badge
                    count={attributes.length}
                    style={{ background: "#e07b1a" }}
                    overflowCount={99}
                  />
                </Space>
              ),
              children: (
                <div style={{ padding: "16px 24px 24px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 16,
                    }}
                  >
                    <Text style={{ color: "#666", fontSize: 13 }}>
                      خصائص الخدمة التي تحدد تسعير الحجوزات
                    </Text>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => openAttrModal()}
                      style={{ background: "#e07b1a", borderColor: "#e07b1a" }}
                    >
                      إضافة خاصية
                    </Button>
                  </div>
                  <Table
                    columns={attrColumns}
                    dataSource={attributes}
                    loading={loadingAttr}
                    rowKey="id"
                    scroll={{ x: 700 }}
                    pagination={{ pageSize: 8, showSizeChanger: false }}
                    locale={{
                      emptyText: (
                        <Empty
                          description="لا توجد خصائص بعد"
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                      ),
                    }}
                  />

                  {/* Warranty Section */}
                  <div
                    style={{
                      marginTop: 32,
                      paddingTop: 24,
                      borderTop: "1px dashed #e0e0e0",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 16,
                      }}
                    >
                      <Space>
                        <SafetyCertificateOutlined
                          style={{ color: "#16a34a", fontSize: 18 }}
                        />
                        <Text strong style={{ fontSize: 15 }}>
                          ضمان الخدمة
                        </Text>
                        {warranty && (
                          <Tag color="green" style={{ borderRadius: 6 }}>
                            {warranty.duration_value}{" "}
                            {DURATION_LABELS[warranty.duration_type]}
                          </Tag>
                        )}
                      </Space>
                      <Space>
                        {warranty && (
                          <Popconfirm
                            title="حذف الضمان؟"
                            description="سيتم حذف الضمان نهائياً من هذه الخدمة."
                            onConfirm={handleDeleteWarranty}
                            okText="حذف"
                            cancelText="إلغاء"
                            okButtonProps={{ danger: true }}
                          >
                            <Tooltip title="حذف الضمان">
                              <Button
                                type="text"
                                icon={<DeleteOutlined />}
                                style={{ color: "#ff4d4f" }}
                              />
                            </Tooltip>
                          </Popconfirm>
                        )}
                        <Button
                          type={warranty ? "default" : "primary"}
                          icon={warranty ? <EditOutlined /> : <PlusOutlined />}
                          onClick={openWarrantyModal}
                          style={
                            warranty
                              ? { borderColor: "#16a34a", color: "#16a34a" }
                              : {
                                  background: "#16a34a",
                                  borderColor: "#16a34a",
                                }
                          }
                          loading={loadingWarranty}
                        >
                          {warranty ? "تعديل الضمان" : "إضافة ضمان"}
                        </Button>
                      </Space>
                    </div>
                    {loadingWarranty ? (
                      <Skeleton active paragraph={{ rows: 1 }} />
                    ) : warranty ? (
                      <Card
                        bordered={false}
                        style={{
                          borderRadius: 10,
                          background: "#f6ffed",
                          border: "1px solid #b7eb8f",
                        }}
                        bodyStyle={{ padding: "14px 20px" }}
                      >
                        <Space size={32} wrap>
                          <div>
                            <Text
                              type="secondary"
                              style={{ fontSize: 12, display: "block" }}
                            >
                              العدد
                            </Text>
                            <Text
                              strong
                              style={{ fontSize: 20, color: "#16a34a" }}
                            >
                              {warranty.duration_value}
                            </Text>
                          </div>
                          <div>
                            <Text
                              type="secondary"
                              style={{ fontSize: 12, display: "block" }}
                            >
                              نوع المدة
                            </Text>
                            <Text strong style={{ fontSize: 16 }}>
                              {DURATION_LABELS[warranty.duration_type]}
                            </Text>
                          </div>
                          {warranty.notes && (
                            <div>
                              <Text
                                type="secondary"
                                style={{ fontSize: 12, display: "block" }}
                              >
                                ملاحظات
                              </Text>
                              <Text style={{ fontSize: 14 }}>
                                {warranty.notes}
                              </Text>
                            </div>
                          )}
                        </Space>
                      </Card>
                    ) : (
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        لا يوجد ضمان لهذه الخدمة بعد، اضغط "إضافة ضمان" لإضافته.
                      </Text>
                    )}
                  </div>
                </div>
              ),
            },

            // ── Providers Tab ──
            {
              key: "providers",
              label: (
                <Space>
                  <TeamOutlined />
                  مقدمو الخدمة
                  <Badge
                    count={providers.length}
                    style={{ background: "#1677ff" }}
                    overflowCount={99}
                  />
                </Space>
              ),
              children: (
                <div style={{ padding: "16px 24px 24px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 16,
                    }}
                  >
                    <Text style={{ color: "#666", fontSize: 13 }}>
                      المزودون المعيّنون لهذه الخدمة
                    </Text>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={openAssignModal}
                      style={{ background: "#0f1f1a", borderColor: "#0f1f1a" }}
                    >
                      تعيين مقدم خدمة
                    </Button>
                  </div>
                  <Table
                    columns={provColumns}
                    dataSource={providers}
                    loading={loadingProv}
                    rowKey="id"
                    scroll={{ x: 600 }}
                    pagination={{ pageSize: 8, showSizeChanger: false }}
                    locale={{
                      emptyText: (
                        <Empty
                          description="لا يوجد مقدمو خدمة معيّنون"
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                      ),
                    }}
                  />
                </div>
              ),
            },

            // ── Reviews Tab ──
            {
              key: "reviews",
              label: (
                <Space>
                  <StarOutlined />
                  التقييمات
                  <Badge
                    count={reviews.length}
                    style={{ background: "#faad14" }}
                    overflowCount={99}
                  />
                </Space>
              ),
              children: (
                <div style={{ padding: "16px 24px 24px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 16,
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
                    <Space>
                      {rating && (
                        <>
                          <Rate
                            disabled
                            allowHalf
                            value={Number(rating.average_stars)}
                            style={{ fontSize: 16 }}
                          />
                          <Text strong style={{ fontSize: 16 }}>
                            {Number(rating.average_stars).toFixed(1)}
                          </Text>
                          <Text type="secondary">
                            ({rating.total_reviews} تقييم)
                          </Text>
                        </>
                      )}
                    </Space>
                    {reviews.length > 0 && (
                      <Popconfirm
                        title="مسح جميع التقييمات؟"
                        description="سيتم حذف جميع التقييمات نهائياً."
                        onConfirm={handleClearAllReviews}
                        okText="مسح الكل"
                        cancelText="إلغاء"
                        okButtonProps={{ danger: true }}
                      >
                        <Button danger icon={<ClearOutlined />}>
                          مسح الكل
                        </Button>
                      </Popconfirm>
                    )}
                  </div>
                  <Table
                    columns={revColumns}
                    dataSource={reviews}
                    loading={loadingRev}
                    rowKey="id"
                    scroll={{ x: 700 }}
                    pagination={{ pageSize: 8, showSizeChanger: false }}
                    locale={{
                      emptyText: (
                        <Empty
                          description="لا توجد تقييمات بعد"
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                      ),
                    }}
                  />
                </div>
              ),
            },

            // ══════════════════════════════════════════
            // ── Previous Works Tab (NEW) ──
            // ══════════════════════════════════════════
            {
              key: "previous_works",
              label: (
                <Space>
                  <SwapOutlined />
                  الأعمال السابقة
                  <Badge
                    count={previousWorks.length}
                    style={{ background: "#e07b1a" }}
                    overflowCount={99}
                  />
                </Space>
              ),
              children: (
                <div style={{ padding: "16px 24px 24px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 20,
                    }}
                  >
                    <Text style={{ color: "#666", fontSize: 13 }}>
                      صور قبل وبعد أضافها مزودو الخدمة عند إتمام الحجوزات
                    </Text>
                    <Tag
                      color="orange"
                      style={{ borderRadius: 6, fontSize: 12 }}
                    >
                      {previousWorks.length} عمل سابق
                    </Tag>
                  </div>

                  {loadingPrevWorks ? (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        padding: "48px 0",
                      }}
                    >
                      <Spin size="large" />
                    </div>
                  ) : previousWorks.length === 0 ? (
                    <Empty
                      image={
                        <SwapOutlined
                          style={{ fontSize: 64, color: "#e07b1a33" }}
                        />
                      }
                      description={
                        <Text type="secondary" style={{ fontSize: 14 }}>
                          لا توجد أعمال سابقة بعد. ستظهر هنا بعد أن يُتمّ مزودو
                          الخدمة حجوزاتهم ويضيفوا صور قبل/بعد.
                        </Text>
                      }
                      style={{ padding: "48px 0" }}
                    />
                  ) : (
                    <>
                      {/* Grid of Before/After pairs */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fill, minmax(320px, 1fr))",
                          gap: 20,
                        }}
                      >
                        {previousWorks.map((work, idx) => (
                          <PreviousWorkCard
                            key={work.id}
                            work={work}
                            index={idx + 1}
                            onPreview={() => setPreviewWork(work)}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* ── Modal: Preview Previous Work (NEW) ── */}
      <Modal
        open={!!previewWork}
        onCancel={() => setPreviewWork(null)}
        footer={null}
        width={780}
        style={{ direction: "rtl", fontFamily: "'Cairo', sans-serif" }}
        title={
          <Space style={{ fontFamily: "'Cairo', sans-serif", fontWeight: 700 }}>
            <SwapOutlined style={{ color: "#e07b1a" }} />
            عرض العمل السابق
            {previewWork?.created_at && (
              <Tag
                color="orange"
                style={{ borderRadius: 6, fontSize: 11, fontWeight: 400 }}
              >
                <CalendarOutlined style={{ marginLeft: 4 }} />
                {fmtFull(previewWork.created_at)}
              </Tag>
            )}
          </Space>
        }
      >
        {previewWork && (
          <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
            <Col xs={24} sm={12}>
              <div
                style={{
                  borderRadius: 10,
                  overflow: "hidden",
                  border: "2px solid #ff4d4f44",
                }}
              >
                <div
                  style={{
                    background: "#ff4d4f",
                    color: "#fff",
                    padding: "6px 14px",
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  ⬤ قبل
                </div>
                <Image
                  src={previewWork.before_image}
                  alt="قبل"
                  style={{
                    width: "100%",
                    maxHeight: 300,
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div
                style={{
                  borderRadius: 10,
                  overflow: "hidden",
                  border: "2px solid #52c41a44",
                }}
              >
                <div
                  style={{
                    background: "#52c41a",
                    color: "#fff",
                    padding: "6px 14px",
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  ⬤ بعد
                </div>
                <Image
                  src={previewWork.after_image}
                  alt="بعد"
                  style={{
                    width: "100%",
                    maxHeight: 300,
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </div>
            </Col>
          </Row>
        )}
      </Modal>

      {/* Modal: Attribute */}
      <Modal
        title={
          <span style={{ fontFamily: "'Cairo', sans-serif", fontWeight: 700 }}>
            {editingAttr ? "تعديل الخاصية" : "إضافة خاصية جديدة"}
          </span>
        }
        open={attrModal}
        onOk={handleSaveAttr}
        onCancel={() => setAttrModal(false)}
        okText={editingAttr ? "حفظ التعديلات" : "إضافة"}
        cancelText="إلغاء"
        confirmLoading={savingAttr}
        okButtonProps={{
          style: { background: "#e07b1a", borderColor: "#e07b1a" },
        }}
        style={{ direction: "rtl", fontFamily: "'Cairo', sans-serif" }}
      >
        <Form form={attrForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="اسم الخاصية"
            rules={[{ required: true, message: "الرجاء إدخال اسم الخاصية" }]}
          >
            <Input placeholder="مثال: عزل فوم" />
          </Form.Item>
          <Form.Item name="details" label="التفاصيل">
            <Input.TextArea rows={2} placeholder="وصف اختياري للخاصية..." />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="quantity_name"
                label="اسم الكمية"
                tooltip="التسمية التي تظهر للعميل عند إدخال الكمية، مثال: المساحة"
              >
                <Input placeholder="مثال: المساحة" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="unit_name"
                label="اسم الوحدة"
                tooltip="وحدة القياس المستخدمة، مثال: متر مربع"
              >
                <Input placeholder="مثال: متر مربع" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="unit_cost"
            label="التكلفة لكل وحدة (ر.س)"
            rules={[{ required: true, message: "الرجاء إدخال التكلفة" }]}
          >
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              placeholder="150"
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              parser={(v) => v?.replace(/,*/g, "")}
            />
          </Form.Item>
          <Form.Item noStyle shouldUpdate>
            {({ getFieldValue }) => {
              const qName = getFieldValue("quantity_name");
              const uName = getFieldValue("unit_name");
              const cost = getFieldValue("unit_cost");
              if (!qName && !uName && !cost) return null;
              return (
                <div
                  style={{
                    padding: "10px 14px",
                    background: "#fff7e6",
                    borderRadius: 8,
                    border: "1px dashed #e07b1a",
                    fontSize: 13,
                  }}
                >
                  <Text
                    type="secondary"
                    style={{ fontSize: 12, display: "block", marginBottom: 4 }}
                  >
                    معاينة — كيف ستظهر للعميل:
                  </Text>
                  <Text>
                    {qName || "الكمية"}
                    {uName ? ` (${uName})` : ""}
                    {cost ? ` × ${cost} ر.س` : ""}
                  </Text>
                </div>
              );
            }}
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal: Assign Provider */}
      <Modal
        title={
          <span style={{ fontFamily: "'Cairo', sans-serif", fontWeight: 700 }}>
            تعيين مقدم خدمة
          </span>
        }
        open={assignModal}
        onOk={handleAssignProvider}
        onCancel={() => {
          setAssignModal(false);
          assignForm.resetFields();
        }}
        okText="تعيين"
        cancelText="إلغاء"
        confirmLoading={savingAssign}
        okButtonProps={{
          style: { background: "#0f1f1a", borderColor: "#0f1f1a" },
        }}
        style={{ direction: "rtl", fontFamily: "'Cairo', sans-serif" }}
      >
        <Form form={assignForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="provider_id"
            label="اختر مقدم الخدمة"
            rules={[{ required: true, message: "الرجاء اختيار مقدم الخدمة" }]}
          >
            <Select
              placeholder="ابحث واختر مقدم الخدمة..."
              showSearch
              loading={loadingAvailable}
              optionFilterProp="label"
              filterOption={(input, option) =>
                (option?.searchValue ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              notFoundContent={
                loadingAvailable ? (
                  <div style={{ textAlign: "center", padding: "8px 0" }}>
                    جاري التحميل...
                  </div>
                ) : (
                  <Empty
                    description="لا يوجد مزودون متاحون بنفس التخصص"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                )
              }
              options={availableProviders.map((p) => ({
                value: p.id,
                label: p.name,
                searchValue: `${p.name} ${p.phone_number ?? ""}`,
              }))}
              optionRender={(option) => {
                const p = availableProviders.find((x) => x.id === option.value);
                return (
                  <Space>
                    <Avatar
                      size={32}
                      icon={<UserOutlined />}
                      style={{ background: "#0f1f1a", flexShrink: 0 }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, lineHeight: 1.4 }}>
                        {p?.name}
                      </div>
                      {p?.phone_number && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {p.phone_number}
                        </Text>
                      )}
                      {p?.specialization && (
                        <Tag
                          color="orange"
                          style={{ marginRight: 0, marginTop: 2, fontSize: 11 }}
                        >
                          {p.specialization}
                        </Tag>
                      )}
                    </div>
                  </Space>
                );
              }}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal: Warranty */}
      <Modal
        title={
          <Space style={{ fontFamily: "'Cairo', sans-serif", fontWeight: 700 }}>
            <SafetyCertificateOutlined style={{ color: "#16a34a" }} />
            {warranty ? "تعديل الضمان" : "إضافة ضمان جديد"}
          </Space>
        }
        open={warrantyModal}
        onOk={handleSaveWarranty}
        onCancel={() => setWarrantyModal(false)}
        okText={warranty ? "حفظ التعديلات" : "إضافة الضمان"}
        cancelText="إلغاء"
        confirmLoading={savingWarranty}
        okButtonProps={{
          style: { background: "#16a34a", borderColor: "#16a34a" },
        }}
        style={{ direction: "rtl", fontFamily: "'Cairo', sans-serif" }}
      >
        <Form form={warrantyForm} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="duration_value"
                label="العدد"
                rules={[{ required: true, message: "الرجاء إدخال العدد" }]}
              >
                <InputNumber
                  min={1}
                  style={{ width: "100%" }}
                  placeholder="مثال: 6"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="duration_type"
                label="نوع المدة"
                rules={[{ required: true, message: "الرجاء اختيار نوع المدة" }]}
              >
                <Select placeholder="اختر النوع">
                  <Option value="day">يوم</Option>
                  <Option value="month">شهر</Option>
                  <Option value="year">سنة</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label="ملاحظات (اختياري)">
            <Input.TextArea
              rows={3}
              placeholder="أي تفاصيل إضافية عن الضمان..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

// ══════════════════════════════════════════
// ── PreviousWorkCard Component (NEW) ──
// ══════════════════════════════════════════
function PreviousWorkCard({ work, index, onPreview }) {
  return (
    <div
      style={{
        borderRadius: 14,
        overflow: "hidden",
        border: "1px solid #e8e8e8",
        background: "#fff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        transition: "box-shadow 0.2s, transform 0.2s",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 6px 20px rgba(224,123,26,0.18)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
      onClick={onPreview}
    >
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #0f1f1a, #1a3a30)",
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Space>
          <SwapOutlined style={{ color: "#e07b1a", fontSize: 14 }} />
          <Text style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>
            عمل سابق #{index}
          </Text>
        </Space>
        <Space size={6}>
          <Tag
            style={{
              margin: 0,
              fontSize: 11,
              borderRadius: 4,
              background: "rgba(255,255,255,0.1)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            <CalendarOutlined style={{ marginLeft: 3 }} />
            {new Date(work.created_at).toLocaleDateString("ar-SA")}
          </Tag>
          <Button
            size="small"
            icon={<EyeOutlined />}
            style={{
              borderRadius: 6,
              background: "#e07b1a",
              borderColor: "#e07b1a",
              color: "#fff",
              fontSize: 11,
            }}
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
          >
            عرض
          </Button>
        </Space>
      </div>

      {/* Images side by side */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
        {/* Before */}
        <div style={{ position: "relative" }}>
          <img
            src={work.before_image}
            alt="قبل"
            style={{
              width: "100%",
              height: 160,
              objectFit: "cover",
              display: "block",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              background: "linear-gradient(transparent, rgba(220,38,38,0.75))",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              padding: "16px 8px 6px",
              textAlign: "center",
            }}
          >
            ⬤ قبل
          </div>
        </div>

        {/* After */}
        <div style={{ position: "relative", borderRight: "2px solid #fff" }}>
          <img
            src={work.after_image}
            alt="بعد"
            style={{
              width: "100%",
              height: 160,
              objectFit: "cover",
              display: "block",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              background: "linear-gradient(transparent, rgba(22,163,74,0.75))",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              padding: "16px 8px 6px",
              textAlign: "center",
            }}
          >
            ⬤ بعد
          </div>
        </div>
      </div>
    </div>
  );
}
