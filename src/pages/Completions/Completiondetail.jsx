import { useState, useEffect, useCallback, useRef } from "react";
import {
  Card,
  Button,
  Tag,
  Space,
  Typography,
  Avatar,
  Spin,
  Image,
  Empty,
  Row,
  Col,
  Popconfirm,
  message,
  Modal,
  Form,
  Input,
  Select,
  Badge,
  Upload,
} from "antd";
import {
  ArrowRightOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileProtectOutlined,
  UserOutlined,
  AppstoreOutlined,
  CalendarOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  PlayCircleOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  SaveOutlined,
  DollarOutlined,
  TagOutlined,
  SwapOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Dragger } = Upload;

const fmt = (v) =>
  v
    ? new Date(v).toLocaleDateString("ar-SA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

const fmtTime = (v) =>
  v
    ? new Date(v).toLocaleString("ar-SA", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

export default function CompletionDetail() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [form_, setForm_] = useState(null);
  const [loadingBooking, setLoadingBooking] = useState(true);
  const [loadingForm, setLoadingForm] = useState(true);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [mediaModal, setMediaModal] = useState(false);
  const [mediaForm] = Form.useForm();
  const [savingMedia, setSavingMedia] = useState(false);

  // ── Previous Work State ──
  const [previousWork, setPreviousWork] = useState(null);
  const [loadingPrevWork, setLoadingPrevWork] = useState(false);
  const [prevWorkModal, setPrevWorkModal] = useState(false);
  const [savingPrevWork, setSavingPrevWork] = useState(false);
  const [beforeFile, setBeforeFile] = useState(null);
  const [afterFile, setAfterFile] = useState(null);
  const [beforePreview, setBeforePreview] = useState(null);
  const [afterPreview, setAfterPreview] = useState(null);

  const fetchBooking = useCallback(async () => {
    setLoadingBooking(true);
    try {
      const res = await api.get(
        `/existedservices/admin/bookings/${bookingId}/`
      );
      setBooking(res.data);
    } catch {
      message.error("فشل تحميل بيانات الحجز");
    } finally {
      setLoadingBooking(false);
    }
  }, [bookingId]);

  const fetchForm = useCallback(async () => {
    setLoadingForm(true);
    try {
      const res = await api.get(
        `/existedservices/provider/completion-forms/${bookingId}/`
      );
      setForm_(res.data);
      setNotesValue(res.data.notes ?? "");
    } catch (err) {
      if (err?.response?.status === 404) setForm_(null);
      else message.error("فشل تحميل نموذج الإتمام");
    } finally {
      setLoadingForm(false);
    }
  }, [bookingId]);

  const fetchPreviousWork = useCallback(async () => {
    setLoadingPrevWork(true);
    try {
      const res = await api.get(
        `/existedservices/bookings/${bookingId}/previous-work/`
      );
      setPreviousWork(res.data);
    } catch (err) {
      if (err?.response?.status === 404) setPreviousWork(null);
      else message.error("فشل تحميل العمل السابق");
    } finally {
      setLoadingPrevWork(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchBooking();
    fetchForm();
    fetchPreviousWork();
  }, [fetchBooking, fetchForm, fetchPreviousWork]);

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await api.patch(
        `/existedservices/provider/completion-forms/${bookingId}/`,
        { notes: notesValue }
      );
      message.success("تم حفظ الملاحظات");
      setEditingNotes(false);
      fetchForm();
    } catch {
      message.error("فشل حفظ الملاحظات");
    } finally {
      setSavingNotes(false);
    }
  };

  const handleFinish = async () => {
    setFinishing(true);
    try {
      await api.patch(
        `/existedservices/provider/completion-forms/${bookingId}/`,
        { is_finished: true }
      );
      message.success("تم إنهاء الخدمة بنجاح ✓");
      fetchForm();
    } catch (err) {
      message.error(
        err?.response?.data?.non_field_errors?.[0] ?? "فشل إنهاء الخدمة"
      );
    } finally {
      setFinishing(false);
    }
  };

  const handleAddMedia = async () => {
    try {
      const values = await mediaForm.validateFields();
      setSavingMedia(true);
      await api.post(
        `/existedservices/provider/completion-forms/${bookingId}/media/`,
        values
      );
      message.success("تم إضافة الوسائط");
      setMediaModal(false);
      mediaForm.resetFields();
      fetchForm();
    } catch (e) {
      if (e?.errorFields) return;
      message.error("فشل إضافة الوسائط");
    } finally {
      setSavingMedia(false);
    }
  };

  const handleDeleteMedia = async (mediaId) => {
    try {
      await api.delete(
        `/existedservices/provider/completion-forms/${bookingId}/media/${mediaId}/`
      );
      message.success("تم حذف الوسائط");
      fetchForm();
    } catch {
      message.error("فشل الحذف");
    }
  };

  // ── Previous Work Handlers ──
  const makePreview = (file) => {
    if (!file) return null;
    return URL.createObjectURL(file);
  };

  const openPrevWorkModal = () => {
    setBeforeFile(null);
    setAfterFile(null);
    setBeforePreview(previousWork?.before_image ?? null);
    setAfterPreview(previousWork?.after_image ?? null);
    setPrevWorkModal(true);
  };

  const closePrevWorkModal = () => {
    setPrevWorkModal(false);
    setBeforeFile(null);
    setAfterFile(null);
    setBeforePreview(null);
    setAfterPreview(null);
  };

  const handleSavePrevWork = async () => {
    // لازم يكون عنده صورتين على الأقل لو بيضيف جديد
    const isEdit = !!previousWork;
    if (!isEdit && (!beforeFile || !afterFile)) {
      message.warning("من فضلك ارفع صورة قبل وصورة بعد");
      return;
    }

    const formData = new FormData();
    if (beforeFile) formData.append("before_image", beforeFile);
    if (afterFile) formData.append("after_image", afterFile);

    setSavingPrevWork(true);
    try {
      if (isEdit) {
        await api.patch(
          `/existedservices/bookings/${bookingId}/previous-work/manage/`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        message.success("تم تحديث العمل السابق");
      } else {
        await api.post(
          `/existedservices/bookings/${bookingId}/previous-work/`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        message.success("تم إضافة العمل السابق");
      }
      closePrevWorkModal();
      fetchPreviousWork();
    } catch (err) {
      const errMsg =
        err?.response?.data?.non_field_errors?.[0] ??
        err?.response?.data?.detail ??
        "فشل حفظ العمل السابق";
      message.error(errMsg);
    } finally {
      setSavingPrevWork(false);
    }
  };

  const handleDeletePrevWork = async () => {
    try {
      await api.delete(
        `/existedservices/bookings/${bookingId}/previous-work/manage/`
      );
      message.success("تم حذف العمل السابق");
      setPreviousWork(null);
    } catch {
      message.error("فشل حذف العمل السابق");
    }
  };

  const isFinished = form_?.is_finished === true;
  const hasDiscount = booking && parseFloat(booking.discount_amount ?? 0) > 0;
  const displayedCost = booking
    ? parseFloat(
        hasDiscount
          ? booking.final_cost
          : booking.final_cost ?? booking.total_cost
      )
    : 0;

  if (loadingBooking) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 300,
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Cairo', sans-serif", direction: "rtl" }}>
      <Button
        type="text"
        icon={<ArrowRightOutlined />}
        onClick={() => navigate("/completions")}
        style={{ marginBottom: 16, color: "#0f1f1a", fontWeight: 600 }}
      >
        العودة إلى نماذج الإتمام
      </Button>

      {/* ── Header Card ── */}
      {booking && (
        <Card
          bordered={false}
          style={{
            borderRadius: 16,
            marginBottom: 20,
            background: "linear-gradient(135deg, #0f1f1a 0%, #1a3a30 100%)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          }}
          bodyStyle={{ padding: "24px 28px" }}
        >
          <Row gutter={[24, 16]} align="middle">
            <Col xs={24} md={14}>
              <Space align="start" size={16}>
                <Avatar
                  size={60}
                  icon={<AppstoreOutlined />}
                  shape="square"
                  style={{
                    background: "#e07b1a",
                    borderRadius: 10,
                    fontSize: 26,
                    flexShrink: 0,
                  }}
                />
                <div>
                  <Title
                    level={4}
                    style={{
                      margin: 0,
                      color: "#fff",
                      fontFamily: "'Cairo', sans-serif",
                    }}
                  >
                    {booking.service_title}
                  </Title>
                  <Text
                    style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}
                  >
                    حجز #{String(booking.id).slice(0, 8)}
                  </Text>
                  <div style={{ marginTop: 8 }}>
                    <Tag color="success" style={{ borderRadius: 6 }}>
                      مكتمل
                    </Tag>
                  </div>
                </div>
              </Space>
            </Col>
            <Col xs={24} md={10}>
              <Row gutter={[8, 8]}>
                <Col xs={12}>
                  <InfoBox
                    icon={<UserOutlined />}
                    label="العميل"
                    value={booking.customer_name}
                    sub={booking.customer_phone}
                  />
                </Col>
                <Col xs={12}>
                  <InfoBox
                    icon={<UserOutlined />}
                    label="الفني"
                    value={booking.provider_name ?? "—"}
                    sub={booking.provider_phone}
                  />
                </Col>
                <Col xs={12}>
                  <InfoBox
                    icon={<CalendarOutlined />}
                    label="تاريخ الخدمة"
                    value={fmt(booking.scheduled_date)}
                  />
                </Col>
                <Col xs={12}>
                  <div
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      borderRadius: 8,
                      padding: "8px 12px",
                    }}
                  >
                    <Text
                      style={{
                        color: "rgba(255,255,255,0.5)",
                        fontSize: 10,
                        display: "block",
                      }}
                    >
                      <DollarOutlined style={{ marginLeft: 4 }} />
                      الإجمالي
                    </Text>
                    {hasDiscount ? (
                      <>
                        {booking.coupon_code && (
                          <div style={{ marginBottom: 2 }}>
                            <Tag
                              icon={<TagOutlined />}
                              color="purple"
                              style={{
                                fontSize: 10,
                                borderRadius: 4,
                                margin: 0,
                              }}
                            >
                              {booking.coupon_code}
                            </Tag>
                          </div>
                        )}
                        <Text
                          style={{
                            color: "rgba(255,255,255,0.35)",
                            fontSize: 10,
                            textDecoration: "line-through",
                            display: "block",
                          }}
                        >
                          {Number(booking.total_cost).toLocaleString("ar-SA")}{" "}
                          ر.س
                        </Text>
                        <Text
                          style={{
                            color: "#ff7875",
                            fontSize: 10,
                            display: "block",
                          }}
                        >
                          −{" "}
                          {Number(booking.discount_amount).toLocaleString(
                            "ar-SA"
                          )}{" "}
                          ر.س
                        </Text>
                        <Text
                          style={{
                            color: "#95f4a1",
                            fontWeight: 700,
                            fontSize: 13,
                            display: "block",
                          }}
                        >
                          {Number(booking.final_cost).toLocaleString("ar-SA")}{" "}
                          ر.س
                        </Text>
                      </>
                    ) : (
                      <Text
                        style={{
                          color: "#fff",
                          fontWeight: 600,
                          fontSize: 13,
                          display: "block",
                        }}
                      >
                        {Number(displayedCost).toLocaleString("ar-SA")} ر.س
                      </Text>
                    )}
                  </div>
                </Col>
              </Row>
            </Col>
          </Row>
        </Card>
      )}

      {/* ── Completion Form ── */}
      {loadingForm ? (
        <Card
          bordered={false}
          style={{ borderRadius: 16, minHeight: 200 }}
          bodyStyle={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Spin />
        </Card>
      ) : !form_ ? (
        <Card
          bordered={false}
          style={{ borderRadius: 16 }}
          bodyStyle={{ textAlign: "center", padding: 48 }}
        >
          <Empty
            description={
              <Text type="secondary">لم يتم إنشاء نموذج الإتمام بعد.</Text>
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {/* Notes + Status */}
            <Col xs={24} lg={10}>
              <Card
                bordered={false}
                style={{
                  borderRadius: 16,
                  marginBottom: 16,
                  border: isFinished
                    ? "2px solid #52c41a"
                    : "2px solid #faad14",
                  background: isFinished ? "#f6ffed" : "#fffbe6",
                }}
                bodyStyle={{ padding: "20px 24px" }}
              >
                <Space direction="vertical" style={{ width: "100%" }} size={12}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Space>
                      {isFinished ? (
                        <CheckCircleOutlined
                          style={{ fontSize: 24, color: "#52c41a" }}
                        />
                      ) : (
                        <ClockCircleOutlined
                          style={{ fontSize: 24, color: "#faad14" }}
                        />
                      )}
                      <div>
                        <Text
                          strong
                          style={{
                            fontSize: 15,
                            color: isFinished ? "#16a34a" : "#d97706",
                            display: "block",
                          }}
                        >
                          {isFinished
                            ? "الخدمة مكتملة"
                            : "بانتظار إتمام الخدمة"}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {isFinished
                            ? `أُنجز بتاريخ: ${fmtTime(form_.finished_at)}`
                            : "لم يقم الفني بإنهاء الخدمة بعد"}
                        </Text>
                      </div>
                    </Space>
                    <Tag
                      color={isFinished ? "success" : "warning"}
                      style={{ borderRadius: 8, fontWeight: 700 }}
                    >
                      {isFinished ? "منتهية" : "قيد التنفيذ"}
                    </Tag>
                  </div>
                  {!isFinished && (
                    <Popconfirm
                      title="إنهاء الخدمة؟"
                      description="سيتم تحديد الخدمة كمنتهية ولا يمكن التراجع."
                      onConfirm={handleFinish}
                      okText="نعم، إنهاء"
                      cancelText="إلغاء"
                      okButtonProps={{
                        style: {
                          background: "#16a34a",
                          borderColor: "#16a34a",
                        },
                      }}
                    >
                      <Button
                        type="primary"
                        icon={<CheckCircleOutlined />}
                        loading={finishing}
                        block
                        style={{
                          background: "#16a34a",
                          borderColor: "#16a34a",
                          borderRadius: 8,
                          fontWeight: 700,
                          height: 40,
                        }}
                      >
                        إنهاء الخدمة
                      </Button>
                    </Popconfirm>
                  )}
                </Space>
              </Card>

              {/* Notes */}
              <Card
                bordered={false}
                style={{ borderRadius: 16 }}
                bodyStyle={{ padding: "20px 24px" }}
                title={
                  <Space>
                    <FileProtectOutlined style={{ color: "#e07b1a" }} />
                    <Text strong>ملاحظات الفني</Text>
                  </Space>
                }
                extra={
                  !isFinished && (
                    <Button
                      type="text"
                      icon={editingNotes ? <SaveOutlined /> : <EditOutlined />}
                      style={{ color: "#e07b1a" }}
                      loading={savingNotes}
                      onClick={
                        editingNotes
                          ? handleSaveNotes
                          : () => setEditingNotes(true)
                      }
                    >
                      {editingNotes ? "حفظ" : "تعديل"}
                    </Button>
                  )
                }
              >
                {editingNotes ? (
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <TextArea
                      rows={5}
                      value={notesValue}
                      onChange={(e) => setNotesValue(e.target.value)}
                      placeholder="أدخل ملاحظات حول إتمام الخدمة..."
                      style={{ borderRadius: 8 }}
                    />
                    <Space>
                      <Button
                        type="primary"
                        loading={savingNotes}
                        onClick={handleSaveNotes}
                        style={{
                          background: "#0f1f1a",
                          borderColor: "#0f1f1a",
                          borderRadius: 6,
                        }}
                      >
                        حفظ الملاحظات
                      </Button>
                      <Button
                        onClick={() => {
                          setEditingNotes(false);
                          setNotesValue(form_.notes ?? "");
                        }}
                      >
                        إلغاء
                      </Button>
                    </Space>
                  </Space>
                ) : form_?.notes ? (
                  <Paragraph
                    style={{
                      background: "#fafafa",
                      borderRadius: 8,
                      padding: "12px 16px",
                      margin: 0,
                      fontSize: 13,
                      lineHeight: 1.8,
                      border: "1px solid #f0f0f0",
                    }}
                  >
                    {form_.notes}
                  </Paragraph>
                ) : (
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    لا توجد ملاحظات بعد.{" "}
                    {!isFinished && (
                      <Button
                        type="link"
                        size="small"
                        onClick={() => setEditingNotes(true)}
                        style={{ padding: 0 }}
                      >
                        إضافة ملاحظات
                      </Button>
                    )}
                  </Text>
                )}
              </Card>
            </Col>

            {/* Media */}
            <Col xs={24} lg={14}>
              <Card
                bordered={false}
                style={{ borderRadius: 16 }}
                bodyStyle={{ padding: "20px 24px" }}
                title={
                  <Space>
                    <PictureOutlined style={{ color: "#1677ff" }} />
                    <Text strong>وسائط إتمام الخدمة</Text>
                    <Badge
                      count={form_?.media?.length ?? 0}
                      style={{ background: "#1677ff" }}
                    />
                  </Space>
                }
                extra={
                  !isFinished && (
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      size="small"
                      onClick={() => setMediaModal(true)}
                      style={{
                        background: "#1677ff",
                        borderColor: "#1677ff",
                        borderRadius: 6,
                      }}
                    >
                      إضافة وسائط
                    </Button>
                  )
                }
              >
                {!form_?.media?.length ? (
                  <Empty
                    description="لا توجد صور أو فيديوهات بعد"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    style={{ padding: "32px 0" }}
                  />
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(140px, 1fr))",
                      gap: 12,
                    }}
                  >
                    {form_.media.map((m) => (
                      <MediaCard
                        key={m.id}
                        item={m}
                        isFinished={isFinished}
                        onDelete={() => handleDeleteMedia(m.id)}
                      />
                    ))}
                  </div>
                )}
              </Card>
            </Col>
          </Row>

          {/* ══════════════════════════════════════════
              ── Previous Work Section (NEW) ──
          ══════════════════════════════════════════ */}
          <Card
            bordered={false}
            style={{
              borderRadius: 16,
              marginTop: 16,
              border: "2px dashed #e07b1a22",
              background: previousWork ? "#fffaf5" : "#fafafa",
            }}
            bodyStyle={{ padding: "20px 24px" }}
            title={
              <Space>
                <SwapOutlined style={{ color: "#e07b1a", fontSize: 18 }} />
                <Text strong style={{ fontSize: 15 }}>
                  العمل السابق (قبل / بعد)
                </Text>
                {previousWork && (
                  <Tag color="orange" style={{ borderRadius: 6 }}>
                    مضاف
                  </Tag>
                )}
              </Space>
            }
            extra={
              <Space>
                {previousWork && (
                  <Popconfirm
                    title="حذف العمل السابق؟"
                    description="سيتم حذف صورتي قبل وبعد نهائياً."
                    onConfirm={handleDeletePrevWork}
                    okText="حذف"
                    cancelText="إلغاء"
                    okButtonProps={{ danger: true }}
                  >
                    <Button
                      type="text"
                      icon={<DeleteOutlined />}
                      style={{ color: "#ff4d4f" }}
                    />
                  </Popconfirm>
                )}
                <Button
                  type={previousWork ? "default" : "primary"}
                  icon={previousWork ? <EditOutlined /> : <PlusOutlined />}
                  onClick={openPrevWorkModal}
                  style={
                    previousWork
                      ? { borderColor: "#e07b1a", color: "#e07b1a" }
                      : { background: "#e07b1a", borderColor: "#e07b1a" }
                  }
                >
                  {previousWork ? "تعديل" : "إضافة عمل سابق"}
                </Button>
              </Space>
            }
          >
            {loadingPrevWork ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  padding: "32px 0",
                }}
              >
                <Spin />
              </div>
            ) : previousWork ? (
              <Row gutter={[24, 16]}>
                {/* Before */}
                <Col xs={24} sm={12}>
                  <div
                    style={{
                      borderRadius: 12,
                      overflow: "hidden",
                      border: "2px solid #ff4d4f33",
                      background: "#fff1f0",
                    }}
                  >
                    <div
                      style={{
                        background: "#ff4d4f",
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: 700,
                        padding: "6px 14px",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span style={{ fontSize: 16 }}>⬤</span> قبل
                    </div>
                    <Image
                      src={previousWork.before_image}
                      alt="قبل"
                      style={{
                        width: "100%",
                        maxHeight: 240,
                        objectFit: "cover",
                        display: "block",
                      }}
                      preview={{ mask: "عرض" }}
                    />
                  </div>
                </Col>

                {/* After */}
                <Col xs={24} sm={12}>
                  <div
                    style={{
                      borderRadius: 12,
                      overflow: "hidden",
                      border: "2px solid #52c41a33",
                      background: "#f6ffed",
                    }}
                  >
                    <div
                      style={{
                        background: "#52c41a",
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: 700,
                        padding: "6px 14px",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span style={{ fontSize: 16 }}>⬤</span> بعد
                    </div>
                    <Image
                      src={previousWork.after_image}
                      alt="بعد"
                      style={{
                        width: "100%",
                        maxHeight: 240,
                        objectFit: "cover",
                        display: "block",
                      }}
                      preview={{ mask: "عرض" }}
                    />
                  </div>
                </Col>
              </Row>
            ) : (
              <Empty
                image={
                  <SwapOutlined style={{ fontSize: 48, color: "#e07b1a44" }} />
                }
                description={
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    لم يتم إضافة صور قبل/بعد بعد. اضغط "إضافة عمل سابق"
                    لإضافتها.
                  </Text>
                }
                style={{ padding: "24px 0" }}
              />
            )}
          </Card>
        </>
      )}

      {/* ── Modal: Add Media ── */}
      <Modal
        title={
          <Space style={{ fontFamily: "'Cairo', sans-serif", fontWeight: 700 }}>
            <PlusOutlined />
            إضافة صورة / فيديو
          </Space>
        }
        open={mediaModal}
        onOk={handleAddMedia}
        onCancel={() => {
          setMediaModal(false);
          mediaForm.resetFields();
        }}
        okText="إضافة"
        cancelText="إلغاء"
        confirmLoading={savingMedia}
        okButtonProps={{
          style: { background: "#1677ff", borderColor: "#1677ff" },
        }}
        style={{ direction: "rtl", fontFamily: "'Cairo', sans-serif" }}
      >
        <Form form={mediaForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="media_type"
            label="نوع الوسائط"
            rules={[{ required: true, message: "اختر نوع الوسائط" }]}
          >
            <Select placeholder="صورة أو فيديو">
              <Option value="image">
                <Space>
                  <PictureOutlined /> صورة
                </Space>
              </Option>
              <Option value="video">
                <Space>
                  <VideoCameraOutlined /> فيديو
                </Space>
              </Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="media_url"
            label="رابط الوسائط"
            rules={[
              { required: true, message: "أدخل رابط الوسائط" },
              { type: "url", message: "رابط غير صحيح" },
            ]}
          >
            <Input placeholder="https://res.cloudinary.com/..." />
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(p, c) => p.media_type !== c.media_type}
          >
            {({ getFieldValue }) =>
              getFieldValue("media_type") === "video" ? (
                <Form.Item
                  name="thumbnail_url"
                  label="رابط الصورة المصغرة (Thumbnail)"
                  rules={[
                    { required: true, message: "الفيديو يحتاج thumbnail" },
                    { type: "url", message: "رابط غير صحيح" },
                  ]}
                >
                  <Input placeholder="https://res.cloudinary.com/..." />
                </Form.Item>
              ) : null
            }
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Modal: Previous Work (NEW) ── */}
      <Modal
        title={
          <Space style={{ fontFamily: "'Cairo', sans-serif", fontWeight: 700 }}>
            <SwapOutlined style={{ color: "#e07b1a" }} />
            {previousWork ? "تعديل العمل السابق" : "إضافة عمل سابق (قبل / بعد)"}
          </Space>
        }
        open={prevWorkModal}
        onOk={handleSavePrevWork}
        onCancel={closePrevWorkModal}
        okText={previousWork ? "حفظ التعديلات" : "إضافة"}
        cancelText="إلغاء"
        confirmLoading={savingPrevWork}
        okButtonProps={{
          style: { background: "#e07b1a", borderColor: "#e07b1a" },
        }}
        style={{ direction: "rtl", fontFamily: "'Cairo', sans-serif" }}
        width={560}
      >
        <Row gutter={16} style={{ marginTop: 16 }}>
          {/* Before Upload */}
          <Col span={12}>
            <Text
              strong
              style={{ display: "block", marginBottom: 8, color: "#ff4d4f" }}
            >
              ⬤ صورة قبل
            </Text>
            <div
              style={{
                border: "2px dashed #ff4d4f66",
                borderRadius: 10,
                overflow: "hidden",
                cursor: "pointer",
                background: "#fff1f0",
                minHeight: 140,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
              onClick={() => document.getElementById("before-input").click()}
            >
              {beforePreview ? (
                <>
                  <img
                    src={beforePreview}
                    alt="before"
                    style={{
                      width: "100%",
                      height: 140,
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(0,0,0,0.35)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: 0,
                      transition: "opacity 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = 0)}
                  >
                    <Text style={{ color: "#fff", fontSize: 12 }}>
                      تغيير الصورة
                    </Text>
                  </div>
                </>
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    color: "#ff4d4f99",
                    padding: 16,
                  }}
                >
                  <InboxOutlined
                    style={{ fontSize: 32, display: "block", marginBottom: 8 }}
                  />
                  <Text style={{ color: "#ff4d4f99", fontSize: 12 }}>
                    اضغط لرفع صورة قبل
                  </Text>
                </div>
              )}
            </div>
            <input
              id="before-input"
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setBeforeFile(f);
                  setBeforePreview(URL.createObjectURL(f));
                }
                e.target.value = "";
              }}
            />
          </Col>

          {/* After Upload */}
          <Col span={12}>
            <Text
              strong
              style={{ display: "block", marginBottom: 8, color: "#52c41a" }}
            >
              ⬤ صورة بعد
            </Text>
            <div
              style={{
                border: "2px dashed #52c41a66",
                borderRadius: 10,
                overflow: "hidden",
                cursor: "pointer",
                background: "#f6ffed",
                minHeight: 140,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
              onClick={() => document.getElementById("after-input").click()}
            >
              {afterPreview ? (
                <>
                  <img
                    src={afterPreview}
                    alt="after"
                    style={{
                      width: "100%",
                      height: 140,
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(0,0,0,0.35)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: 0,
                      transition: "opacity 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = 0)}
                  >
                    <Text style={{ color: "#fff", fontSize: 12 }}>
                      تغيير الصورة
                    </Text>
                  </div>
                </>
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    color: "#52c41a99",
                    padding: 16,
                  }}
                >
                  <InboxOutlined
                    style={{ fontSize: 32, display: "block", marginBottom: 8 }}
                  />
                  <Text style={{ color: "#52c41a99", fontSize: 12 }}>
                    اضغط لرفع صورة بعد
                  </Text>
                </div>
              )}
            </div>
            <input
              id="after-input"
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setAfterFile(f);
                  setAfterPreview(URL.createObjectURL(f));
                }
                e.target.value = "";
              }}
            />
          </Col>
        </Row>

        {!previousWork && (
          <Text
            type="secondary"
            style={{ fontSize: 12, display: "block", marginTop: 12 }}
          >
            * الصورتان مطلوبتان عند الإضافة لأول مرة. عند التعديل يمكنك تغيير
            واحدة فقط.
          </Text>
        )}
      </Modal>
    </div>
  );
}

// ── InfoBox helper ──
function InfoBox({ icon, label, value, sub }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.08)",
        borderRadius: 8,
        padding: "8px 12px",
      }}
    >
      <Text
        style={{
          color: "rgba(255,255,255,0.5)",
          fontSize: 10,
          display: "block",
        }}
      >
        {icon && <span style={{ marginLeft: 4 }}>{icon}</span>}
        {label}
      </Text>
      <Text
        style={{
          color: "#fff",
          fontWeight: 600,
          fontSize: 12,
          display: "block",
        }}
      >
        {value}
      </Text>
      {sub && (
        <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>
          {sub}
        </Text>
      )}
    </div>
  );
}

// ── Media Card ──
function MediaCard({ item, isFinished, onDelete }) {
  const isVideo = item.media_type === "video";
  const thumb = isVideo ? item.thumbnail_url : item.media_url;

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 10,
        overflow: "hidden",
        border: "1px solid #e8e8e8",
        background: "#fafafa",
        aspectRatio: "1",
      }}
    >
      {thumb ? (
        <Image
          src={thumb}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          preview={!isVideo}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f0f0f0",
            fontSize: 32,
            color: "#bbb",
          }}
        >
          <PictureOutlined />
        </div>
      )}
      {isVideo && (
        <a href={item.media_url} target="_blank" rel="noreferrer">
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <PlayCircleOutlined style={{ fontSize: 32, color: "#fff" }} />
          </div>
        </a>
      )}
      {!isFinished && (
        <Popconfirm
          title="حذف هذه الوسائط؟"
          onConfirm={onDelete}
          okText="حذف"
          cancelText="إلغاء"
          okButtonProps={{ danger: true }}
        >
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            style={{
              position: "absolute",
              top: 6,
              left: 6,
              borderRadius: 6,
              padding: "2px 6px",
              fontSize: 11,
              opacity: 0.85,
            }}
          />
        </Popconfirm>
      )}
      <Tag
        color={isVideo ? "blue" : "purple"}
        style={{
          position: "absolute",
          bottom: 6,
          right: 6,
          fontSize: 10,
          margin: 0,
          borderRadius: 4,
        }}
      >
        {isVideo ? "فيديو" : "صورة"}
      </Tag>
    </div>
  );
}
