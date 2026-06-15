import { useState, useEffect, useRef } from "react";
import {
  Card,
  Row,
  Col,
  Avatar,
  Tag,
  Button,
  Descriptions,
  Rate,
  List,
  Empty,
  Popconfirm,
  message,
  Skeleton,
  Space,
  Typography,
  Divider,
  Modal,
  Form,
  Input,
  Select,
  Table,
  Switch,
  Upload,
  Image,
  Spin,
} from "antd";
import {
  ArrowRightOutlined,
  CheckCircleOutlined,
  StopOutlined,
  UnlockOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  IdcardOutlined,
  StarFilled,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  FileImageOutlined,
  UploadOutlined,
  EyeOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";

const { Title, Text } = Typography;
const { Option } = Select;

const CLOUDINARY_CLOUD_NAME =
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "your_cloud_name";
const CLOUDINARY_UPLOAD_PRESET =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "your_upload_preset";

const STATUS_MAP = {
  active: { color: "success", label: "نشط" },
  blocked: { color: "error", label: "محظور" },
  pending: { color: "warning", label: "قيد المراجعة" },
};

const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", "contracts");
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );
  if (!res.ok) throw new Error("فشل رفع الملف على Cloudinary");
  const data = await res.json();
  return data.secure_url;
};

export default function ProviderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  console.log("ProviderDetail rendered, id:", id);
  const [provider, setProvider] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({
    average_rating: 0,
    total_reviews: 0,
  });
  const [works, setWorks] = useState([]);
  // Previous Work modal
  const [workModalOpen, setWorkModalOpen] = useState(false);
  const [workUploading, setWorkUploading] = useState(false);
  const [workForm] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");

  // Edit Provider modal
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  // Address modal
  const [addrModalOpen, setAddrModalOpen] = useState(false);
  const [editingAddr, setEditingAddr] = useState(null);
  const [addrSaving, setAddrSaving] = useState(false);
  const [cities, setCities] = useState([]);
  const [regions, setRegions] = useState([]);
  const [regionsLoading, setRegionsLoading] = useState(false);
  const [selectedCity, setSelectedCity] = useState(undefined);
  const [selectedRegion, setSelectedRegion] = useState(undefined);
  const [regionError, setRegionError] = useState("");
  const [addrForm] = Form.useForm();

  // Review modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewForm] = Form.useForm();

  // Contract
  const [contractUploading, setContractUploading] = useState(false);
  const contractInputRef = useRef(null);

  // ─── Fetch helpers ───────────────────────────
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pRes, rRes, wRes] = await Promise.allSettled([
        api.get(`/accounts/admin/providers/${id}/`),
        api.get(`/accounts/reviews/provider/${id}/`),
        api.get(`/accounts/previousworks/provider/${id}/`),
      ]);
      if (pRes.status === "fulfilled") setProvider(pRes.value.data);
      if (rRes.status === "fulfilled") {
        const d = rRes.value.data;
        setReviews(Array.isArray(d) ? d : d.reviews ?? d.results ?? []);
        setReviewStats({
          average_rating: d.average_rating ?? 0,
          total_reviews: d.total_reviews ?? 0,
        });
      }
      if (wRes.status === "fulfilled") {
        const d = wRes.value.data;
        console.log("works raw data:", d);
        console.log("works status:", wRes.status);
        setWorks(Array.isArray(d) ? d : d.results ?? []);
      } else {
        console.log("works FAILED:", wRes.reason);
      }
    } catch {
      message.error("فشل تحميل بيانات مزود الخدمة");
    } finally {
      setLoading(false);
    }
  };

  // جيب المدن مرة واحدة بس
  const fetchCities = async () => {
    try {
      const res = await api.get("/accounts/cities/");
      const d = Array.isArray(res.data) ? res.data : res.data.results ?? [];
      setCities(d.filter((c) => c.is_active));
    } catch {
      message.error("فشل تحميل قائمة المدن");
    }
  };

  const fetchRegions = async (cityId) => {
    if (!cityId) {
      setRegions([]);
      return [];
    }
    setRegionsLoading(true);
    try {
      const res = await api.get(`/accounts/regions/?city_id=${cityId}`);
      const d = Array.isArray(res.data) ? res.data : res.data.results ?? [];
      const active = d.filter((r) => r.is_active);
      setRegions(active);
      return active;
    } catch {
      setRegions([]);
      return [];
    } finally {
      setRegionsLoading(false);
    }
  };

  useEffect(() => {
    console.log("useEffect fired");
    console.log("id value:", id);
    fetchAll();
    fetchCities();
  }, [id]);

  // ─── Provider Actions ─────────────────────────
  const handleAction = async (action) => {
    setActionLoading(action);
    try {
      if (action === "approve") {
        await api.post(`/accounts/admin/providers/${id}/approve/`);
        message.success("تم قبول مزود الخدمة");
      } else if (action === "block") {
        await api.post(`/accounts/admin/providers/${id}/block/`);
        message.success("تم حظر مزود الخدمة");
      } else if (action === "unblock") {
        await api.delete(`/accounts/admin/providers/${id}/block/`);
        message.success("تم رفع الحظر");
      }
      fetchAll();
    } catch {
      message.error("حدث خطأ، حاول مرة أخرى");
    } finally {
      setActionLoading("");
    }
  };

  // ─── Edit Provider ────────────────────────────
  const openEdit = () => {
    form.setFieldsValue({
      name: provider.name ?? "",
      email: provider.email ?? "",
    });
    setEditOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      await api.patch(`/accounts/admin/providers/${id}/`, values);
      message.success("تم تحديث بيانات مزود الخدمة");
      setEditOpen(false);
      fetchAll();
    } catch (e) {
      if (e?.errorFields) return;
      message.error("فشل الحفظ، حاول مرة أخرى");
    } finally {
      setSaving(false);
    }
  };

  // ─── Contract Image ───────────────────────────
  const handleContractUpload = async (file) => {
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];
    if (!allowed.includes(file.type)) {
      message.error("يُسمح فقط بملفات JPG أو PNG أو WebP أو PDF");
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      message.error("حجم الملف يجب أن لا يتجاوز 5 ميجابايت");
      return false;
    }
    setContractUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      await api.patch(`/accounts/admin/providers/${id}/`, {
        contract_image: url,
      });
      message.success("تم رفع صورة العقد بنجاح");
      fetchAll();
    } catch {
      message.error("فشل رفع صورة العقد، حاول مرة أخرى");
    } finally {
      setContractUploading(false);
      if (contractInputRef.current) contractInputRef.current.value = "";
    }
    return false;
  };

  const handleDeleteContract = async () => {
    try {
      await api.patch(`/accounts/admin/providers/${id}/`, {
        contract_image: null,
      });
      message.success("تم حذف صورة العقد");
      fetchAll();
    } catch {
      message.error("فشل حذف صورة العقد");
    }
  };

  // ─── Address Modal ────────────────────────────
  const openAddAddress = () => {
    setEditingAddr(null);
    addrForm.resetFields();
    setRegions([]);
    setSelectedCity(undefined);
    setSelectedRegion(undefined);
    setRegionError("");
    setAddrModalOpen(true);
  };

  const openEditAddress = async (addr) => {
    setEditingAddr(addr);
    addrForm.resetFields();
    setRegions([]);
    setSelectedCity(addr.city ?? undefined);
    setSelectedRegion(addr.region ?? undefined);
    setRegionError("");
    addrForm.setFieldsValue({
      district: addr.district ?? "",
      street: addr.street ?? "",
      building_no: addr.building_no ?? "",
      label: addr.label ?? "",
      is_default: addr.is_default ?? false,
    });
    setAddrModalOpen(true);
    if (addr.city) {
      await fetchRegions(addr.city);
    }
    console.log("addr:", addr);
    console.log("regions:", regions);
  };

  const handleCityChange = (cityId) => {
    setSelectedCity(cityId);
    setSelectedRegion(undefined);
    setRegionError("");
    fetchRegions(cityId);
  };

  const handleRegionChange = (regionId) => {
    setSelectedRegion(regionId);
    if (regionId) setRegionError("");
  };

  const handleDeleteAddress = async (addrId) => {
    try {
      await api.delete(`/accounts/admin/providers/${id}/addresses/${addrId}/`);
      message.success("تم حذف العنوان");
      fetchAll();
    } catch {
      message.error("فشل حذف العنوان");
    }
  };

  const handleSaveAddress = async () => {
    // validate المنطقة يدوياً لأنها controlled state مش form field
    if (!selectedRegion) {
      setRegionError("اختر المنطقة");
      return;
    }
    if (!selectedCity) {
      return;
    }
    try {
      const values = await addrForm.validateFields();
      setAddrSaving(true);
      const payload = {
        city: selectedCity,
        region: selectedRegion,
        district: values.district || undefined,
        street: values.street || undefined,
        building_no: values.building_no || undefined,
        label: values.label || undefined,
        is_default: values.is_default ?? false,
      };
      if (editingAddr) {
        await api.patch(
          `/accounts/admin/providers/${id}/addresses/${editingAddr.id}/`,
          payload
        );
        message.success("تم تعديل العنوان");
      } else {
        await api.post(`/accounts/admin/providers/${id}/addresses/`, payload);
        message.success("تم إضافة العنوان");
      }

      setAddrModalOpen(false);
      setRegions([]);
      setSelectedCity(undefined);
      setSelectedRegion(undefined);
      setRegionError("");
      addrForm.resetFields();
      fetchAll();
    } catch (e) {
      if (e?.errorFields) return;
      const data = e?.response?.data;
      if (data && typeof data === "object") {
        const msg = Object.values(data).flat()[0];
        message.error(msg || "فشل الحفظ");
      } else {
        message.error("فشل الحفظ، حاول مرة أخرى");
      }
    } finally {
      setAddrSaving(false);
    }
  };

  // ─── Review Actions ───────────────────────────
  const openEditReview = (review) => {
    setEditingReview(review);
    reviewForm.setFieldsValue({
      rating: review.rating ?? 0,
      comment: review.comment ?? "",
    });
    setReviewModalOpen(true);
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await api.delete(`/accounts/reviews/${reviewId}/`);
      message.success("تم حذف التقييم");
      fetchAll();
    } catch {
      message.error("فشل حذف التقييم");
    }
  };

  const handleSaveReview = async () => {
    try {
      const values = await reviewForm.validateFields();
      setReviewSaving(true);
      if (editingReview) {
        await api.patch(`/accounts/reviews/${editingReview.id}/edit/`, values);
        message.success("تم تعديل التقييم");
      } else {
        await api.post(`/accounts/reviews/`, { ...values, provider: id });
        message.success("تم إضافة التقييم");
      }
      setReviewModalOpen(false);
      fetchAll();
    } catch (e) {
      if (e?.errorFields) return;
      message.error("فشل الحفظ، حاول مرة أخرى");
    } finally {
      setReviewSaving(false);
    }
  };
  // ─── Previous Work Actions ─────────────────────────
  const handleDeleteWork = async (workId) => {
    try {
      await api.delete(`/accounts/previousworks/${workId}/`);
      message.success("تم حذف العمل");
      fetchAll();
    } catch {
      message.error("فشل حذف العمل");
    }
  };

  const handleAddWork = async () => {
    try {
      const values = await workForm.validateFields();
      const file = values.media?.file;
      if (!file) return message.error("اختر ملفاً أولاً");

      setWorkUploading(true);

      const mediaType = file.type.startsWith("video/") ? "video" : "image";
      const resourceType = mediaType === "video" ? "video" : "image";

      // رفع على Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      formData.append("folder", "previous_works");

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
        { method: "POST", body: formData }
      );
      if (!res.ok) throw new Error("فشل رفع الملف");
      const data = await res.json();

      const media_url = data.secure_url;
      const thumbnail_url =
        mediaType === "video"
          ? data.secure_url
              .replace(/\.[^/.]+$/, ".jpg")
              .replace("/video/", "/video/so_0/")
          : null;

      // أرسل للـ backend
      await api.post(`/accounts/previousworks/`, {
        title: values.title || "",
        description: values.description || "",
        media_type: mediaType,
        media_url,
        thumbnail_url,
        provider: id,
      });

      message.success("تم إضافة العمل بنجاح");
      setWorkModalOpen(false);
      workForm.resetFields();
      fetchAll();
    } catch (e) {
      if (e?.errorFields) return;
      message.error("فشل الإضافة، حاول مرة أخرى");
    } finally {
      setWorkUploading(false);
    }
  };
  // ─── Guards ───────────────────────────────────
  if (loading) return <Skeleton active avatar paragraph={{ rows: 6 }} />;
  if (!provider)
    return (
      <Empty description="لم يتم العثور على مزود الخدمة">
        <Button onClick={() => navigate("/providers")}>العودة للقائمة</Button>
      </Empty>
    );

  const name = provider.name ?? "—";
  const phone = provider.phone_number ?? "—";
  const email = provider.email ?? "—";

  const providerStatus =
    provider.status ??
    (!provider.is_active && !provider.is_approved
      ? "blocked"
      : provider.is_approved
      ? "active"
      : "pending");

  const statusCfg = STATUS_MAP[providerStatus] ?? {
    color: "default",
    label: providerStatus,
  };
  const avgDisplay = parseFloat(reviewStats.average_rating) || 0;
  const addresses = provider.addresses ?? [];

  // ─── Render ───────────────────────────────────
  return (
    <div style={{ fontFamily: "'Cairo', sans-serif" }}>
      <style>{`
        .provider-descriptions .ant-descriptions-item-content {
          word-break: break-word; overflow-wrap: break-word; white-space: normal;
        }
        .provider-descriptions .ant-descriptions-item-label { white-space: nowrap; }
        @media (max-width: 576px) {
          .provider-descriptions .ant-descriptions-row { display: flex; flex-direction: column; }
          .provider-descriptions .ant-descriptions-item { padding-bottom: 12px; }
        }
        .contract-upload-area {
          border: 2px dashed #ffd591; border-radius: 8px; padding: 20px;
          text-align: center; background: #fffbf5; cursor: pointer; transition: all 0.2s;
        }
        .contract-upload-area:hover { border-color: #e07b1a; background: #fff7e6; }
      `}</style>

      <Button
        type="text"
        icon={<ArrowRightOutlined />}
        onClick={() => navigate("/providers")}
        style={{ marginBottom: 16, color: "#555", paddingRight: 0 }}
      >
        العودة إلى مزودي الخدمة
      </Button>

      <Row gutter={[24, 24]}>
        {/* ── Left: profile card ── */}
        <Col xs={24} lg={8}>
          <Card
            bordered={false}
            style={{
              borderRadius: 16,
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
              textAlign: "center",
            }}
          >
            <Avatar
              size={96}
              icon={<UserOutlined />}
              style={{ background: "#e07b1a", marginBottom: 16 }}
            />

            <Title
              level={4}
              style={{ margin: 0, color: "#0f1f1a", wordBreak: "break-word" }}
            >
              {name}
            </Title>

            <Text
              type="secondary"
              style={{
                display: "block",
                marginBottom: 12,
                wordBreak: "break-word",
              }}
            >
              {provider.specialization?.name ?? "—"}
            </Text>

            <Tag
              color={statusCfg.color}
              style={{ fontSize: 13, padding: "2px 12px" }}
            >
              {statusCfg.label}
            </Tag>

            {reviewStats.total_reviews > 0 && (
              <div style={{ marginTop: 12 }}>
                <Rate disabled allowHalf value={avgDisplay} />
                <div style={{ color: "#888", fontSize: 13, marginTop: 4 }}>
                  {avgDisplay.toFixed(1)} / 5 ({reviewStats.total_reviews}{" "}
                  تقييم)
                </div>
              </div>
            )}

            <Divider />

            <Space direction="vertical" style={{ width: "100%" }}>
              <Button
                icon={<EditOutlined />}
                onClick={openEdit}
                style={{
                  width: "100%",
                  borderColor: "#e07b1a",
                  color: "#e07b1a",
                }}
              >
                تعديل البيانات
              </Button>

              {providerStatus === "pending" && (
                <Popconfirm
                  title="قبول مزود الخدمة؟"
                  onConfirm={() => handleAction("approve")}
                  okText="نعم"
                  cancelText="لا"
                >
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    loading={actionLoading === "approve"}
                    style={{
                      background: "#52c41a",
                      borderColor: "#52c41a",
                      width: "100%",
                    }}
                  >
                    قبول مزود الخدمة
                  </Button>
                </Popconfirm>
              )}

              {providerStatus === "active" && (
                <Popconfirm
                  title="تأكيد حظر مزود الخدمة؟"
                  onConfirm={() => handleAction("block")}
                  okText="نعم"
                  cancelText="لا"
                >
                  <Button
                    danger
                    icon={<StopOutlined />}
                    loading={actionLoading === "block"}
                    style={{ width: "100%" }}
                  >
                    حظر مزود الخدمة
                  </Button>
                </Popconfirm>
              )}

              {providerStatus === "blocked" && (
                <Popconfirm
                  title="رفع الحظر عن مزود الخدمة؟"
                  onConfirm={() => handleAction("unblock")}
                  okText="نعم"
                  cancelText="لا"
                >
                  <Button
                    icon={<UnlockOutlined />}
                    loading={actionLoading === "unblock"}
                    style={{
                      width: "100%",
                      borderColor: "#faad14",
                      color: "#faad14",
                    }}
                  >
                    رفع الحظر
                  </Button>
                </Popconfirm>
              )}
            </Space>
          </Card>
        </Col>

        {/* ── Right: details ── */}
        <Col xs={24} lg={16}>
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            {/* Provider Info */}
            <Card
              bordered={false}
              title={
                <span style={{ fontWeight: 700 }}>بيانات مزود الخدمة</span>
              }
              style={{
                borderRadius: 16,
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
              }}
            >
              <Descriptions
                className="provider-descriptions"
                column={{ xs: 1, sm: 2 }}
                labelStyle={{ color: "#888", whiteSpace: "nowrap" }}
                contentStyle={{
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                }}
              >
                <Descriptions.Item
                  label={
                    <Space>
                      <PhoneOutlined />
                      رقم الهاتف
                    </Space>
                  }
                >
                  {phone}
                </Descriptions.Item>
                <Descriptions.Item
                  label={
                    <Space>
                      <MailOutlined />
                      البريد الإلكتروني
                    </Space>
                  }
                >
                  {email}
                </Descriptions.Item>
                <Descriptions.Item
                  label={
                    <Space>
                      <IdcardOutlined />
                      رقم الهوية
                    </Space>
                  }
                >
                  {provider.national_id ?? "—"}
                </Descriptions.Item>
                <Descriptions.Item
                  label={
                    <Space>
                      <IdcardOutlined />
                      السجل التجاري
                    </Space>
                  }
                >
                  {provider.commercial_registration || "لا يوجد"}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Contract Image */}
            <Card
              bordered={false}
              title={
                <Space>
                  <FileImageOutlined style={{ color: "#e07b1a" }} />
                  <span style={{ fontWeight: 700 }}>صورة العقد</span>
                </Space>
              }
              style={{
                borderRadius: 16,
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
              }}
            >
              {provider.contract_image ? (
                <div>
                  <div
                    style={{
                      position: "relative",
                      display: "inline-block",
                      borderRadius: 10,
                      overflow: "hidden",
                      border: "1px solid #ffd591",
                      marginBottom: 12,
                    }}
                  >
                    {provider.contract_image.toLowerCase().includes(".pdf") ||
                    provider.contract_image.toLowerCase().includes("/pdf") ? (
                      <div
                        style={{
                          width: 220,
                          height: 140,
                          background: "#f5f5f5",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                          color: "#888",
                        }}
                      >
                        <FileImageOutlined
                          style={{ fontSize: 40, color: "#e07b1a" }}
                        />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          ملف PDF
                        </Text>
                      </div>
                    ) : (
                      <Image
                        src={provider.contract_image}
                        alt="صورة العقد"
                        width={220}
                        height={140}
                        style={{ objectFit: "cover", display: "block" }}
                        preview={{
                          mask: (
                            <Space direction="vertical" align="center">
                              <EyeOutlined style={{ fontSize: 20 }} />
                              <span style={{ fontSize: 12 }}>عرض</span>
                            </Space>
                          ),
                        }}
                      />
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Button
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() =>
                        window.open(provider.contract_image, "_blank")
                      }
                      style={{ borderColor: "#e07b1a", color: "#e07b1a" }}
                    >
                      فتح الملف
                    </Button>
                    <Upload
                      showUploadList={false}
                      beforeUpload={handleContractUpload}
                      accept="image/*,.pdf"
                    >
                      <Button
                        size="small"
                        icon={
                          contractUploading ? (
                            <LoadingOutlined />
                          ) : (
                            <UploadOutlined />
                          )
                        }
                        loading={contractUploading}
                        style={{ borderColor: "#1677ff", color: "#1677ff" }}
                      >
                        تغيير الصورة
                      </Button>
                    </Upload>
                    <Popconfirm
                      title="حذف صورة العقد؟"
                      onConfirm={handleDeleteContract}
                      okText="نعم"
                      cancelText="لا"
                      okButtonProps={{ danger: true }}
                    >
                      <Button size="small" danger icon={<DeleteOutlined />}>
                        حذف
                      </Button>
                    </Popconfirm>
                  </div>
                </div>
              ) : (
                <Upload
                  showUploadList={false}
                  beforeUpload={handleContractUpload}
                  accept="image/*,.pdf"
                >
                  <div
                    className="contract-upload-area"
                    style={{ minWidth: 280 }}
                  >
                    {contractUploading ? (
                      <Space direction="vertical" align="center">
                        <Spin
                          indicator={
                            <LoadingOutlined
                              style={{ fontSize: 32, color: "#e07b1a" }}
                              spin
                            />
                          }
                        />
                        <Text type="secondary">جاري الرفع...</Text>
                      </Space>
                    ) : (
                      <Space direction="vertical" align="center" size={4}>
                        <UploadOutlined
                          style={{ fontSize: 32, color: "#e07b1a" }}
                        />
                        <Text style={{ fontWeight: 600, color: "#333" }}>
                          اضغط لرفع صورة العقد
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          JPG، PNG، WebP أو PDF — حتى 5 ميجابايت
                        </Text>
                      </Space>
                    )}
                  </div>
                </Upload>
              )}
            </Card>

            {/* Addresses */}
            <Card
              bordered={false}
              title={
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Space>
                    <EnvironmentOutlined style={{ color: "#e07b1a" }} />
                    <span style={{ fontWeight: 700 }}>
                      العناوين ({addresses.length})
                    </span>
                  </Space>
                  <Button
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={openAddAddress}
                    style={{ borderColor: "#e07b1a", color: "#e07b1a" }}
                  >
                    إضافة عنوان
                  </Button>
                </div>
              }
              style={{
                borderRadius: 16,
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
              }}
            >
              {addresses.length === 0 ? (
                <Empty
                  description="لا توجد عناوين مضافة"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                >
                  <Button
                    icon={<PlusOutlined />}
                    onClick={openAddAddress}
                    style={{ borderColor: "#e07b1a", color: "#e07b1a" }}
                  >
                    إضافة عنوان
                  </Button>
                </Empty>
              ) : (
                <Table
                  dataSource={addresses}
                  rowKey="id"
                  size="small"
                  pagination={false}
                  scroll={{ x: 500 }}
                  columns={[
                    {
                      title: "المدينة",
                      dataIndex: "city_name",
                      render: (v) => v ?? "—",
                    },
                    {
                      title: "المنطقة",
                      dataIndex: "region_name",
                      render: (v) => v ?? "—",
                    },
                    {
                      title: "الحي",
                      dataIndex: "district",
                      render: (v) => v ?? "—",
                    },
                    {
                      title: "الشارع",
                      dataIndex: "street",
                      render: (v) => v || "—",
                    },
                    {
                      title: "التصنيف",
                      dataIndex: "label",
                      render: (v, r) => (
                        <Space>
                          {v || "—"}
                          {r.is_default && (
                            <Tag color="orange" style={{ fontSize: 11 }}>
                              افتراضي
                            </Tag>
                          )}
                        </Space>
                      ),
                    },
                    {
                      title: "",
                      key: "actions",
                      render: (_, addr) => (
                        <Space>
                          <Button
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => openEditAddress(addr)}
                            style={{ borderColor: "#e07b1a", color: "#e07b1a" }}
                          />
                          <Popconfirm
                            title="حذف العنوان؟"
                            onConfirm={() => handleDeleteAddress(addr.id)}
                            okText="نعم"
                            cancelText="لا"
                            okButtonProps={{ danger: true }}
                          >
                            <Button
                              size="small"
                              danger
                              icon={<DeleteOutlined />}
                            />
                          </Popconfirm>
                        </Space>
                      ),
                    },
                  ]}
                />
              )}
            </Card>

            {/* Reviews */}
            <Card
              bordered={false}
              title={
                <Space wrap>
                  <StarFilled style={{ color: "#faad14" }} />
                  <span style={{ fontWeight: 700 }}>التقييمات</span>
                  {reviewStats.total_reviews > 0 ? (
                    <>
                      <Rate
                        disabled
                        allowHalf
                        value={avgDisplay}
                        style={{ fontSize: 14 }}
                      />
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        {avgDisplay.toFixed(1)} / 5 ({reviewStats.total_reviews}{" "}
                        تقييم)
                      </Text>
                    </>
                  ) : (
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      (لا توجد تقييمات)
                    </Text>
                  )}
                </Space>
              }
              style={{
                borderRadius: 16,
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
              }}
            >
              {reviews.length === 0 ? (
                <Empty
                  description="لا توجد تقييمات بعد"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
                <List
                  dataSource={reviews}
                  renderItem={(rev) => (
                    <List.Item
                      style={{
                        padding: "12px 0",
                        borderBottom: "1px solid #f5f5f5",
                      }}
                      actions={[
                        <Button
                          key="edit"
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => openEditReview(rev)}
                          style={{ borderColor: "#e07b1a", color: "#e07b1a" }}
                        />,
                        <Popconfirm
                          key="delete"
                          title="هل تريد حذف هذا التقييم؟"
                          onConfirm={() => handleDeleteReview(rev.id)}
                          okText="نعم"
                          cancelText="لا"
                          okButtonProps={{ danger: true }}
                        >
                          <Button
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                          />
                        </Popconfirm>,
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            icon={<UserOutlined />}
                            style={{ background: "#e07b1a" }}
                          />
                        }
                        title={
                          <Space wrap>
                            <span
                              style={{
                                fontWeight: 600,
                                wordBreak: "break-word",
                              }}
                            >
                              {rev.customer_name ?? "عميل"}
                            </span>
                            <Rate
                              disabled
                              value={rev.rating ?? 0}
                              style={{ fontSize: 12 }}
                            />
                          </Space>
                        }
                        description={
                          <div style={{ wordBreak: "break-word" }}>
                            {rev.comment ?? "—"}
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </Card>

            {/* Previous Works */}
            <Card
              bordered={false}
              title={
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontWeight: 700 }}>
                    الأعمال السابقة ({works.length})
                  </span>
                  <Button
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={(e) => {
                      e.stopPropagation(); // ← أضف السطر ده
                      workForm.resetFields();
                      setWorkModalOpen(true);
                    }}
                    style={{ borderColor: "#e07b1a", color: "#e07b1a" }}
                  >
                    إضافة عمل
                  </Button>
                </div>
              }
              style={{
                borderRadius: 16,
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
              }}
            >
              {works.length === 0 ? (
                <Empty
                  description="لا توجد أعمال سابقة"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                >
                  <Button
                    icon={<PlusOutlined />}
                    onClick={() => {
                      workForm.resetFields();
                      setWorkModalOpen(true);
                    }}
                    style={{ borderColor: "#e07b1a", color: "#e07b1a" }}
                  >
                    إضافة عمل
                  </Button>
                </Empty>
              ) : (
                <List
                  grid={{ gutter: 16, xs: 1, sm: 2, md: 3 }}
                  dataSource={works}
                  renderItem={(w) => (
                    <List.Item>
                      <Card
                        size="small"
                        style={{ borderRadius: 8, overflow: "hidden" }}
                        cover={
                          w.media_type === "image" && w.media_url ? (
                            <Image
                              src={w.media_url}
                              alt={w.title}
                              style={{ height: 120, objectFit: "cover" }}
                              preview={{ mask: <EyeOutlined /> }}
                            />
                          ) : w.media_type === "video" ? (
                            <div
                              style={{
                                height: 120,
                                background: "#1a1a2e",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#fff",
                                fontSize: 28,
                                cursor: "pointer",
                              }}
                              onClick={() => window.open(w.media_url, "_blank")}
                            >
                              🎬
                            </div>
                          ) : (
                            <div
                              style={{
                                height: 120,
                                background: "#f5f5f5",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#bbb",
                              }}
                            >
                              لا توجد صورة
                            </div>
                          )
                        }
                        actions={[
                          <Popconfirm
                            key="delete"
                            title="حذف هذا العمل؟"
                            onConfirm={() => handleDeleteWork(w.id)}
                            okText="نعم"
                            cancelText="لا"
                            okButtonProps={{ danger: true }}
                          >
                            <Button
                              size="small"
                              danger
                              icon={<DeleteOutlined />}
                            />
                          </Popconfirm>,
                        ]}
                      >
                        <Card.Meta
                          title={
                            <div style={{ wordBreak: "break-word" }}>
                              {w.title || "بدون عنوان"}
                            </div>
                          }
                          description={
                            <Text type="secondary" ellipsis>
                              {w.description}
                            </Text>
                          }
                        />
                      </Card>
                    </List.Item>
                  )}
                />
              )}
            </Card>
          </Space>
        </Col>
      </Row>
      {/* ══ Modal: Add Previous Work ══ */}
      <Modal
        title={
          <Space style={{ fontFamily: "'Cairo', sans-serif", fontWeight: 700 }}>
            <PlusOutlined style={{ color: "#e07b1a" }} />
            إضافة عمل جديد
          </Space>
        }
        open={workModalOpen}
        onOk={handleAddWork}
        onCancel={() => {
          setWorkModalOpen(false);
          workForm.resetFields();
        }}
        okText="إضافة"
        cancelText="إلغاء"
        confirmLoading={workUploading}
        okButtonProps={{
          style: { background: "#e07b1a", borderColor: "#e07b1a" },
        }}
        style={{ direction: "rtl", fontFamily: "'Cairo', sans-serif" }}
        width={480}
        destroyOnClose
      >
        <Form form={workForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="title" label="العنوان">
            <Input placeholder="عنوان العمل (اختياري)" />
          </Form.Item>
          <Form.Item name="description" label="الوصف">
            <Input.TextArea rows={2} placeholder="وصف مختصر (اختياري)" />
          </Form.Item>
          <Form.Item
            name="media"
            label="الصورة أو الفيديو"
            rules={[{ required: true, message: "اختر ملفاً" }]}
          >
            <Upload
              maxCount={1}
              beforeUpload={() => false}
              accept="image/*,video/*"
              listType="picture"
            >
              <Button icon={<UploadOutlined />}>اختر صورة أو فيديو</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      {/* ══ Modal: Edit Provider ══ */}
      <Modal
        title={
          <Space style={{ fontFamily: "'Cairo', sans-serif", fontWeight: 700 }}>
            <EditOutlined style={{ color: "#e07b1a" }} />
            تعديل بيانات مزود الخدمة
          </Space>
        }
        open={editOpen}
        onOk={handleSave}
        onCancel={() => setEditOpen(false)}
        okText="حفظ التعديلات"
        cancelText="إلغاء"
        confirmLoading={saving}
        okButtonProps={{
          style: { background: "#e07b1a", borderColor: "#e07b1a" },
        }}
        style={{ direction: "rtl", fontFamily: "'Cairo', sans-serif" }}
        width={500}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="الاسم"
            rules={[{ required: true, message: "الرجاء إدخال الاسم" }]}
          >
            <Input placeholder="الاسم الكامل" />
          </Form.Item>
          <Form.Item
            name="email"
            label="البريد الإلكتروني"
            rules={[{ type: "email", message: "بريد إلكتروني غير صحيح" }]}
          >
            <Input placeholder="example@mail.com" />
          </Form.Item>
        </Form>
      </Modal>

      {/* ══ Modal: Add / Edit Address ══ */}
      <Modal
        title={
          <Space style={{ fontFamily: "'Cairo', sans-serif", fontWeight: 700 }}>
            <EnvironmentOutlined style={{ color: "#e07b1a" }} />
            {editingAddr ? "تعديل العنوان" : "إضافة عنوان جديد"}
          </Space>
        }
        open={addrModalOpen}
        onOk={handleSaveAddress}
        onCancel={() => {
          setAddrModalOpen(false);
          setRegions([]);
          setSelectedCity(undefined);
          setSelectedRegion(undefined);
          setRegionError("");
          addrForm.resetFields();
        }}
        okText={editingAddr ? "حفظ التعديلات" : "إضافة"}
        cancelText="إلغاء"
        confirmLoading={addrSaving}
        okButtonProps={{
          style: { background: "#e07b1a", borderColor: "#e07b1a" },
        }}
        style={{ direction: "rtl", fontFamily: "'Cairo', sans-serif" }}
        width={540}
      >
        <Form form={addrForm} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={12}>
            {/* ── المدينة (controlled) ── */}
            <Col span={12}>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", marginBottom: 8 }}>
                  <span style={{ color: "#ff4d4f", marginLeft: 4 }}>*</span>
                  المدينة
                </label>
                <Select
                  style={{ width: "100%" }}
                  placeholder="اختر المدينة"
                  showSearch
                  optionFilterProp="children"
                  allowClear
                  value={selectedCity}
                  onChange={handleCityChange}
                >
                  {cities.map((c) => (
                    <Option key={c.id} value={c.id}>
                      {c.name}
                    </Option>
                  ))}
                </Select>
              </div>
            </Col>

            {/* ── المنطقة (controlled) ── */}
            <Col span={12}>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", marginBottom: 8 }}>
                  <span style={{ color: "#ff4d4f", marginLeft: 4 }}>*</span>
                  المنطقة
                </label>
                <Select
                  style={{ width: "100%" }}
                  placeholder={
                    regionsLoading
                      ? "جاري التحميل..."
                      : regions.length === 0
                      ? "اختر المدينة أولاً"
                      : "اختر المنطقة"
                  }
                  showSearch
                  optionFilterProp="children"
                  allowClear
                  value={selectedRegion}
                  onChange={handleRegionChange}
                  loading={regionsLoading}
                  notFoundContent={
                    regionsLoading
                      ? "جاري التحميل..."
                      : "لا توجد مناطق لهذه المدينة"
                  }
                >
                  {regions.map((r) => (
                    <Option key={r.id} value={r.id}>
                      {r.name}
                    </Option>
                  ))}
                </Select>
                {regionError && (
                  <div style={{ color: "#ff4d4f", fontSize: 12, marginTop: 4 }}>
                    {regionError}
                  </div>
                )}
              </div>
            </Col>

            <Col span={12}>
              <Form.Item
                name="district"
                label="الحي"
                rules={[{ required: true, message: "أدخل الحي" }]}
              >
                <Input placeholder="حي النزهة" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="street" label="الشارع">
                <Input placeholder="شارع الملك فهد" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="building_no" label="رقم المبنى">
                <Input placeholder="10" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="label" label="التصنيف">
                <Input placeholder="المنزل / العمل..." />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                name="is_default"
                label="عنوان افتراضي"
                valuePropName="checked"
              >
                <Switch checkedChildren="نعم" unCheckedChildren="لا" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* ══ Modal: Add / Edit Review ══ */}
      <Modal
        title={
          <Space style={{ fontFamily: "'Cairo', sans-serif", fontWeight: 700 }}>
            <StarFilled style={{ color: "#faad14" }} />
            {editingReview ? "تعديل التقييم" : "إضافة تقييم"}
          </Space>
        }
        open={reviewModalOpen}
        onOk={handleSaveReview}
        onCancel={() => {
          setReviewModalOpen(false);
          reviewForm.resetFields();
        }}
        okText={editingReview ? "حفظ التعديلات" : "إضافة"}
        cancelText="إلغاء"
        confirmLoading={reviewSaving}
        okButtonProps={{
          style: { background: "#e07b1a", borderColor: "#e07b1a" },
        }}
        style={{ direction: "rtl", fontFamily: "'Cairo', sans-serif" }}
        width={480}
        destroyOnClose
      >
        <Form form={reviewForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="rating"
            label="التقييم"
            rules={[{ required: true, message: "الرجاء اختيار تقييم" }]}
          >
            <Rate />
          </Form.Item>
          <Form.Item name="comment" label="التعليق">
            <Input.TextArea rows={3} placeholder="اكتب تعليقك هنا..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
