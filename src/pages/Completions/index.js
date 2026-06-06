import { useState, useEffect } from "react";
import {
  Table,
  Card,
  Tag,
  Button,
  Input,
  Space,
  Avatar,
  Typography,
  Row,
  Col,
  Statistic,
  Tooltip,
  message,
  Badge,
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  SearchOutlined,
  FileProtectOutlined,
  CalendarOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

const { Text } = Typography;
const { Search } = Input;

const fmt = (v) => (v ? new Date(v).toLocaleDateString("ar-SA") : "—");

export default function Completions() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const fetchCompletedBookings = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        "/existedservices/admin/bookings/?status=completed"
      );
      const data = Array.isArray(res.data) ? res.data : res.data.results ?? [];
      setBookings(data);
    } catch {
      message.error("فشل تحميل بيانات إتمام الخدمات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompletedBookings();
  }, []);

  const filtered = bookings.filter(
    (b) =>
      (b.service_title ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (b.customer_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (b.provider_name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      title: "الحجز",
      key: "booking",
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 700, color: "#0f1f1a", fontSize: 13 }}>
            {r.service_title}
          </div>
          <Text type="secondary" style={{ fontSize: 11 }}>
            #{String(r.id).slice(0, 8)}
          </Text>
        </div>
      ),
    },
    {
      title: "العميل",
      key: "customer",
      render: (_, r) => (
        <Space>
          <Avatar size={32} style={{ background: "#e07b1a", fontSize: 13 }}>
            {(r.customer_name ?? "؟")[0]}
          </Avatar>
          <div>
            <div style={{ fontWeight: 600, fontSize: 12 }}>
              {r.customer_name}
            </div>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {r.customer_phone}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "الفني",
      key: "provider",
      render: (_, r) => (
        <Space>
          <Avatar size={32} style={{ background: "#0f1f1a", fontSize: 13 }}>
            {(r.provider_name ?? "؟")[0]}
          </Avatar>
          <div>
            <div style={{ fontWeight: 600, fontSize: 12 }}>
              {r.provider_name ?? "—"}
            </div>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {r.provider_phone}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "تاريخ الخدمة",
      dataIndex: "scheduled_date",
      key: "scheduled_date",
      render: (v) => (
        <Space size={4}>
          <CalendarOutlined style={{ color: "#888", fontSize: 12 }} />
          <Text style={{ fontSize: 12 }}>{fmt(v)}</Text>
        </Space>
      ),
    },
    /* ── عمود التكلفة المُصلح ── */
    {
      title: "التكلفة",
      key: "cost",
      render: (_, r) => {
        const hasDiscount = parseFloat(r.discount_amount ?? 0) > 0;
        return hasDiscount ? (
          <Space direction="vertical" size={0}>
            <Text delete type="secondary" style={{ fontSize: 11 }}>
              {Number(r.total_cost).toLocaleString("ar-SA")} ر.س
            </Text>
            <Tag
              color="green"
              style={{ fontWeight: 700, borderRadius: 6, margin: 0 }}
            >
              {Number(r.final_cost).toLocaleString("ar-SA")} ر.س
            </Tag>
          </Space>
        ) : (
          <Tag color="orange" style={{ fontWeight: 700, borderRadius: 6 }}>
            {Number(r.final_cost ?? r.total_cost).toLocaleString("ar-SA")} ر.س
          </Tag>
        );
      },
    },
    /* ─────────────────────────── */
    {
      title: "نموذج الإتمام",
      key: "form_status",
      render: (_, r) => <CompletionStatusBadge bookingId={r.id} />,
    },
    {
      title: "عرض",
      key: "actions",
      fixed: "left",
      render: (_, r) => (
        <Tooltip title="عرض نموذج الإتمام">
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/completions/${r.id}`)}
            style={{
              background: "#0f1f1a",
              borderColor: "#0f1f1a",
              borderRadius: 6,
            }}
          >
            عرض
          </Button>
        </Tooltip>
      ),
    },
  ];

  return (
    <div style={{ fontFamily: "'Cairo', sans-serif" }}>
      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {[
          {
            title: "إجمالي الخدمات المكتملة",
            value: bookings.length,
            icon: <FileProtectOutlined />,
            color: "#0f1f1a",
            bg: "#f0f4f2",
          },
          {
            title: "فنيو الخدمة المشاركون",
            value: new Set(bookings.map((b) => b.provider_name).filter(Boolean))
              .size,
            icon: <TeamOutlined />,
            color: "#1677ff",
            bg: "#e6f4ff",
          },
          {
            title: "بانتظار رفع نموذج الإتمام",
            value: "—",
            icon: <ClockCircleOutlined />,
            color: "#faad14",
            bg: "#fffbe6",
          },
        ].map((s, i) => (
          <Col xs={24} sm={8} key={i}>
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
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid #f0f0f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 700,
                color: "#0f1f1a",
              }}
            >
              نماذج إتمام الخدمات
            </h2>
            <Text type="secondary" style={{ fontSize: 12 }}>
              الحجوزات المكتملة ونماذج الإتمام المقدمة من الفنيين
            </Text>
          </div>
          <Search
            placeholder="بحث بالخدمة أو العميل أو الفني..."
            allowClear
            style={{ width: 260 }}
            prefix={<SearchOutlined style={{ color: "#bbb" }} />}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Table
          columns={columns}
          dataSource={filtered}
          loading={loading}
          rowKey="id"
          scroll={{ x: 900 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total) => `${total} خدمة مكتملة`,
          }}
          style={{ padding: "0 8px" }}
        />
      </Card>
    </div>
  );
}

// ── مكوّن صغير بيعرض حالة النموذج ──
function CompletionStatusBadge({ bookingId }) {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    api
      .get(`/existedservices/provider/completion-forms/${bookingId}/`)
      .then((res) => {
        setStatus(res.data.is_finished ? "finished" : "pending");
      })
      .catch(() => setStatus("none"));
  }, [bookingId]);

  if (status === "loading")
    return <Badge status="processing" text="جارٍ التحميل..." />;
  if (status === "finished")
    return (
      <Tag
        color="success"
        icon={<CheckCircleOutlined />}
        style={{ borderRadius: 6 }}
      >
        مكتمل
      </Tag>
    );
  if (status === "pending")
    return (
      <Tag
        color="warning"
        icon={<ClockCircleOutlined />}
        style={{ borderRadius: 6 }}
      >
        بانتظار الإتمام
      </Tag>
    );
  return (
    <Tag color="default" style={{ borderRadius: 6 }}>
      لا يوجد نموذج
    </Tag>
  );
}
