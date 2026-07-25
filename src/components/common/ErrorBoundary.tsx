import { Component, type ReactNode } from 'react'
import { Icon } from '@iconify/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      console.error('ErrorBoundary caught:', error, errorInfo)
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <Card className="max-w-md w-full">
              <CardContent className="pt-6 flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center">
                  <Icon icon="mdi:alert-circle" className="text-3xl text-red-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg mb-2">Terjadi Kesalahan</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Aplikasi mengalami masalah yang tidak terduga. Silakan coba refresh halaman atau hubungi support.
                  </p>
                  {(import.meta as any).env.DEV && this.state.error && (
                    <details className="text-xs text-muted-foreground text-left p-3 bg-muted rounded mb-4 overflow-auto max-h-32">
                      <summary className="cursor-pointer font-mono font-semibold">Detail Error</summary>
                      <pre className="mt-2 whitespace-pre-wrap break-words">{this.state.error.toString()}</pre>
                    </details>
                  )}
                </div>
                <div className="flex gap-2 w-full">
                  <Button variant="outline" className="flex-1" onClick={() => window.location.href = '/'}>
                    <Icon icon="mdi:home" className="mr-2" />Home
                  </Button>
                  <Button className="flex-1 bg-wa-600 hover:bg-wa-700" onClick={this.resetError}>
                    <Icon icon="mdi:refresh" className="mr-2" />Coba Lagi
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      )
    }

    return this.props.children
  }
}
