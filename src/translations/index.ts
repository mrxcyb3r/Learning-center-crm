import { Language } from '../types';

export const translations = {
  UZ: {
    nav: {
      brand: 'Camelot LC',
      tagline: "O'quv Markazi",
      courses: 'Kurslar',
      teachers: "O'qituvchilar",
      results: 'Natijalar',
      faq: 'FAQ',
      contact: "Bog'lanish",
      login: 'Kirish',
      logout: 'Chiqish',
      devMode: 'Dev Rol',
      dashboard: 'Boshqaruv'
    },
    hero: {
      badge: 'Guliston, Sirdaryo',
      headlineMain: 'WISDOM - IS DOING!',
      headlineSub: "Sirdaryo viloyatidagi eng kuchli va zamonaviy ingliz tili o'quv markazi",
      description: "Camelot O'quv Markazida zamonaviy metodikalar, tajribali instruktorlar va xalqaro standartlar asosida ingliz tilini va IELTS sertifikatini professional darajada egallang.",
      btnCourses: "Kurslarni ko'rish",
      btnContact: "Bog'lanish",
      stats: {
        students: "2000+",
        studentsLabel: "O'quvchilar soni",
        ielts: "350+",
        ieltsLabel: "IELTS 7.0+ (2025 yildagi natijalar)",
        exp: "5+ yillik",
        expLabel: "O'quv markazi tajribasi",
        satisfaction: "98%",
        satisfactionLabel: "O'quvchilar mamnuniyati"
      }
    },
    features: {
      title: "Nega aynan Camelot LC?",
      subtitle: "Muvaffaqiyatli kelajagingiz uchun yaratilgan zamonaviy ta'lim muhiti",
      items: [
        {
          id: '1',
          title: 'Test Markazi',
          desc: 'Haftalik bepul Mock IELTS va CEFR imtihonlari hamda aniq statistik tahlil.'
        },
        {
          id: '2',
          title: 'Bepul Ikkinchi O\'qituvchi',
          desc: 'Asosiy darsdan tashqari har bir darsda savol-javob va yordam beruvchi Mentor Support.'
        },
        {
          id: '3',
          title: 'Camelot Events & Talk',
          desc: 'English Club, Debate Sessions, Camelot Talk va doimiy motivatsion tadbirlar.'
        },
        {
          id: '4',
          title: 'Tajribali O\'qituvchilar (IELTS 8.5gacha)',
          desc: 'Xalqaro sertifikatlarga va ko\'p yillik amaliy tajribaga ega ustozlar jamoasi.'
        },
        {
          id: '5',
          title: 'Co-Working va Kutubxona',
          desc: 'Sokin va shinam dars qilish zonalari, Wi-Fi va eng so\'nggi IELTS adabiyotlari.'
        },
        {
          id: '6',
          title: 'Natija Kafolati',
          desc: 'Talabchan va tizimli dars o\'tish metodikasi hamda natijaga yo\'naltirilgan nazorat.'
        }
      ]
    },
    teachers: {
      title: "O'qituvchilarimiz",
      subtitle: "Bizning xalqaro darajadagi malakali va tajribali ustozlarimiz bilan tanishing",
      badge: "IELTS Ustozi",
      expLabel: "Tajriba",
      viewBio: "Batafsil ma'lumot"
    },
    results: {
      title: "IELTS va CEFR Natijalarimiz",
      subtitle: "O'quvchilarimizning xalqaro imtihonlardagi yuqori ko'rsatkichlari",
      all: "Barchasi",
      ielts75: "IELTS 7.5+",
      ielts80: "IELTS 8.0+",
      cefr: "CEFR C1",
      overall: "Umumiy (Overall)",
      listening: "Listening",
      reading: "Reading",
      writing: "Writing",
      speaking: "Speaking",
      certificateView: "Sertifikatni ko'rish",
      closeModal: "Yopish",
      footerNote: "Va yana 2000+ dan ortiq muvaffaqiyatli natijalar..."
    },
    courses: {
      title: "Kurslarimiz",
      subtitle: "Boshlang'ich darajadan to xalqaro IELTS/SAT sertifikatigacha",
      duration: "Davomiyligi",
      level: "Darajasi",
      price: "Oylik to'lov",
      enrollBtn: "Kursga yozilish",
      popularTag: "Eng ommabop"
    },
    contact: {
      title: "Bizga bog'lanish",
      subtitle: "Savollaringiz bormi yoki darsga yozilmoqchimisiz? Formani to'ldiring!",
      nameLabel: "To'liq ismingiz",
      namePlaceholder: "Masalan: Jasur Rahimov",
      phoneLabel: "Telefon raqamingiz",
      phonePlaceholder: "+998 90 123 45 67",
      courseLabel: "Tanlangan kurs",
      courseSelectPlaceholder: "Kursni tanlang...",
      messageLabel: "Xabar yoki izohingiz (Ixtiyoriy)",
      messagePlaceholder: "Savolingiz yoki dars vaqti bo'yicha istagingiz...",
      submitBtn: "Arizani yuborish",
      successMsg: "Rahmat! Arizangiz qabul qilindi. Tez orada siz bilan bog'lanamiz.",
      addressTitle: "Bizning manzil va kontaktlar",
      addressText: "Guliston shahar, Beeline ko'cha oxiri",
      phoneText: "+998 33 600 95 95",
      telegramText: "Telegram: @Camelot_LC",
      workHours: "Ish vaqti: Dush-Shanba 08:00 - 20:00"
    },
    faq: {
      title: "Ko'p beriladigan savollar",
      subtitle: "Eng tez-tez so'raladigan savollarga javoblar",
      searchPlaceholder: "Savolni izlang..."
    },
    auth: {
      loginTab: 'Kirish',
      registerTab: "Ro'yxatdan o'tish",
      welcomeLogin: 'Xush kelibsiz! Tizimga kirish',
      welcomeRegister: 'Yangi hisob yaratish',
      emailLabel: 'Elektron pochta',
      passwordLabel: 'Parol',
      nameLabel: 'Ism va Familiya',
      roleLabel: 'Hisob Turi (Rol)',
      studentRole: "Student (O'quvchi)",
      teacherRole: "Teacher (O'qituvchi)",
      adminRole: 'Admin / SuperAdmin',
      pinLabelTeacher: "O'qituvchi Maxfiy PIN kodi",
      pinLabelAdmin: 'Admin Maxfiy PIN kodi',
      pinPlaceholderTeacher: "'secureteacher' PIN kodini kiriting",
      pinPlaceholderAdmin: "'secureadmin' PIN kodini kiriting",
      googleBtn: 'Google orqali kirish',
      orText: 'Yoki email orqali',
      noAccount: "Hali hisobingiz yo'qmi?",
      hasAccount: 'Hisobingiz bormi?',
      loginBtn: 'Tizimga kirish',
      registerBtn: "Hisob yaratish",
      superAdminDetected: "Siz SuperAdmin sifatida aniqlandingiz!",
      mockRolesHeader: "Dev Mock Rol Almashish",
      currentRole: "Amaldagi Rol",
      invalidPinTeacher: "Xato PIN! O'qituvchi sifatida kirish uchun PIN: 'secureteacher'",
      invalidPinAdmin: "Xato PIN! Admin sifatida kirish uchun PIN: 'secureadmin'",
      noPinNeeded: "O'quvchilar uchun PIN talab etilmaydi",
      selectLanguage: 'Til'
    },
    footer: {
      tagline: "Sirdaryodagi eng nufuzli ingliz tili markazi.",
      quickLinks: "Tezkor havolalar",
      rights: "Barcha huquqlar himoyalangan.",
      credit: "CenterFlow tizimi tomonidan boshqariladi."
    }
  },
  EN: {
    nav: {
      brand: 'Camelot LC',
      tagline: 'Learning Center',
      courses: 'Courses',
      teachers: 'Teachers',
      results: 'Results',
      faq: 'FAQ',
      contact: 'Contact Us',
      login: 'Sign In',
      logout: 'Sign Out',
      devMode: 'Dev Role',
      dashboard: 'Dashboard'
    },
    hero: {
      badge: 'Guliston, Sirdaryo',
      headlineMain: 'WISDOM - IS DOING!',
      headlineSub: 'The Premier English Learning Center in Sirdaryo Region',
      description: 'Master English and achieve high IELTS scores at Camelot Learning Center with modern interactive methods, experienced instructors, and international standards.',
      btnCourses: 'Explore Courses',
      btnContact: 'Get in Touch',
      stats: {
        students: "2000+",
        studentsLabel: "Total Students Trained",
        ielts: "350+",
        ieltsLabel: "IELTS 7.0+ Achievements (2025)",
        exp: "5+ Years",
        expLabel: "Excellence & Experience",
        satisfaction: "98%",
        satisfactionLabel: "Student Satisfaction Rate"
      }
    },
    features: {
      title: "Why Choose Camelot LC?",
      subtitle: "A modern educational ecosystem designed for your ultimate success",
      items: [
        {
          id: '1',
          title: 'Mock Test Center',
          desc: 'Weekly free Mock IELTS & CEFR exams with in-depth analytical feedback.'
        },
        {
          id: '2',
          title: 'Free Support Teacher',
          desc: 'Dedicated mentor support teachers available in every class for Q&A.'
        },
        {
          id: '3',
          title: 'Camelot Events & Talk',
          desc: 'English Club, Debate Sessions, Camelot Talk shows, and motivational events.'
        },
        {
          id: '4',
          title: 'Expert Instructors (up to 8.5 IELTS)',
          desc: 'Highly qualified mentors holding top international credentials.'
        },
        {
          id: '5',
          title: 'Co-Working & Library Zone',
          desc: 'Quiet, modern study spots with high-speed Wi-Fi and latest IELTS books.'
        },
        {
          id: '6',
          title: 'Guaranteed Outcomes',
          desc: 'Systematic curriculum and high accountability designed for top scores.'
        }
      ]
    },
    teachers: {
      title: "Our Esteemed Teachers",
      subtitle: "Meet our passionate, internationally certified mentors",
      badge: "IELTS Instructor",
      expLabel: "Experience",
      viewBio: "View Full Profile"
    },
    results: {
      title: "IELTS & CEFR Achievements",
      subtitle: "Celebrating high score achievements of our outstanding students",
      all: "All Results",
      ielts75: "IELTS 7.5+",
      ielts80: "IELTS 8.0+",
      cefr: "CEFR C1",
      overall: "Overall Score",
      listening: "Listening",
      reading: "Reading",
      writing: "Writing",
      speaking: "Speaking",
      certificateView: "View Certificate",
      closeModal: "Close",
      footerNote: "And over 2000+ more successful student achievements..."
    },
    courses: {
      title: "Our Courses",
      subtitle: "From foundational English to advanced IELTS & SAT prep",
      duration: "Duration",
      level: "Target Level",
      price: "Monthly Fee",
      enrollBtn: "Enroll Now",
      popularTag: "Most Popular"
    },
    contact: {
      title: "Get in Touch",
      subtitle: "Have questions or want to join a trial lesson? Leave your details below!",
      nameLabel: "Your Full Name",
      namePlaceholder: "E.g., Jasur Rahimov",
      phoneLabel: "Phone Number",
      phonePlaceholder: "+998 90 123 45 67",
      courseLabel: "Selected Course",
      courseSelectPlaceholder: "Choose a course...",
      messageLabel: "Message / Inquiry (Optional)",
      messagePlaceholder: "Specify preferred schedule or questions...",
      submitBtn: "Send Application",
      successMsg: "Thank you! Your application has been received. We will call you soon.",
      addressTitle: "Location & Contacts",
      addressText: "Guliston City, end of Beeline Street",
      phoneText: "+998 33 600 95 95",
      telegramText: "Telegram: @Camelot_LC",
      workHours: "Operating Hours: Mon-Sat 08:00 - 20:00"
    },
    faq: {
      title: "Frequently Asked Questions",
      subtitle: "Everything you need to know about learning at Camelot LC",
      searchPlaceholder: "Search question..."
    },
    auth: {
      loginTab: 'Sign In',
      registerTab: 'Sign Up',
      welcomeLogin: 'Welcome Back! Sign In',
      welcomeRegister: 'Create New Account',
      emailLabel: 'Email Address',
      passwordLabel: 'Password',
      nameLabel: 'Full Name',
      roleLabel: 'Account Role',
      studentRole: 'Student',
      teacherRole: 'Teacher',
      adminRole: 'Admin / SuperAdmin',
      pinLabelTeacher: 'Teacher Security PIN',
      pinLabelAdmin: 'Admin Security PIN',
      pinPlaceholderTeacher: "Enter 'secureteacher' PIN",
      pinPlaceholderAdmin: "Enter 'secureadmin' PIN",
      googleBtn: 'Continue with Google',
      orText: 'Or with Email',
      noAccount: "Don't have an account?",
      hasAccount: 'Already have an account?',
      loginBtn: 'Sign In',
      registerBtn: 'Create Account',
      superAdminDetected: 'Detected as SuperAdmin!',
      mockRolesHeader: 'Dev Mock Role Switcher',
      currentRole: 'Active Role',
      invalidPinTeacher: "Invalid Security PIN! Teacher requires: 'secureteacher'",
      invalidPinAdmin: "Invalid Security PIN! Admin requires: 'secureadmin'",
      noPinNeeded: 'No PIN required for Students',
      selectLanguage: 'Language'
    },
    footer: {
      tagline: 'The leading English language academy in Sirdaryo.',
      quickLinks: 'Quick Links',
      rights: 'All rights reserved.',
      credit: 'Powered by CenterFlow Platform.'
    }
  }
};

export function getTranslation(lang: Language) {
  return translations[lang] || translations.UZ;
}
