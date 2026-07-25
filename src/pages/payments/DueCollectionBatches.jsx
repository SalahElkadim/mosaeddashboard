import { useEffect, useState, useCallback } from "react";
import { Table, Card, Tag, Button, Typography, message, Empty } from "antd";
import { ReloadOutlined, LinkOutlined } from "@ant-design/icons";
import api from "../../api/axios";

const { Text } = Typography;

const STATUS_COLOR = {
  pending: "#fa8c16",
  processing: "#1677ff",
  completed: "#52c41a",
};
const STATUS_LABEL = {
  pending: "معلقة",
  processing: "جاري التحصيل",
  completed: "مكتملة",
};
const ITEM_STATUS_COLOR = {
  pending: "#fa8c16",
  paid: "#52c41a",
  failed: "#ff4d4f",
};
const ITEM_STATUS_LABEL = {
  pending: "لم يدفع بعد",
  paid: "دفع",
  failed: "فشل",
};

export default function DueCollectionBatches() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    try {
      // في fetchBatches
      const res = await api.get(
        "/payments/admin/payments/due-collection-batches/"
      );
      setBatches(Array.isArray(res.data) ? res.data : res.data.results ?? []);
    } catch {
      message.error("فشل تحميل دفعات التحصيل");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const itemColumns = [
    {
      title: "الفني",
      key: "provider",
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{r.provider_name}</div>
          <Text
            type="secondary"
            style={{ fontSize: 11, direction: "ltr", display: "block" }}
          >
            {r.provider_phone}
          </Text>
        </div>
      ),
    },
    {
      title: "المستحق",
      dataIndex: "amount_due",
      key: "amount_due",
      render: (v) => (
        <Text style={{ fontWeight: 700 }}>
          {parseFloat(v).toLocaleString("ar-SA")} ر.س
        </Text>
      ),
    },
    {
      title: "الحالة",
      dataIndex: "status",
      key: "status",
      render: (s) => (
        <Tag color={ITEM_STATUS_COLOR[s]} style={{ borderRadius: 20 }}>
          {ITEM_STATUS_LABEL[s] ?? s}
        </Tag>
      ),
    },
    {
      title: "تاريخ الدفع",
      dataIndex: "paid_at",
      key: "paid_at",
      render: (v) => (v ? new Date(v).toLocaleString("ar-SA") : "—"),
    },
    {
      title: "رابط الدفع",
      dataIndex: "payment_link",
      key: "payment_link",
      render: (v) =>
        v ? (
          <a href={v} target="_blank" rel="noreferrer">
            <LinkOutlined /> فتح الرابط
          </a>
        ) : (
          "—"
        ),
    },
  ];

  const batchColumns = [
    {
      title: "الأسبوع",
      key: "week",
      render: (_, r) => (
        <Text style={{ fontSize: 13 }}>
          {r.week_start} → {r.week_end}
        </Text>
      ),
    },
    {
      title: "الحالة",
      dataIndex: "status",
      key: "status",
      render: (s) => (
        <Tag color={STATUS_COLOR[s]} style={{ borderRadius: 20 }}>
          {STATUS_LABEL[s] ?? s}
        </Tag>
      ),
    },
    {
      title: "عدد الفنيين",
      key: "count",
      render: (_, r) => r.items?.length ?? 0,
    },
    {
      title: "المدفوع / الإجمالي",
      key: "progress",
      render: (_, r) => {
        const total = r.items?.length ?? 0;
        const paid = r.items?.filter((i) => i.status === "paid").length ?? 0;
        return (
          <Text style={{ fontWeight: 600 }}>
            {paid} / {total}
          </Text>
        );
      },
    },
    {
      title: "تاريخ الإنشاء",
      dataIndex: "created_at",
      key: "created_at",
      render: (v) => (v ? new Date(v).toLocaleDateString("ar-SA") : "—"),
    },
  ];

  return (
    <Card
      bordered={false}
      style={{ borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
      title={
        <span style={{ fontWeight: 700 }}>دفعات تحصيل المستحقات الأسبوعية</span>
      }
      extra={
        <Button
          icon={<ReloadOutlined />}
          onClick={fetchBatches}
          loading={loading}
        >
          تحديث
        </Button>
      }
    >
      <Table
        dataSource={batches}
        columns={batchColumns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        expandable={{
          expandedRowRender: (record) => (
            <Table
              dataSource={record.items}
              columns={itemColumns}
              rowKey="id"
              pagination={false}
              size="small"
            />
          ),
        }}
        locale={{
          emptyText: (
            <Empty
              description="لا توجد دفعات تحصيل"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ),
        }}
      />
    </Card>
  );
}
