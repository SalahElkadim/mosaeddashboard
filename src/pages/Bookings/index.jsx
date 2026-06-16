import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Space,
  Input,
  Tag,
  Popconfirm,
  message,
  Card,
  Row,
  Col,
  Statistic,
  Tooltip,
  Select,
  Modal,
  Typography,
  Badge,
} from "antd";
import {
  EyeOutlined,
  DeleteOutlined,
  SearchOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  EditOutlined,
  TagOutlined,
  CarOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

const { Search } = Input;
const { Text } = Typography;
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

export default function Bookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = statusFilter !== "all" ? `?status=${statusFilter}` : "";
      const res = await api.get(`/existedservices/admin/bookings/${params}`);
      const data = Array.isArray(res.data) ? res.data : res.data.results ?? [];
      setBookings(data);
    } catch {
      message.error("فشل تحميل الحجوزات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const openStatusModal = (booking) => {
    setSelectedBooking(booking);
    setNewStatus(booking.status);
    setStatusModalOpen(true);
  };

  const handleUpdateStatus = async () => {
    try {
      setUpdating(true);
      await api.post(
        `/existedservices/admin/bookings/${selectedBooking.id}/status/`,
        { status: newStatus }
      );
      message.success("تم تحديث حالة الحجز بنجاح");
      setStatusModalOpen(false);
      fetchBookings();
    } catch {
      message.error("فشل تحديث الحالة");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.post(`/existedservices/admin/bookings/${id}/status/`, {
        status: "cancelled",
      });
      message.success("تم إلغاء الحجز");
      fetchBookings();
    } catch {
      message.error("فشل إلغاء الحجز");
    }
  };

  const filtered = bookings.filter((b) => {
    const search = searchText.toLowerCase();
    return (
      (b.id ?? "").toString().includes(search) ||
      (b.customer_name ?? "").toLowerCase().includes(search) ||
      (b.service_title ?? "").toLowerCase().includes(search) ||
      (b.provider_name ?? "").toLowerCase().includes(search) ||
      (b.coupon_code ?? "").toLowerCase().includes(search)
    );
  });

  const counts = {
    all: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    completed: bookings.filter((b) => b.status === "completed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  };

  // إجمالي الخصومات على الحجوزات الكلها
  const totalDiscount = bookings.reduce(
    (sum, b) => sum + parseFloat(b.discount_amount ?? 0),
    0
  );

  const columns = [
    {
      title: "رقم الحجز",
      dataIndex: "id",
      key: "id",
      render: (v) => (
        <Text
          style={{ fontWeight: 600, color: "#0f1f1a", fontFamily: "monospace" }}
        >
          #{String(v).slice(0, 8)}
        </Text>
      ),
    },
    {
      title: "العميل",
      key: "customer",
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600, color: "#1a1a2e" }}>
            {r.customer_name ?? "—"}
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {r.customer_phone ?? ""}
          </Text>
        </div>
      ),
    },
    {
      title: "الخدمة",
      key: "service",
      render: (_, r) => (
        <Tag color="orange" style={{ borderRadius: 6 }}>
          {r.service_title ?? "—"}
        </Tag>
      ),
    },
    {
      title: "مزود الخدمة",
      key: "provider",
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 500, color: "#1a1a2e" }}>
            {r.provider_name ?? "—"}
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {r.provider_phone ?? ""}
          </Text>
        </div>
      ),
    },
    /* ─── عمود الخصم ─────────────────────────────────────── */
    {
      title: "التكلفة والخصم",
      key: "pricing",
      render: (_, r) => {
        const hasDiscount =
          r.coupon_code || parseFloat(r.discount_amount ?? 0) > 0;
        const visitCost = parseFloat(r.service_visit_cost ?? 0);
        const hasVisitCost = visitCost > 0;

        return (
          <div style={{ minWidth: 150 }}>
            {/* تكلفة الزيارة */}
            {hasVisitCost && (
              <div style={{ marginBottom: 4 }}>
                <Tag
                  icon={<CarOutlined />}
                  color="blue"
                  style={{ borderRadius: 6, fontSize: 11 }}
                >
                  زيارة: {visitCost.toFixed(2)} ر.س
                </Tag>
              </div>
            )}

            {hasDiscount ? (
              <>
                {/* كوبون الخصم */}
                {r.coupon_code && (
                  <div style={{ marginBottom: 4 }}>
                    <Tag
                      icon={<TagOutlined />}
                      color="purple"
                      style={{ borderRadius: 6, fontSize: 11 }}
                    >
                      {r.coupon_code}
                    </Tag>
                  </div>
                )}

                {/* السعر الأصلي مشطوب */}
                <div>
                  <Text delete type="secondary" style={{ fontSize: 12 }}>
                    {parseFloat(r.total_cost ?? 0).toFixed(2)} ر.س
                  </Text>
                </div>

                {/* قيمة الخصم */}
                <div>
                  <Text style={{ color: "#f5222d", fontSize: 12 }}>
                    − {parseFloat(r.discount_amount ?? 0).toFixed(2)} ر.س
                  </Text>
                </div>

                {/* السعر النهائي (خدمات + زيارة) */}
                <div>
                  <Text
                    style={{ color: "#52c41a", fontWeight: 700, fontSize: 14 }}
                  >
                    {(
                      parseFloat(r.final_cost ?? r.total_cost ?? 0) + visitCost
                    ).toFixed(2)}{" "}
                    ر.س
                  </Text>
                </div>
              </>
            ) : (
              /* لا يوجد خصم */
              <Text style={{ fontWeight: 600, fontSize: 14 }}>
                {(parseFloat(r.total_cost ?? 0) + visitCost).toFixed(2)} ر.س
              </Text>
            )}
          </div>
        );
      },
    },
    /* ────────────────────────────────────────────────────── */
    {
      title: "تاريخ الموعد",
      dataIndex: "scheduled_date",
      key: "scheduled_date",
      render: (v) => (v ? new Date(v).toLocaleDateString("ar-SA") : "—"),
    },
    {
      title: "الحالة",
      dataIndex: "status",
      key: "status",
      render: (v) => {
        const s = STATUS_MAP[v] ?? { label: v, color: "default", icon: null };
        return (
          <Tag
            icon={s.icon}
            color={s.color}
            style={{ borderRadius: 20, padding: "2px 10px", fontWeight: 600 }}
          >
            {s.label}
          </Tag>
        );
      },
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
              onClick={() => navigate(`/bookings/${r.id}`)}
              style={{ color: "#1677ff" }}
            />
          </Tooltip>
          <Tooltip title="تغيير الحالة">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => openStatusModal(r)}
              style={{ color: "#e07b1a" }}
              disabled={r.status === "cancelled" || r.status === "completed"}
            />
          </Tooltip>
          <Popconfirm
            title="إلغاء الحجز؟"
            description="سيتم تغيير حالة الحجز إلى ملغي."
            onConfirm={() => handleDelete(r.id)}
            okText="إلغاء الحجز"
            cancelText="تراجع"
            okButtonProps={{ danger: true }}
            disabled={r.status === "cancelled"}
          >
            <Tooltip title="إلغاء الحجز">
              <Button
                type="text"
                icon={<DeleteOutlined />}
                style={{ color: r.status === "cancelled" ? "#ccc" : "#ff4d4f" }}
                disabled={r.status === "cancelled"}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const statCards = [
    {
      title: "إجمالي الحجوزات",
      value: counts.all,
      color: "#e07b1a",
      bg: "#fff7e6",
      icon: <CalendarOutlined />,
    },
    {
      title: "قيد الانتظار",
      value: counts.pending,
      color: "#fa8c16",
      bg: "#fff7e6",
      icon: <ClockCircleOutlined />,
    },
    {
      title: "مؤكدة",
      value: counts.confirmed,
      color: "#1677ff",
      bg: "#e6f4ff",
      icon: <SyncOutlined />,
    },
    {
      title: "مكتملة",
      value: counts.completed,
      color: "#52c41a",
      bg: "#f6ffed",
      icon: <CheckCircleOutlined />,
    },
    {
      title: "ملغاة",
      value: counts.cancelled,
      color: "#ff4d4f",
      bg: "#fff2f0",
      icon: <CloseCircleOutlined />,
    },
    {
      title: "إجمالي الخصومات",
      value: totalDiscount.toFixed(2),
      suffix: " ر.س",
      color: "#722ed1",
      bg: "#f9f0ff",
      icon: <TagOutlined />,
    },
  ];

  return (
    <div style={{ fontFamily: "'Cairo', sans-serif" }}>
      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {statCards.map((s, i) => (
          <Col
            xs={24}
            sm={12}
            md={8}
            lg={6}
            xl={4}
            key={i}
            style={{ marginBottom: 8 }}
          >
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
                suffix={s.suffix}
                valueStyle={{ color: s.color, fontWeight: 700, fontSize: 22 }}
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
            الحجوزات
          </h2>
          <Space wrap>
            <Search
              placeholder="بحث برقم الحجز أو العميل أو الخدمة أو الكوبون..."
              allowClear
              style={{ width: 300 }}
              prefix={<SearchOutlined style={{ color: "#bbb" }} />}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Space>
              {["all", "pending", "confirmed", "completed", "cancelled"].map(
                (f) => (
                  <Button
                    key={f}
                    size="small"
                    type={statusFilter === f ? "primary" : "default"}
                    onClick={() => setStatusFilter(f)}
                    style={
                      statusFilter === f
                        ? { background: "#0f1f1a", borderColor: "#0f1f1a" }
                        : {}
                    }
                  >
                    {f === "all" ? "الكل" : STATUS_MAP[f]?.label ?? f}
                    {f !== "all" && (
                      <Badge
                        count={counts[f]}
                        showZero
                        style={{
                          marginRight: 4,
                          background: statusFilter === f ? "#e07b1a" : "#ccc",
                          fontSize: 10,
                        }}
                      />
                    )}
                  </Button>
                )
              )}
            </Space>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={filtered}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1100 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total) => `${total} حجز`,
          }}
          style={{ padding: "0 8px" }}
        />
      </Card>

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
        {selectedBooking && (
          <div style={{ marginTop: 16 }}>
            <div style={{ marginBottom: 12, color: "#555" }}>
              رقم الحجز:{" "}
              <strong style={{ fontFamily: "monospace" }}>
                #{String(selectedBooking.id).slice(0, 8)}
              </strong>
            </div>
            <Select
              value={newStatus}
              onChange={setNewStatus}
              style={{ width: "100%" }}
              placeholder="اختر الحالة الجديدة"
            >
              {Object.entries(STATUS_MAP).map(([key, val]) => (
                <Option key={key} value={key}>
                  <Space>
                    {val.icon}
                    {val.label}
                  </Space>
                </Option>
              ))}
            </Select>
          </div>
        )}
      </Modal>
    </div>
  );
}
