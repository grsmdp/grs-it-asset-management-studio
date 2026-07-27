import { useState } from "react";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./components/Dashboard";
import Assets from "./components/Assets";
import AddAsset from "./components/AddAsset";
import EditAsset from "./components/EditAsset";
import AssetMovement from "./components/AssetMovement";
import Maintenance from "./components/Maintenance";
import Reports from "./components/Reports";
import Masters from "./components/Masters";
import HelpdeskDashboard from "./components/helpdesk/HelpdeskDashboard";
import NewTicket from "./components/helpdesk/NewTicket";
import AllTickets from "./components/helpdesk/AllTickets";
import MyTickets from "./components/helpdesk/MyTickets";
import TicketDetail from "./components/helpdesk/TicketDetail";
import HelpdeskReports from "./components/helpdesk/HelpdeskReports";

function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [editingAssetId, setEditingAssetId] = useState(null);
  const [viewingTicketId, setViewingTicketId] = useState(null);

  return (
    <AppLayout currentPage={currentPage} setCurrentPage={setCurrentPage}>
      {currentPage === "dashboard" && (
        <Dashboard setCurrentPage={setCurrentPage} />
      )}

      {currentPage === "assets" && (
        <Assets
          setCurrentPage={setCurrentPage}
          onEditAsset={(id) => {
            setEditingAssetId(id);
            setCurrentPage("editAsset");
          }}
        />
      )}

      {currentPage === "addAsset" && (
        <AddAsset setCurrentPage={setCurrentPage} />
      )}

      {currentPage === "editAsset" && (
        <EditAsset assetId={editingAssetId} setCurrentPage={setCurrentPage} />
      )}

      {currentPage === "movement" && (
        <AssetMovement setCurrentPage={setCurrentPage} />
      )}

      {currentPage === "maintenance" && <Maintenance />}

      {currentPage === "reports" && <Reports />}

      {currentPage === "categories" && <Masters masterType="categories" />}
      {currentPage === "departments" && <Masters masterType="departments" />}
      {currentPage === "vendors" && <Masters masterType="vendors" />}
      {currentPage === "locations" && <Masters masterType="locations" />}

      {currentPage === "helpdesk" && (
        <HelpdeskDashboard setCurrentPage={setCurrentPage} />
      )}

      {currentPage === "newTicket" && (
        <NewTicket
          setCurrentPage={setCurrentPage}
          setViewingTicketId={setViewingTicketId}
        />
      )}

      {currentPage === "allTickets" && (
        <AllTickets
          setCurrentPage={setCurrentPage}
          setViewingTicketId={setViewingTicketId}
        />
      )}

      {currentPage === "myTickets" && (
        <MyTickets
          setCurrentPage={setCurrentPage}
          setViewingTicketId={setViewingTicketId}
        />
      )}

      {currentPage === "ticketDetail" && viewingTicketId && (
        <TicketDetail
          ticketId={viewingTicketId}
          setCurrentPage={setCurrentPage}
        />
      )}

      {currentPage === "helpdeskReports" && (
        <HelpdeskReports setCurrentPage={setCurrentPage} />
      )}
    </AppLayout>
  );
}

export default App;
