import React, { useState, useEffect } from 'react';
import { Home, User, Package, BarChart3, ShoppingCart, MessageSquare, Settings, Crown, LogOut, Upload } from 'lucide-react';

const VendorDashboard = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [items, setItems] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [analytics, setAnalytics] = useState({ views: 0, clicks: 0 });
  const [uploadData, setUploadData] = useState({ name: '', price: '', image: null });

  useEffect(() => {
    const savedItems = JSON.parse(localStorage.getItem('items') || '[]');
    const savedReviews = JSON.parse(localStorage.getItem('reviews') || '[]');
    const savedViews = Number(localStorage.getItem('views')) || 0;
    const savedClicks = Number(localStorage.getItem('clicks')) || 0;
    
    setItems(savedItems);
    setReviews(savedReviews);
    setAnalytics({ views: savedViews, clicks: savedClicks });
  }, []);

  const conversionRate = analytics.views === 0 ? 0 : ((analytics.clicks / analytics.views) * 100).toFixed(1);

  const navigation = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'profile', label: 'Vendor Profile', icon: User },
    { id: 'products', label: 'Product Listing', icon: Package },
    { id: 'analytics', label: 'Click Analytics', icon: BarChart3 },
    { id: 'orders', label: 'Orders Received', icon: ShoppingCart },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'subscription', label: 'Subscription', icon: Crown }
  ];

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadData({ ...uploadData, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleItemUpload = () => {
    if (!uploadData.image || !uploadData.name) {
      alert('Please provide an image and item name');
      return;
    }

    const newItem = {
      id: Date.now(),
      image: uploadData.image,
      name: uploadData.name,
      price: uploadData.price
    };
    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    localStorage.setItem('items', JSON.stringify(updatedItems));
    setUploadData({ name: '', price: '', image: null });
    alert('Item uploaded successfully!');
  };

  const Sidebar = () => (
    <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg flex flex-col z-10">
      <div className="p-6 border-b">
        <h2 className="text-2xl font-bold text-blue-600">ThriftLink</h2>
      </div>
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigation.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setCurrentPage(id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              currentPage === id
                ? 'bg-blue-50 text-blue-600 font-semibold'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Icon size={20} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="p-4 border-t">
        <button
          onClick={() => alert('Logging out...')}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  const StatCard = ({ title, value, gradient }) => (
    <div className={`rounded-2xl p-6 ${gradient} shadow-sm`}>
      <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
        {title}
      </h4>
      <p className="text-4xl font-bold text-gray-900">{value}</p>
    </div>
  );

  const DashboardPage = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Profile Views" 
          value={analytics.views} 
          gradient="bg-gradient-to-br from-blue-100 to-blue-200"
        />
        <StatCard 
          title="WhatsApp Clicks" 
          value={analytics.clicks} 
          gradient="bg-gradient-to-br from-green-100 to-green-200"
        />
        <StatCard 
          title="Conversion Rate" 
          value={`${conversionRate}%`} 
          gradient="bg-gradient-to-br from-yellow-100 to-yellow-200"
        />
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h4 className="text-xl font-bold mb-4">Recent Reviews</h4>
        {reviews.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <MessageSquare size={48} className="mx-auto mb-3 opacity-50" />
            <p>No reviews yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review, idx) => (
              <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                <div className="text-yellow-400 mb-2">
                  {'⭐'.repeat(review.rating)}
                </div>
                <p className="text-gray-700">{review.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const ProfilePage = () => {
    const [profile, setProfile] = useState({
      storeName: 'Zara Thrift Store',
      description: 'Premium thrift clothing store in Lagos. We sell high-quality vintage wears.',
      location: 'Lagos',
      whatsapp: '+234 801 234 5678'
    });

    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h4 className="text-xl font-bold mb-6">Vendor Profile</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Store Name</label>
            <input
              type="text"
              value={profile.storeName}
              onChange={(e) => setProfile({...profile, storeName: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <textarea
              rows={4}
              value={profile.description}
              onChange={(e) => setProfile({...profile, description: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
            <select
              value={profile.location}
              onChange={(e) => setProfile({...profile, location: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option>Lagos</option>
              <option>Abuja</option>
              <option>Port Harcourt</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">WhatsApp Number</label>
            <input
              type="text"
              value={profile.whatsapp}
              onChange={(e) => setProfile({...profile, whatsapp: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => alert('Profile updated successfully!')}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    );
  };

  const ProductsPage = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h4 className="text-xl font-bold mb-6">Add New Product</h4>
        <div className="space-y-4">
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
            />
          </div>
          <input
            type="text"
            placeholder="Item name (e.g., Vintage Denim Jacket)"
            value={uploadData.name}
            onChange={(e) => setUploadData({...uploadData, name: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="number"
            placeholder="Price (₦)"
            value={uploadData.price}
            onChange={(e) => setUploadData({...uploadData, price: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleItemUpload}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Upload size={20} />
            Upload Item
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h4 className="text-xl font-bold mb-6">Your Inventory ({items.length} items)</h4>
        {items.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Package size={48} className="mx-auto mb-3 opacity-50" />
            <p>No items uploaded yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {items.map(item => (
              <div key={item.id} className="group relative">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-40 object-cover rounded-lg shadow-md group-hover:shadow-xl transition-shadow"
                />
                <div className="mt-2">
                  <p className="font-semibold text-sm truncate">{item.name}</p>
                  {item.price && (
                    <p className="text-blue-600 font-bold">₦{Number(item.price).toLocaleString()}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const AnalyticsPage = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard 
          title="Total Views" 
          value={analytics.views} 
          gradient="bg-gradient-to-br from-blue-100 to-blue-200"
        />
        <StatCard 
          title="Total Clicks" 
          value={analytics.clicks} 
          gradient="bg-gradient-to-br from-green-100 to-green-200"
        />
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h4 className="text-xl font-bold mb-4">Traffic Overview</h4>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
          Chart Visualization Placeholder
        </div>
      </div>
    </div>
  );

  const OrdersPage = () => (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <h4 className="text-xl font-bold mb-6">Orders Received</h4>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Order ID</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Customer</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Item</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            <tr>
              <td className="px-4 py-3">#ORD-001</td>
              <td className="px-4 py-3">Chioma Okeke</td>
              <td className="px-4 py-3">Vintage Denim Jacket</td>
              <td className="px-4 py-3">Oct 24, 2023</td>
              <td className="px-4 py-3">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                  Completed
                </span>
              </td>
              <td className="px-4 py-3">₦15,000</td>
            </tr>
            <tr>
              <td className="px-4 py-3">#ORD-002</td>
              <td className="px-4 py-3">Emmanuel T.</td>
              <td className="px-4 py-3">Nike Air Max</td>
              <td className="px-4 py-3">Oct 25, 2023</td>
              <td className="px-4 py-3">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                  Pending
                </span>
              </td>
              <td className="px-4 py-3">₦25,000</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const MessagesPage = () => (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <h4 className="text-xl font-bold mb-6">Messages</h4>
      <div className="text-center py-12 text-gray-400">
        <MessageSquare size={48} className="mx-auto mb-3 opacity-50" />
        <p>No new messages</p>
      </div>
    </div>
  );

  const SettingsPage = () => {
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [notifications, setNotifications] = useState({ email: true, sms: true });

    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h4 className="text-xl font-bold mb-6">Account Settings</h4>
        <div className="space-y-6">
          <div>
            <h5 className="font-semibold mb-4">Change Password</h5>
            <div className="space-y-3">
              <input
                type="password"
                placeholder="Current Password"
                value={passwords.current}
                onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="password"
                placeholder="New Password"
                value={passwords.new}
                onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="password"
                placeholder="Confirm New Password"
                value={passwords.confirm}
                onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button 
              onClick={() => alert('Password updated!')}
              className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Update Password
            </button>
          </div>

          <hr className="border-gray-200" />

          <div>
            <h5 className="font-semibold mb-4">Notification Preferences</h5>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={notifications.email}
                  onChange={(e) => setNotifications({...notifications, email: e.target.checked})}
                  className="w-5 h-5" 
                />
                <span>Email Notifications</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={notifications.sms}
                  onChange={(e) => setNotifications({...notifications, sms: e.target.checked})}
                  className="w-5 h-5" 
                />
                <span>SMS Notifications</span>
              </label>
            </div>
            <button 
              onClick={() => alert('Preferences saved!')}
              className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    );
  };

  const SubscriptionPage = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-green-400 to-green-600 text-white rounded-2xl p-8 shadow-lg">
        <h3 className="text-3xl font-bold mb-2">Premium Vendor</h3>
        <p className="opacity-90">Next billing date: Nov 24, 2023</p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h4 className="text-xl font-bold mb-6">Plan Features</h4>
        <ul className="space-y-3">
          <li className="flex items-center gap-3 text-gray-700">
            <span className="text-green-500 text-xl">✓</span>
            <span>Unlimited Product Listings</span>
          </li>
          <li className="flex items-center gap-3 text-gray-700">
            <span className="text-green-500 text-xl">✓</span>
            <span>Verified Badge</span>
          </li>
          <li className="flex items-center gap-3 text-gray-700">
            <span className="text-green-500 text-xl">✓</span>
            <span>Advanced Analytics</span>
          </li>
          <li className="flex items-center gap-3 text-gray-700">
            <span className="text-green-500 text-xl">✓</span>
            <span>Priority Support</span>
          </li>
        </ul>
        <button 
          onClick={() => alert('Manage subscription')}
          className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Manage Subscription
        </button>
      </div>
    </div>
  );

  const pages = {
    dashboard: DashboardPage,
    profile: ProfilePage,
    products: ProductsPage,
    analytics: AnalyticsPage,
    orders: OrdersPage,
    messages: MessagesPage,
    settings: SettingsPage,
    subscription: SubscriptionPage
  };

  const CurrentPageComponent = pages[currentPage];

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">
              {navigation.find(n => n.id === currentPage)?.label}
            </h1>
            <button
              onClick={() => alert('Opening public page...')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
            >
              View Public Page
            </button>
          </div>
          <CurrentPageComponent />
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;