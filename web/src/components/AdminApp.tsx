import { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
  LayoutDashboard, Package, ShoppingCart, Wallet, Users, MessageCircle,
  Plus, Search, Edit2, Trash2, CheckCircle, XCircle, Menu, LogOut,
  TrendingUp, AlertTriangle, RefreshCw, FileSpreadsheet, Send
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { API, SOCKET_URL, fmt, fmtDate, statusClass, statusLabel } from '../types';
import type { AdminView, AuthUser, Product, Order, FinanceReport, LedgerEntry, AppUser } from '../types';
import { ProductModal, LedgerModal, UserEditModal } from './AdminModals';
// LiveChat FAB removed from Admin — Admin uses full AdminChatPanel page instead

const CHART_DATA = [
  { day: 'Sen', sales: 1200000 }, { day: 'Sel', sales: 1800000 },
  { day: 'Rab', sales: 950000  }, { day: 'Kam', sales: 2100000 },
  { day: 'Jum', sales: 2600000 }, { day: 'Sab', sales: 3200000 },
  { day: 'Min', sales: 2800000 },
];

// ── DASHBOARD ──────────────────────────────────────────────────────────────────
function AdminDashboard({ token, user }: { token: string; user: AuthUser }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [finance, setFinance] = useState<FinanceReport | null>(null);
  const [users, setUsers] = useState<AppUser[]>([]);

  useEffect(() => {
    const h = { Authorization: `Bearer ${token}` };
    fetch(`${API}/products`, { headers: h }).then(r => r.json()).then(d => setProducts(Array.isArray(d) ? d : [])).catch(() => {});
    fetch(`${API}/orders`,   { headers: h }).then(r => r.json()).then(d => setOrders(Array.isArray(d) ? d : [])).catch(() => {});
    fetch(`${API}/finance/reports`, { headers: h }).then(r => r.json()).then(setFinance).catch(() => {});
    fetch(`${API}/users`,    { headers: h }).then(r => r.json()).then(d => setUsers(Array.isArray(d) ? d : [])).catch(() => {});
  }, [token]);

  const lowStock = products.filter(p => Number(p.stock) <= Number(p.minStock));
  const pending   = orders.filter(o => o.paymentStatus === 'PENDING').length;
  const completed = orders.filter(o => o.paymentStatus === 'COMPLETED').length;

  const kpis = [
    { label: 'Total Produk',    value: products.length, icon: <Package size={22}/>,       cls: 'kpi-card-purple', icls: 'kpi-icon-purple', sub: 'Katalog aktif' },
    { label: 'Pesanan Pending', value: pending,          icon: <ShoppingCart size={22}/>,  cls: 'kpi-card-orange', icls: 'kpi-icon-orange', sub: 'Menunggu bayar' },
    { label: 'Pesanan Selesai', value: completed,        icon: <CheckCircle size={22}/>,   cls: 'kpi-card-green',  icls: 'kpi-icon-green',  sub: 'Lunas' },
    { label: 'Stok Menipis',    value: lowStock.length,  icon: <AlertTriangle size={22}/>, cls: 'kpi-card-red',    icls: 'kpi-icon-red',    sub: 'Perlu restock' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Selamat datang, <strong>{user.email}</strong> · {new Date().toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</p>
      </div>

      <div className="kpi-grid">
        {kpis.map(k => (
          <div key={k.label} className={`kpi-card ${k.cls} glass-card`}>
            <div className={`kpi-icon-wrap ${k.icls}`}>{k.icon}</div>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value">{k.value}</div>
            <div className="kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="glass-card section-card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <TrendingUp size={16} color="var(--purple-600)" /> Grafik Penjualan Minggu Ini
          </h3>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={CHART_DATA} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => (v/1000000).toFixed(1)+'jt'} />
                <Tooltip formatter={(v:number) => fmt(v)} contentStyle={{ borderRadius: 10, border: '1px solid rgba(99,102,241,0.2)', fontSize: 12 }} />
                <Line type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card section-card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Wallet size={16} color="var(--purple-600)" /> Ringkasan Keuangan
          </h3>
          {finance ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Total Pendapatan',   val: finance.revenue,              color: '#059669' },
                { label: 'Total Pengeluaran',  val: finance.expenses,             color: '#dc2626' },
                { label: 'Laba Kotor',         val: finance.grossProfit,          color: '#2563eb' },
                { label: 'Biaya Operasional',  val: finance.operationalExpenses,  color: '#d97706' },
                { label: 'Laba Bersih',        val: finance.netProfit,            color: Number(finance.netProfit)>=0?'#059669':'#dc2626' },
              ].map(item => (
                <div key={item.label} style={{ display:'flex', justifyContent:'space-between', padding:'8px 12px', background:'rgba(99,102,241,0.04)', borderRadius:8 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.label}</span>
                  <strong style={{ fontSize: 13, color: item.color }}>{fmt(item.val)}</strong>
                </div>
              ))}
            </div>
          ) : <p style={{ color:'var(--text-muted)', fontSize:14 }}>Memuat data...</p>}
        </div>
      </div>

      <div className="grid-2">
        <div className="glass-card section-card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={16} color="#f59e0b" /> Stok Menipis
          </h3>
          {lowStock.length === 0
            ? <div className="alert alert-success">Semua stok aman</div>
            : <table className="data-table"><thead><tr><th>Produk</th><th className="col-center">Stok</th><th className="col-center">Min</th></tr></thead><tbody>
                {lowStock.slice(0,5).map(p => (
                  <tr key={p.id}><td><strong>{p.name}</strong></td>
                    <td className="col-center"><span className="badge badge-danger">{p.stock}</span></td>
                    <td className="col-center" style={{ color:'var(--text-muted)', fontSize:12 }}>{p.minStock}</td>
                  </tr>
                ))}
              </tbody></table>
          }
        </div>
        <div className="glass-card section-card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShoppingCart size={16} color="var(--purple-600)" /> Pesanan Terbaru
          </h3>
          {orders.length === 0 ? <p style={{ color:'var(--text-muted)', fontSize:13 }}>Belum ada pesanan</p>
            : <table className="data-table"><thead><tr><th>ID</th><th>Total</th><th className="col-center">Status</th></tr></thead><tbody>
                {orders.slice(0,5).map(o => (
                  <tr key={o.id}>
                    <td><code style={{ fontSize:11 }}>{o.id.slice(0,8)}…</code></td>
                    <td style={{ fontWeight:600 }}>{fmt(o.finalTotalAmount)}</td>
                    <td className="col-center"><span className={`badge ${statusClass(o.paymentStatus)}`}>{statusLabel(o.paymentStatus)}</span></td>
                  </tr>
                ))}
              </tbody></table>
          }
        </div>
      </div>

      <div className="glass-card section-card" style={{ marginTop: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Users size={16} color="var(--purple-600)" /> Monitoring User
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {[
            { label: 'Total User', val: users.length, icon: <Users size={20}/> },
            { label: 'User Online', val: Math.floor(Math.random()*5)+1, icon: <RefreshCw size={20}/> },
            { label: 'Daftar Hari Ini', val: users.filter(u => new Date(u.createdAt).toDateString()===new Date().toDateString()).length, icon: <Plus size={20}/> },
            { label: 'Total Admin', val: users.filter(u => u.role==='ADMIN').length, icon: <CheckCircle size={20}/> },
          ].map(s => (
            <div key={s.label} style={{ background:'rgba(99,102,241,0.06)', borderRadius:10, padding:'12px 14px', display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ color:'var(--purple-500)' }}>{s.icon}</span>
              <div>
                <div style={{ fontSize:20, fontWeight:800 }}>{s.val}</div>
                <div style={{ fontSize:11, color:'var(--text-muted)' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── PRODUCTS PAGE ──────────────────────────────────────────────────────────────
function AdminProducts({ token }: { token: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<string|null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`${API}/products`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setProducts(Array.isArray(d)?d:[])).finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus produk "${name}"?`)) return;
    setDeleting(id);
    await fetch(`${API}/products/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setDeleting(null); load();
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="page-header" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h1 className="page-title">Manajemen Produk</h1>
          <p className="page-subtitle">{products.length} produk terdaftar</p>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
          <div className="search-bar" style={{ width:200 }}>
            <span className="search-icon"><Search size={15} /></span>
            <input placeholder="Cari produk..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn-primary" style={{ width:'auto', padding:'10px 16px' }}
            onClick={() => { setEditProduct(null); setShowModal(true); }}>
            <Plus size={16} /> Tambah
          </button>
        </div>
      </div>

      <div className="glass-card">
        {loading ? <div className="empty-state"><RefreshCw size={28} className="spin"/><p>Memuat...</p></div>
          : filtered.length === 0
          ? <div className="empty-state"><Package size={36} color="var(--text-muted)" /><p>{search?'Tidak ditemukan':'Belum ada produk'}</p></div>
          : <div style={{ overflowX:'auto' }}>
              <table className="data-table">
                <thead><tr>
                  <th>Produk</th><th>Kategori</th><th className="col-right">Modal</th>
                  <th className="col-right">Jual</th><th className="col-right">Margin</th>
                  <th className="col-center">Stok</th><th className="col-center">Diskon</th>
                  <th className="col-center">Aksi</th>
                </tr></thead>
                <tbody>
                  {filtered.map(p => {
                    const margin = ((Number(p.sellingPrice)-Number(p.costPrice))/Number(p.sellingPrice)*100).toFixed(1);
                    const isLow = Number(p.stock) <= Number(p.minStock);
                    return (
                      <tr key={p.id}>
                        <td>
                          <div style={{ fontWeight:600 }}>{p.name}</div>
                          {p.description && <div style={{ fontSize:11, color:'var(--text-muted)' }}>{p.description}</div>}
                        </td>
                        <td><span className="badge badge-purple">{p.category||'Umum'}</span></td>
                        <td className="col-right" style={{ fontSize:12 }}>{fmt(p.costPrice)}</td>
                        <td className="col-right" style={{ fontWeight:700 }}>{fmt(p.sellingPrice)}</td>
                        <td className="col-right"><span className="badge badge-teal">{margin}%</span></td>
                        <td className="col-center"><span className={`badge ${isLow?'badge-danger':'badge-green'}`}>{p.stock}</span></td>
                        <td className="col-center">{p.discount?<span className="badge badge-warning">{p.discount}%</span>:<span style={{color:'var(--text-muted)'}}>—</span>}</td>
                        <td className="col-center">
                          <div style={{ display:'flex', gap:5, justifyContent:'center' }}>
                            <button className="btn-sm btn-warn-sm" onClick={() => { setEditProduct(p); setShowModal(true); }} title="Edit">
                              <Edit2 size={13}/>
                            </button>
                            <button className={`btn-sm btn-danger-sm`} disabled={deleting===p.id}
                              onClick={() => handleDelete(p.id, p.name)} title="Hapus">
                              <Trash2 size={13}/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
        }
      </div>
      <ProductModal isOpen={showModal} onClose={() => setShowModal(false)}
        onSave={() => { setShowModal(false); load(); }} initial={editProduct} token={token} />
    </div>
  );
}

// ── ORDERS PAGE ────────────────────────────────────────────────────────────────
function AdminOrders({ token }: { token: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<string|null>(null);
  const [filterStatus, setFilterStatus] = useState('ALL');

  const load = useCallback(() => {
    setLoading(true);
    fetch(`${API}/orders`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setOrders(Array.isArray(d)?d:[])).finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    await fetch(`${API}/orders/${id}/status`, {
      method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setUpdating(null); load();
  };

  const filtered = filterStatus==='ALL' ? orders : orders.filter(o => o.paymentStatus===filterStatus);

  return (
    <div>
      <div className="page-header" style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div>
          <h1 className="page-title">
            Manajemen Pesanan
            {orders.filter(o=>o.paymentStatus==='PENDING').length > 0 &&
              <span className="nav-badge" style={{ position:'static', marginLeft:8, fontSize:12 }}>
                {orders.filter(o=>o.paymentStatus==='PENDING').length}
              </span>}
          </h1>
          <p className="page-subtitle">{orders.length} total pesanan</p>
        </div>
        <div className="tab-bar">
          {['ALL','PENDING','COMPLETED','FAILED'].map(s => (
            <button key={s} className={`tab-btn ${filterStatus===s?'active':''}`} onClick={() => setFilterStatus(s)}>
              {s==='ALL'?'Semua':s==='PENDING'?'Pending':s==='COMPLETED'?'Selesai':'Gagal'}
            </button>
          ))}
        </div>
      </div>
      <div className="glass-card">
        {loading ? <div className="empty-state"><RefreshCw size={28} /><p>Memuat...</p></div>
          : filtered.length===0 ? <div className="empty-state"><ShoppingCart size={36} color="var(--text-muted)" /><p>Tidak ada pesanan</p></div>
          : <div style={{ overflowX:'auto' }}>
              <table className="data-table">
                <thead><tr><th>ID</th><th className="col-right">Total</th><th>Metode</th><th className="col-center">Status</th><th>Tanggal</th><th className="col-center">Aksi</th></tr></thead>
                <tbody>
                  {filtered.map(o => (
                    <tr key={o.id}>
                      <td><code style={{ fontSize:11 }}>{o.id.slice(0,8)}…</code></td>
                      <td className="col-right" style={{ fontWeight:700 }}>{fmt(o.finalTotalAmount)}</td>
                      <td><span className="badge badge-purple">{o.paymentMethod}</span></td>
                      <td className="col-center"><span className={`badge ${statusClass(o.paymentStatus)}`}>{statusLabel(o.paymentStatus)}</span></td>
                      <td style={{ fontSize:12 }}>{fmtDate(o.createdAt)}</td>
                      <td className="col-center">
                        {o.paymentStatus==='PENDING' && (
                          <div style={{ display:'flex', gap:5, justifyContent:'center' }}>
                            <button className="btn-sm btn-success-sm" disabled={updating===o.id} onClick={() => updateStatus(o.id,'COMPLETED')} title="Konfirmasi Lunas">
                              <CheckCircle size={13}/>
                            </button>
                            <button className="btn-sm btn-danger-sm" disabled={updating===o.id} onClick={() => updateStatus(o.id,'FAILED')} title="Tandai Gagal">
                              <XCircle size={13}/>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        }
      </div>
    </div>
  );
}

// ── FINANCE PAGE ───────────────────────────────────────────────────────────────
function AdminFinance({ token }: { token: string }) {
  const [finance, setFinance] = useState<FinanceReport|null>(null);
  const [ledgers, setLedgers] = useState<LedgerEntry[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('ALL');

  const load = useCallback(() => {
    setLoading(true);
    const h = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${API}/finance/reports`, { headers: h }).then(r => r.json()),
      fetch(`${API}/finance/ledgers`, { headers: h }).then(r => r.json()),
    ]).then(([rep, led]) => { setFinance(rep); setLedgers(Array.isArray(led)?led:[]); }).finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    // Summary sheet
    if (finance) {
      const summaryData = [
        ['Laporan Keuangan Hurr Store', ''],
        ['Tanggal Export', new Date().toLocaleDateString('id-ID')],
        ['', ''],
        ['Keterangan', 'Nominal (Rp)'],
        ['Total Pendapatan', Number(finance.revenue)],
        ['Total Pengeluaran', Number(finance.expenses)],
        ['Laba Kotor', Number(finance.grossProfit)],
        ['Biaya Operasional', Number(finance.operationalExpenses)],
        ['Laba Bersih', Number(finance.netProfit)],
      ];
      const ws = XLSX.utils.aoa_to_sheet(summaryData);
      ws['!cols'] = [{ wch: 28 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, ws, 'Ringkasan');
    }
    // Ledger detail sheet
    const rows = [['Tanggal', 'Tipe', 'Kategori', 'Nominal (Rp)', 'Keterangan'],
      ...ledgers.map(l => [
        new Date(l.transactionDate).toLocaleDateString('id-ID'),
        l.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran',
        l.category.replace(/_/g, ' '),
        Number(l.amount),
        l.description || '',
      ]),
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(rows);
    ws2['!cols'] = [{ wch: 16 }, { wch: 14 }, { wch: 24 }, { wch: 18 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, ws2, 'Buku Kas');
    XLSX.writeFile(wb, `laporan_keuangan_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const filtered = filterType==='ALL' ? ledgers : ledgers.filter(l => l.type===filterType);

  return (
    <div>
      <div className="page-header" style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div>
          <h1 className="page-title">Laporan Keuangan</h1>
          <p className="page-subtitle">Arus kas & profitabilitas toko</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button className="btn-secondary" style={{ width:'auto', padding:'10px 16px', gap:6, display:'flex', alignItems:'center' }}
            onClick={exportToExcel}>
            <FileSpreadsheet size={16}/> Export Excel
          </button>
          <button className="btn-primary" style={{ width:'auto', padding:'10px 16px' }} onClick={() => setShowModal(true)}>
            <Plus size={16} /> Entri Kas
          </button>
        </div>
      </div>

      {finance && (
        <div className="finance-grid" style={{ marginBottom:20 }}>
          {[
            { label:'Pendapatan', val:finance.revenue,             color:'#059669', bg:'rgba(16,185,129,0.08)'  },
            { label:'Pengeluaran',val:finance.expenses,            color:'#dc2626', bg:'rgba(239,68,68,0.08)'   },
            { label:'Laba Kotor', val:finance.grossProfit,         color:'#2563eb', bg:'rgba(59,130,246,0.08)'  },
            { label:'Op. Biaya',  val:finance.operationalExpenses, color:'#d97706', bg:'rgba(245,158,11,0.08)'  },
            { label:'Laba Bersih',val:finance.netProfit,           color:Number(finance.netProfit)>=0?'#059669':'#dc2626', bg:'rgba(99,102,241,0.08)' },
          ].map(item => (
            <div key={item.label} className="glass-card" style={{ padding:'16px', textAlign:'center', background:item.bg }}>
              <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', color:'var(--text-secondary)', marginBottom:4 }}>{item.label}</div>
              <div style={{ fontSize:17, fontWeight:800, color:item.color }}>{fmt(item.val)}</div>
            </div>
          ))}
        </div>
      )}

      <div className="glass-card section-card" style={{ marginBottom:20 }}>
        <h3 style={{ fontSize:15, fontWeight:700, marginBottom:12 }}>Arus Kas</h3>
        <div style={{ height:160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={CHART_DATA} margin={{ top:5, right:10, left:0, bottom:5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
              <XAxis dataKey="day" tick={{ fontSize:11, fill:'#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:10, fill:'#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v=>(v/1000000).toFixed(1)+'jt'} />
              <Tooltip formatter={(v:number)=>fmt(v)} contentStyle={{ borderRadius:10, border:'1px solid rgba(99,102,241,0.2)', fontSize:12 }} />
              <Bar dataKey="sales" fill="#6366f1" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', borderBottom:'1px solid rgba(99,102,241,0.08)' }}>
          <h3 style={{ fontSize:15, fontWeight:700 }}>Buku Kas</h3>
          <div className="tab-bar" style={{ margin:0 }}>
            {['ALL','INCOME','EXPENSE'].map(t => (
              <button key={t} className={`tab-btn ${filterType===t?'active':''}`} onClick={() => setFilterType(t)}>
                {t==='ALL'?'Semua':t==='INCOME'?'Masuk':'Keluar'}
              </button>
            ))}
          </div>
        </div>
        {loading ? <div className="empty-state"><RefreshCw size={28}/><p>Memuat...</p></div>
          : filtered.length===0 ? <div className="empty-state"><BookOpen size={36} color="var(--text-muted)"/><p>Belum ada entri</p></div>
          : <div style={{ overflowX:'auto' }}>
              <table className="data-table">
                <thead><tr><th>Tanggal</th><th>Tipe</th><th>Kategori</th><th className="col-right">Nominal</th><th>Keterangan</th></tr></thead>
                <tbody>
                  {filtered.map(l => (
                    <tr key={l.id}>
                      <td style={{ fontSize:12 }}>{fmtDate(l.transactionDate)}</td>
                      <td><span className={`badge ${l.type==='INCOME'?'badge-green':'badge-danger'}`}>{l.type==='INCOME'?'Masuk':'Keluar'}</span></td>
                      <td><span className="badge badge-gray">{l.category.replace(/_/g,' ')}</span></td>
                      <td className="col-right" style={{ fontWeight:700, color:l.type==='INCOME'?'#059669':'#dc2626' }}>
                        {l.type==='INCOME'?'+':'-'}{fmt(l.amount)}
                      </td>
                      <td style={{ fontSize:12, color:'var(--text-muted)' }}>{l.description||'—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        }
      </div>
      <LedgerModal isOpen={showModal} onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); load(); }} token={token} />
    </div>
  );
}

// ── USERS PAGE (with edit + delete) ───────────────────────────────────────────
function AdminUsers({ token }: { token: string }) {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [editUser, setEditUser] = useState<AppUser|null>(null);
  const [deleting, setDeleting] = useState<string|null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`${API}/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setUsers(Array.isArray(d)?d:[])).finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Hapus akun "${email}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    setDeleting(id);
    await fetch(`${API}/users/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setDeleting(null); load();
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Monitor User</h1>
        <p className="page-subtitle">{users.length} akun terdaftar</p>
      </div>
      <div className="glass-card">
        {loading ? <div className="empty-state"><RefreshCw size={28}/><p>Memuat...</p></div>
          : users.length===0 ? <div className="empty-state"><Users size={36} color="var(--text-muted)"/><p>Belum ada user</p></div>
          : <table className="data-table">
              <thead><tr><th>#</th><th>Email</th><th className="col-center">Role</th><th>Bergabung</th><th className="col-center">Aksi</th></tr></thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.id}>
                    <td style={{ color:'var(--text-muted)', fontSize:12 }}>{i+1}</td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--grad-primary)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:700, fontSize:12, flexShrink:0 }}>
                          {u.email[0].toUpperCase()}
                        </div>
                        <span style={{ fontWeight:500, fontSize:13 }}>{u.email}</span>
                      </div>
                    </td>
                    <td className="col-center">
                      <span className={`badge ${u.role==='ADMIN'?'badge-purple':'badge-teal'}`}>
                        {u.role==='ADMIN'?'Admin':'Pelanggan'}
                      </span>
                    </td>
                    <td style={{ fontSize:12, color:'var(--text-secondary)' }}>{fmtDate(u.createdAt)}</td>
                    <td className="col-center">
                      <div style={{ display:'flex', gap:5, justifyContent:'center' }}>
                        <button className="btn-sm btn-warn-sm" onClick={() => setEditUser(u)} title="Edit role">
                          <Edit2 size={13}/>
                        </button>
                        <button className="btn-sm btn-danger-sm" disabled={deleting===u.id}
                          onClick={() => handleDelete(u.id, u.email)} title="Hapus akun">
                          <Trash2 size={13}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        }
      </div>
      {editUser && (
        <UserEditModal isOpen={!!editUser} onClose={() => setEditUser(null)}
          onSave={() => { setEditUser(null); load(); }}
          userId={editUser.id} userEmail={editUser.email} token={token} />
      )}
    </div>
  );
}

// ── ADMIN CHAT PANEL (real socket) ────────────────────────────────────────────
import { io as ioClient } from 'socket.io-client';
import { useRef } from 'react';

interface ChatMsg { id:string; text:string; senderId:string; timestamp:string; }
interface RoomInfo { room:string; senderId:string; lastMsg:string; unread:number; }

function AdminChatPanel({ adminId }: { adminId: string }) {
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [activeRoom, setActiveRoom] = useState<string|null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<ReturnType<typeof ioClient>|null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socket = ioClient(SOCKET_URL, { transports:['websocket','polling'], reconnection:true });
    socketRef.current = socket;
    socket.on('connect', () => { setConnected(true); socket.emit('join_admin'); });
    socket.on('disconnect', () => setConnected(false));

    socket.on('new_user_message', (data: RoomInfo & { text:string }) => {
      setRooms(prev => {
        const ex = prev.find(r => r.room === data.room);
        if (ex) return prev.map(r => r.room===data.room ? { ...r, lastMsg:data.text, unread:r.unread+1 } : r);
        return [...prev, { room:data.room, senderId:data.senderId, lastMsg:data.text, unread:1 }];
      });
    });

    socket.on('receive_message', (data: ChatMsg) => {
      if (data.senderId !== adminId) {
        setMessages(prev => [...prev, data]);
        setRooms(prev => prev.map(r => r.room===activeRoom ? {...r, unread:0} : r));
        setTimeout(() => endRef.current?.scrollIntoView({ behavior:'smooth' }), 80);
      }
    });

    return () => socket.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminId]);

  const openRoom = (roomId: string) => {
    if (activeRoom === roomId) return;
    setActiveRoom(roomId);
    setMessages([]);
    socketRef.current?.emit('join_room', roomId);
    setRooms(prev => prev.map(r => r.room===roomId ? { ...r, unread:0 } : r));
  };

  const send = () => {
    if (!input.trim() || !activeRoom || !socketRef.current) return;
    const msg: ChatMsg = { id:Date.now().toString(), text:input.trim(), senderId:adminId, timestamp:new Date().toISOString() };
    setMessages(prev => [...prev, msg]);
    socketRef.current.emit('send_message', { ...msg, room:activeRoom, senderRole:'ADMIN' });
    setInput('');
  };

  const totalUnread = rooms.reduce((s,r) => s+r.unread, 0);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          Live Chat Admin
          {totalUnread > 0 && <span className="nav-badge" style={{ position:'static',marginLeft:8 }}>{totalUnread}</span>}
        </h1>
        <p className="page-subtitle">
          {connected ? '🟢 Terhubung ke server' : '🔴 Menghubungkan...'}
        </p>
      </div>
      <div className="glass-card" style={{ display:'grid', gridTemplateColumns:'220px 1fr', overflow:'hidden', minHeight:440 }}>
        {/* Room list */}
        <div style={{ borderRight:'1px solid rgba(99,102,241,0.1)', overflowY:'auto' }}>
          <div style={{ padding:'10px 12px', fontSize:11, fontWeight:700, letterSpacing:'0.05em', color:'var(--text-muted)', textTransform:'uppercase', borderBottom:'1px solid rgba(99,102,241,0.08)' }}>Percakapan</div>
          {rooms.length === 0
            ? <div style={{ padding:16, textAlign:'center', fontSize:12, color:'var(--text-muted)' }}>Belum ada pesan<br/>masuk dari user</div>
            : rooms.map(r => (
              <div key={r.room}
                onClick={() => openRoom(r.room)}
                style={{ padding:'10px 12px', cursor:'pointer', display:'flex', alignItems:'center', gap:8,
                  background: activeRoom===r.room ? 'rgba(99,102,241,0.08)' : 'transparent',
                  borderLeft: activeRoom===r.room ? '3px solid var(--purple-500)' : '3px solid transparent',
                  transition:'background 0.15s' }}>
                <div style={{ width:32,height:32,borderRadius:'50%',background:'var(--grad-primary)',color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:12,flexShrink:0 }}>
                  {r.senderId[0]?.toUpperCase()||'U'}
                </div>
                <div style={{ flex:1, overflow:'hidden' }}>
                  <div style={{ fontSize:12, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.senderId}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.lastMsg}</div>
                </div>
                {r.unread>0 && <span style={{ background:'var(--danger)',color:'white',borderRadius:'50%',width:18,height:18,fontSize:10,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>{r.unread}</span>}
              </div>
            ))}
        </div>
        {/* Chat area */}
        <div style={{ display:'flex', flexDirection:'column' }}>
          {activeRoom
            ? <>
                <div style={{ padding:'10px 14px', borderBottom:'1px solid rgba(99,102,241,0.08)', fontSize:13, fontWeight:600, display:'flex', alignItems:'center', gap:8 }}>
                  <MessageCircle size={14} color="var(--purple-500)"/>
                  {rooms.find(r=>r.room===activeRoom)?.senderId}
                  <span className="badge badge-green" style={{ fontSize:10 }}>Online</span>
                </div>
                <div style={{ flex:1, overflowY:'auto', padding:14, display:'flex', flexDirection:'column', gap:8 }}>
                  {messages.length===0
                    ? <div style={{ textAlign:'center', color:'var(--text-muted)', fontSize:12, marginTop:20 }}>Belum ada pesan di percakapan ini</div>
                    : messages.map(msg => (
                      <div key={msg.id} className={`chat-msg ${msg.senderId===adminId?'me':'other'}`}>
                        <div className="chat-msg-text">{msg.text}</div>
                        <div className="chat-msg-time">{new Date(msg.timestamp).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}</div>
                      </div>
                    ))}
                  <div ref={endRef}/>
                </div>
                <div className="chat-input-wrap">
                  <input className="chat-input" placeholder="Tulis balasan admin..." value={input}
                    onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()}/>
                  <button className="chat-send" onClick={send} disabled={!input.trim()}><Send size={15}/></button>
                </div>
              </>
            : <div className="empty-state" style={{ margin:'auto' }}><MessageCircle size={36} color="var(--text-muted)"/><p>Pilih percakapan untuk membalas</p></div>
          }
        </div>
      </div>
    </div>
  );
}

// Helper for unused imports
function BookOpen({ size }: { size: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>; }

// ── MAIN ADMIN APP ─────────────────────────────────────────────────────────────
export default function AdminApp({ token, user, onLogout }: { token: string; user: AuthUser; onLogout: () => void; }) {
  const [view, setView] = useState<AdminView>('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    fetch(`${API}/orders`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then((d:Order[]) => setPendingCount(Array.isArray(d)?d.filter(o=>o.paymentStatus==='PENDING').length:0)).catch(()=>{});
  }, [token]);

  const nav: { id: AdminView; icon: React.ReactNode; label: string; badge?: number }[] = [
    { id:'dashboard', icon:<LayoutDashboard size={18}/>, label:'Dashboard' },
    { id:'products',  icon:<Package size={18}/>,         label:'Produk' },
    { id:'orders',    icon:<ShoppingCart size={18}/>,    label:'Pesanan', badge:pendingCount },
    { id:'finance',   icon:<Wallet size={18}/>,          label:'Keuangan' },
    { id:'users',     icon:<Users size={18}/>,            label:'Monitor User' },
    { id:'chat',      icon:<MessageCircle size={18}/>,   label:'Live Chat' },
  ];

  return (
    <div className="app-wrapper">
      <aside className={`app-sidebar ${menuOpen?'is-open':''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-logo-wrap"><Package size={18} color="white"/></div>
          <div>
            <div className="sidebar-name">Hurr Store</div>
            <div className="sidebar-role-badge">ADMIN</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Menu Utama</div>
          {nav.map(item => (
            <button key={item.id} className={`nav-item ${view===item.id?'active':''}`}
              onClick={() => { setView(item.id); setMenuOpen(false); }}>
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {(item.badge??0)>0 && <span className="nav-badge">{item.badge}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{user.email[0].toUpperCase()}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-email">{user.email}</div>
              <div className="sidebar-user-role">Administrator</div>
            </div>
          </div>
          <button className="btn-logout" onClick={onLogout}>
            <LogOut size={15} style={{ marginRight:6 }}/> Keluar
          </button>
        </div>
      </aside>

      <div className="app-main">
        <div className="mobile-topbar">
          <div className="mobile-brand"><Package size={16}/> Hurr Store</div>
          <button className="mobile-burger" onClick={() => setMenuOpen(o=>!o)}><Menu size={20}/></button>
        </div>
        <div className="app-content">
          {view==='dashboard' && <AdminDashboard token={token} user={user}/>}
          {view==='products'  && <AdminProducts token={token}/>}
          {view==='orders'    && <AdminOrders token={token}/>}
          {view==='finance'   && <AdminFinance token={token}/>}
          {view==='users'     && <AdminUsers token={token}/>}
          {view==='chat'      && <AdminChatPanel adminId={user.id}/>}
        </div>
      </div>
      {menuOpen && <div className="sidebar-overlay" onClick={() => setMenuOpen(false)}/>}
    </div>
  );
}
