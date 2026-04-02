import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, GripVertical, Save, FileText } from "lucide-react";

interface ColumnSetting {
  id: string;
  column_key: string;
  column_label: string;
  visible_in_delivery: boolean;
  visible_in_receive: boolean;
  display_order: number;
  font_size: number;
  alignment: string;
}

export default function InvoiceColumnSettings() {
  const [columns, setColumns] = useState<ColumnSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newKey, setNewKey] = useState("");

  useEffect(() => {
    fetchColumns();
  }, []);

  async function fetchColumns() {
    const { data, error } = await supabase
      .from("invoice_column_settings")
      .select("*")
      .order("display_order", { ascending: true });
    if (error) {
      toast.error("Failed to load column settings");
    } else {
      setColumns((data as ColumnSetting[]) || []);
    }
    setLoading(false);
  }

  function toggleField(id: string, field: "visible_in_delivery" | "visible_in_receive") {
    setColumns(prev =>
      prev.map(c => c.id === id ? { ...c, [field]: !c[field] } : c)
    );
  }

  async function handleSave() {
    setSaving(true);
    let hasError = false;
    for (const col of columns) {
      const { error } = await supabase
        .from("invoice_column_settings")
        .update({
          column_label: col.column_label,
          visible_in_delivery: col.visible_in_delivery,
          visible_in_receive: col.visible_in_receive,
          display_order: col.display_order,
          font_size: col.font_size,
          alignment: col.alignment,
        })
        .eq("id", col.id);
      if (error) hasError = true;
    }
    setSaving(false);
    if (hasError) {
      toast.error("Failed to save some settings");
    } else {
      toast.success("Invoice column settings saved!");
    }
  }

  async function handleAdd() {
    if (!newLabel.trim()) {
      toast.error("Column label is required");
      return;
    }
    const key = newKey.trim() || newLabel.trim().toLowerCase().replace(/\s+/g, "_");
    const maxOrder = columns.reduce((max, c) => Math.max(max, c.display_order), 0);
    const { error } = await supabase
      .from("invoice_column_settings")
      .insert({
        column_key: key,
        column_label: newLabel.trim(),
        visible_in_delivery: true,
        visible_in_receive: true,
        display_order: maxOrder + 1,
      });
    if (error) {
      toast.error(error.message.includes("duplicate") ? "Column key already exists" : "Failed to add column");
    } else {
      toast.success("Column added!");
      setNewLabel("");
      setNewKey("");
      fetchColumns();
    }
  }

  async function handleDelete(id: string, label: string) {
    if (!confirm(`Delete column "${label}"?`)) return;
    const { error } = await supabase
      .from("invoice_column_settings")
      .delete()
      .eq("id", id);
    if (error) {
      toast.error("Failed to delete column");
    } else {
      toast.success("Column deleted!");
      setColumns(prev => prev.filter(c => c.id !== id));
    }
  }

  function moveUp(index: number) {
    if (index === 0) return;
    setColumns(prev => {
      const arr = [...prev];
      const tempOrder = arr[index].display_order;
      arr[index].display_order = arr[index - 1].display_order;
      arr[index - 1].display_order = tempOrder;
      [arr[index], arr[index - 1]] = [arr[index - 1], arr[index]];
      return arr;
    });
  }

  function moveDown(index: number) {
    if (index === columns.length - 1) return;
    setColumns(prev => {
      const arr = [...prev];
      const tempOrder = arr[index].display_order;
      arr[index].display_order = arr[index + 1].display_order;
      arr[index + 1].display_order = tempOrder;
      [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
      return arr;
    });
  }

  const isFinancialCol = (key: string) =>
    ["service_charge", "discount", "payable_amount"].includes(key);

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoice Column Settings
            </CardTitle>
            <CardDescription>
              Configure which columns appear on Delivery Invoice and Customer Receive Copy
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-sm">Loading...</p>
            ) : (
              <div className="space-y-4">
                {/* Column Table */}
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left p-3 font-medium">Order</th>
                        <th className="text-left p-3 font-medium">Column Label</th>
                        <th className="text-left p-3 font-medium">Key</th>
                        <th className="text-center p-3 font-medium">Font Size</th>
                        <th className="text-center p-3 font-medium">Alignment</th>
                        <th className="text-center p-3 font-medium">Delivery</th>
                        <th className="text-center p-3 font-medium">Receive</th>
                        <th className="text-center p-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {columns.map((col, i) => (
                        <tr key={col.id} className="border-t">
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                              <div className="flex flex-col">
                                <button
                                  onClick={() => moveUp(i)}
                                  disabled={i === 0}
                                  className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
                                >▲</button>
                                <button
                                  onClick={() => moveDown(i)}
                                  disabled={i === columns.length - 1}
                                  className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
                                >▼</button>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <Input
                              value={col.column_label}
                              onChange={e => setColumns(prev =>
                                prev.map(c => c.id === col.id ? { ...c, column_label: e.target.value } : c)
                              )}
                              className="h-8 text-sm"
                            />
                          </td>
                          <td className="p-3">
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{col.column_key}</code>
                          </td>
                          <td className="p-3 text-center">
                            <Switch
                              checked={col.visible_in_delivery}
                              onCheckedChange={() => toggleField(col.id, "visible_in_delivery")}
                            />
                          </td>
                          <td className="p-3 text-center">
                            {isFinancialCol(col.column_key) ? (
                              <span className="text-xs text-muted-foreground">N/A</span>
                            ) : (
                              <Switch
                                checked={col.visible_in_receive}
                                onCheckedChange={() => toggleField(col.id, "visible_in_receive")}
                              />
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(col.id, col.column_label)}
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Save */}
                <div className="flex justify-end">
                  <Button onClick={handleSave} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>

                {/* Add New Column */}
                <Card className="bg-muted/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Add New Column</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end gap-3">
                      <div className="flex-1">
                        <label className="text-xs text-muted-foreground mb-1 block">Column Label</label>
                        <Input
                          placeholder="e.g. Machine Type"
                          value={newLabel}
                          onChange={e => setNewLabel(e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-muted-foreground mb-1 block">Column Key (optional)</label>
                        <Input
                          placeholder="auto-generated from label"
                          value={newKey}
                          onChange={e => setNewKey(e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <Button onClick={handleAdd} className="h-9">
                        <Plus className="h-4 w-4 mr-1" /> Add
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
