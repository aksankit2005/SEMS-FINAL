export const GALLERY_EVENTS = [
  {
    id: 1,
    event_name: "Football Finals & Grand Ceremony 2026",
    event_date: "2026-08-04",
    cover_image: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&auto=format&fit=crop&q=80",
    description: "Electrifying floodlight action from the high-voltage Football Championship Final between MPEC Kanpur and MIPS.",
    photos_count: 6,
    videos_count: 2
  },
  {
    id: 2,
    event_name: "Badminton Mens & Womens Championship",
    event_date: "2026-08-02",
    cover_image: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&auto=format&fit=crop&q=80",
    description: "Smashes, drop shots, and intense rally highlights from the Badminton Arena.",
    photos_count: 5,
    videos_count: 1
  },
  {
    id: 3,
    event_name: "Cricket T20 Knockout Matches",
    event_date: "2026-08-03",
    cover_image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&auto=format&fit=crop&q=80",
    description: "Unforgettable boundaries, bowling wickets, and wild crowd celebrations at Ground 1.",
    photos_count: 6,
    videos_count: 2
  },
  {
    id: 4,
    event_name: "Table Tennis & Mind Sports Arena",
    event_date: "2026-08-01",
    cover_image: "https://images.unsplash.com/photo-1534158914592-062992fbe900?w=800&auto=format&fit=crop&q=80",
    description: "Rapid ping-pong spins and FIDE Blitz Chess showdowns in the Central Auditorium.",
    photos_count: 4,
    videos_count: 1
  },
  {
    id: 5,
    event_name: "Athletics Track 100m Sprint & Relay",
    event_date: "2026-08-04",
    cover_image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=80",
    description: "Photo-finish 100m sprint finals, long jump records, and relay baton handoffs.",
    photos_count: 5,
    videos_count: 1
  }
];

export const GALLERY_MEDIA = [
  // Event 1: Football
  {
    id: 101,
    event_id: 1,
    media_type: "image",
    title: "Championship Winning Goal Celebration",
    media_url: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=1200&auto=format&fit=crop&q=80",
    uploaded_by: "PR Coordinator",
    uploaded_at: "2026-08-04T18:30:00Z"
  },
  {
    id: 102,
    event_id: 1,
    media_type: "image",
    title: "Bicycle Kick Attempt in Penalty Box",
    media_url: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&auto=format&fit=crop&q=80",
    uploaded_by: "PR Coordinator",
    uploaded_at: "2026-08-04T19:00:00Z"
  },
  {
    id: 103,
    event_id: 1,
    media_type: "image",
    title: "Goalkeeper Finger-tip Save Under Floodlights",
    media_url: "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=1200&auto=format&fit=crop&q=80",
    uploaded_by: "PR Coordinator",
    uploaded_at: "2026-08-04T19:15:00Z"
  },
  {
    id: 104,
    event_id: 1,
    media_type: "image",
    title: "Team Captain Lifting Gold Trophy",
    media_url: "https://images.unsplash.com/photo-1569517282132-25d22f4573e6?w=1200&auto=format&fit=crop&q=80",
    uploaded_by: "PR Coordinator",
    uploaded_at: "2026-08-04T20:00:00Z"
  },
  {
    id: 105,
    event_id: 1,
    media_type: "video",
    title: "Full Match Final Penalty Shootout Highlights",
    media_url: "https://www.w3schools.com/html/mov_bbb.mp4",
    cover_image: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&auto=format&fit=crop&q=80",
    uploaded_by: "PR Media Team",
    uploaded_at: "2026-08-04T20:30:00Z"
  },

  // Event 2: Badminton
  {
    id: 201,
    event_id: 2,
    media_type: "image",
    title: "Jumping Smash at Match Point",
    media_url: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1200&auto=format&fit=crop&q=80",
    uploaded_by: "PR Coordinator",
    uploaded_at: "2026-08-02T14:10:00Z"
  },
  {
    id: 202,
    event_id: 2,
    media_type: "image",
    title: "Mixed Doubles Net Play Reflexes",
    media_url: "https://images.unsplash.com/photo-1521537634581-0ddea2efe2b2?w=1200&auto=format&fit=crop&q=80",
    uploaded_by: "PR Coordinator",
    uploaded_at: "2026-08-02T15:20:00Z"
  },

  // Event 3: Cricket
  {
    id: 301,
    event_id: 3,
    media_type: "image",
    title: "Monster 95m Sixer Over Long On Boundary",
    media_url: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=1200&auto=format&fit=crop&q=80",
    uploaded_by: "PR Coordinator",
    uploaded_at: "2026-08-03T11:00:00Z"
  },
  {
    id: 302,
    event_id: 3,
    media_type: "image",
    title: "Fast Bowler Knocking Off Middle Stump",
    media_url: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1200&auto=format&fit=crop&q=80",
    uploaded_by: "PR Coordinator",
    uploaded_at: "2026-08-03T11:45:00Z"
  },
  {
    id: 303,
    event_id: 3,
    media_type: "video",
    title: "Hat-trick Wickets Special Reel",
    media_url: "https://www.w3schools.com/html/mov_bbb.mp4",
    cover_image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&auto=format&fit=crop&q=80",
    uploaded_by: "PR Media Team",
    uploaded_at: "2026-08-03T12:30:00Z"
  },

  // Event 4: Table Tennis
  {
    id: 401,
    event_id: 4,
    media_type: "image",
    title: "High-Spin Serve Delivery in TT Finals",
    media_url: "https://images.unsplash.com/photo-1534158914592-062992fbe900?w=1200&auto=format&fit=crop&q=80",
    uploaded_by: "PR Coordinator",
    uploaded_at: "2026-08-01T16:00:00Z"
  },
  {
    id: 402,
    event_id: 4,
    media_type: "image",
    title: "Chess Grandmaster Rapid Round Focus",
    media_url: "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=1200&auto=format&fit=crop&q=80",
    uploaded_by: "PR Coordinator",
    uploaded_at: "2026-08-01T17:10:00Z"
  },

  // Event 5: Athletics
  {
    id: 501,
    event_id: 5,
    media_type: "image",
    title: "100m Sprint Finish Line Photo",
    media_url: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&auto=format&fit=crop&q=80",
    uploaded_by: "PR Coordinator",
    uploaded_at: "2026-08-04T10:00:00Z"
  },
  {
    id: 502,
    event_id: 5,
    media_type: "image",
    title: "4x100m Relay Baton Exchange",
    media_url: "https://images.unsplash.com/photo-1517649763962-0c623266010b?w=1200&auto=format&fit=crop&q=80",
    uploaded_by: "PR Coordinator",
    uploaded_at: "2026-08-04T10:45:00Z"
  }
];

export const GALLERY_DATA = GALLERY_EVENTS;
