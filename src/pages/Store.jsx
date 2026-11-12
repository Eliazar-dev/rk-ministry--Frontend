import { useList } from '../api/client';
import { SkeletonGrid } from '../components/Skeleton';
import { ProductCard } from '../components/Cards';
import usePageTitle from '../hooks/usePageTitle';

export default function Store() {
  usePageTitle('Store', 'Bibles, books and branded gear from Richard Kwanya Snr Ministry.');
  const { data, loading } = useList('products');
  return (
    <>
      <section className="page-banner">
        <div className="container">
          <div className="eyebrow">Store</div>
          <h1>Ministry Store</h1>
          <p>Bibles, books and branded gear. Every purchase supports the work of the gospel.</p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          {loading ? (
            <SkeletonGrid count={6} />
          ) : (
            <div className="grid">{data.map((p) => <ProductCard key={p.id} item={p} />)}</div>
          )}
        </div>
      </section>
    </>
  );
}
