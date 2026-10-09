import { Link } from 'react-router-dom';
import {
  visionMissionValues, pillars, leadPastor, leaders,
  story, milestones, stats
} from '../data/team';
import PageHeader from '../components/site/PageHeader';
import TeamGrid, { Portrait } from '../components/site/TeamGrid';
import ServiceTimes from '../components/site/ServiceTimes';

export default function About() {
  return (
    <>
      <PageHeader
        crumb="About"
        title="About us"
        lede="Our heart, our mission, and the people who make GVIM a place of worship and fellowship."
      />

      {/* Vision / Mission / Values — three text columns with thin top rules. */}
      <section className="p-section p-section--surface">
        <div className="p-container">
          <ul className="p-vmv">
            {visionMissionValues.map(v => (
              <li key={v.title} className="p-vmv__item">
                <h2 className="p-vmv__title">{v.title}</h2>
                <p>{v.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Pillars */}
      <section className="p-section">
        <div className="p-container">
          <div className="p-head"><h2>Our ministry pillars</h2></div>
          <ul className="p-pillars p-pillars--six">
            {pillars.map(p => (
              <li key={p.title} className="p-pillars__item">
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Leadership */}
      <section className="p-section p-section--surface">
        <div className="p-container">
          <div className="p-head"><h2>Our lead pastor</h2></div>
          <div className="p-lead">
            <Portrait person={leadPastor} size="lg" />
            <div className="p-prose">
              <h3 className="p-lead__name">{leadPastor.name}</h3>
              <p className="p-lead__role">{leadPastor.role}</p>
              <p>{leadPastor.bio}</p>
            </div>
          </div>

          <div className="p-head p-head--mt"><h2>Ministry leaders</h2></div>
          <TeamGrid people={leaders} />
        </div>
      </section>

      {/* Our story + milestones */}
      <section className="p-section">
        <div className="p-container">
          <div className="p-story">
            <div className="p-prose">
              <h2>Our story</h2>
              {story.map((para, i) => <p key={i}>{para}</p>)}
            </div>
            <div className="p-timeline">
              <h3 className="p-timeline__title">Key milestones</h3>
              <ol className="p-timeline__list">
                {milestones.map(m => (
                  <li key={m.year} className="p-timeline__item">
                    <span className="p-timeline__year">{m.year}</span>
                    <span className="p-timeline__text">{m.text}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <dl className="p-stats">
            {stats.map(s => (
              <div key={s.label} className="p-stats__item">
                <dt>{s.label}</dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Replaces the previously unstyled "Join Us for Worship" block. */}
      <section className="p-section p-section--navy">
        <div className="p-container">
          <div className="p-head">
            <h2>Join us for worship</h2>
            <p className="p-visit__lede">
              Everyone is welcome. Come as you are — we will look out for you.
            </p>
          </div>
          <ServiceTimes />
          <div className="p-btn-row p-visit__cta">
            <Link to="/contact" className="p-btn p-btn--outline">Plan your visit</Link>
          </div>
        </div>
      </section>
    </>
  );
}
