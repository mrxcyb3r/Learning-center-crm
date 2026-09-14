import { Language } from '../types';

export const translations = {
  UZ: {
    nav: {
      brand: 'Renessans LC',
      tagline: "Learning Center",
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
      badge: 'Toshkent / Markaziy Filial',
      headlineMain: "INNOVATSION TA'LIM VA YUQORI NATIJALAR",
      headlineSub: "Sifatli ta'lim, kuchli o'qituvchilar va zamonaviy o'quv muhiti bilan kelajagingizni biz bilan quring.",
      description: "Renessans Learning Center bilan zamonaviy ta'lim standartlari, malakali pedagoglar va natijaga yo'naltirilgan o'quv tizimi orqali kelajagingizni poydevorini yarating.",
      btnCourses: "Kurslarni ko'rish",
      btnContact: "Bog'lanish",
      stats: {
        students: "1,500+",
        studentsLabel: "O'quvchilar soni",
        ielts: "280+",
        ieltsLabel: "IELTS 7.0+ Natijalar",
        exp: "95%",
        expLabel: "OTMga Kirish Ko'rsatkichi",
        satisfaction: "4+ Yil",
        satisfactionLabel: "Muvaffaqiyatli Tajriba"
      }
    },
    features: {
      title: "Nega Aynan Renessans?",
      subtitle: "Kelajagingiz uchun ishonchli va zamonaviy ta'lim dargohi",
      items: [
        {
          id: '1',
          title: 'Individual Yondashuv',
          desc: "Har bir o'quvchining bilim darajasi va maqsadlariga moslashtirilgan shaxsiy o'quv rejalari."
        },
        {
          id: '2',
          title: 'Tajribali Mentorlar (IELTS 8.0+ & CEFR C1)',
          desc: "Xalqaro sertifikatlarga va ko'p yillik pedagogik tajribaga ega bo'lgan kuchli mutaxassislar."
        },
        {
          id: '3',
          title: 'IT va Zamonaviy Sharoit',
          desc: "Zamonaviy kompyuter xonalari, shinam sinf xonalari hamda yuqori tezlikdagi internet."
        },
        {
          id: '4',
          title: 'Muntazam Mock Testlar',
          desc: "Haqiqiy imtihon muhitida o'tkaziladigan sinovlar hamda batafsil tahlil va feedback."
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
      phonePlaceholder: "+998 88 648 49 49",
      courseLabel: "Tanlangan kurs",
      courseSelectPlaceholder: "Kursni tanlang...",
      messageLabel: "Xabar yoki izohingiz (Ixtiyoriy)",
      messagePlaceholder: "Savolingiz yoki dars vaqti bo'yicha istagingiz...",
      submitBtn: "Arizani yuborish",
      successMsg: "Rahmat! Arizangiz qabul qilindi. Tez orada siz bilan bog'lanamiz.",
      addressTitle: "Bizning manzil va kontaktlar",
      addressText: "Yangiobod tumani, 1-sonli umumiy o'rta ta'lim maktabi binosi",
      phoneText: "+998 (88) 648-49-49",
      telegramText: "Telegram: @D_Furqatovich",
      workHours: "Ish vaqti: Dushanba–Shanba 08:00–19:00; Yakshanba: Haftalik Diagnostik & Mock Testlar"
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
      passwordLabel: 'Parol / PIN Kod (min 4 belgilar)',
      nameLabel: 'Ism va Familiya',
      roleLabel: 'Hisob Turi (Rol)',
      studentRole: "Student (O'quvchi)",
      teacherRole: "Teacher (O'qituvchi)",
      adminRole: 'Admin / SuperAdmin',
      pinLabelStudent: "O'quvchi Maxfiy PIN kodi",
      pinLabelTeacher: "O'qituvchi Maxfiy PIN kodi",
      pinLabelAdmin: 'Admin Maxfiy PIN kodi',
      pinPlaceholderStudent: "'securestudent' PIN kodini kiriting",
      pinPlaceholderTeacher: "'secureteacher' PIN kodini kiriting",
      pinPlaceholderAdmin: "'secureadmin' PIN kodini kiriting",
      studentPinNotice: "O'quvchi xavfsizlik PIN kodi: 'securestudent'",
      googleBtn: 'Google orqali kirish',
      orText: 'Yoki email orqali',
      noAccount: "Hali hisobingiz yo'qmi?",
      hasAccount: 'Hisobingiz bormi?',
      loginBtn: 'Tizimga kirish',
      registerBtn: "Hisob yaratish",
      superAdminDetected: "Siz SuperAdmin sifatida aniqlandingiz!",
      mockRolesHeader: "Dev Mock Rol Almashish",
      currentRole: "Amaldagi Rol",
      invalidPinStudent: "Xato PIN! O'quvchi sifatida kirish uchun PIN: 'securestudent'",
      invalidPinTeacher: "Xato PIN! O'qituvchi sifatida kirish uchun PIN: 'secureteacher'",
      invalidPinAdmin: "Xato PIN! Admin sifatida kirish uchun PIN: 'secureadmin'",
      noPinNeeded: "O'quvchilar 4 xonali PIN bilan kirishi mumkin",
      selectLanguage: 'Til',
      securityPinTitle: "Xavfsizlik va PIN kodlar",
      studentAccessPin: "O'quvchi kirish PIN kodi",
      enterStudentPin: "O'quvchi PIN kodini kiriting",
      defaultPinNotice: "Boshlang'ich PIN: securestudent",
      invalidPinCode: "Noto'g'ri PIN kod",
      yearsOfExperience: "yillik tajriba",
      workExperience: "Ish tajribasi",
      saveAllSettings: "Barcha sozlamalarni saqlash",
      settingsSavedSuccess: "Sozlamalar muvaffaqiyatli saqlandi",
      settingsSaveError: "Sozlamalarni saqlashda xatolik",
      unverifiedTitle: "Elektron pochta tasdiqlanmagan",
      unverifiedNotice: "Elektron pochtangizga tasdiqlash havolasi yuborilgan. Iltimos, pochtangizni tekshiring va havolani bosing.",
      resendVerificationBtn: "Tasdiqlash xabarini qayta yuborish",
      checkVerificationBtn: "Tasdiqlanganini tekshirish",
      verificationSentSuccess: "Tasdiqlash xati qayta yuborildi! Pochtangizni tekshiring.",
      emailVerifiedSuccess: "Pochta muvaffaqiyatli tasdiqlandi! Tizimga kirishingiz mumkin."
    },
    footer: {
      tagline: "Renessans Learning Center - Innovatsion Ta'lim va Yuqori Natijalar.",
      quickLinks: "Tezkor havolalar",
      rights: "Barcha huquqlar himoyalangan.",
      credit: "CenterFlow platformasi tomonidan boshqariladi."
    }
  },
  EN: {
    nav: {
      brand: 'Renessans LC',
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
      badge: 'Tashkent / Main Branch',
      headlineMain: 'INNOVATIVE EDUCATION & HIGH RESULTS',
      headlineSub: 'Build your future with quality education, strong teachers, and a modern environment.',
      description: 'Build the foundation of your future with Renessans Learning Center through modern educational standards, qualified instructors, and a result-oriented academic system.',
      btnCourses: 'Explore Courses',
      btnContact: 'Get in Touch',
      stats: {
        students: "1,500+",
        studentsLabel: "Enrolled Students",
        ielts: "280+",
        ieltsLabel: "IELTS 7.0+ Results",
        exp: "95%",
        expLabel: "University Admission Rate",
        satisfaction: "4+ Years",
        satisfactionLabel: "Successful Experience"
      }
    },
    features: {
      title: "Why Renessans?",
      subtitle: "A modern educational hub designed for your future",
      items: [
        {
          id: '1',
          title: 'Individual Approach',
          desc: 'Personalized study plans tailored to each student level and goals.'
        },
        {
          id: '2',
          title: 'Experienced Mentors (IELTS 8.0+ & CEFR C1)',
          desc: 'Qualified specialists with international certificates and teaching experience.'
        },
        {
          id: '3',
          title: 'IT & Modern Facilities',
          desc: 'State-of-the-art computer labs, comfortable classrooms, and high-speed internet.'
        },
        {
          id: '4',
          title: 'Regular Mock Tests',
          desc: 'Simulated real exam conditions with detailed performance analytics.'
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
      phonePlaceholder: "+998 88 648 49 49",
      courseLabel: "Selected Course",
      courseSelectPlaceholder: "Choose a course...",
      messageLabel: "Message / Inquiry (Optional)",
      messagePlaceholder: "Specify preferred schedule or questions...",
      submitBtn: "Send Application",
      successMsg: "Thank you! Your application has been received. We will call you soon.",
      addressTitle: "Location & Contacts",
      addressText: "Yangiobod District, 1st General Secondary School Building",
      phoneText: "+998 (88) 648-49-49",
      telegramText: "Telegram: @D_Furqatovich",
      workHours: "Operating Hours: Mon–Sat 08:00–19:00; Sun: Weekly Diagnostic & Mock Tests"
    },
    faq: {
      title: "Frequently Asked Questions",
      subtitle: "Everything you need to know about learning at Renessans Learning Center",
      searchPlaceholder: "Search question..."
    },
    auth: {
      loginTab: 'Sign In',
      registerTab: 'Sign Up',
      welcomeLogin: 'Welcome Back! Sign In',
      welcomeRegister: 'Create New Account',
      emailLabel: 'Email Address',
      passwordLabel: 'Password / PIN (min 4 digits)',
      nameLabel: 'Full Name',
      roleLabel: 'Account Role',
      studentRole: 'Student',
      teacherRole: 'Teacher',
      adminRole: 'Admin / SuperAdmin',
      pinLabelStudent: 'Student Security PIN',
      pinLabelTeacher: 'Teacher Security PIN',
      pinLabelAdmin: 'Admin Security PIN',
      pinPlaceholderStudent: "Enter 'securestudent' PIN",
      pinPlaceholderTeacher: "Enter 'secureteacher' PIN",
      pinPlaceholderAdmin: "Enter 'secureadmin' PIN",
      studentPinNotice: "Student security PIN: 'securestudent'",
      googleBtn: 'Continue with Google',
      orText: 'Or with Email',
      noAccount: "Don't have an account?",
      hasAccount: 'Already have an account?',
      loginBtn: 'Sign In',
      registerBtn: 'Create Account',
      superAdminDetected: 'Detected as SuperAdmin!',
      mockRolesHeader: 'Dev Mock Role Switcher',
      currentRole: 'Active Role',
      invalidPinStudent: "Invalid Security PIN! Student requires: 'securestudent'",
      invalidPinTeacher: "Invalid Security PIN! Teacher requires: 'secureteacher'",
      invalidPinAdmin: "Invalid Security PIN! Admin requires: 'secureadmin'",
      noPinNeeded: 'Students can log in with a 4-digit PIN',
      selectLanguage: 'Language',
      securityPinTitle: "Security & PIN Codes",
      studentAccessPin: "Student Access PIN",
      enterStudentPin: "Enter Student Access PIN",
      defaultPinNotice: "Default PIN is securestudent",
      invalidPinCode: "Invalid PIN Code",
      yearsOfExperience: "Years of Experience",
      workExperience: "Work Experience",
      saveAllSettings: "Save All Settings",
      settingsSavedSuccess: "Settings saved successfully",
      settingsSaveError: "Failed to save settings",
      unverifiedTitle: "Email Not Verified",
      unverifiedNotice: "A verification link was sent to your email address. Please check your inbox and click the link to verify.",
      resendVerificationBtn: "Resend Verification Email",
      checkVerificationBtn: "I've Verified, Check Status",
      verificationSentSuccess: "Verification email resent! Please check your inbox.",
      emailVerifiedSuccess: "Email successfully verified! Welcome to CenterFlow."
    },
    footer: {
      tagline: 'Renessans Learning Center - Innovative Education & High Results.',
      quickLinks: 'Quick Links',
      rights: 'All rights reserved.',
      credit: 'Powered by CenterFlow Platform.'
    }
  },
  RU: {
    nav: {
      brand: 'Renessans LC',
      tagline: 'Учебный Центр',
      courses: 'Курсы',
      teachers: 'Преподаватели',
      results: 'Результаты',
      faq: 'FAQ',
      contact: 'Контакты',
      login: 'Войти',
      logout: 'Выйти',
      devMode: 'Dev Роль',
      dashboard: 'Панель управления'
    },
    hero: {
      badge: 'Ташкент / Главный Филиал',
      headlineMain: 'ИННОВАЦИОННОЕ ОБУЧЕНИЕ И ВЫСОКИЕ РЕЗУЛЬТАТЫ',
      headlineSub: 'Постройте свое будущее с качественным образованием и опытными преподавателями.',
      description: 'Создайте фундамент своего будущего с Renessans Learning Center благодаря современным стандартам обучения и результативной системе.',
      btnCourses: 'Посмотреть курсы',
      btnContact: 'Связаться с нами',
      stats: {
        students: "1,500+",
        studentsLabel: "Учеников",
        ielts: "280+",
        ieltsLabel: "Результатов IELTS 7.0+",
        exp: "95%",
        expLabel: "Поступление в ВУЗы",
        satisfaction: "4+ Года",
        satisfactionLabel: "Успешного опыта"
      }
    },
    features: {
      title: "Почему Именно Renessans?",
      subtitle: "Современный образовательный центр для вашего будущего",
      items: [
        {
          id: '1',
          title: 'Индивидуальный Подход',
          desc: 'Персональные учебные планы для каждого студента.'
        },
        {
          id: '2',
          title: 'Опытные Менторы (IELTS 8.0+ & CEFR C1)',
          desc: 'Квалифицированные специалисты с международными сертификатами.'
        },
        {
          id: '3',
          title: 'IT и Современные Условия',
          desc: 'Современные компьютерные классы и высокоскоростной интернет.'
        },
        {
          id: '4',
          title: 'Регулярные Mock Тесты',
          desc: 'Симуляция реальных экзаменов с подробным анализом.'
        }
      ]
    },
    teachers: {
      title: "Наши Преподаватели",
      subtitle: "Познакомьтесь с нашими опытными преподавателями международного уровня",
      badge: "Инструктор IELTS",
      expLabel: "Опыт",
      viewBio: "Подробнее"
    },
    results: {
      title: "Результаты IELTS и CEFR",
      subtitle: "Высокие показатели наших студентов на международных экзаменах",
      all: "Все",
      ielts75: "IELTS 7.5+",
      ielts80: "IELTS 8.0+",
      cefr: "CEFR C1",
      overall: "Общий балл",
      listening: "Listening",
      reading: "Reading",
      writing: "Writing",
      speaking: "Speaking",
      certificateView: "Посмотреть сертификат",
      closeModal: "Закрыть",
      footerNote: "И более 2000+ других успешных результатов..."
    },
    courses: {
      title: "Наши Курсы",
      subtitle: "От базового уровня до продвинутой подготовки к IELTS и SAT",
      duration: "Длительность",
      level: "Уровень",
      price: "Ежемесячная оплата",
      enrollBtn: "Записаться на курс",
      popularTag: "Самый популярный"
    },
    contact: {
      title: "Связаться с нами",
      subtitle: "Есть вопросы или хотите записаться на урок? Заполните форму!",
      nameLabel: "Ваше полное имя",
      namePlaceholder: "Например: Джасур Рахимов",
      phoneLabel: "Номер телефона",
      phonePlaceholder: "+998 88 648 49 49",
      courseLabel: "Выбранный курс",
      courseSelectPlaceholder: "Выберите курс...",
      messageLabel: "Сообщение или вопрос (необязательно)",
      messagePlaceholder: "Укажите ваши пожелания...",
      submitBtn: "Отправить заявку",
      successMsg: "Спасибо! Ваша заявка принята. Мы скоро свяжемся с вами.",
      addressTitle: "Адрес и контакты",
      addressText: "Янгиободский район, здание 1-й общеобразовательной школы",
      phoneText: "+998 (88) 648-49-49",
      telegramText: "Telegram: @D_Furqatovich",
      workHours: "Режим работы: Пн–Сб 08:00–19:00; Вс: Еженедельная диагностика и Mock-тесты"
    },
    faq: {
      title: "Часто задаваемые вопросы",
      subtitle: "Ответы на самые распространенные вопросы",
      searchPlaceholder: "Поиск вопроса..."
    },
    auth: {
      loginTab: 'Вход',
      registerTab: 'Регистрация',
      welcomeLogin: 'Добро пожаловать! Войдите в аккаунт',
      welcomeRegister: 'Создать новый аккаунт',
      emailLabel: 'Электронная почта',
      passwordLabel: 'Пароль / PIN код (мин. 4 символа)',
      nameLabel: 'Имя и Фамилия',
      roleLabel: 'Тип аккаунта (Роль)',
      studentRole: 'Студент',
      teacherRole: 'Преподаватель',
      adminRole: 'Админ / СуперАдмин',
      pinLabelStudent: 'Секретный PIN Студента',
      pinLabelTeacher: 'Секретный PIN Преподавателя',
      pinLabelAdmin: 'Секретный PIN Админа',
      pinPlaceholderStudent: "Введите PIN 'securestudent'",
      pinPlaceholderTeacher: "Введите PIN 'secureteacher'",
      pinPlaceholderAdmin: "Введите PIN 'secureadmin'",
      studentPinNotice: "ПИН-код безопасности студента: 'securestudent'",
      googleBtn: 'Войти через Google',
      orText: 'Или через email',
      noAccount: 'Еще нет аккаунта?',
      hasAccount: 'Уже есть аккаунт?',
      loginBtn: 'Войти',
      registerBtn: 'Зарегистрироваться',
      superAdminDetected: 'Обнаружен СуперАдмин!',
      mockRolesHeader: 'Dev Переключатель ролей',
      currentRole: 'Текущая роль',
      invalidPinStudent: "Неверный PIN! Для входа студента: 'securestudent'",
      invalidPinTeacher: "Неверный PIN! Для входа преподавателя: 'secureteacher'",
      invalidPinAdmin: "Неверный PIN! Для входа админа: 'secureadmin'",
      noPinNeeded: 'Студенты могут войти по 4-значному PIN',
      selectLanguage: 'Язык',
      securityPinTitle: "Безопасность и PIN-коды",
      studentAccessPin: "PIN-код доступа для студентов",
      enterStudentPin: "Введите PIN-код студента",
      defaultPinNotice: "PIN по умолчанию: securestudent",
      invalidPinCode: "Неверный PIN-код",
      yearsOfExperience: "лет опыта",
      workExperience: "Опыт работы",
      saveAllSettings: "Сохранить все настройки",
      settingsSavedSuccess: "Настройки успешно сохранены",
      settingsSaveError: "Ошибка при сохранении настроек",
      unverifiedTitle: "Email не подтвержден",
      unverifiedNotice: "Ссылка для подтверждения отправлена на вашу почту. Пожалуйста, проверьте почту.",
      resendVerificationBtn: "Отправить письмо повторно",
      checkVerificationBtn: "Я подтвердил, проверить",
      verificationSentSuccess: "Письмо со ссылкой отправлено заново! Проверьте почту.",
      emailVerifiedSuccess: "Email успешно подтвержден! Добро пожаловать."
    },
    footer: {
      tagline: 'Renessans Learning Center - Инновационное образование и высокие результаты.',
      quickLinks: 'Быстрые ссылки',
      rights: 'Все права защищены.',
      credit: 'Работает на платформе CenterFlow.'
    }
  }
};

export function getTranslation(lang: Language) {
  return translations[lang] || translations.UZ;
}
