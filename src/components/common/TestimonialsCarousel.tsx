import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { Star, Award, CheckCircle2 } from 'lucide-react';
import { TypewriterText } from './TypewriterText';

interface Achiever {
  name: string;
  score: string;
  course: string;
  comment: string;
  image: string;
  university?: string;
}

const mockAchievers: Achiever[] = [
  {
    name: 'Jasur Rahimov',
    score: 'IELTS 8.5',
    course: 'IELTS Rocket Intensive',
    comment: 'Renessans Learning Center va AI Tutor yordamida Speaking 8.5 ga chiqdim! Sunʼiy intellect har kuni insholarimni xatosiz tekshirib berdi.',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
    university: 'Westminster Int. University',
  },
  {
    name: 'Madina Ismoilova',
    score: 'IELTS 8.0',
    course: 'General & Academic English',
    comment: 'Real-vaqt rejimida qatnashilgan darslar va toʼlovlar monitoringi tizimi juda qulay. Ota-onam ham Telegram orqali natijamni koʼrib turishdi.',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=300',
    university: 'Tashkent State Law Univ.',
  },
  {
    name: 'Sardorbek Aliyev',
    score: 'IELTS 8.0',
    course: 'SAT & IELTS Mastery',
    comment: 'Oʻqituvchilar yuqori malakali. Ayniqsa IELTS Mock imtihonlari va AI Coaching xizmati imtihondagi hayajonni butunlay yoʻqotdi.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
    university: 'INHA University in Tashkent',
  },
  {
    name: 'Gulnoza Karimova',
    score: 'IELTS 7.5',
    course: 'IELTS Foundation',
    comment: '3 oy ichida 6.0 dan 7.5 gacha koʻtarildim. Renessans markazining interaktiv kabineti va davomat nazorati intizomni oshirdi.',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300',
    university: 'TUIT / TATU',
  },
];

export const TestimonialsCarousel: React.FC = () => {
  return (
    <div className="w-full space-y-6">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold text-xs uppercase tracking-wider border border-amber-500/30 inline-block">
          Yuqori Natijalar va Sharhlar
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          <TypewriterText
            texts={[
              "Bizning O'quvchilar Muvaffaqiyati",
              "Top IELTS Achievers & Testimonials",
              "100% Shaffof Natijalar va Sertifikatlar"
            ]}
            speed={45}
            loop={true}
            cursorColorClass="text-amber-500 font-black"
          />
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
          Renessans Learning Center bitiruvchilarining erishgan natijalari va haqiqiy fikrlari
        </p>
      </div>

      <div className="px-2 sm:px-6">
        <Swiper
          modules={[Autoplay, Pagination, Navigation]}
          spaceBetween={20}
          slidesPerView={1}
          breakpoints={{
            640: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }}
          autoplay={{
            delay: 4000,
            disableOnInteraction: false,
          }}
          pagination={{ clickable: true }}
          className="pb-12 pt-2"
        >
          {mockAchievers.map((item, idx) => (
            <SwiperSlide key={idx} className="h-auto">
              <div className="h-full p-6 rounded-3xl bg-white/90 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-xl flex flex-col justify-between space-y-4 hover:border-amber-500/50 transition duration-300">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-500" />
                      ))}
                    </div>
                    <span className="px-3 py-1 rounded-xl bg-amber-500 text-slate-950 font-black text-xs font-mono shadow-md flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" />
                      {item.score}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 italic leading-relaxed font-medium">
                    "{item.comment}"
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-slate-200/80 dark:border-slate-800/80">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-11 h-11 rounded-2xl object-cover border-2 border-amber-500/40 shadow-sm shrink-0"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                      <span>{item.name}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                    </h4>
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">{item.course}</p>
                    {item.university && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{item.university}</p>
                    )}
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
};
