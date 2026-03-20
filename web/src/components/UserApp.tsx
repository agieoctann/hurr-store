import { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag, Search, ShoppingCart, Package, User, LogOut,
  Menu, Plus, Minus, Trash2, MapPin, Save, CheckCircle
} from 'lucide-react';
import { API, fmt } from '../types';
import type { UserView, AuthUser, Product, CartItem } from '../types';
import LiveChat from './LiveChat';
import ProductDetailModal from './ProductDetailModal';

const CATEGORIES = ['Semua','Pakaian','Elektronik','Makanan','Minuman','Aksesoris','Umum','Lainnya'];
const CAT_ICON: Record<string,string> = {
  Pakaian:'👕', Elektronik:'📱', Makanan:'🍔', Minuman:'☕',
  Aksesoris:'💍', Umum:'📦', Lainnya:'🎁',
};

// ── CATALOG ────────────────────────────────────────────────────────────────────
function UserCatalog({ token, cart, onAddToCart }: {
  token: string; cart: CartItem[];
  onAddToCart: (p: Product, size?: string) => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Semua');
  const [maxPrice, setMaxPrice] = useState('');
  const [toast, setToast] = useState('');
  const [detailProduct, setDetailProduct] = useState<Product|null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/products`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setProducts(Array.isArray(d)?d:[])).finally(() => setLoading(false));
  }, [token]);

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = category==='Semua' || p.category===category;
    const matchPrice = !maxPrice || Number(p.sellingPrice)<=Number(maxPrice);
    return matchSearch && matchCat && matchPrice;
  });

  const handleAdd = (p: Product, size?: string) => {
    onAddToCart(p, size);
    setToast(`${p.name}${size ? ` (${size})` : ''} ditambahkan!`);
    setTimeout(() => setToast(''), 2200);
  };

  const inCart = (id: string) => cart.some(c => c.product.id===id);

  return (
    <div>
      {toast && (
        <div className="toast-container">
          <div className="toast toast-success">
            <ShoppingCart size={18} color="#059669"/>
            <div><div className="toast-title">Ditambahkan!</div><div className="toast-message">{toast}</div></div>
          </div>
        </div>
      )}

      <div className="page-header">
        <h1 className="page-title">Katalog Produk</h1>
        <p className="page-subtitle">Temukan produk terbaik untuk Anda</p>
      </div>

      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
        <div className="search-bar" style={{ flex:1, minWidth:180 }}>
          <span className="search-icon"><Search size={15}/></span>
          <input placeholder="Cari produk..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <input className="form-input" type="number" placeholder="Harga maks (Rp)" value={maxPrice}
          onChange={e => setMaxPrice(e.target.value)} style={{ width:160 }} />
      </div>

      <div className="tab-bar" style={{ marginBottom:16, flexWrap:'wrap' }}>
        {CATEGORIES.map(c => (
          <button key={c} className={`tab-btn ${category===c?'active':''}`} onClick={() => setCategory(c)}>{c}</button>
        ))}
      </div>

      {loading
        ? <div className="empty-state"><Package size={36} color="var(--text-muted)"/><p>Memuat produk...</p></div>
        : filtered.length===0
        ? <div className="empty-state"><ShoppingBag size={36} color="var(--text-muted)"/><p>Produk tidak ditemukan</p></div>
        : (
          <div className="product-grid">
            {filtered.map(p => {
              const discPrice = p.discount ? Math.round(Number(p.sellingPrice)*(1-Number(p.discount)/100)) : Number(p.sellingPrice);
              const icon = CAT_ICON[p.category||'Umum']||'📦';
              const added = inCart(p.id);
              return (
                <div key={p.id} className="product-card"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setDetailProduct(p)}>
                  <div className="product-img" style={{ position: 'relative' }}>
                    {p.imageUrl
                      ? <img src={p.imageUrl} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                      : icon}
                    <div className="product-img-hover">
                      <Package size={20} color="white"/>
                      <span style={{ fontSize:11, color:'white', fontWeight:600 }}>Lihat Detail</span>
                    </div>
                  </div>
                  <div className="product-info">
                    {p.discount ? <span className="badge badge-danger" style={{ marginBottom:6 }}>Diskon {p.discount}%</span> : null}
                    <div className="product-name">{p.name}</div>
                    <div className="product-desc">{p.description||`Kategori: ${p.category||'Umum'}`}</div>
                    <div>
                      <span className="product-price">{fmt(discPrice)}</span>
                      {p.discount ? <span style={{ fontSize:11, color:'var(--text-muted)', textDecoration:'line-through', marginLeft:6 }}>{fmt(p.sellingPrice)}</span> : null}
                    </div>
                    <div className="product-stock">Stok: {p.stock}</div>
                    <div className="product-actions" onClick={e => e.stopPropagation()}>
                      <button className="btn-primary" style={{ flex:1, padding:'8px 10px', fontSize:12, gap:6 }}
                        disabled={p.stock===0||added} onClick={() => added ? null : setDetailProduct(p)}>
                        {p.stock===0 ? <><Package size={13}/> Habis</> : added ? <><CheckCircle size={13}/> Di Keranjang</> : <><ShoppingCart size={13}/> Tambah</>}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      }
      {/* Product detail modal */}
      <ProductDetailModal product={detailProduct} onClose={() => setDetailProduct(null)}
        cart={cart} onAddToCart={handleAdd}/>
    </div>
  );
}

// ── CHECKOUT (with cart edit/delete) ──────────────────────────────────────────
function UserCheckout({ token, cart, onUpdateQty, onRemoveItem, onClearCart, onSuccess }: {
  token: string; cart: CartItem[];
  onUpdateQty: (productId: string, qty: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onSuccess: () => void;
}) {
  const [paymentMethod, setPaymentMethod] = useState('QRIS');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [phase, setPhase] = useState<'cart'|'payment'|'success'>('cart');

  const total = cart.reduce((s, c) => s+Number(c.product.sellingPrice)*c.qty, 0);

  const handleCheckout = async () => {
    if (cart.length===0) return;
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/orders`, {
        method:'POST',
        headers: { Authorization:`Bearer ${token}`, 'Content-Type':'application/json' },
        body: JSON.stringify({ paymentMethod, items: cart.map(c=>({ productId:c.product.id, qty:c.qty })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error||'Checkout gagal');
      setPhase('success');
    } catch (err: unknown) { setError(err instanceof Error?err.message:'Gagal'); }
    finally { setLoading(false); }
  };

  if (phase==='success') return (
    <div className="glass-card section-card" style={{ maxWidth:480, margin:'40px auto', textAlign:'center' }}>
      <CheckCircle size={64} color="#059669" style={{ margin:'0 auto 16px' }}/>
      <h2 style={{ fontSize:22, fontWeight:800, marginBottom:8 }}>Pesanan Berhasil!</h2>
      <p style={{ color:'var(--text-secondary)', marginBottom:24 }}>Pesanan sedang diproses. Admin akan konfirmasi pembayaran.</p>
      <div className="order-tracker">
        {['Dibuat','Pembayaran','Diproses','Dikirim','Selesai'].map((step, i) => (
          <div key={step} className="tracker-step">
            <div className={`tracker-dot ${i===0?'done':'pending'}`}>{i===0?<CheckCircle size={14}/>:i+1}</div>
            <div className="tracker-label">{step}</div>
            {i<4 && <div className={`tracker-line ${i===0?'done':'pending'}`}/>}
          </div>
        ))}
      </div>
      <div style={{ display:'flex', gap:10, marginTop:24 }}>
        <button className="btn-secondary" onClick={() => { onClearCart(); onSuccess(); }}>Lihat Pesanan</button>
        <button className="btn-primary" onClick={() => { onClearCart(); setPhase('cart'); }}>Belanja Lagi</button>
      </div>
    </div>
  );

  if (cart.length===0) return (
    <div className="empty-state" style={{ marginTop:60 }}>
      <ShoppingCart size={48} color="var(--text-muted)"/>
      <p>Keranjang Anda kosong.<br/>Pilih produk terlebih dahulu.</p>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Keranjang & Checkout</h1>
        <p className="page-subtitle">Periksa pesanan sebelum membayar</p>
      </div>

      <div className="grid-2">
        {/* Cart items with edit/delete */}
        <div className="glass-card section-card">
          <h3 style={{ fontWeight:700, fontSize:15, marginBottom:14, display:'flex', alignItems:'center', gap:6 }}>
            <ShoppingCart size={16} color="var(--purple-600)"/> Item Pesanan ({cart.length} produk)
          </h3>
          {cart.map(c => (
            <div key={c.product.id} className="cart-item">
              <div className="cart-item-icon">{CAT_ICON[c.product.category||'Umum']||'📦'}</div>
              <div className="cart-item-info">
                <div className="cart-item-name">{c.product.name}</div>
                <div className="cart-item-price">{fmt(c.product.sellingPrice)} × {c.qty}</div>
              </div>
              {/* Qty controls */}
              <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                <button className="btn-sm" style={{ padding:'4px 8px', background:'rgba(99,102,241,0.08)', border:'none', borderRadius:6, cursor:'pointer', display:'flex' }}
                  onClick={() => onUpdateQty(c.product.id, c.qty-1)} disabled={c.qty<=1}>
                  <Minus size={12}/>
                </button>
                <span style={{ minWidth:22, textAlign:'center', fontWeight:700, fontSize:14 }}>{c.qty}</span>
                <button className="btn-sm" style={{ padding:'4px 8px', background:'rgba(99,102,241,0.08)', border:'none', borderRadius:6, cursor:'pointer', display:'flex' }}
                  onClick={() => onUpdateQty(c.product.id, c.qty+1)} disabled={c.qty>=Number(c.product.stock)}>
                  <Plus size={12}/>
                </button>
                <button className="btn-sm btn-danger-sm" style={{ padding:'5px 8px', marginLeft:4 }}
                  onClick={() => onRemoveItem(c.product.id)} title="Hapus dari keranjang">
                  <Trash2 size={12}/>
                </button>
              </div>
              <strong style={{ color:'var(--purple-600)', minWidth:80, textAlign:'right' }}>{fmt(Number(c.product.sellingPrice)*c.qty)}</strong>
            </div>
          ))}
          <div style={{ display:'flex', justifyContent:'space-between', padding:'14px 0 0', borderTop:'2px solid rgba(99,102,241,0.1)', marginTop:8 }}>
            <strong style={{ fontSize:14 }}>Total Pembayaran</strong>
            <strong style={{ fontSize:18, color:'var(--purple-600)' }}>{fmt(total)}</strong>
          </div>
        </div>

        {/* Payment method */}
        <div className="glass-card section-card">
          <h3 style={{ fontWeight:700, fontSize:15, marginBottom:14, display:'flex', alignItems:'center', gap:6 }}>
            <Package size={16} color="var(--purple-600)"/> Metode Pembayaran
          </h3>
          <div className="payment-options">
            {[
              { id:'QRIS', icon:'📱', name:'QRIS', desc:'Scan & bayar' },
              { id:'BANK_TRANSFER', icon:'🏦', name:'Transfer Bank', desc:'Manual confirm' },
            ].map(m => (
              <div key={m.id} className={`payment-option ${paymentMethod===m.id?'selected':''}`}
                onClick={() => setPaymentMethod(m.id)}>
                <div className="pay-icon">{m.icon}</div>
                <div className="pay-name">{m.name}</div>
                <div className="pay-desc">{m.desc}</div>
              </div>
            ))}
          </div>

          {paymentMethod==='QRIS' && (
            <div style={{ marginTop:14, background:'rgba(99,102,241,0.06)', borderRadius:12, padding:18, textAlign:'center' }}>
              <div style={{ fontSize:13, fontWeight:700, marginBottom:4 }}>Scan QRIS</div>
              <div style={{ width:110, height:110, background:'white', borderRadius:10, margin:'10px auto', display:'flex', alignItems:'center', justifyContent:'center', fontSize:42, boxShadow:'0 4px 14px rgba(0,0,0,0.08)' }}>🔲</div>
              <div style={{ fontWeight:800, color:'var(--purple-600)', fontSize:16 }}>{fmt(total)}</div>
            </div>
          )}

          {paymentMethod==='BANK_TRANSFER' && (
            <div style={{ marginTop:14, background:'rgba(99,102,241,0.06)', borderRadius:12, padding:16 }}>
              <div style={{ fontWeight:700, marginBottom:10, fontSize:13 }}>Informasi Transfer</div>
              {[{bank:'BCA', no:'1234 5678 90'},{bank:'Mandiri', no:'0987 6543 21'}].map(b => (
                <div key={b.bank} style={{ background:'white', borderRadius:8, padding:'8px 12px', marginBottom:6 }}>
                  <div style={{ fontWeight:700, fontSize:13 }}>🏦 {b.bank}</div>
                  <div style={{ fontSize:12 }}>{b.no} · a.n. Hurr Store</div>
                </div>
              ))}
              <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:6 }}>Nominal: <strong style={{ color:'var(--purple-600)' }}>{fmt(total)}</strong></div>
            </div>
          )}

          {error && <div className="alert alert-error" style={{ marginTop:12 }}>{error}</div>}
          <button className="btn-primary" style={{ marginTop:16 }} onClick={handleCheckout} disabled={loading||cart.length===0}>
            {loading ? <span className="spinner"/> : <CheckCircle size={16}/>} Konfirmasi Pesanan
          </button>
        </div>
      </div>
    </div>
  );
}

// ── USER PROFILE ───────────────────────────────────────────────────────────────
function UserProfile({ user, token }: { user: AuthUser; token: string }) {
  const [name, setName] = useState(user.name || user.email.split('@')[0]);
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [addresses, setAddresses] = useState([
    { id:1, label:'Rumah', detail:'Jl. Contoh No. 123, Jakarta Selatan 12345', isDefault:true },
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [newAddr, setNewAddr] = useState({ label:'', detail:'' });

  const saveProfile = async () => {
    setSaving(true); setSaveMsg('');
    try {
      const res = await fetch(`${API}/users/${user.id}/profile`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone }),
      });
      if (!res.ok) throw new Error('Gagal menyimpan');
      setSaveMsg('✅ Profil berhasil disimpan!');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch { setSaveMsg('❌ Gagal menyimpan. Coba lagi.'); }
    finally { setSaving(false); }
  };

  const addAddress = () => {
    if (!newAddr.label||!newAddr.detail) return;
    setAddresses(a => [...a, { id:Date.now(), label:newAddr.label, detail:newAddr.detail, isDefault:false }]);
    setNewAddr({ label:'', detail:'' }); setShowAdd(false);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Profil Saya</h1>
        <p className="page-subtitle">Kelola informasi akun Anda</p>
      </div>
      <div className="grid-2">
        <div className="glass-card section-card" style={{ textAlign:'center' }}>
          <div className="profile-avatar-lg">{user.email[0].toUpperCase()}</div>
          <h2 style={{ fontSize:18, fontWeight:800 }}>{name}</h2>
          <p style={{ color:'var(--text-muted)', fontSize:13 }}>{user.email}</p>
          <span className="badge badge-teal" style={{ marginTop:8 }}>Pelanggan</span>
          <div style={{ marginTop:20, textAlign:'left' }}>
            {saveMsg && <div className={`alert ${saveMsg.startsWith('✅')?'alert-success':'alert-error'}`} style={{ marginBottom:12 }}>{saveMsg}</div>}
            <div className="form-group"><label className="form-label">Nama Lengkap</label>
              <input className="form-input" value={name} onChange={e=>setName(e.target.value)}/></div>
            <div className="form-group"><label className="form-label">No. HP</label>
              <input className="form-input" type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+62 812 xxx"/></div>
            <div className="form-group"><label className="form-label">Email</label>
              <input className="form-input" value={user.email} readOnly/></div>
            <button className="btn-primary" style={{ marginTop:8, gap:8 }} onClick={saveProfile} disabled={saving}>
              {saving?<span className="spinner"/>:<Save size={15}/>} Simpan
            </button>
          </div>
        </div>

        <div className="glass-card section-card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <h3 style={{ fontWeight:700, fontSize:15, display:'flex', alignItems:'center', gap:6 }}>
              <MapPin size={15} color="var(--purple-600)"/> Alamat Pengiriman
            </h3>
            <button className="btn-sm btn-info-sm" style={{ display:'flex', alignItems:'center', gap:4 }}
              onClick={() => setShowAdd(s=>!s)}>
              <Plus size={12}/> Tambah
            </button>
          </div>
          {showAdd && (
            <div style={{ background:'rgba(99,102,241,0.06)', borderRadius:10, padding:14, marginBottom:12 }}>
              <div className="form-group"><label className="form-label">Label (mis: Kantor)</label><input className="form-input" value={newAddr.label} onChange={e=>setNewAddr(a=>({...a,label:e.target.value}))}/></div>
              <div className="form-group"><label className="form-label">Detail Alamat</label><textarea className="form-textarea" rows={2} value={newAddr.detail} onChange={e=>setNewAddr(a=>({...a,detail:e.target.value}))}/></div>
              <div style={{ display:'flex', gap:8 }}>
                <button className="btn-sm btn-success-sm" onClick={addAddress}>Simpan</button>
                <button className="btn-sm btn-danger-sm" onClick={()=>setShowAdd(false)}>Batal</button>
              </div>
            </div>
          )}
          {addresses.map(a => (
            <div key={a.id} style={{ background:'rgba(255,255,255,0.7)', border:`2px solid ${a.isDefault?'var(--purple-500)':'rgba(99,102,241,0.1)'}`, borderRadius:10, padding:'10px 12px', marginBottom:8 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                <strong style={{ fontSize:13 }}>{a.label}</strong>
                {a.isDefault && <span className="badge badge-purple" style={{ fontSize:10 }}>Utama</span>}
              </div>
              <p style={{ fontSize:12, color:'var(--text-secondary)' }}>{a.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── MAIN USER APP ──────────────────────────────────────────────────────────────
export default function UserApp({ token, user, onLogout }: { token: string; user: AuthUser; onLogout: () => void; }) {
  const [view, setView] = useState<UserView>('catalog');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  const addToCart = useCallback((product: Product) => {
    setCart(prev => {
      const ex = prev.find(c => c.product.id===product.id);
      if (ex) return prev.map(c => c.product.id===product.id ? { ...c, qty:c.qty+1 } : c);
      return [...prev, { product, qty:1 }];
    });
  }, []);

  const updateQty = useCallback((productId: string, qty: number) => {
    if (qty<=0) return;
    setCart(prev => prev.map(c => c.product.id===productId ? { ...c, qty } : c));
  }, []);

  const removeItem = useCallback((productId: string) => {
    setCart(prev => prev.filter(c => c.product.id!==productId));
  }, []);

  const totalItems = cart.reduce((s,c) => s+c.qty, 0);

  const nav = [
    { id:'catalog' as UserView,  icon:<ShoppingBag size={17}/>, label:'Katalog' },
    { id:'orders'  as UserView,  icon:<ShoppingCart size={17}/>,label:'Keranjang', badge:totalItems },
    { id:'profile' as UserView,  icon:<User size={17}/>,        label:'Profil' },
  ];

  return (
    <div className="app-wrapper">
      <aside className={`app-sidebar ${menuOpen?'is-open':''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-logo-wrap"><ShoppingBag size={18} color="white"/></div>
          <div>
            <div className="sidebar-name">Hurr Store</div>
            <div className="sidebar-role-badge">PELANGGAN</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Menu</div>
          {nav.map(item => (
            <button key={item.id} className={`nav-item ${view===item.id?'active':''}`}
              onClick={() => { setView(item.id); setMenuOpen(false); }}>
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {(item.badge??0)>0 && <span className="nav-badge">{item.badge}</span>}
            </button>
          ))}
          {cart.length>0 && (
            <button className="btn-primary" style={{ margin:'12px 0', fontSize:13, padding:'10px 12px', gap:6 }}
              onClick={() => { setView('orders'); setMenuOpen(false); }}>
              <ShoppingCart size={14}/> Checkout ({totalItems} item)
            </button>
          )}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{user.email[0].toUpperCase()}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-email">{user.email}</div>
              <div className="sidebar-user-role">Pelanggan</div>
            </div>
          </div>
          <button className="btn-logout" onClick={onLogout}><LogOut size={14} style={{ marginRight:6 }}/> Keluar</button>
        </div>
      </aside>

      <div className="app-main">
        <div className="mobile-topbar">
          <div className="mobile-brand"><ShoppingBag size={16}/> Hurr Store</div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            {totalItems>0 && (
              <button className="btn-sm" style={{ background:'rgba(255,255,255,0.2)', color:'white', border:'none', display:'flex', alignItems:'center', gap:4, position:'relative' }}
                onClick={() => setView('orders')}>
                <ShoppingCart size={14}/> {totalItems}
              </button>
            )}
            <button className="mobile-burger" onClick={() => setMenuOpen(o=>!o)}><Menu size={20}/></button>
          </div>
        </div>

        <div className="app-content">
          {view==='catalog' && <UserCatalog token={token} cart={cart} onAddToCart={addToCart}/>}
          {view==='orders'  && (
            <UserCheckout token={token} cart={cart}
              onUpdateQty={updateQty} onRemoveItem={removeItem}
              onClearCart={() => setCart([])}
              onSuccess={() => setView('orders')}/>
          )}
          {view==='profile' && <UserProfile user={user} token={token}/>}
        </div>
      </div>

      {menuOpen && <div className="sidebar-overlay" onClick={()=>setMenuOpen(false)}/>}
      <LiveChat userId={user.id}/>
    </div>
  );
}
