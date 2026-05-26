import { Schema } from "mongoose";

export function softDeletePlugin(schema: Schema) {
  schema.add({
    deletedAt: { type: Date, default: null, index: true },
  });

  const excludeDeleted = function (this: any, next: () => void) {
    if (!this.getFilter().includeDeleted && !this.getFilter().deletedAt) {
      this.where({ deletedAt: null });
    }
    next();
  };

  schema.pre("find", excludeDeleted);
  schema.pre("findOne", excludeDeleted);
  schema.pre("countDocuments", excludeDeleted);
  schema.pre("findOneAndUpdate", excludeDeleted);

  schema.method("softDelete", async function () {
    this.deletedAt = new Date();
    return this.save();
  });
}
