import { useState, useEffect, useCallback, useRef } from "react";
import { BookOpen, Plus, Pencil, Trash2, Upload, FileText, Loader2 } from "lucide-react";
import { api, type KnowledgeEntry } from "../../../lib/api";
import { useBusiness } from "../../../lib/business-context";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Switch } from "../ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

const CATEGORIES = ["general", "pricing", "faq", "policy", "hours", "services"];

export function KnowledgeBase() {
  const { business } = useBusiness();
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<KnowledgeEntry | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    title: "",
    content: "",
    keywords: "",
    category: "general",
    is_active: true,
  });

  const load = useCallback(async () => {
    if (!business) return;
    setLoading(true);
    try {
      const res = await api.knowledge.list(business.id);
      setEntries(res.entries);
    } catch (err) {
      console.error("Failed to load knowledge:", err);
    } finally {
      setLoading(false);
    }
  }, [business]);

  useEffect(() => { load(); }, [load]);

  function resetForm() {
    setForm({ title: "", content: "", keywords: "", category: "general", is_active: true });
    setEditing(null);
  }

  function openEdit(entry: KnowledgeEntry) {
    setForm({
      title: entry.title,
      content: entry.content,
      keywords: entry.keywords.join(", "),
      category: entry.category,
      is_active: entry.is_active,
    });
    setEditing(entry);
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!business) return;
    const payload = {
      title: form.title,
      content: form.content,
      keywords: form.keywords.split(",").map((k) => k.trim()).filter(Boolean),
      category: form.category,
      is_active: form.is_active,
    };
    try {
      if (editing) {
        await api.knowledge.update(editing.id, payload);
      } else {
        await api.knowledge.create(business.id, payload);
      }
      setDialogOpen(false);
      resetForm();
      load();
    } catch (err) {
      console.error("Failed to save knowledge:", err);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.knowledge.delete(id);
      setDeleting(null);
      load();
    } catch (err) {
      console.error("Failed to delete knowledge:", err);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !business) return;
    setUploading(true);
    try {
      await api.knowledge.upload(business.id, file);
      load();
    } catch (err) {
      console.error("Failed to upload file:", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  if (!business) return null;

  return (
    <div className="h-full p-8 flex flex-col overflow-hidden gap-8">
      <div className="flex items-start justify-between shrink-0 gap-4">
        <div>
          <h1>Knowledge Base</h1>
          <p className="text-muted-foreground">Manage business information used by your AI assistant</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {uploading ? "Uploading..." : "Upload File"}
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Knowledge
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Knowledge" : "Add Knowledge"}</DialogTitle>
                <DialogDescription>
                  Add information the AI assistant should know when responding to leads.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 overflow-y-auto">
                <div>
                  <label htmlFor="title" className="text-sm font-medium">Title</label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Cancellation Policy"
                  />
                </div>
                <div>
                  <label htmlFor="content" className="text-sm font-medium">Content</label>
                  <Textarea
                    id="content"
                    rows={10}
                    className="[field-sizing:fixed] overflow-y-auto min-h-[200px]"
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    placeholder="e.g. Cancellations must be made 24 hours in advance..."
                  />
                </div>
                <div>
                  <label htmlFor="keywords" className="text-sm font-medium">Keywords</label>
                  <Input
                    id="keywords"
                    value={form.keywords}
                    onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                    placeholder="cancel, refund, reschedule (comma separated)"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="category" className="text-sm font-medium">Category</label>
                    <select
                      id="category"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-input-background text-sm"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <span className="text-sm font-medium">Active</span>
                      <Switch
                        checked={form.is_active}
                        onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                      />
                    </label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={!form.title || !form.content}>
                  {editing ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="w-5 h-5" />
            {entries.length} {entries.length === 1 ? "Entry" : "Entries"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground py-8 text-center">Loading...</p>
          ) : entries.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              No knowledge entries yet. Add information your AI assistant should know.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Keywords</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.title}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{entry.category}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {entry.keywords.slice(0, 4).map((kw) => (
                          <Badge key={kw} variant="outline" className="text-xs">{kw}</Badge>
                        ))}
                        {entry.keywords.length > 4 && (
                          <span className="text-xs text-muted-foreground">+{entry.keywords.length - 4}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={entry.is_active ? "default" : "secondary"}>
                        {entry.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {entry.file_url ? (
                        <FileText className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(entry)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleting(entry.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      </div>

      <Dialog open={!!deleting} onOpenChange={(open) => { if (!open) setDeleting(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Knowledge</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this entry? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleting && handleDelete(deleting)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
