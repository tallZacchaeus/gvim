import { giving } from '../../data/site';

export default function GiveBand() {
  return (
    <section className="p-section p-section--navy p-on-dark">
      <div className="p-container p-give">
        <div>
          <h2>Partner with GVIM</h2>
          <p className="p-give__lede">
            Your giving pays for {giving.supports} — the work you see on this site is
            funded by people who choose to stand behind it.
          </p>
          <div className="p-btn-row">
            {giving.onlineUrl ? (
              <a className="p-btn p-btn--outline" href={giving.onlineUrl} target="_blank" rel="noopener noreferrer">
                Give online
              </a>
            ) : (
              /* No URL configured yet: say so plainly rather than linking nowhere. */
              <span className="p-btn p-btn--outline" aria-disabled="true">Give online — coming soon</span>
            )}
          </div>
        </div>
        <div className="p-give__alt">
          <h3 className="p-give__altTitle">Interac e-Transfer</h3>
          <p className="p-break">
            <a href={`mailto:${giving.eTransferEmail}?subject=${encodeURIComponent('Giving to GVIM')}`}>
              {giving.eTransferEmail}
            </a>
          </p>
          <p className="p-give__note">
            Please include your name and what the gift is for in the message field.
          </p>
        </div>
      </div>
    </section>
  );
}
