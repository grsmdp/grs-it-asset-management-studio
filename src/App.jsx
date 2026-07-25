import './App.css'
import { useState, useEffect } from 'react'
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

  return (
    <div className="app">
      {showUpdateBanner && (
        <div className="pwa-update-banner">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-info-circle text-primary" />
            <span style={{ fontSize: "0.85rem" }}>A new version is available.</span>
            <button className="btn btn-sm btn-primary" onClick={handleUpdate}>
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

      <main className="main-content">
        <button
          className="btn btn-sm btn-outline-secondary d-md-none mb-2"
          onClick={() => setMobileOpen(true)}
        >
          <i className="bi bi-list me-1" />
          Menu
        </button>

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
  )
}

export default App
