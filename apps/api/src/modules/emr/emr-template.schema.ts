import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type EmrTemplateDocument = HydratedDocument<EmrTemplate>;

/** Singleton document – always queried by key = "default" */
@Schema({ timestamps: true, collection: "emr_templates" })
export class EmrTemplate {
  @Prop({ type: String, default: "default", unique: true })
  key!: string;

  /** Full tab/section/field configuration – stored as flexible JSON */
  @Prop({ type: Object, default: () => ({ tabs: [] }) })
  config!: Record<string, any>;
}

export const EmrTemplateSchema = SchemaFactory.createForClass(EmrTemplate);

/* ─── Default 9-section template ──────────────────────────────────── */
export const DEFAULT_TEMPLATE_CONFIG = {
  tabs: [
    {
      id: "tab_detail",
      name: "Дэлгэрэнгүй тэмдэглэл",
      order: 0,
      sections: [
        {
          id: "sec_vitals",
          name: "Амин үзүүлэлт",
          order: 0,
          type: "vitals",
          fields: [],
        },
        {
          id: "sec_general",
          name: "Ерөнхий үзлэг",
          order: 1,
          type: "custom",
          fields: [
            {
              id: "f_general_condition",
              label: "Биеийн ерөнхий байдал",
              type: "select",
              options: ["Хөнгөн", "Дунд", "Хүнд", "Маш хүнд", "Үхлүүт"],
              required: false,
              unit: "",
              placeholder: "",
            },
          ],
        },
        {
          id: "sec_head_eye",
          name: "Толгой, нүдний үзлэг",
          order: 2,
          type: "custom",
          fields: [],
        },
        {
          id: "sec_ent",
          name: "Хамар, хоолой, чихний үзлэг",
          order: 3,
          type: "custom",
          fields: [],
        },
        {
          id: "sec_chest",
          name: "Цээжний үзлэг",
          order: 4,
          type: "custom",
          fields: [],
        },
        {
          id: "sec_abdomen",
          name: "Хэвлийн үзлэг",
          order: 5,
          type: "custom",
          fields: [],
        },
        {
          id: "sec_urogenital",
          name: "Дав, цавь, бэлгийн эрхтний үзлэг",
          order: 6,
          type: "custom",
          fields: [],
        },
        {
          id: "sec_msk",
          name: "Тулгуур эрхтэн, мөчдийн үзлэг",
          order: 7,
          type: "custom",
          fields: [],
        },
        {
          id: "sec_neuro",
          name: "Неврологийн үзлэг",
          order: 8,
          type: "custom",
          fields: [],
        },
      ],
    },
  ],
};
