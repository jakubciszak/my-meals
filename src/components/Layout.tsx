import { Outlet } from 'react-router-dom'
import Navigation from './Navigation'

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen min-h-dvh">
      <main className="flex-1 pb-20">
        <Outlet />
      </main>
      <Navigation />
    </div>
  )
}
