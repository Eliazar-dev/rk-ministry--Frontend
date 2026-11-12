// Everything the admin panel knows about each kind of record. The list and form screens are generic and
// built from this file, so adding a field here is all it takes to edit it in the panel.
import { fmtDate, fmtDateTime, money } from './api';

const T = (name, label, extra = {}) => ({ name, label, type: 'text', ...extra });
const IMG = (name, label, srcKey, folder = 'covers') => ({ name, label, type: 'image', srcKey, folder });

export const RESOURCES = {
  hero: {
    label: 'Carousel videos', one: 'carousel video', endpoint: 'hero', sortHint: 'Plays in this order on the home page',
    thumb: 'poster_src', toggles: [['published', 'Shown']],
    columns: [{ key: 'title', label: 'Label', bold: true }, { key: 'order', label: 'Order' }, { key: 'created', label: 'Added', type: 'date' }],
    fields: [
      T('title', 'Label (only you see this)'),
      { name: 'video_url', label: 'Video', type: 'video', folder: 'videos', required: true, help: 'Upload an MP4 (up to 100 MB) or paste a Cloudinary video link.' },
      IMG('poster_url', 'Poster image (optional)', 'poster_src', 'posters'),
      { name: 'order', label: 'Order', type: 'number', default: 1, help: '1 plays first.' },
      { name: 'published', label: 'Show on the website', type: 'bool', default: true },
    ],
  },
  sermons: {
    label: 'Sermons', one: 'sermon', endpoint: 'sermons', thumb: 'cover_src', toggles: [['published', 'Shown']],
    columns: [{ key: 'title', label: 'Title', bold: true }, { key: 'speaker', label: 'Speaker' }, { key: 'date', label: 'Date', type: 'date' }, { key: 'category', label: 'Category' }],
    fields: [
      T('title', 'Title', { required: true }),
      { name: 'youtube_url', label: 'YouTube link', type: 'youtube', required: true, placeholder: 'https://youtu.be/…' },
      T('speaker', 'Speaker', { default: 'Richard Kwanya Snr' }),
      { name: 'date', label: 'Date', type: 'date', required: true },
      T('category', 'Category', { placeholder: 'Faith, Prayer, Hope…' }),
      IMG('cover_url', 'Cover image', 'cover_src'),
      { name: 'description', label: 'Description', type: 'textarea', rows: 3 },
      { name: 'published', label: 'Show on the website', type: 'bool', default: true },
    ],
  },
  lessons: {
    label: 'Sabbath lessons', one: 'lesson', endpoint: 'lessons', thumb: 'cover_src', toggles: [['published', 'Shown']],
    columns: [{ key: 'title', label: 'Title', bold: true }, { key: 'quarter', label: 'Quarter' }, { key: 'date_range', label: 'Week' }, { key: 'start_date', label: 'Starts', type: 'date' }],
    fields: [
      T('title', 'Title', { required: true }),
      T('quarter', 'Quarter', { required: true, placeholder: 'Q4 2026' }),
      T('date_range', 'Dates', { required: true, placeholder: 'Nov 1 – Nov 7' }),
      { name: 'start_date', label: 'Start date (for ordering)', type: 'date', required: true },
      T('teacher', 'Teacher', { default: 'Richard Kwanya Snr' }),
      { name: 'youtube_url', label: 'YouTube lesson video', type: 'youtube', required: true },
      { name: 'pdf_url', label: 'Lesson PDF', type: 'raw', srcKey: 'pdf_src', folder: 'pdfs', help: 'Upload a PDF (up to 40 MB) or paste a link.' },
      IMG('cover_url', 'Cover image', 'cover_src'),
      { name: 'description', label: 'Description', type: 'textarea', rows: 3 },
      { name: 'published', label: 'Show on the website', type: 'bool', default: true },
    ],
  },
  devotionals: {
    label: 'Devotionals', one: 'devotional', endpoint: 'devotionals', thumb: 'cover_src', toggles: [['published', 'Shown']],
    columns: [{ key: 'title', label: 'Title', bold: true }, { key: 'author', label: 'Author' }, { key: 'date', label: 'Date', type: 'date' }, { key: 'scripture', label: 'Scripture' }],
    fields: [
      T('title', 'Title', { required: true }),
      T('author', 'Author', { default: 'Richard Kwanya Snr', required: true }),
      { name: 'date', label: 'Date', type: 'date', required: true },
      T('scripture', 'Scripture', { placeholder: 'Psalm 5:3' }),
      T('category', 'Category', { default: 'Daily' }),
      { name: 'excerpt', label: 'Short summary', type: 'textarea', rows: 2, max: 300 },
      { name: 'body', label: 'Devotional text', type: 'textarea', rows: 12, required: true, help: 'Leave a blank line between paragraphs.' },
      IMG('cover_url', 'Cover image', 'cover_src'),
      { name: 'published', label: 'Show on the website', type: 'bool', default: true },
    ],
  },
  articles: {
    label: 'Articles', one: 'article', endpoint: 'articles', thumb: 'cover_src', toggles: [['published', 'Shown']],
    sections: [['', 'All'], ['blog', 'Blogs'], ['literature', 'Literature'], ['medical', 'Medical'], ['children', 'Children'], ['ebook', 'E-books']],
    columns: [{ key: 'title', label: 'Title', bold: true }, { key: 'section', label: 'Section', type: 'badge' }, { key: 'author', label: 'Author' }, { key: 'date', label: 'Date', type: 'date' }],
    fields: [
      { name: 'section', label: 'Section', type: 'select', required: true, default: 'blog', options: [['blog', 'Blog'], ['literature', 'Literature Evangelism'], ['medical', 'Medical Missionary'], ['children', 'Children Bible Story'], ['ebook', 'E-Book']] },
      T('title', 'Title', { required: true }),
      T('author', 'Author', { default: 'Richard Kwanya Snr' }),
      { name: 'date', label: 'Date', type: 'date', required: true },
      T('category', 'Category'),
      { name: 'excerpt', label: 'Short summary', type: 'textarea', rows: 2, max: 300 },
      { name: 'body', label: 'Full text', type: 'textarea', rows: 12, help: 'Leave a blank line between paragraphs. Optional for e-books.' },
      { name: 'pdf_url', label: 'PDF (for e-books)', type: 'raw', srcKey: 'pdf_src', folder: 'pdfs' },
      IMG('cover_url', 'Cover image', 'cover_src'),
      { name: 'published', label: 'Show on the website', type: 'bool', default: true },
    ],
  },
  albums: {
    label: 'Gallery albums', one: 'album', endpoint: 'albums', thumb: 'cover_src', toggles: [['published', 'Shown']],
    columns: [{ key: 'title', label: 'Mission', bold: true }, { key: 'date', label: 'Date', type: 'date' }, { key: 'location', label: 'Place' }],
    fields: [
      T('title', 'Mission name', { required: true }),
      { name: 'date', label: 'Date', type: 'date', required: true },
      T('location', 'Place'),
      T('description', 'Short note', { max: 300 }),
      { name: 'photos_url', label: 'Photo album link', type: 'url', https: true, required: true, placeholder: 'https://yourname.pixieset.com/…', help: 'Pixieset, Google Photos, etc. Photos are NOT stored on this website, only the cover image.' },
      IMG('cover_url', 'Album cover image', 'cover_src', 'albums'),
      { name: 'published', label: 'Show on the website', type: 'bool', default: true },
    ],
  },
  products: {
    label: 'Products', one: 'product', endpoint: 'products', thumb: 'image_src', toggles: [['active', 'For sale']],
    columns: [{ key: 'name', label: 'Name', bold: true }, { key: 'price', label: 'Price', type: 'money' }, { key: 'created', label: 'Added', type: 'date' }],
    fields: [
      T('name', 'Product name', { required: true }),
      { name: 'price', label: 'Price (KES)', type: 'number', required: true, min: 1 },
      { name: 'description', label: 'Description', type: 'textarea', rows: 4, required: true },
      IMG('image_url', 'Product image', 'image_src', 'products'),
      { name: 'active', label: 'Available in the store', type: 'bool', default: true },
    ],
  },
  prayers: {
    label: 'Prayer requests', one: 'prayer request', endpoint: 'prayers', readOnly: true, toggles: [['prayed_for', 'Prayed for']],
    columns: [{ key: 'name', label: 'From', bold: true }, { key: 'request', label: 'Request', type: 'clip' }, { key: 'created', label: 'Received', type: 'datetime' }],
    detail: (r) => [['Name', r.name], ['Email', <a key="m" href={`mailto:${r.email}`}>{r.email}</a>], ['Request', r.request]],
  },
  messages: {
    label: 'Contact messages', one: 'message', endpoint: 'messages', readOnly: true, toggles: [['handled', 'Handled']],
    columns: [{ key: 'name', label: 'From', bold: true }, { key: 'message', label: 'Message', type: 'clip' }, { key: 'created', label: 'Received', type: 'datetime' }],
    detail: (r) => [['Name', r.name], ['Email', <a key="m" href={`mailto:${r.email}?subject=Re: your message`}>{r.email} (reply)</a>], ['Message', r.message]],
  },
  comments: {
    label: 'Comments', one: 'comment', endpoint: 'comments', readOnly: true, toggles: [['approved', 'Visible']],
    kinds: [['', 'All'], ['sermon', 'Sermons'], ['lesson', 'Lessons'], ['devotional', 'Devotionals']],
    columns: [{ key: 'member', label: 'Member', bold: true }, { key: 'text', label: 'Comment', type: 'clip' }, { key: 'target', label: 'On' }, { key: 'created', label: 'Posted', type: 'datetime' }],
    detail: (r) => [['Member', `${r.member} (${r.member_email})`], ['On', `${r.kind}: ${r.target || '—'}`], ['Comment', r.text]],
  },
  orders: {
    label: 'Orders', one: 'order', endpoint: 'orders', readOnly: true, noDelete: true, statuses: true,
    columns: [{ key: 'ref', label: 'Ref', bold: true }, { key: 'name', label: 'Customer' }, { key: 'amount', label: 'Amount', type: 'money' }, { key: 'status', label: 'Status', type: 'status' }, { key: 'created', label: 'Placed', type: 'datetime' }],
    actions: [{ label: 'Mark as paid', path: 'mark-paid', when: (r) => r.status !== 'paid', ask: 'M-Pesa receipt code (optional)' }],
    detail: (r) => [
      ['Customer', `${r.name} · ${r.email}`], ['Phone', r.phone], ['Delivery', r.location],
      ['M-Pesa receipt', r.mpesa_receipt || '—'], r.failure_reason && ['Problem', r.failure_reason],
      ['Items', <ul key="i" className="a-items">{r.items.map((i, n) => <li key={n}>{i.name} × {i.qty} — {money(i.price * i.qty)}</li>)}</ul>],
    ].filter(Boolean),
  },
  donations: {
    label: 'Donations', one: 'donation', endpoint: 'donations', readOnly: true, noDelete: true, statuses: true,
    columns: [{ key: 'name', label: 'Donor', bold: true }, { key: 'amount', label: 'Amount', type: 'money' }, { key: 'status', label: 'Status', type: 'status' }, { key: 'created', label: 'Date', type: 'datetime' }],
    actions: [{ label: 'Mark as paid', path: 'mark-paid', when: (r) => r.status !== 'paid', ask: 'M-Pesa receipt code (optional)' }],
    detail: (r) => [['Donor', `${r.name}${r.email ? ' · ' + r.email : ''}`], ['Phone', r.phone], ['M-Pesa receipt', r.mpesa_receipt || '—'], r.failure_reason && ['Problem', r.failure_reason]].filter(Boolean),
  },
  members: {
    label: 'Members', one: 'member', endpoint: 'members', readOnly: true, noDelete: true, toggles: [['is_active', 'Active']],
    columns: [{ key: 'name', label: 'Name', bold: true }, { key: 'email', label: 'Email' }, { key: 'is_staff', label: 'Role', type: 'role' }, { key: 'date_joined', label: 'Joined', type: 'date' }],
    detail: (r) => [['Name', r.name], ['Email', r.email], ['Joined', fmtDateTime(r.date_joined)], ['Last sign-in', fmtDateTime(r.last_login)]],
  },
};

export const PASTOR = {
  label: 'Pastor biography', endpoint: 'pastor',
  fields: [
    T('name', 'Name', { default: 'Richard Kwanya Snr', required: true }),
    T('title', 'Title', { placeholder: 'e.g. Evangelist & Founder' }),
    IMG('photo_url', 'Photo', 'photo_src', 'pastor'),
    { name: 'short_intro', label: 'Short introduction', type: 'textarea', rows: 3, max: 300 },
    { name: 'quote', label: 'Favourite quote or verse (optional)', type: 'textarea', rows: 2, max: 300 },
    { name: 'biography', label: 'Biography', type: 'textarea', rows: 14, help: 'Leave a blank line between paragraphs.' },
  ],
};

export const NAV = [
  ['Overview', [['', 'Dashboard', 'LayoutDashboard']]],
  ['Content', [['hero', 'Carousel videos', 'Film'], ['sermons', 'Sermons', 'Video'], ['lessons', 'Sabbath lessons', 'BookOpen'], ['devotionals', 'Devotionals', 'Sunrise'], ['articles', 'Articles', 'Newspaper'], ['albums', 'Gallery albums', 'Images'], ['pastor', 'Pastor biography', 'UserRound']]],
  ['Store', [['products', 'Products', 'Package'], ['orders', 'Orders', 'ShoppingBag'], ['donations', 'Donations', 'HeartHandshake']]],
  ['Community', [['prayers', 'Prayer requests', 'HandHeart'], ['messages', 'Contact messages', 'Mail'], ['comments', 'Comments', 'MessageSquare'], ['members', 'Members', 'Users']]],
];

export const formatCell = (col, row) => {
  const v = row[col.key];
  switch (col.type) {
    case 'date': return fmtDate(v);
    case 'datetime': return fmtDateTime(v);
    case 'money': return money(v);
    default: return v ?? '—';
  }
};
