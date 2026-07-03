import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export function AuthShell({
  children,
  sideLabel,
}: {
  children: ReactNode;
  sideLabel: string;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div
        className="hidden lg:flex flex-col justify-between p-12"
        style={{ background: '#1E3932' }}
      >
        <div className="font-display font-light italic text-[28px] text-[#F7F2EB] leading-none">
          Café <span className="text-gold">Étoile</span>
        </div>
        <div>
          <div className="font-display font-light italic text-[56px] leading-[1.05] text-[#F7F2EB]">
            A boutique
            <br />
            café, <span className="text-gold">precisely</span>
            <br />
            measured.
          </div>
          <p className="mt-6 text-[15px] tracking-[0.22em] uppercase font-extralight text-[#6B6459]">
            {sideLabel}
          </p>
        </div>
        <div className="text-[14px] tracking-[0.2em] uppercase font-extralight text-[#6B6459]">
          Point of Sale · Established Est. MMXXVI
        </div>
      </div>
      <div className="flex flex-col min-h-screen lg:min-h-0">
        <div className="lg:hidden p-6 border-b border-border">
          <div className="font-display font-light italic text-[26px] text-text leading-none">
            Café <span className="text-gold">Étoile</span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

export function AuthLink({
  to,
  label,
  prefix,
}: {
  to: string;
  label: string;
  prefix: string;
}) {
  return (
    <p className="mt-6 text-[16px] font-light text-text-muted">
      {prefix}{' '}
      <Link to={to} className="text-gold tracking-[0.1em] uppercase text-[15px]">
        {label}
      </Link>
    </p>
  );
}
