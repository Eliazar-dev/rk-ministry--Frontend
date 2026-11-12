// slug -> how a resource page looks and which API list it loads (shared by lists, cards and the reader)
export const SECTIONS = {
  sermons: { title: 'Sermon Videos', sub: 'Messages that strengthen faith and spark transformation.', resource: 'sermons', kind: 'video' },
  'sabbath-school': { title: 'Sabbath School Video Lessons', sub: 'Watch each lesson and download the matching PDF study guide.', resource: 'lessons', kind: 'lesson' },
  devotionals: { title: 'Devotionals', sub: 'A word for every day — short, rich and Scripture-centred.', resource: 'devotionals', kind: 'article', engage: 'devotional' },
  blogs: { title: 'Blogs', sub: 'Stories, teaching and reflections from the ministry.', resource: 'blogs', kind: 'article' },
  literature: { title: 'Literature Evangelism', sub: 'Guides, training and testimonies from the field.', resource: 'literature', kind: 'article' },
  'medical-missionary': { title: 'Medical Missionary', sub: 'Health and healing as a bridge to the gospel.', resource: 'medical', kind: 'article' },
  'children-bible-stories': { title: 'Children Bible Stories', sub: 'Colourful stories that plant seeds of faith.', resource: 'children', kind: 'article' },
  ebooks: { title: 'E-Books', sub: 'Free downloadable books for study and mission.', resource: 'ebooks', kind: 'article', pdf: true },
  'mission-gallery': { title: 'Mission Gallery', sub: 'Albums from crusades, baptisms and outreach. Tap an album to see all the photos.', resource: 'gallery', kind: 'gallery' },
};
