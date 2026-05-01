import { ReactNode } from 'react';

export default function TransactionsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="p-8">
      {children}
    </div>
  );
}
