export type Language = "ru" | "uz";

export const translations = {
  ru: {
    // Common
    save: "Сохранено",
    error: "Ошибка",
    logout: "Выход",
    language: "Язык",
    siteTitle: "Состояние аптек",

    // Login Page
    login: "Логин",
    password: "Пароль",
    enterLogin: "Введите логин",
    enterPassword: "Введите пароль",
    loginButton: "Войти",
    loginError: "Ошибка входа. Проверьте логин и пароль.",
    invalidCredentials: "Неверные учетные данные",
    activationRequired: "Требуется активация аккаунта",

    // Table Headers
    number: "№",
    code: "Код",
    pharmacyName: "Название аптеки",
    address: "Адрес",
    landmark: "Ориентир",
    pharmacyPhone: "Телефон аптеки",
    leadPhone: "Телефон ответственного",
    leadStatus: "Статус ответственного",
    contactPerson: "Контактное лицо",
    brandedPacket: "Фирменный пакет",
    training: "Обучение",
    status: "Статус",
    registrationDate: "Дата регистрации",
    telegramBot: "Telegram Bot",
    slug: "Slug",
    stir: "СТИР",
    additionalPhone: "Дополнительный телефон",
    juridicalName: "Юридическое название",
    juridicalAddress: "Юридический адрес",
    bankName: "Название банка",
    bankAccount: "Банковский счет",
    mfo: "МФО",
    active: "Активна",
    inactive: "Неактивна",
    allPharmacies: "Все аптеки",

    // Status Values
    yes: "ЕСТЬ",
    no: "НЕТ",
    yesTraining: "ЕСТЬ",
    noTraining: "НЕТ",
    available: "Доступно",
    unavailable: "Недоступно",

    // Panel Titles
    agentPanel: "Панель Агента",
    operatorPanel: "Панель оператора колл-центра",
    adminPanel: "Панель Администратора",

    // Actions
    edit: "Редактировать",
    save_action: "Сохранить",
    cancel: "Отменить",
    saved: "Сохранено успешно",
    changeStatus: "Изменить статус",
    currentStatus: "Текущий статус",
    update: "Обновить",

    // Loading and Empty States
    loading: "Загрузка...",
    noData: "Нет данных",
    loadingPharmacies: "Загрузка аптек...",

    // Filters
    filter: "Фильтр",

    // Pharmacy Details Modal
    pharmacyDetails: "Детали аптеки",
    details: "Детали",
    comment: "Комментарий",
    enterComment: "Введите ваш комментарий...",
    commentRequired: "Комментарий обязателен",
    history: "История",
    noChanges: "Нет изменений",
    changedTo: "изменено на",
    by: "пользователем",
    deleted: "Удалено",
    telegramUsers: "Пользователи Telegram Bot",
    name: "Имя",
    username: "Имя пользователя",
    chatId: "Чат ID",
    noTelegramUsers: "Нет пользователей Telegram",
    confirmDelete: "Вы действительно хотите удалить?",
    deleteSelected: "Удалить выбранные",
    clear: "Очистить",
    deleteWarning: "Эта запись будет удалена безвозвратно.",
    deleteWarningMultiple: "Выбранные записи будут удалены безвозвратно.",
    year: "год",
    confirmYes: "ДА",
    confirmNo: "НЕТ",
  },
  uz: {
    // Common
    save: "Saqlandi",
    error: "Xatolik",
    logout: "Chiqish",
    language: "Til",
    siteTitle: "Aptekalar holati",

    // Login Page
    login: "Login",
    password: "Parol",
    enterLogin: "Loginingizni kiriting",
    enterPassword: "Parolingizni kiriting",
    loginButton: "Kirish",
    loginError: "Kirish xatosi. Login va parolni tekshiring.",
    invalidCredentials: "Noto'g'ri hisob ma'lumotlari",
    activationRequired: "Hisobni faollashtirish talab qilinadi",

    // Table Headers
    number: "№",
    code: "Kod",
    pharmacyName: "Dorixona nomi",
    address: "Manzil",
    landmark: "Mo'ljal",
    pharmacyPhone: "Dorixona telefoni",
    leadPhone: "Mas'ul telefoni",
    leadStatus: "Mas'ul holati",
    contactPerson: "Aloqa o'rtagi",
    brandedPacket: "Brendli paket",
    training: "O'qitilgan",
    status: "Holati",
    registrationDate: "Ro'yxatga olish sanasi",
    telegramBot: "Telegram Bot",
    slug: "Slug",
    stir: "STIR",
    additionalPhone: "Qo'shimcha telefon",
    juridicalName: "Yuridik nom",
    juridicalAddress: "Yuridik manzil",
    bankName: "Bank nomi",
    bankAccount: "Bank hisob raqami",
    mfo: "MFO",
    active: "Faol",
    inactive: "Nofaol",
    allPharmacies: "Barcha dorixonalar",

    // Status Values
    yes: "BOR",
    no: "YO'Q",
    yesTraining: "HA",
    noTraining: "YO'Q",
    available: "Mavjud",
    unavailable: "Mavjud emas",

    // Panel Titles
    agentPanel: "Agent paneli",
    operatorPanel: "Call-markaz operatori paneli",
    adminPanel: "Admin paneli",

    // Actions
    edit: "Tahrirlash",
    save_action: "Saqlash",
    cancel: "Bekor qilish",
    saved: "Muvaffaqiyatli saqlandi",
    changeStatus: "Holatni o'zgartirish",
    currentStatus: "Joriy holat",
    update: "Yangilash",

    // Loading and Empty States
    loading: "Yuklanmoqda...",
    noData: "Ma'lumot yo'q",
    loadingPharmacies: "Dorixonalar yuklanmoqda...",

    // Filters
    filter: "Filtr",

    // Pharmacy Details Modal
    pharmacyDetails: "Dorixona tafsilotlari",
    details: "Tafsilotlar",
    comment: "Izoh",
    enterComment: "Izohingizni kiriting...",
    commentRequired: "Izoh kerak",
    history: "Tarix",
    noChanges: "O'zgarishlar yo'q",
    changedTo: "o'zgartirildi",
    by: "tomonidan",
    deleted: "O'chirildi",
    telegramUsers: "Telegram Bot foydalanuvchilari",
    name: "Ism",
    username: "Foydalanuvchi nomi",
    chatId: "Chat ID",
    noTelegramUsers: "Telegram foydalanuvchilari yo'q",
    confirmDelete: "Haqiqatan ham o'chirmoqchimisiz?",
    deleteSelected: "Tanlanganlarni o'chirish",
    clear: "Tozalash",
    deleteWarning: "Bu yozuv qaytarib bo'lmaydigan tarzda o'chiriladi.",
    deleteWarningMultiple: "Tanlangan yozuvlar qaytarib bo'lmaydigan tarzda o'chiriladi.",
    year: "yil",
    confirmYes: "HA",
    confirmNo: "YO'Q",
  },
};

export function getTranslation(
  language: Language,
): (typeof translations)["ru"] {
  return translations[language];
}
