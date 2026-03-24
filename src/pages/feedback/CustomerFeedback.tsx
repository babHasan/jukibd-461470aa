import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MessageSquare, Star, Search, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";

interface Feedback {
  id: string;
  job_number: string;
  customer_name: string;
  rating: number;
  feedback_text: string;
  created_at: string;
}

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`h-4 w-4 ${i <= count ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
      ))}
    </div>
  );
}

export default function CustomerFeedback() {
  const [items, setItems] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetch_ = async () => {
    const { data } = await supabase.from("customer_feedback").select("*").order("created_at", { ascending: false });
    setItems((data as unknown as Feedback[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetch_(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this feedback?")) return;
    await supabase.from("customer_feedback").delete().eq("id", id);
    toast.success("Deleted"); fetch_();
  };

  const filtered = items.filter(i =>
    i.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    i.job_number.toLowerCase().includes(search.toLowerCase())
  );

  const avgRating = items.length ? (items.reduce((s, i) => s + i.rating, 0) / items.length).toFixed(1) : "0";

  return (
    <AppLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold flex items-center gap-2"><MessageSquare className="h-6 w-6" /> Customer Feedback</h1>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card><CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Total Feedback</p>
            <p className="text-3xl font-bold">{items.length}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Average Rating</p>
            <p className="text-3xl font-bold flex items-center justify-center gap-2">{avgRating} <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" /></p>
          </CardContent></Card>
          <Card><CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">5-Star Reviews</p>
            <p className="text-3xl font-bold text-green-600">{items.filter(i => i.rating === 5).length}</p>
          </CardContent></Card>
        </div>

        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search feedback..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Feedback</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No feedback yet</TableCell></TableRow>
                ) : filtered.map(f => (
                  <TableRow key={f.id}>
                    <TableCell className="font-mono">{f.job_number || "-"}</TableCell>
                    <TableCell className="font-medium">{f.customer_name}</TableCell>
                    <TableCell><Stars count={f.rating} /></TableCell>
                    <TableCell className="max-w-xs truncate">{f.feedback_text}</TableCell>
                    <TableCell>{format(parseISO(f.created_at), "dd MMM yyyy")}</TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(f.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
