import { Link } from 'react-router-dom';

export default function PageHeader({
  title, lede, crumb
}: { title: string; lede?: string; crumb: string }) {
  return (
    <section className="p-pageHead">
      <div className="p-container">
        <nav className="p-crumb" aria-label="Breadcrumb">
          <ol>
            <li><Link to="/">Home</Link></li>
            <li aria-current="page">{crumb}</li>
          </ol>
        </nav>
        <h1>{title}</h1>
        {lede && <p className="p-pageHead__lede">{lede}</p>}
      </div>
    </section>
  );
}
