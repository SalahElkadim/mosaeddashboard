import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Space,
  Input,
  Tag,
  Switch,
  Popconfirm,
  message,
  Card,
  Modal,
  Form,
  Tooltip,
  Row,
  Col,
  Statistic,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ApartmentOutlined,
} from "@ant-design/icons";
import api from "../../api/axios";

const { Search } = Input;

export default function Specializations() {
  const [specializations, setSpecializations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const fetchSpecializations = async () => {
    setLoading(true);
    try {
      // جيب كل التخصصات (مش بس النشطة) — الأدمن يشوف الكل
      const res = await api.get("/accounts/specializations/");
      const data = Array.isArray(res.data) ? res.data : res.data.results ?? [];
      setSpecializations(data);
    } catch {
      message.error("فشل تحميل التخصصات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpecializations();
  }, []);

  const openModal = (record = null) => {
    setEditing(record);
    if (record) {
      form.setFieldsValue({
        name: record.name,
        description: record.description,
        is_active: record.is_active,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ is_active: true });
    }
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      if (editing) {
        await api.patch(`/accounts/specializations/${editing.id}/`, values);
        message.success("تم تحديث التخصص بنجاح");
      } else {
        await api.post("/accounts/specializations/", values);
        message.success("تم إضافة التخصص بنجاح");
      }
      setModalOpen(false);
      fetchSpecializations();
    } catch (e) {
      if (e?.errorFields) return;
      const data = e?.response?.data;
      if (data && typeof data === "object") {
        const firstMsg = Object.values(data).flat()[0];
        message.error(firstMsg || "فشل الحفظ");
      } else {
        message.error("فشل الحفظ، حاول مرة أخرى");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/accounts/specializations/${id}/`);
      message.success("تم حذف التخصص");
      fetchSpecializations();
    } catch {
      message.error("فشل الحذف");
    }
  };

  const handleToggleActive = async (record) => {
    try {
      await api.patch(`/accounts/specializations/${record.id}/`, {
        is_active: !record.is_active,
      });
      message.success(record.is_active ? "تم تعطيل التخصص" : "تم تفعيل التخصص");
      fetchSpecializations();
    } catch {
      message.error("فشل تغيير الحالة");
    }
  };

  const filtered = specializations.filter((s) =>
    (s.name ?? "").toLowerCase().includes(searchText.toLowerCase())
  );

  const activeCount = specializations.filter((s) => s.is_active).length;
  const inactiveCount = specializations.filter((s) => !s.is_active).length;

  const columns = [
    {
      title: "اسم التخصص",
      dataIndex: "name",
      key: "name",
      render: (v) => (
        <span style={{ fontWeight: 600, color: "#1a1a2e" }}>{v}</span>
      ),
    },
    {
      title: "الوصف",
      dataIndex: "description",
      key: "description",
      render: (v) => (
        <span style={{ color: "#666", fontSize: 13 }}>{v || "—"}</span>
      ),
    },
    {
      title: "عدد مزودي الخدمة",
      key: "providers_count",
      render: (_, r) => (
        <Tag color="blue">
          {r.providers?.length ?? r.providers_count ?? "—"}
        </Tag>
      ),
    },
    {
      title: "الحالة",
      key: "is_active",
      render: (_, r) => (
        <Switch
          checked={r.is_active}
          checkedChildren="نشط"
          unCheckedChildren="معطل"
          onChange={() => handleToggleActive(r)}
          style={r.is_active ? { background: "#52c41a" } : {}}
        />
      ),
    },
    {
      title: "تاريخ الإضافة",
      dataIndex: "created_at",
      key: "created_at",
      render: (v) => (v ? new Date(v).toLocaleDateString("ar-SA") : "—"),
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
              onClick={() => openModal(r)}
              style={{ color: "#e07b1a" }}
            />
          </Tooltip>
          <Popconfirm
            title="حذف التخصص؟"
            description="سيتم حذف التخصص نهائياً. تأكد أنه غير مرتبط بمزودين أو خدمات."
            onConfirm={() => handleDelete(r.id)}
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

  return (
    <div style={{ fontFamily: "'Cairo', sans-serif" }}>
      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {[
          {
            title: "إجمالي التخصصات",
            value: specializations.length,
            icon: <ApartmentOutlined />,
            color: "#e07b1a",
            bg: "#fff7e6",
          },
          {
            title: "التخصصات النشطة",
            value: activeCount,
            icon: <CheckCircleOutlined />,
            color: "#52c41a",
            bg: "#f6ffed",
          },
          {
            title: "التخصصات المعطلة",
            value: inactiveCount,
            icon: <CloseCircleOutlined />,
            color: "#ff4d4f",
            bg: "#fff2f0",
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
                valueStyle={{ color: s.color, fontWeight: 700, fontSize: 28 }}
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
        {/* Toolbar */}
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
            التخصصات
          </h2>
          <Space wrap>
            <Search
              placeholder="بحث باسم التخصص..."
              allowClear
              style={{ width: 220 }}
              prefix={<SearchOutlined style={{ color: "#bbb" }} />}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => openModal()}
              style={{ background: "#e07b1a", borderColor: "#e07b1a" }}
            >
              إضافة تخصص
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={filtered}
          loading={loading}
          rowKey="id"
          scroll={{ x: 700 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total) => `${total} تخصص`,
          }}
          style={{ padding: "0 8px" }}
        />
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        title={
          <span style={{ fontFamily: "'Cairo', sans-serif", fontWeight: 700 }}>
            {editing ? "تعديل التخصص" : "إضافة تخصص جديد"}
          </span>
        }
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        okText={editing ? "حفظ التعديلات" : "إضافة"}
        cancelText="إلغاء"
        confirmLoading={saving}
        okButtonProps={{
          style: { background: "#e07b1a", borderColor: "#e07b1a" },
        }}
        style={{ direction: "rtl", fontFamily: "'Cairo', sans-serif" }}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="اسم التخصص"
            rules={[{ required: true, message: "أدخل اسم التخصص" }]}
          >
            <Input placeholder="مثال: سباكة، كهرباء، تكييف..." />
          </Form.Item>
          <Form.Item name="description" label="وصف التخصص">
            <Input.TextArea
              rows={3}
              placeholder="وصف مختصر للتخصص وأنواع الخدمات التي يشملها..."
            />
          </Form.Item>
          <Form.Item name="is_active" label="الحالة" valuePropName="checked">
            <Switch checkedChildren="نشط" unCheckedChildren="معطل" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
