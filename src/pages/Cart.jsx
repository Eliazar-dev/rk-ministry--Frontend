import { Link, useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { money } from '../api/client';
import { useGate } from '../context/GateContext';
import usePageTitle from '../hooks/usePageTitle';

export default function Cart() {
  const { items, setQty, remove, total } = useCart();
  const navigate = useNavigate();
  const { guard } = useGate();
  usePageTitle('Your Cart');

  return (
    <>
      <section className="page-banner">
        <div className="container"><h1>Your Cart</h1></div>
      </section>
      <section className="section">
        <div className="container">
          {items.length === 0 ? (
            <div className="empty">
              <p style={{ marginBottom: 16 }}>Your cart is empty.</p>
              <Link to="/store" className="btn btn-gold">Browse the store</Link>
            </div>
          ) : (
            <div className="two-col">
              <div>
                {items.map((i) => (
                  <div className="cart-row" key={i.id}>
                    <img src={i.image} alt={i.name} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                      <div>
                        <strong style={{ fontSize: '.92rem' }}>{i.name}</strong>
                        <div className="price">{money(i.price)}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <div className="qty">
                          <button onClick={() => setQty(i.id, i.qty - 1)}>−</button>
                          <span>{i.qty}</span>
                          <button onClick={() => setQty(i.id, i.qty + 1)}>+</button>
                        </div>
                        <button className="icon-btn" style={{ color: '#b02a2a', background: '#fdeaea', border: 0 }} onClick={() => remove(i.id)} aria-label="Remove"><Trash2 size={17} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="summary">
                <h3 style={{ marginBottom: 14 }}>Order Summary</h3>
                <div className="line"><span>Subtotal</span><span>{money(total)}</span></div>
                <div className="line"><span>Delivery</span><span>Calculated at checkout</span></div>
                <div className="line total"><span>Total</span><span>{money(total)}</span></div>
                <button className="btn btn-gold btn-block" style={{ marginTop: 16 }} onClick={() => guard({ type: 'checkout' }, () => navigate('/checkout'), '/checkout')}>Proceed to Checkout</button>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
