import { LayoutWrapper } from '@/components/dashboard/layout-wrapper'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <LayoutWrapper variant="sidebar">
      {children}
    </LayoutWrapper>
  )
}