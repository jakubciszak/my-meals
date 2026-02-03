import { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { GoogleDriveProvider } from '../contexts/GoogleDriveContext'

function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <BrowserRouter>
      <GoogleDriveProvider>
        {children}
      </GoogleDriveProvider>
    </BrowserRouter>
  )
}

function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options })
}

export * from '@testing-library/react'
export { customRender as render }
