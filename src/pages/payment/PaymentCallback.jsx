// src/pages/payment/PaymentCallback.jsx
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import axios from "axios";

export default function PaymentCallback() {
  const { paymentRequestId } = useParams();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [errorDetail, setErrorDetail] = useState("");

  useEffect(() => {
    const paymentId = searchParams.get("id");
    const moyasarStatus = searchParams.get("status");
    const token = searchParams.get("token");

    if (!paymentId) {
      setStatus("error");
      setErrorDetail("لم يتم استقبال بيانات الدفع");
      return;
    }

    if (moyasarStatus === "failed") {
      setStatus("failed");
      return;
    }

    if (!token) {
      setStatus("error");
      setErrorDetail("انتهت الجلسة، يرجى العودة للتطبيق والمحاولة مجدداً");
      return;
    }

    axios
      .post(
        `${process.env.REACT_APP_URL}/payments/payments/${paymentRequestId}/callback/`,
        { id: paymentId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )
      .then((res) => {
        setStatus(res.data.status === "paid" ? "success" : "failed");
      })
      .catch((err) => {
        const msg = err.response?.data?.error || err.response?.data?.detail;
        setErrorDetail(msg || "");
        setStatus("error");
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={styles.container}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;600;700;900&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Tajawal', sans-serif; direction: rtl; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {status === "loading" && <LoadingView />}
      {status === "success" && <SuccessView />}
      {status === "failed" && <FailedView />}
      {status === "error" && <ErrorView detail={errorDetail} />}
    </div>
  );
}

function LoadingView() {
  return (
    <div style={styles.card}>
      <div style={styles.spinner} />
      <h2 style={styles.title}>جاري التحقق من الدفع...</h2>
      <p style={styles.subtitle}>برجاء الانتظار، لا تغلق هذه الصفحة</p>
    </div>
  );
}

function SuccessView() {
  return (
    <div style={styles.card}>
      <div style={styles.iconWrap}>✅</div>
      <h2 style={{ ...styles.title, color: "#2F9E44" }}>تم الدفع بنجاح!</h2>
      <p style={styles.subtitle}>تم استلام المبلغ وتحديث حالة طلبك</p>
      <p style={styles.hint}>يمكنك إغلاق هذه الصفحة والعودة للتطبيق</p>
    </div>
  );
}

function FailedView() {
  return (
    <div style={styles.card}>
      <div style={styles.iconWrap}>❌</div>
      <h2 style={{ ...styles.title, color: "#B23A20" }}>فشل الدفع</h2>
      <p style={styles.subtitle}>لم تتم عملية الدفع، يرجى المحاولة مرة أخرى</p>
      <p style={styles.hint}>
        يمكنك إغلاق هذه الصفحة والمحاولة مجدداً من التطبيق
      </p>
    </div>
  );
}

function ErrorView({ detail }) {
  return (
    <div style={styles.card}>
      <div style={styles.iconWrap}>⚠️</div>
      <h2 style={{ ...styles.title, color: "#F2843C" }}>حدث خطأ</h2>
      <p style={styles.subtitle}>
        {detail || "تعذر التحقق من حالة الدفع، يرجى التواصل مع الدعم"}
      </p>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "linear-gradient(135deg, #FFF8F3 0%, #FFFFFF 50%, #FFF3E9 100%)",
    fontFamily: "'Tajawal', sans-serif",
    direction: "rtl",
    padding: "24px 16px",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: "48px 40px",
    textAlign: "center",
    boxShadow: "0 8px 40px rgba(140,58,31,0.12), 0 2px 8px rgba(0,0,0,0.06)",
    maxWidth: 420,
    width: "100%",
    animation: "fadeIn 0.5s ease",
  },
  iconWrap: { fontSize: 64, marginBottom: 8, lineHeight: 1 },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    margin: "16px 0 8px",
    color: "#2B211D",
  },
  subtitle: {
    fontSize: 15,
    color: "#8A7368",
    margin: "0 0 4px",
    lineHeight: 1.7,
  },
  hint: {
    fontSize: 13,
    color: "#C9B8AE",
    margin: "12px 0 0",
  },
  spinner: {
    width: 48,
    height: 48,
    border: "4px solid #FBE3D0",
    borderTop: "4px solid #F2843C",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto 20px",
  },
};
