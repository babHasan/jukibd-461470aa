import { useRepairs } from "@/context/RepairContext";
import { KpiCards } from "@/components/KpiCards";
import { RepairTable } from "@/components/RepairTable";
import { AppLayout } from "@/components/AppLayout";

const Index = () => {
  const { orders, updateStatus } = useRepairs();

  return (
    <AppLayout>
      <div className="space-y-6">
        <KpiCards orders={orders} />
        <RepairTable orders={orders} onUpdateStatus={updateStatus} />
      </div>
    </AppLayout>
  );
};

export default Index;
