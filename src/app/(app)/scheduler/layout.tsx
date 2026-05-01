import { ReactNode } from 'react';

export default function AgencyLayout({ children }: { children: ReactNode }) {
  return (
    <div className="p-8">
      {children}
    </div>
  );
}
