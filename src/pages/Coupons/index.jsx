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
  Typography,
  InputNumber,
  DatePicker,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  TagsOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PercentageOutlined,
  DollarOutlined,
  FireOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../api/axios";

const { Search } = Input;
const { Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const DISCOUNT_LABELS = { percentage: "نسبة %", fixed: "قيمة ثابتة" };

export default function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  // ── Services for selector ──
  const [services, setServices] = useState([]);

  const fetchServices = async () => {
    try {
      const res = await api.get("/existedservices/admin/existed/");
      const data = Array.isArray(res.data) ? res.data : res.data.results ?? [];
      setServices(data.filter((s) => s.is_active));
    } catch {}
  };

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const params =
        activeFilter !== "all" ? `?is_active=${activeFilter === "active"}` : "";
      const res = await api.get(`/existedservices/admin/coupons/${params}`);
      const data = Array.isArray(res.data) ? res.data : res.data.results ?? [];
      setCoupons(data);
    } catch {
      message.error("فشل تحميل الكوبونات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
    fetchServices();
  }, [activeFilter]);

  // ── helpers ──
  const isExpired = (c) => dayjs().isAfter(dayjs(c.valid_until));
  const isNotStarted = (c) => dayjs().isBefore(dayjs(c.valid_from));

  const getCouponStatus = (c) => {
    if (!c.is_active) return { label: "معطّل", color: "default" };
    if (isExpired(c)) return { label: "منتهي", color: "red" };
    if (isNotStarted(c)) return { label: "لم يبدأ", color: "blue" };
    if (c.max_uses !== null && c.used_count >= c.max_uses)
      return { label: "مستنفد", color: "orange" };
    return { label: "نشط", color: "green" };
  };

  // ── Modal ──
  const openModal = (coupon = null) => {
    setEditingCoupon(coupon);
    if (coupon) {
      form.setFieldsValue({
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: Number(coupon.discount_value),
        max_discount: coupon.max_discount
          ? Number(coupon.max_discount)
          : undefined,
        min_booking_cost: coupon.min_booking_cost
          ? Number(coupon.min_booking_cost)
          : undefined,
        validity: [dayjs(coupon.valid_from), dayjs(coupon.valid_until)],
        max_uses: coupon.max_uses ?? undefined,
        service: coupon.service ?? undefined,
        is_active: coupon.is_active,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ is_active: true, discount_type: "percentage" });
    }
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const [valid_from, valid_until] = values.validity;
      const payload = {
        code: values.code?.toUpperCase().trim(),
        discount_type: values.discount_type,
        discount_value: values.discount_value,
        max_discount: values.max_discount ?? null,
        min_booking_cost: values.min_booking_cost ?? null,
        valid_from: valid_from.toISOString(),
        valid_until: valid_until.toISOString(),
        max_uses: values.max_uses ?? null,
        service: values.service ?? null,
        is_active: values.is_active,
      };

      if (editingCoupon) {
        await api.patch(
          `/existedservices/admin/coupons/${editingCoupon.id}/`,
          payload
        );
        message.success("تم تحديث الكوبون");
      } else {
        await api.post("/existedservices/admin/coupons/", payload);
        message.success("تم إنشاء الكوبون");
      }
      setModalOpen(false);
      fetchCoupons();
    } catch (e) {
      if (e?.errorFields) return;
      const errMsg =
        e?.response?.data?.code?.[0] ??
        e?.response?.data?.non_field_errors?.[0] ??
        "فشل الحفظ، حاول مرة أخرى";
      message.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/existedservices/admin/coupons/${id}/`);
      message.success("تم حذف الكوبون");
      fetchCoupons();
    } catch {
      message.error("فشل الحذف");
    }
  };

  const handleToggleActive = async (id, current) => {
    try {
      await api.patch(`/existedservices/admin/coupons/${id}/`, {
        is_active: !current,
      });
      message.success(current ? "تم تعطيل الكوبون" : "تم تفعيل الكوبون");
      fetchCoupons();
    } catch {
      message.error("فشل تغيير الحالة");
    }
  };

  // ── Filter + Search ──
  const filtered = coupons.filter((c) =>
    (c.code ?? "").toLowerCase().includes(searchText.toLowerCase())
  );

  const activeCount = coupons.filter(
    (c) => c.is_active && !isExpired(c) && !isNotStarted(c)
  ).length;
  const expiredCount = coupons.filter((c) => isExpired(c)).length;
  const totalUsed = coupons.reduce((sum, c) => sum + (c.used_count ?? 0), 0);

  // ── Table Columns ──
  const columns = [
    {
      title: "الكود",
      dataIndex: "code",
      key: "code",
      render: (v) => (
        <div
          style={{
            fontFamily: "monospace",
            fontWeight: 800,
            fontSize: 15,
            letterSpacing: 2,
            color: "#0f1f1a",
            background: "#f0f4f2",
            display: "inline-block",
            padding: "3px 10px",
            borderRadius: 6,
            border: "1px dashed #b0c4bb",
          }}
        >
          {v}
        </div>
      ),
    },
    {
      title: "نوع الخصم",
      key: "discount",
      render: (_, r) => (
        <Space direction="vertical" size={2}>
          <Tag
            color={r.discount_type === "percentage" ? "volcano" : "geekblue"}
            icon={
              r.discount_type === "percentage" ? (
                <PercentageOutlined />
              ) : (
                <DollarOutlined />
              )
            }
            style={{ borderRadius: 6, fontWeight: 700 }}
          >
            {r.discount_type === "percentage"
              ? `${r.discount_value}%`
              : `${Number(r.discount_value).toLocaleString("ar-SA")} ر.س`}
          </Tag>
          {r.max_discount && (
            <Text type="secondary" style={{ fontSize: 11 }}>
              حد أقصى: {Number(r.max_discount).toLocaleString("ar-SA")} ر.س
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: "الصلاحية",
      key: "validity",
      render: (_, r) => (
        <Space direction="vertical" size={2}>
          <Text style={{ fontSize: 12 }}>
            {dayjs(r.valid_from).format("DD/MM/YYYY")} →{" "}
            {dayjs(r.valid_until).format("DD/MM/YYYY")}
          </Text>
          {isExpired(r) && (
            <Tag color="red" style={{ fontSize: 10, margin: 0 }}>
              منتهي الصلاحية
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: "الاستخدام",
      key: "usage",
      render: (_, r) => (
        <Space direction="vertical" size={2}>
          <Text style={{ fontSize: 13, fontWeight: 600 }}>
            {r.used_count ?? 0}
            {r.max_uses != null && (
              <Text type="secondary" style={{ fontWeight: 400 }}>
                {" "}
                / {r.max_uses}
              </Text>
            )}
          </Text>
          {r.max_uses == null && (
            <Text type="secondary" style={{ fontSize: 11 }}>
              غير محدود
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: "الخدمة",
      key: "service",
      render: (_, r) =>
        r.service_title ? (
          <Tag color="orange" style={{ borderRadius: 6 }}>
            {r.service_title}
          </Tag>
        ) : (
          <Tag color="default" style={{ borderRadius: 6 }}>
            كل الخدمات
          </Tag>
        ),
    },
    {
      title: "الحالة",
      key: "status",
      render: (_, r) => {
        const s = getCouponStatus(r);
        return (
          <Space direction="vertical" size={4}>
            <Tag color={s.color} style={{ borderRadius: 6, fontWeight: 600 }}>
              {s.label}
            </Tag>
            <Switch
              size="small"
              checked={r.is_active}
              onChange={() => handleToggleActive(r.id, r.is_active)}
              style={r.is_active ? { background: "#52c41a" } : {}}
            />
          </Space>
        );
      },
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
            title="حذف الكوبون؟"
            description="سيتم حذف الكوبون نهائياً."
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

  // ── Render ──
  return (
    <div style={{ fontFamily: "'Cairo', sans-serif" }}>
      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {[
          {
            title: "إجمالي الكوبونات",
            value: coupons.length,
            icon: <TagsOutlined />,
            color: "#e07b1a",
            bg: "#fff7e6",
          },
          {
            title: "الكوبونات النشطة",
            value: activeCount,
            icon: <CheckCircleOutlined />,
            color: "#52c41a",
            bg: "#f6ffed",
          },
          {
            title: "الكوبونات المنتهية",
            value: expiredCount,
            icon: <CloseCircleOutlined />,
            color: "#ff4d4f",
            bg: "#fff2f0",
          },
          {
            title: "إجمالي مرات الاستخدام",
            value: totalUsed,
            icon: <FireOutlined />,
            color: "#1677ff",
            bg: "#e6f4ff",
          },
        ].map((s, i) => (
          <Col xs={24} sm={12} lg={6} key={i}>
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
            كوبونات الخصم
          </h2>
          <Space wrap>
            <Search
              placeholder="بحث بالكود..."
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
                  type={activeFilter === f ? "primary" : "default"}
                  onClick={() => setActiveFilter(f)}
                  style={
                    activeFilter === f
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
              إضافة كوبون
            </Button>
          </Space>
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
            showTotal: (total) => `${total} كوبون`,
          }}
          style={{ padding: "0 8px" }}
        />
      </Card>

      {/* ═══ Modal: Create / Edit ═══ */}
      <Modal
        title={
          <span style={{ fontFamily: "'Cairo', sans-serif", fontWeight: 700 }}>
            {editingCoupon ? "تعديل الكوبون" : "إضافة كوبون جديد"}
          </span>
        }
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        okText={editingCoupon ? "حفظ التعديلات" : "إنشاء الكوبون"}
        cancelText="إلغاء"
        confirmLoading={saving}
        okButtonProps={{
          style: { background: "#e07b1a", borderColor: "#e07b1a" },
        }}
        style={{ direction: "rtl", fontFamily: "'Cairo', sans-serif" }}
        width={560}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          {/* Code */}
          <Form.Item
            name="code"
            label="كود الخصم"
            rules={[{ required: true, message: "الرجاء إدخال كود الخصم" }]}
          >
            <Input
              placeholder="مثال: SAVE20"
              style={{
                fontFamily: "monospace",
                fontWeight: 700,
                letterSpacing: 1,
              }}
              onChange={(e) =>
                form.setFieldValue("code", e.target.value.toUpperCase())
              }
            />
          </Form.Item>

          {/* Discount type + value */}
          <Row gutter={12}>
            <Col span={10}>
              <Form.Item
                name="discount_type"
                label="نوع الخصم"
                rules={[{ required: true, message: "اختر نوع الخصم" }]}
              >
                <Select placeholder="اختر النوع">
                  <Option value="percentage">
                    <Space>
                      <PercentageOutlined /> نسبة مئوية
                    </Space>
                  </Option>
                  <Option value="fixed">
                    <Space>
                      <DollarOutlined /> قيمة ثابتة
                    </Space>
                  </Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={14}>
              <Form.Item
                noStyle
                shouldUpdate={(p, c) => p.discount_type !== c.discount_type}
              >
                {({ getFieldValue }) => (
                  <Form.Item
                    name="discount_value"
                    label={
                      getFieldValue("discount_type") === "percentage"
                        ? "نسبة الخصم (%)"
                        : "قيمة الخصم (ر.س)"
                    }
                    rules={[{ required: true, message: "أدخل قيمة الخصم" }]}
                  >
                    <InputNumber
                      min={0}
                      max={
                        getFieldValue("discount_type") === "percentage"
                          ? 100
                          : undefined
                      }
                      style={{ width: "100%" }}
                      placeholder={
                        getFieldValue("discount_type") === "percentage"
                          ? "20"
                          : "50"
                      }
                    />
                  </Form.Item>
                )}
              </Form.Item>
            </Col>
          </Row>

          {/* max_discount (only for percentage) */}
          <Form.Item
            noStyle
            shouldUpdate={(p, c) => p.discount_type !== c.discount_type}
          >
            {({ getFieldValue }) =>
              getFieldValue("discount_type") === "percentage" ? (
                <Form.Item
                  name="max_discount"
                  label="الحد الأقصى للخصم (ر.س) — اختياري"
                >
                  <InputNumber
                    min={0}
                    style={{ width: "100%" }}
                    placeholder="مثال: 200 — اتركه فارغاً لو مفيش حد"
                  />
                </Form.Item>
              ) : null
            }
          </Form.Item>

          {/* min_booking_cost */}
          <Form.Item
            name="min_booking_cost"
            label="الحد الأدنى لقيمة الحجز (ر.س) — اختياري"
          >
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              placeholder="مثال: 300 — اتركه فارغاً لو مفيش حد"
            />
          </Form.Item>

          {/* Validity range */}
          <Form.Item
            name="validity"
            label="فترة الصلاحية"
            rules={[{ required: true, message: "اختر فترة الصلاحية" }]}
          >
            <RangePicker
              showTime
              format="DD/MM/YYYY HH:mm"
              style={{ width: "100%" }}
              placeholder={["تاريخ البداية", "تاريخ الانتهاء"]}
            />
          </Form.Item>

          {/* max_uses */}
          <Form.Item name="max_uses" label="الحد الأقصى للاستخدام — اختياري">
            <InputNumber
              min={1}
              style={{ width: "100%" }}
              placeholder="اتركه فارغاً لاستخدام غير محدود"
            />
          </Form.Item>

          {/* Service */}
          <Form.Item name="service" label="تخصيص لخدمة معينة — اختياري">
            <Select
              placeholder="اختر الخدمة أو اتركه للكل"
              allowClear
              showSearch
              optionFilterProp="children"
              notFoundContent="لا توجد خدمات"
            >
              {services.map((s) => (
                <Option key={s.id} value={s.id}>
                  {s.title}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* is_active */}
          <Form.Item name="is_active" label="الحالة" valuePropName="checked">
            <Switch checkedChildren="نشط" unCheckedChildren="معطل" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
