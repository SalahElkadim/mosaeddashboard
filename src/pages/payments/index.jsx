import { Tabs, Typography } from "antd";
import {
  DashboardOutlined,
  WalletOutlined,
  FileDoneOutlined,
} from "@ant-design/icons";
import PaymentsOverview from "./Overview";
import PayoutBatches from "./PayoutBatches";
import DueCollectionBatches from "./DueCollectionBatches";

const { Title } = Typography;

export default function Payments() {
  const items = [
    {
      key: "overview",
      label: (
        <span>
          <DashboardOutlined /> نظرة عامة
        </span>
      ),
      children: <PaymentsOverview />,
    },
    {
      key: "payout",
      label: (
        <span>
          <WalletOutlined /> تحويل الأرصدة
        </span>
      ),
      children: <PayoutBatches />,
    },
    {
      key: "due-collection",
      label: (
        <span>
          <FileDoneOutlined /> تحصيل المستحقات
        </span>
      ),
      children: <DueCollectionBatches />,
    },
  ];

  return (
    <div style={{ fontFamily: "'Cairo', sans-serif" }}>
      <Title level={4} style={{ margin: "0 0 16px", color: "#1a2e25" }}>
        المدفوعات
      </Title>
      <Tabs defaultActiveKey="overview" items={items} />
    </div>
  );
}
