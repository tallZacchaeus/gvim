import { weekly, monthly, timezoneNote } from '../../data/serviceTimes';

/* The single schedule component. Home, About and the mobile panel all render
   this data; nothing hand-copies a time. */
export default function ServiceTimes({ heading = 'Service times' }: { heading?: string }) {
  return (
    <div className="p-times">
      <h2 className="p-sr">{heading}</h2>
      <div className="p-times__grid">
        <Table title="Every week" rows={weekly} />
        <Table title="Through the month" rows={monthly} />
      </div>
      <p className="p-times__note">{timezoneNote}</p>
    </div>
  );
}

function Table({ title, rows }: { title: string; rows: { when: string; what: string; time: string }[] }) {
  return (
    <div className="p-times__col">
      <h3 className="p-times__title">{title}</h3>
      <table className="p-times__table">
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <th scope="row">{r.when}</th>
              <td className="p-times__what">{r.what}</td>
              <td className="p-times__time">{r.time}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
