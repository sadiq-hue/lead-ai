import { useState, useEffect, useCallback, useRef } from "react";
import {
  BarChart3, Plus, Upload, FileText, Loader2, CheckCircle2,
  XCircle, Clock, Trash2, TrendingUp, DollarSign, Eye
} from "lucide-react";
import { api, type NseStock, type FinancialStatement, type StockFundamental } from "../../../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger
} from "../ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "../ui/table";

const SECTORS = [
  "Banking", "Telecommunications", "Insurance", "Manufacturing",
  "Energy", "Technology", "Real Estate", "Agriculture", "Other"
];

const PERIODS = ["FY", "H1", "H2", "Q1", "Q2", "Q3", "Q4"];

function formatMoney(val: number | null): string {
  if (val === null || val === undefined) return "—";
  if (Math.abs(val) >= 1e9) return `KES ${(val / 1e9).toFixed(2)}B`;
  if (Math.abs(val) >= 1e6) return `KES ${(val / 1e6).toFixed(2)}M`;
  if (Math.abs(val) >= 1e3) return `KES ${(val / 1e3).toFixed(1)}K`;
  return `KES ${val.toFixed(2)}`;
}

function formatNum(val: number | null): string {
  if (val === null || val === undefined) return "—";
  return val.toLocaleString("en-KE", { maximumFractionDigits: 2 });
}

const statusConfig = {
  uploaded: { icon: Clock, color: "text-blue-500", bg: "bg-blue-500/10" },
  processing: { icon: Loader2, color: "text-amber-500", bg: "bg-amber-500/10" },
  completed: { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
  failed: { icon: XCircle, color: "text-red-500", bg: "bg-red-500/10" },
};

export function StockStatements() {
  const [stocks, setStocks] = useState<NseStock[]>([]);
  const [selectedStock, setSelectedStock] = useState<NseStock | null>(null);
  const [stockDetail, setStockDetail] = useState<(NseStock & { fundamentals: StockFundamental[]; statements: FinancialStatement[] }) | null>(null);
  const [statements, setStatements] = useState<FinancialStatement[]>([]);
  const [fundamentals, setFundamentals] = useState<StockFundamental[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [detailView, setDetailView] = useState<StockFundamental | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const [newStock, setNewStock] = useState({ ticker: "", company_name: "", sector: "Banking" });
  const [uploadMeta, setUploadMeta] = useState({ fiscal_year: new Date().getFullYear(), period_type: "annual", period: "FY" });

  const loadStocks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.stocks.list();
      setStocks(res.stocks);
    } catch (err) {
      console.error("Failed to load stocks:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStocks(); }, [loadStocks]);

  const loadStockDetail = useCallback(async (stockId: string) => {
    try {
      const detail = await api.stocks.get(stockId);
      setStockDetail(detail);
      setStatements(detail.statements || []);
      setFundamentals(detail.fundamentals || []);
    } catch (err) {
      console.error("Failed to load stock detail:", err);
    }
  }, []);

  useEffect(() => {
    if (selectedStock) loadStockDetail(selectedStock.id);
  }, [selectedStock, loadStockDetail]);

  async function handleAddStock() {
    try {
      await api.stocks.create(newStock);
      setAddDialogOpen(false);
      setNewStock({ ticker: "", company_name: "", sector: "Banking" });
      loadStocks();
    } catch (err) {
      console.error("Failed to add stock:", err);
    }
  }

  async function handleUpload(file: File) {
    if (!selectedStock) return;
    setUploading(true);
    try {
      await api.stocks.upload(
        selectedStock.id,
        file,
        uploadMeta.fiscal_year,
        uploadMeta.period_type,
        uploadMeta.period
      );
      loadStockDetail(selectedStock.id);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith(".pdf")) handleUpload(file);
  }

  async function handleDeleteStock(id: string) {
    if (!confirm("Delete this stock and all its data?")) return;
    try {
      await api.stocks.delete(id);
      if (selectedStock?.id === id) {
        setSelectedStock(null);
        setStockDetail(null);
        setStatements([]);
        setFundamentals([]);
      }
      loadStocks();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }

  return (
    <div className="h-full p-8 flex flex-col overflow-hidden gap-6">
      {/* Header */}
      <div className="flex items-start justify-between shrink-0 gap-4">
        <div>
          <h1 className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            NSE Stock Data
          </h1>
          <p className="text-muted-foreground">Upload financial statements and extract fundamentals for AI signals</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Stock
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add NSE Stock</DialogTitle>
                <DialogDescription>Register a new stock ticker for financial data ingestion.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Ticker Symbol</label>
                  <Input
                    value={newStock.ticker}
                    onChange={(e) => setNewStock({ ...newStock, ticker: e.target.value.toUpperCase() })}
                    placeholder="e.g. SCOM"
                    maxLength={10}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Company Name</label>
                  <Input
                    value={newStock.company_name}
                    onChange={(e) => setNewStock({ ...newStock, company_name: e.target.value })}
                    placeholder="e.g. Safaricom PLC"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Sector</label>
                  <select
                    value={newStock.sector}
                    onChange={(e) => setNewStock({ ...newStock, sector: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-input-background text-sm"
                  >
                    {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddStock} disabled={!newStock.ticker || !newStock.company_name}>
                  Add Stock
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex gap-6 overflow-hidden">
        {/* Left: Stock List */}
        <div className="w-72 shrink-0 flex flex-col gap-4 overflow-hidden">
          <Input
            placeholder="Search stocks..."
            onChange={(e) => {
              const q = e.target.value.toLowerCase();
              // client-side filter handled via stocks list reload
              if (!q) { loadStocks(); return; }
              setStocks((prev) => prev.filter((s) => s.ticker.toLowerCase().includes(q) || s.company_name.toLowerCase().includes(q)));
            }}
          />
          <div className="flex-1 overflow-y-auto space-y-1">
            {loading ? (
              <p className="text-muted-foreground text-sm py-4 text-center">Loading stocks...</p>
            ) : stocks.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">No stocks registered yet.</p>
            ) : (
              stocks.map((stock) => (
                <button
                  key={stock.id}
                  onClick={() => setSelectedStock(stock)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center justify-between group ${
                    selectedStock?.id === stock.id
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted"
                  }`}
                >
                  <div>
                    <div className="font-medium text-sm">{stock.ticker}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[180px]">{stock.company_name}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="text-xs">{stock.statement_count || 0}</Badge>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteStock(stock.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: Detail Area */}
        <div className="flex-1 min-w-0 flex flex-col gap-4 overflow-y-auto">
          {!selectedStock ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Select a stock or add a new one to get started</p>
              </div>
            </div>
          ) : (
            <>
              {/* Stock Header */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-2xl font-bold">{selectedStock.ticker}</span>
                        <Badge variant="outline">{selectedStock.sector || "Unknown"}</Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{selectedStock.company_name}</p>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Upload Section */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Upload Financial Statement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-4">
                    <div className="flex-1">
                      <div className="flex gap-3 mb-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Fiscal Year</label>
                          <Input
                            type="number"
                            min={2015}
                            max={2030}
                            value={uploadMeta.fiscal_year}
                            onChange={(e) => setUploadMeta({ ...uploadMeta, fiscal_year: parseInt(e.target.value) || 2025 })}
                            className="w-28"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Period Type</label>
                          <select
                            value={uploadMeta.period_type}
                            onChange={(e) => setUploadMeta({ ...uploadMeta, period_type: e.target.value })}
                            className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-input-background text-sm"
                          >
                            <option value="annual">Annual</option>
                            <option value="half_yearly">Half-Yearly</option>
                            <option value="quarterly">Quarterly</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Period</label>
                          <select
                            value={uploadMeta.period}
                            onChange={(e) => setUploadMeta({ ...uploadMeta, period: e.target.value })}
                            className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-input-background text-sm"
                          >
                            {PERIODS.map((p) => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                      </div>
                      <div
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                          dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                        }`}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        {uploading ? (
                          <div className="flex items-center justify-center gap-2 text-muted-foreground">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Uploading & parsing...
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2 text-muted-foreground">
                            <Upload className="w-5 h-5" />
                            Drop PDF here or click to upload
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Statements Table */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Uploaded Statements ({statements.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {statements.length === 0 ? (
                    <p className="text-muted-foreground text-sm py-4 text-center">No statements uploaded yet.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>File</TableHead>
                          <TableHead>Year</TableHead>
                          <TableHead>Period</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Uploaded</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {statements.map((stmt) => {
                          const sc = statusConfig[stmt.status];
                          const Icon = sc.icon;
                          return (
                            <TableRow key={stmt.id}>
                              <TableCell className="font-medium max-w-[200px] truncate">{stmt.file_name}</TableCell>
                              <TableCell>{stmt.fiscal_year}</TableCell>
                              <TableCell><Badge variant="outline">{stmt.period || "FY"}</Badge></TableCell>
                              <TableCell className="capitalize">{stmt.period_type.replace("_", " ")}</TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${sc.bg} ${sc.color}`}>
                                  <Icon className={`w-3 h-3 ${stmt.status === "processing" ? "animate-spin" : ""}`} />
                                  {stmt.status}
                                </span>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {new Date(stmt.created_at).toLocaleDateString()}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* Fundamentals */}
              {fundamentals.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Extracted Fundamentals ({fundamentals.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Period</TableHead>
                          <TableHead className="text-right">Revenue</TableHead>
                          <TableHead className="text-right">Net Profit</TableHead>
                          <TableHead className="text-right">EPS</TableHead>
                          <TableHead className="text-right">DPS</TableHead>
                          <TableHead className="text-right">Book Value</TableHead>
                          <TableHead className="text-right">Total Assets</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fundamentals.map((fund) => (
                          <TableRow key={fund.id}>
                            <TableCell>
                              <Badge variant="outline">{fund.fiscal_year} {fund.period || "FY"}</Badge>
                            </TableCell>
                            <TableCell className="text-right">{formatMoney(fund.revenue)}</TableCell>
                            <TableCell className="text-right">{formatMoney(fund.net_profit)}</TableCell>
                            <TableCell className="text-right">{formatNum(fund.eps)}</TableCell>
                            <TableCell className="text-right">{formatNum(fund.dps)}</TableCell>
                            <TableCell className="text-right">{formatNum(fund.book_value)}</TableCell>
                            <TableCell className="text-right">{formatMoney(fund.total_assets)}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" onClick={() => setDetailView(fund)}>
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!detailView} onOpenChange={(open) => { if (!open) setDetailView(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Financial Detail — {detailView?.fiscal_year} {detailView?.period || "FY"}
            </DialogTitle>
          </DialogHeader>
          {detailView && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ["Revenue", formatMoney(detailView.revenue)],
                ["Net Profit", formatMoney(detailView.net_profit)],
                ["EPS", formatNum(detailView.eps)],
                ["Dividend/Share", formatNum(detailView.dps)],
                ["Book Value", formatNum(detailView.book_value)],
                ["Total Assets", formatMoney(detailView.total_assets)],
                ["Total Liabilities", formatMoney(detailView.total_liabilities)],
                ["P/E Ratio", formatNum(detailView.pe_ratio)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between p-2 rounded bg-muted/50">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
