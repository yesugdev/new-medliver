/**
 * Lab test catalog seed — ~270 tests from clinical data
 * Usage: npm run seed:lab
 */
import { NestFactory } from "@nestjs/core";
import { Logger } from "@nestjs/common";
import { getModelToken } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { AppModule } from "./app.module";
import { LabTest } from "./modules/lab/lab-test.schema";

interface TestDef {
  code: string;
  name: string;
  nameEn?: string;
  category: string;
  testGroup?: string;
  unit?: string;
  referenceMin?: number;
  referenceMax?: number;
  referenceText?: string;
  inputType?: "text" | "select";
  options?: string[];
  turnaroundHours?: number;
  sortOrder?: number;
}

/* ─── HEMATOLOGY ─────────────────────────────────────────────────────── */
const hematology: TestDef[] = [
  /* CBC */
  { code:"WBC",  name:"Цагаан эс (WBC)",     nameEn:"White Blood Cell",        category:"hematology", testGroup:"Цусны ерөнхий шинжилгээ (CBC)", unit:"10⁹/L",    referenceMin:4.5,  referenceMax:11.0,  turnaroundHours:2 },
  { code:"RBC",  name:"Улаан эс (RBC)",       nameEn:"Red Blood Cell",          category:"hematology", testGroup:"Цусны ерөнхий шинжилгээ (CBC)", unit:"10¹²/L",   referenceMin:4.5,  referenceMax:5.5,   turnaroundHours:2 },
  { code:"HGB",  name:"Гемоглобин",           nameEn:"Hemoglobin",              category:"hematology", testGroup:"Цусны ерөнхий шинжилгээ (CBC)", unit:"g/dL",     referenceMin:12.0, referenceMax:17.5,  turnaroundHours:2 },
  { code:"HCT",  name:"Гематокрит",           nameEn:"Hematocrit",              category:"hematology", testGroup:"Цусны ерөнхий шинжилгээ (CBC)", unit:"%",        referenceMin:36.0, referenceMax:52.0,  turnaroundHours:2 },
  { code:"MCV",  name:"MCV (дундаж эсийн хэмжээ)", nameEn:"Mean Corpuscular Volume", category:"hematology", testGroup:"Цусны ерөнхий шинжилгээ (CBC)", unit:"fL",  referenceMin:80.0, referenceMax:100.0, turnaroundHours:2 },
  { code:"MCH",  name:"MCH",                  nameEn:"Mean Corpuscular Hemoglobin", category:"hematology", testGroup:"Цусны ерөнхий шинжилгээ (CBC)", unit:"pg",  referenceMin:27.0, referenceMax:33.0,  turnaroundHours:2 },
  { code:"MCHC", name:"MCHC",                 nameEn:"Mean Corpuscular Hemoglobin Concentration", category:"hematology", testGroup:"Цусны ерөнхий шинжилгээ (CBC)", unit:"g/dL", referenceMin:32.0, referenceMax:36.0, turnaroundHours:2 },
  { code:"PLT",  name:"Тромбоцит (PLT)",      nameEn:"Platelet",                category:"hematology", testGroup:"Цусны ерөнхий шинжилгээ (CBC)", unit:"10⁹/L",  referenceMin:150,  referenceMax:400,   turnaroundHours:2 },
  { code:"NEUT", name:"Нейтрофил %",          nameEn:"Neutrophil %",            category:"hematology", testGroup:"Цусны ерөнхий шинжилгээ (CBC)", unit:"%",       referenceMin:50.0, referenceMax:70.0,  turnaroundHours:2 },
  { code:"LYMP", name:"Лимфоцит %",           nameEn:"Lymphocyte %",            category:"hematology", testGroup:"Цусны ерөнхий шинжилгээ (CBC)", unit:"%",       referenceMin:20.0, referenceMax:40.0,  turnaroundHours:2 },
  { code:"MONO", name:"Моноцит %",            nameEn:"Monocyte %",              category:"hematology", testGroup:"Цусны ерөнхий шинжилгээ (CBC)", unit:"%",       referenceMin:2.0,  referenceMax:8.0,   turnaroundHours:2 },
  { code:"EOS",  name:"Эозинофил %",          nameEn:"Eosinophil %",            category:"hematology", testGroup:"Цусны ерөнхий шинжилгээ (CBC)", unit:"%",       referenceMin:1.0,  referenceMax:4.0,   turnaroundHours:2 },
  { code:"BASO", name:"Базофил %",            nameEn:"Basophil %",              category:"hematology", testGroup:"Цусны ерөнхий шинжилгээ (CBC)", unit:"%",       referenceMin:0.0,  referenceMax:1.0,   turnaroundHours:2 },
  { code:"ESR",  name:"ЭШТ (ESR)",            nameEn:"Erythrocyte Sedimentation Rate", category:"hematology", testGroup:"Цусны ерөнхий шинжилгээ (CBC)", unit:"mm/h", referenceMin:0, referenceMax:20, turnaroundHours:2 },
  { code:"RDW",  name:"RDW",                  nameEn:"Red Cell Distribution Width", category:"hematology", testGroup:"Цусны ерөнхий шинжилгээ (CBC)", unit:"%",   referenceMin:11.5, referenceMax:14.5,  turnaroundHours:2 },
  { code:"MPV",  name:"MPV (дундаж тромбоцитын хэмжээ)", nameEn:"Mean Platelet Volume", category:"hematology", testGroup:"Цусны ерөнхий шинжилгээ (CBC)", unit:"fL", referenceMin:7.5, referenceMax:12.5, turnaroundHours:2 },
  /* Blood type */
  { code:"ABO",  name:"Цусны бүлэг (АВО)",   nameEn:"Blood Group ABO",         category:"hematology", testGroup:"Цусны бүлэг", inputType:"select", options:["A", "B", "AB", "O"],  turnaroundHours:1 },
  { code:"RH",   name:"Rh хүчин зүйл",        nameEn:"Rh Factor",               category:"hematology", testGroup:"Цусны бүлэг", inputType:"select", options:["Эерэг (+)", "Сөрөг (-)"], turnaroundHours:1 },
  /* Malaria */
  { code:"MAL",  name:"Малариагийн шинжилгээ", nameEn:"Malaria Smear",          category:"hematology", testGroup:"Цус түрхэц", inputType:"select", options:["Сөрөг", "Эерэг"], referenceText:"Сөрөг", turnaroundHours:1 },
];

/* ─── BIOCHEMISTRY ───────────────────────────────────────────────────── */
const biochemistry: TestDef[] = [
  /* Liver function */
  { code:"AST",    name:"AST (аспартат аминотрансфераза)", nameEn:"Aspartate Aminotransferase", category:"biochemistry", testGroup:"Элэгний үйл ажиллагаа", unit:"U/L",   referenceMin:10, referenceMax:40, turnaroundHours:3 },
  { code:"ALT",    name:"ALT (аланин аминотрансфераза)",  nameEn:"Alanine Aminotransferase",    category:"biochemistry", testGroup:"Элэгний үйл ажиллагаа", unit:"U/L",   referenceMin:7,  referenceMax:56, turnaroundHours:3 },
  { code:"ALP",    name:"Шүлтлэг фосфатаза (ALP)",       nameEn:"Alkaline Phosphatase",        category:"biochemistry", testGroup:"Элэгний үйл ажиллагаа", unit:"U/L",   referenceMin:44, referenceMax:147, turnaroundHours:3 },
  { code:"GGT",    name:"GGT (гамма-глутамилтранспептидаза)", nameEn:"Gamma-Glutamyl Transferase", category:"biochemistry", testGroup:"Элэгний үйл ажиллагаа", unit:"U/L", referenceMin:9, referenceMax:48, turnaroundHours:3 },
  { code:"TBIL",   name:"Нийт билирубин",                 nameEn:"Total Bilirubin",             category:"biochemistry", testGroup:"Элэгний үйл ажиллагаа", unit:"µmol/L", referenceMin:3.4, referenceMax:20.5, turnaroundHours:3 },
  { code:"DBIL",   name:"Шууд билирубин",                 nameEn:"Direct Bilirubin",            category:"biochemistry", testGroup:"Элэгний үйл ажиллагаа", unit:"µmol/L", referenceMin:0,   referenceMax:5.1, turnaroundHours:3 },
  { code:"IBIL",   name:"Шууд бус билирубин",             nameEn:"Indirect Bilirubin",          category:"biochemistry", testGroup:"Элэгний үйл ажиллагаа", unit:"µmol/L", referenceMin:3.4, referenceMax:17.1, turnaroundHours:3 },
  { code:"TP",     name:"Нийт уураг",                     nameEn:"Total Protein",               category:"biochemistry", testGroup:"Элэгний үйл ажиллагаа", unit:"g/L",   referenceMin:64, referenceMax:83, turnaroundHours:3 },
  { code:"ALB",    name:"Альбумин",                       nameEn:"Albumin",                     category:"biochemistry", testGroup:"Элэгний үйл ажиллагаа", unit:"g/L",   referenceMin:35, referenceMax:52, turnaroundHours:3 },
  { code:"GLOB",   name:"Глобулин",                       nameEn:"Globulin",                    category:"biochemistry", testGroup:"Элэгний үйл ажиллагаа", unit:"g/L",   referenceMin:20, referenceMax:35, turnaroundHours:3 },
  /* Renal function */
  { code:"CREA",   name:"Креатинин",                      nameEn:"Creatinine",                  category:"biochemistry", testGroup:"Бөөрний үйл ажиллагаа", unit:"µmol/L", referenceMin:62, referenceMax:115, turnaroundHours:3 },
  { code:"BUN",    name:"Шээсний азот (BUN)",             nameEn:"Blood Urea Nitrogen",         category:"biochemistry", testGroup:"Бөөрний үйл ажиллагаа", unit:"mmol/L", referenceMin:2.5, referenceMax:7.1, turnaroundHours:3 },
  { code:"UREA",   name:"Шээсэг",                         nameEn:"Urea",                        category:"biochemistry", testGroup:"Бөөрний үйл ажиллагаа", unit:"mmol/L", referenceMin:2.8, referenceMax:8.1, turnaroundHours:3 },
  { code:"UA",     name:"Шээсний хүчил",                  nameEn:"Uric Acid",                   category:"biochemistry", testGroup:"Бөөрний үйл ажиллагаа", unit:"µmol/L", referenceMin:155, referenceMax:357, turnaroundHours:3 },
  { code:"EGFR",   name:"eGFR",                           nameEn:"Estimated Glomerular Filtration Rate", category:"biochemistry", testGroup:"Бөөрний үйл ажиллагаа", unit:"mL/min/1.73m²", referenceMin:60, turnaroundHours:3 },
  /* Glucose / diabetes */
  { code:"GLU",    name:"Цусны сахар (глюкоз)",           nameEn:"Blood Glucose",               category:"biochemistry", testGroup:"Нүүрс ус солилцоо", unit:"mmol/L", referenceMin:3.9, referenceMax:6.1, turnaroundHours:1 },
  { code:"HBA1C",  name:"Гликозилжсэн гемоглобин (HbA1c)", nameEn:"Glycated Hemoglobin HbA1c", category:"biochemistry", testGroup:"Нүүрс ус солилцоо", unit:"%",      referenceMin:4.0, referenceMax:5.6, turnaroundHours:4 },
  { code:"INSU",   name:"Инсулин",                        nameEn:"Insulin",                     category:"biochemistry", testGroup:"Нүүрс ус солилцоо", unit:"µIU/mL", referenceMin:2.6, referenceMax:24.9, turnaroundHours:4 },
  { code:"HOMA",   name:"HOMA-IR индекс",                 nameEn:"HOMA-IR Index",               category:"biochemistry", testGroup:"Нүүрс ус солилцоо", unit:"",       referenceMin:0,   referenceMax:2.5,  turnaroundHours:4 },
  /* Lipid panel */
  { code:"TCHO",   name:"Нийт холестерол",                nameEn:"Total Cholesterol",           category:"biochemistry", testGroup:"Липидийн профиль", unit:"mmol/L", referenceMin:0, referenceMax:5.2, turnaroundHours:3 },
  { code:"LDL",    name:"LDL холестерол",                 nameEn:"LDL Cholesterol",             category:"biochemistry", testGroup:"Липидийн профиль", unit:"mmol/L", referenceMin:0, referenceMax:3.4, turnaroundHours:3 },
  { code:"HDL",    name:"HDL холестерол",                 nameEn:"HDL Cholesterol",             category:"biochemistry", testGroup:"Липидийн профиль", unit:"mmol/L", referenceMin:1.0, referenceMax:99, turnaroundHours:3 },
  { code:"TG",     name:"Триглицерид",                    nameEn:"Triglyceride",                category:"biochemistry", testGroup:"Липидийн профиль", unit:"mmol/L", referenceMin:0, referenceMax:1.7, turnaroundHours:3 },
  { code:"VLDL",   name:"VLDL холестерол",                nameEn:"VLDL Cholesterol",            category:"biochemistry", testGroup:"Липидийн профиль", unit:"mmol/L", referenceMin:0, referenceMax:0.77, turnaroundHours:3 },
  /* Cardiac */
  { code:"CK",     name:"Креатин киназа (CK)",            nameEn:"Creatine Kinase",             category:"biochemistry", testGroup:"Зүрхний маркер", unit:"U/L", referenceMin:25, referenceMax:200, turnaroundHours:3 },
  { code:"CKMB",   name:"CK-MB",                          nameEn:"Creatine Kinase MB",          category:"biochemistry", testGroup:"Зүрхний маркер", unit:"U/L", referenceMin:0,  referenceMax:24,  turnaroundHours:3 },
  { code:"LDH",    name:"Лактат дегидрогеназа (LDH)",     nameEn:"Lactate Dehydrogenase",       category:"biochemistry", testGroup:"Зүрхний маркер", unit:"U/L", referenceMin:140, referenceMax:280, turnaroundHours:3 },
  { code:"TROP",   name:"Тропонин I",                     nameEn:"Troponin I",                  category:"biochemistry", testGroup:"Зүрхний маркер", unit:"ng/mL", referenceMin:0, referenceMax:0.04, turnaroundHours:2 },
  { code:"BNP",    name:"BNP (мозгийн натриуретик пептид)", nameEn:"Brain Natriuretic Peptide", category:"biochemistry", testGroup:"Зүрхний маркер", unit:"pg/mL", referenceMin:0, referenceMax:100, turnaroundHours:4 },
  /* Electrolytes */
  { code:"NA",     name:"Натри (Na)",                     nameEn:"Sodium",                      category:"biochemistry", testGroup:"Электролит", unit:"mmol/L", referenceMin:136, referenceMax:145, turnaroundHours:2 },
  { code:"K",      name:"Кали (K)",                       nameEn:"Potassium",                   category:"biochemistry", testGroup:"Электролит", unit:"mmol/L", referenceMin:3.5,  referenceMax:5.1,  turnaroundHours:2 },
  { code:"CL",     name:"Хлор (Cl)",                      nameEn:"Chloride",                    category:"biochemistry", testGroup:"Электролит", unit:"mmol/L", referenceMin:98,   referenceMax:107,  turnaroundHours:2 },
  { code:"CA",     name:"Кальци (Ca)",                    nameEn:"Calcium",                     category:"biochemistry", testGroup:"Электролит", unit:"mmol/L", referenceMin:2.15, referenceMax:2.55, turnaroundHours:2 },
  { code:"MG",     name:"Магни (Mg)",                     nameEn:"Magnesium",                   category:"biochemistry", testGroup:"Электролит", unit:"mmol/L", referenceMin:0.66, referenceMax:1.07, turnaroundHours:2 },
  { code:"PHOS",   name:"Фосфор (P)",                     nameEn:"Phosphorus",                  category:"biochemistry", testGroup:"Электролит", unit:"mmol/L", referenceMin:0.81, referenceMax:1.45, turnaroundHours:2 },
  /* Inflammation */
  { code:"CRP",    name:"C-реактив уураг (CRP)",          nameEn:"C-Reactive Protein",          category:"biochemistry", testGroup:"Үрэвслийн маркер", unit:"mg/L",  referenceMin:0, referenceMax:5,   turnaroundHours:3 },
  { code:"HCRP",   name:"Өндөр мэдрэмтгий CRP (hs-CRP)",  nameEn:"High-sensitivity CRP",       category:"biochemistry", testGroup:"Үрэвслийн маркер", unit:"mg/L",  referenceMin:0, referenceMax:3,   turnaroundHours:3 },
  { code:"PROC",   name:"Прокальцитонин",                 nameEn:"Procalcitonin",               category:"biochemistry", testGroup:"Үрэвслийн маркер", unit:"ng/mL", referenceMin:0, referenceMax:0.1, turnaroundHours:4 },
  /* Pancreas */
  { code:"AMY",    name:"Амилаза",                        nameEn:"Amylase",                     category:"biochemistry", testGroup:"Нойр булчирхай", unit:"U/L",   referenceMin:28, referenceMax:100, turnaroundHours:3 },
  { code:"LIP",    name:"Липаза",                         nameEn:"Lipase",                      category:"biochemistry", testGroup:"Нойр булчирхай", unit:"U/L",   referenceMin:13, referenceMax:60,  turnaroundHours:3 },
  /* Vitamins / minerals */
  { code:"VITD3",  name:"Витамин D3 (25-OH)",             nameEn:"Vitamin D3 (25-hydroxyvitamin D)", category:"biochemistry", testGroup:"Витамин ба эрдэс", unit:"ng/mL", referenceMin:30, referenceMax:100, turnaroundHours:6 },
  { code:"VITB12", name:"Витамин B12",                    nameEn:"Vitamin B12",                 category:"biochemistry", testGroup:"Витамин ба эрдэс", unit:"pg/mL", referenceMin:200, referenceMax:900, turnaroundHours:6 },
  { code:"FA",     name:"Фолийн хүчил",                   nameEn:"Folic Acid",                  category:"biochemistry", testGroup:"Витамин ба эрдэс", unit:"ng/mL", referenceMin:3.0, referenceMax:17.0, turnaroundHours:6 },
  { code:"FE",     name:"Төмөр (Fe)",                     nameEn:"Serum Iron",                  category:"biochemistry", testGroup:"Витамин ба эрдэс", unit:"µmol/L", referenceMin:9.0, referenceMax:30.0, turnaroundHours:3 },
  { code:"FERR",   name:"Ферритин",                       nameEn:"Ferritin",                    category:"biochemistry", testGroup:"Витамин ба эрдэс", unit:"ng/mL", referenceMin:12,  referenceMax:300, turnaroundHours:4 },
  { code:"TIBC",   name:"TIBC (нийт төмрийг холбох чадвар)", nameEn:"Total Iron-Binding Capacity", category:"biochemistry", testGroup:"Витамин ба эрдэс", unit:"µmol/L", referenceMin:45, referenceMax:72, turnaroundHours:4 },
  /* Other */
  { code:"LDLP",   name:"Липопротеин (a)",                nameEn:"Lipoprotein (a)",             category:"biochemistry", testGroup:"Бусад биохими", unit:"mg/dL", referenceMin:0, referenceMax:30, turnaroundHours:4 },
  { code:"HOMO",   name:"Гомоцистейн",                    nameEn:"Homocysteine",                category:"biochemistry", testGroup:"Бусад биохими", unit:"µmol/L", referenceMin:5, referenceMax:15, turnaroundHours:5 },
  { code:"AMON",   name:"Аммони",                         nameEn:"Ammonia",                     category:"biochemistry", testGroup:"Бусад биохими", unit:"µmol/L", referenceMin:11, referenceMax:35, turnaroundHours:3 },
];

/* ─── COAGULOGRAM ────────────────────────────────────────────────────── */
const coagulogram: TestDef[] = [
  { code:"PT",    name:"Протромбин хугацаа (PT)",      nameEn:"Prothrombin Time",                category:"coagulogram", testGroup:"Цусны бүлэгнэлт", unit:"сек",   referenceMin:11, referenceMax:15, turnaroundHours:2 },
  { code:"INR",   name:"INR",                          nameEn:"International Normalized Ratio",  category:"coagulogram", testGroup:"Цусны бүлэгнэлт", unit:"",      referenceMin:0.8, referenceMax:1.2, turnaroundHours:2 },
  { code:"APTT",  name:"Идэвхжүүлсэн хэсэгчилсэн тромбопластин хугацаа (APTT)", nameEn:"APTT", category:"coagulogram", testGroup:"Цусны бүлэгнэлт", unit:"сек",  referenceMin:25, referenceMax:40, turnaroundHours:2 },
  { code:"FIBR",  name:"Фибриноген",                   nameEn:"Fibrinogen",                      category:"coagulogram", testGroup:"Цусны бүлэгнэлт", unit:"g/L",   referenceMin:2.0, referenceMax:4.0, turnaroundHours:2 },
  { code:"TT",    name:"Тромбин хугацаа (TT)",         nameEn:"Thrombin Time",                   category:"coagulogram", testGroup:"Цусны бүлэгнэлт", unit:"сек",   referenceMin:14, referenceMax:21, turnaroundHours:2 },
  { code:"DDIM",  name:"D-димер",                      nameEn:"D-Dimer",                         category:"coagulogram", testGroup:"Цусны бүлэгнэлт", unit:"µg/mL", referenceMin:0, referenceMax:0.5, turnaroundHours:3 },
  { code:"BT",    name:"Цус зогсох хугацаа (BT)",      nameEn:"Bleeding Time",                   category:"coagulogram", testGroup:"Цусны бүлэгнэлт", unit:"мин",   referenceMin:2, referenceMax:8, turnaroundHours:1 },
  { code:"CT",    name:"Цусны бүлэгних хугацаа (CT)",  nameEn:"Clotting Time",                   category:"coagulogram", testGroup:"Цусны бүлэгнэлт", unit:"мин",   referenceMin:5, referenceMax:11, turnaroundHours:1 },
];

/* ─── URINALYSIS ─────────────────────────────────────────────────────── */
const urinalysis: TestDef[] = [
  /* Physical */
  { code:"UA-CLR",  name:"Шээсний өнгө",          nameEn:"Urine Color",         category:"urinalysis", testGroup:"Шээсний физик шинж", inputType:"select", options:["Шар", "Хөхөвтөр шар", "Улаан", "Бараан", "Цагаан"], turnaroundHours:1 },
  { code:"UA-TRB",  name:"Шээсний тунгалаг байдал", nameEn:"Urine Clarity",     category:"urinalysis", testGroup:"Шээсний физик шинж", inputType:"select", options:["Тунгалаг", "Бага бараан", "Бараан", "Маш бараан"], turnaroundHours:1 },
  { code:"UA-SG",   name:"Шээсний харьцангуй нягт", nameEn:"Urine Specific Gravity", category:"urinalysis", testGroup:"Шээсний физик шинж", unit:"", referenceMin:1.005, referenceMax:1.030, turnaroundHours:1 },
  { code:"UA-PH",   name:"Шээсний рН",              nameEn:"Urine pH",          category:"urinalysis", testGroup:"Шээсний физик шинж", unit:"",            referenceMin:4.6, referenceMax:8.0, turnaroundHours:1 },
  /* Chemical */
  { code:"UA-PRO",  name:"Уураг (шээсэнд)",        nameEn:"Urine Protein",      category:"urinalysis", testGroup:"Шээсний химийн шинж", inputType:"select", options:["Сөрөг", "+", "++", "+++"], referenceText:"Сөрөг", turnaroundHours:1 },
  { code:"UA-GLU",  name:"Сахар (шээсэнд)",         nameEn:"Urine Glucose",     category:"urinalysis", testGroup:"Шээсний химийн шинж", inputType:"select", options:["Сөрөг", "+", "++", "+++"], referenceText:"Сөрөг", turnaroundHours:1 },
  { code:"UA-KET",  name:"Кетон (шээсэнд)",         nameEn:"Urine Ketone",      category:"urinalysis", testGroup:"Шээсний химийн шинж", inputType:"select", options:["Сөрөг", "+", "++", "+++"], referenceText:"Сөрөг", turnaroundHours:1 },
  { code:"UA-BIL",  name:"Билирубин (шээсэнд)",     nameEn:"Urine Bilirubin",   category:"urinalysis", testGroup:"Шээсний химийн шинж", inputType:"select", options:["Сөрөг", "+", "++", "+++"], referenceText:"Сөрөг", turnaroundHours:1 },
  { code:"UA-URB",  name:"Уробилиноген (шээсэнд)",  nameEn:"Urine Urobilinogen", category:"urinalysis", testGroup:"Шээсний химийн шинж", unit:"mg/dL",      referenceMin:0.2, referenceMax:1.0, turnaroundHours:1 },
  { code:"UA-NIT",  name:"Нитрит (шээсэнд)",        nameEn:"Urine Nitrite",     category:"urinalysis", testGroup:"Шээсний химийн шинж", inputType:"select", options:["Сөрөг", "Эерэг"], referenceText:"Сөрөг", turnaroundHours:1 },
  { code:"UA-LEU",  name:"Лейкоцит эстераза",       nameEn:"Leukocyte Esterase", category:"urinalysis", testGroup:"Шээсний химийн шинж", inputType:"select", options:["Сөрөг", "+", "++", "+++"], referenceText:"Сөрөг", turnaroundHours:1 },
  { code:"UA-OB",   name:"Далд цус (шээсэнд)",      nameEn:"Urine Occult Blood", category:"urinalysis", testGroup:"Шээсний химийн шинж", inputType:"select", options:["Сөрөг", "+", "++", "+++"], referenceText:"Сөрөг", turnaroundHours:1 },
  /* Microscopy */
  { code:"UA-RBC",  name:"Улаан эс (шээсний микроскопи)", nameEn:"Urine RBC",  category:"urinalysis", testGroup:"Шээсний микроскопи", unit:"/HPF",         referenceMin:0, referenceMax:3, turnaroundHours:1 },
  { code:"UA-WBC",  name:"Цагаан эс (шээсний микроскопи)", nameEn:"Urine WBC", category:"urinalysis", testGroup:"Шээсний микроскопи", unit:"/HPF",         referenceMin:0, referenceMax:5, turnaroundHours:1 },
  { code:"UA-EPI",  name:"Эпителийн эс",            nameEn:"Epithelial Cells",  category:"urinalysis", testGroup:"Шээсний микроскопи", unit:"/HPF",         referenceMin:0, referenceMax:5, turnaroundHours:1 },
  { code:"UA-CYL",  name:"Цилиндр",                 nameEn:"Casts",             category:"urinalysis", testGroup:"Шээсний микроскопи", inputType:"select", options:["Байхгүй", "Гиалин", "Мөхлөгт", "Эсийн"], referenceText:"Байхгүй", turnaroundHours:1 },
  { code:"UA-CRYS", name:"Болор",                   nameEn:"Crystals",          category:"urinalysis", testGroup:"Шээсний микроскопи", inputType:"select", options:["Байхгүй", "Оксалат", "Урат", "Фосфат"], referenceText:"Байхгүй", turnaroundHours:1 },
  { code:"UA-BACT", name:"Нян (шээсэнд)",           nameEn:"Urine Bacteria",    category:"urinalysis", testGroup:"Шээсний микроскопи", inputType:"select", options:["Байхгүй", "Цөөн", "Дунд зэрэг", "Их"], referenceText:"Байхгүй", turnaroundHours:1 },
  /* 24h urine */
  { code:"U24-PRO", name:"24 цагийн шээсэнд уураг",  nameEn:"24h Urine Protein", category:"urinalysis", testGroup:"24 цагийн шээс", unit:"mg/24h",        referenceMin:0, referenceMax:150, turnaroundHours:4 },
  { code:"U24-CREA", name:"24 цагийн шээсэнд креатинин", nameEn:"24h Urine Creatinine", category:"urinalysis", testGroup:"24 цагийн шээс", unit:"mmol/24h", referenceMin:8.8, referenceMax:17.7, turnaroundHours:4 },
  { code:"MACR",    name:"Микроальбуминури",          nameEn:"Microalbuminuria",  category:"urinalysis", testGroup:"24 цагийн шээс", unit:"mg/24h",         referenceMin:0, referenceMax:30, turnaroundHours:4 },
];

/* ─── IMMUNOLOGY ─────────────────────────────────────────────────────── */
const immunology: TestDef[] = [
  /* Hepatitis */
  { code:"HBSAG",  name:"HBsAg (В гепатитийн гадаргуугийн антиген)", nameEn:"HBsAg", category:"immunology", testGroup:"В гепатит", inputType:"select", options:["Сөрөг","Эерэг"], referenceText:"Сөрөг", turnaroundHours:3 },
  { code:"AHBS",   name:"Anti-HBs (В гепатитийн эсрэгбие)",          nameEn:"Anti-HBs", category:"immunology", testGroup:"В гепатит", unit:"IU/L",       referenceMin:10, turnaroundHours:3 },
  { code:"AHBC",   name:"Anti-HBc total (IgG+IgM)",                   nameEn:"Anti-HBc total", category:"immunology", testGroup:"В гепатит", inputType:"select", options:["Сөрөг","Эерэг"], referenceText:"Сөрөг", turnaroundHours:3 },
  { code:"AHBCM",  name:"Anti-HBc IgM",                               nameEn:"Anti-HBc IgM", category:"immunology", testGroup:"В гепатит", inputType:"select", options:["Сөрөг","Эерэг"], referenceText:"Сөрөг", turnaroundHours:3 },
  { code:"HBEAG",  name:"HBeAg",                                      nameEn:"HBeAg", category:"immunology", testGroup:"В гепатит", inputType:"select", options:["Сөрөг","Эерэг"], referenceText:"Сөрөг", turnaroundHours:3 },
  { code:"AHBE",   name:"Anti-HBe",                                   nameEn:"Anti-HBe", category:"immunology", testGroup:"В гепатит", inputType:"select", options:["Сөрөг","Эерэг"], referenceText:"Сөрөг", turnaroundHours:3 },
  /* Hepatitis C */
  { code:"AHCV",   name:"Anti-HCV (С гепатитийн эсрэгбие)",           nameEn:"Anti-HCV", category:"immunology", testGroup:"С гепатит", inputType:"select", options:["Сөрөг","Эерэг"], referenceText:"Сөрөг", turnaroundHours:3 },
  { code:"AHCVCT", name:"Anti-HCV (подтверждение)",                   nameEn:"Anti-HCV confirmation", category:"immunology", testGroup:"С гепатит", inputType:"select", options:["Сөрөг","Эерэг"], referenceText:"Сөрөг", turnaroundHours:4 },
  /* Hepatitis D */
  { code:"AHDV",   name:"Anti-HDV (Д гепатитийн эсрэгбие)",           nameEn:"Anti-HDV", category:"immunology", testGroup:"Д гепатит", inputType:"select", options:["Сөрөг","Эерэг"], referenceText:"Сөрөг", turnaroundHours:3 },
  { code:"AHDVM",  name:"Anti-HDV IgM",                               nameEn:"Anti-HDV IgM", category:"immunology", testGroup:"Д гепатит", inputType:"select", options:["Сөрөг","Эерэг"], referenceText:"Сөрөг", turnaroundHours:3 },
  /* HIV */
  { code:"HIV",    name:"HIV 1/2 эсрэгбие",                          nameEn:"HIV 1/2 Antibody", category:"immunology", testGroup:"ХДХВ", inputType:"select", options:["Сөрөг","Эерэг"], referenceText:"Сөрөг", turnaroundHours:3 },
  /* TORCH */
  { code:"TOXOG",  name:"Токсоплазма IgG",                            nameEn:"Toxoplasma IgG", category:"immunology", testGroup:"TORCH шинжилгээ", unit:"IU/mL",  referenceMin:0, referenceMax:3.0, turnaroundHours:4 },
  { code:"TOXOM",  name:"Токсоплазма IgM",                            nameEn:"Toxoplasma IgM", category:"immunology", testGroup:"TORCH шинжилгээ", inputType:"select", options:["Сөрөг","Эерэг"], referenceText:"Сөрөг", turnaroundHours:4 },
  { code:"RUBEG",  name:"Улаан бурхан IgG",                           nameEn:"Rubella IgG",    category:"immunology", testGroup:"TORCH шинжилгээ", unit:"IU/mL",  referenceMin:10, turnaroundHours:4 },
  { code:"RUBEM",  name:"Улаан бурхан IgM",                           nameEn:"Rubella IgM",    category:"immunology", testGroup:"TORCH шинжилгээ", inputType:"select", options:["Сөрөг","Эерэг"], referenceText:"Сөрөг", turnaroundHours:4 },
  { code:"CMVG",   name:"Цитомегаловирус IgG",                        nameEn:"CMV IgG",        category:"immunology", testGroup:"TORCH шинжилгээ", unit:"AU/mL",  referenceMin:0, referenceMax:6.0, turnaroundHours:4 },
  { code:"CMVM",   name:"Цитомегаловирус IgM",                        nameEn:"CMV IgM",        category:"immunology", testGroup:"TORCH шинжилгээ", inputType:"select", options:["Сөрөг","Эерэг"], referenceText:"Сөрөг", turnaroundHours:4 },
  { code:"HSVG",   name:"Герпес симплекс IgG",                        nameEn:"HSV IgG",        category:"immunology", testGroup:"TORCH шинжилгээ", inputType:"select", options:["Сөрөг","Эерэг"], referenceText:"Сөрөг", turnaroundHours:4 },
  { code:"HSVM",   name:"Герпес симплекс IgM",                        nameEn:"HSV IgM",        category:"immunology", testGroup:"TORCH шинжилгээ", inputType:"select", options:["Сөрөг","Эерэг"], referenceText:"Сөрөг", turnaroundHours:4 },
  /* Autoimmune */
  { code:"ANA",    name:"Антиядерийн эсрэгбие (ANA)",                 nameEn:"Antinuclear Antibody", category:"immunology", testGroup:"Аутоиммун", inputType:"select", options:["Сөрөг","Эерэг"], referenceText:"Сөрөг", turnaroundHours:6 },
  { code:"ANCA",   name:"ANCA (нейтрофилийн цитоплазмийн эсрэгбие)",  nameEn:"ANCA", category:"immunology", testGroup:"Аутоиммун", inputType:"select", options:["Сөрөг","Эерэг"], referenceText:"Сөрөг", turnaroundHours:6 },
  { code:"ADNA",   name:"Anti-dsDNA",                                 nameEn:"Anti-dsDNA", category:"immunology", testGroup:"Аутоиммун", unit:"IU/mL", referenceMin:0, referenceMax:25, turnaroundHours:6 },
  { code:"RF",     name:"Ревматоид хүчин зүйл (RF)",                  nameEn:"Rheumatoid Factor", category:"immunology", testGroup:"Аутоиммун", unit:"IU/mL", referenceMin:0, referenceMax:14, turnaroundHours:4 },
  { code:"ACCP",   name:"Anti-CCP эсрэгбие",                          nameEn:"Anti-CCP", category:"immunology", testGroup:"Аутоиммун", unit:"U/mL",  referenceMin:0, referenceMax:17, turnaroundHours:4 },
  { code:"ASLO",   name:"АСЛО (антистрептолизин-О)",                  nameEn:"ASLO", category:"immunology", testGroup:"Аутоиммун", unit:"IU/mL", referenceMin:0, referenceMax:200, turnaroundHours:4 },
  /* Tumor markers */
  { code:"PSA",    name:"PSA (простатын хавдрын маркер)",             nameEn:"Prostate-Specific Antigen", category:"immunology", testGroup:"Хавдрын маркер", unit:"ng/mL", referenceMin:0, referenceMax:4.0, turnaroundHours:4 },
  { code:"CEA",    name:"CEA (карциноэмбрион антиген)",               nameEn:"Carcinoembryonic Antigen",  category:"immunology", testGroup:"Хавдрын маркер", unit:"ng/mL", referenceMin:0, referenceMax:5.0, turnaroundHours:4 },
  { code:"AFP",    name:"Альфа-фетопротейн (AFP)",                    nameEn:"Alpha-Fetoprotein",         category:"immunology", testGroup:"Хавдрын маркер", unit:"ng/mL", referenceMin:0, referenceMax:10, turnaroundHours:4 },
  { code:"CA125",  name:"CA-125",                                     nameEn:"Cancer Antigen 125",        category:"immunology", testGroup:"Хавдрын маркер", unit:"U/mL",  referenceMin:0, referenceMax:35, turnaroundHours:4 },
  { code:"CA199",  name:"CA 19-9",                                    nameEn:"Cancer Antigen 19-9",       category:"immunology", testGroup:"Хавдрын маркер", unit:"U/mL",  referenceMin:0, referenceMax:37, turnaroundHours:4 },
  { code:"CA153",  name:"CA 15-3",                                    nameEn:"Cancer Antigen 15-3",       category:"immunology", testGroup:"Хавдрын маркер", unit:"U/mL",  referenceMin:0, referenceMax:25, turnaroundHours:4 },
  { code:"BHCG",   name:"β-ХГГ (жирэмслэлтийн тест)",                nameEn:"Beta-hCG",                 category:"immunology", testGroup:"Хавдрын маркер", unit:"mIU/mL", referenceMin:0, referenceMax:5.0, turnaroundHours:3 },
  /* Complement */
  { code:"C3",     name:"C3 комплемент",                              nameEn:"Complement C3",            category:"immunology", testGroup:"Комплемент", unit:"g/L", referenceMin:0.9, referenceMax:1.8, turnaroundHours:5 },
  { code:"C4",     name:"C4 комплемент",                              nameEn:"Complement C4",            category:"immunology", testGroup:"Комплемент", unit:"g/L", referenceMin:0.1, referenceMax:0.4, turnaroundHours:5 },
  /* MiniVidas */
  { code:"MVTSHS", name:"TSH (MiniVidas)",                            nameEn:"TSH MiniVidas",            category:"immunology", testGroup:"MiniVidas", unit:"mIU/L", referenceMin:0.27, referenceMax:4.2, turnaroundHours:3 },
  { code:"MVFT4",  name:"FT4 (MiniVidas)",                            nameEn:"Free T4 MiniVidas",        category:"immunology", testGroup:"MiniVidas", unit:"pmol/L", referenceMin:12, referenceMax:22, turnaroundHours:3 },
  { code:"MVFT3",  name:"FT3 (MiniVidas)",                            nameEn:"Free T3 MiniVidas",        category:"immunology", testGroup:"MiniVidas", unit:"pmol/L", referenceMin:3.1, referenceMax:6.8, turnaroundHours:3 },
  { code:"MVPRL",  name:"Пролактин (MiniVidas)",                      nameEn:"Prolactin MiniVidas",      category:"immunology", testGroup:"MiniVidas", unit:"mIU/L", referenceMin:102, referenceMax:496, turnaroundHours:3 },
  { code:"MVLH",   name:"LH (MiniVidas)",                             nameEn:"LH MiniVidas",             category:"immunology", testGroup:"MiniVidas", unit:"IU/L",  referenceMin:1.7, referenceMax:15, turnaroundHours:3 },
  { code:"MVFSH",  name:"FSH (MiniVidas)",                            nameEn:"FSH MiniVidas",            category:"immunology", testGroup:"MiniVidas", unit:"IU/L",  referenceMin:1.5, referenceMax:12.4, turnaroundHours:3 },
  { code:"MVE2",   name:"Эстрадиол E2 (MiniVidas)",                   nameEn:"Estradiol E2 MiniVidas",   category:"immunology", testGroup:"MiniVidas", unit:"pmol/L", referenceMin:73, referenceMax:1285, turnaroundHours:3 },
  { code:"MVPROG", name:"Прогестерон (MiniVidas)",                    nameEn:"Progesterone MiniVidas",   category:"immunology", testGroup:"MiniVidas", unit:"nmol/L", referenceMin:0.64, referenceMax:79, turnaroundHours:3 },
  { code:"MVTST",  name:"Тестостерон (MiniVidas)",                    nameEn:"Testosterone MiniVidas",   category:"immunology", testGroup:"MiniVidas", unit:"nmol/L", referenceMin:0.5, referenceMax:30, turnaroundHours:3 },
  { code:"MVBHCG", name:"β-ХГГ (MiniVidas)",                         nameEn:"Beta-hCG MiniVidas",       category:"immunology", testGroup:"MiniVidas", unit:"mIU/mL", referenceMin:0, referenceMax:5, turnaroundHours:3 },
  { code:"MVPSA",  name:"PSA (MiniVidas)",                            nameEn:"PSA MiniVidas",            category:"immunology", testGroup:"MiniVidas", unit:"ng/mL", referenceMin:0, referenceMax:4.0, turnaroundHours:3 },
  { code:"MVAFP",  name:"AFP (MiniVidas)",                            nameEn:"AFP MiniVidas",            category:"immunology", testGroup:"MiniVidas", unit:"ng/mL", referenceMin:0, referenceMax:10, turnaroundHours:3 },
  { code:"MVCEA",  name:"CEA (MiniVidas)",                            nameEn:"CEA MiniVidas",            category:"immunology", testGroup:"MiniVidas", unit:"ng/mL", referenceMin:0, referenceMax:5, turnaroundHours:3 },
  { code:"MVCA125",name:"CA-125 (MiniVidas)",                         nameEn:"CA-125 MiniVidas",         category:"immunology", testGroup:"MiniVidas", unit:"U/mL",  referenceMin:0, referenceMax:35, turnaroundHours:3 },
  { code:"MVCA199",name:"CA 19-9 (MiniVidas)",                        nameEn:"CA 19-9 MiniVidas",        category:"immunology", testGroup:"MiniVidas", unit:"U/mL",  referenceMin:0, referenceMax:37, turnaroundHours:3 },
];

/* ─── HORMONES ───────────────────────────────────────────────────────── */
const hormones: TestDef[] = [
  /* Thyroid */
  { code:"TSH",   name:"Тиреотропин (TSH)",               nameEn:"Thyroid Stimulating Hormone", category:"hormones", testGroup:"Бамбай булчирхайн даавар", unit:"mIU/L", referenceMin:0.27, referenceMax:4.2, turnaroundHours:4 },
  { code:"FT4",   name:"Чөлөөт тироксин (FT4)",           nameEn:"Free Thyroxine",              category:"hormones", testGroup:"Бамбай булчирхайн даавар", unit:"pmol/L", referenceMin:12, referenceMax:22, turnaroundHours:4 },
  { code:"FT3",   name:"Чөлөөт трийодтиронин (FT3)",      nameEn:"Free Triiodothyronine",       category:"hormones", testGroup:"Бамбай булчирхайн даавар", unit:"pmol/L", referenceMin:3.1, referenceMax:6.8, turnaroundHours:4 },
  { code:"TT4",   name:"Нийт тироксин (T4)",              nameEn:"Total Thyroxine T4",          category:"hormones", testGroup:"Бамбай булчирхайн даавар", unit:"nmol/L", referenceMin:66, referenceMax:181, turnaroundHours:4 },
  { code:"TT3",   name:"Нийт трийодтиронин (T3)",         nameEn:"Total Triiodothyronine T3",   category:"hormones", testGroup:"Бамбай булчирхайн даавар", unit:"nmol/L", referenceMin:1.3, referenceMax:2.7, turnaroundHours:4 },
  { code:"ATPO",  name:"Anti-TPO эсрэгбие",               nameEn:"Anti-Thyroid Peroxidase",     category:"hormones", testGroup:"Бамбай булчирхайн даавар", unit:"IU/mL", referenceMin:0, referenceMax:34, turnaroundHours:4 },
  { code:"ATGB",  name:"Anti-TG эсрэгбие",                nameEn:"Anti-Thyroglobulin",          category:"hormones", testGroup:"Бамбай булчирхайн даавар", unit:"IU/mL", referenceMin:0, referenceMax:115, turnaroundHours:4 },
  { code:"TG",    name:"Тироглобулин",                    nameEn:"Thyroglobulin",               category:"hormones", testGroup:"Бамбай булчирхайн даавар", unit:"ng/mL", referenceMin:1.4, referenceMax:78, turnaroundHours:4 },
  /* Sex hormones */
  { code:"LH",    name:"Лютеинжүүлэгч даавар (LH)",       nameEn:"Luteinizing Hormone",         category:"hormones", testGroup:"Бэлгийн даавар", unit:"IU/L",  referenceMin:1.7, referenceMax:15, turnaroundHours:4 },
  { code:"FSH",   name:"Фолликул өдөөгч даавар (FSH)",    nameEn:"Follicle-Stimulating Hormone", category:"hormones", testGroup:"Бэлгийн даавар", unit:"IU/L", referenceMin:1.5, referenceMax:12.4, turnaroundHours:4 },
  { code:"E2",    name:"Эстрадиол (E2)",                  nameEn:"Estradiol",                   category:"hormones", testGroup:"Бэлгийн даавар", unit:"pmol/L", referenceMin:73, referenceMax:1285, turnaroundHours:4 },
  { code:"PROG",  name:"Прогестерон",                     nameEn:"Progesterone",                category:"hormones", testGroup:"Бэлгийн даавар", unit:"nmol/L", referenceMin:0.64, referenceMax:79, turnaroundHours:4 },
  { code:"TEST",  name:"Тестостерон",                     nameEn:"Testosterone",                category:"hormones", testGroup:"Бэлгийн даавар", unit:"nmol/L", referenceMin:0.5, referenceMax:30, turnaroundHours:4 },
  { code:"DHEAS", name:"DHEAS",                           nameEn:"DHEA-Sulfate",                category:"hormones", testGroup:"Бэлгийн даавар", unit:"µmol/L", referenceMin:0.95, referenceMax:11.67, turnaroundHours:4 },
  { code:"SHBG",  name:"SHBG",                            nameEn:"Sex Hormone Binding Globulin", category:"hormones", testGroup:"Бэлгийн даавар", unit:"nmol/L", referenceMin:18, referenceMax:114, turnaroundHours:4 },
  { code:"PRL",   name:"Пролактин",                       nameEn:"Prolactin",                   category:"hormones", testGroup:"Бэлгийн даавар", unit:"mIU/L", referenceMin:102, referenceMax:496, turnaroundHours:4 },
  /* Adrenal */
  { code:"CORT",  name:"Кортизол",                        nameEn:"Cortisol",                    category:"hormones", testGroup:"Бөөрний дээд булчирхайн даавар", unit:"nmol/L", referenceMin:138, referenceMax:690, turnaroundHours:4 },
  { code:"ACTH",  name:"АКТГ",                            nameEn:"ACTH",                        category:"hormones", testGroup:"Бөөрний дээд булчирхайн даавар", unit:"pmol/L", referenceMin:1.6, referenceMax:13.9, turnaroundHours:4 },
  { code:"ALD",   name:"Альдостерон",                     nameEn:"Aldosterone",                 category:"hormones", testGroup:"Бөөрний дээд булчирхайн даавар", unit:"pmol/L", referenceMin:83, referenceMax:444, turnaroundHours:5 },
  { code:"REN",   name:"Ренин",                           nameEn:"Renin",                       category:"hormones", testGroup:"Бөөрний дээд булчирхайн даавар", unit:"ng/mL/h", referenceMin:0.5, referenceMax:4.0, turnaroundHours:5 },
  /* Other */
  { code:"GH",    name:"Өсөлтийн даавар (GH)",            nameEn:"Growth Hormone",              category:"hormones", testGroup:"Бусад даавар", unit:"mIU/L", referenceMin:0, referenceMax:10, turnaroundHours:5 },
  { code:"IGF1",  name:"IGF-1 (инсулинтэй адил өсөлтийн хүчин зүйл)", nameEn:"IGF-1",          category:"hormones", testGroup:"Бусад даавар", unit:"ng/mL", referenceMin:88, referenceMax:246, turnaroundHours:5 },
  { code:"PTH",   name:"Паратгормон (PTH)",                nameEn:"Parathyroid Hormone",        category:"hormones", testGroup:"Бусад даавар", unit:"pg/mL", referenceMin:15, referenceMax:65, turnaroundHours:5 },
  { code:"INS",   name:"Инсулин",                         nameEn:"Insulin",                     category:"hormones", testGroup:"Бусад даавар", unit:"µIU/mL", referenceMin:2.6, referenceMax:24.9, turnaroundHours:4 },
  { code:"LEP",   name:"Лептин",                          nameEn:"Leptin",                      category:"hormones", testGroup:"Бусад даавар", unit:"ng/mL", referenceMin:1.0, referenceMax:9.5, turnaroundHours:5 },
];

/* ─── RAPID TESTS ────────────────────────────────────────────────────── */
const rapidTests: TestDef[] = [
  /* Hepatitis rapid */
  { code:"RT-HBSAG", name:"HBsAg хурдан тест",               nameEn:"HBsAg Rapid Test",     category:"rapid_tests", testGroup:"Вирусын хурдан тест", inputType:"select", options:["Сөрөг","Эерэг"], referenceText:"Сөрөг", turnaroundHours:0.5 },
  { code:"RT-HCV",   name:"Anti-HCV хурдан тест",             nameEn:"Anti-HCV Rapid Test",  category:"rapid_tests", testGroup:"Вирусын хурдан тест", inputType:"select", options:["Сөрөг","Эерэг"], referenceText:"Сөрөг", turnaroundHours:0.5 },
  { code:"RT-HIV",   name:"HIV 1/2 хурдан тест",              nameEn:"HIV 1/2 Rapid Test",   category:"rapid_tests", testGroup:"Вирусын хурдан тест", inputType:"select", options:["Сөрөг","Эерэг"], referenceText:"Сөрөг", turnaroundHours:0.5 },
  { code:"RT-AHDV",  name:"Anti-HDV хурдан тест",             nameEn:"Anti-HDV Rapid Test",  category:"rapid_tests", testGroup:"Вирусын хурдан тест", inputType:"select", options:["Сөрөг","Эерэг"], referenceText:"Сөрөг", turnaroundHours:0.5 },
  /* Infection rapid */
  { code:"RT-TP",    name:"Сифилис (T.pallidum Ab) хурдан тест", nameEn:"Syphilis Rapid Test", category:"rapid_tests", testGroup:"Халдварын хурдан тест", inputType:"select", options:["Сөрөг","Эерэг"], referenceText:"Сөрөг", turnaroundHours:0.5 },
  { code:"RT-MAL",   name:"Малариагийн хурдан тест",           nameEn:"Malaria Rapid Test",   category:"rapid_tests", testGroup:"Халдварын хурдан тест", inputType:"select", options:["Сөрөг","Эерэг"], referenceText:"Сөрөг", turnaroundHours:0.5 },
  { code:"RT-HP",    name:"H.pylori хурдан тест (цус)",        nameEn:"H.pylori Rapid Test",  category:"rapid_tests", testGroup:"Халдварын хурдан тест", inputType:"select", options:["Сөрөг","Эерэг"], referenceText:"Сөрөг", turnaroundHours:0.5 },
  { code:"RT-STRP",  name:"Стрептококк хурдан тест",           nameEn:"Strep A Rapid Test",   category:"rapid_tests", testGroup:"Халдварын хурдан тест", inputType:"select", options:["Сөрөг","Эерэг"], referenceText:"Сөрөг", turnaroundHours:0.5 },
  { code:"RT-INF",   name:"Томуугийн хурдан тест (A/B)",       nameEn:"Influenza A/B Rapid",  category:"rapid_tests", testGroup:"Халдварын хурдан тест", inputType:"select", options:["Сөрөг","Инфлюэнза А","Инфлюэнза В","А+В"], referenceText:"Сөрөг", turnaroundHours:0.5 },
  { code:"RT-COAG",  name:"COVID-19 антиген хурдан тест",      nameEn:"COVID-19 Antigen Rapid", category:"rapid_tests", testGroup:"Халдварын хурдан тест", inputType:"select", options:["Сөрөг","Эерэг"], referenceText:"Сөрөг", turnaroundHours:0.5 },
  /* Pregnancy */
  { code:"RT-PREG",  name:"Жирэмслэлтийн тест (хурдан)",       nameEn:"Pregnancy Test Rapid", category:"rapid_tests", testGroup:"Жирэмслэлтийн тест", inputType:"select", options:["Сөрөг","Эерэг"], referenceText:"Сөрөг", turnaroundHours:0.5 },
  /* Blood glucose rapid */
  { code:"RT-GLU",   name:"Цусны сахар (хурдан тест, glucometer)", nameEn:"Blood Glucose Rapid", category:"rapid_tests", testGroup:"Бусад хурдан тест", unit:"mmol/L", referenceMin:3.9, referenceMax:6.1, turnaroundHours:0.1 },
  /* Stool */
  { code:"RT-OB",    name:"Далд цус (ялгадас, хурдан тест)",   nameEn:"Fecal Occult Blood Rapid", category:"rapid_tests", testGroup:"Ялгадасны хурдан тест", inputType:"select", options:["Сөрөг","Эерэг"], referenceText:"Сөрөг", turnaroundHours:0.5 },
  { code:"RT-HPRST", name:"H.pylori стул антиген хурдан тест", nameEn:"H.pylori Stool Antigen", category:"rapid_tests", testGroup:"Ялгадасны хурдан тест", inputType:"select", options:["Сөрөг","Эерэг"], referenceText:"Сөрөг", turnaroundHours:0.5 },
  /* CRP rapid */
  { code:"RT-CRP",   name:"CRP хурдан тест",                   nameEn:"CRP Rapid Test",       category:"rapid_tests", testGroup:"Үрэвслийн хурдан тест", unit:"mg/L", referenceMin:0, referenceMax:5, turnaroundHours:0.5 },
  { code:"RT-DDIM",  name:"D-димер хурдан тест",               nameEn:"D-Dimer Rapid Test",   category:"rapid_tests", testGroup:"Үрэвслийн хурдан тест", unit:"µg/mL", referenceMin:0, referenceMax:0.5, turnaroundHours:0.5 },
  { code:"RT-TROP",  name:"Тропонин хурдан тест",              nameEn:"Troponin Rapid Test",  category:"rapid_tests", testGroup:"Зүрхний хурдан тест", inputType:"select", options:["Сөрөг","Эерэг"], referenceText:"Сөрөг", turnaroundHours:0.5 },
  { code:"RT-BNP",   name:"BNP хурдан тест",                   nameEn:"BNP Rapid Test",       category:"rapid_tests", testGroup:"Зүрхний хурдан тест", unit:"pg/mL", referenceMin:0, referenceMax:100, turnaroundHours:0.5 },
];

/* ─── VIRAL LOAD ─────────────────────────────────────────────────────── */
const viralLoad: TestDef[] = [
  { code:"VL-HBV",  name:"HBV ДНХ вирусын ачаалал",    nameEn:"HBV DNA Viral Load",        category:"viral_load", testGroup:"Гепатит вирусын ачаалал", unit:"IU/mL",     referenceMin:0, referenceMax:20, turnaroundHours:24 },
  { code:"VL-HCV",  name:"HCV РНХ вирусын ачаалал",    nameEn:"HCV RNA Viral Load",        category:"viral_load", testGroup:"Гепатит вирусын ачаалал", unit:"IU/mL",     referenceMin:0, referenceMax:15, turnaroundHours:24 },
  { code:"VL-HDV",  name:"HDV РНХ вирусын ачаалал",    nameEn:"HDV RNA Viral Load",        category:"viral_load", testGroup:"Гепатит вирусын ачаалал", unit:"copies/mL", referenceMin:0, turnaroundHours:48 },
  { code:"VL-HIV",  name:"HIV РНХ вирусын ачаалал",    nameEn:"HIV RNA Viral Load",        category:"viral_load", testGroup:"ХДХВ вирусын ачаалал",   unit:"copies/mL", referenceMin:0, turnaroundHours:48 },
  { code:"VL-EBV",  name:"EBV ДНХ вирусын ачаалал",   nameEn:"EBV DNA Viral Load",        category:"viral_load", testGroup:"Бусад вирусын ачаалал",   unit:"copies/mL", referenceMin:0, turnaroundHours:48 },
  { code:"VL-CMV",  name:"CMV ДНХ вирусын ачаалал",   nameEn:"CMV DNA Viral Load",        category:"viral_load", testGroup:"Бусад вирусын ачаалал",   unit:"copies/mL", referenceMin:0, turnaroundHours:48 },
  { code:"COVID-PCR", name:"COVID-19 ПГУ шинжилгээ",  nameEn:"COVID-19 PCR",              category:"viral_load", testGroup:"COVID-19",                inputType:"select", options:["Сөрөг","Эерэг"], referenceText:"Сөрөг", turnaroundHours:8 },
  { code:"COVQT",   name:"COVID-19 тоон ПГУ",          nameEn:"COVID-19 Quantitative PCR", category:"viral_load", testGroup:"COVID-19",                unit:"copies/mL", referenceMin:0, turnaroundHours:8 },
];

/* ─── MICROBIOLOGY ───────────────────────────────────────────────────── */
const microbiology: TestDef[] = [
  { code:"BC-BLD",  name:"Цусны өсгөвөр (гемокультур)",            nameEn:"Blood Culture",            category:"microbiology", testGroup:"Өсгөвөр", inputType:"select", options:["Өсгөвөр ургаагүй","Өсгөвөр ургасан"], referenceText:"Өсгөвөр ургаагүй", turnaroundHours:72 },
  { code:"BC-URN",  name:"Шээсний өсгөвөр",                        nameEn:"Urine Culture",            category:"microbiology", testGroup:"Өсгөвөр", inputType:"select", options:["Өсгөвөр ургаагүй","Өсгөвөр ургасан"], referenceText:"Өсгөвөр ургаагүй", turnaroundHours:48 },
  { code:"BC-STL",  name:"Ялгадасны өсгөвөр",                      nameEn:"Stool Culture",            category:"microbiology", testGroup:"Өсгөвөр", inputType:"select", options:["Өсгөвөр ургаагүй","Өсгөвөр ургасан"], referenceText:"Өсгөвөр ургаагүй", turnaroundHours:48 },
  { code:"BC-THR",  name:"Хоолойн аавгайн өсгөвөр",               nameEn:"Throat Culture",           category:"microbiology", testGroup:"Өсгөвөр", inputType:"select", options:["Өсгөвөр ургаагүй","Өсгөвөр ургасан"], referenceText:"Өсгөвөр ургаагүй", turnaroundHours:48 },
  { code:"BC-WND",  name:"Шархны өсгөвөр",                         nameEn:"Wound Culture",            category:"microbiology", testGroup:"Өсгөвөр", inputType:"select", options:["Өсгөвөр ургаагүй","Өсгөвөр ургасан"], referenceText:"Өсгөвөр ургаагүй", turnaroundHours:48 },
  { code:"BC-SPT",  name:"Цэрний өсгөвөр",                         nameEn:"Sputum Culture",           category:"microbiology", testGroup:"Өсгөвөр", inputType:"select", options:["Өсгөвөр ургаагүй","Өсгөвөр ургасан"], referenceText:"Өсгөвөр ургаагүй", turnaroundHours:48 },
  { code:"BC-CSF",  name:"Нурууны шингэний өсгөвөр",               nameEn:"CSF Culture",              category:"microbiology", testGroup:"Өсгөвөр", inputType:"select", options:["Өсгөвөр ургаагүй","Өсгөвөр ургасан"], referenceText:"Өсгөвөр ургаагүй", turnaroundHours:72 },
  { code:"GRM-STN", name:"Грам будалт",                            nameEn:"Gram Stain",               category:"microbiology", testGroup:"Микроскопи", unit:"",          referenceText:"Нян олдоогүй", turnaroundHours:2 },
  { code:"AFB",     name:"КУБ шинжилгээ (AFB)",                    nameEn:"Acid-Fast Bacilli",        category:"microbiology", testGroup:"Сүрьеэ", inputType:"select", options:["Сөрөг","1+","2+","3+"], referenceText:"Сөрөг", turnaroundHours:4 },
  { code:"TB-PCR",  name:"Сүрьеэгийн ПГУ",                        nameEn:"Tuberculosis PCR",         category:"microbiology", testGroup:"Сүрьеэ", inputType:"select", options:["Сөрөг","Эерэг"], referenceText:"Сөрөг", turnaroundHours:24 },
  { code:"TB-CUL",  name:"Сүрьеэгийн өсгөвөр (LJ/MGIT)",         nameEn:"TB Culture",               category:"microbiology", testGroup:"Сүрьеэ", inputType:"select", options:["Өсгөвөр ургаагүй","Өсгөвөр ургасан"], referenceText:"Өсгөвөр ургаагүй", turnaroundHours:336 },
  { code:"AST-MBL", name:"Антибиотик мэдрэмж (ABG)",              nameEn:"Antibiotic Sensitivity",   category:"microbiology", testGroup:"Антибиотик мэдрэмж", unit:"",   referenceText:"Үр дүн хэрэглэнэ", turnaroundHours:72 },
  { code:"HPYLORI", name:"H.pylori эзофагогастроскопи өсгөвөр",    nameEn:"H.pylori Culture",         category:"microbiology", testGroup:"H.pylori", inputType:"select", options:["Сөрөг","Эерэг"], referenceText:"Сөрөг", turnaroundHours:72 },
  { code:"UBT",     name:"Уреазын амьсгалын тест (UBT)",           nameEn:"Urea Breath Test",         category:"microbiology", testGroup:"H.pylori", inputType:"select", options:["Сөрөг","Эерэг"], referenceText:"Сөрөг", turnaroundHours:1 },
  /* Parasitology */
  { code:"PARA",    name:"Ялгадасны шимэгч (паразит)",             nameEn:"Stool Parasitology",       category:"microbiology", testGroup:"Паразитологи", inputType:"select", options:["Олдоогүй","Олдсон"], referenceText:"Олдоогүй", turnaroundHours:4 },
  { code:"HELMIN",  name:"Ялгадасны өтний өндөг",                  nameEn:"Helminth Eggs",            category:"microbiology", testGroup:"Паразитологи", inputType:"select", options:["Олдоогүй","Олдсон"], referenceText:"Олдоогүй", turnaroundHours:2 },
  { code:"GIAR",    name:"Лямблийн шинжилгээ",                     nameEn:"Giardia",                  category:"microbiology", testGroup:"Паразитологи", inputType:"select", options:["Сөрөг","Эерэг"], referenceText:"Сөрөг", turnaroundHours:2 },
];

/* ─── ALL TESTS ──────────────────────────────────────────────────────── */
const ALL_TESTS: TestDef[] = [
  ...hematology,
  ...biochemistry,
  ...coagulogram,
  ...urinalysis,
  ...immunology,
  ...hormones,
  ...rapidTests,
  ...viralLoad,
  ...microbiology,
];

/* ─── Seed runner ────────────────────────────────────────────────────── */
async function run() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ["log", "error", "warn"],
  });
  const logger = new Logger("SeedLab");
  const model = app.get<Model<LabTest>>(getModelToken(LabTest.name));

  let created = 0, skipped = 0, errors = 0;

  for (let i = 0; i < ALL_TESTS.length; i++) {
    const t = ALL_TESTS[i];
    const code = t.code.toUpperCase();
    try {
      const existing = await model.findOne({ code }).lean();
      if (existing) {
        skipped++;
        continue;
      }
      await model.create({
        code,
        name:            t.name,
        nameEn:          t.nameEn,
        category:        t.category,
        testGroup:       t.testGroup,
        unit:            t.unit,
        referenceMin:    t.referenceMin,
        referenceMax:    t.referenceMax,
        referenceText:   t.referenceText,
        inputType:       t.inputType ?? "text",
        options:         t.options ?? [],
        turnaroundHours: t.turnaroundHours,
        sortOrder:       i,
        isActive:        true,
      });
      created++;
    } catch (err) {
      logger.error(`✗ ${code}: ${(err as Error).message}`);
      errors++;
    }
  }

  logger.log(`\n========================================`);
  logger.log(`Лабораторийн шинжилгээний каталог:`);
  logger.log(`  Нийт:       ${ALL_TESTS.length}`);
  logger.log(`  Нэмэгдсэн:  ${created}`);
  logger.log(`  Байсан:     ${skipped}`);
  logger.log(`  Алдаа:      ${errors}`);
  logger.log(`========================================\n`);

  await app.close();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
