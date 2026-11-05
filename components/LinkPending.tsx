'use client';
import { useLinkStatus } from 'next/link';

/** Va dentro de un <Link>: lo marca desde que se pulsa hasta que llega la nueva página. */
export default function LinkPending() {
  const { pending } = useLinkStatus();
  return pending ? <span className="link-pending" aria-hidden="true" /> : null;
}
