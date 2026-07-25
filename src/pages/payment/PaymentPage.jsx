// src/pages/payment/PaymentPage.jsx
import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import axios from "axios";

export default function PaymentPage() {
  const { paymentRequestId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [step, setStep] = useState("loading"); // loading | paying | already_paid | error
  const [paymentRequest, setPaymentRequest] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [moyasarReady, setMoyasarReady] = useState(false);
  const formRef = useRef(null);
  const initializedRef = useRef(false);

  // تحميل Moyasar
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdn.moyasar.com/mpf/1.14.0/moyasar.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://cdn.moyasar.com/mpf/1.14.0/moyasar.js";
    script.async = true;
    script.onload = () => setMoyasarReady(true);
    script.onerror = () => {
      setErrorMsg("تعذر تحميل بوابة الدفع");
      setStep("error");
    };
    document.body.appendChild(script);

    return () => {
      if (document.head.contains(link)) document.head.removeChild(link);
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, []);

  // جيب تفاصيل نموذج الدفع
  useEffect(() => {
    if (!token || !paymentRequestId) {
      setErrorMsg("انتهت الجلسة، يرجى العودة للتطبيق");
      setStep("error");
      return;
    }

    axios
      .get(`${process.env.REACT_APP_URL}/payments/${paymentRequestId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const pr = res.data;
        setPaymentRequest(pr);

        if (pr.status === "paid") {
          setStep("already_paid");
        } else if (pr.status !== "awaiting_gateway_payment") {
          setErrorMsg("لا يمكن الدفع في هذه المرحلة، يرجى العودة للتطبيق");
          setStep("error");
        } else {
          setStep("paying");
        }
      })
      .catch(() => {
        setErrorMsg("تعذر جلب بيانات الدفع");
        setStep("error");
      });
  }, [token, paymentRequestId]);

  // تهيئة Moyasar
  useEffect(() => {
    if (
      step !== "paying" ||
      !moyasarReady ||
      !paymentRequest ||
      !formRef.current ||
      initializedRef.current
    )
      return;

    const timer = setTimeout(() => {
      if (!window.Moyasar) return;
      initializedRef.current = true;

      const callbackUrl =
        `${window.location.origin}/payments/${paymentRequestId}/callback` +
        `?token=${encodeURIComponent(token)}`;

      window.Moyasar.init({
        element: ".moyasar-form-container",
        amount: Math.round(Number(paymentRequest.amount) * 100),
        currency: "SAR",
        description: `دفع طلب خدمة #${paymentRequest.request_id}`,
        publishable_api_key: process.env.REACT_APP_MOYASAR_PUBLISHABLE_KEY,
        callback_url: callbackUrl,
        methods: ["creditcard", "applepay"],
        apple_pay: {
          country: "SA",
          label: "منصة الخدمات",
          validate_merchant_url: "https://api.moyasar.com/v1/applepay/initiate",
        },
        on_initiating: () => true,
        on_failed: (error) => {
          setErrorMsg(error?.message || "فشلت عملية الدفع");
          setStep("error");
        },
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [step, moyasarReady, paymentRequest, token, paymentRequestId]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --orange: #F2843C; --orange-light: #FFAE6B; --orange-pale: rgba(242,132,60,0.10);
          --rust: #8C3A1F; --rust-dark: #5C2513;
          --bg: #FFF8F3; --card-bg: #FFFFFF; --border: rgba(140,58,31,0.14);
          --text-primary: #2B211D; --text-muted: #8A7368; --text-dim: #C9B8AE;
          --success: #2F9E44; --danger: #B23A20;
        }
        body { font-family: 'Tajawal', sans-serif; direction: rtl; background: var(--bg); color: var(--text-primary); }

        .pay-page {
          min-height: 100vh; display: flex; align-items: center;
          justify-content: center; padding: 32px 16px; position: relative; overflow: hidden;
        }
        .pay-page::before, .pay-page::after {
          content: ''; position: fixed; border-radius: 50%;
          pointer-events: none; filter: blur(90px); opacity: 0.25;
        }
        .pay-page::before {
          width: 600px; height: 600px;
          background: radial-gradient(circle, #F2843C 0%, transparent 65%);
          top: -200px; right: -150px;
        }
        .pay-page::after {
          width: 500px; height: 500px;
          background: radial-gradient(circle, #8C3A1F 0%, transparent 65%);
          bottom: -180px; left: -150px; opacity: 0.15;
        }
        .pay-card {
          position: relative; width: 100%; max-width: 480px;
          background: var(--card-bg); border-radius: 24px;
          border: 1px solid var(--border); padding: 36px 32px 28px;
          box-shadow: 0 24px 60px rgba(140,58,31,0.10), 0 2px 8px rgba(0,0,0,0.04);
          animation: cardIn 0.6s cubic-bezier(0.22,1,0.36,1) both; overflow: hidden;
        }
        .pay-card::before {
          content: ''; position: absolute; top: 0; left: 10%; right: 10%;
          height: 3px; background: linear-gradient(90deg, transparent, var(--orange), var(--rust), transparent);
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(28px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .pay-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; }
        .pay-logo { display: flex; align-items: center; gap: 10px; }
        .pay-logo-icon {
          width: 38px; height: 38px; border-radius: 10px;
          background: linear-gradient(135deg, #F2843C, #8C3A1F);
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; box-shadow: 0 4px 16px rgba(242,132,60,0.35);
        }
        .pay-logo-text { font-weight: 900; font-size: 17px; color: var(--rust); }
        .pay-secure-badge {
          display: flex; align-items: center; gap: 5px;
          background: rgba(47,158,68,0.08); border: 1px solid rgba(47,158,68,0.2);
          border-radius: 20px; padding: 5px 12px; font-size: 11px; font-weight: 700; color: var(--success);
        }
        .pay-secure-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--success); animation: pulse 2s ease-in-out infinite; }
        @keyframes pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.5; transform:scale(0.8); } }
        .pay-sep { height: 1px; background: linear-gradient(90deg, transparent, var(--border), transparent); margin: 0 -32px 28px; }

        .amount-box {
          background: var(--orange-pale); border: 1px solid rgba(242,132,60,0.18);
          border-radius: 16px; padding: 18px 20px; margin-bottom: 24px; text-align: center;
        }
        .amount-label { font-size: 11px; font-weight: 800; color: var(--rust); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 6px; }
        .amount-value { font-size: 30px; font-weight: 900; color: var(--rust-dark); }
        .amount-currency { font-size: 14px; font-weight: 700; color: var(--orange); margin-right: 4px; }

        .pay-loading { text-align: center; padding: 48px 0; }
        .pay-spinner-wrap { position: relative; width: 56px; height: 56px; margin: 0 auto 20px; }
        .pay-spinner-track { width: 56px; height: 56px; border-radius: 50%; border: 3px solid rgba(242,132,60,0.12); position: absolute; }
        .pay-spinner { width: 56px; height: 56px; border-radius: 50%; border: 3px solid transparent; border-top-color: var(--orange); border-right-color: rgba(140,58,31,0.4); position: absolute; animation: spin 1s cubic-bezier(0.4,0,0.2,1) infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .pay-loading-title { font-size: 15px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; }
        .pay-loading-sub { font-size: 13px; color: var(--text-muted); }

        .pay-error, .pay-success { text-align: center; padding: 32px 0 8px; }
        .pay-status-icon { font-size: 52px; margin-bottom: 16px; }
        .pay-error-title { font-size: 18px; font-weight: 800; color: var(--danger); margin-bottom: 8px; }
        .pay-success-title { font-size: 18px; font-weight: 800; color: var(--success); margin-bottom: 8px; }
        .pay-status-msg { font-size: 14px; color: var(--text-muted); line-height: 1.7; }

        .pay-footer { margin-top: 24px; text-align: center; font-size: 11px; color: var(--text-dim); display: flex; align-items: center; justify-content: center; gap: 8px; }
        .pay-footer-dot { width: 3px; height: 3px; border-radius: 50%; background: var(--text-dim); }
        .pay-footer a { color: var(--orange); text-decoration: none; font-weight: 700; }

        .mysr-form { font-family: 'Tajawal', sans-serif !important; direction: rtl; }
        .mysr-form input {
          font-family: 'Tajawal', sans-serif !important;
          background: #FDF6F1 !important; border: 1px solid rgba(140,58,31,0.15) !important;
          border-radius: 12px !important; padding: 13px 16px !important;
          font-size: 15px !important; color: var(--text-primary) !important;
        }
        .mysr-form input:focus {
          border-color: rgba(242,132,60,0.5) !important;
          background: #FFFFFF !important;
          box-shadow: 0 0 0 3px rgba(242,132,60,0.10) !important; outline: none !important;
        }
        .mysr-form button[type="submit"] {
          background: linear-gradient(135deg, #F2843C 0%, #8C3A1F 100%) !important;
          border: none !important; border-radius: 14px !important; padding: 16px !important;
          font-family: 'Tajawal', sans-serif !important; font-size: 16px !important;
          font-weight: 800 !important; color: #FFFFFF !important; cursor: pointer !important;
          width: 100% !important; box-shadow: 0 6px 24px rgba(140,58,31,0.25) !important;
        }
        .mysr-form button[type="submit"]:hover { opacity: 0.92 !important; transform: translateY(-2px) !important; }
        .mysr-apple-pay-button, apple-pay-button { border-radius: 14px !important; margin-bottom: 12px !important; height: 52px !important; }

        @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .moyasar-form-container { animation: fadeIn 0.5s ease; }

        @media (max-width: 480px) {
          .pay-card { padding: 28px 20px 22px; border-radius: 20px; }
          .pay-sep { margin: 0 -20px 24px; }
        }
      `}</style>

      <div className="pay-page">
        <div className="pay-card">
          <div className="pay-header">
            <div className="pay-logo">
              <div className="pay-logo-icon">💳</div>
              <span className="pay-logo-text">دفع الطلب</span>
            </div>
            <div className="pay-secure-badge">
              <div className="pay-secure-dot" />
              دفع آمن
            </div>
          </div>
          <div className="pay-sep" />

          {step === "loading" && (
            <div className="pay-loading">
              <div className="pay-spinner-wrap">
                <div className="pay-spinner-track" />
                <div className="pay-spinner" />
              </div>
              <p className="pay-loading-title">جاري تحضير عملية الدفع</p>
              <p className="pay-loading-sub">لحظة من فضلك...</p>
            </div>
          )}

          {step === "paying" && paymentRequest && (
            <div style={{ animation: "fadeIn 0.4s ease" }}>
              <div className="amount-box">
                <p className="amount-label">المبلغ المطلوب</p>
                <span className="amount-value">
                  {Number(paymentRequest.amount).toLocaleString("ar-SA")}
                </span>
                <span className="amount-currency">ريال</span>
              </div>

              <div ref={formRef}>
                <div className="moyasar-form-container" />
              </div>
            </div>
          )}

          {step === "already_paid" && (
            <div className="pay-success">
              <div className="pay-status-icon">✅</div>
              <p className="pay-success-title">تم الدفع بالفعل</p>
              <p className="pay-status-msg">
                هذا الطلب تم دفعه مسبقاً، يمكنك العودة للتطبيق
              </p>
            </div>
          )}

          {step === "error" && (
            <div className="pay-error">
              <div className="pay-status-icon">⚠️</div>
              <p className="pay-error-title">حدث خطأ</p>
              <p className="pay-status-msg">{errorMsg}</p>
            </div>
          )}

          <div className="pay-footer">
            <span>مدعوم بواسطة</span>
            <a href="https://moyasar.com" target="_blank" rel="noreferrer">
              Moyasar
            </a>
            <div className="pay-footer-dot" />
            <span>مشفّر بـ SSL 256-bit</span>
          </div>
        </div>
      </div>
    </>
  );
}
