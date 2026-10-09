import { weekly } from '../../data/serviceTimes';
import { addressOneLine, address } from '../../data/site';

/* Three facts a first-time visitor needs: when, when again, and where.
   Label + value with thin dividers — no cards, no icons. */
export default function InfoStrip() {
  const items = [
    { label: 'Sunday worship', value: `${weekly[0].time} & ${weekly[1].time}` },
    { label: 'Bible study',    value: `${weekly[2].when}s, ${weekly[2].time}` },
    { label: 'Where we meet',  value: `${address.street}, ${address.city}`, full: addressOneLine }
  ];
  return (
    <section className="p-strip" aria-label="Service times and location">
      <div className="p-container">
        <dl className="p-strip__grid">
          {items.map(i => (
            <div key={i.label} className="p-strip__item">
              <dt>{i.label}</dt>
              <dd title={i.full}>{i.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
