const join = (...classes) => classes.filter(Boolean).join(' ');

export function GlassCard({ className, ...props }) {
  return <div data-slot="glass-card" className={join('glass-card', className)} {...props} />;
}

export function GlassCardHeader({ className, ...props }) {
  return <div data-slot="glass-card-header" className={join('glass-card-header', className)} {...props} />;
}

export function GlassCardTitle({ className, ...props }) {
  return <h1 data-slot="glass-card-title" className={join('glass-card-title', className)} {...props} />;
}

export function GlassCardDescription({ className, ...props }) {
  return <p data-slot="glass-card-description" className={join('glass-card-description', className)} {...props} />;
}

export function GlassCardAction({ className, ...props }) {
  return <div data-slot="glass-card-action" className={join('glass-card-action', className)} {...props} />;
}

export function GlassCardContent({ className, ...props }) {
  return <div data-slot="glass-card-content" className={join('glass-card-content', className)} {...props} />;
}

export function GlassCardFooter({ className, ...props }) {
  return <div data-slot="glass-card-footer" className={join('glass-card-footer', className)} {...props} />;
}
