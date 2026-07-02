import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { UIProvider } from './context/UIContext';
import { RealtimeProvider } from './context/RealtimeContext';
import { ToastProvider } from './components/ui/Toast';
import MobileBottomNav from './components/ui/MobileBottomNav';
import InstallPrompt from './components/InstallPrompt';
import ProtectedRoute from './components/ProtectedRoute';

// Eager: landing surfaces
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import Home from './pages/public/Home';
import Categories from './pages/public/Categories';
import VerifiedVendors from './pages/public/VerifiedVendors';
import HowItWorks from './pages/public/HowItWorks';
import Support from './pages/public/Support';
import NotFound from './pages/NotFound';

// Lazy: heavier public pages
const ProductDetails = lazy(() => import('./pages/public/ProductDetails'));
const VendorPublicProfile = lazy(() => import('./pages/public/VendorPublicProfile'));
const CategoryDetails = lazy(() => import('./pages/public/CategoryDetails'));
const Cart = lazy(() => import('./pages/public/Cart'));
const Checkout = lazy(() => import('./pages/public/Checkout'));
const OrderConfirmation = lazy(() => import('./pages/public/OrderConfirmation'));

// Lazy: static public pages
const PrivacyPolicy = lazy(() => import('./pages/public/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/public/TermsOfService'));
const VendorPolicy = lazy(() => import('./pages/public/VendorPolicy'));
const CookiePolicy = lazy(() => import('./pages/public/CookiePolicy'));
const HelpCenter = lazy(() => import('./pages/public/HelpCenter'));
const ContactUs = lazy(() => import('./pages/public/ContactUs'));
const FAQ = lazy(() => import('./pages/public/FAQ'));
const ReportIssues = lazy(() => import('./pages/public/ReportIssues'));
const PricingPlans = lazy(() => import('./pages/public/PricingPlans'));
const VendorGuide = lazy(() => import('./pages/public/VendorGuide'));
const SafetyTips = lazy(() => import('./pages/public/SafetyTips'));
const VendorReviews = lazy(() => import('./pages/public/VendorReviews'));
const Wishlist = lazy(() => import('./pages/public/Wishlist'));
const ForgotPassword = lazy(() => import('./pages/public/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/public/ResetPassword'));

// Lazy: admin
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminOverview = lazy(() => import('./pages/admin/AdminOverview'));
const AdminVendors = lazy(() => import('./pages/admin/AdminVendors'));
const AdminReviews = lazy(() => import('./pages/admin/AdminReviews'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminPlatform = lazy(() => import('./pages/admin/AdminPlatform'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminReports = lazy(() => import('./pages/admin/AdminReports'));
const AdminSubscriptions = lazy(() => import('./pages/admin/AdminSubscriptions'));

// Lazy: vendor
const VendorLayout = lazy(() => import('./pages/vendor/VendorLayout'));
const VendorDashboard = lazy(() => import('./pages/vendor/VendorDashboard'));
const VendorProfile = lazy(() => import('./pages/vendor/VendorProfile'));
const VendorProducts = lazy(() => import('./pages/vendor/VendorProducts'));
const VendorAnalytics = lazy(() => import('./pages/vendor/VendorAnalytics'));
const VendorOrders = lazy(() => import('./pages/vendor/VendorOrders'));
const VendorMessages = lazy(() => import('./pages/vendor/VendorMessages'));
const VendorSettings = lazy(() => import('./pages/vendor/VendorSettings'));
const VendorSubscription = lazy(() => import('./pages/vendor/VendorSubscription'));

// Lazy: user
const UserLayout = lazy(() => import('./pages/user/UserLayout'));
const UserDashboard = lazy(() => import('./pages/user/UserDashboard'));
const UserOrders = lazy(() => import('./pages/user/UserOrders'));
const UserSaved = lazy(() => import('./pages/user/UserSaved'));
const UserProfile = lazy(() => import('./pages/user/UserProfile'));
const UserSupport = lazy(() => import('./pages/user/UserSupport'));
const UserMessages = lazy(() => import('./pages/user/UserMessages'));
const ChatSystem = lazy(() => import('./components/ChatSystem'));

// Lazy: legal
const Terms = lazy(() => import('./pages/legal/Terms'));
const Privacy = lazy(() => import('./pages/legal/Privacy'));

import PageviewTracker from './analytics/PageviewTracker';
import ScrollToTop from './components/ScrollToTop';

const Fallback = (
  <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>Loading…</div>
);

function App() {
  return (
    <Router>
      <ScrollToTop />
      <PageviewTracker />
      <AuthProvider>
        <ToastProvider>
          <RealtimeProvider>
          <CartProvider>
            <UIProvider>
              <Suspense fallback={Fallback}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
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
                <Route path="/order-confirmation/:orderId" element={
                  <ProtectedRoute allowedRoles={['user']}>
                    <OrderConfirmation />
                  </ProtectedRoute>
                } />

                {/* Static Pages Routes */}
                <Route path="/legal/privacy" element={<Privacy />} />
                <Route path="/legal/terms" element={<Terms />} />
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
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/messages" element={
                  <ProtectedRoute allowedRoles={['user', 'vendor', 'admin']}>
                    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1.5rem 1rem' }}>
                      <h4 style={{ fontSize: '1.5rem', color: '#0f172a', fontWeight: 700, marginBottom: '1.5rem' }}>Messages</h4>
                      <ChatSystem />
                    </div>
                  </ProtectedRoute>
                } />

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

                {/* Catch-all 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              </Suspense>
              <MobileBottomNav />
              <InstallPrompt />
            </UIProvider>
          </CartProvider>
          </RealtimeProvider>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
