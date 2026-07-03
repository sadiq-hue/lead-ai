import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '..', '.env') });

const provider = process.env.AI_PROVIDER || 'rule';

const industryTemplates = {
  salon: {
    services: 'We offer haircuts, styling, coloring, braiding, and treatments. What service are you interested in?',
    pricing: { haircut: 'A standard haircut is KES 500, and a precision cut with styling is KES 1,200.', styling: 'Blow-dry and styling starts at KES 800.', coloring: 'Full color starts at KES 2,500, and highlights from KES 1,500.', braiding: 'Braiding starts at KES 600 depending on the style.', treatment: 'Deep conditioning treatments start at KES 800.', fallback: 'Our prices vary by service. Could you let me know what you need done?' },
    booking: 'I can book you in. We have slots at {times}. Which works best for you?',
    hours: 'We are open Monday to Saturday, 8am to 7pm. We are closed on Sundays.',
    location: null,
    fallback: 'Thank you for reaching out! How can I help you today? Would you like to know about our services, pricing, or book an appointment?',
  },
  healthcare: {
    services: 'We offer general consultations, dental care, optical services, lab tests, and specialist referrals. What are you looking for?',
    pricing: { consultation: 'A standard consultation is KES 1,500.', dental: 'Dental checkup is KES 2,000, and cleaning is KES 3,000.', optical: 'Eye test is KES 1,000. Glasses start from KES 3,500.', lab: 'Lab test prices depend on the test required.', fallback: 'Our fees depend on the service. Can you let me know what you need?' },
    booking: 'I can schedule an appointment for you. Available slots are {times}. Which time works?',
    hours: 'We are open Monday to Friday, 7am to 6pm, and Saturday 8am to 2pm.',
    location: null,
    fallback: 'Thank you for contacting us. How can we help? Would you like to book an appointment or inquire about a specific service?',
  },
  restaurant: {
    services: 'We serve lunch, dinner, and have a full drinks menu. We also offer catering for events.',
    pricing: { mains: 'Main courses range from KES 600 to KES 1,800.', drinks: 'Drinks start from KES 150.', catering: 'Catering depends on the menu and number of guests. Shall I connect you with our events team?' },
    booking: 'I can make a reservation for you. We have availability at {times}. How many guests will be joining?',
    hours: 'We are open daily from 11am to 10pm. Kitchen closes at 9pm.',
    location: null,
    fallback: 'Welcome! Would you like to make a reservation, check our menu, or ask about something else?',
  },
  retail: {
    services: 'We stock a range of products including {products}. What are you looking for today?',
    pricing: { fallback: 'Prices depend on the product. Could you let me know what you are interested in?' },
    booking: null,
    hours: 'We are open Monday to Saturday, 9am to 6pm, and Sunday 10am to 4pm.',
    location: null,
    fallback: 'Hello! Welcome. Let me know if you need help finding something or have any questions.',
  },
  fitness: {
    services: 'We offer gym membership, personal training, group classes (yoga, zumba, spin), and nutrition coaching.',
    pricing: { membership: 'Monthly membership is KES 3,000. Annual is KES 30,000.', training: 'Personal training sessions start at KES 1,000 per session.', classes: 'Group classes are KES 400 per session or included in premium membership.' },
    booking: 'I can book you a trial class or a session with a trainer. Available slots are {times}.',
    hours: 'We are open Monday to Saturday, 5am to 9pm, and Sunday 7am to 5pm.',
    location: null,
    fallback: 'Thanks for your interest! Would you like to know about membership plans, class schedules, or book a free trial?',
  },
  automotive: {
    services: 'We offer car repair, servicing, tire change, diagnostics, and spare parts.',
    pricing: { servicing: 'Standard service starts at KES 3,000.', repair: 'Repair costs depend on the issue. We can give a free diagnostic first.', tires: 'Tire prices vary by size and brand. Starting from KES 4,500 each.' },
    booking: 'I can book you in for a service. Available slots are {times}. How long do you expect it might take?',
    hours: 'We are open Monday to Saturday, 7:30am to 6pm.',
    location: null,
    fallback: 'How can we help with your vehicle? Need a service, repair, or something else?',
  },
  education: {
    services: 'We offer tutoring, exam prep, music lessons, and skill courses for all ages.',
    pricing: { tutoring: 'Tutoring starts at KES 500 per hour.', courses: 'Course fees depend on the program. Which subject interests you?', music: 'Music lessons are KES 1,000 for 45 minutes.' },
    booking: 'I can schedule a trial class. Available times are {times}.',
    hours: 'We are open Monday to Friday, 8am to 7pm, and Saturday 9am to 3pm.',
    location: null,
    fallback: 'Thank you for reaching out! What subject or skill would you like to learn about?',
  },
  cleaning: {
    services: 'We offer home cleaning, office cleaning, deep cleaning, and carpet cleaning.',
    pricing: { home: 'Home cleaning starts at KES 2,500 for a standard 2-bedroom.', office: 'Office cleaning is quoted based on square footage.', deep: 'Deep cleaning starts at KES 5,000.', carpet: 'Carpet cleaning is KES 500 per seat or KES 200 per sqm.' },
    booking: 'I can schedule a cleaning for you. Available slots are {times}. What type of cleaning do you need?',
    hours: 'We operate Monday to Saturday, 7am to 6pm.',
    location: null,
    fallback: 'Thanks for reaching out! What kind of cleaning service are you looking for?',
  },
  technology: {
    services: 'We offer phone repair, laptop repair, software installation, and IT support.',
    pricing: { phone: 'Phone screen repair starts at KES 2,000.', laptop: 'Laptop diagnostics are KES 500. Repairs vary.', software: 'Software installation starts at KES 1,000.' },
    booking: 'I can book you in for a repair. Available times are {times}.',
    hours: 'We are open Monday to Saturday, 9am to 7pm.',
    location: null,
    fallback: 'Hi there! What device or issue are you having? I can check if we can help.',
  },
  agriculture: {
    services: 'We supply seeds, fertilizers, farm equipment, and offer farm consultation.',
    pricing: { seeds: 'Seed prices depend on the crop. Which crop are you planting?', fertilizer: 'Fertilizer starts at KES 2,500 per bag.', equipment: 'Equipment prices vary. What do you need?' },
    booking: 'I can arrange a farm visit or delivery. When would be convenient for you?',
    hours: 'We are open Monday to Saturday, 7am to 5pm.',
    location: null,
    fallback: 'Hello! How can we support your farming needs today?',
  },
  logistics: {
    services: 'We offer parcel delivery, freight, courier services, and warehousing.',
    pricing: { parcel: 'Local parcel delivery starts at KES 300.', freight: 'Freight pricing depends on weight and distance.', courier: 'Same-day courier starts at KES 500 within town.' },
    booking: 'I can arrange a pickup. What time works for you? Available slots are {times}.',
    hours: 'We operate Monday to Saturday, 7am to 7pm.',
    location: null,
    fallback: 'Thanks for contacting us! What would you like to send, and where is it going?',
  },
  hospitality: {
    services: 'We offer rooms, conference facilities, and event hosting.',
    pricing: { room: 'Standard rooms start at KES 4,500 per night.', conference: 'Conference hall hire starts at KES 15,000 per day.', event: 'Event packages depend on the number of guests and menu.' },
    booking: 'I can check availability for you. When are you planning to visit?',
    hours: 'We are open 24 hours. Check-in is at 2pm, check-out at 11am.',
    location: null,
    fallback: 'Welcome! How can we assist you with your stay or event?',
  },
  financial: {
    services: 'We offer loans, savings accounts, remittance services, and financial advisory.',
    pricing: { loan: 'Loan interest starts at 12% per annum. Amount depends on your credit history.', savings: 'Savings accounts earn up to 8% interest per annum.', remittance: 'Remittance fee is 2% of the amount sent.' },
    booking: 'I can schedule a consultation with one of our advisors. Available times are {times}.',
    hours: 'We are open Monday to Friday, 8am to 5pm, and Saturday 9am to 1pm.',
    location: null,
    fallback: 'Thank you for reaching out. How can we help with your financial needs today?',
  },
};

const defaultTemplates = {
  services: 'We offer a variety of products and services. What are you looking for?',
  pricing: { fallback: 'Could you let me know which product or service you are interested in?' },
  booking: null,
  hours: 'We are open Monday to Friday, 9am to 5pm.',
  location: null,
  fallback: 'Hello! How can I help you today?',
};

const serviceKeywords = {
  haircut: ['haircut', 'cut', 'trim', 'fade', 'buzz'],
  styling: ['styling', 'blow dry', 'blowdry', 'blow-dry', 'set'],
  coloring: ['color', 'colour', 'dye', 'bleach', 'highlight', 'ombre', 'balayage'],
  braiding: ['braid', 'plait', 'cornrow', 'twist', 'dread'],
  treatment: ['treatment', 'condition', 'repair', 'mask', 'deep condition', 'protein'],
  manicure: ['manicure', 'nail', 'polish', 'gel'],
  pedicure: ['pedicure', 'foot', 'toe'],
  consultation: ['consult', 'checkup', 'visit', 'check-up', 'appointment with doctor'],
  dental: ['dental', 'tooth', 'teeth', 'dentist'],
  optical: ['eye', 'glasses', 'vision', 'optical', 'sight'],
  lab: ['lab', 'blood test', 'test results'],
  membership: ['membership', 'gym', 'subscription', 'join', 'sign up'],
  training: ['train', 'coach', 'personal', 'personal trainer'],
  classes: ['class', 'yoga', 'zumba', 'spin', 'pilates'],
  servicing: ['car service', 'oil change', 'repair', 'fix', 'maintenance'],
  tires: ['tire', 'tyre', 'wheel'],
  home: ['home', 'house cleaning'],
  office: ['office cleaning'],
  deep: ['deep clean'],
  carpet: ['carpet', 'rug'],
  phone: ['screen', 'phone', 'cracked', 'crack'],
  laptop: ['laptop', 'computer', 'pc', 'macbook'],
  software: ['software', 'install', 'virus'],
  seeds: ['seed', 'plant', 'crop'],
  fertilizer: ['fertilizer', 'fert', 'manure'],
  equipment: ['equipment', 'tool', 'machine', 'tractor'],
  parcel: ['parcel', 'package', 'small package'],
  freight: ['freight', 'cargo', 'bulk', 'shipping'],
  courier: ['courier', 'same-day', 'express'],
  room: ['room', 'stay', 'accommodation', 'hotel'],
  conference: ['conference', 'meeting room', 'hall', 'boardroom'],
  event: ['event', 'party', 'wedding', 'birthday'],
  loan: ['loan', 'borrow', 'credit', 'financing'],
  savings: ['saving', 'deposit', 'account', 'bank'],
  remittance: ['remit', 'send money', 'transfer', 'send'],
  mains: ['mains', 'main course', 'meal', 'food', 'dinner', 'lunch'],
  drinks: ['drink', 'beverage', 'soda', 'juice', 'beer', 'wine'],
  catering: ['cater', 'catering'],
  tutoring: ['tutor', 'lesson', 'class', 'subject'],
  courses: ['course', 'program', 'certificate', 'diploma'],
  music: ['music', 'piano', 'guitar', 'drum', 'violin'],
};

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

function fuzzyMatchAny(word, keywords, maxDist = 1) {
  if (word.length <= 3) return false;
  return keywords.some(kw => {
    if (Math.abs(word.length - kw.length) > maxDist + 1) return false;
    return levenshtein(word.toLowerCase(), kw.toLowerCase()) <= maxDist;
  });
}

function words(message) {
  return message.toLowerCase().split(/\s+/).filter(Boolean);
}

const dayWords = ['today', 'tomorrow', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const daySlots = ['today', 'tomorrow', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickSlots(count = 3, exclude = []) {
  const now = new Date();
  const currentHour = now.getHours();
  const slots = [];
  for (let h = 9; h <= 18; h++) {
    if (h > currentHour) {
      slots.push(h <= 12 ? `${h}am` : `${h - 12}pm`);
    }
  }
  const available = slots.filter(t => !exclude.includes(t));
  const pool = available.length >= count ? available : ['10am', '11am', '12pm', '2pm', '3pm', '4pm'];
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const day = pick(daySlots);
  return { day, times: shuffled.slice(0, count) };
}

function cleanTitle(title) {
  return title.replace(/_/g, ' ').replace(/\.\w+$/, '').replace(/\s+/g, ' ').trim();
}

function generateCalendarUrl(meetingUrl, name, confirmedTime) {
  const now = new Date();
  const dayMap = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
  let eventDate = new Date(now);

  if (confirmedTime) {
    const ct = confirmedTime.toLowerCase();
    if (ct.includes('today')) {
      // keep today
    } else if (ct.includes('tomorrow')) {
      eventDate.setDate(eventDate.getDate() + 1);
    } else {
      for (const [dayName, dayIdx] of Object.entries(dayMap)) {
        if (ct.includes(dayName)) {
          const diff = (dayIdx - eventDate.getDay() + 7) % 7;
          eventDate.setDate(eventDate.getDate() + (diff || 7));
          break;
        }
      }
    }
    const timeMatch = ct.match(/(\d{1,2})\s*(?::\s*(\d{2}))?\s*(am|pm)\b/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      const period = timeMatch[3].toLowerCase();
      if (period === 'pm' && hours < 12) hours += 12;
      if (period === 'am' && hours === 12) hours = 0;
      eventDate.setHours(hours, minutes, 0, 0);
    }
  }

  const pad = (n) => String(n).padStart(2, '0');
  const startStr = `${eventDate.getFullYear()}${pad(eventDate.getMonth() + 1)}${pad(eventDate.getDate())}T${pad(eventDate.getHours())}${pad(eventDate.getMinutes())}00`;
  const endDate = new Date(eventDate.getTime() + 60 * 60 * 1000);
  const endStr = `${endDate.getFullYear()}${pad(endDate.getMonth() + 1)}${pad(endDate.getDate())}T${pad(endDate.getHours())}${pad(endDate.getMinutes())}00`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Meeting with ${name}`,
    dates: `${startStr}/${endStr}`,
    details: `Meeting link: ${meetingUrl}`,
    location: meetingUrl,
  });
  return `https://www.google.com/calendar/render?${params.toString()}`;
}

const sectionHeadings = ['company overview', 'the problem', 'the solution', 'problems', 'solutions', 'markets covered', 'core capabilities', 'services', 'pricing', 'market opportunity', 'location', 'founder', 'vision', 'contact', 'overview', 'features', 'benefits', 'about', 'specifications', 'details', 'products', 'offerings', 'support', 'testimonials', 'faq', 'why us'];

const sectionResponseTemplates = {
  services: (content) => {
    const items = content.split('\n').map(l => l.trim().replace(/^[-•*]\s*/, '')).filter(Boolean);
    if (items.length <= 2) return content;
    const last = items.pop();
    return items.join(', ') + ', and ' + last;
  },
  markets: (content) => {
    const items = content.split('\n').map(l => l.trim().replace(/^[-•*]\s*/, '')).filter(Boolean);
    if (items.length <= 2) return content;
    const last = items.pop();
    return items.join(', ') + ', and ' + last;
  },
  'markets covered': (content) => {
    const items = content.split('\n').map(l => l.trim().replace(/^[-•*]\s*/, '')).filter(Boolean);
    if (items.length <= 2) return content;
    const last = items.pop();
    return items.join(', ') + ', and ' + last;
  },
  pricing: (content) => {
    const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
    const tableLines = lines.filter(l => !l.includes('Tier') && !l.includes('Price') && !l.includes("What's Included") && !l.includes('---'));
    if (tableLines.length >= 4) {
      const firstLine = tableLines[0];
      const remaining = tableLines.slice(1);
      const tiers = [];
      for (let i = 0; i < remaining.length; i += 3) {
        const name = remaining[i];
        const price = remaining[i + 1] || '';
        const desc = remaining[i + 2] || '';
        if (name && price) tiers.push(`${name} (${price}) — ${desc}`);
        else if (name) tiers.push(name);
      }
      return firstLine + ' ' + tiers.join('. ');
    }
    return tableLines.join(' ');
  },
};

function extractSection(content, query) {
  if (!content || !query) return null;
  const lines = content.split('\n');
  const sections = [];
  let currentHeading = 'General Information';
  let currentContent = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const lower = trimmed.toLowerCase();
    const match = sectionHeadings.find(h => lower === h || lower.startsWith(h + ' ') || lower.startsWith(h + ':') || lower.startsWith(h + '\n') || lower === h + 's');
    if (match) {
      if (currentContent.length > 0) {
        sections.push({ heading: currentHeading, content: currentContent.join('\n').trim() });
      }
      currentHeading = trimmed;
      currentContent = [];
    } else if (trimmed.length > 0) {
      currentContent.push(line);
    }
  }
  if (currentContent.length > 0) {
    sections.push({ heading: currentHeading, content: currentContent.join('\n').trim() });
  }

  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  if (words.length === 0) return null;

  let bestSection = null;
  let bestScore = 0;
  for (const section of sections) {
    let score = 0;
    const h = section.heading.toLowerCase();
    for (const word of words) {
      if (h.includes(word)) score += 5;
      else if (word.startsWith(h) || h.startsWith(word)) score += 4;
      else if (h.includes(word.slice(0, -1)) || word.includes(h.slice(0, -1))) score += 3;
      if (section.content.toLowerCase().includes(word)) score += 1;
    }
    if (score > bestScore) { bestScore = score; bestSection = section; }
  }
  return bestSection && bestScore > 0 ? bestSection : null;
}

const sectionIntros = {
  services: "They've got quite a few services — ",
  pricing: "Here's how the pricing works: ",
  'markets covered': "They cover these markets: ",
  location: "They're based ",
  founder: "Here's a bit about the founder:\n",
  vision: "Their vision:\n",
  'company overview': "",
  'market opportunity': "A look at the opportunity:\n",
  'core capabilities': "What they can do:\n",
  contact: "Contact details:\n",
};


const followupPhrases = [
  " Let me know if you want more on that.",
  " Happy to go deeper if you need.",
  " Anything else you'd like to know?",
  "",
];

const knowledgeFollowups = {
  services: " Want to go ahead with that or have more questions?",
  pricing: " Sound good? Need me to help you get started?",
  'general info': " Let me know what else you're curious about!",
  policies: " Anything else you'd like to check?",
  faq: " Got more questions? I'm here!",
  products: " Want to place an order or find out more?",
};

function getTemplates(industry) {
  const key = (industry || '').toLowerCase().trim();
  return industryTemplates[key] || defaultTemplates;
}

function detectIntent(message) {
  const intents = [];
  const msg = message;
  const msgLower = message.toLowerCase();
  const w = words(message);

  // ----- STRICT REGEX CHECKS (fast path for exact matches) -----
  if (/\b(how much|price|cost|fee|charge|rate|kes|ksh|pricing|quotation|quote|estimate|valu)\b/i.test(msg)) intents.push('pricing');
  if (/\b(book|appointment|schedule|reserve|reservation|slot|booking|demo|meeting|meet|consultation|session|appt)\b/i.test(msg)) intents.push('booking');
  if (/\b(hi|hello|hey|good\s*(morning|afternoon|evening)|yo|howdy|sup|what's up|wasup)\b/i.test(msg)) intents.push('greeting');
  if (/\b(what (services|products|offer)|what do you|what can you|services?|offer|provide|sell|range|catalogue|product|offering)\b/i.test(msg)) intents.push('services');
  if (/\b(open|close|hours|operate|when (are|do) you|working (hours|time)|timing)\b/i.test(msg)) intents.push('hours');
  if (/\b(where|location|address|near|direction|find you|located|way|directions)\b/i.test(msg)) intents.push('location');
  if (/\b(yes|yeah|ok|okay|sure|great|perfect|fine|go ahead|confirm|correct|right|alright|absolutely|definitely)\b/i.test(msg)) intents.push('confirm');
  if (/\b(cancel|cancellation|no (thanks|thank you)|not interested|maybe later|stop|leave me|don't contact|unsubscribe|not now|no thank|no thanks)\b/i.test(msg)) intents.push('decline');
  if (/\b(human|person|manager|speak to|real person|agent|talk to|representative|customer service|support|operator)\b/i.test(msg)) intents.push('escalate');
  if (/\b(thank|thanks|appreciate|grateful)\b/i.test(msg)) intents.push('gratitude');
  if (/\b(bye|goodbye|see you|talk later|catch you|take care|cya|see ya|laters)\b/i.test(msg)) intents.push('goodbye');
  if (/\b(complaint|problem|issue|not working|bad|poor|terrible|disappointed|awful|horrible|frustrated|annoyed)\b/i.test(msg)) intents.push('complaint');
  if (/\b(i need|i want|i would like|i'm looking for|looking for|interested in|i have|i am looking|can i|can you|i'd like|i would love)\b/i.test(msg)) intents.push('request');

  // ----- FUZZY MATCHING (handles typos & misspellings) -----
  if (!intents.includes('booking') && w.some(word => fuzzyMatchAny(word, ['book', 'booking', 'schedule', 'reserve', 'reservation', 'appointment', 'demo', 'meeting', 'consultation', 'slot'], 2))) {
    intents.push('booking');
  }
  if (!intents.includes('pricing') && w.some(word => fuzzyMatchAny(word, ['price', 'pricing', 'cost', 'charge', 'quotation', 'estimate'], 2))) {
    intents.push('pricing');
  }
  if (!intents.includes('greeting') && w.some(word => fuzzyMatchAny(word, ['hello', 'hey', 'greetings', 'howdy'], 2))) {
    intents.push('greeting');
  }
  if (!intents.includes('services') && w.some(word => fuzzyMatchAny(word, ['service', 'services', 'product', 'products', 'offer', 'offering', 'provide', 'sell'], 2))) {
    intents.push('services');
  }
  if (!intents.includes('location') && w.some(word => fuzzyMatchAny(word, ['location', 'address', 'direction', 'directions', 'located', 'near'], 2))) {
    intents.push('location');
  }
  if (!intents.includes('hours') && w.some(word => fuzzyMatchAny(word, ['hour', 'hours', 'opening', 'closing', 'timing', 'timings'], 2))) {
    intents.push('hours');
  }
  if (!intents.includes('escalate') && w.some(word => fuzzyMatchAny(word, ['human', 'person', 'manager', 'agent', 'representative', 'operator'], 2))) {
    intents.push('escalate');
  }

  // Detect "schedule"/"demo" as booking even when spelled poorly
  if (!intents.includes('booking') && (msgLower.includes('shedule') || msgLower.includes('shedul') || msgLower.includes('schdule') || msgLower.includes('schadule'))) {
    intents.push('booking');
  }

  // ----- TIME/CONTEXT DETECTION -----
  const hasDay = dayWords.some(d => msgLower.includes(d));
  const hasTime = /\d+\s*(am|pm|hrs|hour|:)/i.test(msg);
  const hasAmPm = /\b(am|pm)\b/i.test(msg);
  if ((hasDay || hasTime || hasAmPm) && intents.length > 0 && !intents.includes('booking')) {
    intents.push('time');
  }

  // If 'demo' or 'meeting' or 'call' is in the message, that strongly suggests booking intent
  if (w.some(word => ['demo', 'meeting', 'meet', 'call', 'consultation', 'session'].includes(word))) {
    if (!intents.includes('booking')) intents.push('booking');
  }

  return [...new Set(intents)];
}

function matchService(message) {
  const msg = message.toLowerCase();
  for (const [service, keywords] of Object.entries(serviceKeywords)) {
    if (keywords.some(k => msg.includes(k))) return service;
  }
  return null;
}

function extractTime(message) {
  const msg = message.toLowerCase();
  if (/today/.test(msg)) return 'today';
  if (/tomorrow/.test(msg)) return 'tomorrow';
  const day = dayWords.slice(2).find(d => msg.includes(d));
  if (day) return day;
  const timeMatch = msg.match(/(\d{1,2})\s*(:\s*\d{2})?\s*(am|pm)/i);
  if (timeMatch) {
    const hour = timeMatch[1];
    const minutes = timeMatch[2] ? timeMatch[2].replace(/\s+/g, '') : '';
    const period = timeMatch[3].toLowerCase();
    return `${hour}${minutes} ${period}`;
  }
  // Match "3:00" without am/pm
  const numMatch = msg.match(/(\d{1,2})\s*:\s*(\d{2})\b(?!\s*am|\s*pm)/i);
  if (numMatch) return `${numMatch[1]}:${numMatch[2]}`;
  // Match standalone hour numbers (3, 4, 5) with pm/am nearby
  const standaloneHour = msg.match(/\b(\d{1,2})\s*(pm|am)\b/i);
  if (standaloneHour) return `${standaloneHour[1]} ${standaloneHour[2].toLowerCase()}`;
  return null;
}

function extractName(message) {
  const match = message.match(/i['']?m\s+(\w+)/i);
  if (match) return match[1];
  const match2 = message.match(/my name is\s+(\w+)/i);
  if (match2) return match2[1];
  const match3 = message.match(/call me\s+(\w+)/i);
  if (match3) return match3[1];
  return null;
}

function buildKnowledgeContext(knowledge) {
  if (!knowledge.length) return '';
  return '\n\nRelevant business info:\n' + knowledge.map(k =>
    `[${k.category}] ${k.title}: ${k.content}`
  ).join('\n');
}

function generateRuleResponse(userMessage, business, lead, context = {}, knowledge = []) {
  const templates = getTemplates(business.industry);
  const message = userMessage.toLowerCase();
  const productsDesc = business.products || 'our products and services';
  const stage = context.stage || 'new';
  const selectedService = context.selectedService || null;
  const offeredTimes = context.offeredTimes || [];
  const offeredDay = context.offeredDay || '';

  // Detect intent FIRST — before any knowledge matching
  const intents = detectIntent(message);
  const detectedService = matchService(message);
  const detectedTime = extractTime(message);
  const detectedName = extractName(message);
  const isReturning = stage !== 'new' && stage !== 'greeted';
  const lastKnowledgeTitle = context.lastKnowledgeTitle;
  const lastKC = context.lastKnowledgeContent;
  const lastKT = context.lastKnowledgeTitle;
  const lastKCat = context.lastKnowledgeCategory;
  const fallbackCount = context.fallbackCount || 0;
  const wordsInMsg = message.split(/\s+/).filter(w => w.length > 2).length;

  let text, scoreDelta, statusUpdate;
  let escalate = false;
  let contextUpdates = {};

  if (detectedName) contextUpdates.customerName = detectedName;
  if (detectedService && !selectedService) contextUpdates.selectedService = detectedService;

  // --- Critical handlers that must ALWAYS fire before knowledge ---
  if (intents.includes('escalate')) {
    text = pick([
      `Let me get someone to help — they'll reach out shortly.`,
      `Passing this to the team. Someone will follow up soon.`,
    ]);
    return { text, scoreDelta: 0, statusUpdate: 'contacted', escalate: true, contextUpdates };
  }

  if (intents.includes('decline')) {
    const cancelled = /\bcancel/i.test(message) && stage === 'booked';
    if (cancelled) {
      text = pick([
        `Cancelled ${context.confirmedTime || 'your appointment'}. Feel free to rebook anytime.`,
        `All cancelled. Come back whenever you're ready!`,
      ]);
      return { text, scoreDelta: -10, statusUpdate: 'lost', contextUpdates: { ...contextUpdates, stage: 'lost' } };
    }
    text = pick([
      `No worries — reach out anytime.`,
      `Totally understand. Take care!`,
    ]);
    return { text, scoreDelta: -20, statusUpdate: 'lost', contextUpdates: { ...contextUpdates, stage: 'lost' } };
  }

  if (intents.includes('complaint')) {
    text = pick([
      `Sorry about that. Let me get the team on it.`,
      `That's not right — I'll flag this to the team.`,
    ]);
    return { text, scoreDelta: -5, statusUpdate: 'contacted', escalate: true, contextUpdates: { ...contextUpdates, stage: 'escalated' } };
  }

  if (intents.includes('gratitude') && !intents.includes('pricing') && !intents.includes('booking')) {
    text = pick([`You're welcome!`, `Happy to help!`, `Anytime!`]);
    return { text, scoreDelta: 0, statusUpdate: null, contextUpdates };
  }

  if (intents.includes('goodbye')) {
    text = pick([`Take care!`, `Catch you later!`, `All the best!`]);
    return { text, scoreDelta: 0, statusUpdate: null, contextUpdates };
  }

  // Post-booking: acknowledge existing booking instead of getting confused
  if (stage === 'booked') {
    const isAdminInstruction = /\b(notification|notify|admin|alert|inform|tell\s*(the|our)?\s*(team|admin)|send\s*(a|the)?\s*notification)\b/i.test(message);
    const logisticsRequest = !isAdminInstruction && /\b(link|url|invite|join|access|meeting\s*link|video\s*call|zoom|google\s*meet|send\s*(me|the)?\s*link)\b/i.test(message);
    if (logisticsRequest) {
      // Look for a meeting URL in the business's knowledge base
      const meetingEntry = knowledge.find(k => {
        const hasUrl = /https?:\/\/[^\s]+/.test(k.content || '');
        const isMeeting = /meeting|calendar|schedule|book|call|zoom|google\s*meet|teams|webinar|link|join/i.test((k.title || '') + ' ' + (k.category || '') + ' ' + (k.keywords || []).join(' '));
        return hasUrl && isMeeting;
      });
      if (meetingEntry) {
        const urlMatch = meetingEntry.content.match(/https?:\/\/[^\s]+/);
        const meetingUrl = urlMatch ? urlMatch[0] : null;
        if (meetingUrl) {
          const name = context.customerName || lead.name || 'you';
          const calendarUrl = generateCalendarUrl(meetingUrl, name, context.confirmedTime || '');
          text = pick([
            `Here's your meeting link: ${meetingUrl}\n\nAdd to calendar: ${calendarUrl}`,
            `Join here: ${meetingUrl}\n\nCalendar invite: ${calendarUrl}`,
          ]);
          return { text, scoreDelta: 0, statusUpdate: null, notifyAdmin: 'meeting_link_sent', contextUpdates: { ...contextUpdates, fallbackCount: 0 } };
        }
      }
      text = pick([
        `The team will share the meeting link shortly.`,
        `Someone will send the meeting details soon.`,
      ]);
      return { text, scoreDelta: 0, statusUpdate: null, actionRequired: 'meeting_link', contextUpdates: { ...contextUpdates, fallbackCount: 0 } };
    }
    if (isAdminInstruction) {
      text = pick([
        `The admin is already notified automatically when the link is sent.`,
        `Already handled — admin gets notified whenever the meeting link is shared.`,
      ]);
      return { text, scoreDelta: 0, statusUpdate: null, contextUpdates: { ...contextUpdates, fallbackCount: 0 } };
    }
    if (!intents.includes('escalate') && !intents.includes('decline') && !intents.includes('complaint') && !intents.includes('booking')) {
      const confirmTime = context.confirmedTime || 'your appointment';
      text = pick([
        `You're all set for ${confirmTime}!`,
        `You've got ${confirmTime} booked.`,
      ]);
      return { text, scoreDelta: 0, statusUpdate: null, contextUpdates: { ...contextUpdates, fallbackCount: 0 } };
    }
  }

  // Repetition detection: escalate after 3+ consecutive fallbacks
  if (fallbackCount >= 3) {
    text = pick([
      `Let me get someone to help — they'll reach out shortly.`,
      `Passing this to the team who can assist better.`,
    ]);
    return { text, scoreDelta: 0, statusUpdate: 'contacted', escalate: true, contextUpdates: { ...contextUpdates, stage: 'escalated', fallbackCount: 0 } };
  }

  // --- Only attempt knowledge matching when there's NO strong actionable intent ---
  const actionableIntents = ['booking', 'pricing', 'time'];
  const hasStrongIntent = actionableIntents.some(i => intents.includes(i));

  if (!hasStrongIntent) {
    // Knowledge section extraction (for follow-up queries on previously shared knowledge)
    const hasQuestionWord = /\b(what|how|tell|where|when|why|who|which|explain|describe|more|detail|about|pricing|cost|price|service|feature|benefit)\b/i.test(message);
    if (lastKC && lastKT && wordsInMsg >= 2 && hasQuestionWord) {
      const section = extractSection(lastKC, userMessage);
      if (section && section.heading !== 'General Information') {
        const h = section.heading.toLowerCase();
        const format = sectionResponseTemplates[h] || ((c) => c);
        const formatted = format(section.content);
        const intro = sectionIntros[h] || '';
        const followup = knowledgeFollowups[lastKCat] || pick(followupPhrases);
        const needsPeriod = formatted.length > 0 && !/[\\.!?]/.test(formatted[formatted.length - 1]) && followup.length > 0;
        const responseText = intro
          ? `${intro}${formatted}${needsPeriod ? '.' : ''}${followup}`
          : `${formatted}${needsPeriod ? '.' : ''}${followup}`;
        return {
          text: responseText.trim(),
          scoreDelta: 5,
          statusUpdate: null,
          contextUpdates: { lastKnowledgeTitle: lastKT, lastKnowledgeContent: lastKC, lastKnowledgeCategory: lastKCat },
        };
      }
    }

    // Fresh knowledge matching (only when user is asking for information, not taking action)
    const matchedKnowledge = knowledge.filter(k =>
      (k.keywords || []).some(kw => message.includes(kw.toLowerCase()))
    );
    const bestKnowledge = matchedKnowledge[0] || (knowledge.length > 0 &&
      knowledge[0].keywords.some(kw => message.includes(kw.toLowerCase())) ? knowledge[0] : null);

    if (bestKnowledge && wordsInMsg >= 2) {
      const followup = knowledgeFollowups[bestKnowledge.category] || " Is there anything else I can help you with?";
      const newStage = (stage === 'new' || stage === 'greeted') ? 'contacted' : stage;
      const content = bestKnowledge.content.length > 500
        ? bestKnowledge.content.slice(0, bestKnowledge.content.indexOf('\n\n', 400) > 0 ? bestKnowledge.content.indexOf('\n\n', 400) : 500) + '\n\n...'
        : bestKnowledge.content;
      return {
        text: content + followup,
        scoreDelta: 10,
        statusUpdate: stage === 'new' ? 'contacted' : null,
        contextUpdates: { stage: newStage, lastKnowledgeTitle: bestKnowledge.title, lastKnowledgeContent: bestKnowledge.content, lastKnowledgeCategory: bestKnowledge.category },
      };
    }
  }

  const confirmNext = [
    `What time works for you?`,
    `When would you like to come in?`,
    `Got a preferred time?`,
  ];
  const confirmPricing = [
    `Want to go ahead with that?`,
    `Should I book that for you?`,
  ];
  const confirmEnd = [
    `Anything else?`,
    `What else can I do?`,
  ];
  const displayTitle = lastKnowledgeTitle ? cleanTitle(lastKnowledgeTitle) : '';
  const knowledgeReplies = (lastKnowledgeTitle
    ? [
        `Want me to go deeper into ${displayTitle}?`,
        `I've got more on ${displayTitle} if you're curious.`,
        `Happy to dig into ${displayTitle} more.`,
      ]
    : []);

  // --- Time confirmation (stage-aware) ---
  if ((intents.includes('time') || detectedTime) && (stage === 'booking' || stage === 'qualified' || stage === 'contacted')) {
    const confirmedDay = detectedTime && dayWords.includes(detectedTime) ? detectedTime : (offeredDay || 'today');
    const hasExplicitTime = /\d{1,2}\s*(am|pm|:)/i.test(message);
    if (detectedTime && dayWords.includes(detectedTime) && !hasExplicitTime) {
      const slots = pickSlots(1, offeredTimes);
      text = pick([
        `Got it — what time works for you? I have ${slots.times.join(', ')}.`,
        `Sure, what time? I can do ${slots.times.join(', ')}.`,
      ]);
      scoreDelta = 10;
      contextUpdates.offeredDay = confirmedDay;
      contextUpdates.stage = 'booking';
      return { text, scoreDelta, statusUpdate: null, contextUpdates };
    }
    const d = confirmedDay !== 'today' && confirmedDay !== 'tomorrow' ? 'on ' + confirmedDay : confirmedDay;
    text = pick([
      `You're booked ${d}! ${pick(confirmEnd)}`,
      `All set ${d}! ${pick(confirmEnd)}`,
    ]);
    scoreDelta = 20;
    statusUpdate = 'booked';
    contextUpdates.stage = 'booked';
    contextUpdates.confirmedTime = detectedTime || 'confirmed';
    return { text, scoreDelta, statusUpdate, contextUpdates };
  }

  // --- Booking intent ---
  if (intents.includes('booking')) {
    // Vague rebooking — ask when they'd like rather than jumping to specific slots
    const vagueRebook = /\b(rebook|reschedule|next\s*time|some\s*other\s*time|another\s*day|later|sometime|in\s*the\s*future)\b/i.test(message) && (stage === 'lost' || stage === 'booked');
    if (vagueRebook) {
      text = pick([
        `Sure — just tell me when.`,
        `Happy to rebook! What day works?`,
      ]);
      contextUpdates.stage = 'booking';
      return { text, scoreDelta: 5, statusUpdate: 'contacted', contextUpdates };
    }
    const slots = pickSlots(3, offeredTimes);
    contextUpdates.offeredTimes = slots.times;
    contextUpdates.offeredDay = slots.day;
    contextUpdates.stage = 'booking';
    const wantsDemo = /\bdemo\b/i.test(message);
    const wantsMeeting = /\bmeeting\b/i.test(message) || /\bmeet\b/i.test(message);
    const wantsCall = /\bcall\b/i.test(message);
    if (templates.booking) {
      text = templates.booking.replace('{times}', `${slots.day} at ${slots.times.join(', ')}`);
    } else if (wantsDemo) {
      text = pick([
        `I can do a demo ${slots.day} at ${slots.times.join(', ')}. Works?`,
        `Happy to demo! Free ${slots.day}: ${slots.times.join(', ')}.`,
      ]);
    } else if (wantsMeeting) {
      text = pick([
        `I have ${slots.day} at ${slots.times.join(', ')} for a meeting. Works?`,
      ]);
    } else if (wantsCall) {
      text = pick([
        `Free for a call ${slots.day}: ${slots.times.join(', ')}. Pick one.`,
      ]);
    } else {
      text = pick([
        `I've got ${slots.day} at ${slots.times.join(', ')}. Which works?`,
        `Free ${slots.day}: ${slots.times.join(', ')}.`,
      ]);
    }
    scoreDelta = 20;
    statusUpdate = stage === 'new' || stage === 'contacted' ? 'qualified' : 'booked';
    return { text, scoreDelta, statusUpdate, contextUpdates };
  }

  // --- Confirm (user saying yes in booking flow) ---
  if (intents.includes('confirm') && stage === 'booking') {
    text = pick([
      `You're confirmed! ${pick(confirmEnd)}`,
      `All sorted! ${pick(confirmEnd)}`,
    ]);
    scoreDelta = 20;
    statusUpdate = 'booked';
    contextUpdates.stage = 'booked';
    return { text, scoreDelta, statusUpdate, contextUpdates };
  }

  // --- Pricing ---
  if (intents.includes('pricing') || (intents.includes('request') && detectedService && !stage)) {
    if (lastKnowledgeTitle && !detectedService) {
      text = pick([
        `I covered pricing in the ${displayTitle} info — what specifically?`,
        `That's in the ${displayTitle} details. What are you looking at?`,
      ]);
    } else {
      const pricingMatch = detectedService && templates.pricing && typeof templates.pricing === 'object'
        ? templates.pricing[detectedService] || null
        : null;
      if (pricingMatch) {
        text = pricingMatch;
        if (stage !== 'booking') {
          text += ' ' + pick(confirmPricing);
        }
      } else if (templates.pricing && typeof templates.pricing === 'string') {
        text = templates.pricing;
      } else if (templates.pricing && templates.pricing.fallback) {
        text = templates.pricing.fallback;
      } else {
        text = pick([
          `Our prices vary depending on what you need. Could you let me know which service you're interested in?`,
          `I'd love to help with pricing! Which service are you looking into?`,
        ]);
      }
    }
    scoreDelta = 10;
    statusUpdate = stage === 'new' ? 'contacted' : null;
    contextUpdates.stage = stage === 'new' ? 'contacted' : stage;
    return { text, scoreDelta, statusUpdate, contextUpdates };
  }

  // --- Services inquiry ---
  if (intents.includes('services')) {
    if (lastKnowledgeTitle) {
      text = pick([
        `That's covered in the ${displayTitle} info. Want a specific part?`,
        `The ${displayTitle} details have what you need. Anything in particular?`,
      ]);
    } else if (templates.services) {
      text = templates.services.replace('{products}', productsDesc);
    } else {
      text = pick([
        `We offer ${productsDesc}. What interests you?`,
        `Our range includes ${productsDesc}. Anything catch your eye?`,
      ]);
    }
    scoreDelta = 5;
    statusUpdate = stage === 'new' ? 'contacted' : null;
    contextUpdates.stage = stage === 'new' ? 'contacted' : stage;
    return { text, scoreDelta, statusUpdate, contextUpdates };
  }

  // --- Hours inquiry ---
  if (intents.includes('hours')) {
    text = templates.hours || pick([
      'We\'re open Monday to Friday, 9am to 5pm.',
      'Our hours: Monday through Friday, 9am to 5pm.',
    ]);
    scoreDelta = 5;
    statusUpdate = stage === 'new' ? 'contacted' : null;
    contextUpdates.stage = stage === 'new' ? 'contacted' : stage;
    return { text, scoreDelta, statusUpdate, contextUpdates };
  }

  // --- Location inquiry ---
  if (intents.includes('location')) {
    text = templates.location || pick([
      `We're based in the area. Want me to send you the exact location?`,
      `I can share our address with you — want me to send it?`,
      `We're located nearby. I can send directions if you need them.`,
    ]);
    scoreDelta = 5;
    statusUpdate = stage === 'new' ? 'contacted' : null;
    contextUpdates.stage = stage === 'new' ? 'contacted' : stage;
    return { text, scoreDelta, statusUpdate, contextUpdates };
  }

  // --- Request for a specific service ---
  if (intents.includes('request') && detectedService) {
    if (lastKnowledgeTitle) {
      text = pick([
        `Sure thing! The ${displayTitle} info I shared probably covers it. What detail do you want me to zoom in on?`,
        `Happy to help! I went over ${displayTitle} already — what part do you want more on?`,
      ]);
      contextUpdates.stage = stage === 'new' ? 'contacted' : stage;
    } else {
      const pricingMatch = templates.pricing && typeof templates.pricing === 'object'
        ? templates.pricing[detectedService] || null
        : null;
      if (pricingMatch) {
        text = pricingMatch + ' ' + pick(confirmPricing);
      } else if (templates.booking) {
        const slots = pickSlots(3);
        contextUpdates.offeredTimes = slots.times;
        contextUpdates.offeredDay = slots.day;
        contextUpdates.stage = 'booking';
        text = templates.booking.replace('{times}', `${slots.day} at ${slots.times.join(', ')}`);
      } else {
        text = pick([
          `Let me check on that.`,
          `I'll look into it.`,
        ]);
        contextUpdates.stage = 'contacted';
      }
    }
    scoreDelta = 10;
    statusUpdate = stage === 'new' ? 'contacted' : 'qualified';
    return { text, scoreDelta, statusUpdate, contextUpdates };
  }

  // --- Confirm (generic, outside booking) ---
  if (intents.includes('confirm')) {
    if (lastKnowledgeTitle) {
      text = pick(knowledgeReplies);
      scoreDelta = 5;
      statusUpdate = null;
      contextUpdates = { ...contextUpdates, lastKnowledgeTitle, lastKnowledgeContent: context.lastKnowledgeContent, lastKnowledgeCategory: context.lastKnowledgeCategory };
    } else if (stage === 'contacted' || stage === 'qualified') {
      text = pick(confirmNext);
      scoreDelta = 10;
      statusUpdate = stage === 'new' ? 'contacted' : 'qualified';
      contextUpdates.stage = 'qualified';
    } else {
      text = pick([
        `What can I help with? Services, pricing, booking — just ask!`,
        `I'm here to help! Services, pricing, booking?`,
      ]);
      scoreDelta = 5;
      statusUpdate = null;
    }
    return { text, scoreDelta, statusUpdate, contextUpdates };
  }

  // --- Generic request (no specific service) ---
  if (intents.includes('request') && !detectedService) {
    if (lastKnowledgeTitle) {
      text = pick([
        `Want me to dig into something from the ${displayTitle} info?`,
        `I can go deeper on the ${displayTitle} details. What's on your mind?`,
      ]);
      contextUpdates.stage = stage === 'new' ? 'contacted' : stage;
    } else {
      text = pick([
        `What service are you looking for? We've got ${productsDesc}.`,
        `Happy to help! What do you need? We offer ${productsDesc}.`,
      ]);
      contextUpdates.stage = 'contacted';
    }
    scoreDelta = 5;
    statusUpdate = 'contacted';
    return { text, scoreDelta, statusUpdate, contextUpdates };
  }

  // --- Greeting ---
  if (intents.includes('greeting')) {
    if (!isReturning) {
      text = pick([
        `Welcome to ${business.name}! How can I help?`,
        `Hi! Thanks for reaching out. What are you looking for?`,
      ]);
      scoreDelta = 5;
      statusUpdate = 'contacted';
      contextUpdates.stage = 'greeted';
    } else {
      text = pick([
        `Hey again!`,
        `Hi — what's up?`,
      ]);
      scoreDelta = 0;
      statusUpdate = null;
    }
    return { text, scoreDelta, statusUpdate, contextUpdates };
  }

  // --- Fallback ---
  if (stage === 'new' || !isReturning) {
    text = templates.fallback || pick([
      `How can I help?`,
      `What can I do for you?`,
    ]);
    scoreDelta = 5;
    statusUpdate = 'contacted';
    contextUpdates.stage = 'greeted';
    contextUpdates.fallbackCount = 0;
  } else if (stage !== 'booking') {
    text = pick([
      `Not sure I follow — looking to book or just asking?`,
      `Could you clarify? Happy to help with bookings or questions.`,
    ]);
    scoreDelta = 0;
    statusUpdate = null;
    contextUpdates.fallbackCount = fallbackCount + 1;
  } else {
    text = pick([
      `What time works for you?`,
      `Got a preferred time?`,
    ]);
    scoreDelta = 0;
    statusUpdate = null;
  }

  return { text, scoreDelta, statusUpdate, contextUpdates };
}

async function generateWithOpenAI(userMessage, business, lead, history, context = {}, knowledge = []) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not set');

  const msgs = history.slice(-8).map(m => ({
    role: m.direction === 'inbound' ? 'user' : 'assistant',
    content: m.content,
  }));

  const stageInfo = context.stage ? ` (conversation stage: ${context.stage})` : '';
  const serviceInfo = context.selectedService ? ` (selected service: ${context.selectedService})` : '';
  const knowledgeContext = buildKnowledgeContext(knowledge);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a virtual receptionist for "${business.name}", a business in the ${business.industry || 'general'} industry.

Business: ${business.description || 'Not provided'}
Services: ${business.products || 'Not provided'}
Customer: ${lead.name || 'Unknown'} ${stageInfo}${serviceInfo}
${knowledgeContext}

Rules:
- Answer questions about services, pricing, hours, location
- Drive toward booking an appointment
- Be warm, helpful, and professional
- Keep responses concise (2-3 sentences) for WhatsApp
- NEVER mention LeadAI or any software platform`,
        },
        ...msgs,
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 250,
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(`OpenAI error: ${data.error?.message || response.status}`);
  return data.choices[0].message.content.trim();
}

async function generateWithClaude(userMessage, business, lead, history, context = {}, knowledge = []) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const msgs = history.slice(-8).map(m => ({
    role: m.direction === 'inbound' ? 'user' : 'assistant',
    content: m.content,
  }));

  const stageInfo = context.stage ? ` (conversation stage: ${context.stage})` : '';
  const serviceInfo = context.selectedService ? ` (selected service: ${context.selectedService})` : '';
  const knowledgeContext = buildKnowledgeContext(knowledge);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.CLAUDE_MODEL || 'claude-3-haiku-20240307',
      max_tokens: 250,
      system: `You are a virtual receptionist for "${business.name}", a business in the ${business.industry || 'general'} industry.

Business: ${business.description || 'Not provided'}
Services: ${business.products || 'Not provided'}
Customer: ${lead.name || 'Unknown'} ${stageInfo}${serviceInfo}
${knowledgeContext}

Rules:
- Answer questions about services, pricing, hours, location
- Drive toward booking an appointment
- Be warm, helpful, and professional
- Keep responses concise (2-3 sentences) for WhatsApp
- NEVER mention LeadAI or any software platform`,
      messages: [
        ...msgs,
        { role: 'user', content: userMessage },
      ],
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(`Claude error: ${data.error?.message || response.status}`);
  return data.content[0].text.trim();
}

export async function generateResponse(userMessage, business, lead, history = [], context = {}, knowledge = []) {
  if (provider === 'openai') {
    const text = await generateWithOpenAI(userMessage, business, lead, history, context, knowledge);
    return { text, scoreDelta: 0, statusUpdate: null, contextUpdates: {} };
  }
  if (provider === 'claude') {
    const text = await generateWithClaude(userMessage, business, lead, history, context, knowledge);
    return { text, scoreDelta: 0, statusUpdate: null, contextUpdates: {} };
  }
  return generateRuleResponse(userMessage, business, lead, context, knowledge);
}
