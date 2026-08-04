import { useState, useEffect } from "react";
import {
  Card,
  Button,
  Tag,
  Space,
  Descriptions,
  message,
  Spin,
  Modal,
  Select,
  InputNumber,
  Popconfirm,
  Typography,
  Row,
  Col,
  Divider,
  Avatar,
} from "antd";
import {
  ArrowRightOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  AppstoreOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  PhoneOutlined,
  UserAddOutlined,
  DollarOutlined,
  HourglassOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";

const { Title, Text } = Typography;
const { Option } = Select;

// ── حالة الحجز ────────────────────────────────────────────
// pending → awaiting_price → price_proposed → confirmed → completed
// (cancelled ممكن يحصل من pending أو awaiting_price أو confirmed)
const STATUS_MAP = {
  pending: {
    label: "قيد الانتظار",
    color: "orange",
    icon: <ClockCircleOutlined />,
  },
  awaiting_price: {
    label: "جاري التسعير",
    color: "gold",
    icon: <HourglassOutlined />,
  },
  price_proposed: {
    label: "بانتظار موافقة العميل",
    color: "purple",
    icon: <DollarOutlined />,
  },
  confirmed: { label: "مؤكد", color: "blue", icon: <SyncOutlined /> },
  completed: { label: "مكتمل", color: "green", icon: <CheckCircleOutlined /> },
  cancelled: { label: "ملغي", color: "red", icon: <CloseCircleOutlined /> },
};

const STATUS_STEPS = [
  "pending",
  "awaiting_price",
  "price_proposed",
  "confirmed",
  "completed",
];

// نفس الـ VALID_TRANSITIONS بتاعة الباكند (BookingStatusUpdateSerializer)
// ملحوظة: price_proposed فاضية عمدًا هنا — الانتقال منها محجوز للعميل
// عبر price-decision، أو للأدمن عبر AdminConfirmPriceOnBehalfView المنفصل
const VALID_TRANSITIONS = {
  pending: ["awaiting_price", "cancelled"],
  awaiting_price: ["cancelled"],
  price_proposed: [],
  confirmed: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export default function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  // Status modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [updating, setUpdating] = useState(false);

  // Set price modal
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [priceValue, setPriceValue] = useState(null);
  const [settingPrice, setSettingPrice] = useState(false);

  // Assign provider modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [availableProviders, setAvailableProviders] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [assigning, setAssigning] = useState(false);

  // Confirm price on behalf of customer modal
  const [confirmPriceModalOpen, setConfirmPriceModalOpen] = useState(false);
  const [confirmingPrice, setConfirmingPrice] = useState(false);

  const fetchBooking = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/existedservices/admin/bookings/${id}/`);
      setBooking(res.data);
    } catch {
      message.error("فشل تحميل تفاصيل الحجز");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [id]);

  // ── Status ──────────────────────────────────────────────
  const allowedNextStatuses = booking
    ? VALID_TRANSITIONS[booking.status] ?? []
    : [];

  const openStatusModal = () => {
    setNewStatus(allowedNextStatuses[0] ?? "");
    setStatusModalOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!newStatus) {
      message.warning("اختر حالة جديدة");
      return;
    }
    try {
      setUpdating(true);
      await api.post(`/existedservices/admin/bookings/${id}/status/`, {
        status: newStatus,
      });
      message.success("تم تحديث حالة الحجز بنجاح");
      setStatusModalOpen(false);
      fetchBooking();
    } catch (err) {
      message.error(
        err?.response?.data?.status?.[0] ??
          err?.response?.data?.error ??
          "فشل تحديث الحالة"
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = async () => {
    try {
      await api.post(`/existedservices/admin/bookings/${id}/status/`, {
        status: "cancelled",
      });
      message.success("تم إلغاء الحجز");
      fetchBooking();
    } catch {
      message.error("فشل إلغاء الحجز");
    }
  };

  // ── Set Price ───────────────────────────────────────────
  const openPriceModal = () => {
    setPriceValue(null);
    setPriceModalOpen(true);
  };

  const handleSetPrice = async () => {
    if (!priceValue || priceValue <= 0) {
      message.warning("أدخل سعر صحيح");
      return;
    }
    try {
      setSettingPrice(true);
      await api.post(`/existedservices/admin/bookings/${id}/set-price/`, {
        price: priceValue,
      });
      message.success("تم إرسال السعر للعميل بانتظار موافقته");
      setPriceModalOpen(false);
      fetchBooking();
    } catch (err) {
      message.error(
        err?.response?.data?.price?.[0] ??
          err?.response?.data?.error ??
          "فشل تحديد السعر"
      );
    } finally {
      setSettingPrice(false);
    }
  };

  // ── Assign Provider ─────────────────────────────────────
  const openAssignModal = async () => {
    setAssignModalOpen(true);
    setSelectedProvider(null);
    setLoadingProviders(true);
    try {
      const res = await api.get(
        `/existedservices/admin/services/${booking.service_id}/available-providers/`
      );
      setAvailableProviders(res.data);
    } catch {
      message.error("فشل تحميل الفنيين المتاحين");
    } finally {
      setLoadingProviders(false);
    }
  };

  const handleAssignProvider = async () => {
    if (!selectedProvider) {
      message.warning("اختر فني أولاً");
      return;
    }
    try {
      setAssigning(true);
      await api.patch(
        `/existedservices/admin/bookings/${id}/assign-provider/`,
        {
          provider_id: selectedProvider,
        }
      );
      message.success("تم تعيين الفني بنجاح");
      setAssignModalOpen(false);
      fetchBooking();
    } catch {
      message.error("فشل تعيين الفني");
    } finally {
      setAssigning(false);
    }
  };

  // ── Confirm Price On Behalf Of Customer ─────────────────
  // للحالات اللي العميل بيوافق/يرفض فيها تليفونيًا، والأدمن عايز
  // يسجل القرار يدويًا بدل ما يستنى العميل يعمله من التطبيق.
  const handleConfirmPriceOnBehalf = async (accept) => {
    try {
      setConfirmingPrice(true);
      await api.post(`/existedservices/admin/bookings/${id}/confirm-price/`, {
        accept,
      });
      message.success(
        accept ? "تم تأكيد الحجز بالنيابة عن العميل" : "تم إلغاء الحجز"
      );
      setConfirmPriceModalOpen(false);
      fetchBooking();
    } catch (err) {
      message.error(
        err?.response?.data?.non_field_errors?.[0] ??
          err?.response?.data?.error ??
          "فشل تسجيل القرار"
      );
    } finally {
      setConfirmingPrice(false);
    }
  };

  // ── Render ───────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div style={{ textAlign: "center", padding: 40 }}>
        <Text type="secondary">لم يتم العثور على الحجز</Text>
        <br />
        <Button
          style={{ marginTop: 16 }}
          onClick={() => navigate("/bookings")}
          icon={<ArrowRightOutlined />}
        >
          العودة للحجوزات
        </Button>
      </div>
    );
  }

  const statusInfo = STATUS_MAP[booking.status] ?? {
    label: booking.status,
    color: "default",
    icon: null,
  };

  const currentStepIdx =
    booking.status === "cancelled" ? -1 : STATUS_STEPS.indexOf(booking.status);

  const address = booking.address ?? null;

  const canChangeStatus = allowedNextStatuses.length > 0;
  const canCancel = allowedNextStatuses.includes("cancelled");
  const canSetPrice = booking.status === "awaiting_price";
  const canConfirmPriceOnBehalf = booking.status === "price_proposed";
  const canAssignProvider =
    booking.status !== "cancelled" && booking.status !== "completed";

  const visitCost = parseFloat(booking.service_visit_cost ?? 0);
  const totalCost =
    booking.price != null
      ? (parseFloat(booking.price) + visitCost).toFixed(2)
      : null;

  return (
    <div style={{ fontFamily: "'Cairo', sans-serif" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <Space>
          <Button
            type="text"
            icon={<ArrowRightOutlined />}
            onClick={() => navigate("/bookings")}
            style={{ color: "#666" }}
          />
          <Title level={4} style={{ margin: 0, color: "#0f1f1a" }}>
            تفاصيل الحجز{" "}
            <Text style={{ fontFamily: "monospace", color: "#e07b1a" }}>
              #{String(booking.id).slice(0, 8)}
            </Text>
          </Title>
          <Tag
            icon={statusInfo.icon}
            color={statusInfo.color}
            style={{
              borderRadius: 20,
              padding: "2px 12px",
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            {statusInfo.label}
          </Tag>
        </Space>

        <Space wrap>
          {canSetPrice && (
            <Button
              type="primary"
              icon={<DollarOutlined />}
              onClick={openPriceModal}
              style={{ background: "#0f1f1a", borderColor: "#0f1f1a" }}
            >
              تحديد السعر
            </Button>
          )}
          {canConfirmPriceOnBehalf && (
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => setConfirmPriceModalOpen(true)}
              style={{ background: "#52c41a", borderColor: "#52c41a" }}
            >
              تأكيد/رفض بالنيابة عن العميل
            </Button>
          )}
          {canChangeStatus && (
            <Button
              icon={<EditOutlined />}
              onClick={openStatusModal}
              style={{ borderColor: "#e07b1a", color: "#e07b1a" }}
            >
              تغيير الحالة
            </Button>
          )}
          {canCancel && (
            <Popconfirm
              title="إلغاء الحجز؟"
              description="سيتم تغيير حالة الحجز إلى ملغي ولا يمكن التراجع."
              onConfirm={handleCancel}
              okText="إلغاء الحجز"
              cancelText="تراجع"
              okButtonProps={{ danger: true }}
            >
              <Button danger icon={<DeleteOutlined />}>
                إلغاء الحجز
              </Button>
            </Popconfirm>
          )}
        </Space>
      </div>

      {/* Progress Timeline */}
      <Card
        bordered={false}
        style={{
          borderRadius: 12,
          marginBottom: 20,
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
        bodyStyle={{ padding: "20px 32px" }}
      >
        {booking.status === "cancelled" ? (
          <div
            style={{ textAlign: "center", color: "#ff4d4f", fontWeight: 600 }}
          >
            <CloseCircleOutlined style={{ fontSize: 20, marginLeft: 8 }} />
            تم إلغاء هذا الحجز
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0,
              flexWrap: "wrap",
            }}
          >
            {STATUS_STEPS.map((step, idx) => {
              const s = STATUS_MAP[step];
              const done = idx <= currentStepIdx;
              const active = idx === currentStepIdx;
              return (
                <div
                  key={step}
                  style={{ display: "flex", alignItems: "center" }}
                >
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: done ? "#0f1f1a" : "#f0f0f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: done ? "#fff" : "#bbb",
                        fontSize: 16,
                        margin: "0 auto 6px",
                        border: active ? "2px solid #e07b1a" : "none",
                        transition: "all 0.3s",
                      }}
                    >
                      {s.icon}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: done ? "#0f1f1a" : "#bbb",
                        fontWeight: done ? 600 : 400,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {s.label}
                    </div>
                  </div>
                  {idx < STATUS_STEPS.length - 1 && (
                    <div
                      style={{
                        width: 60,
                        height: 2,
                        background:
                          idx < currentStepIdx ? "#0f1f1a" : "#f0f0f0",
                        margin: "0 8px",
                        marginBottom: 22,
                        transition: "all 0.3s",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Row gutter={16}>
        {/* Left Column */}
        <Col xs={24} lg={16}>
          {/* Booking Info */}
          <Card
            title={
              <Space>
                <CalendarOutlined style={{ color: "#e07b1a" }} />
                <span>معلومات الحجز</span>
              </Space>
            }
            bordered={false}
            style={{
              borderRadius: 12,
              marginBottom: 16,
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <Descriptions column={{ xs: 1, sm: 2 }} size="middle">
              <Descriptions.Item label="رقم الحجز">
                <Text style={{ fontFamily: "monospace", fontWeight: 600 }}>
                  #{booking.id}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="تاريخ الموعد">
                {booking.scheduled_date
                  ? new Date(booking.scheduled_date).toLocaleDateString(
                      "ar-SA",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )
                  : "—"}
              </Descriptions.Item>
              <Descriptions.Item label="تاريخ الإنشاء">
                {booking.created_at
                  ? new Date(booking.created_at).toLocaleString("ar-SA")
                  : "—"}
              </Descriptions.Item>
              <Descriptions.Item label="آخر تحديث">
                {booking.updated_at
                  ? new Date(booking.updated_at).toLocaleString("ar-SA")
                  : "—"}
              </Descriptions.Item>
              {booking.notes && (
                <Descriptions.Item label="ملاحظات" span={2}>
                  <Text type="secondary">{booking.notes}</Text>
                </Descriptions.Item>
              )}
              {booking.service_visit_cost != null && (
                <Descriptions.Item label="تكلفة الزيارة">
                  <Text style={{ color: "#1677ff", fontWeight: 600 }}>
                    {visitCost.toFixed(2)} ر.س
                  </Text>
                </Descriptions.Item>
              )}
              {booking.price != null ? (
                <>
                  <Descriptions.Item label="السعر المحدد">
                    <Text style={{ color: "#52c41a", fontWeight: 700 }}>
                      {parseFloat(booking.price).toFixed(2)} ر.س
                    </Text>
                  </Descriptions.Item>
                  {booking.priced_at && (
                    <Descriptions.Item label="وقت التسعير">
                      {new Date(booking.priced_at).toLocaleString("ar-SA")}
                    </Descriptions.Item>
                  )}
                  <Descriptions.Item
                    label="الإجمالي الكلي (شامل الزيارة)"
                    span={2}
                  >
                    <Text
                      style={{
                        color: "#0f1f1a",
                        fontWeight: 700,
                        fontSize: 17,
                      }}
                    >
                      {totalCost} ر.س
                    </Text>
                  </Descriptions.Item>
                </>
              ) : (
                <Descriptions.Item label="السعر" span={2}>
                  <Tag color="gold">لم يتم تحديد السعر بعد</Tag>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          {/* Address */}
          {address && (
            <Card
              title={
                <Space>
                  <EnvironmentOutlined style={{ color: "#e07b1a" }} />
                  <span>عنوان الخدمة</span>
                </Space>
              }
              bordered={false}
              style={{
                borderRadius: 12,
                marginBottom: 16,
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}
            >
              <Descriptions column={{ xs: 1, sm: 2 }} size="middle">
                {address.city && (
                  <Descriptions.Item label="المدينة">
                    {address.city}
                  </Descriptions.Item>
                )}
                {address.district && (
                  <Descriptions.Item label="الحي">
                    {address.district}
                  </Descriptions.Item>
                )}
                {address.street && (
                  <Descriptions.Item label="الشارع">
                    {address.street}
                  </Descriptions.Item>
                )}
                {address.building_no && (
                  <Descriptions.Item label="رقم المبنى">
                    {address.building_no}
                  </Descriptions.Item>
                )}
                {address.floor_no && (
                  <Descriptions.Item label="الطابق">
                    {address.floor_no}
                  </Descriptions.Item>
                )}
                {address.apartment_no && (
                  <Descriptions.Item label="رقم الشقة">
                    {address.apartment_no}
                  </Descriptions.Item>
                )}
                {address.label && (
                  <Descriptions.Item label="التسمية">
                    <Tag>{address.label}</Tag>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>
          )}
        </Col>

        {/* Right Column */}
        <Col xs={24} lg={8}>
          {/* Customer Info */}
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              marginBottom: 16,
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <Avatar
                size={64}
                icon={<UserOutlined />}
                style={{ background: "#e07b1a", marginBottom: 12 }}
              />
              <div style={{ fontWeight: 700, fontSize: 16, color: "#0f1f1a" }}>
                {booking.customer_name ?? "العميل"}
              </div>
              <Tag color="blue" style={{ marginTop: 4 }}>
                عميل
              </Tag>
            </div>
            <Divider style={{ margin: "12px 0" }} />
            {booking.customer_phone && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <PhoneOutlined style={{ color: "#e07b1a" }} />
                <Text style={{ direction: "ltr" }}>
                  {booking.customer_phone}
                </Text>
              </div>
            )}
          </Card>

          {/* Provider Info */}
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              marginBottom: 16,
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <Avatar
                size={64}
                icon={<UserOutlined />}
                style={{
                  background: booking.provider_name ? "#0f1f1a" : "#d9d9d9",
                  marginBottom: 12,
                }}
              />
              <div style={{ fontWeight: 700, fontSize: 16, color: "#0f1f1a" }}>
                {booking.provider_name ?? "لم يتم تعيين فني بعد"}
              </div>
              <Tag
                color={booking.provider_name ? "green" : "default"}
                style={{ marginTop: 4 }}
              >
                {booking.provider_name ? "مزود خدمة" : "غير محدد"}
              </Tag>
            </div>
            <Divider style={{ margin: "12px 0" }} />
            {booking.provider_phone ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <PhoneOutlined style={{ color: "#0f1f1a" }} />
                <Text style={{ direction: "ltr" }}>
                  {booking.provider_phone}
                </Text>
              </div>
            ) : (
              <Text
                type="secondary"
                style={{
                  display: "block",
                  textAlign: "center",
                  marginBottom: 12,
                }}
              >
                لا يوجد فني مُعيَّن
              </Text>
            )}
            {canAssignProvider && (
              <Button
                type="dashed"
                icon={<UserAddOutlined />}
                onClick={openAssignModal}
                block
                style={{ borderColor: "#0f1f1a", color: "#0f1f1a" }}
              >
                {booking.provider_name ? "تغيير الفني" : "تعيين فني"}
              </Button>
            )}
          </Card>

          {/* Service Info */}
          <Card
            title={
              <Space>
                <AppstoreOutlined style={{ color: "#e07b1a" }} />
                <span>الخدمة</span>
              </Space>
            }
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 15 }}>
              {booking.service_title ?? "—"}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Status Change Modal */}
      <Modal
        title={
          <span style={{ fontFamily: "'Cairo', sans-serif", fontWeight: 700 }}>
            تغيير حالة الحجز
          </span>
        }
        open={statusModalOpen}
        onOk={handleUpdateStatus}
        onCancel={() => setStatusModalOpen(false)}
        okText="حفظ"
        cancelText="إلغاء"
        confirmLoading={updating}
        okButtonProps={{
          style: { background: "#e07b1a", borderColor: "#e07b1a" },
        }}
        style={{ direction: "rtl", fontFamily: "'Cairo', sans-serif" }}
      >
        <div style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 12, color: "#555" }}>
            الحالة الحالية:{" "}
            <Tag
              icon={statusInfo.icon}
              color={statusInfo.color}
              style={{ fontWeight: 600 }}
            >
              {statusInfo.label}
            </Tag>
          </div>
          <div style={{ marginBottom: 8, color: "#333", fontWeight: 600 }}>
            الحالة الجديدة:
          </div>
          {allowedNextStatuses.length === 0 ? (
            <Text type="secondary">
              لا توجد انتقالات متاحة من الحالة الحالية.
            </Text>
          ) : (
            <Select
              value={newStatus}
              onChange={setNewStatus}
              style={{ width: "100%" }}
            >
              {allowedNextStatuses.map((key) => (
                <Option key={key} value={key}>
                  <Space>
                    {STATUS_MAP[key]?.icon}
                    {STATUS_MAP[key]?.label ?? key}
                  </Space>
                </Option>
              ))}
            </Select>
          )}
        </div>
      </Modal>

      {/* Set Price Modal */}
      <Modal
        title={
          <span style={{ fontFamily: "'Cairo', sans-serif", fontWeight: 700 }}>
            تحديد سعر الحجز
          </span>
        }
        open={priceModalOpen}
        onOk={handleSetPrice}
        onCancel={() => setPriceModalOpen(false)}
        okText="إرسال السعر للعميل"
        cancelText="إلغاء"
        confirmLoading={settingPrice}
        okButtonProps={{
          style: { background: "#0f1f1a", borderColor: "#0f1f1a" },
        }}
        style={{ direction: "rtl", fontFamily: "'Cairo', sans-serif" }}
      >
        <div style={{ marginTop: 16 }}>
          <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
            بعد تحديد السعر، هيتبعت للعميل عشان يوافق عليه أو يرفضه.
          </Text>
          <div style={{ marginBottom: 8, color: "#333", fontWeight: 600 }}>
            السعر (ر.س):
          </div>
          <InputNumber
            min={0.01}
            step={0.01}
            value={priceValue}
            onChange={setPriceValue}
            style={{ width: "100%" }}
            placeholder="أدخل السعر"
          />
        </div>
      </Modal>

      {/* Confirm Price On Behalf Of Customer Modal */}
      <Modal
        title={
          <span style={{ fontFamily: "'Cairo', sans-serif", fontWeight: 700 }}>
            تسجيل قرار العميل يدويًا
          </span>
        }
        open={confirmPriceModalOpen}
        onCancel={() => setConfirmPriceModalOpen(false)}
        footer={null}
        style={{ direction: "rtl", fontFamily: "'Cairo', sans-serif" }}
      >
        <div style={{ marginTop: 16 }}>
          <Text type="secondary" style={{ display: "block", marginBottom: 20 }}>
            استخدم ده لو العميل وافق أو رفض السعر تليفونيًا وعايز تسجل القرار
            يدويًا بدل ما تستنى العميل يعمله من التطبيق.
          </Text>
          <Space
            style={{ width: "100%", justifyContent: "center" }}
            size="middle"
          >
            <Popconfirm
              title="تأكيد موافقة العميل على السعر؟"
              onConfirm={() => handleConfirmPriceOnBehalf(true)}
              okText="تأكيد"
              cancelText="تراجع"
            >
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                loading={confirmingPrice}
                style={{ background: "#52c41a", borderColor: "#52c41a" }}
              >
                العميل وافق
              </Button>
            </Popconfirm>
            <Popconfirm
              title="تأكيد رفض العميل للسعر؟ الحجز هيتلغي."
              onConfirm={() => handleConfirmPriceOnBehalf(false)}
              okText="تأكيد الرفض"
              cancelText="تراجع"
              okButtonProps={{ danger: true }}
            >
              <Button
                danger
                icon={<CloseCircleOutlined />}
                loading={confirmingPrice}
              >
                العميل رفض
              </Button>
            </Popconfirm>
          </Space>
        </div>
      </Modal>

      {/* Assign Provider Modal */}
      <Modal
        title={
          <span style={{ fontFamily: "'Cairo', sans-serif", fontWeight: 700 }}>
            {booking.provider_name
              ? "تغيير الفني المُعيَّن"
              : "تعيين فني للحجز"}
          </span>
        }
        open={assignModalOpen}
        onOk={handleAssignProvider}
        onCancel={() => setAssignModalOpen(false)}
        okText="تعيين"
        cancelText="إلغاء"
        confirmLoading={assigning}
        okButtonProps={{
          style: { background: "#0f1f1a", borderColor: "#0f1f1a" },
        }}
        style={{ direction: "rtl", fontFamily: "'Cairo', sans-serif" }}
      >
        <div style={{ marginTop: 16 }}>
          {booking.provider_name && (
            <div
              style={{
                marginBottom: 16,
                padding: "10px 14px",
                background: "#f5f5f5",
                borderRadius: 8,
              }}
            >
              <Text type="secondary">الفني الحالي: </Text>
              <Text strong>{booking.provider_name}</Text>
            </div>
          )}
          <div style={{ marginBottom: 8, color: "#333", fontWeight: 600 }}>
            اختر الفني:
          </div>
          {loadingProviders ? (
            <div style={{ textAlign: "center", padding: 24 }}>
              <Spin />
            </div>
          ) : availableProviders.length === 0 ? (
            <Text type="secondary">لا يوجد فنيين متاحين لهذه الخدمة</Text>
          ) : (
            <Select
              placeholder="اختر فني من القائمة"
              value={selectedProvider}
              onChange={setSelectedProvider}
              style={{ width: "100%" }}
              showSearch
              optionFilterProp="children"
            >
              {availableProviders.map((p) => (
                <Option key={p.id} value={p.id}>
                  <Space>
                    <UserOutlined />
                    <span>{p.name}</span>
                    {p.phone_number && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {p.phone_number}
                      </Text>
                    )}
                    {p.specialization && (
                      <Tag color="blue" style={{ fontSize: 11 }}>
                        {p.specialization}
                      </Tag>
                    )}
                  </Space>
                </Option>
              ))}
            </Select>
          )}
        </div>
      </Modal>
    </div>
  );
}
