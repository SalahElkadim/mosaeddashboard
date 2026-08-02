import { useEffect, useState, useCallback } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  Popconfirm,
  message,
  Typography,
  Empty,
  Tooltip,
  Statistic,
  Row,
  Col,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BarChartOutlined,
  GiftOutlined,
  UserAddOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

const { Title, Text } = Typography;

const ACCENT = "#eb2f96"; // هوية بصرية مميزة لقسم أكواد التسويق

export default function MarketingCodes() {
  const navigate = useNavigate();
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCode, setEditingCode] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const fetchCodes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/accounts/admin/marketing-codes/");
      setCodes(Array.isArray(res.data) ? res.data : res.data.results ?? []);
    } catch {
      message.error("فشل تحميل أكواد التسويق");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

  const openCreate = () => {
    setEditingCode(null);
    form.resetFields();
    form.setFieldsValue({ discount_percentage: 20, is_active: true });
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditingCode(record);
    form.setFieldsValue({
      code: record.code,
      owner_name: record.owner_name,
      discount_percentage: parseFloat(record.discount_percentage),
      is_active: record.is_active,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      if (editingCode) {
        await api.patch(
          `/accounts/admin/marketing-codes/${editingCode.id}/`,
          values
        );
        message.success("تم تحديث الكود بنجاح");
      } else {
        await api.post("/accounts/admin/marketing-codes/", values);
        message.success("تم إنشاء الكود بنجاح");
      }
      setModalOpen(false);
      fetchCodes();
    } catch (e) {
      if (e?.errorFields) return;
      const msg =
        e?.response?.data?.code?.[0] ||
        e?.response?.data?.error ||
        "فشل حفظ الكود";
      message.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (record) => {
    try {
      await api.patch(`/accounts/admin/marketing-codes/${record.id}/`, {
        is_active: !record.is_active,
      });
      message.success(record.is_active ? "تم تعطيل الكود" : "تم تفعيل الكود");
      fetchCodes();
    } catch {
      message.error("فشل تحديث حالة الكود");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/accounts/admin/marketing-codes/${id}/`);
      message.success("تم حذف الكود");
      fetchCodes();
    } catch {
      message.error("فشل حذف الكود");
    }
  };

  // ── إحصائيات سريعة أعلى الصفحة ──
  const totalCodes = codes.length;
  const totalSignups = codes.reduce((s, c) => s + (c.signups_count ?? 0), 0);
  const totalRedemptions = codes.reduce((s, c) => s + (c.usages_count ?? 0), 0);

  const columns = [
    {
      title: "الكود",
      dataIndex: "code",
      key: "code",
      render: (code) => (
        <Tag
          color={ACCENT}
          style={{
            fontFamily: "monospace",
            fontSize: 13,
            fontWeight: 700,
            borderRadius: 6,
            padding: "2px 10px",
          }}
        >
          {code}
        </Tag>
      ),
    },
    {
      title: "المسوّق",
      dataIndex: "owner_name",
      key: "owner_name",
      render: (name) => <Text strong>{name}</Text>,
    },
    {
      title: "نسبة الخصم",
      dataIndex: "discount_percentage",
      key: "discount_percentage",
      align: "center",
      render: (v) => (
        <Text style={{ color: ACCENT, fontWeight: 700 }}>{v}%</Text>
      ),
    },
    {
      title: "تسجيلات",
      dataIndex: "signups_count",
      key: "signups_count",
      align: "center",
      render: (v) => v ?? 0,
    },
    {
      title: "استخدامات فعلية",
      dataIndex: "usages_count",
      key: "usages_count",
      align: "center",
      render: (v) => (
        <Tag color="green" style={{ borderRadius: 20 }}>
          {v ?? 0}
        </Tag>
      ),
    },
    {
      title: "الحالة",
      dataIndex: "is_active",
      key: "is_active",
      align: "center",
      render: (active, record) => (
        <Switch
          checked={active}
          checkedChildren="فعّال"
          unCheckedChildren="متوقف"
          onChange={() => toggleActive(record)}
          style={{ background: active ? ACCENT : undefined }}
        />
      ),
    },
    {
      title: "إجراءات",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="تقرير الاستخدام">
            <Button
              size="small"
              icon={<BarChartOutlined />}
              onClick={() => navigate(`/marketingcodedetail/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="تعديل">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="تأكيد حذف هذا الكود؟"
            description="لن يقدر أي عميل جديد يستخدمه بعد الحذف."
            onConfirm={() => handleDelete(record.id)}
            okText="نعم"
            cancelText="لا"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="حذف">
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const cardStyle = {
    borderRadius: 16,
    boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
  };
  const titleStyle = { fontFamily: "'Cairo', sans-serif", fontWeight: 700 };

  return (
    <div style={{ fontFamily: "'Cairo', sans-serif" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <Space>
          <GiftOutlined style={{ fontSize: 20, color: ACCENT }} />
          <Title level={4} style={{ margin: 0, color: "#1a2e25" }}>
            أكواد التسويق
          </Title>
        </Space>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreate}
          style={{ background: ACCENT, borderColor: ACCENT }}
        >
          كود جديد
        </Button>
      </div>

      {/* إحصائيات سريعة */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={8}>
          <Card
            bordered={false}
            style={cardStyle}
            bodyStyle={{ padding: "18px 22px" }}
          >
            <Statistic
              title="إجمالي الأكواد"
              value={totalCodes}
              prefix={<GiftOutlined style={{ color: ACCENT }} />}
              valueStyle={{ color: ACCENT, fontWeight: 700 }}
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
              title="عملاء اتسجلوا بأكواد"
              value={totalSignups}
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
              title="استخدامات فعلية (خصومات اتطبقت)"
              value={totalRedemptions}
              prefix={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
              valueStyle={{ color: "#52c41a", fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      <Card bordered={false} style={cardStyle} bodyStyle={{ padding: 0 }}>
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          <span style={{ ...titleStyle, fontSize: 15 }}>كل الأكواد</span>
        </div>
        <Table
          dataSource={codes}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          size="middle"
          style={{ fontFamily: "'Cairo', sans-serif" }}
          locale={{
            emptyText: <Empty description="لا توجد أكواد تسويقية بعد" />,
          }}
        />
      </Card>

      <Modal
        title={
          <Space style={{ fontFamily: "'Cairo', sans-serif", fontWeight: 700 }}>
            <GiftOutlined style={{ color: ACCENT }} />
            {editingCode ? "تعديل كود تسويقي" : "كود تسويقي جديد"}
          </Space>
        }
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        okText="حفظ"
        cancelText="إلغاء"
        confirmLoading={saving}
        okButtonProps={{ style: { background: ACCENT, borderColor: ACCENT } }}
        style={{ direction: "rtl", fontFamily: "'Cairo', sans-serif" }}
        width={440}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item
            name="code"
            label="الكود"
            rules={[{ required: true, message: "أدخل الكود" }]}
          >
            <Input
              placeholder="مثال: AHMED20"
              style={{ fontFamily: "monospace" }}
            />
          </Form.Item>
          <Form.Item
            name="owner_name"
            label="اسم المسوّق"
            rules={[{ required: true, message: "أدخل اسم المسوّق" }]}
          >
            <Input placeholder="اسم الشخص أو الجهة المسوّقة" />
          </Form.Item>
          <Form.Item
            name="discount_percentage"
            label="نسبة الخصم (%)"
            rules={[{ required: true, message: "أدخل نسبة الخصم" }]}
          >
            <InputNumber
              min={1}
              max={100}
              style={{ width: "100%" }}
              addonAfter="%"
            />
          </Form.Item>
          <Form.Item name="is_active" label="الحالة" valuePropName="checked">
            <Switch checkedChildren="فعّال" unCheckedChildren="متوقف" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
