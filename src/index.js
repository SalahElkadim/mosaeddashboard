import React from "react";
import ReactDOM from "react-dom/client";
import { ConfigProvider } from "antd";
import arEG from "antd/locale/ar_EG";
import App from "./App";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <ConfigProvider
    direction="rtl"
    locale={arEG}
    theme={{
      token: {
        colorPrimary: "#1677ff",
        fontFamily: "Cairo, sans-serif",
      },
    }}
  >
    <App />
  </ConfigProvider>
);
