import { Movie } from '../types';

export const featuredMovie: Movie = {
  id: 'last-horizon',
  title: 'THE LAST HORIZON',
  year: 2026,
  genre: 'Sci-Fi',
  duration: '2h 08m',
  rating: 8.7,
  badge: 'TOP 10 THIS WEEK',
  description: 'A lone astronaut ventures beyond the known system and discovers a world that could change everything.',
  poster: '/assets/hero_clean.png',
  backdrop: '/assets/hero_clean.png',
  videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  cast: ['Alexander Vance', 'Elena Rostova', 'Kaelen Thorne'],
  director: 'Marcus Sterling'
};

export const trendingMovies: Movie[] = [
  {
    id: 'silent-deep',
    title: 'THE SILENT DEEP',
    year: 2026,
    genre: 'Mystery / Sci-Fi',
    duration: '1h 54m',
    rating: 8.4,
    description: 'In the uncharted depths of the oceanic abyss, an underwater research team encounters an ancient planetary intelligence.',
    poster: '/assets/poster_silent_deep.png',
    backdrop: '/assets/poster_silent_deep.png',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    cast: ['Maya Lin', 'David Chen', 'Sarah Jenkins'],
    director: 'Guillermo Cruz'
  },
  {
    id: 'ember-skies',
    title: 'EMBER SKIES',
    year: 2026,
    genre: 'Action / Adventure',
    duration: '2h 15m',
    rating: 8.9,
    description: 'A lone desert nomad journeys across scorched dunes under twin suns to reignite the atmospheric shield before the stellar pulse hits.',
    poster: '/assets/poster_ember_skies.png',
    backdrop: '/assets/poster_ember_skies.png',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    cast: ['Christian Cole', 'Aria Stark', 'Kenji Sato'],
    director: 'Denis Vane'
  },
  {
    id: 'null-zone',
    title: 'THE NULL ZONE',
    year: 2026,
    genre: 'Sci-Fi / Thriller',
    duration: '2h 01m',
    rating: 8.6,
    description: 'When the gravitational boundary of an artificial singularity collapses, an elite pilot must breach the event horizon to rescue her crew.',
    poster: '/assets/poster_null_zone.png',
    backdrop: '/assets/poster_null_zone.png',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    cast: ['Olivia Wilde', 'Thomas H. Wright', 'Zoe Morales'],
    director: 'Christopher Nolan'
  },
  {
    id: 'orbital-blood',
    title: 'ORBITAL BLOOD',
    year: 2026,
    genre: 'Action / Sci-Fi',
    duration: '1h 48m',
    rating: 8.2,
    description: 'High above a contested planetary colony, an orbital defense officer is targeted by rogue bio-synthetic infiltrators.',
    poster: '/assets/poster_orbital_blood.png',
    backdrop: '/assets/poster_orbital_blood.png',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    cast: ['James Mercer', 'Laura Croft', 'Dmitri Volkov'],
    director: 'Ridley Scott'
  }
];

export const sciFiPicks: Movie[] = [
  {
    id: 'chronos-paradox',
    title: 'CHRONOS PARADOX',
    year: 2025,
    genre: 'Sci-Fi / Drama',
    duration: '2h 10m',
    rating: 8.8,
    description: 'Time dilation experiment opens a gateway into parallel timelines that threaten to erase reality itself.',
    poster: '/assets/poster_ember_skies.png',
    backdrop: '/assets/poster_ember_skies.png',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4'
  },
  {
    id: 'abyss-horizon',
    title: 'ABYSS HORIZON',
    year: 2026,
    genre: 'Sci-Fi / Horror',
    duration: '1h 50m',
    rating: 8.1,
    description: 'Deep space anomaly pulls an exploratory cruiser into an unknown void where physics ceases to apply.',
    poster: '/assets/poster_silent_deep.png',
    backdrop: '/assets/poster_silent_deep.png',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'
  },
  {
    id: 'singularity-rise',
    title: 'SINGULARITY RISE',
    year: 2026,
    genre: 'Cyberpunk',
    duration: '2h 20m',
    rating: 8.5,
    description: 'The first sentient synthetic mind awakens in neo-Shinjuku, sparking an unprecedented planetary awakening.',
    poster: '/assets/poster_null_zone.png',
    backdrop: '/assets/poster_null_zone.png',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4'
  },
  {
    id: 'solar-flare',
    title: 'SOLAR FLARE',
    year: 2025,
    genre: 'Disaster / Sci-Fi',
    duration: '1h 56m',
    rating: 7.9,
    description: 'A catastrophic superflare disables global satellites, leaving mankind in sudden darkness.',
    poster: '/assets/poster_orbital_blood.png',
    backdrop: '/assets/poster_orbital_blood.png',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4'
  }
];
