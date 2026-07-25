import { useEffect, useState, useCallback } from "react";
import {
  Table,
  Card,
  Tag,
  Button,
  Space,
  Typography,
  Popconfirm,
  Input,
  message,
  Empty,
} from "antd";
import { CheckCircleOutlined, ReloadOutlined } from "@ant-design/icons";
import api from "../../../api/axios";

const { Text } = Typography;

const STATUS_COLOR = {
  pending: "#fa8c16",
  processing: "#1677ff",
  completed: "#52c41a",
};
const STATUS_LABEL = {
  pending: "معلقة",
  processing: "جاري التنفيذ",
  completed: "مكتملة",
};
const ITEM_STATUS_COLOR = {
  pending: "#fa8c16",
  transferred: "#52c41a",
  failed: "#ff4d4f",
};
const ITEM_STATUS_LABEL = {
  pending: "معلق",
  transferred: "تم التحويل",
  failed: "فشل",
};

export default function PayoutBatches() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState(null);
  const [refNotes, setRefNotes] = useState({});

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/payments/admin/payments/payout-batches/");
      setBatches(Array.isArray(res.data) ? res.data : res.data.results ?? []);
    } catch {
      message.error("فشل تحميل دفعات التحويل");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const confirmTransfer = async (itemId) => {
    setConfirmingId(itemId);
    try {
      await api.post(
        `/payments/admin/payments/payout-items/${itemId}/confirm/`,
        {
          reference_note: refNotes[itemId] || "",
        }
      );
      message.success("تم تأكيد التحويل بنجاح");
      fetchBatches();
    } catch {
      message.error("فشل تأكيد التحويل");
    }
    setConfirmingId(null);
  };

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
      title: "المبلغ",
      dataIndex: "amount",
      key: "amount",
      render: (v) => (
        <Text style={{ color: "#52c41a", fontWeight: 700 }}>
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
      title: "ملاحظة/رقم الحوالة",
      key: "note",
      render: (_, r) =>
        r.status === "transferred" ? (
          <Text style={{ fontSize: 12 }}>{r.admin_reference_note || "—"}</Text>
        ) : (
          <Input
            size="small"
            placeholder="رقم الحوالة (اختياري)"
            style={{ width: 160 }}
            onChange={(e) =>
              setRefNotes((prev) => ({ ...prev, [r.id]: e.target.value }))
            }
          />
        ),
    },
    {
      title: "إجراء",
      key: "action",
      render: (_, r) =>
        r.status === "transferred" ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            تم
          </Tag>
        ) : (
          <Popconfirm
            title="تأكيد إنك حوّلت المبلغ بنكيًا فعليًا؟"
            onConfirm={() => confirmTransfer(r.id)}
            okText="نعم، تم التحويل"
            cancelText="إلغاء"
          >
            <Button
              size="small"
              type="primary"
              icon={<CheckCircleOutlined />}
              loading={confirmingId === r.id}
              style={{ background: "#52c41a", borderColor: "#52c41a" }}
            >
              تأكيد التحويل
            </Button>
          </Popconfirm>
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
      title: "إجمالي المبلغ",
      dataIndex: "total_amount",
      key: "total_amount",
      render: (v) => (
        <Text style={{ fontWeight: 700 }}>
          {parseFloat(v).toLocaleString("ar-SA")} ر.س
        </Text>
      ),
    },
    {
      title: "عدد الفنيين",
      key: "count",
      render: (_, r) => r.items?.length ?? 0,
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
        <span style={{ fontWeight: 700 }}>دفعات تحويل الأرصدة الأسبوعية</span>
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
              description="لا توجد دفعات تحويل"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ),
        }}
      />
    </Card>
  );
}
