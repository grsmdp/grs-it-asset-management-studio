export function getStatusBadgeClass(status) {
  switch (status) {
    case "Active":
      return "bg-success";
    case "Under Repair":
      return "bg-warning text-dark";
    case "Spare":
      return "bg-info text-dark";
    case "Scrapped":
      return "bg-secondary";
    case "Scheduled":
      return "bg-primary";
    case "In Progress":
      return "bg-warning text-dark";
    case "Completed":
      return "bg-success";
    default:
      return "bg-primary";
  }
}
