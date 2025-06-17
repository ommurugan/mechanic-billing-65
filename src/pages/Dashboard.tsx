
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  Car, 
  Receipt, 
  Users, 
  BarChart3, 
  Plus, 
  Calendar,
  DollarSign,
  Wrench
} from "lucide-react";
import MobileSidebar from "@/components/MobileSidebar";
import BottomNavigation from "@/components/BottomNavigation";
import { useInvoices } from "@/hooks/useInvoices";
import { useCustomers } from "@/hooks/useCustomers";
import TodaysRevenueModal from "@/components/dashboard/TodaysRevenueModal";
import VehiclesServicedModal from "@/components/dashboard/VehiclesServicedModal";
import ActiveCustomersModal from "@/components/dashboard/ActiveCustomersModal";
import PendingInvoicesModal from "@/components/dashboard/PendingInvoicesModal";

const Dashboard = () => {
  const navigate = useNavigate();
  const [currentDate] = useState(new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }));

  // Modal states
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [showVehiclesModal, setShowVehiclesModal] = useState(false);
  const [showCustomersModal, setShowCustomersModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);

  const { data: invoices = [] } = useInvoices();
  const { data: customers = [] } = useCustomers();

  console.log('All invoices:', invoices);

  // Calculate real stats from actual data
  const paidInvoices = invoices.filter(inv => inv.status === 'paid');
  console.log('Paid invoices:', paidInvoices);
  
  const todayRevenue = paidInvoices
    .filter(inv => new Date(inv.createdAt).toDateString() === new Date().toDateString())
    .reduce((sum, inv) => sum + inv.total, 0);
  
  console.log('Today revenue calculation:', todayRevenue);
  
  // Only count completed/paid invoices as serviced vehicles (not drafts)
  const todayVehicles = invoices
    .filter(inv => 
      new Date(inv.createdAt).toDateString() === new Date().toDateString() && 
      inv.status === 'paid'
    ).length;

  // Include both pending and draft invoices as pending
  const pendingInvoices = invoices.filter(inv => inv.status === 'pending' || inv.status === 'draft').length;

  // Prepare data for modals
  const todaysPaidInvoices = paidInvoices.filter(inv => 
    new Date(inv.createdAt).toDateString() === new Date().toDateString()
  );

  const revenueItems = todaysPaidInvoices.map(invoice => ({
    id: invoice.id,
    vehicleInfo: `${(invoice as any).vehicles?.make || ''} ${(invoice as any).vehicles?.model || ''} - ${(invoice as any).vehicles?.vehicle_number || ''}`.trim() || 'Unknown Vehicle',
    services: invoice.items?.filter(item => item.type === 'service').map(item => item.name) || [],
    parts: invoice.items?.filter(item => item.type === 'part').map(item => item.name) || [],
    amount: invoice.total,
    customerName: (invoice as any).customers?.name || 'Unknown Customer'
  }));

  // Only show paid/completed vehicles as serviced
  const todaysServicedVehicles = invoices
    .filter(inv => 
      new Date(inv.createdAt).toDateString() === new Date().toDateString() && 
      inv.status === 'paid'
    )
    .map(invoice => ({
      id: invoice.id,
      customerName: (invoice as any).customers?.name || 'Unknown Customer',
      vehicleName: `${(invoice as any).vehicles?.make || ''} ${(invoice as any).vehicles?.model || ''}`.trim() || 'Unknown Vehicle',
      vehicleNumber: (invoice as any).vehicles?.vehicle_number || 'N/A',
      services: invoice.items?.filter(item => item.type === 'service').map(item => item.name) || [],
      parts: invoice.items?.filter(item => item.type === 'part').map(item => item.name) || []
    }));

  const activeCustomersData = customers.map(customer => {
    // Calculate total spent by this customer
    const customerInvoices = invoices.filter(inv => inv.customerId === customer.id && inv.status === 'paid');
    const totalSpent = customerInvoices.reduce((sum, inv) => sum + inv.total, 0);
    
    // Get the most recent vehicle for this customer
    const recentInvoice = customerInvoices[0];
    const vehicleName = recentInvoice 
      ? `${(recentInvoice as any).vehicles?.make || ''} ${(recentInvoice as any).vehicles?.model || ''}`.trim()
      : 'No Vehicle';
    const vehicleNumber = recentInvoice 
      ? (recentInvoice as any).vehicles?.vehicle_number || 'N/A'
      : 'N/A';

    return {
      id: customer.id,
      customerName: customer.name,
      vehicleName,
      vehicleNumber,
      totalSpent
    };
  });

  // Include both pending and draft invoices
  const pendingInvoicesData = invoices
    .filter(inv => inv.status === 'pending' || inv.status === 'draft')
    .map(invoice => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerName: (invoice as any).customers?.name || 'Unknown Customer',
      vehicleInfo: `${(invoice as any).vehicles?.make || ''} ${(invoice as any).vehicles?.model || ''}`.trim() || 'Unknown Vehicle',
      amount: invoice.total,
      createdAt: invoice.createdAt,
      status: invoice.status
    }));

  const stats = [
    {
      title: "Today's Revenue",
      value: `₹${todayRevenue.toLocaleString()}`,
      change: todayRevenue > 0 ? "+100%" : "0%",
      icon: DollarSign,
      color: "text-green-600",
      onClick: () => setShowRevenueModal(true)
    },
    {
      title: "Vehicles Serviced",
      value: todayVehicles.toString(),
      change: todayVehicles > 0 ? "+100%" : "0%",
      icon: Car,
      color: "text-blue-600",
      onClick: () => setShowVehiclesModal(true)
    },
    {
      title: "Active Customers",
      value: customers.length.toString(),
      change: customers.length > 0 ? "+100%" : "0%",
      icon: Users,
      color: "text-purple-600",
      onClick: () => setShowCustomersModal(true)
    },
    {
      title: "Pending Invoices",
      value: pendingInvoices.toString(),
      change: pendingInvoices > 0 ? "+100%" : "0%",
      icon: Receipt,
      color: "text-orange-600",
      onClick: () => setShowPendingModal(true)
    }
  ];

  const quickActions = [
    { title: "New Invoice", icon: Plus, action: () => navigate('/invoices'), color: "bg-blue-600" },
    { title: "Customer", icon: Users, action: () => navigate('/customers'), color: "bg-green-600" },
    { title: "Manage Services", icon: Wrench, action: () => navigate('/services'), color: "bg-purple-600" },
    { title: "View Reports", icon: BarChart3, action: () => navigate('/reports'), color: "bg-orange-600" }
  ];

  const hasData = invoices.length > 0 || customers.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <MobileSidebar />
      
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white shadow-sm border-b px-4 md:px-6 py-4 pt-20 md:pt-4 relative z-10">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {currentDate}
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => navigate('/invoices')} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                New Invoice
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6 space-y-6 relative z-0">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card 
                key={index} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={stat.onClick}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="flex items-center gap-1 text-sm">
                    <span className="text-gray-500">Click for details</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Frequently used functions for faster workflow</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-20 flex flex-col gap-2 hover:bg-gray-50"
                    onClick={action.action}
                  >
                    <div className={`p-2 rounded-lg ${action.color}`}>
                      <action.icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-sm font-medium">{action.title}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity or Empty State */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest service updates and transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {hasData ? (
                <div className="space-y-4">
                  {invoices.slice(0, 4).map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Car className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Invoice #{invoice.invoiceNumber}</p>
                          <p className="text-sm text-gray-600">{invoice.invoiceType} • {invoice.status}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">₹{invoice.total.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(invoice.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Activity Yet</h3>
                  <p className="text-gray-500 mb-4">
                    Start by creating your first invoice or adding customers to see activity here.
                  </p>
                  <Button onClick={() => navigate('/invoices')} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Invoice
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
      
      <BottomNavigation />

      {/* Modals */}
      <TodaysRevenueModal
        isOpen={showRevenueModal}
        onClose={() => setShowRevenueModal(false)}
        revenueItems={revenueItems}
      />
      
      <VehiclesServicedModal
        isOpen={showVehiclesModal}
        onClose={() => setShowVehiclesModal(false)}
        servicedVehicles={todaysServicedVehicles}
      />
      
      <ActiveCustomersModal
        isOpen={showCustomersModal}
        onClose={() => setShowCustomersModal(false)}
        activeCustomers={activeCustomersData}
      />
      
      <PendingInvoicesModal
        isOpen={showPendingModal}
        onClose={() => setShowPendingModal(false)}
        pendingInvoices={pendingInvoicesData}
      />
    </div>
  );
};

export default Dashboard;
