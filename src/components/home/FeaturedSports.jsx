import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Users, ArrowRight, CheckCircle, Flame } from 'lucide-react';
import { SPORTS_DATA } from '../../data/sportsData';

export const FeaturedSports = () => {
  const featured = SPORTS_DATA.slice(0, 6);

  return (
    <section className="py-16 sm:py-24 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <span>Championship Disciplines</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Featured <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-orange-500">Sports</span>
            </h2>
          </div>
          <Link
            to="/sports"
            className="inline-flex items-center gap-2 font-bold text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition group"
          >
            <span>Explore All 11 Sports</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featured.map((sport) => (
            <div
              key={sport.id}
              className="group bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-soft hover:shadow-xl hover:border-blue-500/50 transition-all duration-300 flex flex-col justify-between"
            >
              {/* Image & Badges */}
              <div className="relative h-56 overflow-hidden">
                <img
                  src={sport.image}
                  alt={sport.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-900/90 backdrop-blur-md text-blue-400 border border-slate-700">
                    {sport.category}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-black backdrop-blur-md border ${
                    sport.status === 'Closing Soon'
                      ? 'bg-orange-500 text-white border-orange-400'
                      : 'bg-emerald-600 text-white border-emerald-500'
                  }`}>
                    {sport.status}
                  </span>
                </div>

                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-2xl font-black text-white tracking-tight">{sport.name}</h3>
                  <p className="text-xs text-slate-300 line-clamp-1">{sport.tagline}</p>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {sport.description}
                </p>

                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Team Size</span>
                    <span className="font-bold text-slate-900 dark:text-white">{sport.teamSize}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Entry Fee</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{sport.entryFee}</span>
                  </div>
                </div>

                <Link
                  to={`/registration?sport=${sport.id}`}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-md shadow-blue-500/20 text-center transition flex items-center justify-center gap-2"
                >
                  <span>Register Now</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
