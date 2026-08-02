import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Table,
  Tag,
  Space,
  Typography,
  Button,
  Statistic,
  Row,
  Col,
  Spin,
  Empty,
  message,
} from "antd";
import {
  ArrowRightOutlined,
  GiftOutlined,
  UserAddOutlined,
  CheckCircleOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import api from "../../api/axios";

const { Title, Text } = Typography;
const ACCENT = "#eb2f96";

export default function MarketingCodeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState(null);
  const [usages, setUsages] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/accounts/admin/marketing-codes/${id}/usages/`
      );
      setCode(res.data.code);
      setUsages(res.data.usages ?? []);
    } catch {
      message.error("فشل تحميل تقرير الكود");
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", paddingTop: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!code) {
    return <Empty description="الكود غير موجود" />;
  }

  const totalDiscountGiven = usages.reduce(
    (sum, u) => sum + parseFloat(u.discount_amount || 0),
    0
  );
  const conversionRate =
    code.signups_count > 0
      ? ((code.usages_count / code.signups_count) * 100).toFixed(0)
      : 0;

  const cardStyle = {
    borderRadius: 16,
    boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
  };
  const titleStyle = { fontFamily: "'Cairo', sans-serif", fontWeight: 700 };

  const columns = [
    {
      title: "العميل",
      dataIndex: "customer_name",
      key: "customer_name",
      render: (name) => <Text strong>{name || "—"}</Text>,
    },
    {
      title: "رقم الهاتف",
      dataIndex: "customer_phone",
      key: "customer_phone",
      render: (p) => (
        <Text style={{ direction: "ltr", display: "inline-block" }}>
          {p || "—"}
        </Text>
      ),
    },
    {
      title: "قيمة الخصم",
      dataIndex: "discount_amount",
      key: "discount_amount",
      align: "center",
      render: (v) => (
        <Text style={{ color: "#52c41a", fontWeight: 700 }}>
          {parseFloat(v).toLocaleString("ar-SA")} ر.س
        </Text>
      ),
    },
    {
      title: "تاريخ الاستخدام",
      dataIndex: "used_at",
      key: "used_at",
      render: (d) => (d ? new Date(d).toLocaleDateString("ar-SA") : "—"),
    },
  ];

  return (
    <div style={{ fontFamily: "'Cairo', sans-serif" }}>
      <Button
        type="text"
        icon={<ArrowRightOutlined />}
        onClick={() => navigate("/marketing-codes")}
        style={{ marginBottom: 16, fontFamily: "'Cairo', sans-serif" }}
      >
        رجوع لكل الأكواد
      </Button>

      <Space style={{ marginBottom: 20 }}>
        <GiftOutlined style={{ fontSize: 20, color: ACCENT }} />
        <Title level={4} style={{ margin: 0, color: "#1a2e25" }}>
          تقرير الكود:{" "}
          <span style={{ fontFamily: "monospace" }}>{code.code}</span>
        </Title>
        <Tag
          color={code.is_active ? "green" : "default"}
          style={{ borderRadius: 20 }}
        >
          {code.is_active ? "فعّال" : "متوقف"}
        </Tag>
      </Space>

      <Card
        bordered={false}
        style={{
          ...cardStyle,
          marginBottom: 20,
          border: `1px solid ${ACCENT}33`,
        }}
        bodyStyle={{ padding: "18px 22px" }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              المسوّق
            </Text>
            <div style={{ fontSize: 16, fontWeight: 700 }}>
              {code.owner_name}
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              نسبة الخصم
            </Text>
            <div style={{ fontSize: 16, fontWeight: 700, color: ACCENT }}>
              {code.discount_percentage}%
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              نسبة التفعيل الفعلي
            </Text>
            <div style={{ fontSize: 16, fontWeight: 700 }}>
              {conversionRate}%
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              تاريخ الإنشاء
            </Text>
            <div style={{ fontSize: 16, fontWeight: 700 }}>
              {code.created_at
                ? new Date(code.created_at).toLocaleDateString("ar-SA")
                : "—"}
            </div>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={8}>
          <Card
            bordered={false}
            style={cardStyle}
            bodyStyle={{ padding: "18px 22px" }}
          >
            <Statistic
              title="عملاء اتسجلوا بالكود"
              value={code.signups_count ?? 0}
              prefix={<UserAddOutlined style={{ color: "#1677ff" }} />}
              valueStyle={{ color: "#1677ff", fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            bordered={false}
            style={cardStyle}
            bodyStyle={{ padding: "18px 22px" }}
          >
            <Statistic
              title="استخدامات فعلية (حققوا أول طلب)"
              value={code.usages_count ?? 0}
              prefix={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
              valueStyle={{ color: "#52c41a", fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            bordered={false}
            style={cardStyle}
            bodyStyle={{ padding: "18px 22px" }}
          >
            <Statistic
              title="إجمالي الخصومات الممنوحة"
              value={totalDiscountGiven.toLocaleString("ar-SA")}
              suffix="ر.س"
              prefix={<DollarOutlined style={{ color: "#e07b1a" }} />}
              valueStyle={{ color: "#e07b1a", fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      <Card bordered={false} style={cardStyle} bodyStyle={{ padding: 0 }}>
        <div
          style={{ padding: "14px 20px", borderBottom: "1px solid #f0f0f0" }}
        >
          <span style={{ ...titleStyle, fontSize: 15 }}>
            العملاء اللي استخدموا الخصم فعليًا
          </span>
        </div>
        <Table
          dataSource={usages}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          size="middle"
          style={{ fontFamily: "'Cairo', sans-serif" }}
          locale={{
            emptyText: <Empty description="لسه محدش استخدم الخصم فعليًا" />,
          }}
        />
      </Card>
    </div>
  );
}
