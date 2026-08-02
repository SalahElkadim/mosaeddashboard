import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import Providers from "./pages/Providers";
import Specializations from "./pages/specializations";
import ProviderDetail from "./pages/Providers/ProviderDetail";
import Services from "./pages/Services";
import ServiceDetail from "./pages/Services/ServiceDetail";
import Bookings from "./pages/Bookings";
import BookingDetail from "./pages/Bookings/BookingDetail";
import Completions from "./pages/Completions";
import CompletionDetail from "./pages/Completions/Completiondetail.jsx";
import Coupons from "./pages/Coupons"; 
import MarketingCodes from "./pages/Marketing";
import MarketingCodeDetail from "./pages/Marketing/MarketingCodeDetail.jsx";
import Customers from "./pages/Customers";
import CustomerDetail from "./pages/Customers/Customerdetail.jsx";
import PaymentPage from "./pages/payment/PaymentPage.jsx";
import PaymentCallback from "./pages/payment/PaymentCallback.jsx";
import DueCollectionPage from "./pages/payment/DueCollectionPage.jsx";
import DueCollectionCallback from "./pages/payment/DueCollectionCallback.jsx";
import Payments from "./pages/payments";
import Cities from "./pages/Cities";
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/specializations" element={<Specializations />} />
          <Route path="/providers" element={<Providers />} />
          <Route path="/providers/:id" element={<ProviderDetail />} />
          <Route path="/cities" element={<Cities />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/:id" element={<ServiceDetail />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/bookings/:id" element={<BookingDetail />} />
          <Route path="/completions" element={<Completions />} />
          <Route
            path="/completions/:bookingId"
            element={<CompletionDetail />}
          />
          <Route path="/customers" element={<Customers />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />
          <Route path="/coupons" element={<Coupons />} />
          <Route path="/marketingcodes" element={<MarketingCodes />} />
          <Route
            path="/marketingcodedetail"
            element={<MarketingCodeDetail />}
          />
          <Route path="/payments-dashboard" element={<Payments />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />

        {/* الروابط العامة (بره الحماية) بتاعة العميل/الفني نفسهم */}
        <Route path="/payments/:paymentRequestId" element={<PaymentPage />} />
        <Route
          path="/payments/:paymentRequestId/callback"
          element={<PaymentCallback />}
        />
        <Route path="/due-collection/:itemId" element={<DueCollectionPage />} />
        <Route
          path="/due-collection/:itemId/callback"
          element={<DueCollectionCallback />}
        />
      </Routes>
    </BrowserRouter>
  );
}
