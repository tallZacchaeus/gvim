const pillars = [
  { icon: 'fa-praying-hands', title: 'Worship', text: "We believe in the power of authentic worship that touches hearts and transforms lives. Our services are designed to create an atmosphere where people can encounter God's presence." },
  { icon: 'fa-book-open', title: 'Word', text: 'The Word of God is our foundation. We are committed to teaching the Bible with accuracy, relevance, and practical application for daily living.' },
  { icon: 'fa-users', title: 'Fellowship', text: 'We foster genuine relationships through small groups, ministry teams, and church-wide events that build lasting connections.' },
  { icon: 'fa-hands-helping', title: 'Service', text: "Following Christ's example, we serve our community through outreach programs and missions both locally and globally." },
  { icon: 'fa-seedling', title: 'Discipleship', text: 'We are committed to helping believers grow through mentoring, training, and equipping programs that develop spiritual maturity.' },
  { icon: 'fa-globe', title: 'Evangelism', text: 'Sharing the Gospel is at the heart of our mission. We actively reach out with the message of hope and salvation.' }
];

const leaders = [
  { name: 'Deaconess Adetutu A. Olutimi', role: 'Director, Family Affairs and Welfare', bio: 'Deaconess Adetutu oversees all matters relating to family support, member welfare, and community care within the ministry.', initial: 'A' },
  { name: 'Pastor/Prophet Shina Oladimeji', role: 'Director of Bible Studies', bio: "Pastor Shina leads the ministry's Bible teaching and scriptural training, ensuring all teachings are rooted in sound doctrine.", initial: 'S' },
  { name: 'Boluwatife V. Hammed', role: 'General Secretary', bio: "Boluwatife manages the ministry's communication, documentation, and coordination across departments.", initial: 'B' },
  { name: 'Pastor Niyi Adeleye', role: 'Director of Prayer', bio: 'Pastor Niyi leads the prayer ministry, organizing intercessory sessions and cultivating a strong culture of prayer and fasting.', initial: 'N' },
  { name: 'Sister Ayomipo Adeleye', role: 'Prayer Coordinator, West Africa', bio: 'Sister Ayomipo oversees all prayer activities in the West Africa region, mobilizing prayer teams and coordinating intercession schedules.', initial: 'A' },
  { name: 'Pastor Lawrence Enyi', role: 'Public Affairs Coordinator', bio: 'Pastor Lawrence manages public engagement, outreach communication, and community representation for GVIM Ministry.', initial: 'L' },
  { name: 'Sister Lola Akinsanya', role: 'Program Coordinator', bio: 'Sister Lola is responsible for organizing and executing all ministry programs and events, ensuring every service is well-planned.', initial: 'L' },
  { name: 'Sister Mosekola Akinbaani', role: 'Assistant Program Coordinator', bio: 'Sister Mosekola supports the planning and execution of ministry events, working closely with the Program Coordinator.', initial: 'M' },
  { name: 'Brother Jeremiah Olugunju', role: 'Design and Prints', bio: 'Brother Jeremiah handles all creative design and print production — from flyers to banners and visual branding for the ministry.', initial: 'J' }
];

const services = [
  { icon: 'fa-sun', h: 'Sunday Morning', p: 'First Service', t: '10:00 AM MDT' },
  { icon: 'fa-sunset', h: 'Sunday Afternoon', p: 'Second Service', t: '2:00 PM MDT' },
  { icon: 'fa-book-open', h: 'Tuesday', p: 'Bible Study', t: '6:00 PM MDT' },
  { icon: 'fa-hands-praying', h: '1st of Month', p: 'Healing Hour', t: '6:00 AM MDT' },
  { icon: 'fa-heart', h: 'Third Sunday', p: 'Family Service', t: '2:00 PM MDT', special: true },
  { icon: 'fa-heart', h: 'Fourth Sunday', p: 'Prayer Meeting', t: '2:00 PM MDT', special: true },
  { icon: 'fa-users', h: 'Fifth Sunday', p: 'Youth Service', t: '2:00 PM MDT', special: true }
];

function Avatar({ initial }: { initial: string }) {
  return (
    <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'hsl(213 94% 90%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(213 94% 40%)', fontSize: 48, fontWeight: 700, margin: '0 auto' }}>
      {initial}
    </div>
  );
}

export default function About() {
  return (
    <>
      <section className="page-header">
        <div className="container">
          <h1>About Us</h1>
          <p>Discover our heart, mission, and the people who make GVIM a place of worship and fellowship</p>
        </div>
      </section>

      <section className="vision-mission">
        <div className="container">
          <div className="vm-grid">
            <div className="vm-card"><i className="fas fa-eye fa-3x"></i><h3>Our Vision</h3><p>In a time marked by rampant falsehood and societal decay, we need a beacon of truth. God's Vessels International Ministry represents that light. We stand for the Truth and are Vessels of Truth.</p></div>
            <div className="vm-card"><i className="fas fa-bullseye fa-3x"></i><h3>Our Mission</h3><p>Our goal is to seek, preach, and live the truth, ensuring that all who listen on this platform receive nothing but the genuine message of God, delivered with passion, patience, and wisdom.</p></div>
            <div className="vm-card"><i className="fas fa-heart fa-3x"></i><h3>Our Values</h3><p>We value holiness and truth, striving to live righteously and preach the undiluted Word of God, while fostering empathy and togetherness through compassion, unity, and Christ-like love.</p></div>
          </div>
        </div>
      </section>

      <section className="ministry-pillars">
        <div className="container">
          <h2>Our Ministry Pillars</h2>
          <div className="pillars-grid">
            {pillars.map(p => (
              <div key={p.title} className="pillar">
                <div className="pillar-icon"><i className={`fas ${p.icon} fa-2x`}></i></div>
                <h3>{p.title}</h3>
                <p>{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="leadership">
        <div className="container">
          <h2>Our Lead Pastor</h2>
          <div className="lead-pastor-section">
            <div className="leader-card lead-pastor-card">
              <div className="leader-image"><Avatar initial="G" /></div>
              <div className="leader-info">
                <h3>Rev. Godwin BB. Olutimi</h3>
                <h4>Lead Pastor / Reverend</h4>
                <p>Currently serving as the Lead Pastor in God's Vessels International Ministry (GVIM), Pastor Godwin has been ministering since 2011 as an ordained minister with a heart for community outreach and a deep commitment to pastoral care. He leads the congregation with humility, compassion, and biblical conviction.</p>
                <p>He earned his Postgraduate Diploma in Theology from The Redeemed Christian Bible College (RCBC) and was ordained as a Reverend in 2022. He is married with children and has authored "Understanding the Holy Spirit."</p>
                <div className="leader-contact">
                  <a href="mailto:godvesselsinternational@gmail.com" aria-label="Email Pastor"><i className="fas fa-envelope"></i></a>
                </div>
              </div>
            </div>
          </div>

          <h2 style={{ marginTop: '4rem', textAlign: 'center' }}>Ministry Leaders</h2>
          <div className="leaders-grid">
            {leaders.map(l => (
              <div key={l.name} className="leader-card">
                <div className="leader-image"><Avatar initial={l.initial} /></div>
                <div className="leader-info">
                  <h3>{l.name}</h3>
                  <h4>{l.role}</h4>
                  <p>{l.bio}</p>
                  <div className="leader-contact">
                    <a href="mailto:godvesselsinternational@gmail.com" aria-label={`Email ${l.name}`}><i className="fas fa-envelope"></i></a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="history">
        <div className="container">
          <div className="history-content">
            <div className="history-text">
              <h2>Our Story</h2>
              <p>The name first started as God's Vessels back in 2014 when Rev. Godwin was reading his Bible on a faithful morning. Years before then, he had received a clear message from the Lord that he would be a pastor for His glory. So the name was kept until the appointed time.</p>
              <p>When he came to Canada in 2017, the Holy Spirit led him to start a Bible study group. This group started in 2018 in his living room in Lachine, Quebec with 5 people and later grew to about 15.</p>
              <p>The advent of COVID-19 moved gatherings online, which gave opportunity to new members outside Canada, bringing the number to 28. On December 18, 2021, GVIM was officially incorporated as a non-profit religious organization and has been operating since, also registered as an extra-provincial nonprofit in Edmonton, Alberta.</p>
              <div className="milestones">
                <h3>Key Milestones</h3>
                <ul>
                  <li><strong>2017:</strong> Ministry founded with initial families</li>
                  <li><strong>2018:</strong> Bible study group launched in Lachine, Quebec</li>
                  <li><strong>2020:</strong> Online ministry and live streaming launched</li>
                  <li><strong>2021:</strong> Officially incorporated as a non-profit</li>
                  <li><strong>2022:</strong> Youth ministry and community outreach centre opened</li>
                  <li><strong>2023:</strong> International missions program established</li>
                </ul>
              </div>
            </div>
            <div className="history-stats">
              <div className="stat"><h3>25+</h3><p>Active Members</p></div>
              <div className="stat"><h3>6+</h3><p>Ministry Teams</p></div>
              <div className="stat"><h3>1000+</h3><p>Lives Impacted</p></div>
              <div className="stat"><h3>8</h3><p>Years of Ministry</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="service-times">
        <div className="container">
          <h2>Join Us for Worship</h2>
          <div className="times-grid">
            {services.map((s, i) => (
              <div key={i} className={`time-card${s.special ? ' special-service' : ''}`}>
                <i className={`fas ${s.icon} fa-2x`}></i>
                <h3>{s.h}</h3><p>{s.p}</p><span className="time">{s.t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
