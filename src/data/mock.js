// Demo content used until the Django API is connected (set VITE_API_URL).
// Field names mirror what the admin will manage.

const img = (seed) => `https://picsum.photos/seed/${seed}/800/500`;

export const heroSlides = [
  {
    id: 1,
    video: 'https://res.cloudinary.com/dtoxfbfr/video/upload/v1794340688/YTSave.to_YouTube_Media_OwtCx7vlQpQ_HOPE-TO-THE-HOPELESS-Pr-Kwanya-Richard-Snr-HPM-MEDIA-OFFICIAL-VIDEO-4K-VIDEO_003_360p_online-video-cutter.com.mp4',
    poster: '',
  },
  {
    id: 2,
    video: 'https://res.cloudinary.com/dtoxfbfr/video/upload/v1794337983/YTSave.to_YouTube_Media_LWpGMD1tmkk_THE-BOOK-OF-JOHN-Pr-Kwanya-Richard-Snr-HPM-MEDIA-4K-OFFICIAL-VIDEO_001_1080p_online-video-cutter.com.mp4',
    poster: '',
  },
];

export const sermons = [
  { id: 1, title: 'Walking in Faith When You Cannot See', speaker: 'Richard Kwanya Snr', date: '2026-10-25', cover: img('sermon1'), youtube: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', likes: 124, category: 'Faith' },
  { id: 2, title: 'The Power of a Surrendered Life', speaker: 'Richard Kwanya Snr', date: '2026-10-18', cover: img('sermon2'), youtube: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', likes: 98, category: 'Surrender' },
  { id: 3, title: 'Hope Beyond the Storm', speaker: 'Richard Kwanya Snr', date: '2026-10-11', cover: img('sermon3'), youtube: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', likes: 143, category: 'Hope' },
  { id: 4, title: 'Prayer That Moves Mountains', speaker: 'Richard Kwanya Snr', date: '2026-10-04', cover: img('sermon4'), youtube: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', likes: 76, category: 'Prayer' },
  { id: 5, title: 'Grace That Restores', speaker: 'Richard Kwanya Snr', date: '2026-09-27', cover: img('sermon5'), youtube: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', likes: 88, category: 'Grace' },
  { id: 6, title: 'Called to Serve', speaker: 'Richard Kwanya Snr', date: '2026-09-20', cover: img('sermon6'), youtube: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', likes: 65, category: 'Service' },
];

export const lessons = [
  { id: 1, title: 'Lesson 6: Faith That Works', quarter: 'Q4 2026', dateRange: 'Nov 1 – Nov 7', cover: img('lesson1'), pdf: '#', youtube: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', teacher: 'Richard Kwanya Snr', category: 'Q4 2026' },
  { id: 2, title: 'Lesson 5: Living by Grace', quarter: 'Q4 2026', dateRange: 'Oct 25 – Oct 31', cover: img('lesson2'), pdf: '#', youtube: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', teacher: 'Richard Kwanya Snr', category: 'Q4 2026' },
  { id: 3, title: 'Lesson 4: The Great Controversy', quarter: 'Q4 2026', dateRange: 'Oct 18 – Oct 24', cover: img('lesson3'), pdf: '#', youtube: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', teacher: 'Richard Kwanya Snr', category: 'Q4 2026' },
  { id: 4, title: 'Lesson 3: Rest in Christ', quarter: 'Q4 2026', dateRange: 'Oct 11 – Oct 17', cover: img('lesson4'), pdf: '#', youtube: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', teacher: 'Richard Kwanya Snr', category: 'Q4 2026' },
  { id: 5, title: 'Lesson 2: The Call to Obedience', quarter: 'Q4 2026', dateRange: 'Oct 4 – Oct 10', cover: img('lesson5'), pdf: '#', youtube: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', teacher: 'Richard Kwanya Snr', category: 'Q4 2026' },
  { id: 6, title: 'Lesson 1: Foundations', quarter: 'Q4 2026', dateRange: 'Sep 27 – Oct 3', cover: img('lesson6'), pdf: '#', youtube: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', teacher: 'Richard Kwanya Snr', category: 'Q3 2026' },
];

export const devotionals = [
  { id: 1, title: 'Morning Strength', author: 'Richard Kwanya Snr', date: '2026-11-04', cover: img('dev1'), excerpt: 'Begin each day by placing your plans in the hands of the One who holds tomorrow.', scripture: 'Psalm 5:3', category: 'Daily' },
  { id: 2, title: 'Peace in the Waiting', author: 'Grace Wanjiru', date: '2026-11-03', cover: img('dev2'), excerpt: 'Waiting is not wasted time when God is working behind the scenes.', scripture: 'Isaiah 40:31', category: 'Daily' },
  { id: 3, title: 'A Heart of Gratitude', author: 'Richard Kwanya Snr', date: '2026-11-02', cover: img('dev3'), excerpt: 'Gratitude turns what we have into enough, and enough into abundance.', scripture: '1 Thess 5:18', category: 'Weekly' },
  { id: 4, title: 'Walking in Light', author: 'Samuel Otieno', date: '2026-11-01', cover: img('dev4'), excerpt: 'The path of the righteous grows brighter until the full light of day.', scripture: 'Proverbs 4:18', category: 'Daily' },
  { id: 5, title: 'Anchored in Hope', author: 'Richard Kwanya Snr', date: '2026-10-31', cover: img('dev5'), excerpt: 'Hope is the anchor that keeps the soul steady in every storm.', scripture: 'Hebrews 6:19', category: 'Weekly' },
  { id: 6, title: 'Rest for the Weary', author: 'Grace Wanjiru', date: '2026-10-30', cover: img('dev6'), excerpt: 'Come to Him, all who are tired, and find rest for your soul.', scripture: 'Matthew 11:28', category: 'Daily' },
];

const articles = (prefix, titles, author = 'Richard Kwanya Snr') =>
  titles.map(([title, category, excerpt], i) => ({
    id: i + 1,
    title,
    author,
    date: `2026-10-${String(28 - i * 3).padStart(2, '0')}`,
    cover: img(`${prefix}${i}`),
    excerpt,
    category,
  }));

export const blogs = articles('blog', [
  ['Why Every Believer Is a Missionary', 'Evangelism', 'Mission is not a department — it is a lifestyle for every follower of Christ.'],
  ['Raising a Family Altar', 'Family', 'Simple habits that turn your home into a place of worship.'],
  ['Hearing God in a Noisy World', 'Spiritual Growth', 'Practical ways to quiet the noise and listen.'],
  ['Stewardship Beyond Money', 'Stewardship', 'Time, talents, health and treasure — all belong to God.'],
  ['Youth and the Mission', 'Youth', 'How young people are changing communities with the gospel.'],
  ['Small Groups That Grow', 'Church Life', 'Building discipleship circles that last.'],
]);

export const literature = articles('lit', [
  ['Door-to-Door Evangelism Guide', 'Guides', 'A friendly approach to sharing literature in your neighbourhood.'],
  ['Colporteur Testimonies', 'Testimonies', 'Real stories of lives changed through printed pages.'],
  ['Training Your Team', 'Training', 'Equip volunteers for effective literature outreach.'],
  ['Choosing the Right Book', 'Guides', 'Matching literature to the needs of each home.'],
  ['Follow-Up That Works', 'Training', 'Turn first contact into lasting friendship and Bible study.'],
  ['Reaching Rural Communities', 'Field Notes', 'Lessons from the field in remote areas.'],
]);

export const medical = articles('med', [
  ['Eight Laws of Health', 'Lifestyle', 'The simple remedies God gave for whole-person health.'],
  ['Community Health Outreach', 'Outreach', 'Free clinics and screenings as a doorway to the gospel.'],
  ['Nutrition on a Budget', 'Nutrition', 'Plant-rich meals that nourish families affordably.'],
  ['Mental Wellness and Faith', 'Wellness', 'Caring for the mind while trusting the Healer.'],
  ['First Aid Basics', 'Training', 'Skills every church member should know.'],
  ['Water Therapy at Home', 'Lifestyle', 'Everyday uses of water for healing and refreshment.'],
], 'Medical Missionary Team');

export const children = articles('kids', [
  ['David and Goliath', 'Old Testament', 'A little shepherd boy trusts a big God.'],
  ['Noah and the Ark', 'Old Testament', 'A big boat, lots of animals, and one faithful family.'],
  ['Daniel in the Lions’ Den', 'Old Testament', 'Daniel prays, and God shuts the lions’ mouths.'],
  ['Jesus Loves the Children', 'New Testament', 'Jesus welcomes every child with open arms.'],
  ['The Good Samaritan', 'Parables', 'Who is my neighbour? Everyone who needs help.'],
  ['Jonah and the Big Fish', 'Old Testament', 'You cannot run from God’s love.'],
], 'Children’s Ministry');

export const ebooks = articles('ebook', [
  ['Steps to Christ Study Companion', 'Devotional', 'A guided companion for personal study.'],
  ['The Evangelist’s Handbook', 'Mission', 'A practical manual for public evangelism.'],
  ['Prayer Journal Template', 'Journal', 'A printable 30-day prayer journal.'],
  ['Family Worship Ideas', 'Family', 'Fifty creative ideas for family devotion.'],
  ['Bible Study Starter Guide', 'Study', 'Twelve lessons for new believers.'],
  ['Health & Wholeness', 'Health', 'A simple guide to whole-person wellness.'],
]).map((e) => ({ ...e, pdf: '#' }));

const MISSIONS = ['Crusade Day One', 'Baptism Sabbath', 'Medical Camp', 'Kids Programme', 'Village Outreach', 'Youth Rally'];
export const gallery = MISSIONS.map((title, i) => ({
  id: i + 1,
  title,
  date: `2026-${String(10 - i).padStart(2, '0')}-1${i}`,
  year: 2026,
  location: ['Eldoret', 'Nakuru', 'Kisumu', 'Nairobi', 'Kericho', 'Kitale'][i],
  description: '',
  cover: `https://picsum.photos/seed/rkalbum${i}/800/600`,
  link: 'https://www.pixieset.com/',
}));

export const about = {
  name: 'Richard Kwanya Snr',
  title: 'Evangelist & Founder',
  photo: '',
  intro: 'Biography coming soon.',
  biography: '',
  quote: '',
};

export const products = [
  { id: 1, name: 'Study Bible (NKJV)', price: 2500, image: img('prod1'), description: 'Large-print study Bible with cross references and notes.' },
  { id: 2, name: 'Sabbath School Quarterly Pack', price: 600, image: img('prod2'), description: 'Complete set of this quarter’s study guides.' },
  { id: 3, name: '#Babawa T-Shirt', price: 1200, image: img('prod3'), description: 'Premium cotton tee in navy with gold print.' },
  { id: 4, name: 'Prayer Journal', price: 800, image: img('prod4'), description: 'Hardcover journal with guided prayer prompts.' },
  { id: 5, name: 'Evangelism Tract Bundle (100)', price: 1500, image: img('prod5'), description: 'Bundle of 100 full-colour tracts for outreach.' },
  { id: 6, name: 'Ministry Branded Mug', price: 700, image: img('prod6'), description: 'Ceramic mug with gold ministry emblem.' },
];

export const resources = {
  hero: heroSlides,
  sermons,
  lessons,
  devotionals,
  blogs,
  literature,
  medical,
  children,
  ebooks,
  gallery,
  products,
  about,
};
