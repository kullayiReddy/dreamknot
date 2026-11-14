import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { getContributionStatus } from "@/lib/payments.functions";
import { formatINR } from "@/lib/demo";

export const Route = createFileRoute("/contribution/$id")({
  head: () => ({ meta: [{ title: "Contribution status — DreamKnot" }, { name: "description", content: "Your DreamKnot contribution status." }, { property: "og:title", content: "Contribution status — DreamKnot" }, { property: "og:description", content: "Your contribution status." }, { name: "robots", content: "noindex" }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: StatusPage,
});

function StatusPage() {
  const { id } = Route.useParams();
  const fetchStatus = useServerFn(getContributionStatus);
  const { data, isLoading } = useQuery({
    queryKey: ["contribution", id],
    queryFn: () => fetchStatus({ data: { id } }),
    refetchInterval: (q) => (q.state.data?.status === "pending" ? 3000 : false),
  });
  if (isLoading) return <p className="p-20 text-center text-muted-foreground">Checking payment…</p>;
  if (!data) return <p className="p-20 text-center">Contribution not found.</p>;
  const Icon = data.status === "paid" ? CheckCircle2 : data.status === "failed" ? XCircle : Clock;
  return (
    <section className="mx-auto max-w-lg px-6 py-20 text-center">
      <Icon className="mx-auto h-14 w-14 text-gold" />
      <h1 className="mt-4 text-5xl">{data.status === "paid" ? "Payment confirmed" : data.status === "failed" ? "Payment failed" : "Payment pending"}</h1>
      <div className="mt-8 space-y-2 rounded-2xl bg-card p-6 text-left text-sm shadow-soft">
        <Row k="Amount" v={formatINR(data.amount)} />
        <Row k="For" v={data.itemTitle} />
        <Row k="Couple" v={data.couple} />
        <Row k="From" v={data.guestName} />
        {data.paymentRef && <Row k="Payment reference" v={data.paymentRef} />}
        {data.paidAt && <Row k="Paid on" v={new Date(data.paidAt).toLocaleString("en-IN")} />}
      </div>
      {data.slug && <Link to="/weddings/$slug" params={{ slug: data.slug }} className="mt-8 inline-block text-sm underline">Back to {data.couple}</Link>}
    </section>
  );
}
const Row = ({ k, v }: { k: string; v: string }) => <div className="flex justify-between gap-4"><span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span></div>;
