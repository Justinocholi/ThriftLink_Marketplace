import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { UIProvider } from './context/UIContext';
import { RealtimeProvider } from './context/RealtimeContext';
import { ToastProvider } from './components/ui/Toast';
import MobileBottomNav from './components/ui/MobileBottomNav';
import ProtectedRoute from './components/ProtectedRoute';

// Pages will be imported here
import Login from './pages/Login';
import Home from './pages/public/Home';
import Categories from './pages/public/Categories';
import ProductDetails from './pages/public/ProductDetails';
import VerifiedVendors from './pages/public/VerifiedVendors';
import HowItWorks from './pages/public/HowItWorks';
import Support from './pages/public/Support';

// Static Pages
import PrivacyPolicy from './pages/public/PrivacyPolicy';
import TermsOfService from './pages/public/TermsOfService';
import VendorPolicy from './pages/public/VendorPolicy';
import CookiePolicy from './pages/public/CookiePolicy';
import HelpCenter from './pages/public/HelpCenter';
import ContactUs from './pages/public/ContactUs';
import FAQ from './pages/public/FAQ';
import ReportIssues from './pages/public/ReportIssues';
import PricingPlans from './pages/public/PricingPlans';
import VendorGuide from './pages/public/VendorGuide';
import SafetyTips from './pages/public/SafetyTips';
import VendorReviews from './pages/public/VendorReviews';
import VendorPublicProfile from './pages/public/VendorPublicProfile';
import CategoryDetails from './pages/public/CategoryDetails';

import AdminLayout from './pages/admin/AdminLayout';
import AdminOverview from './pages/admin/AdminOverview';
import AdminVendors from './pages/admin/AdminVendors';
import AdminReviews from './pages/admin/AdminReviews';
import AdminUsers from './pages/admin/AdminUsers';
import AdminPlatform from './pages/admin/AdminPlatform';
import AdminSettings from './pages/admin/AdminSettings';
import AdminReports from './pages/admin/AdminReports';
import AdminSubscriptions from './pages/admin/AdminSubscriptions';

import VendorLayout from './pages/vendor/VendorLayout';
import VendorDashboard from './pages/vendor/VendorDashboard';
import VendorProfile from './pages/vendor/VendorProfile';
import VendorProducts from './pages/vendor/VendorProducts';
import VendorAnalytics from './pages/vendor/VendorAnalytics';
import VendorOrders from './pages/vendor/VendorOrders';
import VendorMessages from './pages/vendor/VendorMessages';
import VendorSettings from './pages/vendor/VendorSettings';
import VendorSubscription from './pages/vendor/VendorSubscription';

import UserLayout from './pages/user/UserLayout';
import UserDashboard from './pages/user/UserDashboard';
import UserOrders from './pages/user/UserOrders';
import UserSaved from './pages/user/UserSaved';
import UserProfile from './pages/user/UserProfile';
import UserSupport from './pages/user/UserSupport';
import UserMessages from './pages/user/UserMessages';
import Cart from './pages/public/Cart';
import Checkout from './pages/public/Checkout';
import ForgotPassword from './pages/public/ForgotPassword';
import ResetPassword from './pages/public/ResetPassword';

import PageviewTracker from './analytics/PageviewTracker';

function App() {
  return (
    <Router>
      <PageviewTracker />
      <AuthProvider>
        <ToastProvider>
          <RealtimeProvider>
          <CartProvider>
            <UIProvider>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/product/:id" element={<ProductDetails />} />
                <Route path="/verified-vendors" element={<VerifiedVendors />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/support" element={<Support />} />
                <Route path="/cart" element={
                  <ProtectedRoute allowedRoles={['user']}>
                    <Cart />
                  </ProtectedRoute>
                } />
                <Route path="/checkout" element={
                  <ProtectedRoute allowedRoles={['user']}>
                    <Checkout />
                  </ProtectedRoute>
                } />

                {/* Static Pages Routes */}
                <Route path="/legal/privacy" element={<PrivacyPolicy />} />
                <Route path="/legal/terms" element={<TermsOfService />} />
                <Route path="/legal/vendor-policy" element={<VendorPolicy />} />
                <Route path="/legal/cookies" element={<CookiePolicy />} />

                <Route path="/support/help" element={<HelpCenter />} />
                <Route path="/support/contact" element={<ContactUs />} />
                <Route path="/support/faq" element={<FAQ />} />
                <Route path="/support/report" element={<ReportIssues />} />

                <Route path="/vendor/pricing" element={<PricingPlans />} />
                <Route path="/vendor/guide" element={<VendorGuide />} />

                <Route path="/buyer/safety" element={<SafetyTips />} />
                <Route path="/buyer/reviews" element={<VendorReviews />} />

                <Route path="/vendor/:id" element={<VendorPublicProfile />} />
                <Route path="/category/:id" element={<CategoryDetails />} />
                <Route path="/vendors" element={<VerifiedVendors />} />
                <Route path="/all-categories" element={<Categories />} />

                {/* Admin Routes */}
                <Route path="/admin" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminLayout />
                  </ProtectedRoute>
                }>
                  <Route index element={<AdminOverview />} />
                  <Route path="vendors" element={<AdminVendors />} />
                  <Route path="reviews" element={<AdminReviews />} />
                  <Route path="reports" element={<AdminReports />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="subscriptions" element={<AdminSubscriptions />} />
                  <Route path="platform" element={<AdminPlatform />} />
                  <Route path="settings" element={<AdminSettings />} />
                </Route>

                {/* Vendor Routes */}
                <Route path="/vendor" element={
                  <ProtectedRoute allowedRoles={['vendor']}>
                    <VendorLayout />
                  </ProtectedRoute>
                }>
                  <Route index element={<VendorDashboard />} />
                  <Route path="profile" element={<VendorProfile />} />
                  <Route path="products" element={<VendorProducts />} />
                  <Route path="analytics" element={<VendorAnalytics />} />
                  <Route path="orders" element={<VendorOrders />} />
                  <Route path="messages" element={<VendorMessages />} />
                  <Route path="settings" element={<VendorSettings />} />
                  <Route path="subscription" element={<VendorSubscription />} />
                </Route>

                {/* User Routes */}
                <Route path="/user" element={
                  <ProtectedRoute allowedRoles={['user']}>
                    <UserLayout />
                  </ProtectedRoute>
                }>
                  <Route index element={<UserDashboard />} />
                  <Route path="orders" element={<UserOrders />} />
                  <Route path="messages" element={<UserMessages />} />
                  <Route path="saved" element={<UserSaved />} />
                  <Route path="profile" element={<UserProfile />} />
                  <Route path="support" element={<UserSupport />} />
                </Route>
              </Routes>
              <MobileBottomNav />
            </UIProvider>
          </CartProvider>
          </RealtimeProvider>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
