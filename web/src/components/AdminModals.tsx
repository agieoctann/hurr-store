import { useState, useRef, type FormEvent } from 'react';
import { X, Package, BookOpen, Upload, Image } from 'lucide-react';
import { API } from '../types';
import type { Product } from '../types';

const SIZES = ['XS','S','M','L','XL','XXL','XXXL'];
const MATERIALS = ['Cotton','Polyester','Linen','Denim','Rayon','Silk','Wool','Fleece','Spandex','Nylon'];
const CATEGORIES = ['Umum','Pakaian','Elektronik','Makanan','Minuman','Aksesoris','Lainnya'];

const emptyProduct = {
  name:'', description:'', category:'Pakaian', imageUrl:'',
  brand:'', material:'', weight:'', color:'',
  costPrice:'', sellingPrice:'', discount:'0',
  stock:'', minStock:'5',
  sizes:[] as string[], stockPerSize:{} as Record<string,string>,
};
type ProductForm = typeof emptyProduct;

// ── PRODUCT MODAL ──────────────────────────────────────────────────────────────
export function ProductModal({ isOpen, onClose, onSave, initial, token }: {
  isOpen:boolean; onClose:()=>void; onSave:()=>void;
  initial?:Product|null; token:string;
}) {
  const [form, setForm] = useState<ProductForm>(emptyProduct);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imgPreview, setImgPreview] = useState<string>('');
  const fileRef = useRef<HTMLInputElement>(null);

  const initForm = (p: Product | null | undefined) => {
    if (!p) { setForm(emptyProduct); setImgPreview(''); return; }
    const meta = (p as Product & { metadata?: Record<string,unknown> }).metadata || {};
    setForm({
      name:p.name, description:p.description||'', category:p.category||'Pakaian',
      imageUrl:p.imageUrl||'', brand:String(meta.brand||''), material:String(meta.material||''),
      weight:String(meta.weight||''), color:String(meta.color||''),
      sizes:(meta.sizes as string[])||[], stockPerSize:((meta.stockPerSize as Record<string,string>)||{}),
      costPrice:String(p.costPrice), sellingPrice:String(p.sellingPrice),
      discount:String(p.discount||0), stock:String(p.stock), minStock:String(p.minStock),
    });
    setImgPreview(p.imageUrl||'');
  };

  // Re-init when opening
  const [lastInitId, setLastInitId] = useState<string|null>(null);
  if (isOpen && (initial?.id||null) !== lastInitId) {
    setLastInitId(initial?.id||null);
    initForm(initial);
    setError('');
  }

  const handleImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const url = e.target?.result as string;
      setImgPreview(url);
      setForm(p => ({ ...p, imageUrl: url }));
    };
    reader.readAsDataURL(file);
  };

  const isClothing = form.category === 'Pakaian';

  const toggleSize = (s: string) => {
    setForm(prev => {
      const has = prev.sizes.includes(s);
      const sizes = has ? prev.sizes.filter(x=>x!==s) : [...prev.sizes, s];
      const sps = { ...prev.stockPerSize };
      if (!has) sps[s] = sps[s]||''; else delete sps[s];
      return { ...prev, sizes, stockPerSize: sps };
    });
  };

  const save = async (e: FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const url = initial ? `${API}/products/${initial.id}` : `${API}/products`;
      const totalStock = isClothing && form.sizes.length > 0
        ? Object.values(form.stockPerSize).reduce((s,v)=>s+(Number(v)||0), 0)
        : Number(form.stock);

      // Strip base64 images — backend only accepts URL strings, not binary data
      const imageUrlToSend = form.imageUrl.startsWith('data:') ? '' : form.imageUrl;

      const res = await fetch(url, {
        method: initial?'PUT':'POST',
        headers: { Authorization:`Bearer ${token}`, 'Content-Type':'application/json' },
        body: JSON.stringify({
          name:form.name, description:form.description, category:form.category,
          imageUrl: imageUrlToSend, costPrice:Number(form.costPrice),
          sellingPrice:Number(form.sellingPrice), discount:Number(form.discount),
          stock:totalStock, minStock:Number(form.minStock),
          brand:form.brand, material:form.material, weight:form.weight ? Number(form.weight) : undefined,
          color:form.color,
          sizes: isClothing ? form.sizes : [],
          stockPerSize: isClothing ? form.stockPerSize : {},
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error||'Gagal menyimpan produk'); }
      onSave();
    } catch (err:unknown) { setError(err instanceof Error?err.message:'Gagal'); }
    finally { setLoading(false); }
  };

  if (!isOpen) return null;
  const f = (k: keyof ProductForm, v:string) => setForm(p=>({...p,[k]:v}));

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box" style={{ maxWidth:600, maxHeight:'90vh', overflowY:'auto' }}>
        <div className="modal-header">
          <h3 className="modal-title" style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Package size={18}/> {initial?'Edit Produk':'Tambah Produk'}
          </h3>
          <button className="modal-close" onClick={onClose}><X size={18}/></button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          <form id="pform" onSubmit={save}>

            {/* Image upload */}
            <div className="form-group">
              <label className="form-label">Gambar Produk</label>
              <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                {/* Preview */}
                <div onClick={()=>fileRef.current?.click()}
                  style={{ width:100, height:100, borderRadius:10, border:'2px dashed rgba(99,102,241,0.3)',
                    background:'rgba(99,102,241,0.04)', display:'flex', flexDirection:'column',
                    alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, overflow:'hidden',
                    transition:'border-color 0.2s' }}
                  onMouseEnter={e=>(e.currentTarget.style.borderColor='var(--purple-500)')}
                  onMouseLeave={e=>(e.currentTarget.style.borderColor='rgba(99,102,241,0.3)')}>
                  {imgPreview
                    ? <img src={imgPreview} alt="preview" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                    : <><Image size={28} color="var(--text-muted)"/><span style={{ fontSize:10, color:'var(--text-muted)', marginTop:4 }}>Klik upload</span></>
                  }
                </div>
                <div style={{ flex:1 }}>
                  <button type="button" className="btn-secondary" style={{ width:'auto', padding:'8px 16px', gap:6, display:'flex', alignItems:'center' }}
                    onClick={()=>fileRef.current?.click()}>
                    <Upload size={14}/> Pilih Gambar
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }}
                    onChange={e=>{ const f=e.target.files?.[0]; if(f) handleImageFile(f);}}/>
                  <div className="form-group" style={{ marginTop:8, marginBottom:0 }}>
                    <input className="form-input" value={form.imageUrl}
                      onChange={e=>{ f('imageUrl',e.target.value); setImgPreview(e.target.value);}}
                      placeholder="atau paste URL gambar..." style={{ fontSize:12 }}/>
                  </div>
                  <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>⚠️ Gunakan URL gambar (mis: imgur, CDN). File lokal tidak disimpan ke server.</div>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Nama Produk *</label>
              <input className="form-input" value={form.name} onChange={e=>f('name',e.target.value)} placeholder="Kaos Polos Premium" required/>
            </div>
            <div className="field-row">
              <div className="form-group">
                <label className="form-label">Kategori</label>
                <select className="form-select" value={form.category} onChange={e=>f('category',e.target.value)}>
                  {CATEGORIES.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Brand / Merk</label>
                <input className="form-input" value={form.brand} onChange={e=>f('brand',e.target.value)} placeholder="Uniqlo, Zara..."/>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Deskripsi</label>
              <textarea className="form-textarea" rows={2} value={form.description} onChange={e=>f('description',e.target.value)} placeholder="Deskripsi produk..."/>
            </div>

            {isClothing && (
              <>
                <div className="field-row">
                  <div className="form-group">
                    <label className="form-label">Bahan / Material</label>
                    <select className="form-select" value={form.material} onChange={e=>f('material',e.target.value)}>
                      <option value="">-- Pilih Bahan --</option>
                      {MATERIALS.map(m=><option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Warna</label>
                    <input className="form-input" value={form.color} onChange={e=>f('color',e.target.value)} placeholder="Hitam, Putih..."/>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Berat (gram)</label>
                  <input className="form-input" type="number" value={form.weight} onChange={e=>f('weight',e.target.value)} placeholder="200" min="0"/>
                </div>
                <div className="form-group">
                  <label className="form-label">Ukuran Tersedia</label>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8 }}>
                    {SIZES.map(s=>(
                      <button key={s} type="button" onClick={()=>toggleSize(s)}
                        style={{ padding:'5px 12px', borderRadius:6, border:'1.5px solid', fontWeight:600, fontSize:12, cursor:'pointer',
                          borderColor:form.sizes.includes(s)?'var(--purple-500)':'rgba(99,102,241,0.2)',
                          background:form.sizes.includes(s)?'rgba(99,102,241,0.1)':'white',
                          color:form.sizes.includes(s)?'var(--purple-600)':'var(--text-secondary)' }}>
                        {s}
                      </button>
                    ))}
                  </div>
                  {form.sizes.length>0 && (
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(100px,1fr))', gap:8 }}>
                      {form.sizes.map(s=>(
                        <div key={s}>
                          <label className="form-label" style={{ fontSize:11 }}>Stok {s}</label>
                          <input className="form-input" type="number" placeholder="0" min="0"
                            value={form.stockPerSize[s]||''}
                            onChange={e=>setForm(p=>({...p,stockPerSize:{...p.stockPerSize,[s]:e.target.value}}))}/>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="field-row">
              <div className="form-group">
                <label className="form-label">Harga Modal (Rp) *</label>
                <input className="form-input" type="number" value={form.costPrice} onChange={e=>f('costPrice',e.target.value)} placeholder="50000" required min="0"/>
              </div>
              <div className="form-group">
                <label className="form-label">Harga Jual (Rp) *</label>
                <input className="form-input" type="number" value={form.sellingPrice} onChange={e=>f('sellingPrice',e.target.value)} placeholder="80000" required min="0"/>
              </div>
            </div>
            <div className="field-row">
              {(!isClothing||form.sizes.length===0)&&(
                <div className="form-group">
                  <label className="form-label">Total Stok *</label>
                  <input className="form-input" type="number" value={form.stock} onChange={e=>f('stock',e.target.value)} placeholder="100" min="0"/>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Stok Min. Alert</label>
                <input className="form-input" type="number" value={form.minStock} onChange={e=>f('minStock',e.target.value)} placeholder="5" min="0"/>
              </div>
              <div className="form-group">
                <label className="form-label">Diskon (%)</label>
                <input className="form-input" type="number" value={form.discount} onChange={e=>f('discount',e.target.value)} placeholder="0" min="0" max="100"/>
              </div>
            </div>
          </form>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" style={{ width:'auto', padding:'10px 20px' }} onClick={onClose}>Batal</button>
          <button type="submit" form="pform" className="btn-primary" style={{ width:'auto', padding:'10px 24px' }} disabled={loading}>
            {loading?<span className="spinner"/>:null} {initial?'Simpan':'Tambah Produk'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── LEDGER MODAL ───────────────────────────────────────────────────────────────
export function LedgerModal({ isOpen, onClose, onSave, token }: {
  isOpen:boolean; onClose:()=>void; onSave:()=>void; token:string;
}) {
  const [form, setForm] = useState({ type:'INCOME', category:'SALES_REVENUE', amount:'', description:'' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const cats: Record<string,string[]> = {
    INCOME:['SALES_REVENUE'],
    EXPENSE:['RESTOCK_COST','OPERATIONAL_EXPENSE','REFUND'],
  };

  const save = async (e: FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/finance/ledgers`, {
        method:'POST',
        headers:{ Authorization:`Bearer ${token}`, 'Content-Type':'application/json' },
        body:JSON.stringify({ ...form, amount:Number(form.amount) }),
      });
      if (!res.ok) { const d=await res.json(); throw new Error(d.error); }
      setForm({ type:'INCOME', category:'SALES_REVENUE', amount:'', description:'' });
      onSave();
    } catch (err:unknown) { setError(err instanceof Error?err.message:'Gagal'); }
    finally { setLoading(false); }
  };

  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box" style={{ maxWidth:480 }}>
        <div className="modal-header">
          <h3 className="modal-title" style={{ display:'flex', alignItems:'center', gap:8 }}>
            <BookOpen size={18}/> Tambah Entri Kas
          </h3>
          <button className="modal-close" onClick={onClose}><X size={18}/></button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          <form id="lform" onSubmit={save}>
            <div className="field-row">
              <div className="form-group">
                <label className="form-label">Tipe</label>
                <select className="form-select" value={form.type}
                  onChange={e=>setForm({...form,type:e.target.value,category:cats[e.target.value][0]})}>
                  <option value="INCOME">Pemasukan</option>
                  <option value="EXPENSE">Pengeluaran</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Kategori</label>
                <select className="form-select" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                  {cats[form.type].map(c=><option key={c} value={c}>{c.replace(/_/g,' ')}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Nominal (Rp) *</label>
              <input className="form-input" type="number" value={form.amount}
                onChange={e=>setForm({...form,amount:e.target.value})} placeholder="150000" required min="0"/>
            </div>
            <div className="form-group">
              <label className="form-label">Keterangan</label>
              <textarea className="form-textarea" rows={2} value={form.description}
                onChange={e=>setForm({...form,description:e.target.value})} placeholder="Catatan transaksi..."/>
            </div>
          </form>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" style={{ width:'auto', padding:'10px 20px' }} onClick={onClose}>Batal</button>
          <button type="submit" form="lform" className="btn-primary" style={{ width:'auto', padding:'10px 24px' }} disabled={loading}>
            {loading?<span className="spinner"/>:null} Simpan
          </button>
        </div>
      </div>
    </div>
  );
}

// ── USER EDIT MODAL ────────────────────────────────────────────────────────────
export function UserEditModal({ isOpen, onClose, onSave, userId, userEmail, token }: {
  isOpen:boolean; onClose:()=>void; onSave:()=>void;
  userId:string; userEmail:string; token:string;
}) {
  const [role, setRole] = useState('USER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const save = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/users/${userId}`, {
        method:'PUT',
        headers:{ Authorization:`Bearer ${token}`, 'Content-Type':'application/json' },
        body:JSON.stringify({ role }),
      });
      if (!res.ok) { const d=await res.json(); throw new Error(d.error||'Gagal'); }
      onSave();
    } catch (err:unknown) { setError(err instanceof Error?err.message:'Gagal'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box" style={{ maxWidth:400 }}>
        <div className="modal-header">
          <h3 className="modal-title">Edit Akun User</h3>
          <button className="modal-close" onClick={onClose}><X size={18}/></button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" value={userEmail} readOnly style={{ background:'rgba(99,102,241,0.04)' }}/>
          </div>
          <div className="form-group">
            <label className="form-label">Ubah Role</label>
            <select className="form-select" value={role} onChange={e=>setRole(e.target.value)}>
              <option value="USER">Pelanggan</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" style={{ width:'auto', padding:'10px 20px' }} onClick={onClose}>Batal</button>
          <button className="btn-primary" style={{ width:'auto', padding:'10px 24px' }} onClick={save} disabled={loading}>
            {loading?<span className="spinner"/>:null} Simpan
          </button>
        </div>
      </div>
    </div>
  );
}
