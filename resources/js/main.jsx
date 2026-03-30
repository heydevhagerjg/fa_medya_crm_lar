import './bootstrap';
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import '../css/app.css'
import { useThemeStore } from './stores/index.js'

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            staleTime: 30000,
        },
    },
})

    // Initialize theme BEFORE React renders to avoid flash
    ; (function () {
        try {
            const stored = JSON.parse(localStorage.getItem('crm-theme') || '{}')
            const theme = stored?.state?.theme || 'dark'
            const palette = stored?.state?.palette || 'violet'
            if (theme === 'dark') {
                document.documentElement.classList.add('dark')
            } else {
                document.documentElement.classList.remove('dark')
            }
            document.documentElement.dataset.palette = palette
        } catch {
            document.documentElement.classList.add('dark')
            document.documentElement.dataset.palette = 'violet'
        }
    })()

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <App />
                <Toaster
                    position="top-right"
                    toastOptions={{
                        className: 'dark:bg-gray-800 dark:text-white',
                        duration: 3000,
                        style: {
                            borderRadius: '10px',
                            background: undefined,
                            color: undefined,
                        },
                    }}
                />
            </BrowserRouter>
        </QueryClientProvider>
    </React.StrictMode>
)
