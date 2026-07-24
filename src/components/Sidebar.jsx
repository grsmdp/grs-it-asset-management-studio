function Sidebar({ currentPage, setCurrentPage, mobileOpen, onCloseMobile }) {
  const menuSections = [
    {
      title: "Main",
      items: [
        { id: "dashboard", icon: "bi-grid", name: "Dashboard" },
        { id: "assets", icon: "bi-pc-display", name: "Assets" },
        { id: "movement", icon: "bi-arrow-left-right", name: "Asset Movement" },
        { id: "maintenance", icon: "bi-tools", name: "Maintenance" },
        { id: "reports", icon: "bi-bar-chart", name: "Reports" },
      ],
    },
    {
      title: "Helpdesk",
      items: [
        { id: "helpdesk", icon: "bi-headset", name: "Dashboard" },
        { id: "newTicket", icon: "bi-plus-circle", name: "New Ticket" },
        { id: "allTickets", icon: "bi-list-ul", name: "All Tickets" },
        { id: "myTickets", icon: "bi-person-lines-fill", name: "My Tickets" },
        { id: "helpdeskReports", icon: "bi-bar-chart", name: "Reports" },
      ],
    },
    {
      title: "Management",
      items: [
        { id: "categories", icon: "bi-tags", name: "Categories" },
        { id: "departments", icon: "bi-building", name: "Departments" },
        { id: "vendors", icon: "bi-truck", name: "Vendors" },
        { id: "locations", icon: "bi-geo-alt", name: "Locations" },
      ],
    },
  ];

  function handleNavigate(pageId) {
    setCurrentPage(pageId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  }

  return (
    <>
      <div
        className={`sidebar-backdrop ${mobileOpen ? "show" : ""}`}
        onClick={onCloseMobile}
      />

      <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="brand">
          <div className="brand-icon">GRS</div>
          <div>
            <h2>GRS IT</h2>
            <span>Asset Management</span>
          </div>
        </div>

        <nav className="menu">
          {menuSections.map((section) => (
            <div key={section.title}>
              <div className="menu-title">{section.title.toUpperCase()}</div>

              {section.items.map((item) => (
                <div
                  key={item.id}
                  className={`menu-item ${
                    currentPage === item.id ||
                    (item.id === "assets" &&
                      ["addAsset", "editAsset"].includes(currentPage)) ||
                    (item.id === "allTickets" &&
                      currentPage === "ticketDetail") ||
                    (item.id === "helpdesk" &&
                      ["newTicket", "allTickets", "myTickets", "ticketDetail", "helpdeskReports"].includes(currentPage))
                      ? "active"
                      : ""
                  }`}
                  onClick={() => handleNavigate(item.id)}
                >
                  <span>
                    <i className={`bi ${item.icon}`} />
                  </span>
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-avatar">MD</div>
          <div>
            <strong>IT Administrator</strong>
            <small>GRS IT Department</small>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
