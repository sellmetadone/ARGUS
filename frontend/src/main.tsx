import { StrictMode, Component, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { ReactFlowProvider } from '@xyflow/react'
import './index.css'
import './styles/m3-panels.css'
import './styles/m3-sidebar.css'
import './styles/m3-motion-forms.css'
import './styles/m3-density.css'
import './styles/m3-breakpoints.css'
import './styles/m3-inspector-timeline.css'
import App from './App.tsx'
import { registerBuiltinModules } from './core/moduleRegistry'

registerBuiltinModules()

class RootErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: 'system-ui', color: '#e2e8f0', background: '#0f172a', minHeight: '100vh' }}>
          <h1 style={{ fontSize: 18 }}>ARGUS failed to start</h1>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, opacity: 0.9 }}>{String(this.state.error?.message || this.state.error)}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 11, opacity: 0.6, marginTop: 12 }}>{this.state.error?.stack}</pre>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootErrorBoundary>
      <ReactFlowProvider>
        <App />
      </ReactFlowProvider>
    </RootErrorBoundary>
  </StrictMode>,
)
