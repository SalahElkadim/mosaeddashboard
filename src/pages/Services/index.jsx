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
  Select,
  Tooltip,
  Row,
  Col,
  Statistic,
  Avatar,
  Typography,
  Divider,
  InputNumber,
  Upload,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  AppstoreOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SafetyCertificateOutlined,
  LoadingOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

const { Search } = Input;
const { Text } = Typography;
const { Option } = Select;

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const DURATION_LABELS = { day: "يوم", month: "شهر", year: "سنة" };

export default function Services() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  // ── Image Upload ──
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // ── Specializations ──
  const [specializations, setSpecializations] = useState([]);

  const fetchSpecializations = async () => {
    try {
      const res = await api.get("/accounts/specializations/");
      const data = Array.isArray(res.data) ? res.data : res.data.results ?? [];
      setSpecializations(data.filter((s) => s.is_active));
    } catch {}
  };

  const fetchServices = async () => {
    setLoading(true);
    try {
      const params =
        isActiveFilter !== "all"
          ? `?is_active=${isActiveFilter === "active"}`
          : "";
      const res = await api.get(`/existedservices/admin/existed/${params}`);
      const data = Array.isArray(res.data) ? res.data : res.data.results ?? [];
      setServices(data);
    } catch {
      message.error("فشل تحميل الخدمات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
    fetchSpecializations();
  }, [isActiveFilter]);

  const handleImageUpload = async ({ file }) => {
    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      message.error("حجم الصورة يجب أن يكون أقل من 5MB");
      return false;
    }

    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", UPLOAD_PRESET);
      fd.append("folder", "services");

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: "POST", body: fd }
      );

      const data = await res.json();
      if (data.secure_url) {
        form.setFieldValue("image", data.secure_url);
        setPreviewImage(data.secure_url);
        message.success("تم رفع الصورة بنجاح");
      } else {
        message.error("فشل رفع الصورة، حاول مرة أخرى");
      }
    } catch {
      message.error("حدث خطأ أثناء رفع الصورة");
    } finally {
      setUploadingImage(false);
    }
    return false; // prevent antd auto-upload
  };

  const openModal = (service = null) => {
    setEditingService(service);
    setPreviewImage(service?.image ?? null);
    if (service) {
      form.setFieldsValue({
        title: service.title,
        details: service.details,
        image: service.image,
        date: service.date,
        is_active: service.is_active,
        specialization:
          service.specialization?.id ?? service.specialization ?? undefined,
        warranty_duration_value: service.warranty?.duration_value ?? undefined,
        warranty_duration_type: service.warranty?.duration_type ?? undefined,
        warranty_notes: service.warranty?.notes ?? "",
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

      const {
        warranty_duration_value,
        warranty_duration_type,
        warranty_notes,
        ...serviceValues
      } = values;

      const payload = { ...serviceValues };

      if (warranty_duration_value && warranty_duration_type) {
        payload.warranty = {
          duration_value: warranty_duration_value,
          duration_type: warranty_duration_type,
          notes: warranty_notes || "",
        };
      } else {
        payload.warranty = null;
      }

      if (editingService) {
        await api.patch(
          `/existedservices/admin/existed/${editingService.id}/`,
          payload
        );
        message.success("تم تحديث الخدمة بنجاح");
      } else {
        await api.post("/existedservices/admin/existed/", {
          ...payload,
          date: values.date ?? new Date().toISOString().split("T")[0],
        });
        message.success("تم إنشاء الخدمة بنجاح");
      }
      setModalOpen(false);
      fetchServices();
    } catch (e) {
      if (e?.errorFields) return;
      message.error("فشل الحفظ، حاول مرة أخرى");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/existedservices/admin/existed/${id}/`);
      message.success("تم حذف الخدمة");
      fetchServices();
    } catch {
      message.error("فشل الحذف");
    }
  };

  const handleToggleActive = async (id, current) => {
    try {
      await api.patch(`/existedservices/admin/existed/${id}/`, {
        is_active: !current,
      });
      message.success(current ? "تم تعطيل الخدمة" : "تم تفعيل الخدمة");
      fetchServices();
    } catch {
      message.error("فشل تغيير الحالة");
    }
  };

  const filtered = services.filter((s) =>
    (s.title ?? "").toLowerCase().includes(searchText.toLowerCase())
  );

  const activeCount = services.filter((s) => s.is_active).length;
  const inactiveCount = services.filter((s) => !s.is_active).length;

  const columns = [
    {
      title: "الخدمة",
      key: "title",
      render: (_, r) => (
        <Space>
          {r.image ? (
            <Avatar
              size={44}
              src={r.image}
              shape="square"
              style={{ borderRadius: 8, flexShrink: 0 }}
            />
          ) : (
            <Avatar
              size={44}
              icon={<AppstoreOutlined />}
              shape="square"
              style={{ background: "#e07b1a", borderRadius: 8, flexShrink: 0 }}
            />
          )}
          <div>
            <div style={{ fontWeight: 600, color: "#1a1a2e" }}>{r.title}</div>
            <Text
              type="secondary"
              ellipsis
              style={{ fontSize: 12, maxWidth: 200 }}
            >
              {r.details}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "التخصص",
      dataIndex: "specialization",
      key: "specialization",
      render: (v) =>
        v ? (
          <Tag color="orange" style={{ borderRadius: 6 }}>
            {v.name ?? v}
          </Tag>
        ) : (
          <Tag color="default">غير محدد</Tag>
        ),
    },
    {
      title: "الضمان",
      dataIndex: "warranty",
      key: "warranty",
      render: (v) =>
        v ? (
          <Tag
            color="green"
            icon={<SafetyCertificateOutlined />}
            style={{ borderRadius: 6 }}
          >
            {v.duration_value} {DURATION_LABELS[v.duration_type]}
          </Tag>
        ) : (
          <Tag color="default">لا يوجد</Tag>
        ),
    },
    {
      title: "تاريخ الإضافة",
      dataIndex: "date",
      key: "date",
      render: (v) => (v ? new Date(v).toLocaleDateString("ar-SA") : "—"),
    },
    {
      title: "الحالة",
      key: "is_active",
      render: (_, r) => (
        <Switch
          checked={r.is_active}
          checkedChildren="نشطة"
          unCheckedChildren="معطلة"
          onChange={() => handleToggleActive(r.id, r.is_active)}
          style={r.is_active ? { background: "#52c41a" } : {}}
        />
      ),
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
              onClick={() => navigate(`/services/${r.id}`)}
              style={{ color: "#1677ff" }}
            />
          </Tooltip>
          <Tooltip title="تعديل">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => openModal(r)}
              style={{ color: "#e07b1a" }}
            />
          </Tooltip>
          <Popconfirm
            title="حذف الخدمة؟"
            description="سيتم حذف الخدمة وجميع بياناتها بشكل نهائي."
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
            title: "إجمالي الخدمات",
            value: services.length,
            icon: <AppstoreOutlined />,
            color: "#e07b1a",
            bg: "#fff7e6",
          },
          {
            title: "الخدمات النشطة",
            value: activeCount,
            icon: <CheckCircleOutlined />,
            color: "#52c41a",
            bg: "#f6ffed",
          },
          {
            title: "الخدمات المعطلة",
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
            الخدمات
          </h2>
          <Space wrap>
            <Search
              placeholder="بحث بالعنوان..."
              allowClear
              style={{ width: 200 }}
              prefix={<SearchOutlined style={{ color: "#bbb" }} />}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Space>
              {["all", "active", "inactive"].map((f) => (
                <Button
                  key={f}
                  size="small"
                  type={isActiveFilter === f ? "primary" : "default"}
                  onClick={() => setIsActiveFilter(f)}
                  style={
                    isActiveFilter === f
                      ? { background: "#0f1f1a", borderColor: "#0f1f1a" }
                      : {}
                  }
                >
                  {f === "all" ? "الكل" : f === "active" ? "نشطة" : "معطلة"}
                </Button>
              ))}
            </Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => openModal()}
              style={{ background: "#e07b1a", borderColor: "#e07b1a" }}
            >
              إضافة خدمة
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={filtered}
          loading={loading}
          rowKey="id"
          scroll={{ x: 800 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total) => `${total} خدمة`,
          }}
          style={{ padding: "0 8px" }}
        />
      </Card>

      {/* ══════════════════════════════════════════
          Modal: إضافة / تعديل خدمة
      ══════════════════════════════════════════ */}
      <Modal
        title={
          <span style={{ fontFamily: "'Cairo', sans-serif", fontWeight: 700 }}>
            {editingService ? "تعديل الخدمة" : "إضافة خدمة جديدة"}
          </span>
        }
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => {
          setModalOpen(false);
          setPreviewImage(null);
        }}
        okText={editingService ? "حفظ التعديلات" : "إنشاء الخدمة"}
        cancelText="إلغاء"
        confirmLoading={saving}
        okButtonProps={{
          style: { background: "#e07b1a", borderColor: "#e07b1a" },
          disabled: uploadingImage,
        }}
        style={{ direction: "rtl", fontFamily: "'Cairo', sans-serif" }}
        width={560}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          {/* ── بيانات الخدمة ── */}
          <Divider
            orientation="right"
            orientationMargin={0}
            style={{ color: "#888", fontSize: 13, marginTop: 0 }}
          >
            بيانات الخدمة
          </Divider>

          <Form.Item
            name="title"
            label="عنوان الخدمة"
            rules={[{ required: true, message: "الرجاء إدخال عنوان الخدمة" }]}
          >
            <Input placeholder="مثال: تركيب مكيفات" />
          </Form.Item>

          <Form.Item
            name="specialization"
            label="التخصص"
            rules={[{ required: true, message: "اختر التخصص المرتبط بالخدمة" }]}
          >
            <Select
              placeholder="اختر التخصص"
              showSearch
              optionFilterProp="children"
              notFoundContent="لا توجد تخصصات متاحة"
            >
              {specializations.map((s) => (
                <Option key={s.id} value={s.id}>
                  {s.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="details" label="تفاصيل الخدمة">
            <Input.TextArea rows={3} placeholder="وصف تفصيلي للخدمة..." />
          </Form.Item>

          {/* ── Image Upload ── */}
          {/* hidden field to store the URL */}
          <Form.Item name="image" style={{ display: "none" }}>
            <Input />
          </Form.Item>

          <Form.Item label="صورة الخدمة">
            <Upload
              accept="image/*"
              showUploadList={false}
              customRequest={handleImageUpload}
              disabled={uploadingImage}
            >
              <div
                style={{
                  border: `1px dashed ${
                    uploadingImage ? "#e07b1a" : "#d9d9d9"
                  }`,
                  borderRadius: 10,
                  padding: previewImage ? 8 : 20,
                  textAlign: "center",
                  cursor: uploadingImage ? "not-allowed" : "pointer",
                  background: "#fafafa",
                  transition: "border-color 0.25s",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  if (!uploadingImage)
                    e.currentTarget.style.borderColor = "#e07b1a";
                }}
                onMouseLeave={(e) => {
                  if (!uploadingImage)
                    e.currentTarget.style.borderColor = "#d9d9d9";
                }}
              >
                {uploadingImage ? (
                  <Space direction="vertical" size={6} style={{ padding: 12 }}>
                    <LoadingOutlined
                      style={{ fontSize: 26, color: "#e07b1a" }}
                    />
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      جاري رفع الصورة...
                    </Text>
                  </Space>
                ) : previewImage ? (
                  <Space
                    direction="vertical"
                    size={8}
                    style={{ width: "100%" }}
                  >
                    <img
                      src={previewImage}
                      alt="preview"
                      style={{
                        width: "100%",
                        maxHeight: 160,
                        objectFit: "cover",
                        borderRadius: 8,
                        display: "block",
                      }}
                    />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      اضغط لتغيير الصورة
                    </Text>
                  </Space>
                ) : (
                  <Space direction="vertical" size={4}>
                    <InboxOutlined style={{ fontSize: 32, color: "#bbb" }} />
                    <Text style={{ fontSize: 14, color: "#555" }}>
                      اضغط أو اسحب الصورة هنا
                    </Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      PNG، JPG، WEBP — الحجم الأقصى 5MB
                    </Text>
                  </Space>
                )}
              </div>
            </Upload>
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="date" label="تاريخ الإتاحة">
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="is_active"
                label="الحالة"
                valuePropName="checked"
              >
                <Switch checkedChildren="نشطة" unCheckedChildren="معطلة" />
              </Form.Item>
            </Col>
          </Row>

          {/* ── بيانات الضمان ── */}
          <Divider
            orientation="right"
            orientationMargin={0}
            style={{ color: "#888", fontSize: 13 }}
          >
            <Space>
              <SafetyCertificateOutlined style={{ color: "#52c41a" }} />
              الضمان (اختياري)
            </Space>
          </Divider>

          <Row gutter={12}>
            <Col span={10}>
              <Form.Item
                name="warranty_duration_value"
                label="مدة الضمان"
                rules={[
                  {
                    validator: (_, value) => {
                      if (value !== undefined && value !== null && value <= 0)
                        return Promise.reject("يجب أن تكون المدة أكبر من 0");
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <InputNumber
                  min={1}
                  style={{ width: "100%" }}
                  placeholder="مثال: 6"
                />
              </Form.Item>
            </Col>
            <Col span={14}>
              <Form.Item name="warranty_duration_type" label="وحدة المدة">
                <Select placeholder="اختر الوحدة" allowClear>
                  <Option value="day">يوم</Option>
                  <Option value="month">شهر</Option>
                  <Option value="year">سنة</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="warranty_notes" label="ملاحظات الضمان">
            <Input.TextArea
              rows={2}
              placeholder="مثال: يشمل الضمان قطع الغيار فقط..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
