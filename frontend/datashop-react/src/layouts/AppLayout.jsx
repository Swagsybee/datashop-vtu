import { Outlet } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import Topbar from '../components/layout/Topbar'
import PinModal from '../components/modals/PinModal'
import FundWalletModal from '../components/modals/FundWalletModal'

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:ml-64">
        <Topbar />
        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
      <PinModal />
      <FundWalletModal />
    </div>
  )
}
