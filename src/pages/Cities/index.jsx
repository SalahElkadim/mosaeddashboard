import { useState, useEffect, useCallback } from "react";
import {
  Table,
  Tag,
  Button,
  Space,
  Input,
  Card,
  Row,
  Col,
  Statistic,
  Tooltip,
  Modal,
  Form,
  Switch,
  Popconfirm,
  message,
  Empty,
  Divider,
  Typography,
  Collapse,
  Badge,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  EnvironmentOutlined,
  ApartmentOutlined,
  CheckCircleOutlined,
  StopOutlined,
  BuildOutlined,
} from "@ant-design/icons";
import api from "../../api/axios";

const { Search } = Input;
const { Text } = Typography;
const { Panel } = Collapse;

export default function Cities() {
  // ── State ──
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  // regions per city: { [cityId]: [...] }
  const [regionsMap, setRegionsMap] = useState({});
  const [regionsLoading, setRegionsLoading] = useState({});

  // City modal
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [editingCity, setEditingCity] = useState(null);
  const [citySaving, setCitySaving] = useState(false);
  const [cityForm] = Form.useForm();

  // Region modal
  const [regionModalOpen, setRegionModalOpen] = useState(false);
  const [editingRegion, setEditingRegion] = useState(null);
  const [regionSaving, setRegionSaving] = useState(false);
  const [regionCityId, setRegionCityId] = useState(null); // which city we're adding to
  const [regionForm] = Form.useForm();

  // ── Fetch ──
  const fetchCities = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/accounts/cities/");
      const data = Array.isArray(res.data) ? res.data : res.data.results ?? [];
      setCities(data);
    } catch {
      message.error("فشل تحميل المدن");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRegions = async (cityId) => {
    setRegionsLoading((prev) => ({ ...prev, [cityId]: true }));
    try {
      const res = await api.get(`/accounts/regions/?city_id=${cityId}`);
      const data = Array.isArray(res.data) ? res.data : res.data.results ?? [];
      setRegionsMap((prev) => ({ ...prev, [cityId]: data }));
    } catch {
      message.error("فشل تحميل المناطق");
    } finally {
      setRegionsLoading((prev) => ({ ...prev, [cityId]: false }));
    }
  };

  useEffect(() => {
    fetchCities();
  }, []);

  // When a collapse panel opens, load its regions lazily
  const handlePanelChange = (keys) => {
    keys.forEach((cityId) => {
      if (!regionsMap[cityId]) fetchRegions(cityId);
    });
  };

  // ── City CRUD ──
  const openAddCity = () => {
    setEditingCity(null);
    cityForm.resetFields();
    cityForm.setFieldsValue({ is_active: true });
    setCityModalOpen(true);
  };

  const openEditCity = (city) => {
    setEditingCity(city);
    cityForm.setFieldsValue({ name: city.name, is_active: city.is_active });
    setCityModalOpen(true);
  };

  const handleSaveCity = async () => {
    try {
      const values = await cityForm.validateFields();
      setCitySaving(true);
      if (editingCity) {
        await api.patch(`/accounts/cities/${editingCity.id}/`, values);
        message.success("تم تعديل المدينة");
      } else {
        await api.post("/accounts/cities/", values);
        message.success("تم إضافة المدينة");
      }
      setCityModalOpen(false);
      fetchCities();
    } catch (e) {
      if (e?.errorFields) return;
      const data = e?.response?.data;
      if (data && typeof data === "object") {
        message.error(Object.values(data).flat()[0] || "حدث خطأ");
      } else {
        message.error("فشل الحفظ");
      }
    } finally {
      setCitySaving(false);
    }
  };

  const handleDeleteCity = async (id) => {
    try {
      await api.delete(`/accounts/cities/${id}/`);
      message.success("تم حذف المدينة");
      fetchCities();
      setRegionsMap((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    } catch {
      message.error("فشل حذف المدينة");
    }
  };

  const handleToggleCityActive = async (city) => {
    try {
      await api.patch(`/accounts/cities/${city.id}/`, {
        is_active: !city.is_active,
      });
      message.success(city.is_active ? "تم تعطيل المدينة" : "تم تفعيل المدينة");
      fetchCities();
    } catch {
      message.error("فشل تغيير حالة المدينة");
    }
  };

  // ── Region CRUD ──
  const openAddRegion = (cityId) => {
    setEditingRegion(null);
    setRegionCityId(cityId);
    regionForm.resetFields();
    regionForm.setFieldsValue({ is_active: true });
    setRegionModalOpen(true);
  };

  const openEditRegion = (region, cityId) => {
    setEditingRegion(region);
    setRegionCityId(cityId);
    regionForm.setFieldsValue({
      name: region.name,
      is_active: region.is_active,
    });
    setRegionModalOpen(true);
  };

  const handleSaveRegion = async () => {
    try {
      const values = await regionForm.validateFields();
      setRegionSaving(true);
      if (editingRegion) {
        await api.patch(`/accounts/regions/${editingRegion.id}/`, values);
        message.success("تم تعديل المنطقة");
      } else {
        await api.post("/accounts/regions/", {
          ...values,
          city: regionCityId,
        });
        message.success("تم إضافة المنطقة");
      }
      setRegionModalOpen(false);
      fetchRegions(regionCityId);
    } catch (e) {
      if (e?.errorFields) return;
      const data = e?.response?.data;
      if (data && typeof data === "object") {
        message.error(Object.values(data).flat()[0] || "حدث خطأ");
      } else {
        message.error("فشل الحفظ");
      }
    } finally {
      setRegionSaving(false);
    }
  };

  const handleDeleteRegion = async (regionId, cityId) => {
    try {
      await api.delete(`/accounts/regions/${regionId}/`);
      message.success("تم حذف المنطقة");
      fetchRegions(cityId);
    } catch {
      message.error("فشل حذف المنطقة");
    }
  };

  const handleToggleRegionActive = async (region, cityId) => {
    try {
      await api.patch(`/accounts/regions/${region.id}/`, {
        is_active: !region.is_active,
      });
      message.success(
        region.is_active ? "تم تعطيل المنطقة" : "تم تفعيل المنطقة"
      );
      fetchRegions(cityId);
    } catch {
      message.error("فشل تغيير حالة المنطقة");
    }
  };

  // ── Derived data ──
  const filtered = cities.filter((c) =>
    c.name?.toLowerCase().includes(searchText.toLowerCase())
  );

  const activeCount = cities.filter((c) => c.is_active).length;
  const inactiveCount = cities.filter((c) => !c.is_active).length;
  const totalRegions = Object.values(regionsMap).reduce(
    (sum, arr) => sum + arr.length,
    0
  );

  // Regions columns (inside each city panel)
  const regionColumns = (cityId) => [
    {
      title: "اسم المنطقة",
      dataIndex: "name",
      key: "name",
      render: (v) => (
        <Space>
          <ApartmentOutlined style={{ color: "#e07b1a" }} />
          <span style={{ fontWeight: 500 }}>{v}</span>
        </Space>
      ),
    },
    {
      title: "الحالة",
      dataIndex: "is_active",
      key: "is_active",
      render: (v) => (
        <Tag color={v ? "success" : "error"}>{v ? "نشطة" : "معطلة"}</Tag>
      ),
    },
    {
      title: "الإجراءات",
      key: "actions",
      fixed: "left",
      render: (_, region) => (
        <Space size="small">
          <Tooltip title={region.is_active ? "تعطيل" : "تفعيل"}>
            <Button
              type="text"
              size="small"
              icon={
                region.is_active ? (
                  <StopOutlined style={{ color: "#ff4d4f" }} />
                ) : (
                  <CheckCircleOutlined style={{ color: "#52c41a" }} />
                )
              }
              onClick={() => handleToggleRegionActive(region, cityId)}
            />
          </Tooltip>
          <Tooltip title="تعديل">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: "#e07b1a" }} />}
              onClick={() => openEditRegion(region, cityId)}
            />
          </Tooltip>
          <Popconfirm
            title="حذف المنطقة نهائياً؟"
            onConfirm={() => handleDeleteRegion(region.id, cityId)}
            okText="حذف"
            cancelText="إلغاء"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="حذف">
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined style={{ color: "#ff4d4f" }} />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ fontFamily: "'Cairo', sans-serif" }}>
      {/* ── Stats ── */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {[
          {
            title: "المدن النشطة",
            value: activeCount,
            icon: <CheckCircleOutlined />,
            color: "#52c41a",
            bg: "#f6ffed",
          },
          {
            title: "المدن المعطلة",
            value: inactiveCount,
            icon: <StopOutlined />,
            color: "#ff4d4f",
            bg: "#fff2f0",
          },
          {
            title: "إجمالي المدن",
            value: cities.length,
            icon: <EnvironmentOutlined />,
            color: "#e07b1a",
            bg: "#fff7e6",
          },
          {
            title: "المناطق المحملة",
            value: totalRegions,
            icon: <ApartmentOutlined />,
            color: "#1677ff",
            bg: "#e6f4ff",
          },
        ].map((s, i) => (
          <Col xs={12} sm={6} key={i}>
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

      {/* ── Main Card ── */}
      <Card
        bordered={false}
        style={{ borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
        bodyStyle={{ padding: 0 }}
      >
        {/* Header */}
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
            <EnvironmentOutlined style={{ color: "#e07b1a", marginLeft: 8 }} />
            المدن والمناطق
          </h2>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Search
              placeholder="بحث باسم المدينة..."
              allowClear
              style={{ width: 220 }}
              prefix={<SearchOutlined style={{ color: "#bbb" }} />}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openAddCity}
              style={{ background: "#e07b1a", borderColor: "#e07b1a" }}
            >
              إضافة مدينة
            </Button>
          </div>
        </div>

        {/* Cities List with expandable regions */}
        <div style={{ padding: "16px 24px" }}>
          {filtered.length === 0 && !loading ? (
            <Empty description="لا توجد مدن مضافة" style={{ padding: 40 }} />
          ) : (
            <Collapse
              onChange={handlePanelChange}
              expandIconPosition="start"
              style={{ background: "transparent", border: "none" }}
              className="cities-collapse"
            >
              {filtered.map((city) => (
                <Panel
                  key={city.id}
                  style={{
                    marginBottom: 10,
                    borderRadius: 12,
                    border: "1px solid #f0f0f0",
                    background: "#fff",
                    overflow: "hidden",
                  }}
                  header={
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                        flexWrap: "wrap",
                        gap: 8,
                      }}
                    >
                      <Space>
                        <EnvironmentOutlined style={{ color: "#e07b1a" }} />
                        <span style={{ fontWeight: 600, fontSize: 15 }}>
                          {city.name}
                        </span>
                        <Tag color={city.is_active ? "success" : "error"}>
                          {city.is_active ? "نشطة" : "معطلة"}
                        </Tag>
                        {regionsMap[city.id] && (
                          <Badge
                            count={regionsMap[city.id].length}
                            style={{ background: "#e07b1a" }}
                            showZero
                            title={`${regionsMap[city.id].length} منطقة`}
                          />
                        )}
                      </Space>

                      {/* City actions — stop propagation so they don't toggle panel */}
                      <Space
                        size="small"
                        onClick={(e) => e.stopPropagation()}
                        style={{ marginLeft: "auto", paddingLeft: 8 }}
                      >
                        <Tooltip
                          title={
                            city.is_active ? "تعطيل المدينة" : "تفعيل المدينة"
                          }
                        >
                          <Button
                            type="text"
                            size="small"
                            icon={
                              city.is_active ? (
                                <StopOutlined style={{ color: "#ff4d4f" }} />
                              ) : (
                                <CheckCircleOutlined
                                  style={{ color: "#52c41a" }}
                                />
                              )
                            }
                            onClick={() => handleToggleCityActive(city)}
                          />
                        </Tooltip>
                        <Tooltip title="تعديل المدينة">
                          <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined style={{ color: "#e07b1a" }} />}
                            onClick={() => openEditCity(city)}
                          />
                        </Tooltip>
                        <Popconfirm
                          title={
                            <span>
                              حذف مدينة "{city.name}" نهائياً؟
                              <br />
                              <span style={{ color: "#ff4d4f", fontSize: 12 }}>
                                سيتم حذف جميع مناطقها أيضاً
                              </span>
                            </span>
                          }
                          onConfirm={() => handleDeleteCity(city.id)}
                          okText="حذف"
                          cancelText="إلغاء"
                          okButtonProps={{ danger: true }}
                        >
                          <Tooltip title="حذف نهائي">
                            <Button
                              type="text"
                              size="small"
                              icon={
                                <DeleteOutlined style={{ color: "#ff4d4f" }} />
                              }
                            />
                          </Tooltip>
                        </Popconfirm>
                      </Space>
                    </div>
                  }
                >
                  {/* Regions section */}
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 12,
                      }}
                    >
                      <Text strong style={{ color: "#555", fontSize: 13 }}>
                        <ApartmentOutlined
                          style={{ marginLeft: 6, color: "#e07b1a" }}
                        />
                        مناطق {city.name}
                      </Text>
                      <Button
                        size="small"
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => openAddRegion(city.id)}
                        style={{
                          background: "#e07b1a",
                          borderColor: "#e07b1a",
                          fontSize: 12,
                        }}
                      >
                        إضافة منطقة
                      </Button>
                    </div>

                    {regionsLoading[city.id] ? (
                      <div
                        style={{
                          textAlign: "center",
                          padding: 20,
                          color: "#aaa",
                        }}
                      >
                        جارٍ التحميل...
                      </div>
                    ) : !regionsMap[city.id] ||
                      regionsMap[city.id].length === 0 ? (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="لا توجد مناطق مضافة لهذه المدينة"
                        style={{ padding: "12px 0" }}
                      />
                    ) : (
                      <Table
                        dataSource={regionsMap[city.id]}
                        columns={regionColumns(city.id)}
                        rowKey="id"
                        size="small"
                        pagination={false}
                        scroll={{ x: 400 }}
                        style={{ borderRadius: 8, overflow: "hidden" }}
                      />
                    )}
                  </div>
                </Panel>
              ))}
            </Collapse>
          )}
        </div>
      </Card>

      {/* ═══ Modal: Add / Edit City ═══ */}
      <Modal
        title={
          <Space style={{ fontFamily: "'Cairo', sans-serif", fontWeight: 700 }}>
            <EnvironmentOutlined style={{ color: "#e07b1a" }} />
            {editingCity ? "تعديل بيانات المدينة" : "إضافة مدينة جديدة"}
          </Space>
        }
        open={cityModalOpen}
        onOk={handleSaveCity}
        onCancel={() => setCityModalOpen(false)}
        okText={editingCity ? "حفظ التعديلات" : "إضافة"}
        cancelText="إلغاء"
        confirmLoading={citySaving}
        okButtonProps={{
          style: { background: "#e07b1a", borderColor: "#e07b1a" },
        }}
        style={{ direction: "rtl", fontFamily: "'Cairo', sans-serif" }}
        width={420}
      >
        <Form form={cityForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="اسم المدينة"
            rules={[{ required: true, message: "أدخل اسم المدينة" }]}
          >
            <Input placeholder="مثال: الرياض" />
          </Form.Item>
          <Form.Item name="is_active" label="الحالة" valuePropName="checked">
            <Switch
              checkedChildren="نشطة"
              unCheckedChildren="معطلة"
              style={{ background: "#e07b1a" }}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* ═══ Modal: Add / Edit Region ═══ */}
      <Modal
        title={
          <Space style={{ fontFamily: "'Cairo', sans-serif", fontWeight: 700 }}>
            <ApartmentOutlined style={{ color: "#e07b1a" }} />
            {editingRegion ? "تعديل المنطقة" : "إضافة منطقة جديدة"}
          </Space>
        }
        open={regionModalOpen}
        onOk={handleSaveRegion}
        onCancel={() => setRegionModalOpen(false)}
        okText={editingRegion ? "حفظ التعديلات" : "إضافة"}
        cancelText="إلغاء"
        confirmLoading={regionSaving}
        okButtonProps={{
          style: { background: "#e07b1a", borderColor: "#e07b1a" },
        }}
        style={{ direction: "rtl", fontFamily: "'Cairo', sans-serif" }}
        width={420}
      >
        {regionCityId && (
          <div
            style={{
              background: "#fff7e6",
              border: "1px solid #ffd591",
              borderRadius: 8,
              padding: "8px 12px",
              marginBottom: 16,
              fontSize: 13,
              color: "#ad6800",
            }}
          >
            <EnvironmentOutlined style={{ marginLeft: 6 }} />
            المدينة: {cities.find((c) => c.id === regionCityId)?.name ?? "—"}
          </div>
        )}
        <Form form={regionForm} layout="vertical">
          <Form.Item
            name="name"
            label="اسم المنطقة"
            rules={[{ required: true, message: "أدخل اسم المنطقة" }]}
          >
            <Input placeholder="مثال: العليا" />
          </Form.Item>
          <Form.Item name="is_active" label="الحالة" valuePropName="checked">
            <Switch
              checkedChildren="نشطة"
              unCheckedChildren="معطلة"
              style={{ background: "#e07b1a" }}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Collapse styles */}
      <style>{`
        .cities-collapse .ant-collapse-item > .ant-collapse-header {
          align-items: center;
        }
        .cities-collapse .ant-collapse-content-box {
          padding: 16px !important;
        }
      `}</style>
    </div>
  );
}
