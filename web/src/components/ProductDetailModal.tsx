import { useState, useRef, useEffect } from 'react';
import { X, ShoppingCart, Ruler, Package } from 'lucide-react';
import { fmt } from '../types';
import type { Product, CartItem } from '../types';

const CAT_ICON: Record<string,string> = {
  Pakaian:'👕', Elektronik:'📱', Makanan:'🍔', Minuman:'☕',
  Aksesoris:'💍', Umum:'📦', Lainnya:'🎁',
};

// Detect touch/mobile device — disable zoom on mobile
const isTouchDevice = () =>
  typeof window !== 'undefined' &&
  ('ontouchstart' in window || navigator.maxTouchPoints > 0);

interface Props {
  product: Product | null;
  onClose: () => void;
  cart: CartItem[];
  onAddToCart: (p: Product, size?: string) => void;
}

export default function ProductDetailModal({ product, onClose, cart, onAddToCart }: Props) {
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [imgZoom, setImgZoom] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isTouch] = useState(isTouchDevice);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setSelectedSize(''); }, [product?.id]);

  if (!product) return null;

  const discPrice = product.discount
    ? Math.round(Number(product.sellingPrice) * (1 - Number(product.discount) / 100))
    : Number(product.sellingPrice);

  // Use flat fields from the updated schema
  const sizes: string[] = Array.isArray(product.sizes) ? product.sizes : [];
  const stockPerSize: Record<string,string> = (typeof product.stockPerSize === 'object' && product.stockPerSize !== null)
    ? product.stockPerSize as Record<string,string>
    : {};
  const hasImage = !!product.imageUrl;

  const inCart = cart.some(c => c.product.id === product.id);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isTouch) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  const addToCart = () => {
    if (sizes.length > 0 && !selectedSize) return;
    onAddToCart(product, selectedSize || undefined);
    onClose();
  };

  return (
    <div className="modal-overlay"
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ animation: 'fadeIn 0.2s ease' }}>
      <div className="modal-box"
        style={{ maxWidth: 680, maxHeight: '90vh', overflowY: 'auto', animation: 'slideUp 0.25s ease' }}>
        <div className="modal-header">
          <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Package size={17}/> Detail Produk
          </h3>
          <button className="modal-close" onClick={onClose}><X size={18}/></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px,220px) 1fr', gap: 0 }}>
          {/* Image panel — zoom only on desktop */}
          <div
            ref={imgRef}
            onMouseEnter={() => !isTouch && setImgZoom(true)}
            onMouseLeave={() => setImgZoom(false)}
            onMouseMove={handleMouseMove}
            style={{
              height: 280, overflow: 'hidden',
              cursor: isTouch ? 'default' : 'crosshair',
              background: 'linear-gradient(135deg,rgba(99,102,241,0.06),rgba(6,182,212,0.04))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', borderRight: '1px solid rgba(99,102,241,0.08)',
              flexShrink: 0,
            }}>
            {hasImage ? (
              <img src={product.imageUrl} alt={product.name}
                style={{
                  width: '100%', height: '100%', objectFit: 'cover',
                  transform: (!isTouch && imgZoom)
                    ? `scale(2.4) translate(-${50 - zoomPos.x}%, -${50 - zoomPos.y}%)`
                    : 'scale(1)',
                  transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                  transition: 'transform 0.12s ease',
                  pointerEvents: 'none',
                }}/>
            ) : (
              <div style={{ fontSize: 72, opacity: 0.7 }}>{CAT_ICON[product.category||'Umum']||'📦'}</div>
            )}
            {!isTouch && imgZoom && (
              <div style={{ position:'absolute', bottom:8, right:8, background:'rgba(0,0,0,0.55)',
                color:'white', fontSize:10, padding:'2px 8px', borderRadius:6, pointerEvents:'none' }}>
                🔍 Zoom aktif
              </div>
            )}
            {product.discount ? (
              <span className="badge badge-danger"
                style={{ position:'absolute', top:10, left:10, fontSize:11 }}>
                Diskon {product.discount}%
              </span>
            ) : null}
          </div>

          {/* Info panel */}
          <div style={{ padding:20, overflow:'auto' }}>
            <div style={{ display:'flex', gap:6, marginBottom:8, flexWrap:'wrap' }}>
              {product.category && <span className="badge badge-purple">{product.category}</span>}
              {product.brand   && <span className="badge badge-gray">{product.brand}</span>}
            </div>

            <h2 style={{ fontSize:17, fontWeight:800, marginBottom:6 }}>{product.name}</h2>
            {product.description && (
              <p style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:12 }}>{product.description}</p>
            )}

            {/* Price */}
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:22, fontWeight:800, color:'var(--purple-600)' }}>{fmt(discPrice)}</div>
              {product.discount ? (
                <div style={{ fontSize:13, color:'var(--text-muted)', textDecoration:'line-through' }}>{fmt(product.sellingPrice)}</div>
              ) : null}
            </div>

            {/* Clothing details - flat fields */}
            {(product.material || product.color || product.weight) && (
              <div style={{ background:'rgba(99,102,241,0.05)', borderRadius:10, padding:'10px 12px', marginBottom:12, fontSize:12 }}>
                {product.material && <div style={{ marginBottom:3 }}><strong>Bahan:</strong> {String(product.material)}</div>}
                {product.color   && <div style={{ marginBottom:3 }}><strong>Warna:</strong> {String(product.color)}</div>}
                {product.weight  && <div><strong>Berat:</strong> {String(product.weight)}g</div>}
              </div>
            )}

            {/* ── Size picker — uses flat sizes[] and stockPerSize{} ── */}
            {sizes.length > 0 && (
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:12, fontWeight:700, marginBottom:8, display:'flex', alignItems:'center', gap:4 }}>
                  <Ruler size={13}/> Pilih Ukuran
                  {selectedSize && (
                    <span className="badge badge-purple" style={{ fontSize:10, marginLeft:4 }}>
                      Dipilih: {selectedSize}
                    </span>
                  )}
                </div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {sizes.map(s => {
                    const stkCount = Number(stockPerSize[s] ?? 0);
                    const oos = stkCount === 0;
                    return (
                      <button key={s} disabled={oos}
                        onClick={() => setSelectedSize(prev => prev === s ? '' : s)}
                        style={{
                          padding:'6px 14px', borderRadius:8, fontWeight:700, fontSize:13,
                          border:'2px solid', transition:'all 0.15s',
                          cursor: oos ? 'not-allowed' : 'pointer',
                          borderColor: selectedSize===s ? 'var(--purple-500)' : oos ? 'rgba(0,0,0,0.08)' : 'rgba(99,102,241,0.3)',
                          background: selectedSize===s ? 'rgba(99,102,241,0.12)' : 'white',
                          color: selectedSize===s ? 'var(--purple-600)' : oos ? 'var(--text-muted)' : 'var(--text-primary)',
                          opacity: oos ? 0.45 : 1,
                        }}>
                        {s}
                        <div style={{ fontSize:9, marginTop:2, color: oos ? 'var(--danger)' : 'var(--text-muted)' }}>
                          {oos ? 'Habis' : `${stkCount} pcs`}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:14 }}>
              Total stok: <strong>{product.stock}</strong> pcs
            </div>

            <button className="btn-primary" style={{ gap:8 }}
              disabled={product.stock===0 || inCart || (sizes.length > 0 && !selectedSize)}
              onClick={addToCart}>
              <ShoppingCart size={16}/>
              {product.stock===0 ? 'Stok Habis'
                : inCart ? 'Sudah di Keranjang'
                : sizes.length > 0 && !selectedSize ? 'Pilih Ukuran Dulu'
                : 'Tambah ke Keranjang'}
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn { from{opacity:0}to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}
