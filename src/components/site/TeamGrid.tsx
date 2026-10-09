import { initials, type Person } from '../../data/team';

export function Portrait({ person, size = 'md' }: { person: Person; size?: 'md' | 'lg' }) {
  if (person.photo) {
    return (
      <img
        className={`p-portrait p-portrait--${size}`}
        src={person.photo}
        alt={`${person.name}, ${person.role}`}
        loading="lazy" decoding="async" width={400} height={400}
      />
    );
  }
  /* No photo yet: initials on a flat navy tile. aria-hidden because the name
     is already in the heading right beneath it. */
  return (
    <div className={`p-portrait p-portrait--${size} p-portrait--fallback`} aria-hidden="true">
      <span>{initials(person.name)}</span>
    </div>
  );
}

export default function TeamGrid({ people }: { people: Person[] }) {
  return (
    <ul className="p-team">
      {people.map(p => (
        <li key={p.name} className="p-team__item">
          <Portrait person={p} />
          <h3 className="p-team__name">{p.name}</h3>
          <p className="p-team__role">{p.role}</p>
          <p className="p-team__bio">{p.bio}</p>
        </li>
      ))}
    </ul>
  );
}
