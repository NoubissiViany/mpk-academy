import { PublicHeader } from "@/components/public-header";
import { Wordmark } from "@/components/shared";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <><PublicHeader /><main>{children}</main><footer className="mt-24 border-t border-border bg-card"><div className="container-page grid gap-10 py-12 sm:grid-cols-3"><div><Wordmark /><p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">Understand in English. Learn in French. Perform in French.</p></div><div><p className="text-sm font-bold">Prepare with clarity</p><p className="mt-3 text-sm leading-6 text-muted-foreground">Independent practice material. MPK Academy is not an official TEF/TCF testing organization.</p></div><div><p className="text-sm font-bold">Canada-focused</p><p className="mt-3 text-sm leading-6 text-muted-foreground">Privacy-minded learning for adult immigrants and professionals.</p></div></div><div className="border-t py-5 text-center text-xs text-muted-foreground">© 2026 MPK Academy. Mock frontend MVP.</div></footer></>;
}
