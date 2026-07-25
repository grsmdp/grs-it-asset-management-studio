import { cn } from "@/lib/utils"

function PageContainer({ children, className }) {
  return (
    <main
      className={cn(
        "flex-1 overflow-auto p-4 lg:p-6",
        className
      )}
    >
      {children}
    </main>
  )
}

export { PageContainer }
