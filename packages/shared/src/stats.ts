export interface DashboardStats {
  totalPatients: number;
  todayAppointments: number;
  waitingPatients: number;
  todayRevenue: number;
  todayVisits: number;
  newPatientsThisWeek: number;
  /** Нийт орлого (төлсөн, цуцлаагүй) */
  totalRevenue: number;
  /** Өнөөдөр хийх эмчилгээ (ToDo, хүлээгдэж буй) */
  todayTreatments: number;
  /** Эмийн нөөцийн нийт үнэлгээ */
  drugValuation: number;
  /** Доод хэмжээнд хүрсэн эмийн тоо */
  drugLowStock: number;
  /** Дуусах/дууссан цувралын тоо */
  drugExpiring: number;
  /** Өнөөдөр захиалагдсан лабораторийн шинжилгээ (order) */
  todayLabOrders: number;
  /** Хариу хүлээгдэж буй шинжилгээ (item) */
  pendingLabResults: number;
}
