import './App.css'
import { useState, useEffect } from 'react'
import { Bell, Search, Menu, ChevronRight, Download, X, Info } from 'lucide-react'
import Sidebar from './components/Sidebar'
import InstallPrompt from './components/InstallPrompt'
import Dashboard from './components/Dashboard'
import Assets from './components/Assets'
import AddAsset from './components/AddAsset'
import EditAsset from './components/EditAsset'
import AssetMovement from './components/AssetMovement'
import Maintenance from './components/Maintenance'
import Reports from './components/Reports'
import Masters from './components/Masters'
import HelpdeskDashboard from './components/helpdesk/HelpdeskDashboard'
import NewTicket from './components/helpdesk/NewTicket'
import AllTickets from './components/helpdesk/AllTickets'
import MyTickets from './components/helpdesk/MyTickets'
import TicketDetail from './components/helpdesk/TicketDetail'
import HelpdeskReports from './components/helpdesk/HelpdeskReports'

const breadcrumbMap = {
  dashboard: ['Dashboard'],
  assets: ['Assets'],
  addAsset: ['Assets', 'Add Asset'],
  editAsset: ['Assets', 'Edit Asset'],
  movement: ['Asset Movement'],
  maintenance: ['Maintenance'],
  reports: ['Reports'],
  categories: ['Settings', 'Categories'],
  departments: ['Settings', 'Departments'],
  vendors: ['Settings', 'Vendors'],
  locations: ['Settings', 'Locations'],
  helpdesk: ['Helpdesk', 'Dashboard'],
  newTicket: ['Helpdesk', 'New Ticket'],
  allTickets: ['Helpdesk', 'All Tickets'],
  myTickets: ['Helpdesk', 'My Tickets'],
  ticketDetail: ['Helpdesk', 'Ticket Detail'],
  helpdeskReports: ['Helpdesk', 'Reports'],
}

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [editingAssetId, setEditingAssetId] = useState(null)
  const [viewingTicketId, setViewingTicketId] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showUpdateBanner, setShowUpdateBanner] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setShowUpdateBanner(true);
      });
    }
  }, []);

  function handleUpdate() {
    window.location.reload();
  }

  const crumbs = breadcrumbMap[currentPage] || ['Dashboard']

  return (
    <div className="flex min-h-screen bg-[#f4f7fb]">
      {showUpdateBanner && (
        <div className="fixed top-0 left-0 right-0 z-[9997] border-b border-blue-200 bg-blue-50 py-2 text-center lg:left-[260px]">
          <div className="flex items-center justify-center gap-2">
            <Info className="h-4 w-4 text-blue-600" />
            <span className="text-sm">A new version is available.</span>
            <button className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700" onClick={handleUpdate}>
              Update
            </button>
          </div>
        </div>
      )}
      <InstallPrompt />
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex flex-1 flex-col lg:ml-[260px]">
        <header className="flex h-14 shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-4 lg:px-6">
          <button
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          <nav className="hidden items-center gap-1 text-sm text-slate-500 md:flex">
            <button onClick={() => setCurrentPage('dashboard')} className="hover:text-slate-900">
              Home
            </button>
            {crumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                <ChevronRight className="h-3.5 w-3.5" />
                {i < crumbs.length - 1 ? (
                  <button onClick={() => setCurrentPage('dashboard')} className="hover:text-slate-900">
                    {crumb}
                  </button>
                ) : (
                  <span className="font-medium text-slate-900">{crumb}</span>
                )}
              </span>
            ))}
          </nav>

          <div className="flex-1" />

          <div className="relative hidden sm:block">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              className="h-9 w-56 rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <button className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              0
            </span>
          </button>

          <div className="hidden h-6 w-px bg-slate-200 sm:block" />

          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
              MD
            </div>
            <span className="hidden text-sm font-medium lg:inline">IT Admin</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {currentPage === 'dashboard' && (
            <Dashboard setCurrentPage={setCurrentPage} />
          )}

          {currentPage === 'assets' && (
            <Assets
              setCurrentPage={setCurrentPage}
              onEditAsset={(id) => {
                setEditingAssetId(id)
                setCurrentPage('editAsset')
              }}
            />
          )}

          {currentPage === 'addAsset' && (
            <AddAsset setCurrentPage={setCurrentPage} />
          )}

          {currentPage === 'editAsset' && (
            <EditAsset assetId={editingAssetId} setCurrentPage={setCurrentPage} />
          )}

          {currentPage === 'movement' && (
            <AssetMovement setCurrentPage={setCurrentPage} />
          )}

          {currentPage === 'maintenance' && (
            <Maintenance />
          )}

          {currentPage === 'reports' && (
            <Reports />
          )}

          {currentPage === 'categories' && (
            <Masters masterType="categories" />
          )}

          {currentPage === 'departments' && (
            <Masters masterType="departments" />
          )}

          {currentPage === 'vendors' && (
            <Masters masterType="vendors" />
          )}

          {currentPage === 'locations' && (
            <Masters masterType="locations" />
          )}

          {currentPage === 'helpdesk' && (
            <HelpdeskDashboard setCurrentPage={setCurrentPage} />
          )}

          {currentPage === 'newTicket' && (
            <NewTicket
              setCurrentPage={setCurrentPage}
              setViewingTicketId={setViewingTicketId}
            />
          )}

          {currentPage === 'allTickets' && (
            <AllTickets
              setCurrentPage={setCurrentPage}
              setViewingTicketId={setViewingTicketId}
            />
          )}

          {currentPage === 'myTickets' && (
            <MyTickets
              setCurrentPage={setCurrentPage}
              setViewingTicketId={setViewingTicketId}
            />
          )}

          {currentPage === 'ticketDetail' && viewingTicketId && (
            <TicketDetail
              ticketId={viewingTicketId}
              setCurrentPage={setCurrentPage}
            />
          )}

          {currentPage === 'helpdeskReports' && (
            <HelpdeskReports setCurrentPage={setCurrentPage} />
          )}
        </main>
      </div>
    </div>
  )
}

export default App
