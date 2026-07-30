import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { Star, Award, CheckCircle2 } from 'lucide-react';
import { TypewriterText } from './TypewriterText';
import { useLanguage } from '../../context/LanguageContext';

interface Achiever {
  name: string;
  score: string;
  course: string;
  commentUz: string;
  commentEn: string;
  commentRu: string;
  image: string;
  university?: string;
}

const mockAchievers: Achiever[] = [
  {
    name: 'Jasur Rahimov',
    score: 'IELTS 8.5',
    course: 'IELTS Rocket Intensive',
    commentUz: 'Renessans Learning Center va AI Tutor yordamida Speaking 8.5 ga chiqdim! Sunʼiy intellect har kuni insholarimni xatosiz tekshirib berdi.',
    commentEn: 'Achieved IELTS Speaking 8.5 with Renessans Learning Center & AI Tutor! The AI graded my daily essays with detailed feedback.',
    commentRu: 'С помощью Renessans Learning Center и AI Tutor поднял Speaking до 8.5! ИИ ежедневно детально проверял мои эссе.',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
    university: 'Westminster Int. University',
  },
  {
    name: 'Madina Ismoilova',
    score: 'IELTS 8.0',
    course: 'General & Academic English',
    commentUz: 'Real-vaqt rejimida qatnashilgan darslar va toʼlovlar monitoringi tizimi juda qulay. Ota-onam ham Telegram orqali natijamni koʼrib turishdi.',
    commentEn: 'Real-time interactive classes and automated tuition tracking are super smooth. My parents also stayed updated via Telegram.',
    commentRu: 'Интерактивные занятия и отслеживание оплаты очень удобны. Мои родители получали отчеты через Telegram.',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=300',
    university: 'Tashkent State Law Univ.',
  },
  {
    name: 'Sardorbek Aliyev',
    score: 'IELTS 8.0',
    course: 'SAT & IELTS Mastery',
    commentUz: 'Oʻqituvchilar yuqori malakali. Ayniqsa IELTS Mock imtihonlari va AI Coaching xizmati imtihondagi hayajonni butunlay yoʻqotdi.',
    commentEn: 'Teachers are highly experienced. The IELTS Mock exams and AI Coaching completely built my confidence for the test day.',
    commentRu: 'Преподаватели очень квалифицированные. Пробные экзамены IELTS и AI Coaching сняли волнение пред экзаменом.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
    university: 'INHA University in Tashkent',
  },
  {
    name: 'Gulnoza Karimova',
    score: 'IELTS 7.5',
    course: 'IELTS Foundation',
    commentUz: '3 oy ichida 6.0 dan 7.5 gacha koʻtarildim. Renessans markazining interaktiv kabineti va davomat nazorati intizomni oshirdi.',
    commentEn: 'Improved from 6.0 to 7.5 in 3 months. Renessans student dashboard and attendance tracking kept me strictly disciplined.',
    commentRu: 'Подняла результат с 6.0 до 7.5 за 3 месяца. Личный кабинет и контроль посещаемости помогли соблюдать дисциплину.',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300',
    university: 'TUIT / TATU',
  },
];

export const TestimonialsCarousel: React.FC = () => {
  const { translate } = useLanguage();

  return (
    <div className="w-full space-y-6">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold text-xs uppercase tracking-wider border border-amber-500/30 inline-block">
          {translate("Yuqori Natijalar va Sharhlar", "Top Achievers & Reviews", "Высокие результаты и отзывы")}
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          <TypewriterText
            texts={[
              translate("Bizning O'quvchilar Muvaffaqiyati", "Our Student Success Stories", "Успехи наших студентов"),
              translate("Top IELTS Achievers & Testimonials", "Top IELTS Achievers & Testimonials", "Отзывы лучших выпускников IELTS"),
              translate("100% Shaffof Natijalar va Sertifikatlar", "100% Transparent Results & Certificates", "100% прозрачные результаты и сертификаты")
            ]}
            speed={45}
            loop={true}
            cursorColorClass="text-amber-500 font-black"
          />
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
          {translate(
            "Renessans Learning Center bitiruvchilarining erishgan natijalari va haqiqiy fikrlari",
            "Real reviews and verified band scores from Renessans Learning Center graduates",
            "Реальные отзывы и подтвержденные результаты выпускников Renessans Learning Center"
          )}
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
                    "{translate(item.commentUz, item.commentEn, item.commentRu)}"
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
