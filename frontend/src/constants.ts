
import { NewsItem, NewsStatus, UserRole, User } from './types';

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    username: 'admin_user',
    firstName: 'Super',
    lastName: 'Admin',
    email: 'admin@system.com',
    role: UserRole.ADMIN,
    profileImage: 'https://picsum.photos/100/100?random=1'
  },
  {
    id: 'u2',
    username: 'john_doe',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    role: UserRole.MEMBER,
    profileImage: 'https://picsum.photos/100/100?random=2'
  },
  {
    id: 'u3',
    username: 'jane_reader',
    firstName: 'Jane',
    lastName: 'Reader',
    email: 'jane@example.com',
    role: UserRole.READER,
    profileImage: 'https://picsum.photos/100/100?random=3'
  }
];

// Helper to generate comments with recent dates relative to Nov 2025
const generateComments = (count: number, startId: number) => {
  const baseTime = new Date('2025-11-29T12:00:00Z').getTime();
  return Array.from({ length: count }).map((_, i) => ({
    id: `c${startId + i}`,
    userId: `u${(i % 3) + 1}`,
    username: ['admin_user', 'john_doe', 'jane_reader'][i % 3],
    userImage: `https://picsum.photos/100/100?random=${(i % 3) + 1}`,
    content: `This is a sample comment #${i + 1}. The news seems ${i % 2 === 0 ? 'fake' : 'real'} based on my research.`,
    timestamp: new Date(baseTime - i * 3600000).toISOString(), // Subtract hours
    vote: i % 2 === 0 ? NewsStatus.FAKE : NewsStatus.NOT_FAKE
  }));
};

export const MOCK_NEWS: NewsItem[] = [
  {
    id: 'n1',
    topic: 'Aliens Land in Times Square',
    shortDetail: 'Reports of UFOs landing in NYC have flooded social media.',
    fullDetail: 'Numerous reports from unidentified sources claim that a saucer-shaped object landed in the middle of Times Square at 3 AM. No major news outlets have confirmed this, and police scanners were silent.',
    status: NewsStatus.FAKE,
    reporter: 'ConspiracyDaily',
    timestamp: '2025-11-29T08:30:00Z',
    imageUrl: 'https://picsum.photos/800/400?random=10',
    voteCountFake: 154,
    voteCountReal: 12,
    comments: generateComments(15, 100),
    isDeleted: false
  },
  {
    id: 'n2',
    topic: 'Local Cat Saves Fireman',
    shortDetail: 'A reversal of roles as a tabby cat alerts neighbors to a trapped fireman.',
    fullDetail: 'In a heartwarming turn of events, Whiskers the cat meowed incessantly at a locked shed door where a volunteer fireman had accidentally locked himself in during a safety inspection.',
    status: NewsStatus.NOT_FAKE,
    reporter: 'WholesomeNews',
    timestamp: '2025-11-28T14:15:00Z',
    imageUrl: 'https://picsum.photos/800/400?random=11',
    voteCountFake: 2,
    voteCountReal: 89,
    comments: generateComments(5, 200),
    isDeleted: false
  },
  {
    id: 'n3',
    topic: 'New Tax Law Passed Overnight',
    shortDetail: 'Parliament passes controversial tax bill without prior announcement.',
    fullDetail: 'Citizens woke up to a new 5% tax hike on digital goods. The bill was rushed through a midnight session. Economists are divided on the impact.',
    status: NewsStatus.UNKNOWN,
    reporter: 'PoliticalWatch',
    timestamp: '2025-11-29T09:00:00Z',
    imageUrl: 'https://picsum.photos/800/400?random=12',
    voteCountFake: 45,
    voteCountReal: 42,
    comments: generateComments(25, 300),
    isDeleted: false
  },
  {
    id: 'n4',
    topic: 'Scientists Discover Water on Mars Surface',
    shortDetail: 'Liquid water found flowing on the red planet.',
    fullDetail: 'NASA has confirmed the presence of liquid brines flowing on present-day Mars. This discovery increases the probability that life could exist on the Red Planet.',
    status: NewsStatus.NOT_FAKE,
    reporter: 'ScienceToday',
    timestamp: '2025-11-27T11:20:00Z',
    imageUrl: 'https://picsum.photos/800/400?random=13',
    voteCountFake: 10,
    voteCountReal: 340,
    comments: generateComments(8, 400),
    isDeleted: false
  },
  {
    id: 'n5',
    topic: 'Free Energy Generator Invented',
    shortDetail: 'Inventor claims perpetual motion machine is ready for mass production.',
    fullDetail: 'A garage inventor claims to have broken the laws of thermodynamics with a magnetic motor that produces infinite energy. Physicists remain highly skeptical.',
    status: NewsStatus.FAKE,
    reporter: 'TechRumors',
    timestamp: '2025-11-26T16:45:00Z',
    imageUrl: 'https://picsum.photos/800/400?random=14',
    voteCountFake: 500,
    voteCountReal: 5,
    comments: generateComments(40, 500),
    isDeleted: false
  },
  {
    id: 'n6',
    topic: 'Global Temperature Drop Expected',
    shortDetail: 'Experts predict a sudden mini-ice age next year.',
    fullDetail: 'Contrasting global warming trends, a rogue study suggests solar activity will plummet, causing a rapid cooling effect. Mainstream climate scientists dispute this.',
    status: NewsStatus.UNKNOWN,
    reporter: 'WeatherAlternative',
    timestamp: '2025-11-29T10:00:00Z',
    imageUrl: 'https://picsum.photos/800/400?random=15',
    voteCountFake: 30,
    voteCountReal: 20,
    comments: generateComments(12, 600),
    isDeleted: false
  },
  // Add more mock items to demonstrate pagination effectively
  ...Array.from({ length: 15 }).map((_, i) => ({
    id: `mock_n${i + 7}`,
    topic: `Mock News Story #${i + 7}`,
    shortDetail: `This is a generated short detail for mock news story number ${i + 7} to test pagination capabilities.`,
    fullDetail: `This is the full detail text for mock news story ${i + 7}. It contains enough text to look like a real article body. The status is randomly assigned.`,
    status: i % 3 === 0 ? NewsStatus.FAKE : (i % 3 === 1 ? NewsStatus.NOT_FAKE : NewsStatus.UNKNOWN),
    reporter: `Reporter_${i + 7}`,
    timestamp: new Date(new Date('2025-11-20').getTime() + i * 86400000).toISOString(),
    imageUrl: `https://picsum.photos/800/400?random=${i + 20}`,
    voteCountFake: Math.floor(Math.random() * 100),
    voteCountReal: Math.floor(Math.random() * 100),
    comments: generateComments(3, 700 + i * 10),
    isDeleted: false
  }))
];
