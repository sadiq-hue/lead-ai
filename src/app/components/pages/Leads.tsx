import { Search, Filter, Plus } from "lucide-react";

const dealsByStage = {
  new: [
    { id: 1, name: "Sarah Chen", company: "TechCorp", value: 2400, source: "WhatsApp", avatar: "SC" },
    { id: 2, name: "Emma Williams", company: "Enterprise Co", value: 3200, source: "WhatsApp", avatar: "EW" },
    { id: 3, name: "Ryan Thompson", company: "InnovateTech", value: 1800, source: "Email", avatar: "RT" },
  ],
  qualified: [
    { id: 4, name: "David Park", company: "Growth Inc", value: 1800, source: "Email", avatar: "DP" },
    { id: 5, name: "Lisa Anderson", company: "MegaCorp", value: 5200, source: "WhatsApp", avatar: "LA" },
  ],
  negotiation: [
    { id: 6, name: "Michael Rodriguez", company: "StartupXYZ", value: 2800, source: "Email", avatar: "MR" },
    { id: 7, name: "James Wilson", company: "Ventures Inc", value: 4100, source: "Email", avatar: "JW" },
  ],
  won: [
    { id: 8, name: "Anna Kim", company: "Tech Solutions", value: 3600, source: "WhatsApp", avatar: "AK" },
  ],
  lost: [
    { id: 9, name: "Jessica Martinez", company: "Scale Co", value: 1200, source: "WhatsApp", avatar: "JM" },
  ],
};

export function Leads() {
  const stages = [
    { id: "new", title: "New", deals: dealsByStage.new, color: "bg-gray-100" },
    { id: "qualified", title: "Qualified", deals: dealsByStage.qualified, color: "bg-blue-100" },
    { id: "negotiation", title: "Negotiation", deals: dealsByStage.negotiation, color: "bg-purple-100" },
    { id: "won", title: "Won", deals: dealsByStage.won, color: "bg-green-100" },
    { id: "lost", title: "Lost", deals: dealsByStage.lost, color: "bg-red-100" },
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Deals Pipeline</h1>
          <p className="text-muted-foreground">Track leads through your sales process</p>
        </div>
        <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Deal
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search deals by name or company..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-input-background border border-border"
          />
        </div>
        <button className="px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filter
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <div key={stage.id} className="flex-shrink-0 w-80">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3>{stage.title}</h3>
                <span className="px-2 py-1 rounded-full bg-muted text-sm">{stage.deals.length}</span>
              </div>
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div className={`h-full ${stage.color}`} style={{ width: "60%" }} />
              </div>
            </div>
            <div className="space-y-3">
              {stage.deals.map((deal) => (
                <div
                  key={deal.id}
                  className="p-4 border border-border rounded-xl bg-card hover:shadow-md transition-all cursor-move"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm flex-shrink-0">
                      {deal.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{deal.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{deal.company}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-green-600">${deal.value.toLocaleString()}</span>
                    <span className="text-xs px-2 py-1 rounded-full bg-muted">{deal.source}</span>
                  </div>
                </div>
              ))}
              <button className="w-full p-3 border border-dashed border-border rounded-xl text-muted-foreground hover:bg-accent/50 transition-colors flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" />
                Add deal
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-6">
        <div className="p-6 border border-border rounded-xl bg-card">
          <p className="text-muted-foreground mb-2">Total Pipeline Value</p>
          <p className="text-2xl font-semibold">$25,200</p>
        </div>
        <div className="p-6 border border-border rounded-xl bg-card">
          <p className="text-muted-foreground mb-2">Average Deal Size</p>
          <p className="text-2xl font-semibold">$2,800</p>
        </div>
        <div className="p-6 border border-border rounded-xl bg-card">
          <p className="text-muted-foreground mb-2">Win Rate</p>
          <p className="text-2xl font-semibold">88%</p>
        </div>
        <div className="p-6 border border-border rounded-xl bg-card">
          <p className="text-muted-foreground mb-2">Active Deals</p>
          <p className="text-2xl font-semibold">9</p>
        </div>
      </div>
    </div>
  );
}
