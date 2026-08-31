/**
 * Default Home Page Hero 5-Slide Carousel Data & LocalStorage Management Helper
 */

export const DEFAULT_HERO_SLIDES = [
  {
    id: 1,
    title: 'WHERE LEGENDS ARE BORN',
    description: 'The ultimate inter-college sports management platform. 12 dynamic sports, live scoreboards, multi-step athlete registration, and live leaderboard tracking.',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=2000&q=80',
    primaryBtnText: 'REGISTER YOUR TEAM',
    primaryBtnLink: '/registration',
    secondaryBtnText: 'Watch Live Scoreboard',
    secondaryBtnLink: '/live'
  },
  {
    id: 2,
    title: 'CHAMPIONS LEAGUE T20: CRICKET SHOWDOWN',
    description: 'High-stakes inter-college T20 cricket clashes live on central university grounds! Watch the top teams battle for glory.',
    image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=2000&q=80',
    primaryBtnText: 'VIEW FIXTURES',
    primaryBtnLink: '/schedule',
    secondaryBtnText: 'Live Match Portal',
    secondaryBtnLink: '/live'
  },
  {
    id: 3,
    title: 'INTER-COLLEGE BASKETBALL ARENA 2026',
    description: 'High-octane 5v5 basketball championship matches. Track live points, personal fouls, and MVP standings in real time.',
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=2000&q=80',
    primaryBtnText: 'REGISTER TEAM',
    primaryBtnLink: '/registration',
    secondaryBtnText: 'View Leaderboard',
    secondaryBtnLink: '/leaderboard'
  },
  {
    id: 4,
    title: 'PRO KABADDI RAID & DEFENSE SHOWDOWN',
    description: '7v7 Mat action with live do-or-die raid tracking, super tackles, and college points table updates.',
    image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=2000&q=80',
    primaryBtnText: 'CHECK SCHEDULE',
    primaryBtnLink: '/schedule',
    secondaryBtnText: 'View Rules & Specs',
    secondaryBtnLink: '/registration'
  },
  {
    id: 5,
    title: 'TRACK & FIELD ATHLETICS CHAMPIONSHIP',
    description: 'Sprint, relay, long jump, and field events across 11 disciplines. Check official heat timing slots now.',
    image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=2000&q=80',
    primaryBtnText: 'REGISTER NOW',
    primaryBtnLink: '/registration',
    secondaryBtnText: 'Medal Tally',
    secondaryBtnLink: '/leaderboard'
  }
];

import { apiUrl } from '../services/apiConfig';

export const getHeroSlides = () => {
  try {
    const saved = localStorage.getItem('sems_home_hero_slides');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}

  return DEFAULT_HERO_SLIDES;
};

export const fetchHeroSlidesFromDB = async () => {
  try {
    const res = await fetch(apiUrl('/public/hero-slides'));
    if (res.ok) {
      const slides = await res.json();
      if (Array.isArray(slides) && slides.length > 0) {
        localStorage.setItem('sems_home_hero_slides', JSON.stringify(slides));
        return slides;
      }
    }
  } catch (e) {
    console.error('Error fetching hero slides from DB:', e);
  }
  return getHeroSlides();
};

export const saveHeroSlides = async (slides) => {
  localStorage.setItem('sems_home_hero_slides', JSON.stringify(slides));
  window.dispatchEvent(new Event('sems_slides_updated'));
  window.dispatchEvent(new Event('storage'));

  try {
    const token = localStorage.getItem('sems_super_coord_token') || localStorage.getItem('sems_admin_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(apiUrl('/super-coordinator/hero-slides'), {
      method: 'POST',
      headers,
      body: JSON.stringify(slides)
    });

    if (res.ok) {
      const data = await res.json();
      return { success: true, data };
    } else {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || `Server responded with status ${res.status}`);
    }
  } catch (e) {
    console.error('Error persisting hero slides to DB:', e);
    throw e;
  }
};
