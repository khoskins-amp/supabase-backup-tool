import { ThemeProvider } from './theme.provider';
import { TRPCProvider } from './trpc.provider';
import { ToastProvider } from './toast.provider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <TRPCProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </TRPCProvider>
    </ThemeProvider>
  );
}

// Re-export individual providers for direct usage if needed
export { ThemeProvider } from './theme.provider';
export { TRPCProvider } from './trpc.provider';
export { ToastProvider } from './toast.provider'; 