import { useState } from "react";
import { Form, Input, Button, Checkbox, message } from "antd";
import {
  MailOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  LoginOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

import logo from "../../assets/logo.png";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await api.post("/accounts/admin/login/", {
        email: values.email,
        password: values.password,
      });
      const { access, refresh } = res.data.tokens;
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
      if (values.remember) {
        localStorage.setItem("remember", "true");
      }
      message.success("مرحباً بك في لوحة التحكم");
      navigate("/dashboard");
    } catch (err) {
      message.error(
        err?.response?.data?.error ||
          "البريد الإلكتروني أو كلمة المرور غير صحيحة"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Responsive styles */}
      <style>{`
        .login-page {
          display: flex;
          height: 100vh;
          direction: rtl;
          font-family: 'Cairo', sans-serif;
          background-color: #f0f4f8;
          overflow: hidden;
        }
        .login-left {
          position: relative;
          width: 40%;
          overflow: hidden;
        }
        .login-right {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 140px 32px 40px;
          background-color: #f0f4f8;
          overflow-y: auto;
        }
        .login-card {
          background: #fff;
          border-radius: 20px;
          padding: 36px 40px;
          width: 100%;
          max-width: 460px;
          box-shadow: 0 4px 32px rgba(0,0,0,0.06);
        }
        .login-logo-img {
          width: 150px;
          height: 150px;
          object-fit: contain;
          display: block;
        }
        @media (max-width: 768px) {
          .login-left { display: none; }
          .login-right { padding: 24px 16px; }
          .login-card { padding: 28px 20px; border-radius: 16px; }
          .login-logo-img { width: 120px; height: 120px; }
        }
      `}</style>

      <div className="login-page">
        {/* ===== Left Panel ===== */}
        <div className="login-left">
          <img
            src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=900&q=80"
            alt="technician"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
          <div style={styles.overlay} />
          <div style={styles.leftContent}>
            <p style={styles.leftTagline}>كفاءة تشغيلية لا مثيل لها</p>
            <p style={styles.leftDesc}>
              من خلال منصة مساعد، يمكنك إدارة الموارد، متابعة الفنيين، وجدولة
              الطلبات بكل سهولة واحترافية.
            </p>
          </div>
        </div>

        {/* ===== Right Panel ===== */}
        <div className="login-right">
          {/* Logo */}
          <div style={styles.logoArea}>
            <img
              src={logo}
              alt="مساعد"
              className="login-logo-img"
              style={{ borderRadius: 16 }}
            />
            <p style={styles.logoSub}>لوحة التحكم الخاصة بالدعم الفني لتطبيق مساعد</p> 
          </div>

          {/* Card */}
          <div className="login-card">
            <h2 style={styles.cardTitle}>تسجيل الدخول</h2>

            <Form
              name="login"
              layout="vertical"
              onFinish={onFinish}
              requiredMark={false}
              size="large"
            >
              {/* Email */}
              <Form.Item
                label={<span style={styles.label}>البريد الإلكتروني</span>}
                name="email"
                rules={[
                  { required: true, message: "يرجى إدخال البريد الإلكتروني" },
                  { type: "email", message: "صيغة البريد غير صحيحة" },
                ]}
              >
                <Input
                  placeholder="name@company.com"
                  suffix={<MailOutlined style={{ color: "#aaa" }} />}
                  style={styles.input}
                />
              </Form.Item>

              {/* Password */}
              <Form.Item
                label={<span style={styles.label}>كلمة المرور</span>}
                name="password"
                rules={[{ required: true, message: "يرجى إدخال كلمة المرور" }]}
              >
                <Input.Password
                  placeholder="••••••••"
                  iconRender={(visible) =>
                    visible ? (
                      <EyeOutlined style={{ color: "#aaa" }} />
                    ) : (
                      <EyeInvisibleOutlined style={{ color: "#aaa" }} />
                    )
                  }
                  style={styles.input}
                />
              </Form.Item>

              {/* Remember */}
              <Form.Item name="remember" valuePropName="checked">
                <Checkbox style={styles.label}>تذكرني على هذا الجهاز</Checkbox>
              </Form.Item>

              {/* Submit */}
              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  icon={<LoginOutlined />}
                  style={styles.submitBtn}
                >
                  تسجيل الدخول
                </Button>
              </Form.Item>
            </Form>

            <p style={styles.contactText}>
              ليس لديك حساب؟{" "}
              <a href="mailto:admin@mosaed.sa" style={styles.contactLink}>
                اتصل بالإدارة
              </a>
            </p>
          </div>

          {/* Footer */}
          <p style={styles.footer}>
            © 2026 نظام إدارة الخدمات المنزلية الذكي. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </>
  );
}

const styles = {
  overlay: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(to top, rgba(10,40,35,0.92) 0%, rgba(10,40,35,0.45) 60%, transparent 100%)",
  },
  leftContent: {
    position: "absolute",
    bottom: 48,
    right: 32,
    left: 32,
    color: "#fff",
  },
  leftTagline: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 10,
    color: "#fff",
  },
  leftDesc: {
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
    lineHeight: 1.8,
    margin: 0,
  },
  logoArea: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: 20,
    gap: 6,
  },
  logoTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: "#1a2e25",
    margin: 0,
  },
  logoSub: {
    fontSize: 13,
    color: "#6b7c74",
    margin: 0,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: "#1a2e25",
    marginBottom: 28,
    textAlign: "right",
  },
  label: {
    fontSize: 14,
    color: "#3a4a42",
    fontFamily: "'Cairo', sans-serif",
  },
  input: {
    borderRadius: 10,
    backgroundColor: "#f5f8f6",
    border: "1.5px solid #e2ebe6",
    fontFamily: "'Cairo', sans-serif",
    fontSize: 14,
    direction: "ltr",
    textAlign: "right",
  },
  submitBtn: {
    backgroundColor: "#e07b1a",
    borderColor: "#e07b1a",
    borderRadius: 12,
    height: 52,
    fontSize: 16,
    fontWeight: 700,
    fontFamily: "'Cairo', sans-serif",
  },
  contactText: {
    textAlign: "center",
    fontSize: 13,
    color: "#6b7c74",
    marginTop: 20,
    marginBottom: 0,
  },
  contactLink: {
    color: "#e07b1a",
    fontWeight: 700,
    textDecoration: "none",
  },
  footer: {
    marginTop: 24,
    fontSize: 12,
    color: "#9ba8a2",
    textAlign: "center",
  },
};
