import { useEffect, useState, useCallback } from "react";
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Tag,
  Typography,
  Button,
  Space,
  Empty,
  Avatar,
  Alert,
  message,
} from "antd";
import {
  StopOutlined,
  DollarOutlined,
  WalletOutlined,
  UserOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import api from "../../api/axios";

const { Text } = Typography;

const cardStyle = {
  borderRadius: 16,
  boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
};

export default function PaymentsOverview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/payments/admin/payments/dashboard-overview/");
      setData(res.data);
    } catch {
      message.error("فشل تحميل نظرة المدفوعات العامة");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const stats = [
    {
      title: "فنيون مقفولون",
      value: data?.blocked_providers_count ?? 0,
      icon: <StopOutlined />,
      color: "#ff4d4f",
      bg: "#fff2f0",
      suffix: "فني",
    },
    {
      title: "إجمالي المستحقات المعلقة",
      value: parseFloat(data?.total_outstanding_amount ?? 0).toLocaleString(
        "ar-SA"
      ),
      icon: <ExclamationCircleOutlined />,
      color: "#fa8c16",
      bg: "#fff7e6",
      suffix: "ر.س",
    },
    {
      title: "إجمالي أرصدة المحافظ",
      value: parseFloat(data?.total_wallet_balance ?? 0).toLocaleString(
        "ar-SA"
      ),
      icon: <WalletOutlined />,
      color: "#52c41a",
      bg: "#f6ffed",
      suffix: "ر.س",
    },
  ];

  const blockedColumns = [
    {
      title: "الفني",
      key: "provider",
      render: (_, r) => (
        <Space>
          <Avatar
            size={30}
            icon={<UserOutlined />}
            style={{ background: "#ff4d4f", flexShrink: 0 }}
          />
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>
              {r.provider_name || "—"}
            </div>
            <Text
              type="secondary"
              style={{ fontSize: 11, direction: "ltr", display: "block" }}
            >
              {r.provider_phone}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "المستحقات المعلقة",
      dataIndex: "outstanding_amount",
      key: "amount",
      render: (v) => (
        <Text style={{ color: "#ff4d4f", fontWeight: 700 }}>
          {parseFloat(v).toLocaleString("ar-SA")} ر.س
        </Text>
      ),
    },
    {
      title: "تاريخ القفل",
      dataIndex: "blocked_at",
      key: "blocked_at",
      render: (v) => (v ? new Date(v).toLocaleString("ar-SA") : "—"),
    },
  ];

  const staleBatchTypeLabel = {
    payout: "تحويل أرصدة",
    due_collection: "تحصيل مستحقات",
  };

  return (
    <div style={{ fontFamily: "'Cairo', sans-serif" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 16,
        }}
      >
        <Button
          icon={<ReloadOutlined />}
          onClick={fetchOverview}
          loading={loading}
          style={{ fontFamily: "'Cairo', sans-serif" }}
        >
          تحديث
        </Button>
      </div>

      {/* ── Stats ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {stats.map((s) => (
          <Col xs={24} sm={12} lg={8} key={s.title}>
            <Card
              bordered={false}
              style={cardStyle}
              bodyStyle={{ padding: "20px 24px" }}
              loading={loading}
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
                  valueStyle={{ color: s.color, fontWeight: 700, fontSize: 22 }}
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
          </Col>
        ))}
      </Row>

      {/* ── Stale Batches Alert ── */}
      {data?.stale_batches?.length > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 20, borderRadius: 12 }}
          message={
            <span style={{ fontWeight: 700 }}>
              فيه {data.stale_batches.length} دفعة (batch) متأخرة عن أسبوع لسه
              مش مكتملة
            </span>
          }
          description={
            <div style={{ marginTop: 8 }}>
              {data.stale_batches.map((b) => (
                <div
                  key={`${b.batch_type}-${b.id}`}
                  style={{ marginBottom: 4 }}
                >
                  <Tag color={b.batch_type === "payout" ? "blue" : "purple"}>
                    {staleBatchTypeLabel[b.batch_type] ?? b.batch_type}
                  </Tag>
                  <Text style={{ fontSize: 12 }}>
                    {b.week_start} → {b.week_end} · الحالة: {b.status} ·{" "}
                    <Text type="danger">متأخرة {b.days_overdue} يوم</Text>
                  </Text>
                </div>
              ))}
            </div>
          }
        />
      )}

      {/* ── Blocked Providers Table ── */}
      <Card
        bordered={false}
        style={cardStyle}
        title={
          <Space>
            <StopOutlined style={{ color: "#ff4d4f" }} />
            <span style={{ fontWeight: 700 }}>الفنيون المقفولون حاليًا</span>
            <Tag color="error">{data?.blocked_providers?.length ?? 0}</Tag>
          </Space>
        }
      >
        <Table
          dataSource={data?.blocked_providers ?? []}
          columns={blockedColumns}
          rowKey={(r) => r.provider_id}
          loading={loading}
          pagination={false}
          size="middle"
          locale={{
            emptyText: (
              <Empty
                description="لا يوجد فنيون مقفولون حاليًا"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
        />
      </Card>
    </div>
  );
}
