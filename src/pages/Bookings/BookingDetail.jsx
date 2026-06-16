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
  Popconfirm,
  Typography,
  Row,
  Col,
  Timeline,
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
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";

const { Title, Text } = Typography;
const { Option } = Select;

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

// Timeline steps for booking flow
const STATUS_STEPS = ["pending", "confirmed", "completed"];

export default function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [updating, setUpdating] = useState(false);

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

  const openStatusModal = () => {
    setNewStatus(booking.status);
    setStatusModalOpen(true);
  };

  const handleUpdateStatus = async () => {
    try {
      setUpdating(true);
      await api.post(`/existedservices/admin/bookings/${id}/status/`, {
        status: newStatus,
      });
      message.success("تم تحديث حالة الحجز بنجاح");
      setStatusModalOpen(false);
      fetchBooking();
    } catch {
      message.error("فشل تحديث الحالة");
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

  // Find current step index for timeline
  const currentStepIdx =
    booking.status === "cancelled" ? -1 : STATUS_STEPS.indexOf(booking.status);

  const address = booking.address ?? null;
  const items = booking.items ?? [];

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

        <Space>
          {booking.status !== "cancelled" && booking.status !== "completed" && (
            <>
              <Button
                icon={<EditOutlined />}
                onClick={openStatusModal}
                style={{ borderColor: "#e07b1a", color: "#e07b1a" }}
              >
                تغيير الحالة
              </Button>
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
            </>
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
                        width: 80,
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
              {booking.total_cost && (
                <Descriptions.Item label="السعر الإجمالي">
                  <Text
                    style={{ color: "#52c41a", fontWeight: 700, fontSize: 16 }}
                  >
                    {booking.total_cost} ر.س
                  </Text>
                </Descriptions.Item>
              )}
              {/* التكلفة الإجمالية = خدمات + زيارة */}
              {booking.service_visit_cost != null && (
                <Descriptions.Item label="الإجمالي الكلي (شامل الزيارة)">
                  <Text
                    style={{ color: "#52c41a", fontWeight: 700, fontSize: 16 }}
                  >
                    {(
                      parseFloat(
                        booking.final_cost ?? booking.total_cost ?? 0
                      ) + parseFloat(booking.service_visit_cost ?? 0)
                    ).toFixed(2)}{" "}
                    ر.س
                  </Text>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          {/* Items / Attributes */}
          {items.length > 0 && (
            <Card
              title={
                <Space>
                  <AppstoreOutlined style={{ color: "#e07b1a" }} />
                  <span>تفاصيل الطلب</span>
                </Space>
              }
              bordered={false}
              style={{
                borderRadius: 12,
                marginBottom: 16,
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}
            >
              {items.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 0",
                    borderBottom:
                      idx < items.length - 1 ? "1px solid #f0f0f0" : "none",
                  }}
                >
                  <Text>{item.attribute_name ?? `بند ${idx + 1}`}</Text>
                  <Space>
                    <Tag color="orange">الكمية: {item.value}</Tag>
                    {item.unit_cost_snapshot && (
                      <Text type="secondary">
                        {item.unit_cost_snapshot} ر.س/وحدة
                      </Text>
                    )}
                    {item.cost && (
                      <Text strong style={{ color: "#0f1f1a" }}>
                        {item.cost} ر.س
                      </Text>
                    )}
                  </Space>
                </div>
              ))}
            </Card>
          )}

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
                style={{ background: "#0f1f1a", marginBottom: 12 }}
              />
              <div style={{ fontWeight: 700, fontSize: 16, color: "#0f1f1a" }}>
                {booking.provider_name ?? "مزود الخدمة"}
              </div>
              <Tag color="green" style={{ marginTop: 4 }}>
                مزود خدمة
              </Tag>
            </div>
            <Divider style={{ margin: "12px 0" }} />
            {booking.provider_phone && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <PhoneOutlined style={{ color: "#0f1f1a" }} />
                <Text style={{ direction: "ltr" }}>
                  {booking.provider_phone}
                </Text>
              </div>
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
          <Select
            value={newStatus}
            onChange={setNewStatus}
            style={{ width: "100%" }}
          >
            {Object.entries(STATUS_MAP).map(([key, val]) => (
              <Option key={key} value={key} disabled={key === booking.status}>
                <Space>
                  {val.icon}
                  {val.label}
                  {key === booking.status && (
                    <Text type="secondary">(الحالية)</Text>
                  )}
                </Space>
              </Option>
            ))}
          </Select>
        </div>
      </Modal>
    </div>
  );
}
