/* Leadership. `photo` is intentionally optional: until real headshots exist the
   UI falls back to initials on a flat tile, which reads as deliberate rather
   than broken. Drop files in public/img/team/ and set `photo` to the path. */

export interface Person {
  name: string;
  role: string;
  bio: string;
  /** e.g. '/img/team/godwin-olutimi.jpg' — omit until a real photo exists. */
  photo?: string;
}

/** Initials for the fallback tile. Handles titles like "Rev." and "Pastor/Prophet". */
export function initials(name: string): string {
  const titles = /^(rev|pastor|prophet|deaconess|deacon|sister|brother|dr|mr|mrs|ms)\.?$/i;
  const words = name
    .replace(/\//g, ' ')
    .split(/\s+/)
    .filter(w => w && !titles.test(w.replace(/\./g, '')));
  const letters = words.filter(w => /[a-z]/i.test(w[0])).map(w => w[0].toUpperCase());
  return letters.slice(0, 2).join('') || name[0].toUpperCase();
}

export const leadPastor: Person = {
  name: 'Rev. Godwin B.B. Olutimi',
  role: 'Lead Pastor',
  bio: 'Currently serving as the Lead Pastor in God’s Vessels International Ministry, Pastor Godwin has been ministering since 2011 as an ordained minister with a heart for community outreach and a deep commitment to pastoral care. He earned his Postgraduate Diploma in Theology from The Redeemed Christian Bible College and was ordained as a Reverend in 2022. He is married with children and has authored “Understanding the Holy Spirit.”'
};

export const leaders: Person[] = [
  { name: 'Deaconess Adetutu A. Olutimi', role: 'Director, Family Affairs and Welfare', bio: 'Oversees all matters relating to family support, member welfare, and community care within the ministry.' },
  { name: 'Pastor/Prophet Shina Oladimeji', role: 'Director of Bible Studies', bio: 'Leads the ministry’s Bible teaching and scriptural training, ensuring all teachings are rooted in sound doctrine.' },
  { name: 'Boluwatife V. Hammed', role: 'General Secretary', bio: 'Manages the ministry’s communication, documentation, and coordination across departments.' },
  { name: 'Pastor Niyi Adeleye', role: 'Director of Prayer', bio: 'Leads the prayer ministry, organizing intercessory sessions and cultivating a strong culture of prayer and fasting.' },
  { name: 'Sister Ayomipo Adeleye', role: 'Prayer Coordinator, West Africa', bio: 'Oversees all prayer activities in the West Africa region, mobilizing prayer teams and coordinating intercession schedules.' },
  { name: 'Pastor Lawrence Enyi', role: 'Public Affairs Coordinator', bio: 'Manages public engagement, outreach communication, and community representation for the ministry.' },
  { name: 'Sister Lola Akinsanya', role: 'Program Coordinator', bio: 'Responsible for organizing and executing all ministry programs and events, ensuring every service is well-planned.' },
  { name: 'Sister Mosekola Akinbaani', role: 'Assistant Program Coordinator', bio: 'Supports the planning and execution of ministry events, working closely with the Program Coordinator.' },
  { name: 'Brother Jeremiah Olugunju', role: 'Design and Prints', bio: 'Handles all creative design and print production — from flyers to banners and visual branding for the ministry.' }
];

/** Vision / Mission / Values — unchanged copy, moved out of the page. */
export const visionMissionValues = [
  { title: 'Our vision', body: 'In a time marked by rampant falsehood and societal decay, we need a beacon of truth. God’s Vessels International Ministry represents that light. We stand for the Truth and are Vessels of Truth.' },
  { title: 'Our mission', body: 'Our goal is to seek, preach, and live the truth, ensuring that all who listen on this platform receive nothing but the genuine message of God, delivered with passion, patience, and wisdom.' },
  { title: 'Our values', body: 'We value holiness and truth, striving to live righteously and preach the undiluted Word of God, while fostering empathy and togetherness through compassion, unity, and Christ-like love.' }
];

export const pillars = [
  { title: 'Worship', body: 'We believe in the power of authentic worship that touches hearts and transforms lives. Our services are designed to create an atmosphere where people can encounter God’s presence.' },
  { title: 'Word', body: 'The Word of God is our foundation. We are committed to teaching the Bible with accuracy, relevance, and practical application for daily living.' },
  { title: 'Fellowship', body: 'We foster genuine relationships through small groups, ministry teams, and church-wide events that build lasting connections.' },
  { title: 'Service', body: 'Following Christ’s example, we serve our community through outreach programs and missions both locally and globally.' },
  { title: 'Discipleship', body: 'We are committed to helping believers grow through mentoring, training, and equipping programs that develop spiritual maturity.' },
  { title: 'Evangelism', body: 'Sharing the Gospel is at the heart of our mission. We actively reach out with the message of hope and salvation.' }
];

export const story = [
  'The name first started as God’s Vessels back in 2014 when Rev. Godwin was reading his Bible on a faithful morning. Years before then, he had received a clear message from the Lord that he would be a pastor for His glory. So the name was kept until the appointed time.',
  'When he came to Canada in 2017, the Holy Spirit led him to start a Bible study group. This group started in 2018 in his living room in Lachine, Quebec with 5 people and later grew to about 15.',
  'The advent of COVID-19 moved gatherings online, which gave opportunity to new members outside Canada, bringing the number to 28. On December 18, 2021, GVIM was officially incorporated as a non-profit religious organization and has been operating since, also registered as an extra-provincial nonprofit in Edmonton, Alberta.'
];

/* NOTE: the 2017 entry previously read "Ministry founded with initial families",
   which contradicts the story above — Rev. Godwin arrived in Canada in 2017 and
   the group began in 2018. Re-pointed at what the ministry's own account says. */
export const milestones = [
  { year: '2014', text: 'The name God’s Vessels is received' },
  { year: '2017', text: 'Rev. Godwin arrives in Canada' },
  { year: '2018', text: 'Bible study group launched in Lachine, Quebec' },
  { year: '2020', text: 'Online ministry and live streaming launched' },
  { year: '2021', text: 'Officially incorporated as a non-profit' },
  { year: '2022', text: 'Youth ministry and community outreach centre opened' },
  { year: '2023', text: 'International missions program established' }
];

export const stats = [
  { value: '25+',   label: 'Active members' },
  { value: '6+',    label: 'Ministry teams' },
  { value: '1000+', label: 'Lives impacted' },
  { value: '8',     label: 'Years of ministry' }
];

export const testimonies = [
  { name: 'Jeremiah Victor', role: 'Member', quote: 'God’s Vessels International Ministry is literally a family for me. I love especially how genuine love of God runs this family and how we share and learn undiluted truth of God’s Word.' },
  { name: 'Enyi Lawrence O.', role: 'Leader', quote: 'GVIM is a gathering where Jesus is taught and learnt in full righteousness and experience. I’m really blessed to be part of this family.' },
  { name: 'Ajibike Christianah Obayomi', role: 'Member', quote: 'A space where the word of God is taught with clarity. My stay in GVIM has given me more insights and understanding. Glory to God!' },
  { name: 'Adetutu Akorede Olutimi', role: 'Leader', quote: 'GVIM has been a blessing in all ways — spiritual food, physical and financial blessings. GVIM is a game changer for every child of God.' },
  { name: 'Oladimeji Shina', role: 'Leader', quote: 'Being a member of the GVIM family has uplifted my spiritual life. The teachings and prayers have kept my faith alive in Christ Jesus.' },
  { name: 'Hammed Boluwatife Victoria', role: 'Member', quote: 'God has been faithful to me in all ways. God gave me a job last two months. Halleluyah!' }
];
