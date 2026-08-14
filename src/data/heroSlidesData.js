/**
 * Default Home Page Hero 5-Slide Carousel Data & LocalStorage Management Helper
 */

export const DEFAULT_HERO_SLIDES = [
  {
    id: 1,
    title: 'WHERE LEGENDS ARE BORN',
    description: 'The ultimate inter-college sports management platform. 12 dynamic sports, live scoreboards, multi-step athlete registration, and live leaderboard tracking.',
    badge: '1 of 5',
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
    badge: '2 of 5',
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
    badge: '3 of 5',
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
    badge: '4 of 5',
    image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=2000&q=80',
    primaryBtnText: 'CHECK SCHEDULE',
    primaryBtnLink: '/schedule',
    secondaryBtnText: 'View Rules & Specs',
    secondaryBtnLink: '/sports'
  },
  {
    id: 5,
    title: 'TRACK & FIELD ATHLETICS CHAMPIONSHIP',
    description: 'Sprint, relay, long jump, and field events across 11 disciplines. Check official heat timing slots now.',
    badge: '5 of 5',
    image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=2000&q=80',
    primaryBtnText: 'EXPLORE SPORTS',
    primaryBtnLink: '/sports',
    secondaryBtnText: 'Medal Tally',
    secondaryBtnLink: '/leaderboard'
  }
];

export const getHeroSlides = () => {
  try {
    const saved = localStorage.getItem('sems_home_hero_slides');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length >= 5) {
        // Fix any broken or missing images in localStorage
        const sanitized = parsed.slice(0, 5).map((slide, idx) => {
          const defaultSlide = DEFAULT_HERO_SLIDES[idx] || DEFAULT_HERO_SLIDES[0];
          if (!slide.image || slide.image.includes('photo-1508098682722') || slide.image.includes('photo-1561080695')) {
            return { ...slide, image: defaultSlide.image };
          }
          return slide;
        });
        localStorage.setItem('sems_home_hero_slides', JSON.stringify(sanitized));
        return sanitized;
      }
    }
  } catch (e) {}

  localStorage.setItem('sems_home_hero_slides', JSON.stringify(DEFAULT_HERO_SLIDES));
  return DEFAULT_HERO_SLIDES;
};

export const saveHeroSlides = (slides) => {
  localStorage.setItem('sems_home_hero_slides', JSON.stringify(slides));
  window.dispatchEvent(new Event('sems_slides_updated'));
  window.dispatchEvent(new Event('storage'));
};
