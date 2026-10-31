import { StrictMode, Component, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { ReactFlowProvider } from '@xyflow/react'
import './index.css'
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
        <div
          style={{
            padding: 24,
            fontFamily: 'system-ui, sans-serif',
            background: '#020617',
            color: '#e2e8f0',
            minHeight: '100vh',
          }}
        >
          <h1 style={{ fontSize: 18, marginBottom: 12 }}>ARGUS failed to start</h1>
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              background: '#1e293b',
              padding: 16,
              borderRadius: 8,
              fontSize: 12,
              color: '#fca5a5',
            }}
          >
            {this.state.error.message}\n{this.state.error.stack}
          </pre>
          <p style={{ marginTop: 16, color: '#94a3b8', fontSize: 13 }}>
            Open DevTools → Console for details. Try hard refresh (Ctrl+Shift+R).
          </p>
        </div>
      )
    }
    return this.props.children
  }
}

const root = document.getElementById('root')
if (!root) {
  throw new Error('Missing #root element in index.html')
}

createRoot(root).render(
  <StrictMode>
    <RootErrorBoundary>
      <ReactFlowProvider>
        <App />
      </ReactFlowProvider>
    </RootErrorBoundary>
  </StrictMode>,
)
